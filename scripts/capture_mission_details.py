import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--window-size=1920,1080")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")

driver = webdriver.Chrome(options=chrome_options)
driver.get("http://localhost:3000/missions")
time.sleep(2)

# Save top
driver.save_screenshot("submission/assets/ui-03a-mission-top.png")

# Scroll to DAG section
driver.execute_script("window.scrollTo(0, 600);")
time.sleep(1)
driver.save_screenshot("submission/assets/ui-03b-mission-dag.png")

# Scroll to verification & deliverables
driver.execute_script("window.scrollTo(0, 1400);")
time.sleep(1)
driver.save_screenshot("submission/assets/ui-03c-mission-verification.png")

# Scroll to tools & results
driver.execute_script("window.scrollTo(0, 2200);")
time.sleep(1)
driver.save_screenshot("submission/assets/ui-03d-mission-results.png")

driver.quit()
print("Mission screenshots captured successfully!")
