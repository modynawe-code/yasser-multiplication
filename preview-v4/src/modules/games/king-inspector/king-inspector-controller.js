import {createOnlineGameSession} from '../online/game-online-session.js';
import {createGameRoomClient} from '../online/game-room-client.js';
import {gameParticipantMarkup} from '../core/game-participant-registry.js';

const GAME_ID='king-inspector-thief-executioner';
const IDENTITY_KEY='king-inspector-online-player-v1';
const GUARDIAN_PARTICIPANTS=Object.freeze([
  Object.freeze({learnerId:'father',displayName:'الأب',symbol:'أ'}),
  Object.freeze({learnerId:'mother',displayName:'الأم',symbol:'م'})
]);
const by=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const ROLE_NAMES=Object.freeze({king:'الملك',inspector:'المفتش',thief:'اللص',executioner:'الجلاد'});
const ROLE_MARKS=Object.freeze({king:'♛',inspector:'⌕',thief:'◈',executioner:'✦'});
const CHALLENGES=Object.freeze([
  Object.freeze({id:'animal-voice',title:'صوت الحيوان',copy:'قلّد صوت حيوان يختاره لك الملك.'}),
  Object.freeze({id:'tongue-twister',title:'جملة سريعة',copy:'قل: خيط حرير على حيط خليل.'}),
  Object.freeze({id:'funny-sentence',title:'جملة مضحكة',copy:'اخترع جملة مضحكة من خمس كلمات.'})
]);

function ensureStyle(){
  if(document.querySelector('link[data-module-style="king-inspector-game"]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='src/modules/games/king-inspector/king-inspector.css?v=1';link.dataset.moduleStyle='king-inspector-game';document.head.appendChild(link);
}

function ensureShell(){
  if(by('kingInspectorView'))return;
  ensureStyle();const main=document.querySelector('main');if(!main)return;
  const section=document.createElement('section');section.id='kingInspectorView';section.className='view';
  section.innerHTML=`<div class="ki-shell">
    <header class="ki-header"><button class="icon-btn" id="kiBack">الألعاب</button><div><div class="kicker">تحدي العائلة · ٤ لاعبين</div><h1>الملك والمفتش</h1></div><button type="button" class="ki-sound" id="kiSound" aria-label="كتم المؤثرات الصوتية" aria-pressed="false">♪</button></header>
    <section class="ki-panel ki-setup" id="kiSetup"><div class="ki-hero"><img src="assets/games/king-inspector/role-cast.webp" alt="شخصيات الملك والمفتش واللص والجلاد" decoding="async"><div><span class="ki-eyebrow">أربع شخصيات · جولة جماعية</span><h2>مين يكشف اللص؟</h2><p>ادخلوا الغرفة من أربعة أجهزة، واسحبوا أدواركم بسرية.</p></div></div>
      <div class="ki-identity"><label for="kiIdentity">اللاعب من هذا الجهاز</label><select id="kiIdentity"></select></div>
      <div class="ki-connect"><button class="btn primary" id="kiCreate">إنشاء غرفة</button><div class="ki-join"><label for="kiCode">أو أدخل رمز الغرفة</label><div><input id="kiCode" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000" aria-label="رمز الغرفة المكوّن من ستة أرقام" dir="ltr"><button class="btn secondary" id="kiJoin">انضمام</button></div></div></div>
      <button class="ki-resume" id="kiResume" hidden>استعادة الغرفة السابقة</button><p class="ki-status" id="kiSetupStatus" role="status" aria-live="polite"></p>
    </section>
    <section class="ki-panel ki-lobby" id="kiLobby" hidden><div class="ki-room-head"><div><span class="ki-eyebrow">غرفة اللعب</span><h2>اجمعوا الأربعة</h2></div><div class="ki-room-code"><small>رمز الغرفة</small><strong id="kiRoomCode">------</strong><button type="button" id="kiCopyCode">نسخ الرمز</button></div></div><p class="ki-lobby-copy">افتحوا اللعبة من جهاز كل لاعب وأدخلوا الرمز. تبدأ الجولة عند اكتمال المقاعد.</p><div class="ki-seats" id="kiSeats"></div><p class="ki-status" id="kiLobbyStatus" role="status" aria-live="polite"></p></section>
    <section class="ki-panel ki-play" id="kiPlay" hidden><div class="ki-game-head"><div><span class="ki-eyebrow" id="kiRoundLabel">الجولة ١</span><h2 id="kiGameTitle">مين المفتش؟</h2></div><div class="ki-room-badge">الغرفة <b id="kiMiniCode">------</b></div></div><div class="ki-table"><div class="ki-player-grid" id="kiPlayers"></div><div class="ki-center"><img src="assets/games/king-inspector/role-cast.webp" alt="" aria-hidden="true" decoding="async"><div class="ki-phase" id="kiPhase" role="status" aria-live="polite"></div><div class="ki-actions" id="kiActions"></div></div></div><div class="ki-score-strip" id="kiScores"></div><p class="ki-status" id="kiPlayStatus" role="status" aria-live="polite"></p></section>
  </div>`;
  main.append(section);
}

export function createKingInspectorController({participants=[],roomClient=createGameRoomClient(),showView,onBack}={}){
  let bound=false,selectedLearnerId=loadIdentity(),room=null,busy=false,lastPhase='',muted=false;
  const allParticipants=[...participants,...GUARDIAN_PARTICIPANTS].filter((item,index,items)=>item?.learnerId&&items.findIndex(other=>other.learnerId===item.learnerId)===index);
  const audioKey='king-inspector-sound-muted-v1';
  function loadIdentity(){try{return String(localStorage.getItem(IDENTITY_KEY)||'');}catch{return'';}}
  function saveIdentity(id){selectedLearnerId=id;try{localStorage.setItem(IDENTITY_KEY,id);}catch{}}
  const session=createOnlineGameSession({gameId:GAME_ID,roomClient,pollIntervalMs:900,onRoom:next=>{room=next;const phase=next?.state?.phase||'';if(lastPhase&&phase!==lastPhase)playCue(phase);lastPhase=phase;render();},onError:error=>{busy=false;const target=room?by('kiPlayStatus'):by('kiSetupStatus');if(target)target.textContent=errorMessage(error);}});
  const state=()=>room?.state||{};
  const self=()=>session.snapshot.selfPlayerId;
  const players=()=>room?.players||[];
  const player=id=>players().find(item=>item.playerId===id)||null;
  const name=id=>player(id)?.name||player(id)?.learnerId||'لاعب';
  const learner=id=>player(id)?.learnerId||'';
  const portrait=id=>{const item=allParticipants.find(p=>p.learnerId===learner(id));return item?gameParticipantMarkup(item,{imageClass:'ki-avatar-img',fallbackClass:'ki-avatar-fallback'}):'<span class="ki-avatar-fallback" aria-hidden="true">؟</span>';};
  function showPanel(id){for(const key of ['kiSetup','kiLobby','kiPlay']){const node=by(key);if(node)node.hidden=key!==id;}}
  function playCue(phase){if(muted)return;try{const Ctx=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Ctx)return;const ctx=new Ctx(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=phase==='finished'?740:phase==='challenge'||phase==='challenge-response'?560:440;gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.05,ctx.currentTime+.018);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.16);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.17);osc.onended=()=>ctx.close();}catch{}}
  function setStatus(id,message,error=false){const el=by(id);if(el){el.textContent=message||'';el.classList.toggle('error',Boolean(error));}}
  function errorMessage(error){const code=error?.body?.error||error?.message||'';const map={room_not_found:'الغرفة غير موجودة أو انتهت.',room_full:'اكتملت المقاعد الأربعة.',room_not_waiting:'بدأت الجولة بالفعل.',learner_already_in_room:'هذا اللاعب مسجل في الغرفة من جهاز آخر.',too_many_join_attempts:'محاولات كثيرة؛ انتظر قليلًا ثم جرّب.',version_conflict:'تحدّثت حالة الجولة. تمت مزامنتها، أعد المحاولة.'};return map[code]||'تعذر تنفيذ الخطوة. تحقق من الاتصال ثم أعد المحاولة.';}
  function renderIdentities(){const select=by('kiIdentity');if(!select)return;select.innerHTML=allParticipants.map(item=>`<option value="${esc(item.learnerId)}" ${selectedLearnerId===item.learnerId?'selected':''}>${esc(item.displayName)}</option>`).join('');if(!allParticipants.some(item=>item.learnerId===selectedLearnerId)&&allParticipants[0])saveIdentity(allParticipants[0].learnerId);select.value=selectedLearnerId;}
  function renderResume(){const button=by('kiResume');if(button)button.hidden=!selectedLearnerId||!session.hasResume(selectedLearnerId);}
  function renderSetup(){room=null;showPanel('kiSetup');renderIdentities();renderResume();setStatus('kiSetupStatus','');}
  function renderLobby(){showPanel('kiLobby');const s=state();by('kiRoomCode').textContent=room.code||'------';const list=players();by('kiSeats').innerHTML=Array.from({length:4},(_,index)=>{const item=list[index];return item?`<article class="ki-seat ${item.playerId===self()?'is-self':''}"><span class="ki-seat-art">${portrait(item.playerId)}</span><strong>${esc(item.name||item.learnerId)}</strong><small>${item.playerId===self()?'هذا الجهاز':item.authorityRole==='host'?'صاحب الغرفة':'انضم للغرفة'}</small></article>`:`<article class="ki-seat is-empty"><span class="ki-seat-empty">${index+1}</span><strong>مقعد شاغر</strong><small>بانتظار لاعب</small></article>`;}).join('');setStatus('kiLobbyStatus',`${list.length} من ٤ لاعبين — تبدأ الجولة تلقائيًا عند اكتمال المقاعد.`);}
  function roleFor(id){const s=state();return s.publicRoles?.[id]||(id===self()?s.privateRole:null);}
  function renderPlayers(){const host=by('kiPlayers'),s=state();if(!host)return;host.innerHTML=players().map(item=>{const role=roleFor(item.playerId),current=s.publicRoles?.[item.playerId]||'';return`<article class="ki-player ${current?`role-${current}`:''} ${item.playerId===self()?'is-self':''}"><span class="ki-player-avatar">${portrait(item.playerId)}</span><div class="ki-player-copy"><strong>${esc(item.name||item.learnerId)}</strong><span>${role?`${ROLE_MARKS[role]} ${ROLE_NAMES[role]}`:item.playerId===self()?'دورك سرّي':'الدور سرّي'}</span></div>${s.kingPlayerId===item.playerId?'<i class="ki-crown" aria-label="الملك">♛</i>':''}</article>`;}).join('');}
  function renderScores(){const host=by('kiScores'),s=state();if(!host)return;host.innerHTML=players().map(item=>`<span class="ki-score ${item.playerId===self()?'is-self':''}"><b>${esc(item.name||item.learnerId)}</b><strong>${Number(s.scores?.[item.playerId]||0)}</strong><small>فوز</small></span>`).join('');}
  function actionButton(label,type,enabled=true,cls=''){return`<button type="button" class="ki-action ${cls}" data-ki-action="${esc(type)}" ${enabled&&!busy?'':'disabled'}>${esc(label)}</button>`;}
  function renderActions(){
    const host=by('kiActions'),title=by('kiGameTitle'),phase=by('kiPhase'),s=state(),id=self(),role=s.privateRole;host.innerHTML='';
    if(s.phase==='king-question'){
      title.textContent='الملك يسأل';phase.textContent='مين المفتش؟';host.innerHTML=actionButton('مين المفتش؟','ask-inspector',role==='king');
      if(role!=='king')phase.textContent=role==='inspector'?'الملك يسألك — جهّز ردك':'انتظر سؤال الملك';
    }else if(s.phase==='inspector-claim'){
      title.textContent='دور المفتش';phase.textContent=role==='inspector'?'قل للملك: أنا حضرتك':'المفتش يعرّف عن نفسه';host.innerHTML=actionButton('أنا حضرتك','claim-inspector',role==='inspector');
    }else if(s.phase==='king-command'){
      title.textContent='أمر الملك';phase.textContent='المفتش حضر — طلع اللص من الجلاد';host.innerHTML=actionButton('طلع اللص من الجلاد','issue-command',role==='king');
    }else if(s.phase==='inspector-choosing'){
      title.textContent='اختيار المفتش';phase.textContent=role==='inspector'?'اختر اللص من بين الجلاد واللاعب الآخر':'المفتش يختار بين لاعبين';
      if(role==='inspector')host.innerHTML=players().filter(item=>item.playerId!==s.kingPlayerId&&item.playerId!==id).map(item=>`<button type="button" class="ki-suspect" data-ki-suspect="${esc(item.playerId)}" ${busy?'disabled':''}><span>${portrait(item.playerId)}</span><strong>${esc(item.name||item.learnerId)}</strong></button>`).join('');
    }else if(s.phase==='challenge'){
      const caught=Boolean(s.accusation?.caught);title.textContent=caught?'كشف المفتش اللص!':'اللص أفلت من الكشف';phase.textContent=caught?`${name(s.accusation?.targetPlayerId)} كان اللص.`:`اختار المفتش ${name(s.accusation?.targetPlayerId)}؛ اللص الحقيقي كان ${name(Object.keys(s.publicRoles||{}).find(pid=>s.publicRoles[pid]==='thief'))}.`;
      const target=name(s.penaltyTargetId);host.innerHTML=`<p class="ki-penalty-target">التحدي على: <strong>${esc(target)}</strong></p>${role==='king'?CHALLENGES.map(challenge=>actionButton(challenge.title,'choose-challenge',true,'secondary')).join('')+actionButton('بدون تحدٍ','skip-challenge',true,'quiet'):actionButton('تخطي التحدي','skip-challenge',id===s.penaltyTargetId,'quiet')}`;
      host.querySelectorAll('[data-ki-action="choose-challenge"]').forEach((button,index)=>button.dataset.challengeId=CHALLENGES[index].id);
    }else if(s.phase==='challenge-response'){
      const challenge=CHALLENGES.find(item=>item.id===s.penaltyChallengeId);title.textContent='التحدي المرح';phase.textContent=challenge?.copy||'نفّذ التحدي أو تخطّه.';host.innerHTML=actionButton('تم التحدي','complete-challenge',id===s.penaltyTargetId,'success')+actionButton('تخطي','skip-challenge',id===s.penaltyTargetId,'quiet');
    }else if(s.phase==='finished'){
      const winners=(s.winnerIds||[]).map(name);title.textContent=s.accusation?.caught?'نجح فريق الملك':'فاز اللص';phase.textContent=s.penaltySkipped?'تم تخطي التحدي.':s.accusation?.caught?'المفتش كشف اللص. جولة موفقة!':'المفتش أخطأ، واللص أفلت.';host.innerHTML=`<div class="ki-winner-line">${esc(winners.join(' · '))}</div>${actionButton('جولة جديدة — وزّعوا الأدوار','next-round',true,'primary')}`;
    }
    host.querySelectorAll('[data-ki-action]').forEach(button=>button.addEventListener('click',()=>{const payload=button.dataset.challengeId?{challengeId:button.dataset.challengeId}:{};void act(button.dataset.kiAction,payload);}));
    host.querySelectorAll('[data-ki-suspect]').forEach(button=>button.addEventListener('click',()=>{void confirmAccusation(button.dataset.kiSuspect);}));
  }
  function confirmAccusation(targetPlayerId){const person=name(targetPlayerId);if(!globalThis.confirm||confirm(`تأكيد اختيار ${person}؟`))void act('accuse',{targetPlayerId});}
  function renderPlay(){showPanel('kiPlay');by('kiMiniCode').textContent=room?.code||'------';by('kiRoundLabel').textContent=`الجولة ${Number(state().round||1).toLocaleString('ar-SA')}`;renderPlayers();renderScores();renderActions();}
  function render(){if(!room){renderSetup();return;}by('kiRoomCode').textContent=room.code||'------';if(state().status==='waiting')renderLobby();else renderPlay();}
  async function act(type,payload={}){if(busy)return;busy=true;renderActions();try{await session.submit(type,payload);}catch(error){setStatus(room?'kiPlayStatus':'kiSetupStatus',errorMessage(error),true);}finally{busy=false;if(room)render();}}
  async function connect(mode){if(busy)return;if(!selectedLearnerId){setStatus('kiSetupStatus','اختر لاعب هذا الجهاز.',true);return;}busy=true;renderActions();setStatus('kiSetupStatus',mode==='create'?'جارٍ إنشاء الغرفة…':'جارٍ دخول الغرفة…');try{const person=allParticipants.find(item=>item.learnerId===selectedLearnerId),options={displayName:person?.displayName||selectedLearnerId};if(mode==='create')await session.create(selectedLearnerId,options);else await session.join(String(by('kiCode').value||'').replace(/\D/g,'').slice(0,6),selectedLearnerId,options);}catch(error){setStatus('kiSetupStatus',errorMessage(error),true);}finally{busy=false;renderResume();if(room)render();}}
  async function resume(){if(!selectedLearnerId||busy)return;busy=true;try{await session.resume({learnerId:selectedLearnerId});}catch(error){setStatus('kiSetupStatus',errorMessage(error),true);}finally{busy=false;if(room)render();renderResume();}}
  async function copyCode(){try{await navigator.clipboard.writeText(room?.code||'');setStatus('kiLobbyStatus','نسخت رمز الغرفة. أرسله للاعبين الثلاثة.');}catch{setStatus('kiLobbyStatus',`رمز الغرفة: ${room?.code||'------'}`);}}
  function bind(){if(bound)return;bound=true;ensureShell();try{muted=localStorage.getItem(audioKey)==='1';}catch{muted=false;}const sound=by('kiSound');sound?.setAttribute('aria-pressed',String(muted));sound?.setAttribute('aria-label',muted?'تشغيل المؤثرات الصوتية':'كتم المؤثرات الصوتية');if(sound)sound.textContent=muted?'×♪':'♪';
    by('kiBack')?.addEventListener('click',leave);by('kiCreate')?.addEventListener('click',()=>connect('create'));by('kiJoin')?.addEventListener('click',()=>connect('join'));by('kiResume')?.addEventListener('click',resume);by('kiCopyCode')?.addEventListener('click',copyCode);by('kiIdentity')?.addEventListener('change',event=>{saveIdentity(event.target.value);renderResume();});by('kiCode')?.addEventListener('input',event=>{event.target.value=String(event.target.value||'').replace(/\D/g,'').slice(0,6);});if(sound)sound.addEventListener('click',()=>{muted=!muted;try{localStorage.setItem(audioKey,muted?'1':'0');}catch{}sound.textContent=muted?'×♪':'♪';sound.setAttribute('aria-pressed',String(muted));sound.setAttribute('aria-label',muted?'تشغيل المؤثرات الصوتية':'كتم المؤثرات الصوتية');});
  }
  function start(){bind();document.body.classList.add('king-inspector-mode','games-mode');showView?.('kingInspectorView');renderSetup();}
  function leave(){session.stop();room=null;lastPhase='';document.body.classList.remove('king-inspector-mode');onBack?.();}
  return Object.freeze({start,leave,stop(){session.stop();room=null;},getRoom(){return room;}});
}
