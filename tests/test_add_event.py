import time
import datetime
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_add_event(driver, base_url, credentials):
    """
    Test flow: Login -> Scroll to 'New Event' form -> Fill details -> Submit -> Verify in list.
    Args:
        driver, base_url, credentials: Injected automatically by conftest.py
    """
    
    print("1. Navigating to Login Page...")
    driver.get(base_url)
    
    # --- Login ---
    wait = WebDriverWait(driver, 10)
    
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']"))).send_keys(credentials['email'])
    driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(credentials['password'])
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    
    # --- Wait for Dashboard ---
    print("2. Dashboard loaded...")
    wait.until(EC.visibility_of_element_located((By.XPATH, "//h1[contains(., 'Wedding Planner')]")))
    
    # --- Locate 'New Event' Form ---
    print("3. Locating 'New Event' form...")
    
    # Strategy: Find the Header "New Event" (Hebrew: 'אירוע חדש') to ensure we are in the right section
    new_event_header = wait.until(EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'אירוע חדש')]")))
    
    # Scroll to it so inputs are visible
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", new_event_header)
    time.sleep(1) 
    
    # --- Fill Form ---
    event_title = "Selenium Big Wedding"
    
    # Set a future date (10 days from today)
    future_date = (datetime.date.today() + datetime.timedelta(days=10)).strftime("%d-%m-%Y")
    
    # 1. Title Input
    # Unique placeholder from Dashboard.jsx (Hebrew: "For example: Henna / Shabbat Chatan...")
    title_input = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[placeholder*='חינה']")))
    title_input.clear()
    title_input.send_keys(event_title)
    
    # 2. Date Input
    # Using standard send_keys as in test_add_task
    date_input = driver.find_element(By.XPATH, "//h3[contains(., 'אירוע חדש')]/following-sibling::form//input[@type='date']")
    date_input.send_keys(future_date)
    
    # 3. Description (Optional)
    # Placeholder text means "Details..."
    desc_input = driver.find_element(By.CSS_SELECTOR, "input[placeholder='פרטים...']")
    desc_input.send_keys("Automated event creation test")

    # --- Submit ---
    print("4. Submitting form...")
    # Find button with text "Create New Event" (Hebrew: 'צור אירוע חדש')
    submit_btn = driver.find_element(By.XPATH, "//button[contains(., 'צור אירוע חדש')]")
    
    driver.execute_script("arguments[0].click();", submit_btn)
    
    # --- Verification ---
    print("5. Verifying event was created...")
    
    # Verification exactly like in test_add_task (using page_source)
    time.sleep(3)
    
    page_source = driver.page_source
    
    if event_title in page_source:
        print(f"✅ TEST PASSED: Event '{event_title}' created successfully!")
    else:
        print(f"❌ TEST FAILED: Event '{event_title}' not found in the list.")
        assert False, "Event was not created!"