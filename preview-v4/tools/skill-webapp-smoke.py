#!/usr/bin/env python3
"""Real browser acceptance for the family learning hub (Playwright skill)."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

BASE = os.environ.get("FAMILY_TEST_URL", "http://127.0.0.1:8790/")
OUT = Path(os.environ.get("FAMILY_TEST_ARTIFACTS", "/tmp/family-skill-audit"))
OUT.mkdir(parents=True, exist_ok=True)
DEVICES = [
    ("iphone", 390, 844, True),
    ("galaxy-tab-portrait", 800, 1280, True),
    ("galaxy-tab-landscape", 1280, 800, True),
]

def run_case(browser_type, name, width, height, touch):
    browser = browser_type.launch(headless=True)
    page = browser.new_page(
        viewport={"width": width, "height": height},
        has_touch=touch,
        device_scale_factor=1,
        service_workers="block"
    )
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    result = {"engine": browser_type.name, "device": name, "viewport": [width, height], "errors": errors}
    try:
        page.goto(BASE, wait_until="domcontentloaded", timeout=60000)
        try:
            page.wait_for_load_state("networkidle", timeout=12000)
        except PlaywrightTimeout:
            result["network_idle_timeout"] = True
        page.locator("#hubView.active").wait_for(state="visible", timeout=45000)
        page.locator("#hubKhaled").wait_for(state="visible")
        page.locator("#hubYasser").wait_for(state="visible")
        pin = page.locator("#familyPinInput")
        assert pin.count() == 1 and pin.get_attribute("aria-label"), "Parent PIN lacks accessible name"
        result["horizontal_overflow_px"] = page.evaluate(
            "() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)"
        )
        page.screenshot(path=str(OUT / f"{browser_type.name}-{name}-hub.png"), full_page=True)
        page.locator("#hubKhaled").click()
        page.locator("#khaledIntroView.active").wait_for(state="visible", timeout=15000)
        result["khaled_entry"] = "pass"
        page.locator("#khaledIntroBack").click()
        page.locator("#hubView.active").wait_for(state="visible", timeout=15000)
        page.locator("#hubYasser").click()
        page.locator("#introView.active, #homeView.active").first.wait_for(state="visible", timeout=15000)
        result["yasser_entry"] = "pass"
        result["status"] = "pass"
    except Exception as exc:
        result["status"] = "fail"
        result["failure"] = str(exc)
        page.screenshot(path=str(OUT / f"{browser_type.name}-{name}-failure.png"), full_page=True)
    finally:
        page.close()
        browser.close()
    return result

def main():
    with sync_playwright() as playwright:
        cases = [run_case(getattr(playwright, engine), *device)
                 for engine in ("chromium", "webkit") for device in DEVICES]
    path = OUT / "results.json"
    path.write_text(json.dumps(cases, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for c in cases:
        print(f'{c["engine"]} {c["device"]}: {c["status"]} - overflow: {c.get("horizontal_overflow_px", "?")}px')
        if c["status"] == "fail":
            print("  " + c["failure"])
    if any(c["status"] == "fail" for c in cases):
        raise SystemExit(1)

if __name__ == "__main__":
    main()
