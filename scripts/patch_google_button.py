with open("apps/web/src/auth-pages.ts", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update login page Continue with Google button
old_login_google = """      ${googleConfigured ? `
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
      `}"""

new_login_google = """      <a href="/auth/google?returnTo=${encodeURIComponent(returnTo)}" class="btn-google">
        ${GOOGLE_SVG}
        <span>Continue with Google</span>
      </a>
      ${!googleConfigured ? `
        <p class="password-hint" style="text-align: center; margin-top: 8px; font-size: 11px;">
          To activate Google sign-in, configure GOOGLE_CLIENT_ID &amp; GOOGLE_CLIENT_SECRET in your deployment settings.
        </p>
      ` : ''}"""

old_login_crlf = old_login_google.replace("\n", "\r\n")
new_login_crlf = new_login_google.replace("\n", "\r\n")

if old_login_google in content:
    content = content.replace(old_login_google, new_login_google)
    print("Replaced login Google button (LF)")
elif old_login_crlf in content:
    content = content.replace(old_login_crlf, new_login_crlf)
    print("Replaced login Google button (CRLF)")
else:
    print("WARNING: Login Google button target not found!")

# 2. Update register page Continue with Google button
old_reg_google = """      ${googleConfigured ? `
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
      `}"""

new_reg_google = """      <a href="/auth/google?returnTo=${encodeURIComponent(returnTo)}" class="btn-google">
        ${GOOGLE_SVG}
        <span>Continue with Google</span>
      </a>
      ${!googleConfigured ? `
        <p class="password-hint" style="text-align: center; margin-top: 8px; font-size: 11px;">
          To activate Google sign-in, configure GOOGLE_CLIENT_ID &amp; GOOGLE_CLIENT_SECRET in your deployment settings.
        </p>
      ` : ''}"""

old_reg_crlf = old_reg_google.replace("\n", "\r\n")
new_reg_crlf = new_reg_google.replace("\n", "\r\n")

if old_reg_google in content:
    content = content.replace(old_reg_google, new_reg_google)
    print("Replaced register Google button (LF)")
elif old_reg_crlf in content:
    content = content.replace(old_reg_crlf, new_reg_crlf)
    print("Replaced register Google button (CRLF)")
else:
    print("WARNING: Register Google button target not found!")

with open("apps/web/src/auth-pages.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("apps/web/src/auth-pages.ts patched successfully!")
