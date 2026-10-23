import requests
import time

url = "https://alexa-orchestra.onrender.com/"

for attempt in range(1, 10):
    try:
        r = requests.get(url, allow_redirects=False, timeout=15)
        print(f"Attempt {attempt}: Status {r.status_code}")
        if r.status_code == 200:
            print("SUCCESS! Root path opens directly with 200 OK without login redirect!")
            break
        elif r.status_code == 302:
            print(f"  Redirecting to: {r.headers.get('Location')} (Deploy still in progress...)")
    except Exception as e:
        print("  Error:", e)
    time.sleep(10)
