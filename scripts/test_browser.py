import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--window-size=1920,1080")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")

try:
    print("Initializing Chrome Driver...")
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    print("Navigating to https://alexa-orchestra.onrender.com ...")
    driver.get("https://alexa-orchestra.onrender.com")
    time.sleep(4)
    print("Title:", driver.title)
    driver.save_screenshot("submission/assets/live_homepage.png")
    print("Screenshot saved to submission/assets/live_homepage.png successfully!")
    driver.quit()
except Exception as e:
    print("Error:", e)
