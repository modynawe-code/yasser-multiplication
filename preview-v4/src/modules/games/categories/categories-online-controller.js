import { FAMILY_WORD_CATEGORIES,answerStartsWithLetter,normalizeArabicAnswer } from './categories-engine.js';
import { createOnlineGameSession } from '../online/game-online-session.js';
import { createGameRoomClient } from '../online/game-room-client.js';
import { applySystemInsets } from '../../../shared/ui/system-insets.js';

const byId=id=>document.getElementById(id);
const IDENTITY_KEY='family-word-categories-online-player-v1';
const PLAYERS=Object.freeze([
  Object.freeze({id:'yasser',name:'ياسر',symbol:'🧑',avatar:'assets/visual/original/yasser/welcome.png'}),
  Object.freeze({id:'khaled',name:'خالد',symbol:'🧒',avatar:'assets/visual/original/khaled/khaled-point-thumbsup.png'}),
  Object.freeze({id:'mashaal',name:'مشاعل',symbol:'🌸',avatar:'assets/mashaal/domains/language.webp'}),
  Object.freeze({id:'father',name:'الأب',symbol:'👨',avatar:null}),
  Object.freeze({id:'mother',name:'الأم',symbol:'👩',avatar:null})
]);
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const visual=player=>player?.avatar?`<img src="${player.avatar}" alt="" decoding="async">`:`<span aria-hidden="true">${player?.symbol||'🎮'}</span>`;
const playerByLearner=id=>PLAYERS.find(player=>player.id===id)||null;
const comparableAnswer=value=>{const normalized=normalizeArabicAnswer(value);return normalized.startsWith('ال')&&normalized.length>2?normalized.slice(2):normalized;};
const localDayKey=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
function loadIdentity(){try{return String(localStorage.getItem(IDENTITY_KEY)||'');}catch{return'';}}
function saveIdentity(id){try{localStorage.setItem(IDENTITY_KEY,id);}catch{}return id;}
function ensureStyle(){if(document.querySelector('link[data-module-style="family-word-categories-online"]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href='src/modules/games/categories/categories-online.css';link.dataset.moduleStyle='family-word-categories-online';document.head.appendChild(link);}
function seconds(ms){return`${(Math.max(0,Number(ms||0))/1000).toFixed(1)}ث`;}
function clock(ms){const total=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(total/60),s=total%60;return`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}

function ensureShell(){
  if(byId('categoriesOnlineView'))return;ensureStyle();const main=document.querySelector('main');if(!main)return;
  const host=document.createElement('div');host.innerHTML=`
  <section id="categoriesOnlineView" class="view">
    <div class="fwco-shell">
      <header class="fwco-header"><button class="icon-btn" id="fwcoBack">رجوع</button><div><div class="kicker">كل واحد من جهازه</div><h1>تحدي الحرف العائلي</h1><p>2–5 لاعبين • مؤقت واحد • وقت كل لاعب يتوقف عند «خلصت»</p></div><div class="fwco-mini" id="fwcoMini" hidden><small>الغرفة</small><strong id="fwcoMiniCode">------</strong></div></header>
      <section class="fwco-panel" id="fwcoSetup">
        <h2>مين يلعب من هذا الجهاز؟</h2><div class="fwco-identities" id="fwcoIdentities"></div>
        <div class="fwco-config"><label>وقت الجولة<select id="fwcoDuration"><option value="60">60 ثانية</option><option value="90" selected>90 ثانية</option><option value="120">120 ثانية</option></select></label><label>عدد الجولات<select id="fwcoRounds"><option value="3" selected>3 جولات</option><option value="5">5 جولات</option></select></label></div>
        <button class="btn primary" id="fwcoCreate">إنشاء غرفة</button><div class="fwco-or">أو</div><div class="fwco-join"><input id="fwcoCode" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="رمز الغرفة"><button class="btn secondary" id="fwcoJoin">دخول</button></div>
        <button class="fwco-resume" id="fwcoResume" hidden>استعادة الغرفة السابقة</button><p class="fwco-status" id="fwcoSetupStatus"></p>
      </section>
      <section class="fwco-panel" id="fwcoLobby" hidden><div class="fwco-code"><span>رمز الغرفة</span><strong id="fwcoRoomCode">------</strong><small>كل شخص يفتح اللعبة من جهازه ويدخل الرمز.</small></div><div class="fwco-room-meta" id="fwcoRoomMeta"></div><div class="fwco-players" id="fwcoPlayers"></div><button class="btn primary" id="fwcoStart" hidden>ابدأ المباراة</button><p class="fwco-status" id="fwcoLobbyStatus"></p></section>
      <section class="fwco-panel" id="fwcoPlay" hidden><div class="fwco-hud"><div><small>الحرف</small><strong id="fwcoLetter">م</strong></div><div><small>الجولة</small><strong id="fwcoRound">1 / 3</strong></div><div class="fwco-timer" id="fwcoTimer"><small>الوقت</small><strong id="fwcoTime">01:30</strong></div></div><div class="fwco-progress" id="fwcoProgress"></div><form id="fwcoForm"><div class="fwco-fields" id="fwcoFields"></div><button class="btn primary fwco-submit" id="fwcoSubmit" type="submit" disabled>خلصت ✓</button><p class="fwco-status" id="fwcoPlayStatus"></p></form></section>
      <section class="fwco-panel" id="fwcoReview" hidden><div class="fwco-title"><span class="kicker">التحكيم</span><h2>راجعوا الكلمات</h2><p>صاحب الغرفة فقط يعتمد أو يرفض الكلمة.</p></div><div class="fwco-table-wrap"><table id="fwcoTable"></table></div><button class="btn primary" id="fwcoFinalize" hidden>اعتماد نتيجة الجولة</button><p class="fwco-status" id="fwcoReviewStatus"></p></section>
      <section class="fwco-panel" id="fwcoResult" hidden><div class="fwco-title"><span class="kicker" id="fwcoResultKicker">نتيجة الجولة</span><h2 id="fwcoResultTitle"></h2></div><div class="fwco-scoreboard" id="fwcoScoreboard"></div><div class="fwco-actions"><button class="btn primary" id="fwcoNext" hidden>الجولة التالية</button><button class="btn secondary" id="fwcoReset" hidden>مباراة جديدة</button></div></section>
    </div>
  </section>`;
  const view=host.firstElementChild;main.appendChild(view);applySystemInsets(view.querySelector('.fwco-shell'));
}

export function createCategoriesOnlineController({showView,onBack,roomClient=createGameRoomClient()}={}){
  let bound=false,room=null,selectedLearnerId=loadIdentity(),busy=false,timer=null,timeoutKey='',draftRound=0,draft={},clockOffset=0;
  const session=createOnlineGameSession({gameId:'family-word-categories',roomClient,onRoom:next=>{room=next;const serverNow=Number(next?.state?.serverNow);if(Number.isFinite(serverNow))clockOffset=serverNow-Date.now();busy=false;render();},onError:handleError,pollIntervalMs:800});
  const s=()=>room?.state||null,self=()=>session.snapshot.selfPlayerId,isHost=()=>s()?.players?.[0]===self();
  const roomPlayer=pid=>(room?.players||[]).find(p=>p.playerId===pid)||null;
  const name=pid=>roomPlayer(pid)?.name||roomPlayer(pid)?.learnerId||'لاعب';
  const learner=pid=>roomPlayer(pid)?.learnerId||'';
  const playerVisual=pid=>visual(playerByLearner(learner(pid))||{symbol:'🎮'});
  function stopTimer(){if(timer){clearInterval(timer);timer=null;}}
  function showPanel(id){for(const key of ['fwcoSetup','fwcoLobby','fwcoPlay','fwcoReview','fwcoResult']){const node=byId(key);if(node)node.hidden=key!==id;}}
  function status(id,text,error=false){const node=byId(id);if(node){node.textContent=text||'';node.classList.toggle('error',Boolean(error));}}
  function syncMini(){const mini=byId('fwcoMini');if(mini)mini.hidden=!room?.code;if(byId('fwcoMiniCode'))byId('fwcoMiniCode').textContent=room?.code||'------';}
  function renderIdentities(){const host=byId('fwcoIdentities');if(!host)return;host.innerHTML=PLAYERS.map(p=>`<button type="button" class="${selectedLearnerId===p.id?'selected':''}" data-fwco-id="${p.id}"><span>${visual(p)}</span><strong>${p.name}</strong></button>`).join('');host.querySelectorAll('[data-fwco-id]').forEach(btn=>btn.addEventListener('click',()=>{selectedLearnerId=saveIdentity(btn.dataset.fwcoId);renderIdentities();renderResume();}));}
  function renderResume(){const button=byId('fwcoResume');if(button)button.hidden=!selectedLearnerId||!session.hasResume(selectedLearnerId);}
  function renderSetup(){stopTimer();room=null;showPanel('fwcoSetup');syncMini();renderIdentities();renderResume();status('fwcoSetupStatus','');}
  function renderLobby(){showPanel('fwcoLobby');syncMini();const state=s();byId('fwcoRoomCode').textContent=room.code;byId('fwcoRoomMeta').innerHTML=`<span>⏱ ${state.durationSec} ثانية</span><span>🎯 ${state.roundsTotal} جولات</span><span>👥 ${state.players.length}/5</span>`;byId('fwcoPlayers').innerHTML=state.players.map((pid,i)=>`<article class="${pid===self()?'self':''}"><span>${i===0?'👑':'🎮'}</span><div><strong>${escapeHtml(name(pid))}</strong><small>${pid===self()?'هذا الجهاز':i===0?'صاحب الغرفة':'جاهز'}</small></div></article>`).join('');const start=byId('fwcoStart');start.hidden=!isHost();start.disabled=state.players.length<2;status('fwcoLobbyStatus',isHost()?(state.players.length<2?'نحتاج لاعبًا ثانيًا على الأقل.':'إذا دخل الجميع اضغط ابدأ.'):'بانتظار صاحب الغرفة…');}
  function ensureDraft(){const state=s();if(!state)return;if(draftRound!==state.round){draftRound=state.round;draft=Object.fromEntries(FAMILY_WORD_CATEGORIES.map(c=>[c.id,'']));}}
  function currentAnswers(){ensureDraft();return Object.fromEntries(FAMILY_WORD_CATEGORIES.map(c=>[c.id,String(draft[c.id]||'').trim()]));}
  function ready(){const state=s();return Boolean(state?.letter&&FAMILY_WORD_CATEGORIES.every(c=>{const value=String(draft[c.id]||'').trim();return value&&answerStartsWithLetter(value,state.letter);}));}
  function renderProgress(){const state=s(),done=new Set(state.submittedPlayers||Object.keys(state.submissions||{}));byId('fwcoProgress').innerHTML=state.players.map(pid=>`<span class="${done.has(pid)?'done':''}">${done.has(pid)?'✓':'…'} <strong>${escapeHtml(name(pid))}</strong></span>`).join('');}
  function renderFields(){ensureDraft();const state=s(),own=state.submissions?.[self()];byId('fwcoFields').innerHTML=FAMILY_WORD_CATEGORIES.map(c=>`<label><span>${c.icon} ${c.label}</span><input data-fwco-answer="${c.id}" value="${escapeHtml(own?.answers?.[c.id]??draft[c.id]??'')}" ${own?'disabled':''} maxlength="40" autocomplete="off" placeholder="كلمة بحرف ${state.letter}"></label>`).join('');byId('fwcoFields').querySelectorAll('[data-fwco-answer]').forEach(input=>input.addEventListener('input',()=>{draft[input.dataset.fwcoAnswer]=input.value;input.classList.toggle('bad',Boolean(input.value.trim())&&!answerStartsWithLetter(input.value,state.letter));updateSubmit();}));}
  function updateSubmit(){const button=byId('fwcoSubmit'),state=s();if(button)button.disabled=busy||Boolean(state?.submissions?.[self()])||!ready();}
  function remaining(){const end=Date.parse(s()?.deadlineAt||'');return Number.isFinite(end)?end-(Date.now()+clockOffset):0;}
  function tick(){const ms=remaining();byId('fwcoTime').textContent=clock(ms);byId('fwcoTimer').classList.toggle('urgent',ms<=10000&&ms>0);if(ms<=0){stopTimer();void timeoutSubmit();}}
  function startTimer(){stopTimer();tick();timer=setInterval(tick,250);}
  async function timeoutSubmit(){const state=s(),key=`${room?.code}:${state?.round}`;if(!state||state.status!=='playing'||timeoutKey===key)return;timeoutKey=key;try{if(!state.submissions?.[self()])await session.submit('submit',{answers:currentAnswers()});}catch(error){if((error?.body?.error||error?.message)==='round-not-playing')return;timeoutKey='';setTimeout(()=>timeoutSubmit(),600);return;}try{await session.submit('expire');}catch(error){if((error?.body?.error||error?.message)==='round-still-active'){timeoutKey='';setTimeout(()=>timeoutSubmit(),600);}}}
  function renderPlay(){showPanel('fwcoPlay');syncMini();const state=s();ensureDraft();byId('fwcoLetter').textContent=state.letter;byId('fwcoRound').textContent=`${state.round} / ${state.roundsTotal}`;renderProgress();renderFields();const own=state.submissions?.[self()];status('fwcoPlayStatus',own?`تم التسليم ✓ وقف وقتك عند ${seconds(own.elapsedMs)}. ننتظر الباقين.`:'عبّ الخانات الخمس ثم اضغط «خلصت».');updateSubmit();startTimer();}
  function duplicateCount(cat,answer){const key=comparableAnswer(answer);if(!key)return 0;let count=0;for(const pid of s().players){const other=comparableAnswer(s().submissions?.[pid]?.answers?.[cat]||'');if(other===key)count++;}return count;}
  function renderReview(){stopTimer();showPanel('fwcoReview');syncMini();const state=s(),table=byId('fwcoTable');table.innerHTML=`<thead><tr><th>اللاعب</th>${FAMILY_WORD_CATEGORIES.map(c=>`<th>${c.icon} ${c.label}</th>`).join('')}</tr></thead><tbody>${state.players.map(pid=>`<tr><th>${escapeHtml(name(pid))}<small>${seconds(state.submissions?.[pid]?.elapsedMs)}</small></th>${FAMILY_WORD_CATEGORIES.map(c=>{const sub=state.submissions?.[pid],answer=sub?.answers?.[c.id]||'—',basic=Boolean(sub?.basicValidity?.[c.id]),valid=basic&&state.judgments?.[pid]?.[c.id]!==false,duplicate=duplicateCount(c.id,answer)>1;return`<td class="${valid?'valid':'invalid'} ${duplicate?'duplicate':''}"><strong>${escapeHtml(answer)}</strong>${duplicate?'<small>مكررة</small>':''}${isHost()?`<button data-fwco-judge-player="${pid}" data-fwco-judge-category="${c.id}" data-fwco-judge-valid="${valid?'false':'true'}" ${basic?'':'disabled'}>${valid?'✓ مقبولة':'✕ مرفوضة'}</button>`:`<small>${valid?'مقبولة':'مرفوضة'}</small>`}</td>`;}).join('')}</tr>`).join('')}</tbody>`;table.querySelectorAll('[data-fwco-judge-player]').forEach(btn=>btn.addEventListener('click',()=>judge(btn)));byId('fwcoFinalize').hidden=!isHost();status('fwcoReviewStatus',isHost()?'راجعوا الكلمات ثم اعتمد النتيجة.':'بانتظار صاحب الغرفة يعتمد النتيجة…');}
  function renderScoreboard(){const state=s(),ordered=[...state.players].sort((a,b)=>Number(state.scores?.[b]||0)-Number(state.scores?.[a]||0));byId('fwcoScoreboard').innerHTML=ordered.map((pid,i)=>`<article class="${i===0?'winner':''}"><span>${['🥇','🥈','🥉'][i]||'⭐'}</span><span class="avatar">${playerVisual(pid)}</span><div><strong>${escapeHtml(name(pid))}</strong><small>الجولة +${Number(state.roundScores?.[pid]||0)}${Number(state.roundSpeedBonus?.[pid]||0)?` • سرعة +${state.roundSpeedBonus[pid]}`:''}</small></div><b>${Number(state.scores?.[pid]||0)}</b></article>`).join('');}
  function renderResult(){stopTimer();showPanel('fwcoResult');syncMini();const state=s(),finished=state.status==='finished',winners=(finished?state.winnerIds:state.roundWinnerIds)||[],names=winners.map(name);byId('fwcoResultKicker').textContent=finished?'النتيجة النهائية':`نتيجة الجولة ${state.round}`;byId('fwcoResultTitle').textContent=names.length>1?`تعادل ${names.join(' و ')} 🤝`:`${names[0]||'أحسنتم'} ${finished?'بطل المباراة 🏆':'فاز بالجولة ⭐'}`;renderScoreboard();byId('fwcoNext').hidden=finished||!isHost();byId('fwcoReset').hidden=!finished||!isHost();}
  function render(){if(!room){renderSetup();return;}const state=s();syncMini();if(state.status==='waiting')renderLobby();else if(state.status==='playing')renderPlay();else if(state.status==='review')renderReview();else renderResult();}
  function errorCode(error){return error?.body?.error||error?.message||'';}
  function handleError(error){busy=false;const code=errorCode(error),messages={room_not_found:'الغرفة غير موجودة أو انتهت.',room_full:'الغرفة اكتملت — الحد 5.',learner_already_in_room:'هذا اللاعب موجود بالغرفة.',room_not_waiting:'المباراة بدأت بالفعل.',version_conflict:'تحدّثت الجولة، جرّب مرة ثانية.','incomplete-answers':'كمّل كل الخانات.','answer-letter-mismatch':'كل الكلمات لازم تبدأ بالحرف.','host-only':'هذا الإجراء لصاحب الغرفة فقط.'};status(room?'fwcoPlayStatus':'fwcoSetupStatus',messages[code]||'تعذر تنفيذ العملية.',true);}
  async function create(){if(!selectedLearnerId){status('fwcoSetupStatus','اختر لاعب هذا الجهاز.',true);return;}if(busy)return;busy=true;try{await session.create(selectedLearnerId,{displayName:playerByLearner(selectedLearnerId)?.name});await session.submit('configure',{durationSec:Number(byId('fwcoDuration').value),roundsTotal:Number(byId('fwcoRounds').value)});}catch(e){handleError(e);}finally{busy=false;}}
  async function join(){if(!selectedLearnerId){status('fwcoSetupStatus','اختر لاعب هذا الجهاز.',true);return;}const code=String(byId('fwcoCode').value||'').replace(/\D/g,'').slice(0,6);if(code.length!==6){status('fwcoSetupStatus','اكتب رمز الغرفة من 6 أرقام.',true);return;}if(busy)return;busy=true;try{await session.join(code,selectedLearnerId,{displayName:playerByLearner(selectedLearnerId)?.name});}catch(e){handleError(e);}finally{busy=false;}}
  async function resume(){if(!selectedLearnerId)return;try{await session.resume({learnerId:selectedLearnerId});}catch(e){handleError(e);}}
  async function startGame(){if(busy)return;busy=true;try{await session.submit('start');}catch(e){handleError(e);}finally{busy=false;}}
  async function submitAnswers(event){event?.preventDefault?.();if(busy||!ready())return;busy=true;updateSubmit();try{await session.submit('submit',{answers:currentAnswers()});}catch(e){handleError(e);}finally{busy=false;updateSubmit();}}
  async function judge(btn){if(busy)return;busy=true;try{await session.submit('judge',{targetPlayerId:btn.dataset.fwcoJudgePlayer,category:btn.dataset.fwcoJudgeCategory,valid:btn.dataset.fwcoJudgeValid==='true'});}catch(e){handleError(e);}finally{busy=false;}}
  async function finalize(){if(busy)return;busy=true;try{await session.submit('finalize');}catch(e){handleError(e);}finally{busy=false;}}
  async function next(){if(busy)return;busy=true;timeoutKey='';try{await session.submit('next');}catch(e){handleError(e);}finally{busy=false;}}
  async function reset(){if(busy)return;busy=true;timeoutKey='';try{await session.submit('reset');}catch(e){handleError(e);}finally{busy=false;}}
  function bind(){if(bound)return;bound=true;ensureShell();byId('fwcoBack')?.addEventListener('click',()=>leave());byId('fwcoCreate')?.addEventListener('click',create);byId('fwcoJoin')?.addEventListener('click',join);byId('fwcoResume')?.addEventListener('click',resume);byId('fwcoCode')?.addEventListener('input',e=>{e.target.value=String(e.target.value||'').replace(/\D/g,'').slice(0,6);});byId('fwcoStart')?.addEventListener('click',startGame);byId('fwcoForm')?.addEventListener('submit',submitAnswers);byId('fwcoFinalize')?.addEventListener('click',finalize);byId('fwcoNext')?.addEventListener('click',next);byId('fwcoReset')?.addEventListener('click',reset);}
  function start(){bind();document.body.classList.add('categories-game-mode');showView?.('categoriesOnlineView');renderSetup();}
  function stop(){stopTimer();session.stop();room=null;}
  function leave(){stopTimer();session.stop();room=null;onBack?.();}
  return Object.freeze({start,stop,leave,getRoom(){return room;}});
}
