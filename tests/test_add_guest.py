import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_add_guest(driver, base_url, credentials):
    """
    Test flow: Login -> Dashboard -> Navigate to an Event -> Add Guest -> Verify.
    Args:
        driver, base_url, credentials: Injected automatically by conftest.py
    """
    
    print("1. Navigating to Login Page...")
    driver.get(base_url)
    
    # --- Login ---
    wait = WebDriverWait(driver, 10)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))).send_keys(credentials['email'])
    driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(credentials['password'])
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    
    print("2. Looking for an event in Dashboard...")
    time.sleep(3) 
    
    # --- Find Event and Click Guest List ---
    try:
        guest_list_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[href*='/guests']")))
        print(f"   -> Found an event! Navigating to: {guest_list_btn.get_attribute('href')}")
        guest_list_btn.click()
    except:
        assert False, "❌ No events found in Dashboard! Create an event first."

    # --- Add Guest ---
    print("3. Adding a new guest...")
    
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
    
    # --- Verification ---
    print("4. Verifying guest was added...")
    time.sleep(2)
    
    if guest_name in driver.page_source:
        print("✅ TEST PASSED: Guest added successfully!")
    else:
        print("❌ TEST FAILED: Guest not found.")
        assert False, "Guest was not added to the list!"