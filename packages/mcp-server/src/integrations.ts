import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual
} from 'node:crypto';
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { Octokit } from '@octokit/rest';

export type IntegrationState = 'not_connected' | 'connecting' | 'connected' | 'expired' | 'error';
export type ProviderName = 'google' | 'github';

export interface IntegrationStatus {
  id: string;
  name: string;
  category: string;
  provider: ProviderName;
  status: IntegrationState;
  configured: boolean;
  account: string | null;
  permissions: string[];
  lastSuccessfulSyncAt: string | null;
  error: string | null;
}

interface StoredConnection {
  session_id: string;
  provider: ProviderName;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: number | null;
  granted_scopes: string[];
  identity: Record<string, unknown>;
  status: IntegrationState;
  last_synced_at: string | null;
  error_message: string | null;
}

interface PendingAuthorization {
  session_id: string;
  provider: ProviderName;
  verifier: string | null;
  scopes: string[];
  expires_at: number;
}

interface IntegrationServiceOptions {
  dbPath?: string;
  sessionSecret?: string;
  encryptionKey?: string;
  fetch?: typeof fetch;
}

export class IntegrationServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'IntegrationServiceError';
  }
}

const GOOGLE_BASE_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];
const GOOGLE_FEATURE_SCOPES: Record<string, string[]> = {
  'google-calendar-read': ['https://www.googleapis.com/auth/calendar.events.readonly'],
  'google-calendar-write': ['https://www.googleapis.com/auth/calendar.events'],
  'gmail-read': ['https://www.googleapis.com/auth/gmail.readonly'],
  'gmail-send': ['https://www.googleapis.com/auth/gmail.send'],
  'google-drive-search': ['https://www.googleapis.com/auth/drive.metadata.readonly'],
  'google-drive-content': ['https://www.googleapis.com/auth/drive.readonly']
};

const RESOURCE_CARDS = [
  { id: 'google-calendar', name: 'Google Calendar', category: 'Productivity', provider: 'google' as const },
  { id: 'gmail', name: 'Gmail', category: 'Communication', provider: 'google' as const },
  { id: 'google-drive', name: 'Google Drive', category: 'Knowledge', provider: 'google' as const },
  { id: 'github', name: 'GitHub', category: 'Development', provider: 'github' as const }
];

function parseJsonObject(value: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(value);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new IntegrationServiceError('Stored account data is invalid.', 'STORAGE_ERROR', 500);
  }
  return parsed as Record<string, unknown>;
}

function providerError(error: unknown): IntegrationServiceError {
  const candidate = error as {
    code?: string | number;
    status?: number;
    response?: { status?: number; headers?: Record<string, string> | Headers };
  };
  const status = Number(candidate?.response?.status || candidate?.status || candidate?.code);
  const responseHeaders = candidate?.response?.headers;
  const rateLimitRemaining = responseHeaders instanceof Headers
    ? responseHeaders.get('x-ratelimit-remaining')
    : responseHeaders?.['x-ratelimit-remaining'];
  const retryAfter = responseHeaders instanceof Headers
    ? responseHeaders.get('retry-after')
    : responseHeaders?.['retry-after'];
  if (status === 429 || rateLimitRemaining === '0' || retryAfter) {
    return new IntegrationServiceError('The provider rate limit was reached. Wait briefly and retry.', 'RATE_LIMITED', 429);
  }
  if (status === 401 || status === 403) {
    return new IntegrationServiceError(
      status === 401 ? 'The provider authorization expired or was revoked. Reconnect the account.' : 'The provider denied this permission. Reconnect and grant the requested access.',
      status === 401 ? 'AUTH_EXPIRED' : 'PERMISSION_DENIED',
      status
    );
  }
  if (status === 404) return new IntegrationServiceError('The requested resource was not found or is not accessible to this account.', 'NOT_FOUND', 404);
  if (status >= 500) {
    return new IntegrationServiceError('The provider is temporarily unavailable. Retry shortly.', 'PROVIDER_UNAVAILABLE', 502);
  }
  return new IntegrationServiceError('The provider request failed. Retry, or reconnect if the problem persists.', 'PROVIDER_ERROR', 502);
}

function isHttpsOrLocalhost(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

export class IntegrationService {
  private readonly db: DatabaseSync;
  private readonly fetchImpl: typeof fetch;
  private readonly sessionSecret: string;
  private readonly encryptionKeyValue: string;

  constructor(options: IntegrationServiceOptions = {}) {
    const dbPath = options.dbPath || process.env.ORCHESTRA_DB_PATH || process.env.DB_PATH || ':memory:';
    if (dbPath !== ':memory:') {
      const directory = path.dirname(dbPath);
      if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
    }
    this.db = new DatabaseSync(dbPath);
    this.db.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS provider_connections (
        session_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        encrypted_access_token TEXT NOT NULL,
        encrypted_refresh_token TEXT,
        token_expires_at INTEGER,
        granted_scopes_json TEXT NOT NULL,
        identity_json TEXT NOT NULL,
        status TEXT NOT NULL,
        last_synced_at TEXT,
        error_message TEXT,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (session_id, provider)
      );
      CREATE TABLE IF NOT EXISTS provider_oauth_states (
        state_hash TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        encrypted_verifier TEXT,
        scopes_json TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_provider_oauth_states_expiry
        ON provider_oauth_states(expires_at);
      CREATE TABLE IF NOT EXISTS provider_approval_executions (
        approval_id TEXT PRIMARY KEY,
        executed_at TEXT NOT NULL
      );
    `);
    this.fetchImpl = options.fetch || fetch;
    this.sessionSecret = options.sessionSecret || process.env.SESSION_SECRET || '';
    this.encryptionKeyValue = options.encryptionKey || process.env.OAUTH_ENCRYPTION_KEY || '';
  }

  public close(): void {
    this.db.close();
  }

  public createSessionId(): string {
    this.requireSessionSecret();
    return randomBytes(32).toString('base64url');
  }

  public signSessionId(sessionId: string): string {
    this.requireSessionSecret();
    return createHmac('sha256', this.sessionSecret).update(sessionId).digest('base64url');
  }

  public verifySessionId(sessionId: string, signature: string): boolean {
    if (!sessionId || !signature || !this.sessionSecret) return false;
    const expected = Buffer.from(this.signSessionId(sessionId));
    const provided = Buffer.from(signature);
    return expected.length === provided.length && timingSafeEqual(expected, provided);
  }

  public signMcpContext(sessionId: string, approval?: McpApprovalContext): string {
    this.requireSessionSecret();
    const payload = approval ? Buffer.from(JSON.stringify(approval)).toString('base64url') : '';
    return createHmac('sha256', this.sessionSecret).update(`${sessionId}\n${payload}`).digest('base64url');
  }

  public verifyMcpContext(sessionId: string, approvalPayload: string, signature: string): boolean {
    if (!sessionId || !signature || !this.sessionSecret) return false;
    const expected = Buffer.from(
      createHmac('sha256', this.sessionSecret).update(`${sessionId}\n${approvalPayload}`).digest('base64url')
    );
    const provided = Buffer.from(signature);
    return expected.length === provided.length && timingSafeEqual(expected, provided);
  }

  public encrypt(value: string): string {
    const key = this.getEncryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
  }

  public decrypt(value: string): string {
    const key = this.getEncryptionKey();
    const [ivEncoded, tagEncoded, encryptedEncoded, ...extra] = value.split('.');
    if (!ivEncoded || !tagEncoded || !encryptedEncoded || extra.length > 0) {
      throw new IntegrationServiceError('Encrypted provider credential is corrupt.', 'STORAGE_ERROR', 500);
    }
    try {
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivEncoded, 'base64url'));
      decipher.setAuthTag(Buffer.from(tagEncoded, 'base64url'));
      return Buffer.concat([
        decipher.update(Buffer.from(encryptedEncoded, 'base64url')),
        decipher.final()
      ]).toString('utf8');
    } catch {
      throw new IntegrationServiceError('Provider credentials cannot be decrypted. Check the encryption key.', 'STORAGE_ERROR', 500);
    }
  }

  private requireSessionSecret(): void {
    if (this.sessionSecret.length < 32) {
      throw new IntegrationServiceError('SESSION_SECRET must contain at least 32 characters.', 'OAUTH_NOT_CONFIGURED', 503);
    }
  }

  private getEncryptionKey(): Buffer {
    let key: Buffer;
    try {
      key = Buffer.from(this.encryptionKeyValue, 'base64');
    } catch {
      throw new IntegrationServiceError('OAUTH_ENCRYPTION_KEY must be a base64-encoded 32-byte key.', 'OAUTH_NOT_CONFIGURED', 503);
    }
    if (key.length !== 32) {
      throw new IntegrationServiceError('OAUTH_ENCRYPTION_KEY must be a base64-encoded 32-byte key.', 'OAUTH_NOT_CONFIGURED', 503);
    }
    return key;
  }

  private googleConfig(): { clientId: string; clientSecret: string; redirectUri: string } {
    const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret, GOOGLE_REDIRECT_URI: redirectUri } = process.env;
    if (!clientId || !clientSecret || !redirectUri || !isHttpsOrLocalhost(redirectUri)) {
      throw new IntegrationServiceError('Google OAuth is not configured with a valid HTTPS callback URL.', 'OAUTH_NOT_CONFIGURED', 503);
    }
    this.getEncryptionKey();
    this.requireSessionSecret();
    return { clientId, clientSecret, redirectUri };
  }

  private githubConfig(): { clientId: string; clientSecret: string; redirectUri: string } {
    const { GITHUB_CLIENT_ID: clientId, GITHUB_CLIENT_SECRET: clientSecret, GITHUB_REDIRECT_URI: redirectUri } = process.env;
    if (!clientId || !clientSecret || !redirectUri || !isHttpsOrLocalhost(redirectUri)) {
      throw new IntegrationServiceError('GitHub OAuth is not configured with a valid HTTPS callback URL.', 'OAUTH_NOT_CONFIGURED', 503);
    }
    this.getEncryptionKey();
    this.requireSessionSecret();
    return { clientId, clientSecret, redirectUri };
  }

  public isProviderConfigured(provider: ProviderName): boolean {
    try {
      if (provider === 'google') this.googleConfig();
      else this.githubConfig();
      return true;
    } catch (error) {
      if (error instanceof IntegrationServiceError && error.code === 'OAUTH_NOT_CONFIGURED') return false;
      throw error;
    }
  }

  private storeConnection(connection: StoredConnection): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO provider_connections (
        session_id, provider, encrypted_access_token, encrypted_refresh_token,
        token_expires_at, granted_scopes_json, identity_json, status,
        last_synced_at, error_message, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id, provider) DO UPDATE SET
        encrypted_access_token = excluded.encrypted_access_token,
        encrypted_refresh_token = excluded.encrypted_refresh_token,
        token_expires_at = excluded.token_expires_at,
        granted_scopes_json = excluded.granted_scopes_json,
        identity_json = excluded.identity_json,
        status = excluded.status,
        last_synced_at = excluded.last_synced_at,
        error_message = excluded.error_message,
        updated_at = excluded.updated_at
    `).run(
      connection.session_id,
      connection.provider,
      this.encrypt(connection.access_token),
      connection.refresh_token ? this.encrypt(connection.refresh_token) : null,
      connection.token_expires_at,
      JSON.stringify([...new Set(connection.granted_scopes)]),
      JSON.stringify(connection.identity),
      connection.status,
      connection.last_synced_at,
      connection.error_message,
      now
    );
  }

  private readConnection(sessionId: string, provider: ProviderName): StoredConnection | undefined {
    const row = this.db.prepare(`
      SELECT * FROM provider_connections WHERE session_id = ? AND provider = ?
    `).get(sessionId, provider) as {
      session_id: string;
      provider: ProviderName;
      encrypted_access_token: string;
      encrypted_refresh_token: string | null;
      token_expires_at: number | null;
      granted_scopes_json: string;
      identity_json: string;
      status: IntegrationState;
      last_synced_at: string | null;
      error_message: string | null;
    } | undefined;
    if (!row) return undefined;
    try {
      return {
        session_id: row.session_id,
        provider: row.provider,
        access_token: this.decrypt(row.encrypted_access_token),
        refresh_token: row.encrypted_refresh_token ? this.decrypt(row.encrypted_refresh_token) : null,
        token_expires_at: row.token_expires_at,
        granted_scopes: JSON.parse(row.granted_scopes_json) as string[],
        identity: parseJsonObject(row.identity_json),
        status: row.status,
        last_synced_at: row.last_synced_at,
        error_message: row.error_message
      };
    } catch (error) {
      if (error instanceof IntegrationServiceError) throw error;
      throw new IntegrationServiceError('Stored provider connection data is invalid.', 'STORAGE_ERROR', 500);
    }
  }

  private storePendingState(state: PendingAuthorization): string {
    const rawState = randomBytes(32).toString('base64url');
    this.db.prepare(`
      INSERT INTO provider_oauth_states (state_hash, session_id, provider, encrypted_verifier, scopes_json, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      createHash('sha256').update(rawState).digest('hex'),
      state.session_id,
      state.provider,
      state.verifier ? this.encrypt(state.verifier) : null,
      JSON.stringify(state.scopes),
      state.expires_at
    );
    this.db.prepare('DELETE FROM provider_oauth_states WHERE expires_at <= ?').run(Date.now());
    return rawState;
  }

  private consumePendingState(rawState: string, sessionId: string, provider: ProviderName): PendingAuthorization {
    if (rawState.length < 32 || rawState.length > 256) {
      throw new IntegrationServiceError('OAuth state is missing or invalid. Restart the connection flow.', 'OAUTH_STATE_INVALID', 400);
    }
    const stateHash = createHash('sha256').update(rawState).digest('hex');
    const row = this.db.prepare(`
      SELECT * FROM provider_oauth_states
      WHERE state_hash = ? AND session_id = ? AND provider = ? AND expires_at > ?
    `).get(stateHash, sessionId, provider, Date.now()) as {
      session_id: string;
      provider: ProviderName;
      encrypted_verifier: string | null;
      scopes_json: string;
      expires_at: number;
    } | undefined;
    if (!row) {
      throw new IntegrationServiceError('OAuth state expired or did not match this browser session. Restart the connection flow.', 'OAUTH_STATE_INVALID', 400);
    }
    const result = this.db.prepare(`
      DELETE FROM provider_oauth_states
      WHERE state_hash = ? AND session_id = ? AND provider = ? AND expires_at > ?
    `).run(stateHash, sessionId, provider, Date.now());
    if (Number(result.changes) !== 1) {
      throw new IntegrationServiceError('OAuth state has already been used. Restart the connection flow.', 'OAUTH_STATE_INVALID', 400);
    }
    return {
      session_id: row.session_id,
      provider: row.provider,
      verifier: row.encrypted_verifier ? this.decrypt(row.encrypted_verifier) : null,
      scopes: JSON.parse(row.scopes_json) as string[],
      expires_at: row.expires_at
    };
  }

  public async beginGoogleAuthorization(sessionId: string, features: string[]): Promise<string> {
    const config = this.googleConfig();
    const uniqueFeatures = [...new Set(features)];
    if (uniqueFeatures.length === 0 || uniqueFeatures.some((feature) => !GOOGLE_FEATURE_SCOPES[feature])) {
      throw new IntegrationServiceError('Choose at least one supported Google feature.', 'INVALID_FEATURES', 400);
    }
    const existing = this.readConnection(sessionId, 'google');
    const scopes = [...new Set([
      ...GOOGLE_BASE_SCOPES,
      ...(existing?.granted_scopes || []),
      ...uniqueFeatures.flatMap((feature) => GOOGLE_FEATURE_SCOPES[feature]!)
    ])];
    const client = new OAuth2Client(config.clientId, config.clientSecret, config.redirectUri);
    const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
    const state = this.storePendingState({
      session_id: sessionId,
      provider: 'google',
      verifier: codeVerifier,
      scopes,
      expires_at: Date.now() + 10 * 60 * 1000
    });
    return client.generateAuthUrl({
      access_type: 'offline',
      include_granted_scopes: true,
      prompt: 'select_account consent',
      scope: scopes,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256
    });
  }

  public beginGitHubAuthorization(sessionId: string): string {
    const config = this.githubConfig();
    const state = this.storePendingState({
      session_id: sessionId,
      provider: 'github',
      verifier: null,
      scopes: [],
      expires_at: Date.now() + 10 * 60 * 1000
    });
    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', config.redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('allow_signup', 'false');
    return url.toString();
  }

  public async completeAuthorization(
    provider: ProviderName,
    sessionId: string,
    params: { state?: string; code?: string; error?: string }
  ): Promise<void> {
    const state = this.consumePendingState(params.state || '', sessionId, provider);
    if (params.error) {
      const message = params.error === 'access_denied'
        ? 'Authorization was canceled. No connection was created.'
        : 'The provider could not authorize this connection.';
      throw new IntegrationServiceError(message, 'AUTHORIZATION_DENIED', 400);
    }
    if (!params.code) {
      throw new IntegrationServiceError('The provider callback did not include an authorization code.', 'OAUTH_CALLBACK_INVALID', 400);
    }
    if (provider === 'google') {
      await this.completeGoogleAuthorization(sessionId, params.code, state);
    } else {
      await this.completeGitHubAuthorization(sessionId, params.code);
    }
  }

  private async completeGoogleAuthorization(
    sessionId: string,
    code: string,
    state: PendingAuthorization
  ): Promise<void> {
    const config = this.googleConfig();
    const client = new OAuth2Client(config.clientId, config.clientSecret, config.redirectUri);
    const old = this.readConnection(sessionId, 'google');
    try {
      const { tokens } = await client.getToken({ code, codeVerifier: state.verifier || undefined });
      if (!tokens.access_token) {
        throw new IntegrationServiceError('Google did not issue an access token.', 'TOKEN_EXCHANGE_FAILED', 502);
      }
      client.setCredentials(tokens);
      const { data } = await google.oauth2({ version: 'v2', auth: client }).userinfo.get();
      if (!data.id || !data.email) {
        throw new IntegrationServiceError('Google did not return a verifiable account identity.', 'IDENTITY_CHECK_FAILED', 502);
      }
      if (old?.identity.id && old.identity.id !== data.id) {
        throw new IntegrationServiceError('A different Google account is already connected in this browser session. Disconnect it before switching accounts.', 'ACCOUNT_MISMATCH', 409);
      }
      const granted = tokens.scope ? tokens.scope.split(/\s+/).filter(Boolean) : state.scopes;
      const scopes = [...new Set([...(old?.granted_scopes || []), ...granted])];
      const identity = { id: data.id, email: data.email, name: data.name || data.email };
      this.storeConnection({
        session_id: sessionId,
        provider: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || old?.refresh_token || null,
        token_expires_at: tokens.expiry_date || old?.token_expires_at || null,
        granted_scopes: scopes,
        identity,
        status: 'connected',
        last_synced_at: new Date().toISOString(),
        error_message: null
      });
    } catch (error) {
      if (error instanceof IntegrationServiceError) throw error;
      throw providerError(error);
    }
  }

  private async completeGitHubAuthorization(sessionId: string, code: string): Promise<void> {
    const config = this.githubConfig();
    const response = await this.fetchImpl('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri
      })
    });
    if (!response.ok) throw new IntegrationServiceError('GitHub rejected the authorization code.', 'TOKEN_EXCHANGE_FAILED', 502);
    const tokens = await response.json() as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      refresh_token_expires_in?: number;
      error?: string;
    };
    if (!tokens.access_token || tokens.error) {
      throw new IntegrationServiceError('GitHub did not issue an access token. Check the GitHub App OAuth configuration.', 'TOKEN_EXCHANGE_FAILED', 502);
    }
    try {
      const client = new Octokit({ auth: tokens.access_token, request: { fetch: this.fetchImpl } });
      const { data } = await client.users.getAuthenticated();
      const grantedPermissions = await this.readGitHubPermissions(tokens.access_token);
      const old = this.readConnection(sessionId, 'github');
      if (old?.identity.id && String(old.identity.id) !== String(data.id)) {
        throw new IntegrationServiceError('A different GitHub account is already connected in this browser session. Disconnect it before switching accounts.', 'ACCOUNT_MISMATCH', 409);
      }
      this.storeConnection({
        session_id: sessionId,
        provider: 'github',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expires_at: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null,
        granted_scopes: grantedPermissions,
        identity: { id: data.id, login: data.login, name: data.name || data.login },
        status: 'connected',
        last_synced_at: new Date().toISOString(),
        error_message: null
      });
    } catch (error) {
      if (error instanceof IntegrationServiceError) throw error;
      throw providerError(error);
    }

  }

  private async readGitHubPermissions(accessToken: string): Promise<string[]> {
    const response = await this.fetchImpl('https://api.github.com/user/installations?per_page=100', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer ' + accessToken,
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    if (!response.ok) throw providerError({ status: response.status });
    const data = await response.json() as {
      installations?: Array<{ permissions?: Record<string, string> }>;
    };
    const permissions = new Set<string>();
    for (const installation of data.installations || []) {
      for (const [name, access] of Object.entries(installation.permissions || {})) {
        permissions.add(`${name}: ${access}`);
      }
    }
    return [...permissions].sort();
  }

  private updateStatus(sessionId: string, provider: ProviderName, status: IntegrationState, error: string | null, synced = false): void {
    this.db.prepare(`
      UPDATE provider_connections
      SET status = ?, error_message = ?, last_synced_at = CASE WHEN ? THEN ? ELSE last_synced_at END,
          updated_at = ?
      WHERE session_id = ? AND provider = ?
    `).run(status, error, synced ? 1 : 0, new Date().toISOString(), new Date().toISOString(), sessionId, provider);
  }

  private async healthCheck(sessionId: string, provider: ProviderName): Promise<StoredConnection | undefined> {
    const connection = this.readConnection(sessionId, provider);
    if (!connection) return undefined;
    try {
      if (provider === 'google') {
        const config = this.googleConfig();
        const client = this.googleClient(connection, config);
        const { data } = await google.oauth2({ version: 'v2', auth: client }).userinfo.get();
        if (!data.id || data.id !== connection.identity.id) {
          throw new IntegrationServiceError('The connected Google account changed. Reconnect the intended account.', 'ACCOUNT_MISMATCH', 409);
        }
        await this.persistGoogleCredentials(connection, client);
      } else {
        const client = await this.githubClient(connection);
        const { data } = await client.users.getAuthenticated();
        if (String(data.id) !== String(connection.identity.id)) {
          throw new IntegrationServiceError('The connected GitHub account changed. Reconnect the intended account.', 'ACCOUNT_MISMATCH', 409);
        }
        connection.granted_scopes = await this.readGitHubPermissions(connection.access_token);
        this.storeConnection(connection);
      }
      this.updateStatus(sessionId, provider, 'connected', null, true);
      connection.status = 'connected';
      connection.error_message = null;
      connection.last_synced_at = new Date().toISOString();
      return connection;
    } catch (error) {
      const classified = error instanceof IntegrationServiceError ? error : providerError(error);
      const state: IntegrationState = classified.code === 'AUTH_EXPIRED' ? 'expired' : 'error';
      this.updateStatus(sessionId, provider, state, classified.message);
      connection.status = state;
      connection.error_message = classified.message;
      return connection;
    }
  }

  public async listStatuses(sessionId: string): Promise<IntegrationStatus[]> {
    const googleConnection = await this.healthCheck(sessionId, 'google');
    const githubConnection = await this.healthCheck(sessionId, 'github');
    const pendingProviders = new Set(
      (this.db.prepare(`
        SELECT DISTINCT provider FROM provider_oauth_states WHERE session_id = ? AND expires_at > ?
      `).all(sessionId, Date.now()) as Array<{ provider: ProviderName }>).map((row) => row.provider)
    );
    const available = new Set(googleConnection?.granted_scopes || []);
    const githubConfigured = this.isProviderConfigured('github');
    const googleConfigured = this.isProviderConfigured('google');
    return RESOURCE_CARDS.map((card) => {
      const connection = card.provider === 'google' ? googleConnection : githubConnection;
      const providerConfigured = card.provider === 'google' ? googleConfigured : githubConfigured;
      const requiredScopes = card.id === 'gmail'
        ? GOOGLE_FEATURE_SCOPES['gmail-read']!
        : card.id === 'google-calendar'
          ? GOOGLE_FEATURE_SCOPES['google-calendar-read']!
          : card.id === 'google-drive'
            ? GOOGLE_FEATURE_SCOPES['google-drive-search']!
            : [];
      const hasFeatureAccess = card.provider === 'github'
        ? Boolean(connection)
        : requiredScopes.every((scope) => available.has(scope));
      let status: IntegrationState = connection?.status || 'not_connected';
      let error = connection?.error_message || null;
      if (connection && status === 'connected' && !hasFeatureAccess) {
        status = pendingProviders.has(card.provider) ? 'connecting' : 'not_connected';
        error = pendingProviders.has(card.provider) ? null : 'This feature has not been authorized for this account yet.';
      }
      if (!connection && pendingProviders.has(card.provider)) status = 'connecting';
      return {
        ...card,
        status,
        configured: providerConfigured,
        account: connection ? this.identityLabel(connection) : null,
        permissions: connection?.granted_scopes || [],
        lastSuccessfulSyncAt: connection?.last_synced_at || null,
        error: error || (!providerConfigured ? `Configure ${card.provider === 'google' ? 'Google OAuth' : 'GitHub App'} credentials on the server to enable this connection.` : null)
      };
    });
  }

  private identityLabel(connection: StoredConnection): string | null {
    const candidate = connection.provider === 'google' ? connection.identity.email : connection.identity.login;
    return typeof candidate === 'string' ? candidate : null;
  }

  private getConnection(sessionId: string, provider: ProviderName): StoredConnection {
    const connection = this.readConnection(sessionId, provider);
    if (!connection) throw new IntegrationServiceError(`Connect ${provider === 'google' ? 'a Google account' : 'a GitHub account'} first.`, 'NOT_CONNECTED', 409);
    if (connection.status === 'expired') {
      throw new IntegrationServiceError('Provider authorization expired or was revoked. Reconnect the account.', 'AUTH_EXPIRED', 401);
    }
    return connection;
  }

  private requireScopes(connection: StoredConnection, scopes: string[]): void {
    if (!scopes.every((scope) => connection.granted_scopes.includes(scope))) {
      throw new IntegrationServiceError('This feature is not authorized. Enable its permission in Integrations and reconnect.', 'PERMISSION_DENIED', 403);
    }
  }

  private googleClient(connection: StoredConnection, config = this.googleConfig()): OAuth2Client {
    const client = new OAuth2Client(config.clientId, config.clientSecret, config.redirectUri);
    client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token || undefined,
      expiry_date: connection.token_expires_at || undefined
    });
    return client;
  }

  private async persistGoogleCredentials(connection: StoredConnection, client: OAuth2Client): Promise<void> {
    const tokens = client.credentials;
    if (!tokens.access_token) return;
    this.storeConnection({
      ...connection,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || connection.refresh_token,
      token_expires_at: tokens.expiry_date || connection.token_expires_at,
      status: 'connected',
      error_message: null
    });
  }

  private async githubClient(connection: StoredConnection): Promise<Octokit> {
    if (connection.token_expires_at && connection.token_expires_at <= Date.now()) {
      if (!connection.refresh_token) {
        throw new IntegrationServiceError('GitHub authorization expired. Reconnect the account.', 'AUTH_EXPIRED', 401);
      }
      const config = this.githubConfig();
      const response = await this.fetchImpl('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: connection.refresh_token
        })
      });
      if (!response.ok) throw new IntegrationServiceError('GitHub authorization expired. Reconnect the account.', 'AUTH_EXPIRED', 401);
      const tokens = await response.json() as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
      };
      if (!tokens.access_token) throw new IntegrationServiceError('GitHub authorization expired. Reconnect the account.', 'AUTH_EXPIRED', 401);
      connection.access_token = tokens.access_token;
      connection.refresh_token = tokens.refresh_token || connection.refresh_token;
      connection.token_expires_at = tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null;
      this.storeConnection(connection);
    }
    return new Octokit({ auth: connection.access_token, request: { fetch: this.fetchImpl } });
  }

  private async withGoogle<T>(
    sessionId: string,
    requiredScopes: string[],
    operation: (client: OAuth2Client) => Promise<T>
  ): Promise<T> {
    const connection = this.getConnection(sessionId, 'google');
    this.requireScopes(connection, requiredScopes);
    const client = this.googleClient(connection);
    try {
      const result = await operation(client);
      await this.persistGoogleCredentials(connection, client);
      this.updateStatus(sessionId, 'google', 'connected', null, true);
      return result;
    } catch (error) {
      const classified = error instanceof IntegrationServiceError ? error : providerError(error);
      this.updateStatus(sessionId, 'google', classified.code === 'AUTH_EXPIRED' ? 'expired' : 'error', classified.message);
      throw classified;
    }
  }

  private async withGitHub<T>(sessionId: string, operation: (client: Octokit) => Promise<T>): Promise<T> {
    const connection = this.getConnection(sessionId, 'github');
    try {
      const client = await this.githubClient(connection);
      const result = await operation(client);
      this.updateStatus(sessionId, 'github', 'connected', null, true);
      return result;
    } catch (error) {
      const classified = error instanceof IntegrationServiceError ? error : providerError(error);
      this.updateStatus(sessionId, 'github', classified.code === 'AUTH_EXPIRED' ? 'expired' : 'error', classified.message);
      throw classified;
    }
  }

  public async searchGmail(sessionId: string, query: string, maxResults = 20, pageToken?: string) {
    return this.withGoogle(sessionId, GOOGLE_FEATURE_SCOPES['gmail-read']!, async (auth) => {
      const gmail = google.gmail({ version: 'v1', auth });
      const page = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: Math.max(1, Math.min(maxResults, 100)),
        pageToken
      });
      const ids = (page.data.messages || []).flatMap((message) => message.id ? [message.id] : []);
      const messages = await Promise.all(ids.map(async (id) => {
        const { data } = await gmail.users.messages.get({
          userId: 'me',
          id,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date']
        });
        const headers = Object.fromEntries((data.payload?.headers || [])
          .filter((header) => header.name && header.value)
          .map((header) => [header.name!.toLowerCase(), header.value!]));
        return { id: data.id, threadId: data.threadId, snippet: data.snippet, headers };
      }));
      return { messages, nextPageToken: page.data.nextPageToken || null, resultSizeEstimate: page.data.resultSizeEstimate || 0 };
    });
  }

  public async readGmailMessage(sessionId: string, messageId: string) {
    return this.withGoogle(sessionId, GOOGLE_FEATURE_SCOPES['gmail-read']!, async (auth) => {
      const { data } = await google.gmail({ version: 'v1', auth }).users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });
      const headers = Object.fromEntries((data.payload?.headers || [])
        .filter((header) => header.name && header.value)
        .map((header) => [header.name!.toLowerCase(), header.value!]));
      const extractText = (part: typeof data.payload): string[] => {
        if (!part) return [];
        const ownText = part.mimeType === 'text/plain' && part.body?.data
          ? [Buffer.from(part.body.data, 'base64url').toString('utf8')]
          : [];
        return [...ownText, ...(part.parts || []).flatMap(extractText)];
      };
      return {
        id: data.id,
        threadId: data.threadId,
        headers,
        text: extractText(data.payload).join('\n').slice(0, 100_000)
      };
    });
  }

  public async sendGmail(sessionId: string, input: { to: string; subject: string; body: string }) {
    return this.withGoogle(sessionId, GOOGLE_FEATURE_SCOPES['gmail-send']!, async (auth) => {
      if (!input.to.trim() || !input.subject.trim() || !input.body.trim()) {
        throw new IntegrationServiceError('Recipient, subject, and message body are required.', 'INVALID_INPUT', 400);
      }
      const rawMessage = [
        `To: ${input.to.replace(/[\r\n]/g, '')}`,
        `Subject: ${input.subject.replace(/[\r\n]/g, '')}`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset="UTF-8"',
        '',
        input.body
      ].join('\r\n');
      const raw = Buffer.from(rawMessage, 'utf8').toString('base64url');
      const { data } = await google.gmail({ version: 'v1', auth }).users.messages.send({
        userId: 'me',
        requestBody: { raw }
      });
      return { id: data.id, threadId: data.threadId, sent: true };
    });
  }

  public async listCalendarEvents(sessionId: string, options: { timeMin?: string; timeMax?: string; pageToken?: string; maxResults?: number } = {}) {
    return this.withGoogle(sessionId, GOOGLE_FEATURE_SCOPES['google-calendar-read']!, async (auth) => {
      const { data } = await google.calendar({ version: 'v3', auth }).events.list({
        calendarId: 'primary',
        timeMin: options.timeMin || new Date().toISOString(),
        timeMax: options.timeMax,
        pageToken: options.pageToken,
        maxResults: Math.max(1, Math.min(options.maxResults || 100, 250)),
        singleEvents: true,
        orderBy: 'startTime'
      });
      return { events: data.items || [], nextPageToken: data.nextPageToken || null };
    });
  }

  public async checkCalendarAvailability(sessionId: string, timeMin: string, timeMax: string) {
    return this.withGoogle(sessionId, GOOGLE_FEATURE_SCOPES['google-calendar-read']!, async (auth) => {
      const { data } = await google.calendar({ version: 'v3', auth }).freebusy.query({
        requestBody: { timeMin, timeMax, items: [{ id: 'primary' }] }
      });
      return data.calendars?.primary?.busy || [];
    });
  }

  public async createCalendarEvent(sessionId: string, input: { summary: string; start: string; end: string; description?: string; attendees?: string[] }) {
    return this.withGoogle(sessionId, GOOGLE_FEATURE_SCOPES['google-calendar-write']!, async (auth) => {
      const { data } = await google.calendar({ version: 'v3', auth }).events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: input.summary,
          start: { dateTime: input.start },
          end: { dateTime: input.end },
          description: input.description,
          attendees: input.attendees?.map((email) => ({ email }))
        }
      });
      return { id: data.id, htmlLink: data.htmlLink, summary: data.summary };
    });
  }

  public async updateCalendarEvent(sessionId: string, eventId: string, patch: { summary?: string; start?: string; end?: string; description?: string }) {
    return this.withGoogle(sessionId, GOOGLE_FEATURE_SCOPES['google-calendar-write']!, async (auth) => {
      const calendar = google.calendar({ version: 'v3', auth });
      const { data: existing } = await calendar.events.get({ calendarId: 'primary', eventId });
      const { data } = await calendar.events.update({
        calendarId: 'primary',
        eventId,
        requestBody: {
          ...existing,
          summary: patch.summary ?? existing.summary,
          description: patch.description ?? existing.description,
          start: patch.start ? { dateTime: patch.start } : existing.start,
          end: patch.end ? { dateTime: patch.end } : existing.end
        }
      });
      return { id: data.id, htmlLink: data.htmlLink, summary: data.summary };
    });
  }

  public async searchDrive(sessionId: string, query: string, pageToken?: string, pageSize = 50) {
    return this.withGoogle(sessionId, GOOGLE_FEATURE_SCOPES['google-drive-search']!, async (auth) => {
      const escapedQuery = query.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const { data } = await google.drive({ version: 'v3', auth }).files.list({
        q: `trashed = false and name contains '${escapedQuery}'`,
        pageToken,
        pageSize: Math.max(1, Math.min(pageSize, 100)),
        fields: 'nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink,size,owners(displayName,emailAddress))',
        orderBy: 'modifiedTime desc'
      });
      return { files: data.files || [], nextPageToken: data.nextPageToken || null };
    });
  }

  public async readDriveFile(sessionId: string, fileId: string) {
    return this.withGoogle(sessionId, GOOGLE_FEATURE_SCOPES['google-drive-content']!, async (auth) => {
      const drive = google.drive({ version: 'v3', auth });
      const { data: metadata } = await drive.files.get({ fileId, fields: 'id,name,mimeType,size' });
      if (Number(metadata.size || 0) > 1_000_000) {
        throw new IntegrationServiceError('This file exceeds the 1 MB content retrieval limit.', 'FILE_TOO_LARGE', 413);
      }
      if (metadata.mimeType === 'application/vnd.google-apps.document') {
        const { data } = await drive.files.export({ fileId, mimeType: 'text/plain' }, { responseType: 'arraybuffer' });
        return { id: metadata.id, name: metadata.name, mimeType: 'text/plain', content: Buffer.from(data as ArrayBuffer).toString('utf8') };
      }
      if (metadata.mimeType === 'text/plain' || metadata.mimeType === 'text/markdown') {
        const { data } = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
        return { id: metadata.id, name: metadata.name, mimeType: metadata.mimeType, content: Buffer.from(data as ArrayBuffer).toString('utf8') };
      }
      throw new IntegrationServiceError('Only Google Docs, plain text, and Markdown files are supported for content retrieval.', 'UNSUPPORTED_FILE_TYPE', 415);
    });
  }

  public async listGitHubRepositories(sessionId: string, page = 1, perPage = 50) {
    return this.withGitHub(sessionId, async (client) => {
      const { data } = await client.repos.listForAuthenticatedUser({
        page: Math.max(1, page),
        per_page: Math.max(1, Math.min(perPage, 100)),
        sort: 'updated',
        affiliation: 'owner,collaborator,organization_member'
      });
      return data.map((repo) => ({
        id: repo.id,
        fullName: repo.full_name,
        private: repo.private,
        description: repo.description,
        defaultBranch: repo.default_branch,
        htmlUrl: repo.html_url,
        permissions: repo.permissions
      }));
    });
  }

  public async searchGitHubRepositories(sessionId: string, query: string, page = 1, perPage = 50) {
    return this.withGitHub(sessionId, async (client) => {
      const { data } = await client.search.repos({
        q: query,
        page: Math.max(1, page),
        per_page: Math.max(1, Math.min(perPage, 100))
      });
      return {
        totalCount: data.total_count,
        items: data.items.map((repo) => ({
          id: repo.id,
          fullName: repo.full_name,
          private: repo.private,
          description: repo.description,
          defaultBranch: repo.default_branch,
          htmlUrl: repo.html_url
        }))
      };
    });
  }

  public async searchGitHubCode(sessionId: string, query: string, page = 1, perPage = 50) {
    return this.withGitHub(sessionId, async (client) => {
      const { data } = await client.search.code({
        q: query,
        page: Math.max(1, page),
        per_page: Math.max(1, Math.min(perPage, 100))
      });
      return {
        totalCount: data.total_count,
        items: data.items.map((item) => ({
          repository: item.repository.full_name,
          path: item.path,
          sha: item.sha,
          htmlUrl: item.html_url
        }))
      };
    });
  }

  public async readGitHubFile(sessionId: string, owner: string, repo: string, filePath: string, ref?: string) {
    return this.withGitHub(sessionId, async (client) => {
      const { data } = await client.repos.getContent({ owner, repo, path: filePath, ref });
      if (Array.isArray(data) || data.type !== 'file' || !('content' in data)) {
        throw new IntegrationServiceError('The requested repository path is not a readable file.', 'INVALID_FILE', 404);
      }
      if (data.size > 1_000_000) {
        throw new IntegrationServiceError('This file exceeds the 1 MB content retrieval limit.', 'FILE_TOO_LARGE', 413);
      }
      return {
        path: data.path,
        sha: data.sha,
        size: data.size,
        encoding: data.encoding,
        content: data.encoding === 'base64' ? Buffer.from(data.content, 'base64').toString('utf8') : data.content
      };
    });
  }

  public async createGitHubIssue(sessionId: string, input: { owner: string; repo: string; title: string; body?: string }) {
    if (process.env.GITHUB_ISSUES_WRITE_ENABLED !== 'true') {
      throw new IntegrationServiceError('GitHub issue creation is disabled by the deployment owner.', 'WRITE_DISABLED', 403);
    }
    return this.withGitHub(sessionId, async (client) => {
      const { data } = await client.issues.create({
        owner: input.owner,
        repo: input.repo,
        title: input.title,
        body: input.body
      });
      return { number: data.number, title: data.title, htmlUrl: data.html_url };
    });
  }

  public async disconnect(sessionId: string, provider: ProviderName): Promise<{ localCredentialsDeleted: true; providerRevoked: boolean }> {
    const connection = this.readConnection(sessionId, provider);
    if (!connection) return { localCredentialsDeleted: true, providerRevoked: true };
    let providerRevoked = false;
    try {
      if (provider === 'google') {
        const client = new OAuth2Client();
        await client.revokeToken(connection.refresh_token || connection.access_token);
      } else {
        const config = this.githubConfig();
        const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
        const response = await this.fetchImpl(`https://api.github.com/applications/${encodeURIComponent(config.clientId)}/grant`, {
          method: 'DELETE',
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Basic ${credentials}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ access_token: connection.access_token })
        });
        providerRevoked = response.ok || response.status === 404;
      }
    } catch {
      providerRevoked = false;
    } finally {
      this.db.prepare('DELETE FROM provider_connections WHERE session_id = ? AND provider = ?').run(sessionId, provider);
      this.db.prepare('DELETE FROM provider_oauth_states WHERE session_id = ? AND provider = ?').run(sessionId, provider);
    }
    return { localCredentialsDeleted: true, providerRevoked };
  }

  public async verifyApprovalAndClaim(input: {
    sessionId: string;
    missionId: string;
    taskId: string;
    actionType: string;
    fingerprint: string;
    parameters: Record<string, unknown>;
  }): Promise<void> {
    if (!input.sessionId) {
      throw new IntegrationServiceError('Write action blocked: authenticated browser identity is required.', 'AUTH_REQUIRED', 401);
    }
    const approvalsTable = this.db.prepare(`
      SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'approvals'
    `).get();
    const tasksTable = this.db.prepare(`
      SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'mission_tasks'
    `).get();
    if (!approvalsTable || !tasksTable) {
      throw new IntegrationServiceError('Write action blocked: the mission approval store is unavailable.', 'APPROVAL_REQUIRED', 403);
    }
    const task = this.db.prepare(`
      SELECT t.mission_id, t.approval_id, a.status, a.action_type, a.parameters_json,
             a.canonical_fingerprint, a.expires_at
      FROM mission_tasks t
      LEFT JOIN approvals a ON a.id = t.approval_id
      WHERE t.id = ?
    `).get(input.taskId) as {
      mission_id: string;
      approval_id: string | null;
      status: string | null;
      action_type: string | null;
      parameters_json: string | null;
      canonical_fingerprint: string | null;
      expires_at: number | null;
    } | undefined;
    if (!task || task.mission_id !== input.missionId || task.status !== 'approved' ||
        task.action_type !== input.actionType || !task.approval_id ||
        task.expires_at === null || task.expires_at <= Date.now() ||
        task.canonical_fingerprint !== input.fingerprint) {
      throw new IntegrationServiceError('Write action blocked: valid, unexpired mission approval is required.', 'APPROVAL_REQUIRED', 403);
    }
    const canonical = JSON.stringify(Object.fromEntries(Object.keys(input.parameters).sort().map((key) => [key, input.parameters[key]])));
    const fingerprint = createHash('sha256')
      .update(`${input.missionId}:${input.taskId}:${input.actionType}:${canonical}`)
      .digest('hex');
    if (canonical !== task.parameters_json || fingerprint !== input.fingerprint) {
      throw new IntegrationServiceError('Write action blocked: approved parameters do not match this request.', 'APPROVAL_MISMATCH', 403);
    }
    const approvalFingerprint = createHash('sha256')
      .update(`${input.missionId}:${input.taskId}:${input.actionType}:${task.parameters_json}`)
      .digest('hex');
    if (approvalFingerprint !== task.canonical_fingerprint) {
      throw new IntegrationServiceError('Write action blocked: approval fingerprint is invalid.', 'APPROVAL_MISMATCH', 403);
    }
    try {
      this.db.prepare('INSERT INTO provider_approval_executions (approval_id, executed_at) VALUES (?, ?)').run(
        task.approval_id,
        new Date().toISOString()
      );
    } catch {
      throw new IntegrationServiceError('Write action blocked: this approval has already been used.', 'APPROVAL_REPLAY', 409);
    }
  }
}

export interface McpApprovalContext {
  missionId: string;
  taskId: string;
  actionType: string;
  fingerprint: string;
  parameters: Record<string, unknown>;
}
