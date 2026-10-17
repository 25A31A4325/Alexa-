import { DatabaseSync } from 'node:sqlite';
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as nodeScrypt,
  timingSafeEqual
} from 'node:crypto';
import * as path from 'node:path';
import * as fs from 'node:fs';

const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const SESSION_LIFETIME_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const RESET_TOKEN_LIFETIME_MS = 60 * 60 * 1000; // 1 hour
const VERIFY_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_LOGIN_ATTEMPTS = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export class AuthServiceError extends Error {
  constructor(message: string, public readonly code: string, public readonly statusCode: number = 400) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  googleId: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string | null;
  browserSessionId: string;
  token: string;
  expiresAt: number;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}

export interface AuthServiceOptions {
  dbPath?: string;
  publicOrigin?: string;
  fetchImpl?: typeof fetch;
}

function scryptAsync(password: string, salt: Buffer, keylen: number, options: { N: number; r: number; p: number; maxmem: number }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, PASSWORD_KEY_LENGTH, PASSWORD_SCRYPT);
  return `scrypt$${PASSWORD_SCRYPT.N}$${PASSWORD_SCRYPT.r}$${PASSWORD_SCRYPT.p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

async function verifyPassword(password: string, encoded: string | null): Promise<boolean> {
  if (!encoded) return false;
  const parts = encoded.split('$');
  const isValid = parts.length === 6 && parts[0] === 'scrypt';
  const salt = isValid ? Buffer.from(parts[4]!, 'base64url') : Buffer.alloc(16, 0x5a);
  const expected = isValid ? Buffer.from(parts[5]!, 'base64url') : Buffer.alloc(PASSWORD_KEY_LENGTH, 0x5a);
  try {
    const actual = await scryptAsync(password, salt, PASSWORD_KEY_LENGTH, PASSWORD_SCRYPT);
    return timingSafeEqual(actual, expected) && isValid;
  } catch {
    return false;
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('base64url');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export class AuthService {
  private readonly db: DatabaseSync;
  private readonly publicOrigin: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: AuthServiceOptions = {}) {
    const dbPath = options.dbPath || process.env.ORCHESTRA_DB_PATH || process.env.DB_PATH || ':memory:';
    if (dbPath !== ':memory:') {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new DatabaseSync(dbPath);
    this.publicOrigin = options.publicOrigin || process.env.PUBLIC_APP_ORIGIN || 'http://localhost:3000';
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS auth_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password_hash TEXT,
        name TEXT,
        google_id TEXT UNIQUE,
        email_verified INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS auth_sessions (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        browser_session_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS auth_email_tokens (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS auth_rate_limits (
        key TEXT PRIMARY KEY,
        count INTEGER NOT NULL,
        reset_at INTEGER NOT NULL
      );
    `);
  }

  // --- Rate Limiting ---
  public checkRateLimit(key: string, maxAttempts: number = MAX_LOGIN_ATTEMPTS, windowMs: number = RATE_WINDOW_MS): { allowed: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    const row = this.db.prepare('SELECT count, reset_at FROM auth_rate_limits WHERE key = ?').get(key) as { count: number; reset_at: number } | undefined;
    if (!row || now > row.reset_at) {
      this.db.prepare(`
        INSERT INTO auth_rate_limits (key, count, reset_at)
        VALUES (?, 1, ?)
        ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at
      `).run(key, now + windowMs);
      return { allowed: true, retryAfterSeconds: 0 };
    }
    if (row.count >= maxAttempts) {
      const retryAfterSeconds = Math.max(1, Math.ceil((row.reset_at - now) / 1000));
      return { allowed: false, retryAfterSeconds };
    }
    this.db.prepare('UPDATE auth_rate_limits SET count = count + 1 WHERE key = ?').run(key);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  public resetRateLimit(key: string): void {
    this.db.prepare('DELETE FROM auth_rate_limits WHERE key = ?').run(key);
  }

  // --- User Registration ---
  public async register(emailRaw: string, password: string, name?: string): Promise<{ user: AuthUser; verificationToken: string }> {
    const email = normalizeEmail(emailRaw);
    if (!isValidEmail(email)) {
      throw new AuthServiceError('Please enter a valid email address.', 'INVALID_EMAIL');
    }
    if (password.length < 12) {
      throw new AuthServiceError('Password must be at least 12 characters long.', 'PASSWORD_TOO_SHORT');
    }
    if (password.length > 256) {
      throw new AuthServiceError('Password cannot exceed 256 characters.', 'PASSWORD_TOO_LONG');
    }

    const existing = this.db.prepare('SELECT id FROM auth_users WHERE email = ?').get(email) as { id: string } | undefined;
    if (existing) {
      throw new AuthServiceError('An account with this email address already exists.', 'EMAIL_EXISTS', 409);
    }

    const userId = randomUUID();
    const hashed = await hashPassword(password);
    const now = new Date().toISOString();
    const displayName = name?.trim() || email.split('@')[0] || 'User';

    this.db.prepare(`
      INSERT INTO auth_users (id, email, password_hash, name, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `).run(userId, email, hashed, displayName, now, now);

    const verificationToken = this.createEmailToken(userId, 'verify_email', VERIFY_TOKEN_LIFETIME_MS);
    try {
      await this.sendVerificationEmail(email, verificationToken);
    } catch (error) {
      this.db.prepare('DELETE FROM auth_email_tokens WHERE user_id = ?').run(userId);
      this.db.prepare('DELETE FROM auth_users WHERE id = ?').run(userId);
      throw error;
    }

    const user = this.getUserById(userId)!;
    return { user, verificationToken };
  }

  // --- User Login ---
  public async login(emailRaw: string, password: string, ip: string = 'unknown'): Promise<AuthUser> {
    const email = normalizeEmail(emailRaw);
    const rateKey = `login:${ip}:${email}`;
    const rateCheck = this.checkRateLimit(rateKey, MAX_LOGIN_ATTEMPTS, RATE_WINDOW_MS);
    if (!rateCheck.allowed) {
      throw new AuthServiceError(
        `Too many failed sign-in attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
        'RATE_LIMITED',
        429
      );
    }

    const row = this.db.prepare(`
      SELECT id, email, password_hash, name, google_id, email_verified, created_at, updated_at
      FROM auth_users WHERE email = ?
    `).get(email) as any;

    if (!row || !row.password_hash) {
      // Simulate password check timing to resist timing attacks
      await verifyPassword(password, 'scrypt$16384$8$1$fakeSalt$fakeHash');
      throw new AuthServiceError('Invalid email or password.', 'INVALID_CREDENTIALS', 401);
    }

    const matches = await verifyPassword(password, row.password_hash);
    if (!matches) {
      throw new AuthServiceError('Invalid email or password.', 'INVALID_CREDENTIALS', 401);
    }
    if (!row.email_verified) {
      throw new AuthServiceError('Verify your email address before signing in.', 'EMAIL_NOT_VERIFIED', 403);
    }

    this.resetRateLimit(rateKey);
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      googleId: row.google_id,
      emailVerified: Boolean(row.email_verified),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // --- Google OAuth Sign-in ---
  public loginWithGoogle(profile: GoogleProfile): AuthUser {
    const email = normalizeEmail(profile.email);
    if (!profile.email_verified || !isValidEmail(email) || !profile.sub) {
      throw new AuthServiceError('Google did not return a verified email address.', 'GOOGLE_EMAIL_UNVERIFIED', 401);
    }
    const googleId = profile.sub;
    const now = new Date().toISOString();
    const displayName = profile.name || email.split('@')[0] || 'Google User';

    // 1. Look up by Google ID
    let row = this.db.prepare(`
      SELECT id, email, name, google_id, email_verified, created_at, updated_at
      FROM auth_users WHERE google_id = ?
    `).get(googleId) as any;

    if (row) {
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        googleId: row.google_id,
        emailVerified: true,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    }

    // 2. Look up by email (link Google ID if already exists)
    row = this.db.prepare(`
      SELECT id, email, name, google_id, email_verified, created_at, updated_at
      FROM auth_users WHERE email = ?
    `).get(email) as any;

    if (row) {
      if (row.google_id && row.google_id !== googleId) {
        throw new AuthServiceError('This account is already linked to another Google identity.', 'GOOGLE_ACCOUNT_MISMATCH', 409);
      }
      this.db.prepare(`
        UPDATE auth_users SET google_id = ?, email_verified = 1, updated_at = ?
        WHERE id = ?
      `).run(googleId, now, row.id);
      return {
        id: row.id,
        email: row.email,
        name: row.name || displayName,
        googleId,
        emailVerified: true,
        createdAt: row.created_at,
        updatedAt: now
      };
    }

    // 3. New User from Google
    const userId = randomUUID();
    this.db.prepare(`
      INSERT INTO auth_users (id, email, password_hash, name, google_id, email_verified, created_at, updated_at)
      VALUES (?, ?, NULL, ?, ?, 1, ?, ?)
    `).run(userId, email, displayName, googleId, now, now);

    return {
      id: userId,
      email,
      name: displayName,
      googleId,
      emailVerified: true,
      createdAt: now,
      updatedAt: now
    };
  }

  // --- Session Management ---
  public createSession(userId: string, browserSessionId: string): AuthSession {
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(rawToken);
    const now = Date.now();
    const expiresAt = now + SESSION_LIFETIME_MS;

    this.db.prepare(`
      INSERT INTO auth_sessions (token_hash, user_id, browser_session_id, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(tokenHash, userId, browserSessionId, expiresAt, new Date(now).toISOString());

    const user = this.getUserById(userId);
    return {
      userId,
      email: user?.email || '',
      name: user?.name || null,
      browserSessionId,
      token: rawToken,
      expiresAt
    };
  }

  public resolveSession(rawToken: string | null | undefined): AuthSession | null {
    if (!rawToken || typeof rawToken !== 'string') return null;
    const tokenHash = hashToken(rawToken);
    const now = Date.now();

    const row = this.db.prepare(`
      SELECT s.token_hash, s.user_id, s.browser_session_id, s.expires_at, u.email, u.name
      FROM auth_sessions s
      JOIN auth_users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?
    `).get(tokenHash, now) as any;

    if (!row) return null;

    return {
      userId: row.user_id,
      email: row.email,
      name: row.name,
      browserSessionId: row.browser_session_id,
      token: rawToken,
      expiresAt: row.expires_at
    };
  }

  public destroySession(rawToken: string): void {
    const tokenHash = hashToken(rawToken);
    this.db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(tokenHash);
  }

  public destroyAllUserSessions(userId: string): void {
    this.db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(userId);
  }

  // --- Password Reset & Verification Tokens ---
  private createEmailToken(userId: string, type: 'verify_email' | 'password_reset', lifetimeMs: number): string {
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(rawToken);
    const now = Date.now();
    const expiresAt = now + lifetimeMs;

    this.db.prepare(`
      INSERT INTO auth_email_tokens (token_hash, user_id, type, expires_at, used, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(tokenHash, userId, type, expiresAt, new Date(now).toISOString());

    return rawToken;
  }

  public async requestPasswordReset(emailRaw: string, ip: string = 'unknown'): Promise<string | null> {
    const email = normalizeEmail(emailRaw);
    const rateCheck = this.checkRateLimit(`reset:${ip}`, 3, RATE_WINDOW_MS);
    if (!rateCheck.allowed) {
      throw new AuthServiceError(
        `Too many password reset requests. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
        'RATE_LIMITED',
        429
      );
    }

    const user = this.db.prepare('SELECT id FROM auth_users WHERE email = ?').get(email) as { id: string } | undefined;
    if (!user) {
      // Anti-enumeration: Return without error
      return null;
    }

    const resetToken = this.createEmailToken(user.id, 'password_reset', RESET_TOKEN_LIFETIME_MS);
    try {
      await this.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      this.db.prepare('DELETE FROM auth_email_tokens WHERE token_hash = ?').run(hashToken(resetToken));
      throw error;
    }
    return resetToken;
  }

  public async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    if (newPassword.length < 12) {
      throw new AuthServiceError('Password must be at least 12 characters long.', 'PASSWORD_TOO_SHORT');
    }
    if (newPassword.length > 256) {
      throw new AuthServiceError('Password cannot exceed 256 characters.', 'PASSWORD_TOO_LONG');
    }
    const tokenHash = hashToken(rawToken);
    const now = Date.now();

    const row = this.db.prepare(`
      SELECT user_id, expires_at, used
      FROM auth_email_tokens
      WHERE token_hash = ? AND type = 'password_reset'
    `).get(tokenHash) as { user_id: string; expires_at: number; used: number } | undefined;

    if (!row || row.used || now > row.expires_at) {
      throw new AuthServiceError('This password reset link is invalid or has expired.', 'INVALID_TOKEN', 400);
    }
    const consumed = this.db.prepare(`
      UPDATE auth_email_tokens SET used = 1
      WHERE token_hash = ? AND used = 0 AND expires_at >= ?
    `).run(tokenHash, now);
    if (consumed.changes !== 1) {
      throw new AuthServiceError('This password reset link is invalid or has expired.', 'INVALID_TOKEN', 400);
    }

    const hashedPassword = await hashPassword(newPassword);
    const isoNow = new Date().toISOString();

    this.db.prepare(`
      UPDATE auth_users SET password_hash = ?, updated_at = ? WHERE id = ?
    `).run(hashedPassword, isoNow, row.user_id);

    // Invalidate existing sessions for security
    this.destroyAllUserSessions(row.user_id);
  }

  public verifyEmailToken(rawToken: string): boolean {
    const tokenHash = hashToken(rawToken);
    const now = Date.now();

    const row = this.db.prepare(`
      SELECT user_id, expires_at, used
      FROM auth_email_tokens
      WHERE token_hash = ? AND type = 'verify_email'
    `).get(tokenHash) as { user_id: string; expires_at: number; used: number } | undefined;

    if (!row || row.used || now > row.expires_at) {
      return false;
    }

    this.db.prepare('UPDATE auth_users SET email_verified = 1 WHERE id = ?').run(row.user_id);
    this.db.prepare('UPDATE auth_email_tokens SET used = 1 WHERE token_hash = ?').run(tokenHash);
    return true;
  }

  public getUserById(userId: string): AuthUser | null {
    const row = this.db.prepare(`
      SELECT id, email, name, google_id, email_verified, created_at, updated_at
      FROM auth_users WHERE id = ?
    `).get(userId) as any;
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      googleId: row.google_id,
      emailVerified: Boolean(row.email_verified),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // --- Real Email Delivery / Fallback ---
  public async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${this.publicOrigin}/verify-email?token=${encodeURIComponent(token)}`;
    const subject = 'Verify your email address for ORCHESTRA';
    const text = `Welcome to ORCHESTRA! Please verify your email by clicking the following link:\n\n${verifyUrl}\n\nThis link will expire in 24 hours.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0f172a;">Welcome to ORCHESTRA</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.5;">Please confirm your email address to complete your account setup:</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Verify Email Address</a>
        </p>
        <p style="color: #94a3b8; font-size: 13px;">Or copy and paste this URL into your browser:<br><a href="${verifyUrl}" style="color: #2563eb;">${verifyUrl}</a></p>
      </div>
    `;
    await this.deliverEmail(email, subject, text, html);
  }

  public async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.publicOrigin}/reset-password?token=${encodeURIComponent(token)}`;
    const subject = 'Reset your password for ORCHESTRA';
    const text = `You requested a password reset for your ORCHESTRA account. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this, you can ignore this email.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0f172a;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.5;">Click the button below to choose a new password for your ORCHESTRA account:</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Reset Password</a>
        </p>
        <p style="color: #94a3b8; font-size: 13px;">This link will expire in 1 hour. If you did not request this, no action is needed.</p>
        <p style="color: #94a3b8; font-size: 13px;">Or copy and paste this URL:<br><a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a></p>
      </div>
    `;
    await this.deliverEmail(email, subject, text, html);
  }

  private async deliverEmail(to: string, subject: string, text: string, html: string): Promise<void> {
    const resendApiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.AUTH_EMAIL_FROM || process.env.EMAIL_FROM;
    if (!resendApiKey || !emailFrom) {
      console.log(`[AUTH-EMAIL-FALLBACK] To: ${to} | Subject: ${subject}\n${text}`);
      return;
    }
    const response = await this.fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: emailFrom, to, subject, html, text })
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`[AUTH-EMAIL-ERROR] Failed to send via Resend (${response.status}): ${errText}`);
      throw new Error(`Email delivery failed with status ${response.status}.`);
    }
  }

  public close(): void {
    try {
      this.db.close();
    } catch {}
  }
}
