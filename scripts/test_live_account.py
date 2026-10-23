import requests

session = requests.Session()
base_url = "https://alexa-orchestra.onrender.com"
headers = {
    "Origin": base_url,
    "Referer": f"{base_url}/register",
    "Content-Type": "application/x-www-form-urlencoded"
}

# 1. Register test user
print("1. Testing account registration on live site...")
reg_data = {
    "name": "Live Test User",
    "email": "demo.judge.2026@gmail.com",
    "password": "StrongPassword2026!",
    "confirmPassword": "StrongPassword2026!",
    "returnTo": "/"
}
r_reg = session.post(f"{base_url}/auth/register", headers=headers, data=reg_data, allow_redirects=False, timeout=15)
print("Registration response status:", r_reg.status_code)
if "This request origin is not allowed" in r_reg.text:
    print("FAILED: Origin blocked")
else:
    print("Registration origin accepted cleanly!")

# 2. Test sign-in with the registered user
print("\n2. Testing login on live site...")
login_headers = {
    "Origin": base_url,
    "Referer": f"{base_url}/login",
    "Content-Type": "application/x-www-form-urlencoded"
}
login_data = {
    "email": "demo.judge.2026@gmail.com",
    "password": "StrongPassword2026!",
    "returnTo": "/"
}
r_log = session.post(f"{base_url}/auth/login", headers=login_headers, data=login_data, allow_redirects=False, timeout=15)
print("Login response status:", r_log.status_code)
print("Redirect location:", r_log.headers.get("Location"))
print("Set-Cookie header received?:", "orchestra_session" in str(r_log.headers.get("Set-Cookie")) or "orchestra_auth" in str(r_log.headers.get("Set-Cookie")))
