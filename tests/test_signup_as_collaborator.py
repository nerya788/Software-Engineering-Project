import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_signup_as_collaborator(driver, base_url):
    """
    Test flow for Collaborator (Partner): 
    1. Navigate to Auth Page.
    2. Switch to Sign Up mode.
    3. Fill basic details (Name, Email, Password).
    4. Check 'Join as a Partner'.
    5. Enter Wedding Code (WED-5405).
    6. Submit and verify success.
    Args:
        driver, base_url: Injected automatically by conftest.py
    """
    
    print("1. Navigating to Base URL...")
    driver.get(base_url)
    
    wait = WebDriverWait(driver, 10)
    
    # --- Switch to Sign Up Mode ---
    print("2. Switching to Sign Up mode...")
    
    try:
        toggle_btn = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//button[contains(., \"Don't have an account? Sign up\")]")
        ))
        toggle_btn.click()
    except Exception as e:
        print("   (Warning: Could not find toggle button. Page might already be in Signup mode).")

    # --- Generate Fictive User Data ---
    unique_id = int(time.time())
    fictive_email = f"collab.test.{unique_id}@fictive.com"
    fictive_name = f"Collaborator {unique_id}"
    fictive_password = "SecretPassword123!"
    target_wedding_code = "WED-5405"
    
    print(f"3. Registering Partner: {fictive_email} with code {target_wedding_code}")
    
    # --- Fill Basic Form ---
    
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
    
    # --- PARTNER SPECIFIC STEPS ---
    print("4. Selecting 'Join as a Partner'...")
    
    # Locate the checkbox or its label text
    partner_checkbox_label = driver.find_element(By.XPATH, "//span[contains(., 'Join as a Partner')]")
    partner_checkbox_label.click()
    
    # Wait for Wedding Code input to appear (it renders conditionally)
    print("   -> Waiting for code input...")
    code_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[placeholder*='WED-']")))
    
    code_input.clear()
    code_input.send_keys(target_wedding_code)
    
    # --- Submit ---
    print("5. Submitting registration...")
    
    submit_btn = driver.find_element(By.XPATH, "//button[contains(., 'Create Account')]")
    submit_btn.click()
    
    # --- Verify Success ---
    print("6. Verifying redirection to Dashboard...")
    
    # Wait for the "Wedding Planner" header
    wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Wedding Planner')]")))
    
    time.sleep(2)
    current_url = driver.current_url
    print(f"   -> Current URL: {current_url}")
    
    # Check if the "Sign In" button is GONE
    if len(driver.find_elements(By.XPATH, "//button[contains(., 'Sign In')]")) == 0:
         print(f"✅ TEST PASSED: Collaborator registered successfully to wedding {target_wedding_code}!")
    else:
         print("❌ TEST FAILED: Still seeing Sign In button.")
         assert False, "Signup Failed: 'Sign In' button is still visible."