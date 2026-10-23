import requests

session = requests.Session()
base_url = "https://alexa-orchestra.onrender.com"

# Login
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
r_log = session.post(f"{base_url}/auth/login", headers=login_headers, data=login_data, allow_redirects=True, timeout=15)
print("Final Dashboard URL:", r_log.url)
print("Final Dashboard Status:", r_log.status_code)
print("Dashboard Title / Header present?:", "ORCHESTRA" in r_log.text or "Missions" in r_log.text)
print("Contains user email or logout link?:", "/auth/logout" in r_log.text)
