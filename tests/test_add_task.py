import time
import datetime
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_add_task(driver, base_url, credentials):
    """
    Test flow: Login -> Dashboard -> Fill Task Form (Title + Date) -> Submit -> Verify.
    Args:
        driver, base_url, credentials: Injected automatically by conftest.py
    """
    
    print("1. Navigating to Login Page...")
    driver.get(base_url)
    
    # --- Login Step ---
    wait = WebDriverWait(driver, 10)
    
    email_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
    password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    
    email_input.send_keys(credentials['email'])
    password_input.send_keys(credentials['password'])
    submit_btn.click()
    
    # --- Wait for Dashboard ---
    print("2. Detailed Dashboard loading...")
    # Wait for the main header to appear to ensure we are logged in
    wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Wedding Planner')]")))
    time.sleep(2) 
    
    # --- Locate Task Form ---
    print("3. Filling 'New Task' Form...")
    
    task_title = "Selenium Task"
    
    # 1. Fill Title
    # Unique placeholder from Dashboard.jsx (Hebrew: "For example: Schedule a meeting...")
    title_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[placeholder*='לקבוע פגישה']")))
    title_input.clear()
    title_input.send_keys(task_title)
    
    # 2. Fill Date (CRITICAL STEP - Required field)
    # We look for the input following the label "Due Date" (Hebrew: "תאריך יעד")
    date_input = driver.find_element(By.XPATH, "//label[contains(., 'תאריך יעד')]/following-sibling::input")
    
    # Set a future date (10 days from today)
    future_date = (datetime.date.today() + datetime.timedelta(days=10)).strftime("%d-%m-%Y")
    
    # Send date keys.
    date_input.send_keys(future_date)
    
    # --- Submit ---
    print("4. Submitting form...")
    
    # Find the button with text "Add Task to List" (Hebrew)
    add_task_btn = driver.find_element(By.XPATH, "//button[contains(., 'הוסף משימה לרשימה')]")
    
    # Scroll to button to ensure it's not covered
    driver.execute_script("arguments[0].scrollIntoView(true);", add_task_btn)
    time.sleep(1) # Small pause after scroll
    
    add_task_btn.click()
    
    # --- Assertion / Verification ---
    print("5. Verifying task was added...")
    
    # Wait for the UI to update (React needs a moment to fetch/render)
    time.sleep(3)
    
    # Check for the task in the page source
    page_source = driver.page_source
    
    if task_title in page_source:
        print(f"✅ TEST PASSED: Task '{task_title}' added successfully!")
    else:
        print(f"❌ TEST FAILED: Task '{task_title}' was not found in the dashboard list.")
        assert False, "Task was not added to the list!"