#!/usr/bin/env python3
"""Real-browser Yasser/Khaled/Mashaal internal world navigation and appearance checks."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = os.environ.get("FAMILY_TEST_URL", "http://127.0.0.1:8790/")
OUT = Path(os.environ.get("FAMILY_TEST_ARTIFACTS", "/tmp/family-skill-audit")) / "internal-worlds"
OUT.mkdir(parents=True, exist_ok=True)

DEVICES = (("iphone",390,844), ("galaxy-tab-portrait",800,1280), ("galaxy-tab-landscape",1280,800))

def ensure_hub(page):
    page.goto(URL,wait_until="domcontentloaded",timeout=60000)
    page.locator("#hubView.active").wait_for(state="visible",timeout=45000)

def measure(page):
    return page.evaluate("""() => ({
        overflow: Math.max(0, document.documentElement.scrollWidth-document.documentElement.clientWidth),
        heading: [...document.querySelectorAll('.view.active h1,.view.active h2')].map(e=>e.textContent.trim()).slice(0,3)
    })""")

def case(browser_type, device):
    name, w, h = device
    browser = browser_type.launch(headless=True)
    page = browser.new_page(viewport={"width":w,"height":h},device_scale_factor=1,has_touch=True,service_workers="block")
    errors=[]
    page.on("pageerror",lambda error:errors.append(str(error)))
    result={"engine":browser_type.name,"device":name,"screens":[],"errors":errors}
    try:
        ensure_hub(page)
        page.locator("#hubYasser").click()
        page.locator("#introView.active .intro-card.has-subject-gateway").wait_for(state="visible")
        assert page.locator("#introView .subject-choice").count()==6, "Yasser subject options changed"
        assert page.locator("#introView .intro-card.has-subject-gateway").evaluate("(el)=>getComputedStyle(el).display")=="grid", "Yasser interior skin missing"
        result["screens"].append({"page":"yasser-subjects",**measure(page)})
        page.screenshot(path=str(OUT/f"{browser_type.name}-{name}-yasser-subjects.png"),full_page=True)
        page.locator("#introStart").click()
        page.locator("#homeView.active").wait_for(state="visible",timeout=18000)
        result["screens"].append({"page":"yasser-math",**measure(page)})
        page.screenshot(path=str(OUT/f"{browser_type.name}-{name}-yasser-math.png"),full_page=True)
        ensure_hub(page)
        page.locator("#hubKhaled").click()
        page.locator("#khaledIntroView.active").wait_for(state="visible")
        page.locator("#khaledIntroStart").click()
        page.locator("#khaledHomeView.active").wait_for(state="visible",timeout=18000)
        assert page.locator("#khaledHomeView .khaled-subject-card").count()>=5, "Khaled course entries missing"
        bg=page.locator("#khaledHomeView .khaled-subject-hero").evaluate("(el)=>getComputedStyle(el).backgroundColor")
        assert bg=="rgb(255, 201, 144)", f"Khaled interior stylesheet stale: {bg}"
        result["screens"].append({"page":"khaled-subjects",**measure(page)})
        page.screenshot(path=str(OUT/f"{browser_type.name}-{name}-khaled-subjects.png"),full_page=True)
        page.locator("#khaledMathOpen").click()
        page.locator("#khaledMathView.active").wait_for(state="visible",timeout=15000)
        result["screens"].append({"page":"khaled-math",**measure(page)})
        ensure_hub(page)
        page.locator("#hubLearner-mashaal").click()
        page.locator("#mashaalHomeView.active").wait_for(state="visible",timeout=18000)
        page.locator("#mashaalDailyStart").wait_for(state="visible")
        assert page.locator("#mashaalDomainGrid").count()==1 and page.locator("#mashaalPlayGrid").count()==1
        bg=page.locator("#mashaalHomeView .mashaal-home-hero").evaluate("(el)=>getComputedStyle(el).backgroundColor")
        assert bg=="rgb(250, 196, 223)", f"Mashaal interior stylesheet stale: {bg}"
        result["screens"].append({"page":"mashaal-home",**measure(page)})
        page.screenshot(path=str(OUT/f"{browser_type.name}-{name}-mashaal-home.png"),full_page=True)
        assert all(screen["overflow"]<=1 for screen in result["screens"]), "Horizontal overflow introduced"
        assert not errors,f"JavaScript errors: {errors}"
        result["status"]="pass"
    except Exception as exc:
        result["status"]="fail"
        result["error"]=str(exc)
        try: page.screenshot(path=str(OUT/f"{browser_type.name}-{name}-failure.png"),full_page=True)
        except Exception: pass
    finally:
        page.close()
        browser.close()
    return result

def main():
    with sync_playwright() as playwright:
        cases=[case(getattr(playwright,engine),dev) for engine in ("chromium","webkit") for dev in DEVICES]
    (OUT/"results.json").write_text(json.dumps(cases,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    for item in cases:
        print(item["engine"],item["device"],item["status"],[a["page"] for a in item["screens"]],item.get("error",""))
    if any(item["status"]!="pass" for item in cases):
        raise SystemExit(1)

if __name__=="__main__":
    main()
