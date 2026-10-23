import requests

url = "https://alexa-orchestra.onrender.com/auth/login"
headers = {
    "Origin": "https://alexa-orchestra.onrender.com",
    "Referer": "https://alexa-orchestra.onrender.com/login",
    "Content-Type": "application/x-www-form-urlencoded"
}
data = {
    "email": "test@example.com",
    "password": "wrongpassword123",
    "returnTo": "/"
}

r = requests.post(url, headers=headers, data=data, allow_redirects=False, timeout=15)
print("HTTP Status:", r.status_code)
print("Response text snippet:", r.text[:300])
if "This request origin is not allowed" in r.text:
    print("RESULT: CSRF STILL BLOCKED (Old build still running)")
else:
    print("RESULT: CSRF PASSED! Origin successfully accepted!")
