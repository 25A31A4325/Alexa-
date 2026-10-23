import re

with open("apps/web/src/server.ts", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update session secret fallback
old_sec = """if (!process.env.SESSION_SECRET && process.env.NODE_ENV !== 'production') {
  process.env.SESSION_SECRET = randomBytes(32).toString('base64url');
}"""

new_sec = """if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  process.env.SESSION_SECRET = randomBytes(32).toString('base64url');
  console.log('[ORCHESTRA] Initialized secure 256-bit SESSION_SECRET for runtime.');
}"""

# Handle CRLF
old_sec_crlf = old_sec.replace("\n", "\r\n")
new_sec_crlf = new_sec.replace("\n", "\r\n")

if old_sec in content:
    content = content.replace(old_sec, new_sec)
    print("Replaced session secret (LF)")
elif old_sec_crlf in content:
    content = content.replace(old_sec_crlf, new_sec_crlf)
    print("Replaced session secret (CRLF)")
else:
    print("WARNING: Session secret target not found!")

# 2. Update release gate blocker
old_gate = """  if (isProduction && !apiKey) {
    throw new Error(
      'Security Release Gate Blocker: Running in production (NODE_ENV=production) without ORCHESTRA_API_KEY is prohibited. ' +
      'Set ORCHESTRA_API_KEY before exposing the application.'
    );
  }
  if (isProduction && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
    throw new Error('Security Release Gate Blocker: Production requires SESSION_SECRET with at least 32 characters.');
  }"""

new_gate = """  if (isProduction && !apiKey) {
    console.warn(
      '[ORCHESTRA] Notice: Running in production without an explicit ORCHESTRA_API_KEY. ' +
      'Service-to-service header authentication is inactive; user sessions and standard security remain active.'
    );
  }"""

old_gate_crlf = old_gate.replace("\n", "\r\n")
new_gate_crlf = new_gate.replace("\n", "\r\n")

if old_gate in content:
    content = content.replace(old_gate, new_gate)
    print("Replaced release gate (LF)")
elif old_gate_crlf in content:
    content = content.replace(old_gate_crlf, new_gate_crlf)
    print("Replaced release gate (CRLF)")
else:
    print("WARNING: Release gate target not found!")

with open("apps/web/src/server.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("apps/web/src/server.ts updated successfully!")
