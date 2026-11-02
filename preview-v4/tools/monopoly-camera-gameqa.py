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
        assert not issues, f"Unhandled JavaScript errors: {issues}"
        page.screenshot(path=str(OUT / f"{browser_type.name}-{label}-arrival.png"), full_page=True)

        # Purchase deterministic property and open the independent portfolio panel.
        buy = page.locator('#monoOverlay [data-action="buy"]')
        buy.wait_for(state="visible", timeout=15000)
        page.wait_for_function("""() => {
            const buy = document.querySelector('#monoOverlay [data-action="buy"]');
            return buy && !buy.disabled;
        }""", timeout=15000)
        buy.click()
        page.wait_for_function("""() => {
            const btn = document.querySelector('#monoOverlay [data-action="continue-event"]');
            return btn && !btn.disabled;
        }""", timeout=15000)
        page.locator('#monoOverlay [data-action="continue-event"]').click()
        page.locator("#monoGameTools summary").click()
        page.locator("#monoManage").click()

        sheet = page.locator("#monoGame > #monoOverlay.mono-overlay--portfolio")
        sheet.wait_for(state="visible", timeout=8000)
        assert sheet.locator(".mono-portfolio-tab").count() == 2
        assert sheet.locator(".mono-portfolio-property").count() >= 1, "Purchased land missing"
        assert sheet.locator(".mono-portfolio-sale").first.is_enabled(), "Owner sale action missing"
        geometry = sheet.evaluate("""el => {
            const b = el.getBoundingClientRect();
            return {x:b.x,y:b.y,width:b.width,height:b.height,parent:el.parentElement.id,
                screen:innerWidth,screenHeight:innerHeight};
        }""")
        assert geometry["parent"] == "monoGame"
        assert geometry["x"] >= -1 and geometry["x"] + geometry["width"] <= width + 1, f"Portfolio clipped: {geometry}"
        assert geometry["height"] > 240
        page.screenshot(path=str(OUT / f"{browser_type.name}-{label}-portfolio.png"), full_page=True)

        second = sheet.locator(".mono-portfolio-tab").nth(1)
        second.click()
        assert second.get_attribute("aria-pressed") == "true"
        assert sheet.locator(".mono-portfolio-empty").count() == 1, "Empty second player must be selectable"
        assert sheet.locator(".mono-portfolio-property").count() == 0
        sheet.locator(".mono-portfolio-tab").first.click()
        assert sheet.locator(".mono-portfolio-property").count() >= 1
        sheet.locator('[data-action="trade-open"]').click()
        assert page.locator("#monoCenter > #monoOverlay").is_visible(), "Trade flow no longer uses center overlay"
        page.locator('#monoOverlay [data-action="manage"]').click()
        assert sheet.is_visible(), "Return to portfolio failed"
        sheet.locator('[data-action="close"]').click()
        assert page.locator("#monoOverlay").evaluate("(el)=>el.hidden && el.parentElement.id==='monoCenter'"), "Sheet didn't restore board container"
        assert page.locator("#monoBoard .mono-space").count() == 40
        assert not issues, f"Unhandled JavaScript errors: {issues}"
        result["portfolio"] = {"tabs": 2, "owned": 1, "bounds": geometry, "tradeReturn": True, "closed": True}
        result["status"] = "pass"
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
