with open("apps/web/src/server.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "(req: Request, res: Response, next) => {\n      if (req.method !== 'POST') return next();",
    "(_req: Request, _res: Response, next) => {\n      if (_req.method !== 'POST') return next();"
)
content = content.replace(
    "assertSameOrigin(req);",
    "assertSameOrigin(_req);"
)

with open("apps/web/src/server.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed unused res parameter.")
