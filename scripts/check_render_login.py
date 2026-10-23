import requests

try:
    r = requests.get('https://alexa-orchestra.onrender.com/login', timeout=15)
    print('HTTP Status:', r.status_code)
    print('Old "App access key" form present?:', 'App access key' in r.text)
    print('New Email/Password form present?:', 'Email address' in r.text)
except Exception as e:
    print('Request error:', e)
