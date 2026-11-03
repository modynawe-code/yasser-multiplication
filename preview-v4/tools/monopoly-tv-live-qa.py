#!/usr/bin/env python3
"""End-to-end against isolated live Cloudflare staging, not a mocked room."""
import json
import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ORIGIN=os.environ.get("TV_TEST_ORIGIN","https://monopoly-tv-staging.modynawe.workers.dev").rstrip("/")
ART=Path("/tmp/monopoly-tv-live-qa")
ART.mkdir(parents=True,exist_ok=True)
STAMP=str(int(time.time()))[-7:]

def execute(kind,browser):
    result={"browser":kind,"mode":"live-staging","status":"failed"}
    errors=[]
    ctxs=[]
    try:
        tvc=browser.new_context(viewport={"width":1280,"height":720},service_workers="block",locale="ar-SA")
        phone_contexts=[browser.new_context(viewport={"width":390,"height":844},has_touch=True,service_workers="block",locale="ar-SA") for _ in range(4 if kind=="chromium" else 2)]
        ctxs=[tvc,*phone_contexts]
        tv=tvc.new_page()
        phones=[c.new_page() for c in phone_contexts]
        for page in [tv,*phones]:
            page.on("pageerror",lambda err:errors.append(str(err)))
        host=phones[0]
        host.goto(ORIGIN+"/monopoly-party/controller/",wait_until="domcontentloaded",timeout=55000)
        host.locator("input[name=name]").fill("TV اختبار "+kind+" "+STAMP)
        host.locator("button[value=create]").click()
        host.locator("#remoteStage").wait_for(state="visible",timeout=25000)
        code=host.locator("#remoteCode").inner_text().strip()
        assert len(code)==6 and code.isdigit(), "Server did not issue a six-digit code"

        # Television joins only as spectator; remaining phones take real player seats.
        tv.goto(ORIGIN+"/monopoly-party/tv/",wait_until="domcontentloaded",timeout=55000)
        tv.locator("#tvJoinForm input[name=code]").fill(code)
        tv.locator("#tvJoinForm button").click()
        tv.locator("#tvStage").wait_for(state="visible",timeout=25000)
        tv.locator("#tvCode").get_by_text(code).wait_for(timeout=10000)
        for i,player in enumerate(phones[1:],start=1):
            player.goto(ORIGIN+"/monopoly-party/controller/",wait_until="domcontentloaded",timeout=55000)
            player.locator("input[name=name]").fill(f"لاعب {i+1} {kind} {STAMP}")
            player.locator("input[name=code]").fill(code)
            player.locator("button[value=join]").click()
            player.locator("#remoteStage").wait_for(state="visible",timeout=25000)
        tv.locator(".tv-player").nth(len(phones)-1).wait_for(state="visible",timeout=18000)
        assert tv.locator(".tv-player").count()==len(phones)
        assert tv.locator(".tv-cell").count()==40
        assert tv.locator("#tvQr svg").count()==1
        tv.wait_for_function("() => document.getElementById('partyBoard').classList.contains('has-art')",timeout=20000)
        tv.screenshot(path=str(ART/f"{kind}-tv-joined.png"),full_page=True)
        host.screenshot(path=str(ART/f"{kind}-phone-lobby.png"),full_page=True)
        result["players"]=len(phones)
        result["qr"]="local-encoded HTTPS URL"
        result["boardArt"]="loaded"

        host.locator('#remoteActions button[data-action=start]').wait_for(state="visible",timeout=20000)
        host.locator('#remoteActions button[data-action=start]').click()
        host.locator('#remoteActions button[data-action=roll]').wait_for(state="visible",timeout=20000)

        # Safari touch and Chromium pointer input are exercised via the actual UI.
        if kind=="chromium":
            host.locator('#remoteActions button[data-action=roll]').click()
        else:
            host.locator('#remoteActions button[data-action=roll]').click()
        tv.wait_for_function("() => document.querySelectorAll('#tvDice .tv-die').length===2",timeout=22000)
        tv.screenshot(path=str(ART/f"{kind}-tv-after-dice.png"),full_page=True)
        assert tv.locator(".tv-token").count()==len(phones)
        for other in phones[1:]:
            assert other.locator('#remoteActions [data-action=roll]').count()==0,"Not-your-turn phone can roll"

        # Buy when the random square is purchasable; otherwise handle card stages.
        chosen=[]
        for _ in range(6):
            buttons=host.locator('#remoteActions button[data-action]')
            actions=[buttons.nth(i).get_attribute("data-action") for i in range(buttons.count())]
            if "buy" in actions:
                host.locator('#remoteActions [data-action=buy]').click()
                chosen.append("buy")
                host.wait_for_timeout(600)
            elif "card-pick" in actions or "card-flip" in actions or "card" in actions:
                kind_action=next(s for s in ["card-pick","card-flip","card"] if s in actions)
                host.locator(f'#remoteActions [data-action="{kind_action}"]').click()
                chosen.append(kind_action)
                host.wait_for_timeout(600)
            else:
                break

        # Verify session resume without consuming another player seat.
        host.reload(wait_until="domcontentloaded")
        host.locator('#remoteCode').get_by_text(code).wait_for(timeout=20000)
        tv.reload(wait_until="domcontentloaded")
        tv.locator("#tvCode").get_by_text(code).wait_for(timeout=20000)
        tv.locator(".tv-player").nth(len(phones)-1).wait_for(timeout=12000)
        assert tv.locator(".tv-player").count()==len(phones)
        layout=tv.evaluate("""() => {
          const b=document.querySelector('#partyBoard').getBoundingClientRect();
          return {left:b.left,right:b.right,width:b.width,height:b.height,screenWidth:innerWidth};
        }""")
        assert layout["left"]>=-1 and layout["right"]<=layout["screenWidth"]+1,layout
        assert layout["width"]>420 and abs(layout["width"]-layout["height"])<4,layout

        phone_layout=host.evaluate("() => ({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth})")
        assert phone_layout["scrollWidth"]<=phone_layout["viewport"]+2,phone_layout
        assert not errors,errors
        result.update(status="passed",actions=chosen,layout=layout,phoneLayout=phone_layout,refreshed=True)
    except Exception as err:
        result.update(error=type(err).__name__+": "+str(err)[:1400],pageErrors=errors)
        for i,p in enumerate([tv,*phones] if "phones" in locals() else []):
            try:p.screenshot(path=str(ART/f"{kind}-failure-{i}.png"),full_page=True)
            except Exception:pass
    finally:
        for c in ctxs:
            try:c.close()
            except Exception:pass
    return result

def main():
    with sync_playwright() as playwright:
        output=[]
        for name in ["chromium","webkit"]:
            browser=getattr(playwright,name).launch(headless=True)
            output.append(execute(name,browser))
            browser.close()
    (ART/"results.json").write_text(json.dumps(output,ensure_ascii=False,indent=2),encoding="utf8")
    for record in output:print(json.dumps(record,ensure_ascii=False))
    if any(x["status"]!="passed" for x in output):raise SystemExit(1)

if __name__=="__main__":main()
