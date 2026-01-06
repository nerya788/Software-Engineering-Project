import time
import os
import datetime
from dotenv import load_dotenv

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- Load Configuration ---
load_dotenv()

# --- Configuration Switch ---
IS_LOCAL_MODE = False

if IS_LOCAL_MODE:
    BASE_URL = os.getenv("LOCAL_RUN_URL")
    print(f"--- Running in LOCAL mode: {BASE_URL} ---")
else:
    BASE_URL = os.getenv("RENDER_RUN_URL")
    print(f"--- Running in PRODUCTION mode: {BASE_URL} ---")

# --- Load Secrets from .env ---
TEST_EMAIL = os.getenv("TEST_EMAIL")
TEST_PASSWORD = os.getenv("TEST_PASSWORD")

def run_test():
    """
    Test flow: Login -> Scroll to 'New Event' form -> Fill details -> Submit -> Verify in list.
    """
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    driver.set_window_size(1920, 1080)
    
    try:
        print("1. Navigating to Login Page...")
        driver.get(BASE_URL)
        
        # --- Login ---
        wait = WebDriverWait(driver, 10)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))).send_keys(TEST_EMAIL)
        driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(TEST_PASSWORD)
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        # --- Wait for Dashboard ---
        print("2. Dashboard loaded...")
        wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Wedding Planner')]")))
        time.sleep(2)
        
        # --- Locate 'New Event' Form ---
        print("3. Locating 'New Event' form...")
        
        # Strategy: Find the Header "אירוע חדש" (New Event) to ensure we are in the right section
        new_event_header = driver.find_element(By.XPATH, "//h3[contains(., 'אירוע חדש')]")
        
        # Scroll to it so inputs are visible
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", new_event_header)
        time.sleep(1)
        
        # --- Fill Form ---
        event_title = "Selenium Big Wedding"
        future_date = (datetime.date.today() + datetime.timedelta(days=30)).strftime("%d-%m-%Y")
        
        # 1. Title Input
        # Unique placeholder from Dashboard.jsx: "למשל: חינה / שבת חתן / חתונה"
        title_input = driver.find_element(By.CSS_SELECTOR, "input[placeholder*='חינה']")
        title_input.clear()
        title_input.send_keys(event_title)
        
        # 2. Date Input
        # Strategy: Use XPath to find the input type='date' specifically inside the New Event form area
        # We look for the form that is a sibling of the 'New Event' header
        date_input = driver.find_element(By.XPATH, "//h3[contains(., 'אירוע חדש')]/following-sibling::form//input[@type='date']")
        date_input.send_keys(future_date)
        
        # 3. Description (Optional)
        desc_input = driver.find_element(By.CSS_SELECTOR, "input[placeholder='פרטים...']")
        desc_input.send_keys("Automated event creation test")

        # --- Submit ---
        print("4. Submitting form...")
        # Find button with text "צור אירוע חדש"
        submit_btn = driver.find_element(By.XPATH, "//button[contains(., 'צור אירוע חדש')]")
        
        # Use JS click to avoid sticky header overlapping issues
        driver.execute_script("arguments[0].click();", submit_btn)
        
        # --- Verification ---
        print("5. Verifying event was created...")
        time.sleep(3) # Wait for backend refresh
        
        page_source = driver.page_source
        
        # Check if the title appears in the dashboard
        if event_title in page_source:
            print(f"✅ TEST PASSED: Event '{event_title}' created successfully!")
        else:
            print(f"❌ TEST FAILED: Event '{event_title}' not found in the list.")
            
    except Exception as e:
        print(f"❌ An error occurred: {e}")
        
    finally:
        driver.quit()
        print("Browser closed.")

if __name__ == "__main__":
    run_test()