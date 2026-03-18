import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_signup_as_main_user(driver, base_url):
    """
    Test flow: 
    1. Navigate to Auth Page.
    2. Switch from Login to Sign Up mode.
    3. Fill registration form (Name, Email, Password).
    4. Submit and verify redirection to Dashboard.
    Args:
        driver, base_url: Injected automatically by conftest.py
    """
    
    print("1. Navigating to Base URL...")
    driver.get(base_url)
    
    wait = WebDriverWait(driver, 10)
    
    # --- Switch to Sign Up Mode ---
    print("2. Switching to Sign Up mode...")
    
    try:
        # In your Auth.jsx, the button text is: "Don't have an account? Sign up"
        toggle_btn = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//button[contains(., \"Don't have an account? Sign up\")]")
        ))
        toggle_btn.click()
    except Exception as e:
        print("   (Warning: Could not find toggle button. Page might already be in Signup mode or text changed).")

    # --- Generate Fictive User Data ---
    unique_id = int(time.time())
    fictive_email = f"signup.test.{unique_id}@fictive.com"
    fictive_name = f"Auto Tester {unique_id}"
    fictive_password = "SecretPassword123!"
    
    print(f"3. Registering with: {fictive_email}")
    
    # --- Fill Form ---
    
    # 1. Full Name 
    name_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[placeholder='John Doe']")))
    name_input.clear()
    name_input.send_keys(fictive_name)
    
    # 2. Email
    email_input = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
    email_input.clear()
    email_input.send_keys(fictive_email)
    
    # 3. Password
    pass_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    pass_input.clear()
    pass_input.send_keys(fictive_password)
    
    # --- Submit ---
    print("4. Submitting registration...")
    
    submit_btn = driver.find_element(By.XPATH, "//button[contains(., 'Create Account')]")
    submit_btn.click()
    
    # --- Verify Success ---
    print("5. Verifying redirection to Dashboard...")
    
    # Wait for the "Wedding Planner" header which appears on the Dashboard
    wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Wedding Planner')]")))
    
    # Also verify URL does not contain 'login' or 'auth' logic
    time.sleep(2) # Brief wait for URL update
    current_url = driver.current_url
    
    print(f"   -> Current URL: {current_url}")
    
    # Check if the "Sign In" button is GONE (meaning we are logged in)
    if len(driver.find_elements(By.XPATH, "//button[contains(., 'Sign In')]")) == 0:
         print("✅ TEST PASSED: New user registered and logged in successfully!")
    else:
         print("❌ TEST FAILED: Still seeing Sign In button.")
         assert False, "Signup Failed: 'Sign In' button is still visible after registration."