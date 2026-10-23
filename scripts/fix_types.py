with open("apps/web/src/server.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_block = """    const allowedHosts = new Set<string>();
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
    }"""

new_block = """    const allowedHosts = new Set<string>();
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
    }"""

old_crlf = old_block.replace("\n", "\r\n")
new_crlf = new_block.replace("\n", "\r\n")

if old_block in content:
    content = content.replace(old_block, new_block)
    print("Replaced with type-safe block (LF)")
elif old_crlf in content:
    content = content.replace(old_crlf, new_crlf)
    print("Replaced with type-safe block (CRLF)")
else:
    print("WARNING: Target block not found!")

with open("apps/web/src/server.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Server.ts updated.")
