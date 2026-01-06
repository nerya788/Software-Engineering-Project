import time
import os
from dotenv import load_dotenv

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
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
    Test flow: 
    1. Navigate to Auth Page.
    2. Fill Login Form.
    3. Verify successful login (Dashboard loads).
    4. Perform Logout using the Sidebar button ("התנתק").
    5. Verify redirection back to Login page.
    """
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    # Important: Set window size to ensure Sidebar is fully visible and not collapsed
    driver.set_window_size(1920, 1080)
    
    try:
        print("1. Navigating to Base URL...")
        driver.get(BASE_URL)
        
        wait = WebDriverWait(driver, 10)
        
        # --- Login Step ---
        print(f"2. Logging in with: {TEST_EMAIL}...")
        
        email_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
        email_input.clear()
        email_input.send_keys(TEST_EMAIL)
        
        pass_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        pass_input.clear()
        pass_input.send_keys(TEST_PASSWORD)
        
        # Click "Sign In" button
        submit_btn = driver.find_element(By.XPATH, "//button[contains(., 'Sign In')]")
        submit_btn.click()
        
        # --- Verify Login Success ---
        print("3. Verifying Dashboard access...")
        
        # Wait for "Wedding Planner" header
        wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Wedding Planner')]")))
        print("   -> Dashboard loaded successfully.")
        
        # --- Logout Step ---
        print("4. Testing Logout...")
        
        # FIX: Looking for "התנתק" (Disconnect) in the Sidebar
        logout_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'התנתק')]")))
        logout_btn.click()
        
        # --- Verify Logout Success ---
        print("5. Verifying redirection back to Login...")
        time.sleep(2)
        
        # Check if "Sign In" button exists again
        if driver.find_elements(By.XPATH, "//button[contains(., 'Sign In')]"):
             print("✅ TEST PASSED: Login and Logout flow works perfectly!")
        else:
             print("❌ TEST FAILED: Logout did not return to login screen.")

    except Exception as e:
        print(f"❌ An error occurred: {e}")
        
    finally:
        driver.quit()
        print("Browser closed.")

if __name__ == "__main__":
    run_test()