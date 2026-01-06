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
        
        print("2. Looking for an event in Dashboard...")
        time.sleep(3) 
        
        # --- DYNAMIC STEP: Find the first event card and click "Guest List" ---
        # We look for any link that contains the word "guests" in its href
        # This corresponds to your Dashboard link: to={`/events/${ev.id}/guests`}
        try:
            guest_list_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[href*='/guests']")))
            print(f"   -> Found an event! Navigating to: {guest_list_btn.get_attribute('href')}")
            guest_list_btn.click()
        except:
            raise Exception("❌ No events found in Dashboard! Create an event first.")

        # --- Now we are inside the specific event, generic code continues ---
        print("3. Adding a new guest...")
        
        # Wait for form
        name_input = wait.until(EC.presence_of_element_located((By.NAME, "fullName")))
        phone_input = driver.find_element(By.NAME, "phone")
        amount_input = driver.find_element(By.NAME, "amountInvited")
        
        guest_name = "Selenium Test Guest"
        
        name_input.send_keys(guest_name)
        phone_input.send_keys("0501234567")
        amount_input.clear()
        amount_input.send_keys("3")
        
        # Submit
        driver.find_element(By.CSS_SELECTOR, "form button[type='submit']").click()
        
        # Verify
        print("4. Verifying guest was added...")
        time.sleep(2)
        if guest_name in driver.page_source:
            print("✅ TEST PASSED: Guest added successfully to the first available event!")
        else:
            print("❌ TEST FAILED: Guest not found.")
            
    except Exception as e:
        print(f"❌ An error occurred: {e}")
        
    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()