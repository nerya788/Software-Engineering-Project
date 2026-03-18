import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_login_and_logout(driver, base_url, credentials):
    """
    Test flow: 
    1. Navigate to Auth Page.
    2. Fill Login Form.
    3. Verify successful login (Dashboard loads).
    4. Perform Logout using the Sidebar button.
    5. Verify redirection back to Login page.
    Args:
        driver, base_url, credentials: Injected automatically by conftest.py
    """
    
    print("1. Navigating to Base URL...")
    driver.get(base_url)
    
    wait = WebDriverWait(driver, 10)
    
    # --- Login Step ---
    print(f"2. Logging in with: {credentials['email']}...")
    
    email_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
    email_input.clear()
    email_input.send_keys(credentials['email'])
    
    pass_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    pass_input.clear()
    pass_input.send_keys(credentials['password'])
    
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
    
    # FIX: Looking for "Disconnect" (Hebrew: 'התנתק') in the Sidebar
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
         assert False, "Logout failed! Did not return to login screen."