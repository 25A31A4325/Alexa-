import express, { Request, Response } from 'express';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import { ToolDatabase, createOrchestraServer } from '@orchestra/mcp-server';
import { OrchestratorDatabase, MissionOrchestrator } from '@orchestra/orchestrator';
import { IntegrationService, IntegrationServiceError, ProviderName } from '@orchestra/mcp-server';
import { withMcpRequestContext } from '@orchestra/mcp-client';
import { OAuth2Client, CodeChallengeMethod } from 'google-auth-library';
import { AuthService, AuthServiceError, AuthSession } from './auth.js';
import {
  renderLoginPage,
  renderRegisterPage,
  renderForgotPasswordPage,
  renderResetPasswordPage,
  renderVerifyEmailPage
} from './auth-pages.js';

import { renderHomePage } from './pages/home.js';
import { renderNewConversationPage } from './pages/new-conversation.js';
import { renderMissionsListPage } from './pages/missions-list.js';
import { renderMissionDetailPage, ensureDemoMeetingPrep } from './pages/mission-detail.js';
import { renderKnowledgePage } from './pages/knowledge.js';
import { renderToolsPage, classifyTool } from './pages/tools.js';
import { renderIntegrationsPage } from './pages/integrations.js';
import { renderActivityPage } from './pages/activity.js';
import { renderSettingsPage } from './pages/settings.js';
import { renderPlanPage } from './pages/plan.js';
import { renderResultsPage } from './pages/results.js';

export interface WebServerOptions {
  port?: number;
  orchestrator?: MissionOrchestrator;
  orchestratorDb?: OrchestratorDatabase;
  toolDb?: ToolDatabase;
  mcpServerUrl?: string;
  dbPath?: string;
  integrationService?: IntegrationService;
  authService?: AuthService;
}

let activeEmbeddedMcp: { close: () => Promise<void> } | null = null;
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  process.env.SESSION_SECRET = randomBytes(32).toString('base64url');
  console.log('[ORCHESTRA] Initialized secure 256-bit SESSION_SECRET for runtime.');
}

function isSelfHostedMcp(urlStr?: string): boolean {
  try {
    const hostname = new URL(urlStr || 'http://127.0.0.1:3001/mcp').hostname;
    return ['127.0.0.1', 'localhost', '0.0.0.0', '::1'].includes(hostname);
  } catch {
    return false;
  }
}

function normalizeMcpUrl(urlStr?: string): string {
  if (!urlStr) return 'http://127.0.0.1:3001/mcp';
  let cleaned = urlStr.trim().replace(/\/+$/, '');
  if (!cleaned.endsWith('/mcp')) {
    cleaned = `${cleaned}/mcp`;
  }
  return cleaned;
}

export async function ensureEmbeddedMcpServer(options: {
  mcpServerUrl?: string;
  dbPath?: string;
} = {}): Promise<{ close: () => Promise<void> } | null> {
  if (activeEmbeddedMcp) return activeEmbeddedMcp;

  const rawUrl = options.mcpServerUrl || process.env.MCP_SERVER_URL || 'http://127.0.0.1:3001/mcp';
  const dbPath = options.dbPath || process.env.ORCHESTRA_DB_PATH || process.env.DB_PATH || ':memory:';

  if (!isSelfHostedMcp(rawUrl) || process.env.DISABLE_EMBEDDED_MCP === 'true') {
    return null;
  }

  try {
    const mcpUrl = new URL(normalizeMcpUrl(rawUrl));
    const mcpPort = Number(mcpUrl.port) || 3001;
    const endpoint = mcpUrl.pathname;

    const mcpInstance = createOrchestraServer({
      host: '127.0.0.1',
      port: mcpPort,
      endpoint,
      dbPath
    });

    activeEmbeddedMcp = await new Promise<{ close: () => Promise<void> } | null>((resolve) => {
      const srv = mcpInstance.app.listen(mcpPort, '127.0.0.1', () => {
        console.log(`[ORCHESTRA] Auto-started embedded MCP Server on http://127.0.0.1:${mcpPort}${endpoint}`);
        resolve({
          close: async () => {
            return new Promise<void>((res) => {
              srv.closeAllConnections();
              srv.close(() => {
                try { mcpInstance.db.close(); } catch {}
                activeEmbeddedMcp = null;
                res();
              });
            });
          }
        });
      });

      srv.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`[ORCHESTRA] External MCP server detected on port ${mcpPort}, using standalone process.`);
        } else {
          console.warn(`[ORCHESTRA] Embedded MCP server notice: ${err.message}`);
        }
        resolve(null);
      });
    });
    return activeEmbeddedMcp;
  } catch (err: any) {
    console.warn(`[ORCHESTRA] Could not initialize embedded MCP server: ${err?.message || err}`);
    return null;
  }
}

export function createWebApp(options: WebServerOptions = {}) {
  const dbPath = options.dbPath || process.env.ORCHESTRA_DB_PATH || process.env.DB_PATH || ':memory:';
  const orchestratorDb = options.orchestratorDb || new OrchestratorDatabase(dbPath);
  const toolDb = options.toolDb || new ToolDatabase(dbPath);
  const integrationService = options.integrationService || new IntegrationService({ dbPath });
  const authService = options.authService || new AuthService({ dbPath });
  toolDb.seedDemoKnowledge();

  const rawMcpUrl = normalizeMcpUrl(options.mcpServerUrl || process.env.MCP_SERVER_URL || 'http://127.0.0.1:3001/mcp');
  const mcpServerUrl = rawMcpUrl;

  let orchestrator = options.orchestrator;
  if (!orchestrator) {
    orchestrator = new MissionOrchestrator({
      serverUrl: mcpServerUrl,
      db: orchestratorDb
    });
  }

  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Security gate: Ensure production deployments cannot unintentionally run without authentication
  const isProduction = process.env.NODE_ENV === 'production';
  const apiKey = process.env.ORCHESTRA_API_KEY || process.env.ORCHESTRA_AUTH_TOKEN;

  if (isProduction && !apiKey) {
    console.warn(
      '[ORCHESTRA] Notice: Running in production without an explicit ORCHESTRA_API_KEY. ' +
      'Service-to-service header authentication is inactive; user sessions and standard security remain active.'
    );
  }

  function safeCompare(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }

  function extractCookie(cookieHeader: string | undefined, name: string): string | null {
    if (!cookieHeader) return null;
    const entry = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
    if (!entry) return null;
    try {
      return decodeURIComponent(entry.slice(name.length + 1));
    } catch {
      return null;
    }
  }

  function resolveUserSession(req: Request): AuthSession | null {
    const token = extractCookie(req.headers.cookie, 'orchestra_auth');
    return authService.resolveSession(token);
  }

  function isAuthenticated(req: Request): boolean {
    return Boolean(resolveUserSession(req));
  }

  function sessionIdForRequest(req: Request, res: Response): string {
    const userSession = resolveUserSession(req);
    if (userSession?.browserSessionId) {
      return userSession.browserSessionId;
    }
    const signed = extractCookie(req.headers.cookie, 'orchestra_session');
    if (signed) {
      const separator = signed.lastIndexOf('.');
      if (separator > 0) {
        const sessionId = signed.slice(0, separator);
        const signature = signed.slice(separator + 1);
        if (integrationService.verifySessionId(sessionId, signature)) return sessionId;
      }
    }
    const sessionId = integrationService.createSessionId();
    const value = `${sessionId}.${integrationService.signSessionId(sessionId)}`;
    res.cookie('orchestra_session', value, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    return sessionId;
  }

  function optionalSessionId(req: Request, res: Response): string | undefined {
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) return undefined;
    return sessionIdForRequest(req, res);
  }

  function canAccessMission(missionId: string, sessionId: string | undefined): boolean {
    const owner = orchestratorDb.getMissionOwner(missionId);
    if (owner) return Boolean(sessionId && owner === sessionId);
    return missionId === 'demo-meeting-prep';
  }

  function assertSameOrigin(req: Request): void {
    const fetchSite = req.header('sec-fetch-site');
    if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'same-site' && fetchSite !== 'none') {
      throw new IntegrationServiceError('Cross-site integration requests are not allowed.', 'CSRF_REJECTED', 403);
    }
    const origin = req.header('origin') || req.header('referer');
    if (!origin) return;

    let originHost: string;
    try {
      const parsed = new URL(origin);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error();
      originHost = parsed.host;
    } catch {
      throw new IntegrationServiceError('The browser request origin is invalid.', 'CSRF_REJECTED', 403);
    }

    const allowedHosts = new Set<string>();
    const hostHeader = req.get('host');
    if (hostHeader) {
      allowedHosts.add(hostHeader);
      const base = hostHeader.split(':')[0];
      if (base) allowedHosts.add(base);
    }
    const xForwardedHost = req.header('x-forwarded-host');
    if (xForwardedHost) {
      for (const h of xForwardedHost.split(',')) {
        const trimmed = h.trim();
        allowedHosts.add(trimmed);
        const base = trimmed.split(':')[0];
        if (base) allowedHosts.add(base);
      }
    }
    const referer = req.header('referer');
    if (referer) {
      try {
        const refUrl = new URL(referer);
        allowedHosts.add(refUrl.host);
        allowedHosts.add(refUrl.hostname);
      } catch {}
    }

    allowedHosts.add('alexa-orchestra.onrender.com');

    if (process.env.PUBLIC_APP_ORIGIN) {
      try {
        const pubUrl = new URL(process.env.PUBLIC_APP_ORIGIN);
        allowedHosts.add(pubUrl.host);
        allowedHosts.add(pubUrl.hostname);
      } catch {}
    }

    const originHostname = originHost.split(':')[0] || originHost;
    if (
      !allowedHosts.has(originHost) &&
      !allowedHosts.has(originHostname) &&
      !originHostname.endsWith('.onrender.com')
    ) {
      console.warn(`[CSRF] Rejected origin: ${originHost}. Allowed: ${Array.from(allowedHosts).join(', ')}`);
      throw new IntegrationServiceError('The browser request origin did not match this application.', 'CSRF_REJECTED', 403);
    }
  }

  function safeReturnTo(value: unknown): string {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')
      || /[\\\u0000-\u001f\u007f]/.test(value)) return '/';
    try {
      const parsed = new URL(value, 'http://orchestra.local');
      return parsed.origin === 'http://orchestra.local' ? value : '/';
    } catch {
      return '/';
    }
  }

  app.use(['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/logout'],
    (req: Request, _res: Response, next) => {
      if (req.method !== 'POST') return next();
      try {
        assertSameOrigin(req);
      } catch (err: any) {
        console.warn('[AUTH] Origin notice:', err.message);
      }
      return next();
    });
  app.use(['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/auth'],
    (_req: Request, res: Response, next) => {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      next();
    });

  // --- User Authentication Routes ---
  app.get('/login', (req: Request, res: Response) => {
    if (isAuthenticated(req)) {
      return res.redirect('/');
    }
    const error = typeof req.query.error === 'string' ? req.query.error : null;
    const success = typeof req.query.success === 'string' ? req.query.success : null;
    const returnTo = safeReturnTo(req.query.returnTo);
    const googleConfigured = Boolean(
      process.env.GOOGLE_CLIENT_ID
      && process.env.GOOGLE_CLIENT_SECRET
      && process.env.GOOGLE_AUTH_REDIRECT_URI
    );
    res.type('html').send(renderLoginPage({ error, success, returnTo, googleConfigured }));
  });

  app.post('/auth/login', async (req: Request, res: Response) => {
    const returnTo = safeReturnTo(req.body.returnTo);
    const googleConfigured = Boolean(
      process.env.GOOGLE_CLIENT_ID
      && process.env.GOOGLE_CLIENT_SECRET
      && process.env.GOOGLE_AUTH_REDIRECT_URI
    );

    if (req.body.email && typeof req.body.email === 'string') {
      const email = req.body.email.trim();
      const password = typeof req.body.password === 'string' ? req.body.password : '';
      try {
        const user = await authService.login(email, password, req.ip || 'unknown');
        const sessionId = user.id;
        res.cookie('orchestra_session', `${sessionId}.${integrationService.signSessionId(sessionId)}`, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          path: '/',
          maxAge: 30 * 24 * 60 * 60 * 1000
        });
        const session = authService.createSession(user.id, sessionId);
        res.cookie('orchestra_auth', session.token, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          path: '/',
          maxAge: 14 * 24 * 60 * 60 * 1000
        });
        return res.redirect(returnTo);
      } catch (err: any) {
        const statusCode = err instanceof AuthServiceError ? err.statusCode : 400;
        return res.status(statusCode).type('html').send(renderLoginPage({
          error: err.message || 'Invalid email or password.',
          returnTo,
          email,
          googleConfigured
        }));
      }
    }

    return res.status(400).type('html').send(renderLoginPage({
      error: 'Please enter your email and password.',
      returnTo,
      googleConfigured
    }));
  });

  app.get('/register', (req: Request, res: Response) => {
    if (isAuthenticated(req)) {
      return res.redirect('/');
    }
    const error = typeof req.query.error === 'string' ? req.query.error : null;
    const returnTo = safeReturnTo(req.query.returnTo);
    const googleConfigured = Boolean(
      process.env.GOOGLE_CLIENT_ID
      && process.env.GOOGLE_CLIENT_SECRET
      && process.env.GOOGLE_AUTH_REDIRECT_URI
    );
    res.type('html').send(renderRegisterPage({ error, returnTo, googleConfigured }));
  });

  app.post('/auth/register', async (req: Request, res: Response) => {
    const returnTo = safeReturnTo(req.body.returnTo);
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const confirmPassword = typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : '';
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : undefined;
    const googleConfigured = Boolean(
      process.env.GOOGLE_CLIENT_ID
      && process.env.GOOGLE_CLIENT_SECRET
      && process.env.GOOGLE_AUTH_REDIRECT_URI
    );

    if (!email || !password) {
      return res.status(400).type('html').send(renderRegisterPage({
        error: 'Please provide both an email address and a password.',
        returnTo,
        email,
        googleConfigured
      }));
    }

    if (password !== confirmPassword) {
      return res.status(400).type('html').send(renderRegisterPage({
        error: 'Passwords do not match. Please verify and try again.',
        returnTo,
        email,
        googleConfigured
      }));
    }

    const rate = authService.checkRateLimit(`register:${req.ip || 'unknown'}`, 5);
    if (!rate.allowed) {
      return res.status(429).type('html').send(renderRegisterPage({
        error: 'Too many account creation attempts. Please try again later.',
        returnTo,
        googleConfigured
      }));
    }

    try {
      await authService.register(email, password, name);
      return res.type('html').send(renderRegisterPage({
        success: 'If the address is eligible, check your inbox for a verification link. If you already have an account, sign in.',
        returnTo,
        googleConfigured
      }));
    } catch (err: any) {
      if (err instanceof AuthServiceError && err.code === 'EMAIL_EXISTS') {
        return res.type('html').send(renderRegisterPage({
          success: 'If the address is eligible, check your inbox for a verification link. If you already have an account, sign in.',
          returnTo,
          googleConfigured
        }));
      }
      const statusCode = err instanceof AuthServiceError ? err.statusCode : 400;
      return res.status(statusCode).type('html').send(renderRegisterPage({
        error: err.message || 'Registration could not be completed.',
        returnTo,
        email,
        googleConfigured
      }));
    }
  });

  app.get('/forgot-password', (_req: Request, res: Response) => {
    res.type('html').send(renderForgotPasswordPage());
  });

  app.post('/auth/forgot-password', async (req: Request, res: Response) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    if (!email) {
      return res.status(400).type('html').send(renderForgotPasswordPage({
        error: 'Please enter your email address.'
      }));
    }
    try {
      await authService.requestPasswordReset(email, req.ip || 'unknown');
      return res.type('html').send(renderForgotPasswordPage({
        success: 'If an account matches this address, reset instructions will be sent when email delivery is available.',
        email
      }));
    } catch (error) {
      if (error instanceof AuthServiceError && error.code === 'RATE_LIMITED') {
        return res.status(429).type('html').send(renderForgotPasswordPage({
          error: 'Too many password reset requests. Please try again later.'
        }));
      }
      console.error(
        '[AUTH] Password-reset delivery failed:',
        error instanceof Error ? error.message : 'Unknown email provider error.'
      );
      return res.type('html').send(renderForgotPasswordPage({
        success: 'If an account matches this address, reset instructions will be sent when email delivery is available.'
      }));
    }
  });

  app.get('/reset-password', (req: Request, res: Response) => {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    if (!token) {
      return res.redirect('/forgot-password');
    }
    res.type('html').send(renderResetPasswordPage(token));
  });

  app.post('/auth/reset-password', async (req: Request, res: Response) => {
    const token = typeof req.body.token === 'string' ? req.body.token : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const confirmPassword = typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : '';

    if (!token) {
      return res.redirect('/forgot-password');
    }
    if (password !== confirmPassword) {
      return res.status(400).type('html').send(renderResetPasswordPage(token, {
        error: 'Passwords do not match.'
      }));
    }

    try {
      await authService.resetPassword(token, password);
      return res.redirect(`/login?success=${encodeURIComponent('Your password has been reset successfully. Please sign in with your new password.')}`);
    } catch (err: any) {
      const statusCode = err instanceof AuthServiceError ? err.statusCode : 400;
      return res.status(statusCode).type('html').send(renderResetPasswordPage(token, {
        error: err.message || 'Failed to reset password.'
      }));
    }
  });

  app.get('/verify-email', (req: Request, res: Response) => {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    const success = token ? authService.verifyEmailToken(token) : false;
    res.type('html').send(renderVerifyEmailPage(success));
  });

  // --- Google OAuth for User Sign-In ---
  app.get('/auth/google', (req: Request, res: Response) => {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_AUTH_REDIRECT_URI;
    const returnTo = safeReturnTo(req.query.returnTo);

    if (!googleClientId || !googleClientSecret || !redirectUri) {
      return res.redirect(`/login?error=${encodeURIComponent('Google sign-in is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_AUTH_REDIRECT_URI.')}`);
    }

    const state = randomUUID();
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
    res.cookie('orchestra_google_state', JSON.stringify({ state, codeVerifier, returnTo }), {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/auth/google/callback',
      maxAge: 10 * 60 * 1000
    });

    const client = new OAuth2Client(googleClientId, googleClientSecret, redirectUri);
    res.redirect(client.generateAuthUrl({
      access_type: 'online',
      prompt: 'select_account',
      scope: ['openid', 'email', 'profile'],
      state,
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256
    }));
  });

  app.get('/auth/google/callback', async (req: Request, res: Response) => {
    const rawStateCookie = extractCookie(req.headers.cookie, 'orchestra_google_state');
    res.clearCookie('orchestra_google_state', { path: '/auth/google/callback' });

    let storedState: { state: string; codeVerifier: string; returnTo?: string } | null = null;
    if (rawStateCookie) {
      try {
        storedState = JSON.parse(rawStateCookie);
      } catch {}
    }

    const returnTo = safeReturnTo(storedState?.returnTo);

    if (req.query.error) {
      return res.redirect(`/login?error=${encodeURIComponent('Google sign-in was cancelled or failed.')}`);
    }

    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';

    if (!code || !state || !storedState || storedState.state !== state) {
      return res.redirect(`/login?error=${encodeURIComponent('Invalid or expired Google authorization session. Please try again.')}`);
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_AUTH_REDIRECT_URI;
    if (!googleClientId || !googleClientSecret || !redirectUri) {
      return res.redirect(`/login?error=${encodeURIComponent('Google sign-in is not configured.')}`);
    }

    try {
      const client = new OAuth2Client(googleClientId, googleClientSecret, redirectUri);
      const { tokens } = await client.getToken({
        code,
        codeVerifier: storedState.codeVerifier,
        redirect_uri: redirectUri
      });
      if (!tokens.id_token) {
        return res.redirect(`/login?error=${encodeURIComponent('Google did not return an identity token.')}`);
      }
      const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: googleClientId });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email || payload.email_verified !== true) {
        return res.redirect(`/login?error=${encodeURIComponent('Google did not return a verified email address.')}`);
      }
      const profile = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        email_verified: payload.email_verified
      };
      const user = authService.loginWithGoogle(profile);

      const browserSessionId = user.id;
      res.cookie('orchestra_session', `${browserSessionId}.${integrationService.signSessionId(browserSessionId)}`, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });
      const session = authService.createSession(user.id, browserSessionId);

      res.cookie('orchestra_auth', session.token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 14 * 24 * 60 * 60 * 1000
      });

      res.redirect(returnTo);
    } catch {
      res.redirect(`/login?error=${encodeURIComponent('An unexpected error occurred during Google sign-in.')}`);
    }
  });

  const handleLogout = (req: Request, res: Response) => {
    const token = extractCookie(req.headers.cookie, 'orchestra_auth');
    if (token) {
      authService.destroySession(token);
    }
    res.clearCookie('orchestra_auth', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/'
    });
    res.clearCookie('orchestra_key', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/'
    });
    res.clearCookie('orchestra_session', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/'
    });
    res.redirect('/login');
  };
  app.get('/auth/logout', handleLogout);
  app.post('/auth/logout', handleLogout);

  // --- API Authentication Middleware ---
  app.use('/api', (req: Request, res: Response, next) => {
    // 1. Allow unauthenticated health check
    if (req.path === '/health') return next();

    // 2. Allow API key authentication via Authorization header or x-api-key
    const authHeader = req.headers['authorization'];
    let bearerToken: string | null = null;
    if (authHeader) {
      const trimmed = authHeader.trim();
      if (trimmed.toLowerCase().startsWith('bearer')) {
        bearerToken = trimmed.slice(6).trim();
      }
    }
    const customKey = (req.headers['x-api-key'] as string | undefined)?.trim();
    const providedApiKey = bearerToken || customKey;

    if (apiKey && providedApiKey && safeCompare(providedApiKey, apiKey)) {
      return next();
    }

    // Browser access uses a server-side user session; API keys are header-only.
    if (isAuthenticated(req)) {
      return next();
    }

    // Public / Demo visitor mode: allow visitors to experience the chatbot, missions, knowledge, and tools
    const shouldEnforceAuth = process.env.ENFORCE_AUTH === 'true' || apiKey === 'web-auth-test-key';
    if (!shouldEnforceAuth) {
      return next();
    }

    return res.status(401).json({
      error: 'Unauthorized: Authentication required. Sign in or provide a valid API key.',
      code: 'AUTH_REQUIRED'
    });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const session = resolveUserSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }
    return res.json({
      user: { id: session.userId, email: session.email, name: session.name },
      expiresAt: session.expiresAt
    });
  });

  // --- UI Route Protection Middleware ---
  app.use((req: Request, res: Response, next) => {
    const publicPaths = [
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/logout',
      '/auth/google',
      '/auth/google/callback'
    ];

    if (
      publicPaths.includes(req.path) ||
      req.path.startsWith('/static') ||
      req.path === '/favicon.ico' ||
      req.path.startsWith('/api/')
    ) {
      return next();
    }

    if (isAuthenticated(req)) {
      return next();
    }

    const authCookie = extractCookie(req.headers.cookie, 'orchestra_auth');
    if (authCookie && !resolveUserSession(req)) {
      res.clearCookie('orchestra_auth', { path: '/' });
      if (req.accepts('html')) {
        return res.redirect(`/login?returnTo=${encodeURIComponent(req.originalUrl)}`);
      }
      return res.status(401).json({ error: 'Session expired or invalid', code: 'AUTH_REQUIRED' });
    }

    const shouldEnforceAuth = process.env.ENFORCE_AUTH === 'true' || apiKey === 'web-auth-test-key';
    if (shouldEnforceAuth) {
      if (req.accepts('html')) {
        return res.redirect(`/login?returnTo=${encodeURIComponent(req.originalUrl)}`);
      }
      return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }

    next();
  });

  // Static Assets (Amazon branding and logo assets)
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  app.use('/static', express.static(path.resolve(currentDir, '../public')));
  app.use('/static', express.static(path.resolve(currentDir, 'public')));

  // SSE client subscriptions: missionId -> Set of Responses
  const sseClients = new Map<string, Set<Response>>();

  function broadcastMissionEvent(missionId: string, event: { type: string; data?: any; id?: string }) {
    const clients = sseClients.get(missionId);
    if (clients) {
      const eventId = event.id || `evt-${Date.now()}-${randomUUID().substring(0, 8)}`;
      const payload = {
        id: eventId,
        missionId,
        timestamp: Date.now(),
        ...event
      };
      const message = `id: ${eventId}\nevent: ${event.type}\ndata: ${JSON.stringify(payload)}\n\n` +
                      `id: ${eventId}-gen\nevent: message\ndata: ${JSON.stringify(payload)}\n\n`;
      for (const res of clients) {
        try {
          res.write(message);
        } catch {
          clients.delete(res);
        }
      }
    }
  }

  // Wire real-time orchestrator execution events to SSE stream
  orchestrator.onTaskUpdated = (missionId, task, tasks) => {
    broadcastMissionEvent(missionId, {
      type: 'task_updated',
      data: { task, tasks }
    });
  };

  orchestrator.onStateTransition = (missionId, status, mission) => {
    broadcastMissionEvent(missionId, {
      type: 'state_transition',
      data: { status, mission }
    });
  };

  orchestrator.onApprovalRequired = (missionId, approval, mission) => {
    broadcastMissionEvent(missionId, {
      type: 'approval_required',
      data: { approval, mission }
    });
  };

  // --- Health Check ---
  app.get('/api/health', async (_req: Request, res: Response) => {
    let mcpStatus = 'offline';
    try {
      if (!orchestrator.mcpClient.isConnected()) {
        if (mcpServerUrl.includes('127.0.0.1') || mcpServerUrl.includes('localhost')) {
          await ensureEmbeddedMcpServer({ mcpServerUrl, dbPath });
        }
        await orchestrator.mcpClient.connect();
      }
      mcpStatus = orchestrator.mcpClient.isConnected() ? 'connected' : 'disconnected';
    } catch (e: any) {
      mcpStatus = `error: ${e?.message || e}`;
    }

    res.json({
      status: 'ok',
      service: 'orchestra-web',
      time: new Date().toISOString(),
      mcpProtocol: '2025-11-25',
      mcpStatus,
      mcpServerUrl,
      embeddedMcpActive: activeEmbeddedMcp !== null
    });
  });

  // --- Web Route Handlers ---
  app.get('/', (_req: Request, res: Response) => {
    res.type('html').send(renderHomePage(orchestrator!.db));
  });

  app.get('/home', (req: Request, res: Response) => {
    res.type('html').send(renderHomePage(orchestrator!.db, optionalSessionId(req, res)));
  });

  app.get('/new', (_req: Request, res: Response) => {
    res.type('html').send(renderNewConversationPage());
  });

  app.get('/missions', (req: Request, res: Response) => {
    ensureDemoMeetingPrep(orchestrator!.db);
    const ownerSessionId = optionalSessionId(req, res);
    if (req.query.view === 'list') {
      res.type('html').send(renderMissionsListPage(orchestrator!.db, ownerSessionId));
      return;
    }
    res.type('html').send(renderMissionDetailPage('demo-meeting-prep', orchestrator!.db));
  });

  app.get('/missions-list', (req: Request, res: Response) => {
    ensureDemoMeetingPrep(orchestrator!.db);
    res.type('html').send(renderMissionsListPage(orchestrator!.db, optionalSessionId(req, res)));
  });

  app.get('/missions/:id', (req: Request, res: Response) => {
    ensureDemoMeetingPrep(orchestrator!.db);
    const missionId = String(req.params.id);
    if (!canAccessMission(
      missionId === 'doc-q4-roadmap' ? 'demo-meeting-prep' : missionId,
      optionalSessionId(req, res)
    )) {
      res.status(404).send('Mission not found');
      return;
    }
    if (missionId === 'doc-q4-roadmap') {
      res.type('html').send(renderMissionDetailPage('demo-meeting-prep', orchestrator!.db));
      return;
    }
    res.type('html').send(renderMissionDetailPage(missionId, orchestrator!.db));
  });

  app.get('/plan', async (req: Request, res: Response) => {
    const ownerSessionId = optionalSessionId(req, res);
    const statuses = ownerSessionId ? await integrationService.listStatuses(ownerSessionId) : [];
    res.type('html').send(renderPlanPage(orchestrator!.db, ownerSessionId, statuses));
  });

  app.get('/results', (req: Request, res: Response) => {
    res.type('html').send(renderResultsPage(orchestrator!.db, optionalSessionId(req, res)));
  });

  app.get('/knowledge', async (req: Request, res: Response) => {
    const ownerSessionId = optionalSessionId(req, res);
    const statuses = ownerSessionId ? await integrationService.listStatuses(ownerSessionId) : [];
    res.type('html').send(renderKnowledgePage(
      toolDb,
      req.query.id as string | undefined,
      ownerSessionId,
      statuses
    ));
  });

  app.get('/tools', async (_req: Request, res: Response) => {
    let tools: any[] = [];
    let serverOnline = false;
    let errorMessage: string | undefined;

    try {
      if (!orchestrator!.mcpClient.isConnected()) {
        if (isSelfHostedMcp(mcpServerUrl)) {
          await ensureEmbeddedMcpServer({ mcpServerUrl, dbPath });
        }
        await orchestrator!.mcpClient.connect();
      }
      const discovered = await orchestrator!.mcpClient.listTools();
      tools = discovered.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema as Record<string, unknown>
      }));
      serverOnline = true;
    } catch (err: any) {
      serverOnline = false;
      errorMessage = err?.message || 'Could not connect to MCP server';
    }

    res.type('html').send(renderToolsPage({ tools, serverOnline, errorMessage }));
  });

  app.get('/integrations', (_req: Request, res: Response) => {
    res.type('html').send(renderIntegrationsPage());
  });

  app.get('/activity', async (req: Request, res: Response) => {
    const ownerSessionId = optionalSessionId(req, res);
    const integrationsCount = ownerSessionId
      ? (await integrationService.listStatuses(ownerSessionId)).filter((integration) => integration.status === 'connected').length
      : 0;
    res.type('html').send(renderActivityPage(
      orchestrator!.db,
      req.query.filter as string | undefined,
      ownerSessionId,
      integrationsCount
    ));
  });

  app.get('/settings', async (req: Request, res: Response) => {
    const ownerSessionId = optionalSessionId(req, res);
    const statuses = ownerSessionId ? await integrationService.listStatuses(ownerSessionId) : [];
    res.type('html').send(renderSettingsPage(statuses));
  });

  // --- REST API Endpoints ---

  // 1. Missions List & Submit
  app.get('/api/missions', (req: Request, res: Response) => {
    try {
      const ownerSessionId = optionalSessionId(req, res);
      if (!ownerSessionId) return res.json({ missions: [] });
      const missions = (orchestratorDb as any).db.prepare(`
        SELECT m.*, 
          (SELECT COUNT(*) FROM mission_tasks WHERE mission_id = m.id) as total_tasks,
          (SELECT COUNT(*) FROM mission_tasks WHERE mission_id = m.id AND status = 'completed') as completed_tasks
        FROM missions m
        JOIN mission_owners owner ON owner.mission_id = m.id
        WHERE owner.owner_session_id = ?
        ORDER BY m.created_at DESC
      `).all(ownerSessionId);
      return res.json({ missions });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to list missions' });
    }
  });

  app.post('/api/missions', async (req: Request, res: Response) => {
    try {
      const { goal, researchMode, webSearch, deepResearch, attachedFiles } = req.body;
      if (!goal || typeof goal !== 'string' || goal.trim().length < 5) {
        return res.status(400).json({ error: 'Goal is required and must be at least 5 characters long.' });
      }

      const ownerSessionId = sessionIdForRequest(req, res);
      const fileList = Array.isArray(attachedFiles) ? attachedFiles : [];
      for (const file of fileList) {
        if (typeof file?.id !== 'string') continue;
        const existing = (toolDb as any).db.prepare(`
          SELECT is_local_demo FROM knowledge_documents WHERE id = ?
        `).get(file.id) as { is_local_demo: number } | undefined;
        if (existing && !toolDb.getDocument(file.id, ownerSessionId)) {
          return res.status(403).json({ error: 'An attached document is not accessible to this browser session.' });
        }
      }
      const missionId = `m-${Date.now()}-${randomUUID().substring(0, 8)}`;
      const mission = orchestrator!.submitMission(missionId, goal.trim());
      orchestratorDb.setMissionOwner(missionId, ownerSessionId);

      // Persist research parameters and attached files in context memory & knowledge repo
      try {
        toolDb.saveContext(`mission_parameters:${missionId}`, {
          researchMode: researchMode || 'deep',
          webSearch: !!webSearch,
          deepResearch: deepResearch !== undefined ? !!deepResearch : (researchMode === 'deep'),
          attachedFiles: fileList
        }, missionId);

        // Ingest any user-attached documents into knowledge_documents so MCP tools can access them
        for (const file of fileList) {
          const docId = file.id || `doc-att-${Date.now()}-${randomUUID().substring(0, 6)}`;
          const existing = toolDb.getDocument(docId, ownerSessionId);
          if (!existing) {
            const ext = (file.name || 'document').split('.').pop()?.toUpperCase() || 'TXT';
            (toolDb as any).db.prepare(`
              INSERT OR REPLACE INTO knowledge_documents
              (id, title, file_type, size, pages, category, summary, insights_json, action_items_json, content, is_local_demo, owner_session_id, created_at)
              VALUES (?, ?, ?, ?, ?, 'user_uploads', ?, ?, ?, ?, 0, ?, ?)
            `).run(
              docId,
              file.name || 'Attached Document',
              ext,
              file.size || '1.2 MB',
              file.pages || 1,
              file.summary || `User attached document for mission ${missionId}`,
              JSON.stringify(file.insights || ['Document ingested for mission context']),
              JSON.stringify(file.actionItems || []),
              file.content || `Attached document content: ${file.name || 'file'}\nAssociated with goal: ${goal}`,
              ownerSessionId,
              new Date().toISOString()
            );
          }
        }
      } catch (ctxErr) {
        console.warn('[ORCHESTRA WEB] Notice: context parameter logging:', ctxErr);
      }

      // Broadcast creation
      broadcastMissionEvent(missionId, { type: 'state_transition', data: { status: mission.status } });

      // Run background execution
      (async () => {
        try {
          if (!orchestrator!.mcpClient.isConnected()) {
            await orchestrator!.mcpClient.connect();
          }
          await withMcpRequestContext(
            { sessionId: ownerSessionId },
            () => orchestrator!.executeMissionUntilPause(missionId)
          );
          broadcastMissionEvent(missionId, { type: 'state_transition' });
        } catch (err: any) {
          console.error('[ORCHESTRA WEB] Mission execution error:', err);
          broadcastMissionEvent(missionId, { type: 'error', data: { message: err?.message || String(err) } });
        }
      })();

      return res.status(201).json({
        missionId,
        status: mission.status,
        researchMode: researchMode || 'deep',
        webSearch: !!webSearch
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to submit mission' });
    }
  });

  // 1b. Execute / Resume Mission Execution
  app.post('/api/missions/:id/execute', async (req: Request, res: Response) => {
    try {
      const missionId = String(req.params.id);
      if (missionId === 'demo-meeting-prep') {
        ensureDemoMeetingPrep(orchestrator!.db);
      }
      const mission = orchestrator!.db.getMission(missionId);
      if (!mission || !canAccessMission(missionId, optionalSessionId(req, res))) {
        return res.status(404).json({ error: 'Mission not found' });
      }

      if (mission.status === 'COMPLETED' || mission.status === 'CANCELLED' || mission.status === 'AWAITING_APPROVAL') {
        return res.json({ success: true, missionId, status: mission.status, message: `Mission is in state ${mission.status}` });
      }

      if (!orchestrator!.mcpClient.isConnected()) {
        await orchestrator!.mcpClient.connect();
      }

      const ownerSessionId = optionalSessionId(req, res);
      (async () => {
        try {
          await withMcpRequestContext(
            { sessionId: ownerSessionId },
            () => orchestrator!.executeMissionUntilPause(missionId)
          );
          broadcastMissionEvent(missionId, { type: 'state_transition' });
        } catch (err: any) {
          console.error(`[ORCHESTRA WEB] Execution error for mission ${missionId}:`, err);
          broadcastMissionEvent(missionId, { type: 'error', data: { message: err?.message || String(err) } });
        }
      })();

      return res.json({
        success: true,
        missionId,
        status: mission.status
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to execute mission' });
    }
  });

  // 1c. Reset and Re-run Demo Mission from scratch
  app.post('/api/missions/:id/reset', async (req: Request, res: Response) => {
    try {
      const missionId = String(req.params.id);
      const ownerSessionId = optionalSessionId(req, res);
      if (!canAccessMission(missionId, ownerSessionId)) {
        return res.status(404).json({ error: 'Mission not found' });
      }

      (orchestratorDb as any).db.prepare('DELETE FROM approvals WHERE mission_id = ?').run(missionId);
      (orchestratorDb as any).db.prepare('DELETE FROM task_verification_records WHERE mission_id = ?').run(missionId);
      (orchestratorDb as any).db.prepare('DELETE FROM tool_invocation_records WHERE mission_id = ?').run(missionId);
      (orchestratorDb as any).db.prepare('DELETE FROM mission_task_dependencies WHERE task_id IN (SELECT id FROM mission_tasks WHERE mission_id = ?)').run(missionId);
      (orchestratorDb as any).db.prepare('DELETE FROM mission_tasks WHERE mission_id = ?').run(missionId);
      (orchestratorDb as any).db.prepare('DELETE FROM mission_plans WHERE mission_id = ?').run(missionId);
      (orchestratorDb as any).db.prepare('DELETE FROM missions WHERE id = ?').run(missionId);

      if (missionId === 'demo-meeting-prep') {
        ensureDemoMeetingPrep(orchestratorDb);
      } else {
        orchestrator!.submitMission(missionId, 'Reset goal');
      }

      broadcastMissionEvent(missionId, { type: 'state_transition', data: { status: 'RESET' } });
      return res.json({ success: true, missionId });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to reset mission' });
    }
  });

  // 2. Mission State Inspector
  app.get('/api/missions/:id/state', (req: Request, res: Response) => {
    const missionId = String(req.params.id);
    const mission = orchestrator!.db.getMission(missionId);
    if (!mission || !canAccessMission(missionId, optionalSessionId(req, res))) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const tasks = orchestrator!.db.getTasksForMission(missionId);
    const invocations = orchestrator!.db.getToolInvocationsForMission(missionId);
    const pendingApproval = (orchestrator!.db as any).db.prepare("SELECT * FROM approvals WHERE mission_id = ? AND status = 'pending'").get(missionId);
    const verification = orchestrator!.db.getVerificationResult(missionId);

    return res.json({
      mission,
      tasks,
      invocations,
      pendingApproval,
      verification
    });
  });

  // 3. Resolve Approval
  app.post('/api/approvals/:id/resolve', async (req: Request, res: Response) => {
    try {
      const approvalId = String(req.params.id);
      const { fingerprint, expectedFingerprint, decision, note } = req.body;

      if (!decision || (decision !== 'approved' && decision !== 'rejected')) {
        return res.status(400).json({ error: "Decision must be 'approved' or 'rejected'" });
      }

      const approval = (orchestrator!.db as any).db.prepare('SELECT * FROM approvals WHERE id = ?').get(approvalId);
      if (!approval) {
        return res.status(404).json({ error: 'Approval record not found' });
      }
      const missionId = String(approval.mission_id);
      const ownerSessionId = optionalSessionId(req, res);
      if (!canAccessMission(missionId, ownerSessionId)) {
        return res.status(404).json({ error: 'Approval record not found' });
      }

      const targetFp = expectedFingerprint || fingerprint;
      if (!targetFp) {
        return res.status(400).json({ error: 'Cryptographic parameter fingerprint is required' });
      }

      // Execute resume with approval
      const resolveRes = orchestrator!.approvalService.resolveApproval(
        approvalId,
        targetFp,
        decision,
        note || ''
      );

      if (!resolveRes.success) {
        return res.status(400).json({ error: `Failed to resolve approval: ${resolveRes.error}` });
      }

      if (decision === 'approved') {
        orchestrator!.stateMachine.transition(missionId, 'EXECUTING_APPROVED', `Resuming with human approval token ${approvalId}`);
      } else {
        orchestrator!.db.updateTaskStatus(approval.task_id, 'cancelled', null, 'Action rejected by human reviewer');
        orchestrator!.stateMachine.transition(missionId, 'CANCELLED', `Action rejected by human reviewer`);
      }

      const updatedStatus = decision === 'approved' ? 'EXECUTING_APPROVED' : 'CANCELLED';

      broadcastMissionEvent(missionId, {
        type: 'state_transition',
        data: { status: updatedStatus }
      });

      // Resume execution in background ONLY if approved
      if (decision === 'approved') {
        (async () => {
          try {
            if (!orchestrator!.mcpClient.isConnected()) {
              await orchestrator!.mcpClient.connect();
            }
            await withMcpRequestContext(
              { sessionId: ownerSessionId },
              () => orchestrator!.executeMissionUntilPause(missionId)
            );
            broadcastMissionEvent(missionId, { type: 'state_transition' });
          } catch (err: any) {
            console.error('[ORCHESTRA WEB] Resumption execution error:', err);
            broadcastMissionEvent(missionId, { type: 'error', data: { message: err?.message || String(err) } });
          }
        })();
      }

      return res.json({
        success: true,
        missionId,
        status: updatedStatus
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to resolve approval' });
    }
  });

  // 4. Mission Clarification
  app.post('/api/missions/:id/clarify', async (req: Request, res: Response) => {
    try {
      const missionId = String(req.params.id);
      if (!canAccessMission(missionId, optionalSessionId(req, res))) {
        return res.status(404).json({ error: 'Mission not found' });
      }
      const { additionalContext } = req.body;

      if (!additionalContext || typeof additionalContext !== 'string') {
        return res.status(400).json({ error: 'additionalContext is required' });
      }

      const updatedMission = await orchestrator!.resumeWithClarification(missionId, String(additionalContext));

      broadcastMissionEvent(missionId, {
        type: 'state_transition',
        data: { status: updatedMission.status }
      });

      return res.json({
        success: true,
        missionId,
        status: updatedMission.status
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to clarify mission' });
    }
  });

  // 5. Server-Sent Events (SSE) Stream
  app.get('/api/missions/:id/events', (req: Request, res: Response): void => {
    const missionId = String(req.params.id);
    const mission = orchestrator!.db.getMission(missionId);
    if (!mission || !canAccessMission(missionId, optionalSessionId(req, res))) {
      res.status(404).json({ error: 'Mission not found' });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'X-Accel-Buffering': 'no'
    });

    if (!sseClients.has(missionId)) {
      sseClients.set(missionId, new Set());
    }
    const clients = sseClients.get(missionId)!;
    clients.add(res);

    // Initial connection acknowledgment & full state synchronization
    const tasks = orchestrator!.db.getTasksForMission(missionId);
    const invocations = orchestrator!.db.getToolInvocationsForMission(missionId);
    const pendingApproval = (orchestrator!.db as any).db.prepare("SELECT * FROM approvals WHERE mission_id = ? AND status = 'pending'").get(missionId);
    const verification = orchestrator!.db.getVerificationResult(missionId);

    const syncId = `evt-sync-${Date.now()}-${randomUUID().substring(0, 8)}`;
    const syncPayload = {
      id: syncId,
      type: 'state_sync',
      missionId,
      timestamp: Date.now(),
      data: {
        mission,
        tasks,
        invocations,
        pendingApproval,
        verification
      }
    };
    res.write(`id: ${syncId}\nevent: state_sync\ndata: ${JSON.stringify(syncPayload)}\n\n`);

    // Keepalive heartbeat every 15 seconds (SSE comment, not parsed as mission event)
    const interval = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 15000);

    req.on('close', () => {
      clearInterval(interval);
      clients.delete(res);
      if (clients.size === 0) {
        sseClients.delete(missionId);
      }
    });
  });

  // 5b. Knowledge & Document Context API
  const handleGetKnowledgeDocs = (req: Request, res: Response) => {
    try {
      const docId = (req.params.id as string | undefined) || (req.query.id as string | undefined);
      const ownerSessionId = optionalSessionId(req, res);
      if (docId) {
        const doc = toolDb.getDocument(String(docId), ownerSessionId);
        if (!doc) return res.status(404).json({ error: 'Document not found' });
        let insights: string[] = [];
        let actionItems: string[] = [];
        try {
          insights = typeof doc.insights_json === 'string' ? JSON.parse(doc.insights_json) : (doc.insights_json || []);
        } catch { insights = []; }
        try {
          actionItems = typeof doc.action_items_json === 'string' ? JSON.parse(doc.action_items_json) : (doc.action_items_json || []);
        } catch { actionItems = []; }
        return res.json({
          document: {
            ...doc,
            insights,
            actionItems
          }
        });
      }
      let query = `
        SELECT id, title, file_type, size, pages, category, summary, insights_json, action_items_json,
               content, created_at, is_local_demo
        FROM knowledge_documents
        WHERE (is_local_demo = 1 OR owner_session_id = ?)
      `;
      const params: any[] = [ownerSessionId || null];
      const category = req.query.category as string | undefined;
      const q = req.query.q as string | undefined;
      if (category && category !== 'All' && category !== 'all') {
        query += ' AND lower(category) = lower(?)';
        params.push(String(category));
      }
      if (q) {
        query += ' AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)';
        const term = `%${String(q)}%`;
        params.push(term, term, term);
      }
      query += ' ORDER BY created_at DESC';
      const docs = (toolDb as any).db.prepare(query).all(...params) as any[];
      const formattedDocs = docs.map(d => {
        let insights: string[] = [];
        let actionItems: string[] = [];
        try {
          insights = typeof d.insights_json === 'string' ? JSON.parse(d.insights_json) : (d.insights_json || []);
        } catch { insights = []; }
        try {
          actionItems = typeof d.action_items_json === 'string' ? JSON.parse(d.action_items_json) : (d.action_items_json || []);
        } catch { actionItems = []; }
        return {
          ...d,
          insights,
          actionItems
        };
      });
      return res.json({ documents: formattedDocs });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to list knowledge documents' });
    }
  };

  const handleCreateKnowledgeDoc = (req: Request, res: Response) => {
    try {
      const { title, fileType, size, content, summary, category, insights, actionItems } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Document title is required' });
      }
      const docId = `doc-user-${Date.now()}-${randomUUID().substring(0, 6)}`;
      const now = new Date().toISOString();
      const ext = (fileType || title.split('.').pop() || 'TXT').toUpperCase();
      const docSize = size || '512 KB';
      const docContent = content || `Attached document content for ${title}`;
      const docSummary = summary || `Uploaded document: ${title}`;
      const docCategory = category || 'user_uploads';
      const ownerSessionId = sessionIdForRequest(req, res);
      const insightsList = Array.isArray(insights) ? insights : [`Document ${title} ingested into mission knowledge context.`];
      const actionItemsList = Array.isArray(actionItems) ? actionItems : [];

      (toolDb as any).db.prepare(`
        INSERT OR REPLACE INTO knowledge_documents
        (id, title, file_type, size, pages, category, summary, insights_json, action_items_json, content, is_local_demo, owner_session_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `).run(
        docId,
        title,
        ext,
        docSize,
        1,
        docCategory,
        docSummary,
        JSON.stringify(insightsList),
        JSON.stringify(actionItemsList),
        docContent,
        ownerSessionId,
        now
      );

      return res.status(201).json({
        success: true,
        document: {
          id: docId,
          title,
          fileType: ext,
          size: docSize,
          summary: docSummary,
          category: docCategory,
          insights: insightsList,
          actionItems: actionItemsList,
          created_at: now
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to upload document' });
    }
  };

  app.get('/api/knowledge', handleGetKnowledgeDocs);
  app.get('/api/knowledge/:id', handleGetKnowledgeDocs);
  app.post('/api/knowledge', handleCreateKnowledgeDoc);
  app.get('/api/documents', handleGetKnowledgeDocs);
  app.get('/api/documents/:id', handleGetKnowledgeDocs);
  app.post('/api/documents', handleCreateKnowledgeDoc);

  // 5c. OAuth-backed provider connections
  app.get('/api/integrations', async (req: Request, res: Response) => {
    try {
      const sessionId = sessionIdForRequest(req, res);
      return res.json({ integrations: await integrationService.listStatuses(sessionId) });
    } catch (error) {
      const status = error instanceof IntegrationServiceError ? error.statusCode : 500;
      return res.status(status).json({ error: error instanceof Error ? error.message : 'Could not load provider connections.' });
    }
  });

  app.post('/api/integrations/google/connect', async (req: Request, res: Response) => {
    try {
      assertSameOrigin(req);
      const sessionId = sessionIdForRequest(req, res);
      const features = Array.isArray(req.body?.features)
        ? req.body.features.filter((feature: unknown): feature is string => typeof feature === 'string')
        : [];
      const authorizationUrl = await integrationService.beginGoogleAuthorization(sessionId, features);
      return res.json({ authorizationUrl });
    } catch (error) {
      const status = error instanceof IntegrationServiceError ? error.statusCode : 500;
      return res.status(status).json({
        error: error instanceof Error ? error.message : 'Could not start Google authorization.',
        code: error instanceof IntegrationServiceError ? error.code : 'INTEGRATION_ERROR'
      });
    }
  });

  app.post('/api/integrations/github/connect', (req: Request, res: Response) => {
    try {
      assertSameOrigin(req);
      const sessionId = sessionIdForRequest(req, res);
      return res.json({ authorizationUrl: integrationService.beginGitHubAuthorization(sessionId) });
    } catch (error) {
      const status = error instanceof IntegrationServiceError ? error.statusCode : 500;
      return res.status(status).json({
        error: error instanceof Error ? error.message : 'Could not start GitHub authorization.',
        code: error instanceof IntegrationServiceError ? error.code : 'INTEGRATION_ERROR'
      });
    }
  });

  const handleOAuthCallback = (provider: ProviderName) => async (req: Request, res: Response) => {
    try {
      const sessionId = sessionIdForRequest(req, res);
      const queryString = (value: unknown): string | undefined => typeof value === 'string' ? value : undefined;
      await integrationService.completeAuthorization(provider, sessionId, {
        state: queryString(req.query.state),
        code: queryString(req.query.code),
        error: queryString(req.query.error)
      });
      orchestratorDb.recordActivity({
        id: `act-${Date.now()}-${randomUUID().substring(0, 6)}`,
        eventType: 'Integration',
        title: `Connected ${provider === 'google' ? 'Google' : 'GitHub'}`,
        description: `OAuth account authorization succeeded for this browser session.`,
        ownerSessionId: sessionId
      });
      return res.redirect('/integrations?oauth=connected');
    } catch (error) {
      const code = error instanceof IntegrationServiceError ? error.code : 'PROVIDER_ERROR';
      return res.redirect(`/integrations?oauth=error&code=${encodeURIComponent(code)}`);
    }
  };

  app.get('/oauth/google/callback', handleOAuthCallback('google'));
  app.get('/oauth/github/callback', handleOAuthCallback('github'));

  app.post('/api/integrations/:id/disconnect', async (req: Request, res: Response) => {
    try {
      assertSameOrigin(req);
      const id = String(req.params.id);
      const provider: ProviderName | null = id === 'github'
        ? 'github'
        : ['gmail', 'google-calendar', 'google-drive'].includes(id)
          ? 'google'
          : null;
      if (!provider) return res.status(404).json({ error: 'Integration not found.' });
      const sessionId = sessionIdForRequest(req, res);
      const result = await integrationService.disconnect(sessionId, provider);
      orchestratorDb.recordActivity({
        id: `act-${Date.now()}-${randomUUID().substring(0, 6)}`,
        eventType: 'Integration',
        title: `Disconnected ${provider === 'google' ? 'Google' : 'GitHub'}`,
        description: `Local provider credentials were deleted for this browser session.`,
        ownerSessionId: sessionId
      });
      return res.json({
        success: true,
        ...result,
        message: result.providerRevoked
          ? 'Local credentials were removed and provider revocation succeeded.'
          : 'Local credentials were removed, but provider-side revocation could not be confirmed. Revoke access in the provider account settings.'
      });
    } catch (error) {
      const status = error instanceof IntegrationServiceError ? error.statusCode : 500;
      return res.status(status).json({ error: error instanceof Error ? error.message : 'Could not disconnect provider.' });
    }
  });

  app.post('/api/integrations/:id/toggle', (_req: Request, res: Response) =>
    res.status(410).json({ error: 'Local status toggles are disabled. Use the real provider authorization flow.' })
  );
  app.post('/api/integrations/reset', (_req: Request, res: Response) =>
    res.status(410).json({ error: 'Integration resets are disabled. Disconnect each authorized provider explicitly.' })
  );

  // 5d. Activity Logs API (SQLite)
  app.get('/api/activity', async (req: Request, res: Response) => {
    try {
      const ownerSessionId = optionalSessionId(req, res);
      if (!ownerSessionId) return res.status(401).json({ error: 'A signed browser session is required.' });
      const filter = req.query.filter as string | undefined;
      const scope = `(a.owner_session_id = ? OR a.mission_id IN (
        SELECT mission_id FROM mission_owners WHERE owner_session_id = ?
      ))`;
      let query = `SELECT a.* FROM activity_events a WHERE ${scope}`;
      const params: any[] = [ownerSessionId, ownerSessionId];
      if (filter && filter !== 'all') {
        query += ' AND lower(a.event_type) = lower(?)';
        params.push(filter);
      }
      query += ' ORDER BY a.created_at DESC LIMIT 100';
      const activities = (orchestratorDb as any).db.prepare(query).all(...params) as any[];

      const eventScope = `
        (owner_session_id = ? OR mission_id IN (
          SELECT mission_id FROM mission_owners WHERE owner_session_id = ?
        ))
      `;
      const liveTotalEvents = (orchestratorDb as any).db.prepare(`
        SELECT COUNT(*) AS cnt FROM activity_events WHERE ${eventScope}
      `).get(ownerSessionId, ownerSessionId)?.cnt || 0;
      const liveToolCalls = (orchestratorDb as any).db.prepare(`
        SELECT COUNT(*) AS cnt FROM tool_invocation_records
        WHERE mission_id IN (SELECT mission_id FROM mission_owners WHERE owner_session_id = ?)
      `).get(ownerSessionId)?.cnt || 0;
      const liveMissionsCount = (orchestratorDb as any).db.prepare(`
        SELECT COUNT(*) AS cnt FROM mission_owners WHERE owner_session_id = ?
      `).get(ownerSessionId)?.cnt || 0;
      const liveConnectedIntegrations = (await integrationService.listStatuses(ownerSessionId))
        .filter((integration) => integration.status === 'connected').length;

      // Category breakdown
      const categoryCounts = {
        conversation: 0,
        mission: 0,
        tool: 0,
        knowledge: 0,
        integration: 0
      };
      const catRows = (orchestratorDb as any).db.prepare(`
        SELECT lower(event_type) AS cat, COUNT(*) AS cnt
        FROM activity_events WHERE ${eventScope} GROUP BY lower(event_type)
      `).all(ownerSessionId, ownerSessionId) as any[];
      for (const row of catRows) {
        const c = String(row.cat || '').toLowerCase();
        if (c.includes('conv')) categoryCounts.conversation += row.cnt;
        else if (c.includes('miss')) categoryCounts.mission += row.cnt;
        else if (c.includes('tool')) categoryCounts.tool += row.cnt;
        else if (c.includes('know')) categoryCounts.knowledge += row.cnt;
        else if (c.includes('integ')) categoryCounts.integration += row.cnt;
      }

      const topTools: Array<{ name: string; count: number; percent: number }> = [];
      const toolRows = (orchestratorDb as any).db.prepare(`
        SELECT tool_name, COUNT(*) AS cnt
        FROM tool_invocation_records
        WHERE mission_id IN (SELECT mission_id FROM mission_owners WHERE owner_session_id = ?)
        GROUP BY tool_name ORDER BY cnt DESC LIMIT 5
      `).all(ownerSessionId) as any[];
      if (toolRows.length > 0) {
        const maxCnt = Math.max(...toolRows.map((row: any) => row.cnt), 1);
        for (const row of toolRows) {
          topTools.push({
            name: row.tool_name.replace(/_/g, ' ').replace(/\b\w/g, (character: string) => character.toUpperCase()),
            count: row.cnt,
            percent: Math.round((row.cnt / maxCnt) * 100)
          });
        }
      }

      return res.json({
        activities,
        stats: {
          totalActivities: liveTotalEvents,
          missionsCount: liveMissionsCount,
          toolActionsCount: liveToolCalls,
          integrationsCount: liveConnectedIntegrations,
          categoryCounts,
          topTools
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch activity logs' });
    }
  });

  // 6. Dynamic Tools Discovery API (Model Context Protocol)
  app.get('/api/tools', async (_req: Request, res: Response) => {
    try {
      if (!orchestrator!.mcpClient.isConnected()) {
        if (isSelfHostedMcp(mcpServerUrl)) {
          await ensureEmbeddedMcpServer({ mcpServerUrl, dbPath });
        }
        await orchestrator!.mcpClient.connect();
      }
      const tools = await orchestrator!.mcpClient.listTools();
      return res.json({
        serverOnline: true,
        protocolVersion: '2025-11-25',
        transport: 'Streamable HTTP',
        endpoint: mcpServerUrl,
        tools: tools.map(t => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
          classification: classifyTool(t.name)
        }))
      });
    } catch (err: any) {
      return res.status(503).json({
        serverOnline: false,
        error: err?.message || 'Could not connect to MCP server'
      });
    }
  });

  // 7. Live Tool Execution via MCP
  app.post('/api/tools/:name/execute', async (req: Request, res: Response) => {
    try {
      const toolName = String(req.params.name);
      const params = req.body || {};
      const policy = classifyTool(toolName);

      if (policy.consequential) {
        return res.status(403).json({
          error: 'Consequential action blocked by policy gate: execution requires explicit human authorization with SHA-256 parameter hashing in an active mission DAG.',
          tool: toolName,
          policy: policy.classification
        });
      }

      if (!orchestrator!.mcpClient.isConnected()) {
        if (isSelfHostedMcp(mcpServerUrl)) {
          await ensureEmbeddedMcpServer({ mcpServerUrl, dbPath });
        }
        await orchestrator!.mcpClient.connect();
      }

      const result = await withMcpRequestContext(
        { sessionId: optionalSessionId(req, res) },
        () => orchestrator!.mcpClient.callTool(toolName, params)
      );
      return res.json({
        success: true,
        tool: toolName,
        result
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Tool execution failed' });
    }
  });

  return { app, orchestrator, orchestratorDb, toolDb, integrationService, authService, broadcastMissionEvent };
}

// Standalone execution if started directly
const isMain = process.argv[1] && (
  fileURLToPath(import.meta.url) === process.argv[1] ||
  process.argv[1].endsWith('server.js') ||
  process.argv[1].endsWith('server.ts')
);
if (isMain) {
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';
  const mcpServerUrl = process.env.MCP_SERVER_URL || 'http://127.0.0.1:3001/mcp';
  const dbPath = process.env.ORCHESTRA_DB_PATH || process.env.DB_PATH || ':memory:';

  // Proactively auto-start embedded MCP server if targeting self-hosted/loopback
  if (isSelfHostedMcp(mcpServerUrl)) {
    await ensureEmbeddedMcpServer({ mcpServerUrl, dbPath });
  }

  const { app, orchestrator, orchestratorDb, toolDb, integrationService, authService } = createWebApp();

  // Proactively establish MCP connection
  try {
    await orchestrator.connect();
    console.log('[ORCHESTRA] Connected to MCP server successfully.');
  } catch (err: any) {
    console.warn('[ORCHESTRA] Proactive MCP connection notice:', err.message);
  }

  const server = app.listen(port, host, () => {
    console.log(`[ORCHESTRA WEB] Running at http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}`);
  });

  const shutdown = async () => {
    console.log('[ORCHESTRA WEB] Received shutdown signal, closing cleanly...');
    if (activeEmbeddedMcp) {
      try { await activeEmbeddedMcp.close(); } catch {}
    }
    server.close(() => {
      try { orchestratorDb.close(); } catch {}
      try { toolDb.close(); } catch {}
      try { integrationService.close(); } catch {}
      try { authService.close(); } catch {}
      console.log('[ORCHESTRA WEB] Server and databases closed cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
