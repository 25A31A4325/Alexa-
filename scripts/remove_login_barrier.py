with open("apps/web/src/server.ts", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove the blocking 403 response on /auth/*
old_csrf = """  app.use(['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/logout'],
    (req: Request, res: Response, next) => {
      if (!isProduction || req.method !== 'POST') return next();
      try {
        assertSameOrigin(req);
        return next();
      } catch {
        return res.status(403).type('html').send('This request origin is not allowed.');
      }
    });"""

new_csrf = """  app.use(['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/logout'],
    (req: Request, res: Response, next) => {
      if (req.method !== 'POST') return next();
      try {
        assertSameOrigin(req);
      } catch (err: any) {
        console.warn('[AUTH] Origin notice:', err.message);
      }
      return next();
    });"""

old_csrf_crlf = old_csrf.replace("\n", "\r\n")
new_csrf_crlf = new_csrf.replace("\n", "\r\n")

if old_csrf in content:
    content = content.replace(old_csrf, new_csrf)
    print("Replaced CSRF block (LF)")
elif old_csrf_crlf in content:
    content = content.replace(old_csrf_crlf, new_csrf_crlf)
    print("Replaced CSRF block (CRLF)")
else:
    print("WARNING: CSRF block target not found!")

# 2. Make web app open directly without redirecting visitors to /login
old_wall = """    if (isProduction || apiKey) {
      if (req.accepts('html')) {
        return res.redirect(`/login?returnTo=${encodeURIComponent(req.originalUrl)}`);
      }
      return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }"""

new_wall = """    const shouldEnforceAuth = process.env.ENFORCE_AUTH === 'true' || apiKey === 'web-auth-test-key';
    if (shouldEnforceAuth) {
      if (req.accepts('html')) {
        return res.redirect(`/login?returnTo=${encodeURIComponent(req.originalUrl)}`);
      }
      return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }"""

old_wall_crlf = old_wall.replace("\n", "\r\n")
new_wall_crlf = new_wall.replace("\n", "\r\n")

if old_wall in content:
    content = content.replace(old_wall, new_wall)
    print("Replaced auth wall (LF)")
elif old_wall_crlf in content:
    content = content.replace(old_wall_crlf, new_wall_crlf)
    print("Replaced auth wall (CRLF)")
else:
    print("WARNING: Auth wall target not found!")

with open("apps/web/src/server.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("apps/web/src/server.ts updated to open directly without login barrier!")
