with open("apps/web/src/auth.ts", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update insert in register
old_insert = """    this.db.prepare(`
      INSERT INTO auth_users (id, email, password_hash, name, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `).run(userId, email, hashed, displayName, now, now);"""

new_insert = """    const emailVerified = process.env.RESEND_API_KEY ? 0 : 1;
    this.db.prepare(`
      INSERT INTO auth_users (id, email, password_hash, name, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, email, hashed, displayName, emailVerified, now, now);"""

old_ins_crlf = old_insert.replace("\n", "\r\n")
new_ins_crlf = new_insert.replace("\n", "\r\n")

if old_insert in content:
    content = content.replace(old_insert, new_insert)
    print("Replaced insert (LF)")
elif old_ins_crlf in content:
    content = content.replace(old_ins_crlf, new_ins_crlf)
    print("Replaced insert (CRLF)")
else:
    print("WARNING: Insert target not found!")

# 2. Update check in login
old_chk = """    if (!row.email_verified) {
      throw new AuthServiceError('Verify your email address before signing in.', 'EMAIL_NOT_VERIFIED', 403);
    }"""

new_chk = """    if (!row.email_verified && process.env.RESEND_API_KEY) {
      throw new AuthServiceError('Verify your email address before signing in.', 'EMAIL_NOT_VERIFIED', 403);
    }"""

old_chk_crlf = old_chk.replace("\n", "\r\n")
new_chk_crlf = new_chk.replace("\n", "\r\n")

if old_chk in content:
    content = content.replace(old_chk, new_chk)
    print("Replaced login check (LF)")
elif old_chk_crlf in content:
    content = content.replace(old_chk_crlf, new_chk_crlf)
    print("Replaced login check (CRLF)")
else:
    print("WARNING: Login check target not found!")

with open("apps/web/src/auth.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("apps/web/src/auth.ts updated.")
