import requests

r = requests.get('http://localhost:3000/login')
print('Status:', r.status_code)
print('Contains App access key?:', 'App access key' in r.text)
print('Contains email input?:', 'name="email"' in r.text)
print('Contains password input?:', 'name="password"' in r.text)
