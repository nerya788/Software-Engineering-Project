import time
import os
from dotenv import load_dotenv

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import Select
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- Load Configuration from .env ---
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
    Test flow: Login -> Navigate to Global Vendors Page -> Add Vendor -> Verify.
    """
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    
    # CRITICAL FIX: Set window size to ensure responsive elements are visible.
    # Your React code hides the "New Vendor" text on small screens ("hidden sm:inline").
    driver.set_window_size(1920, 1080)
    
    try:
        print("1. Navigating to Login Page...")
        driver.get(BASE_URL)
        
        # --- Login Step ---
        wait = WebDriverWait(driver, 10)
        
        email_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
        password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        
        email_input.send_keys(TEST_EMAIL)
        password_input.send_keys(TEST_PASSWORD)
        submit_btn.click()
        
        # --- Navigate to Vendors Page ---
        print("2. Navigating to Vendors Page...")
        time.sleep(3) # Wait for login to complete
        
        # CORRECT ROUTE based on your App.jsx:
        vendors_url = f"{BASE_URL}/vendors"
        driver.get(vendors_url)
        
        # --- OPEN FORM ---
        print("3. Opening 'New Vendor' Form...")
        
        # Now that window is large, we can safely search for the text "ספק חדש"
        add_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'ספק חדש')]")))
        add_btn.click()
        
        # --- Fill Form ---
        print("4. Filling the form...")
        
        vendor_name = "Selenium Music Service"
        vendor_phone = "0509998877"
        vendor_price = "4500"
        
        # 1. Vendor Name Input (placeholder="שם העסק / הספק *")
        name_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[placeholder*='שם העסק']")))
        name_input.clear()
        name_input.send_keys(vendor_name)
        
        # 2. Category Select (Value='Music')
        select_element = driver.find_element(By.TAG_NAME, "select")
        select = Select(select_element)
        select.select_by_value("Music")
        
        # 3. Phone Input (placeholder="טלפון (אופציונלי)")
        phone_input = driver.find_element(By.CSS_SELECTOR, "input[placeholder*='טלפון']")
        phone_input.send_keys(vendor_phone)
        
        # 4. Price Estimate Input (type="number")
        price_input = driver.find_element(By.CSS_SELECTOR, "input[type='number']")
        price_input.send_keys(vendor_price)

        # --- Submit ---
        print("5. Submitting form...")
        
        # Find button by text "שמור ספק"
        save_btn = driver.find_element(By.XPATH, "//button[contains(., 'שמור ספק')]")
        save_btn.click()
        
        # --- Assertion / Verification ---
        print("6. Verifying vendor was added...")
        
        time.sleep(3) # Wait for backend save and list refresh
        
        page_source = driver.page_source
        
        if vendor_name in page_source:
            print(f"✅ TEST PASSED: Vendor '{vendor_name}' added successfully!")
        else:
            print(f"❌ TEST FAILED: Vendor '{vendor_name}' not found in the list.")
            
    except Exception as e:
        print(f"❌ An error occurred: {e}")
        
    finally:
        driver.quit()
        print("Browser closed.")

if __name__ == "__main__":
    run_test()