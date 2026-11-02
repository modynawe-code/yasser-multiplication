#!/usr/bin/env python3
"""Monopoly gameplay camera acceptance using the installed game-qa skill."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get("FAMILY_TEST_URL", "http://127.0.0.1:8790/")
OUT = Path("/tmp/monopoly-camera-qa")
OUT.mkdir(parents=True, exist_ok=True)
DEVICES = (("iphone", 390, 844), ("tablet-landscape", 1180, 820))

def run(browser_type, device):
    label, width, height = device
    browser = browser_type.launch(headless=True)
    page = browser.new_page(viewport={"width": width, "height": height}, has_touch=True, device_scale_factor=1, service_workers="block")
    issues = []
    page.on("pageerror", lambda error: issues.append(str(error)))
    result = {"browser": browser_type.name, "device": label, "errors": issues}
    try:
        page.add_init_script("Math.random = () => 0.51")
        page.goto(BASE, wait_until="domcontentloaded", timeout=60000)
        page.locator("#hubView.active").wait_for(state="visible", timeout=45000)
        page.evaluate("""async () => {
            const module = await import('./src/modules/games/monopoly/monopoly-controller.js');
            window.__monoQA = module.createMonopolyController();
            window.__monoQA.start();
        }""")
        page.locator("#monoStart").wait_for(state="visible", timeout=12000)
        page.locator("#monoStart").click()
        page.locator("#monoGame").wait_for(state="visible", timeout=15000)
        assert page.locator("#monoBoard .mono-space").count() == 40, "Board is incomplete"
        # Game QA: inspect per-player estates without leaving the live Monopoly board.
        page.locator('#monoGameTools summary').click()
        page.locator('#monoManage').click()
        drawer = page.locator('#monoEstateDrawer')
        drawer.wait_for(state='visible',timeout=10000)
        assert drawer.get_attribute('role') == 'dialog', 'Estate panel is not a dialog'
        assert drawer.locator('[data-mono-estate-owner]').count() == 2
        assert drawer.locator('.mono-estate-empty').count() == 1, 'No-property state missing'
        assert page.locator('#monoBoard .mono-space').count() == 40, 'Board unexpectedly changed'
        page.screenshot(path=str(OUT / f'{browser_type.name}-{label}-estates.png'), full_page=True)
        drawer.locator('[data-mono-estate-owner]').nth(1).click()
        assert drawer.locator('[data-mono-estate-owner]').nth(1).get_attribute('aria-pressed') == 'true'
        assert drawer.locator('.mono-estate-empty').count() == 1
        drawer.locator('[data-action=estate-close]').first.click()
        assert not drawer.is_visible(), 'Estate panel did not close'
        result['estates'] = 'switch and close passed'

        page.screenshot(path=str(OUT / f"{browser_type.name}-{label}-before.png"), full_page=True)
        page.evaluate("""() => {
            const board = document.getElementById('monoBoard');
            window.__monoCameraFrames = [];
            new MutationObserver(() => {
                const style = board.style.transform;
                if (document.getElementById('monoGame').classList.contains('mono-is-moving') && style) {
                    window.__monoCameraFrames.push(style);
                }
            }).observe(board, {attributes:true, attributeFilter:['style']});
        }""")
        page.locator("#monoDice .mono-die").first.click()
        page.wait_for_function("() => window.__monoCameraFrames?.length >= 4", timeout=30000)
        page.wait_for_function("""() => {
            const moving = document.getElementById('monoGame')?.classList.contains('mono-is-moving');
            const overlay = document.getElementById('monoOverlay');
            return !moving && overlay && !overlay.hidden;
        }""", timeout=30000)
        result["camera_positions"] = page.evaluate("""() => ({
            moving: new Set(window.__monoCameraFrames).size,
            zoom: getComputedStyle(document.getElementById('monoBoard')).transform,
            overlayVisible: !document.getElementById('monoOverlay').hidden,
            squareCount: document.querySelectorAll('#monoBoard .mono-space').length,
            turnAction: document.querySelector('#monoOverlay h2')?.textContent
        })""")
        assert result["camera_positions"]["moving"] >= 4, "Camera did not follow successive board squares"
        assert result["camera_positions"]["overlayVisible"], "Arrival property/event panel hidden"
        assert result["camera_positions"]["squareCount"] == 40
        # Purchase a real square and verify the new estate drawer reflects saved engine ownership.
        page.locator('#monoOverlay [data-action=buy]').click()
        page.wait_for_function("() => document.querySelectorAll('#monoBoard .mono-space.owned').length === 1",timeout=15000)
        page.locator('#monoGameTools summary').click()
        page.locator('#monoManage').click()
        drawer.wait_for(state='visible',timeout=8000)
        assert drawer.locator('[data-property-index]').count() == 1, 'Bought property missing from owner estate'
        assert drawer.locator('.mono-property-actions button').count() >= 1
        assert drawer.locator('.mono-estate-tab[aria-pressed=true]').count() == 1
        assert drawer.locator('.mono-estate-empty').count() == 0
        result['estates_after_purchase'] = 'owned property and allowed actions shown'
        page.screenshot(path=str(OUT / f'{browser_type.name}-{label}-owned-estate.png'),full_page=True)
        drawer.locator('[data-action=estate-close]').first.click()
        assert page.locator('#monoBoard .mono-space.owned').count() == 1
        assert not issues, f"Unhandled JavaScript errors: {issues}"
        result["status"] = "pass"
        page.screenshot(path=str(OUT / f"{browser_type.name}-{label}-arrival.png"), full_page=True)
    except Exception as exc:
        result["status"] = "fail"
        result["reason"] = str(exc)
        try:
            page.screenshot(path=str(OUT / f"{browser_type.name}-{label}-failure.png"), full_page=True)
        except Exception:
            pass
    finally:
        page.close()
        browser.close()
    return result

def main():
    with sync_playwright() as driver:
        cases = [run(getattr(driver, name), device)
                 for name, device in (("chromium", DEVICES[0]), ("chromium", DEVICES[1]), ("webkit", DEVICES[0]))]
    (OUT / "results.json").write_text(json.dumps(cases, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    for entry in cases:
        print(entry["browser"], entry["device"], entry["status"], entry.get("camera_positions", entry.get("reason", "")))
    if any(entry["status"] != "pass" for entry in cases):
        raise SystemExit(1)

if __name__ == "__main__":
    main()
