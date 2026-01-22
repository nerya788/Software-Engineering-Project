import pytest
import os
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# --- Load Environment Variables ---
# This ensures .env is loaded for all tests in the session
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '.env')
load_dotenv(env_path)

@pytest.fixture(scope="session")
def base_url():
    """
    Fixture to determine the Base URL for the application.
    It checks the configuration (Local vs Production) and returns the appropriate URL.
    Scope is 'session' so it runs only once per test suite execution.
    """
    # Configuration Switch
    # Set to True to run against localhost, False for Render/Production
    is_local_mode = False 

    if is_local_mode:
        url = os.getenv("LOCAL_RUN_URL")
        print(f"\n--- Fixture: Running in LOCAL mode: {url} ---")
        return url
    else:
        url = os.getenv("RENDER_RUN_URL")
        print(f"\n--- Fixture: Running in PRODUCTION mode: {url} ---")
        return url

@pytest.fixture
def driver():
    """
    Fixture to handle Selenium WebDriver setup and teardown.
    
    Yields:
        driver: A configured Chrome WebDriver instance.
    
    Behavior:
    - Setup: Installs Chrome driver, initializes it, and sets the window size.
    - Yield: Passes the driver to the test function.
    - Teardown: Automatically calls driver.quit() after the test finishes (even if it fails).
    """
    
    # --- Setup ---
    print("\n[Fixture] Setting up Chrome Driver...")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    
    # Critical: Set window size to ensure all UI elements (like Sidebar/Forms) are visible
    driver.set_window_size(1920, 1080)
    
    # Pass the driver instance to the test function
    yield driver
    
    # --- Teardown ---
    print("\n[Fixture] Closing Browser...")
    driver.quit()

@pytest.fixture
def credentials():
    """
    Fixture that provides the test user's login credentials.
    Fetched securely from the .env file.
    
    Returns:
        dict: {'email': '...', 'password': '...', 'main_test_user_wedding_code': '...'}
    """
    return {
        "email": os.getenv("TEST_EMAIL"),
        "password": os.getenv("TEST_PASSWORD"),
        "main_test_user_wedding_code": os.getenv("MAIN_TEST_USER_WEDDING_CODE")
    }