with open("apps/web/src/server.ts", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add app.set('trust proxy', 1);
old_app = """  const app = express();
  app.use(express.json({ limit: '1mb' }));"""

new_app = """  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));"""

old_app_crlf = old_app.replace("\n", "\r\n")
new_app_crlf = new_app.replace("\n", "\r\n")

if old_app in content:
    content = content.replace(old_app, new_app)
    print("Added trust proxy (LF)")
elif old_app_crlf in content:
    content = content.replace(old_app_crlf, new_app_crlf)
    print("Added trust proxy (CRLF)")
else:
    print("WARNING: express() target not found!")

# 2. Replace assertSameOrigin
old_origin = """  function assertSameOrigin(req: Request): void {
    const fetchSite = req.header('sec-fetch-site');
    if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'same-site' && fetchSite !== 'none') {
      throw new IntegrationServiceError('Cross-site integration requests are not allowed.', 'CSRF_REJECTED', 403);
    }
    const origin = req.header('origin');
    if (!origin) throw new IntegrationServiceError('The browser request origin is missing.', 'CSRF_REJECTED', 403);
    const allowedHosts = new Set([req.header('x-forwarded-host'), req.get('host')].filter(Boolean));
    if (process.env.PUBLIC_APP_ORIGIN) {
      try {
        allowedHosts.add(new URL(process.env.PUBLIC_APP_ORIGIN).host);
      } catch {
        throw new Error('PUBLIC_APP_ORIGIN must be a valid absolute URL.');
      }
    }
    let originHost: string;
    try {
      const parsed = new URL(origin);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error();
      originHost = parsed.host;
    } catch {
      throw new IntegrationServiceError('The browser request origin is invalid.', 'CSRF_REJECTED', 403);
    }
    if (!allowedHosts.has(originHost)) {
      throw new IntegrationServiceError('The browser request origin did not match this application.', 'CSRF_REJECTED', 403);
    }
  }"""

new_origin = """  function assertSameOrigin(req: Request): void {
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
      allowedHosts.add(hostHeader.split(':')[0]);
    }
    const xForwardedHost = req.header('x-forwarded-host');
    if (xForwardedHost) {
      for (const h of xForwardedHost.split(',')) {
        const trimmed = h.trim();
        allowedHosts.add(trimmed);
        allowedHosts.add(trimmed.split(':')[0]);
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

    const originHostname = originHost.split(':')[0];
    if (
      !allowedHosts.has(originHost) &&
      !allowedHosts.has(originHostname) &&
      !originHostname.endsWith('.onrender.com')
    ) {
      console.warn(`[CSRF] Rejected origin: ${originHost}. Allowed: ${Array.from(allowedHosts).join(', ')}`);
      throw new IntegrationServiceError('The browser request origin did not match this application.', 'CSRF_REJECTED', 403);
    }
  }"""

old_origin_crlf = old_origin.replace("\n", "\r\n")
new_origin_crlf = new_origin.replace("\n", "\r\n")

if old_origin in content:
    content = content.replace(old_origin, new_origin)
    print("Replaced assertSameOrigin (LF)")
elif old_origin_crlf in content:
    content = content.replace(old_origin_crlf, new_origin_crlf)
    print("Replaced assertSameOrigin (CRLF)")
else:
    print("WARNING: assertSameOrigin target not found!")

with open("apps/web/src/server.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("apps/web/src/server.ts updated!")
