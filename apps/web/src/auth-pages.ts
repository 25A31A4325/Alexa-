export interface AuthPageOptions {
  error?: string | null;
  success?: string | null;
  returnTo?: string;
  email?: string;
  googleConfigured?: boolean;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const COMMON_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 24px;
    background: #070e1a;
    color: #f8fafc;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    letter-spacing: -0.01em;
  }
  .auth-card {
    width: 100%;
    max-width: 440px;
    padding: 36px 32px;
    background: #0d1524;
    border: 1px solid #1a273e;
    border-radius: 20px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45), 0 0 40px rgba(37, 99, 235, 0.08);
  }
  .brand-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 24px;
  }
  .brand-title {
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.02em;
    color: #ffffff;
  }
  .badge {
    background: rgba(14, 165, 233, 0.15);
    border: 1px solid rgba(14, 165, 233, 0.3);
    color: #38bdf8;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 6px;
    text-transform: uppercase;
  }
  h1 {
    font-size: 22px;
    font-weight: 700;
    color: #ffffff;
    text-align: center;
    margin-bottom: 8px;
  }
  p.subtitle {
    color: #8fa0b5;
    font-size: 13.5px;
    text-align: center;
    line-height: 1.5;
    margin-bottom: 28px;
  }
  .alert {
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 13px;
    line-height: 1.45;
    margin-bottom: 20px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .alert-error {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }
  .alert-success {
    background: rgba(34, 197, 94, 0.12);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #86efac;
  }
  .form-group {
    margin-bottom: 18px;
  }
  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 7px;
  }
  label {
    display: block;
    font-size: 12.5px;
    font-weight: 600;
    color: #cbd5e1;
  }
  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  input[type="text"],
  input[type="email"],
  input[type="password"] {
    width: 100%;
    padding: 12px 14px;
    background: #080f1b;
    border: 1px solid #1e2e47;
    border-radius: 10px;
    color: #ffffff;
    font-size: 14px;
    outline: none;
    transition: all 0.15s ease;
  }
  input[type="password"] {
    padding-right: 42px;
  }
  input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }
  .toggle-pwd-btn {
    position: absolute;
    right: 12px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #64748b;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s;
  }
  .toggle-pwd-btn:hover {
    color: #cbd5e1;
  }
  .btn-primary {
    width: 100%;
    padding: 12px;
    margin-top: 6px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
  }
  .btn-primary:hover {
    background: #1d4ed8;
    box-shadow: 0 6px 18px rgba(37, 99, 235, 0.45);
  }
  .btn-google {
    width: 100%;
    padding: 11px 16px;
    background: #ffffff;
    color: #1e293b;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .btn-google:hover {
    background: #f8fafc;
  }
  .divider {
    display: flex;
    align-items: center;
    text-align: center;
    margin: 22px 0;
    color: #475569;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .divider::before, .divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #1a273e;
  }
  .divider:not(:empty)::before { margin-right: 12px; }
  .divider:not(:empty)::after { margin-left: 12px; }
  .link {
    color: #38bdf8;
    text-decoration: none;
    font-size: 12.5px;
    font-weight: 500;
    transition: color 0.15s;
  }
  .link:hover {
    color: #7dd3fc;
    text-decoration: underline;
  }
  .card-footer {
    text-align: center;
    margin-top: 24px;
    font-size: 13px;
    color: #8fa0b5;
  }
  .password-hint {
    font-size: 11.5px;
    color: #64748b;
    margin-top: 6px;
  }
`;

const GOOGLE_SVG = `
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
  </svg>
`;

const EYE_ICONS_SCRIPT = `
  <script>
    function togglePassword(inputId, btn) {
      const input = document.getElementById(inputId);
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.innerHTML = isPassword
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    }
  </script>
`;

function renderHeader(): string {
  return `
    <div class="brand-header">
      <img src="/static/amazon-smile-logo.png" alt="Amazon Logo" style="height: 18px; width: auto;" />
      <span class="brand-title">ORCHESTRA</span>
      <span class="badge">Alexa+</span>
    </div>
  `;
}

// 1. Sign In Page (/login)
export function renderLoginPage(opts: AuthPageOptions = {}): string {
  const returnTo = opts.returnTo || '/';
  const escapedReturnTo = escapeHtml(returnTo);
  const emailValue = escapeHtml(opts.email || '');
  const googleConfigured = opts.googleConfigured !== false;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Sign in · ORCHESTRA Alexa+</title>
    <link rel="icon" type="image/png" href="/static/amazon-smile-logo.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>${COMMON_STYLES}</style>
  </head>
  <body>
    <main class="auth-card">
      ${renderHeader()}
      <h1>Welcome back</h1>
      <p class="subtitle">Sign in with your email and password to access your missions and tools.</p>

      ${opts.error ? `<div class="alert alert-error" role="alert"><span>${escapeHtml(opts.error)}</span></div>` : ''}
      ${opts.success ? `<div class="alert alert-success" role="status"><span>${escapeHtml(opts.success)}</span></div>` : ''}

      <form method="post" action="/auth/login" novalidate>
        <input type="hidden" name="returnTo" value="${escapedReturnTo}">

        <div class="form-group">
          <label for="email">Email address</label>
          <div class="input-wrapper" style="margin-top: 6px;">
            <input id="email" name="email" type="email" autocomplete="email" required autofocus value="${emailValue}" placeholder="name@example.com">
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label for="password">Password</label>
            <a href="/forgot-password" class="link">Forgot password?</a>
          </div>
          <div class="input-wrapper">
            <input id="password" name="password" type="password" autocomplete="current-password" required placeholder="••••••••">
            <button type="button" class="toggle-pwd-btn" onclick="togglePassword('password', this)" aria-label="Toggle password visibility">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
        </div>

        <button type="submit" class="btn-primary">Sign in</button>
      </form>

      <div class="divider">or</div>

      ${googleConfigured ? `
        <a href="/auth/google?returnTo=${encodeURIComponent(returnTo)}" class="btn-google">
          ${GOOGLE_SVG}
          <span>Continue with Google</span>
        </a>
      ` : `
        <button type="button" class="btn-google" style="opacity: 0.6; cursor: not-allowed;" title="Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_AUTH_REDIRECT_URI in the server environment">
          ${GOOGLE_SVG}
          <span>Continue with Google</span>
        </button>
        <p class="password-hint">To enable Google sign-in, configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_AUTH_REDIRECT_URI on the server, then add the callback URL in Google Cloud Console.</p>
      `}

      <div class="card-footer">
        Don't have an account? <a href="/register?returnTo=${escapedReturnTo}" class="link" style="font-weight: 600;">Create account</a>
      </div>
    </main>
    ${EYE_ICONS_SCRIPT}
  </body>
</html>`;
}

// 2. Register Page (/register)
export function renderRegisterPage(opts: AuthPageOptions = {}): string {
  const returnTo = opts.returnTo || '/';
  const escapedReturnTo = escapeHtml(returnTo);
  const emailValue = escapeHtml(opts.email || '');
  const googleConfigured = opts.googleConfigured !== false;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Create Account · ORCHESTRA Alexa+</title>
    <link rel="icon" type="image/png" href="/static/amazon-smile-logo.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>${COMMON_STYLES}</style>
  </head>
  <body>
    <main class="auth-card">
      ${renderHeader()}
      <h1>Create your account</h1>
      <p class="subtitle">Get started with agentic missions, tools, and orchestration.</p>

      ${opts.error ? `<div class="alert alert-error" role="alert"><span>${escapeHtml(opts.error)}</span></div>` : ''}
      ${opts.success ? `<div class="alert alert-success" role="status"><span>${escapeHtml(opts.success)}</span></div>` : ''}

      <form method="post" action="/auth/register" novalidate>
        <input type="hidden" name="returnTo" value="${escapedReturnTo}">

        <div class="form-group">
          <label for="name">Full name (optional)</label>
          <div class="input-wrapper" style="margin-top: 6px;">
            <input id="name" name="name" type="text" autocomplete="name" placeholder="Alex Morgan">
          </div>
        </div>

        <div class="form-group">
          <label for="email">Email address</label>
          <div class="input-wrapper" style="margin-top: 6px;">
            <input id="email" name="email" type="email" autocomplete="email" required autofocus value="${emailValue}" placeholder="name@example.com">
          </div>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="input-wrapper" style="margin-top: 6px;">
            <input id="password" name="password" type="password" autocomplete="new-password" minlength="12" required placeholder="••••••••">
            <button type="button" class="toggle-pwd-btn" onclick="togglePassword('password', this)" aria-label="Toggle password visibility">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
          <p class="password-hint">Must be at least 12 characters long.</p>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm password</label>
          <div class="input-wrapper" style="margin-top: 6px;">
            <input id="confirmPassword" name="confirmPassword" type="password" autocomplete="new-password" required placeholder="••••••••">
            <button type="button" class="toggle-pwd-btn" onclick="togglePassword('confirmPassword', this)" aria-label="Toggle password visibility">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
        </div>

        <button type="submit" class="btn-primary">Create account</button>
      </form>

      <div class="divider">or</div>

      ${googleConfigured ? `
        <a href="/auth/google?returnTo=${encodeURIComponent(returnTo)}" class="btn-google">
          ${GOOGLE_SVG}
          <span>Continue with Google</span>
        </a>
      ` : `
        <button type="button" class="btn-google" style="opacity: 0.6; cursor: not-allowed;" title="Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_AUTH_REDIRECT_URI in the server environment">
          ${GOOGLE_SVG}
          <span>Continue with Google</span>
        </button>
        <p class="password-hint">To enable Google sign-in, configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_AUTH_REDIRECT_URI on the server, then add the callback URL in Google Cloud Console.</p>
      `}

      <div class="card-footer">
        Already have an account? <a href="/login?returnTo=${escapedReturnTo}" class="link" style="font-weight: 600;">Sign in</a>
      </div>
    </main>
    ${EYE_ICONS_SCRIPT}
  </body>
</html>`;
}

// 3. Forgot Password Page (/forgot-password)
export function renderForgotPasswordPage(opts: AuthPageOptions = {}): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reset Password · ORCHESTRA Alexa+</title>
    <link rel="icon" type="image/png" href="/static/amazon-smile-logo.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>${COMMON_STYLES}</style>
  </head>
  <body>
    <main class="auth-card">
      ${renderHeader()}
      <h1>Reset your password</h1>
      <p class="subtitle">Enter your account's email address and we will send you a password reset link.</p>

      ${opts.error ? `<div class="alert alert-error" role="alert"><span>${escapeHtml(opts.error)}</span></div>` : ''}
      ${opts.success ? `<div class="alert alert-success" role="status"><span>${escapeHtml(opts.success)}</span></div>` : ''}

      ${!opts.success ? `
        <form method="post" action="/auth/forgot-password" novalidate>
          <div class="form-group">
            <label for="email">Email address</label>
            <div class="input-wrapper" style="margin-top: 6px;">
              <input id="email" name="email" type="email" autocomplete="email" required autofocus value="${escapeHtml(opts.email || '')}" placeholder="name@example.com">
            </div>
          </div>

          <button type="submit" class="btn-primary">Send reset link</button>
        </form>
      ` : ''}

      <div class="card-footer">
        Remembered your password? <a href="/login" class="link" style="font-weight: 600;">Back to Sign in</a>
      </div>
    </main>
  </body>
</html>`;
}

// 4. Reset Password Page (/reset-password)
export function renderResetPasswordPage(token: string, opts: AuthPageOptions = {}): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Set New Password · ORCHESTRA Alexa+</title>
    <link rel="icon" type="image/png" href="/static/amazon-smile-logo.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>${COMMON_STYLES}</style>
  </head>
  <body>
    <main class="auth-card">
      ${renderHeader()}
      <h1>Set a new password</h1>
      <p class="subtitle">Choose a new, strong password for your account.</p>

      ${opts.error ? `<div class="alert alert-error" role="alert"><span>${escapeHtml(opts.error)}</span></div>` : ''}

      <form method="post" action="/auth/reset-password" novalidate>
        <input type="hidden" name="token" value="${escapeHtml(token)}">

        <div class="form-group">
          <label for="password">New password</label>
          <div class="input-wrapper" style="margin-top: 6px;">
            <input id="password" name="password" type="password" autocomplete="new-password" minlength="12" required autofocus placeholder="••••••••">
            <button type="button" class="toggle-pwd-btn" onclick="togglePassword('password', this)" aria-label="Toggle password visibility">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
          <p class="password-hint">Must be at least 12 characters long.</p>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm new password</label>
          <div class="input-wrapper" style="margin-top: 6px;">
            <input id="confirmPassword" name="confirmPassword" type="password" autocomplete="new-password" required placeholder="••••••••">
            <button type="button" class="toggle-pwd-btn" onclick="togglePassword('confirmPassword', this)" aria-label="Toggle password visibility">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
        </div>

        <button type="submit" class="btn-primary">Update password</button>
      </form>

      <div class="card-footer">
        <a href="/login" class="link">Back to Sign in</a>
      </div>
    </main>
    ${EYE_ICONS_SCRIPT}
  </body>
</html>`;
}

// 5. Verify Email Page (/verify-email)
export function renderVerifyEmailPage(success: boolean): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verify Email · ORCHESTRA Alexa+</title>
    <link rel="icon" type="image/png" href="/static/amazon-smile-logo.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>${COMMON_STYLES}</style>
  </head>
  <body>
    <main class="auth-card" style="text-align: center;">
      ${renderHeader()}
      ${success ? `
        <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #4ade80;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h1>Email verified</h1>
        <p class="subtitle">Your email address has been confirmed successfully. You can now access all ORCHESTRA features.</p>
        <a href="/" class="btn-primary" style="display: block; text-decoration: none;">Proceed to Dashboard</a>
      ` : `
        <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #f87171;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </div>
        <h1>Verification link invalid</h1>
        <p class="subtitle">This verification link has expired or has already been used.</p>
        <a href="/login" class="btn-primary" style="display: block; text-decoration: none;">Return to Sign in</a>
      `}
    </main>
  </body>
</html>`;
}
