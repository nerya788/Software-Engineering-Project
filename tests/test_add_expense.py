import time
import os
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
    Test flow: Login -> Dashboard -> Find first event's Budget link -> Add Expense -> Verify.
    """
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    driver.set_window_size(1920, 1080)
    
    try:
        print("1. Navigating to Login Page...")
        driver.get(BASE_URL)
        
        # --- Login ---
        wait = WebDriverWait(driver, 10)
        email_field = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
        email_field.send_keys(TEST_EMAIL)
        driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(TEST_PASSWORD)
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        # --- Dynamic Navigation ---
        print("2. Looking for an event's Budget link in Dashboard...")
        time.sleep(3) # Wait for dashboard to load
        
        try:
            # Look for the link
            budget_link = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "a[href*='/budget']")))
            print(f"   -> Found event link: {budget_link.get_attribute('href')}")
            
            # FIX: Scroll to CENTER to avoid being hidden by sticky header
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", budget_link)
            time.sleep(1)
            
            # FIX: Force click via JavaScript (more robust)
            driver.execute_script("arguments[0].click();", budget_link)
            
        except Exception as e:
            # Print the REAL error
            print(f"   -> Detailed navigation error: {str(e)}")
            raise Exception("❌ Could not click the Budget link (see error above).")

        # --- Add Expense Flow ---
        print("3. Opening 'Add Expense' Modal...")
        
        # Look for the "New Expense" button
        add_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'הוצאה חדשה')]")))
        add_btn.click()
        
        print("4. Filling the form...")
        expense_title = "Selenium DJ Test"
        expense_cost = "2500"

        # Locate Name Input (using placeholder from your code)
        name_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[placeholder*='צלם מגנטים']")))
        
        # Locate Amount Input
        amount_input = driver.find_element(By.CSS_SELECTOR, "input[type='number']")
        
        name_input.clear()
        name_input.send_keys(expense_title)
        
        amount_input.clear()
        amount_input.send_keys(expense_cost)
        
        # --- Submit ---
        print("5. Submitting form...")
        save_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        save_btn.click()
        
        # --- Verification ---
        print("6. Verifying expense was added...")
        time.sleep(2) 
        
        if expense_title in driver.page_source:
            print(f"✅ TEST PASSED: Expense '{expense_title}' added successfully!")
        else:
            print(f"❌ TEST FAILED: Expense '{expense_title}' not found in the list.")

    except Exception as e:
        print(f"❌ An error occurred: {e}")
        
    finally:
        driver.quit()
        print("Browser closed.")

if __name__ == "__main__":
    run_test()