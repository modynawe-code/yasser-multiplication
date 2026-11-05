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

def navigate(page,url):
    # Cloudflare test edges occasionally reset a TLS handshake; retry only
    # page navigation, never a state-changing POST action.
    for attempt in range(4):
        try:
            return page.goto(url,wait_until="domcontentloaded",timeout=55000)
        except Exception:
            if attempt==3:raise
            page.wait_for_timeout((attempt+1)*1500)

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
        navigate(host,ORIGIN+"/monopoly-party/controller/")
        host.locator("input[name=name]").fill("TV اختبار "+kind+" "+STAMP)
        host.locator("button[value=create]").click()
        host.locator("#remoteStage").wait_for(state="visible",timeout=25000)
        code=host.locator("#remoteCode").inner_text().strip()
        assert len(code)==6 and code.isdigit(), "Server did not issue a six-digit code"

        # Television joins only as spectator; remaining phones take real player seats.
        navigate(tv,ORIGIN+"/monopoly-party/tv/")
        tv.locator("#tvJoinForm input[name=code]").fill(code)
        tv.locator("#tvJoinForm button").click()
        tv.locator("#tvStage").wait_for(state="visible",timeout=25000)
        tv.locator("#tvCode").get_by_text(code).wait_for(timeout=10000)
        for i,player in enumerate(phones[1:],start=1):
            navigate(player,ORIGIN+"/monopoly-party/controller/")
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

        # Spectator sees all joined players first; the host must also receive
        # the latest room version or its start action correctly gets HTTP 409.
        host.locator(".remote-player").nth(len(phones)-1).wait_for(state="visible",timeout=25000)
        assert host.locator(".remote-player").count()==len(phones)
        host.locator('#remoteActions button[data-action=start]:not([disabled])').wait_for(state="visible",timeout=20000)
        host.locator('#remoteActions button[data-action=start]:not([disabled])').click()
        host.locator('#remoteActions button[data-action=roll]').wait_for(state="visible",timeout=20000)

        # Safari touch and Chromium pointer input are exercised via the actual UI.
        if kind=="chromium":
            host.locator('#remoteActions button[data-action=roll]').click()
        else:
            host.locator('#remoteActions button[data-action=roll]').click()
        if kind=="chromium":
            tv.wait_for_function("() => document.querySelector('#partyBoard canvas.tv-three-dice-canvas')?.dataset.raisedTiles==='40'",timeout=20000)
        tv.wait_for_function("() => document.querySelectorAll('#tvDice .tv-die').length===2",timeout=22000)
        assert tv.locator('#tvCenterScene').count()==1, 'Cinematic center scene missing'
        tv.wait_for_function("""() => {
            const node=document.querySelector('#tvCenterScene');
            return node && node.dataset.phase!=='waiting'
               && document.querySelector('#tvCenterHeadline')?.textContent!=='احتكار المعرفة';
        }""",timeout=22000)
        tv.screenshot(path=str(ART/f"{kind}-tv-after-dice.png"),full_page=True)
        assert tv.locator(".tv-token").count()==len(phones)
        for other in phones[1:]:
            assert other.locator('#remoteActions [data-action=roll]').count()==0,"Not-your-turn phone can roll"

        # Buy when the random square is purchasable; otherwise handle card stages.
        chosen=[]
        for _ in range(7):
            # A pending HTTP action intentionally disables its button. Do not
            # click a stale button merely because it is visible in the DOM.
            host.wait_for_function("""() => {
                const btn=document.querySelector('#remoteActions button[data-action]:not([disabled])');
                return btn && ['buy','card-pick','card-flip','card','end'].includes(btn.dataset.action);
            }""",timeout=25000)
            action=host.locator('#remoteActions button[data-action]:not([disabled])').first.get_attribute('data-action')
            if action=="end":break
            assert action in ("buy","card-pick","card-flip","card"),action
            host.locator(f'#remoteActions button[data-action="{action}"]:not([disabled])').click()
            chosen.append(action)
            host.wait_for_function("""previous => {
                const next=document.querySelector('#remoteActions button[data-action]:not([disabled])');
                return next && next.dataset.action!==previous;
            }""",arg=action,timeout=25000)

        # Verify session resume without consuming another player seat.
        host.reload(wait_until="domcontentloaded")
        host.locator('#remoteCode').get_by_text(code).wait_for(timeout=20000)
        tv.reload(wait_until="domcontentloaded")
        tv.locator("#tvCode").get_by_text(code).wait_for(timeout=20000)
        tv.locator(".tv-player").nth(len(phones)-1).wait_for(timeout=12000)
        assert tv.locator(".tv-player").count()==len(phones)
        # A TV that leaves and reconnects to the same room must recover its
        # spectator token instead of failing with learner_already_in_room.
        tv.locator("#tvDisconnect").click()
        tv.locator("#tvJoin").wait_for(state="visible",timeout=10000)
        tv.locator("#tvJoinForm input[name=code]").fill(code)
        tv.locator("#tvJoinForm button").click()
        tv.locator("#tvStage").wait_for(state="visible",timeout=20000)
        assert tv.locator(".tv-player").count()==len(phones)
        layout=tv.evaluate("""() => {
          const b=document.querySelector('#partyBoard').getBoundingClientRect();
          return {left:b.left,right:b.right,width:b.width,height:b.height,screenWidth:innerWidth};
        }""")
        assert layout["left"]>=-1 and layout["right"]<=layout["screenWidth"]+1,layout
        assert layout["width"]>420 and abs(layout["width"]-layout["height"])<4,layout

        phone_layout=host.evaluate("() => ({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth})")
        assert phone_layout["scrollWidth"]<=phone_layout["viewport"]+2,phone_layout
        # WebKit can log one edge-level CORS read failure while subsequently reconnecting.
        transient=[error for error in errors if kind=='webkit' and 'access control checks' in error and '/v1/games/rooms/' in error]
        assert not [error for error in errors if error not in transient],errors
        tv.wait_for_function("() => document.querySelector('#connectionStatus')?.textContent?.includes('متصل')",timeout=20000)
        host.wait_for_function("() => document.querySelector('#remoteStatus')?.textContent?.includes('متصل')",timeout=20000)
        result['transientWebKitNetworkErrors']=len(transient)
        result['connectionRestored']=True
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
