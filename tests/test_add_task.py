import time
import os
import datetime
from dotenv import load_dotenv

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
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
    Test flow: Login -> Dashboard -> Fill Task Form (Title + Date) -> Submit -> Verify.
    """
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    # Set window size large enough to see all columns
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
        
        # --- Wait for Dashboard ---
        print("2. detailed Dashboard loading...")
        # Wait for the main header to appear to ensure we are logged in
        wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Wedding Planner')]")))
        time.sleep(2) 
        
        # --- Locate Task Form ---
        print("3. Filling 'New Task' Form...")
        
        task_title = "Selenium Task"
        
        # 1. Fill Title
        # Unique placeholder from Dashboard.jsx: "למשל: לקבוע פגישה עם הצלם..."
        title_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[placeholder*='לקבוע פגישה']")))
        title_input.clear()
        title_input.send_keys(task_title)
        
        # 2. Fill Date (CRITICAL STEP - Required field)
        # We look for the input following the label "תאריך יעד" (Due Date)
        # This distinguishes it from the Event date which is just "תאריך"
        date_input = driver.find_element(By.XPATH, "//label[contains(., 'תאריך יעד')]/following-sibling::input")
        
        # Set a future date (tomorrow)
        future_date = (datetime.date.today() + datetime.timedelta(days=1)).strftime("%d-%m-%Y")
        
        # Send date keys. Note: Format depends on browser locale, usually dd-mm-yyyy works directly
        date_input.send_keys(future_date)
        # If the above doesn't work, we can try Tab keys to navigate parts of the date
        # date_input.send_keys(Keys.TAB) 
        
        # --- Submit ---
        print("4. Submitting form...")
        
        # Find the button with text "הוסף משימה לרשימה"
        add_task_btn = driver.find_element(By.XPATH, "//button[contains(., 'הוסף משימה לרשימה')]")
        
        # Scroll to button to ensure it's not covered
        driver.execute_script("arguments[0].scrollIntoView(true);", add_task_btn)
        time.sleep(1) # Small pause after scroll
        
        add_task_btn.click()
        
        # --- Assertion / Verification ---
        print("5. Verifying task was added...")
        
        # Wait for the UI to update (React needs a moment to fetch/render)
        time.sleep(3)
        
        # Check if the inputs were cleared (Success indication)
        # current_input_val = title_input.get_attribute("value")
        # if current_input_val != "":
        #     print("⚠️ Warning: Input field was not cleared, submission might have failed.")

        # Check for the task in the page source
        page_source = driver.page_source
        
        if task_title in page_source:
            print(f"✅ TEST PASSED: Task '{task_title}' added successfully!")
        else:
            print(f"❌ TEST FAILED: Task '{task_title}' was not found in the dashboard list.")
            
    except Exception as e:
        print(f"❌ An error occurred: {e}")
        
    finally:
        driver.quit()
        print("Browser closed.")

if __name__ == "__main__":
    run_test()