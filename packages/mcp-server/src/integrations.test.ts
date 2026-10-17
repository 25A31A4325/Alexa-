import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { IntegrationService, IntegrationServiceError } from './integrations.js';

const TEST_SESSION_SECRET = 'oauth-integration-test-secret-value-0123456789';
const TEST_ENCRYPTION_KEY = Buffer.alloc(32, 23).toString('base64');

function response(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(status === 204 ? null : JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...headers }
  });
}

test('OAuth integration service secures state, credentials, provider status, and write approvals', async (t) => {
  const previousEnv = new Map<string, string | undefined>();
  const values: Record<string, string> = {
    SESSION_SECRET: TEST_SESSION_SECRET,
    OAUTH_ENCRYPTION_KEY: TEST_ENCRYPTION_KEY,
    GOOGLE_CLIENT_ID: 'google-client-test',
    GOOGLE_CLIENT_SECRET: 'google-secret-test',
    GOOGLE_REDIRECT_URI: 'http://localhost:3000/oauth/google/callback',
    GITHUB_CLIENT_ID: 'github-client-test',
    GITHUB_CLIENT_SECRET: 'github-secret-test',
    GITHUB_REDIRECT_URI: 'http://localhost:3000/oauth/github/callback',
    GITHUB_ISSUES_WRITE_ENABLED: 'false'
  };
  for (const [name, value] of Object.entries(values)) {
    previousEnv.set(name, process.env[name]);
    process.env[name] = value;
  }
  t.after(() => {
    for (const [name, value] of previousEnv) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  let userStatus = 200;
  let repositoryStatus = 200;
  const fetchMock: typeof fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (url.hostname === 'github.com' && url.pathname === '/login/oauth/access_token') {
      return response({
        access_token: 'github-access-sensitive-test-value',
        refresh_token: null,
        expires_in: 3600,
        scope: ''
      });
    }
    if (url.hostname === 'api.github.com' && url.pathname === '/user' && method === 'GET') {
      return response(userStatus === 200
        ? { id: 9301, login: 'verified-test-user', name: 'Verified Test User' }
        : { message: 'Unauthorized' }, userStatus);
    }
    if (url.hostname === 'api.github.com' && url.pathname === '/user/installations') {
      return response({
        total_count: 1,
        installations: [{ permissions: { contents: 'read', metadata: 'read' } }]
      });
    }
    if (url.hostname === 'api.github.com' && url.pathname === '/user/repos') {
      return response(repositoryStatus === 200
        ? [{
          id: 4,
          full_name: 'verified-test-user/authorized-repo',
          private: true,
          description: null,
          default_branch: 'main',
          html_url: 'https://github.com/verified-test-user/authorized-repo',
          permissions: { pull: true, push: false }
        }]
        : { message: 'API rate limit exceeded' }, repositoryStatus, repositoryStatus === 429
          ? { 'x-ratelimit-remaining': '0' }
          : {});
    }
    if (url.hostname === 'api.github.com' && url.pathname.includes('/applications/github-client-test/grant') && method === 'DELETE') {
      return response({}, 204);
    }
    return response({ message: `Unexpected test request: ${method} ${url.pathname}` }, 500);
  };

  const service = new IntegrationService({
    dbPath: ':memory:',
    sessionSecret: TEST_SESSION_SECRET,
    encryptionKey: TEST_ENCRYPTION_KEY,
    fetch: fetchMock
  });
  t.after(() => service.close());

  await t.test('AES-GCM credential encryption authenticates ciphertext and isolates session signatures', () => {
    const ciphertext = service.encrypt('sensitive-provider-token');
    assert.ok(!ciphertext.includes('sensitive-provider-token'));
    assert.equal(service.decrypt(ciphertext), 'sensitive-provider-token');

    const signature = service.signSessionId('browser-owner-one');
    assert.equal(service.verifySessionId('browser-owner-one', signature), true);
    assert.equal(service.verifySessionId('browser-owner-two', signature), false);
    assert.equal(service.verifySessionId('browser-owner-one', `${signature}x`), false);

    const wrongKeyService = new IntegrationService({
      dbPath: ':memory:',
      sessionSecret: TEST_SESSION_SECRET,
      encryptionKey: randomBytes(32).toString('base64')
    });
    assert.throws(() => wrongKeyService.decrypt(ciphertext), /cannot be decrypted/i);
    wrongKeyService.close();
  });

  await t.test('Google OAuth uses PKCE, minimum selected scopes, browser-bound one-time state, and callback error handling', async () => {
    const authorizationUrl = new URL(await service.beginGoogleAuthorization('browser-owner-one', [
      'gmail-read',
      'google-calendar-read'
    ]));
    assert.equal(authorizationUrl.searchParams.get('code_challenge_method'), 'S256');
    const scopes = authorizationUrl.searchParams.get('scope')!.split(' ');
    assert.ok(scopes.includes('https://www.googleapis.com/auth/gmail.readonly'));
    assert.ok(scopes.includes('https://www.googleapis.com/auth/calendar.events.readonly'));
    assert.ok(!scopes.includes('https://www.googleapis.com/auth/gmail.send'));
    assert.ok(!scopes.includes('https://www.googleapis.com/auth/drive.readonly'));

    const state = authorizationUrl.searchParams.get('state')!;
    await assert.rejects(
      service.completeAuthorization('google', 'browser-owner-two', { state, error: 'access_denied' }),
      (error: unknown) => error instanceof IntegrationServiceError && error.code === 'OAUTH_STATE_INVALID'
    );
    await assert.rejects(
      service.completeAuthorization('google', 'browser-owner-one', { state, error: 'access_denied' }),
      (error: unknown) => error instanceof IntegrationServiceError && error.code === 'AUTHORIZATION_DENIED'
    );
    await assert.rejects(
      service.completeAuthorization('google', 'browser-owner-one', { state, error: 'access_denied' }),
      (error: unknown) => error instanceof IntegrationServiceError && error.code === 'OAUTH_STATE_INVALID'
    );
  });

  await t.test('GitHub account status and repository data are real, encrypted, and isolated by browser session', async () => {
    const authorizeUrl = new URL(service.beginGitHubAuthorization('browser-owner-one'));
    const state = authorizeUrl.searchParams.get('state')!;
    await service.completeAuthorization('github', 'browser-owner-one', { state, code: 'test-code' });

    const ownerStatuses = await service.listStatuses('browser-owner-one');
    const github = ownerStatuses.find((item) => item.id === 'github')!;
    assert.equal(github.status, 'connected');
    assert.equal(github.account, 'verified-test-user');
    assert.deepEqual(github.permissions, ['contents: read', 'metadata: read']);
    assert.ok(github.lastSuccessfulSyncAt);
    assert.ok(!JSON.stringify(github).includes('github-access-sensitive-test-value'));

    const otherStatuses = await service.listStatuses('browser-owner-two');
    const otherGitHub = otherStatuses.find((item) => item.id === 'github')!;
    assert.equal(otherGitHub.status, 'not_connected');
    assert.equal(otherGitHub.account, null);

    const repositories = await service.listGitHubRepositories('browser-owner-one');
    assert.equal(repositories[0]!.fullName, 'verified-test-user/authorized-repo');
    assert.equal(repositories[0]!.private, true);
    await assert.rejects(
      service.listGitHubRepositories('browser-owner-two'),
      (error: unknown) => error instanceof IntegrationServiceError && error.code === 'NOT_CONNECTED'
    );
  });

  await t.test('Provider API errors expose rate limits and revoked account tokens as actionable states', async () => {
    repositoryStatus = 429;
    await assert.rejects(
      service.listGitHubRepositories('browser-owner-one'),
      (error: unknown) => error instanceof IntegrationServiceError && error.code === 'RATE_LIMITED'
    );

    repositoryStatus = 200;
    userStatus = 401;
    const statuses = await service.listStatuses('browser-owner-one');
    assert.equal(statuses.find((item) => item.id === 'github')!.status, 'expired');
    assert.match(statuses.find((item) => item.id === 'github')!.error || '', /expired or was revoked/i);
  });

  await t.test('Disconnect removes local credentials and confirms provider revocation', async () => {
    userStatus = 200;
    const disconnected = await service.disconnect('browser-owner-one', 'github');
    assert.equal(disconnected.localCredentialsDeleted, true);
    assert.equal(disconnected.providerRevoked, true);
    const statuses = await service.listStatuses('browser-owner-one');
    assert.equal(statuses.find((item) => item.id === 'github')!.status, 'not_connected');
  });
});

test('Consequential provider approvals reject altered parameters and replay', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'orchestra-approval-test-'));
  const dbPath = path.join(directory, 'approval.db');
  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE mission_tasks (id TEXT PRIMARY KEY, mission_id TEXT NOT NULL, approval_id TEXT);
    CREATE TABLE approvals (
      id TEXT PRIMARY KEY, mission_id TEXT NOT NULL, task_id TEXT NOT NULL,
      action_type TEXT NOT NULL, parameters_json TEXT NOT NULL,
      canonical_fingerprint TEXT NOT NULL, status TEXT NOT NULL, expires_at INTEGER NOT NULL
    );
  `);
  const params = { body: 'Safe test message', subject: 'Hello', to: 'person@example.com' };
  const canonical = JSON.stringify(Object.fromEntries(Object.keys(params).sort().map((key) => [key, params[key as keyof typeof params]])));
  const fingerprint = createHash('sha256')
    .update(`mission-test:task-test:gmail_send:${canonical}`)
    .digest('hex');
  db.prepare('INSERT INTO mission_tasks (id, mission_id, approval_id) VALUES (?, ?, ?)').run('task-test', 'mission-test', 'approval-test');
  db.prepare(`
    INSERT INTO approvals (id, mission_id, task_id, action_type, parameters_json, canonical_fingerprint, status, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('approval-test', 'mission-test', 'task-test', 'gmail_send', canonical, fingerprint, 'approved', Date.now() + 60_000);
  db.close();

  const service = new IntegrationService({
    dbPath,
    sessionSecret: TEST_SESSION_SECRET,
    encryptionKey: TEST_ENCRYPTION_KEY
  });
  try {
    await service.verifyApprovalAndClaim({
      sessionId: 'browser-owner-one',
      missionId: 'mission-test',
      taskId: 'task-test',
      actionType: 'gmail_send',
      fingerprint,
      parameters: params
    });
    await assert.rejects(
      service.verifyApprovalAndClaim({
        sessionId: 'browser-owner-one',
        missionId: 'mission-test',
        taskId: 'task-test',
        actionType: 'gmail_send',
        fingerprint,
        parameters: params
      }),
      (error: unknown) => error instanceof IntegrationServiceError && error.code === 'APPROVAL_REPLAY'
    );
    await assert.rejects(
      service.verifyApprovalAndClaim({
        sessionId: 'browser-owner-two',
        missionId: 'mission-test',
        taskId: 'task-test',
        actionType: 'gmail_send',
        fingerprint,
        parameters: { ...params, body: 'Changed after approval' }
      }),
      (error: unknown) => error instanceof IntegrationServiceError && error.code === 'APPROVAL_MISMATCH'
    );
  } finally {
    service.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
