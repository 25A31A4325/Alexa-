import requests

endpoints = [
    ("GET /api/health", "https://alexa-orchestra.onrender.com/api/health"),
    ("GET /login", "https://alexa-orchestra.onrender.com/login"),
    ("GET /register", "https://alexa-orchestra.onrender.com/register"),
    ("GET /forgot-password", "https://alexa-orchestra.onrender.com/forgot-password"),
]

print("=== LIVE RENDER VERIFICATION ===")
for name, url in endpoints:
    r = requests.get(url, timeout=15)
    print(f"{name}: HTTP {r.status_code}")
    if name == "GET /login":
        has_access_key = "App access key" in r.text
        has_email = "Email address" in r.text
        has_password = "Password" in r.text
        print(f"  - Contains 'App access key'?: {has_access_key}")
        print(f"  - Contains 'Email address'?: {has_email}")
        print(f"  - Contains 'Password'?: {has_password}")
        if not has_access_key and has_email:
            print("  ==> ACCESS KEY IS COMPLETELY REMOVED! EMAIL LOGIN ACTIVE!")
