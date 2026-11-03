#!/usr/bin/env python3
"""Offline deterministic TV + two independent phone controllers. No production writes."""
import copy, json, os
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

BASE=os.environ.get("FAMILY_TEST_URL","http://127.0.0.1:8790/")
OUT=Path("/tmp/monopoly-tv-qa")
OUT.mkdir(parents=True,exist_ok=True)
class MockRoom:
    def __init__(self):
        self.code="123456";self.version=0;self.status="waiting"
        self.players=[];self.tokens={};self.spectators={}
        self.state={"gameId":"family-monopoly","status":"waiting","players":[]}
        self.actions=[]
    def snapshot(self,token):
        player_id=self.tokens.get(token) or self.spectators.get(token)
        return {"code":self.code,"gameId":"family-monopoly","status":self.status,
                "version":self.version,"selfPlayerId":player_id,
                "players":[{"playerId":p["id"],"name":p["name"],"seat":i,
                            "participationRole":"player"} for i,p in enumerate(self.players)],
                "state":copy.deepcopy(self.state)}
    def handle(self,route):
        request=route.request
        parsed=urlparse(request.url);path=parsed.path;method=request.method
        try: body=json.loads(request.post_data or "{}")
        except Exception: body={}
        token=request.headers.get("x-game-token","")
        def answer(status,payload):route.fulfill(status=status,json=payload,headers={"access-control-allow-origin":"*"})
        if method=="OPTIONS":
            route.fulfill(status=204,headers={"access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"*"});return
        if path.endswith("/v1/games/rooms") and method=="POST":
            player={"id":"p1","name":body.get("displayName","مضيف")}
            self.players=[player];self.state["players"]=copy.deepcopy(self.players)
            self.tokens["private-p1"]="p1"
            answer(201,{"playerToken":"private-p1","room":self.snapshot("private-p1")});return
        if path.endswith("/v1/games/rooms/join") and method=="POST":
            if str(body.get("code"))!=self.code:
                answer(404,{"error":"room_not_found"});return
            if body.get("participationRole")=="spectator":
                secret="private-tv";self.spectators[secret]="viewer"
            elif len(self.players)<4 and self.status=="waiting":
                secret="private-p2";self.tokens[secret]="p2"
                self.players.append({"id":"p2","name":body.get("displayName","ضيف")})
                self.state["players"]=copy.deepcopy(self.players)
            else:
                answer(409,{"error":"room_not_waiting"});return
            self.version+=1
            answer(200,{"playerToken":secret,"room":self.snapshot(secret)});return
        if path.endswith("/v1/games/rooms/123456") and method=="GET":
            if token not in self.tokens and token not in self.spectators:
                answer(401,{"error":"invalid_game_token"});return
            answer(200,{"room":self.snapshot(token)});return
        if path.endswith("/v1/games/rooms/123456/actions") and method=="POST":
            if token not in self.tokens:
                answer(403,{"error":"spectator_cannot_act"});return
            if body.get("expectedVersion")!=self.version:
                answer(409,{"error":"version_conflict","room":self.snapshot(token)});return
            action=body.get("type")
            turn=self.state.get("turnIndex",0)
            player=self.tokens[token]
            turn_id=self.state["players"][turn]["id"] if self.status=="playing" else "p1"
            allowed_response=action in ("trade-accept","trade-reject") and self.state.get("tradeOffer",{}).get("targetId")==player
            if player!=turn_id and not allowed_response:
                answer(409,{"error":"not-your-turn"});return
            if action=="start" and self.status=="waiting" and len(self.players)>=2:
                self.status="playing"
                self.state={"gameId":"family-monopoly","status":"playing","phase":"roll","turnIndex":0,
                            "players":[{**p,"cash":1500,"position":0,"bankrupt":False,"jailed":False} for p in self.players],
                            "ownership":{},"pending":None,"dice":None,"log":"دور المضيف"}
            elif action=="roll" and self.state.get("phase")=="roll":
                self.state["phase"]="property";self.state["dice"]=[1,2]
                self.state["players"][turn]["position"]=3
                self.state["pending"]={"type":"buy","index":3}
                self.state["log"]="وصل اللاعب إلى طريف. بإمكانه الشراء"
            elif action=="buy" and self.state.get("phase")=="property":
                self.state["ownership"]["3"]={"ownerId":player,"houses":0}
                self.state["players"][turn]["cash"]-=60
                self.state["phase"]="end";self.state["pending"]=None
                self.state["log"]="اشترى طريف مقابل 60 ريال"
            elif action=="build" and self.state.get("phase") in ("end","roll"):
                key=str(body.get("index"))
                if key not in self.state["ownership"] or self.state["ownership"][key]["ownerId"]!=player:
                    answer(409,{"error":"invalid_build"});return
                self.state["ownership"][key]["houses"]+=1
                self.state["players"][turn]["cash"]-=50
                self.state["log"]="تم بناء بيت جديد"
            elif action=="trade" and self.state.get("phase")=="end":
                self.state["tradeOffer"]={"index":body.get("index"),"targetId":body.get("targetId"),"fromId":player,
                                        "offerCash":body.get("offerCash",0),"requestCash":body.get("requestCash",0)}
                self.state["phase"]="trade"
                self.state["log"]="بانتظار موافقة اللاعب الآخر"
            elif action in ("trade-accept","trade-reject") and self.state.get("phase")=="trade":
                offer=self.state["tradeOffer"]
                if player!=offer["targetId"]:
                    answer(409,{"error":"trade_recipient_only"});return
                if action=="trade-accept":
                    self.state["ownership"][str(offer["index"])]["ownerId"]=player
                self.state["tradeOffer"]=None;self.state["phase"]="end"
                self.state["log"]="تم تنفيذ التبادل" if action=="trade-accept" else "تم رفض التبادل"
            elif action=="end" and self.state.get("phase")=="end":
                self.state["turnIndex"]=1;self.state["phase"]="roll";self.state["dice"]=None
                self.state["log"]="دور الضيف"
            else:
                answer(409,{"error":"invalid-action"});return
            self.actions.append(action);self.version+=1
            self.state["presentation"]={"sequence":self.version,"action":action,"actorId":player}
            answer(200,{"room":self.snapshot(token)});return
        answer(404,{"error":"not_found"})
def run(browser_type,name):
    server=MockRoom();errors=[]
    browser=browser_type.launch(headless=True)
    tvc=browser.new_context(viewport={"width":1280,"height":720},service_workers="block",locale="ar-SA")
    hc=browser.new_context(viewport={"width":390,"height":844},is_mobile=name=="webkit",has_touch=True,service_workers="block",locale="ar-SA")
    gc=browser.new_context(viewport={"width":390,"height":844},is_mobile=name=="webkit",has_touch=True,service_workers="block",locale="ar-SA")
    for c in [tvc,hc,gc]:c.route("**/v1/games/rooms**",server.handle)
    tv=tvc.new_page();host=hc.new_page();guest=gc.new_page()
    for p in [tv,host,guest]:p.on("pageerror",lambda e:errors.append(str(e)))
    result={"browser":name}
    try:
        host.goto(BASE+"monopoly-party/controller/",wait_until="load")
        host.locator('input[name=name]').fill("مضيف")
        host.locator('button[value=create]').click()
        host.locator("#remoteCode").get_by_text("123456").wait_for(timeout=15000)
        tv.goto(BASE+"monopoly-party/tv/",wait_until="load")
        tv.locator('input[name=code]').fill("123456")
        tv.locator('#tvJoinForm button').click()
        tv.locator("#tvCode").get_by_text("123456").wait_for(timeout=15000)
        assert tv.locator("#tvQr svg").count()==1,"QR rendering failed"
        assert tv.locator(".tv-cell").count()==40
        guest.goto(BASE+"monopoly-party/controller/",wait_until="load")
        guest.locator("input[name=name]").fill("ضيف")
        guest.locator("input[name=code]").fill("123456")
        guest.locator('button[value=join]').click()
        guest.locator("#remoteCode").get_by_text("123456").wait_for(timeout=15000)
        host.locator('#remoteActions button[data-action=start]').wait_for(timeout=12000)
        tv.locator(".tv-player").nth(1).wait_for(timeout=10000)
        host.screenshot(path=str(OUT/f"{name}-host-lobby.png"),full_page=True)
        tv.screenshot(path=str(OUT/f"{name}-tv-lobby.png"),full_page=True)
        host.locator('#remoteActions button[data-action=start]').click()
        host.locator('#remoteActions button[data-action=roll]').wait_for(timeout=12000)
        guest.locator("#remoteActions button").filter(has_text="ارمِ النرد").count()==0
        host.locator('#remoteActions button[data-action=roll]').click()
        host.locator('#remoteActions button[data-action=buy]').wait_for(timeout=12000)
        tv.wait_for_function("() => document.querySelector('#tvEvent')?.textContent?.includes('أرض متاحة للشراء')",timeout=15000)
        tv.wait_for_function("() => document.querySelectorAll('#tvDice .tv-die').length===2",timeout=7000)
        assert tv.locator('.tv-token').count()==2
        tv.screenshot(path=str(OUT/f"{name}-tv-arrival.png"),full_page=True)
        host.screenshot(path=str(OUT/f"{name}-host-buy.png"),full_page=True)
        host.locator('#remoteActions button[data-action=buy]').click()
        host.locator('#remoteActions button[data-action=end]').wait_for(timeout=12000)

        # Exercise group development and trading with a prepared legal two-title set.
        server.state["ownership"]["1"]={"ownerId":"p1","houses":0}
        server.version+=1
        host.locator("#remotePortfolio .remote-estate").nth(1).wait_for(timeout=12000)
        building=host.locator("#remotePortfolio button").filter(has_text="بناء بيت").first
        building.wait_for(state="visible",timeout=15000)
        building.click()
        host.wait_for_function("() => document.querySelector('#remoteGameLog')?.textContent?.includes('بيت جديد')",timeout=12000)
        assert any(x.get("houses",0)>0 for x in server.state["ownership"].values())
        trade=host.locator("#remotePortfolio .remote-estate").nth(1).locator("button").filter(has_text="عرض تبادل")
        trade.click()
        host.locator("#remoteTradePanel select").select_option("p2")
        host.locator("#remoteTradePanel [name=offerCash]").fill("0")
        host.locator("#remoteTradePanel [name=requestCash]").fill("0")
        host.locator("#remoteTradePanel button[type=submit]").click()
        guest.locator('#remoteActions button[data-action=trade-accept]').wait_for(timeout=12000)
        guest.screenshot(path=str(OUT/f"{name}-trade-offer.png"),full_page=True)
        guest.locator('#remoteActions button[data-action=trade-accept]').click()
        host.locator('#remoteActions button[data-action=end]').wait_for(timeout=12000)
        assert server.state["ownership"]["3"]["ownerId"]=="p2"
        host.reload(wait_until="load")
        host.locator('#remoteActions button[data-action=end]').wait_for(timeout=12000)
        tv.reload(wait_until="load")
        tv.locator("#tvCode").get_by_text("123456").wait_for(timeout=12000)
        host.locator('#remoteActions button[data-action=end]').click()
        guest.locator('#remoteActions button[data-action=roll]').wait_for(timeout=12000)
        assert guest.locator('#remoteActions button[data-action=roll]').count()==1
        assert server.actions==["start","roll","buy","build","trade","trade-accept","end"],server.actions
        assert server.state["ownership"]["3"]["ownerId"]=="p2"
        assert server.state["players"][0]["cash"]==1390
        layout=tv.evaluate("""() => {
            const b=document.querySelector('#partyBoard').getBoundingClientRect();
            return {width:b.width,height:b.height,screenWidth:innerWidth,screenHeight:innerHeight};
        }""")
        assert layout["width"]>400 and layout["width"]<=layout["screenWidth"],layout
        assert abs(layout["width"]-layout["height"])<3,layout
        assert not errors,errors
        result.update({"status":"pass","actions":server.actions,"tvBoard":layout,"qr":"local SVG","spectatorSeats":0})
    except Exception as error:
        result.update({"status":"fail","error":f"{type(error).__name__}: {error}","actions":server.actions,"pageErrors":errors})
        for p,label in [(tv,"tv"),(host,"host"),(guest,"guest")]:
            try:p.screenshot(path=str(OUT/f"{name}-{label}-failure.png"),full_page=True)
            except Exception:pass
    finally:
        for c in [tvc,hc,gc]:c.close()
        browser.close()
    return result
def main():
    with sync_playwright() as pw:
        results=[run(pw.chromium,"chromium"),run(pw.webkit,"webkit")]
    (OUT/"results.json").write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf8")
    for r in results:print(json.dumps(r,ensure_ascii=False))
    if any(r["status"]!="pass" for r in results):raise SystemExit(1)
if __name__=="__main__":main()
