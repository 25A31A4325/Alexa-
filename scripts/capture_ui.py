import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--window-size=1920,1080")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")

driver = webdriver.Chrome(options=chrome_options)

routes = [
    ("/", "ui-01-dashboard.png"),
    ("/new", "ui-02-new-mission.png"),
    ("/missions", "ui-03-missions-list.png"),
    ("/tools", "ui-04-mcp-tools.png"),
    ("/integrations", "ui-05-integrations.png"),
    ("/activity", "ui-06-activity-ledger.png"),
    ("/knowledge", "ui-07-knowledge-hub.png")
]

for path, filename in routes:
    url = f"http://localhost:3000{path}"
    driver.get(url)
    time.sleep(2)
    out_path = f"submission/assets/{filename}"
    driver.save_screenshot(out_path)
    print(f"Captured {path} -> {out_path} (Title: {driver.title})")

driver.quit()
