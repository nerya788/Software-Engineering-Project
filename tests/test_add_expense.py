import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_add_expense(driver, base_url, credentials):
    """
    Test flow: Login -> Dashboard -> Find first event's Budget link -> Add Expense -> Verify.
    Args:
        driver, base_url, credentials: Injected automatically by conftest.py
    """
    
    print("1. Navigating to Login Page...")
    driver.get(base_url)
    
    # --- Login ---
    wait = WebDriverWait(driver, 10)
    email_field = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
    email_field.send_keys(credentials['email'])
    driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(credentials['password'])
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    
    # --- Dynamic Navigation ---
    print("2. Looking for an event's Budget link in Dashboard...")
    time.sleep(3)
    
    try:
        budget_link = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "a[href*='/budget']")))
        print(f"   -> Found event link: {budget_link.get_attribute('href')}")
        
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", budget_link)
        time.sleep(1)
        
        driver.execute_script("arguments[0].click();", budget_link)
        
    except Exception as e:
        print(f"   -> Navigation error: {str(e)}")
        assert False, "❌ Could not click the Budget link."

    # --- Add Expense Flow ---
    print("3. Opening 'Add Expense' Modal...")
    
    add_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'הוצאה חדשה')]")))
    add_btn.click()
    
    print("4. Filling the form...")
    expense_title = "Selenium DJ Test"
    expense_cost = "2500"

    name_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[placeholder*='צלם מגנטים']")))
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
        assert False, "Expense was not added to the list!"