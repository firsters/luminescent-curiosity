from playwright.sync_api import sync_playwright

def verify_duplicate_fridge_warning():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # 1. Navigate to the TestFridgeList page which mocks data
            page.goto("http://localhost:5173/test-fridge-list")
            page.wait_for_load_state("networkidle")

            # 2. Open "Add Fridge" modal
            page.get_by_text("새 냉장고 추가").click()

            # 3. Enter a name that already exists exactly as in TestFridgeList.jsx ("Main Fridge")
            page.get_by_placeholder("예: 김치냉장고").fill("Main Fridge")

            # 4. Handle Alert Dialog
            def handle_dialog(dialog):
                print(f"Alert message: {dialog.message}")
                dialog.accept()

            page.on("dialog", handle_dialog)

            # 5. Click "추가하기"
            page.get_by_text("추가하기").click()

            # Wait a bit
            page.wait_for_timeout(1000)

            # 6. Screenshot
            page.screenshot(path="verification/duplicate_warning_correct.png")
            print("Screenshot saved to verification/duplicate_warning_correct.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_duplicate_fridge_warning()
