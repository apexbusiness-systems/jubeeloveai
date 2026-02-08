from playwright.sync_api import sync_playwright, expect

def verify_home_text_removed():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Navigate to Home
            print("Navigating to home page...")
            page.goto("http://localhost:3000")

            # Check for Landing Page via button visibility (more reliable than title)
            try:
                start_btn = page.get_by_role("button", name="Start Learning")
                start_btn.wait_for(state="visible", timeout=5000)
                print("Landing page detected. Clicking 'Start Learning'...")
                start_btn.click()
            except:
                print("Landing page not detected (or button missing), assuming Home page...")

            # Wait for Home content to load
            print("Waiting for Home page content...")
            expect(page.get_by_role("heading", name="Welcome to Jubee's World!")).to_be_visible(timeout=15000)

            # Check that the removed text is NOT present
            print("Verifying text removal...")
            removed_text = page.get_by_text("Apple-smooth journey, kid-first")
            expect(removed_text).not_to_be_visible()

            # Take a screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification_home.png", full_page=True)
            print("Verification complete.")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification_error.png", full_page=True)
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_home_text_removed()
