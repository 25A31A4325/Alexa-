with open("apps/web/src/server.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("assertSameOrigin(_req);", "assertSameOrigin(req);")
content = content.replace(
    "(_req: Request, _res: Response, next) => {\n      if (_req.method !== 'POST') return next();\n      try {\n        assertSameOrigin(req);",
    "(req: Request, _res: Response, next) => {\n      if (req.method !== 'POST') return next();\n      try {\n        assertSameOrigin(req);"
)

with open("apps/web/src/server.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Reverted other req names cleanly.")
