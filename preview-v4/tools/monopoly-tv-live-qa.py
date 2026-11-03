#!/usr/bin/env python3
"""Live browser acceptance on isolated Cloudflare staging. Never points at production."""
import json, os, uuid
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get("LIVE_MONOPOLY_TV_BASE","https://monopoly-tv-staging.modynawe.workers.dev").rstrip("/")
if BASE!="https://monopoly-tv-staging.modynawe.workers.dev":
    raise SystemExit("Refusing live gameplay tests outside isolated Monopoly TV staging")
OUT=Path("/tmp/monopoly-tv-live-qa")
OUT.mkdir(parents=True,exist_ok=True)

def run(engine,name):
    browser=engine.launch(headless=True)
    tvctx=browser.new_context(viewport={"width":1920,"height":1080},service_workers="block",locale="ar-SA")
    hctx=browser.new_context(viewport={"width":390,"height":844},is_mobile=name=="webkit",has_touch=True,service_workers="block",locale="ar-SA")
    gctx=browser.new_context(viewport={"width":390,"height":844},is_mobile=name=="webkit",has_touch=True,service_workers="block",locale="ar-SA")
    tv=tvctx.new_page();host=hctx.new_page();guest=gctx.new_page()
    errors=[]
    for page,label in [(tv,"tv"),(host,"host"),(guest,"guest")]:
        page.on("pageerror",lambda e,label=label:errors.append(label+":"+str(e)))
    result={"engine":name}
    try:
        host.goto(BASE+"/monopoly-party/controller/",wait_until="load",timeout=30000)
        assert host.locator("#remoteJoin").is_visible()
        host.locator('input[name=name]').fill("مضيف QA "+str(uuid.uuid4())[:6])
        host.locator('button[value=create]').click()
        host.locator("#remoteCode").wait_for(state="visible",timeout=30000)
        code=host.locator("#remoteCode").inner_text().strip()
        assert len(code)==6 and code.isdigit(),code

        tv.goto(BASE+"/monopoly-party/tv/",wait_until="load",timeout=30000)
        tv.locator('input[name=code]').fill(code)
        tv.locator('#tvJoinForm button').click()
        tv.locator("#tvCode").wait_for(state="visible",timeout=30000)
        assert tv.locator("#tvCode").inner_text().strip()==code
        assert tv.locator("#tvQr svg").count()==1
        tv.wait_for_function("() => document.querySelector('#partyBoard')?.classList.contains('has-art')",timeout=30000)
        assert tv.locator(".tv-cell").count()==40
        link=tv.locator("#tvRemoteLink").get_attribute("href")
        assert "token" not in link.lower() and "code="+code in link

        guest.goto(BASE+"/monopoly-party/controller/",wait_until="load",timeout=30000)
        guest.locator('input[name=name]').fill("ضيف QA "+str(uuid.uuid4())[:6])
        guest.locator('input[name=code]').fill(code)
        guest.locator('button[value=join]').click()
        guest.locator("#remoteCode").wait_for(state="visible",timeout=30000)
        assert guest.locator("#remoteCode").inner_text().strip()==code
        tv.locator(".tv-player").nth(1).wait_for(state="visible",timeout=30000)
        host.locator('#remoteActions button[data-action=start]').wait_for(state="visible",timeout=30000)
        host.screenshot(path=str(OUT/f"{name}-phone-lobby.png"),full_page=True)
        tv.screenshot(path=str(OUT/f"{name}-tv-lobby.png"),full_page=True)
        host.locator('#remoteActions button[data-action=start]').click()
        host.locator('#remoteActions button[data-action=roll]').wait_for(state="visible",timeout=30000)
        assert guest.locator('#remoteActions button[data-action=roll]').count()==0
        host.locator('#remoteActions button[data-action=roll]').click()
        tv.wait_for_function("() => document.querySelectorAll('#tvDice .tv-die').length===2",timeout=30000)
        assert tv.locator(".tv-token").count()==2
        tv.screenshot(path=str(OUT/f"{name}-tv-arrival.png"),full_page=True)
        host.screenshot(path=str(OUT/f"{name}-phone-event.png"),full_page=True)
        steps=[]
        for _ in range(9):
            if host.locator('#remoteActions button[data-action=buy]').is_visible():
                host.locator('#remoteActions button[data-action=buy]').click();steps.append("buy")
            elif host.locator('#remoteActions button[data-action=card-pick]').is_visible():
                host.locator('#remoteActions button[data-action=card-pick]').click();steps.append("card-pick")
            elif host.locator('#remoteActions button[data-action=card-flip]').is_visible():
                host.locator('#remoteActions button[data-action=card-flip]').click();steps.append("card-flip")
            elif host.locator('#remoteActions button[data-action=card]').is_visible():
                host.locator('#remoteActions button[data-action=card]').click();steps.append("card")
            elif host.locator('#remoteActions button[data-action=end]').is_visible():
                host.locator('#remoteActions button[data-action=end]').click();steps.append("end");break
            else:
                host.wait_for_timeout(1500)
        guest.locator('#remoteActions button[data-action=roll]').wait_for(state="visible",timeout=30000)
        assert "end" in steps, "Host turn did not resolve: "+str(steps)
        assert tv.locator(".tv-board.has-art").is_visible()
        board=tv.locator("#partyBoard").evaluate("""el=>{
            const r=el.getBoundingClientRect();
            return {width:r.width,height:r.height,screenWidth:innerWidth,screenHeight:innerHeight};
        }""")
        assert 600<=board["width"]<=board["screenWidth"] and abs(board["width"]-board["height"])<2,board
        # Restore live sessions from browser storage, retaining correct roles.
        host.reload(wait_until="load")
        tv.reload(wait_until="load")
        host.locator("#remoteCode").wait_for(state="visible",timeout=30000)
        tv.locator("#tvCode").wait_for(state="visible",timeout=30000)
        assert host.locator("#remoteCode").inner_text().strip()==code
        assert tv.locator("#tvCode").inner_text().strip()==code
        assert tv.locator(".tv-player").count()==2
        assert not errors,errors
        result.update({"status":"pass","players":2,"tv":1,"art":"loaded","hostActions":steps,"resumed":True,"board":board})
    except Exception as error:
        result.update({"status":"fail","error":f"{type(error).__name__}: {error}","pageErrors":errors})
        for page,label in [(tv,"tv"),(host,"host"),(guest,"guest")]:
            try:page.screenshot(path=str(OUT/f"{name}-{label}-failure.png"),full_page=True)
            except Exception:pass
    finally:
        for c in [tvctx,hctx,gctx]:c.close()
        browser.close()
    return result

def main():
    with sync_playwright() as playwright:
        results=[run(playwright.chromium,"chromium"),run(playwright.webkit,"webkit")]
    (OUT/"results.json").write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf8")
    for result in results:print(json.dumps(result,ensure_ascii=False))
    if any(x["status"]!="pass" for x in results):raise SystemExit(1)
if __name__=="__main__":main()
