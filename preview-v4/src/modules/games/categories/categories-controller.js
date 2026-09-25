import {
  FAMILY_WORD_CATEGORIES,
  chooseRoundLetter,
  validateAnswerSheet,
  answerStartsWithLetter,
  scoreWordRound,
  cumulativeScore
} from './categories-engine.js';
import { applySystemInsets } from '../../../shared/ui/system-insets.js';

const byId=id=>document.getElementById(id);
const HISTORY_KEY='family-word-categories-history-v1';
const PLAYERS=Object.freeze([
  Object.freeze({id:'yasser',name:'ياسر',symbol:'🧑',avatar:'assets/visual/original/yasser/welcome.png'}),
  Object.freeze({id:'khaled',name:'خالد',symbol:'🧒',avatar:'assets/visual/original/khaled/khaled-point-thumbsup.png'}),
  Object.freeze({id:'mashaal',name:'مشاعل',symbol:'🌸',avatar:'assets/mashaal/domains/language.webp'}),
  Object.freeze({id:'father',name:'الأب',symbol:'👨',avatar:null}),
  Object.freeze({id:'mother',name:'الأم',symbol:'👩',avatar:null})
]);
const DURATIONS=Object.freeze([60,90,120]);
const ROUND_COUNTS=Object.freeze([3,5]);

function ensureStyle(){
  if(document.querySelector('link[data-module-style="family-word-categories"]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='src/modules/games/categories/categories.css';link.dataset.moduleStyle='family-word-categories';document.head.appendChild(link);
}
function playerById(id){return PLAYERS.find(player=>player.id===id)||null;}
function localDayKey(date=new Date()){
  const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return`${y}-${m}-${d}`;
}
function safeReadHistory(){try{const value=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(value)?value:[];}catch{return[];}}
function safeWriteHistory(history){try{localStorage.setItem(HISTORY_KEY,JSON.stringify(history.slice(0,60)));return true;}catch{return false;}}
function formatSeconds(ms){return`${Math.max(0,Math.round(Number(ms||0)/1000))}ث`;}
function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));}
function visual(player){return player?.avatar?`<img src="${player.avatar}" alt="" decoding="async">`:`<span aria-hidden="true">${player?.symbol||'🎮'}</span>`;}

function ensureShell(){
  if(byId('categoriesGameView'))return;
  ensureStyle();const main=document.querySelector('main');if(!main)return;
  const host=document.createElement('div');host.innerHTML=`
    <section id="categoriesGameView" class="view">
      <div class="fwc-shell">
        <header class="fwc-header">
          <button class="icon-btn" id="fwcBack">الألعاب</button>
          <div><div class="kicker">حيوان • جماد • بلاد</div><h1>تحدي الحرف للعائلة</h1><p>كل واحد يعبّي خمس خانات، ووقته يتوقف لحظة التسليم.</p></div>
        </header>

        <section id="fwcSetup" class="fwc-panel">
          <div class="fwc-mode-switch" role="group" aria-label="طريقة اللعب"><button type="button" class="selected" data-fwc-mode="local">على نفس الجهاز</button><button type="button" data-fwc-mode="online">كل واحد من جهازه</button></div>
          <div class="fwc-section-title"><div><span>1</span><strong>مين بيلعب؟</strong></div><small>اختر من 2 إلى 5 لاعبين</small></div>
          <div class="fwc-player-picker" id="fwcPlayerPicker"></div>

          <div class="fwc-setup-grid">
            <div><div class="fwc-section-title compact"><div><span>2</span><strong>وقت الجولة</strong></div></div><div class="fwc-choice-row" id="fwcDurationChoices"></div></div>
            <div><div class="fwc-section-title compact"><div><span>3</span><strong>عدد الجولات</strong></div></div><div class="fwc-choice-row" id="fwcRoundChoices"></div></div>
          </div>
          <p class="fwc-rule-note">زر «خلصت» ما يتفعل إلا بعد تعبئة كل الخانات بالحرف الصحيح. «الـ» في بداية الكلمة ما تُحسب من الحرف. بعد الجولة تحكمون على صحة الكلمات، والسرعة تُحسب فقط للإجابات المقبولة كلها.</p>
          <button class="btn primary fwc-start" id="fwcStart">ابدأ المباراة</button>
          <div class="fwc-history" id="fwcHistory"></div>
        </section>

        <section id="fwcPlay" class="fwc-panel" hidden>
          <div class="fwc-hud">
            <div class="fwc-letter"><small>حرف الجولة</small><strong id="fwcLetter">م</strong></div>
            <div class="fwc-round"><small>الجولة</small><strong id="fwcRoundLabel">1 / 3</strong></div>
            <div class="fwc-timer" id="fwcTimer"><small>الوقت المتبقي</small><strong id="fwcTime">90</strong><span>ثانية</span></div>
          </div>
          <div class="fwc-progress-list" id="fwcProgressList"></div>
          <div class="fwc-active-sheet">
            <div class="fwc-sheet-head"><div class="fwc-active-player" id="fwcActivePlayer"></div><span id="fwcSheetHint">عبّ إجاباتك ثم اضغط خلصت</span></div>
            <div class="fwc-fields" id="fwcFields"></div>
            <div class="fwc-submit-row"><div class="fwc-submit-status" id="fwcSubmitStatus" role="status" aria-live="polite"></div><button class="btn primary" id="fwcSubmit">خلصت ✓</button></div>
          </div>
        </section>

        <section id="fwcJudge" class="fwc-panel" hidden>
          <div class="fwc-section-title"><div><span>✓</span><strong>تحكيم الجولة</strong></div><small>اضغط على الكلمة لتغيير مقبولة / مرفوضة</small></div>
          <div class="fwc-judge-wrap" id="fwcJudgeGrid"></div>
          <button class="btn primary fwc-finish-judge" id="fwcFinishJudge">احسب النتيجة</button>
        </section>

        <section id="fwcResult" class="fwc-panel" hidden>
          <div class="fwc-result-hero"><span id="fwcResultEyebrow">نتيجة الجولة</span><h2 id="fwcResultTitle"></h2><p id="fwcResultCopy"></p></div>
          <div class="fwc-scoreboard" id="fwcScoreboard"></div>
          <div class="fwc-result-actions"><button class="btn primary" id="fwcNextRound">الجولة التالية</button><button class="btn secondary" id="fwcNewMatch">مباراة جديدة</button></div>
        </section>
      </div>
    </section>`;
  const view=host.firstElementChild;main.appendChild(view);applySystemInsets(view.querySelector('.fwc-shell'));
}

export function createCategoriesController({showView,onBack}={}){
  let bound=false,timer=null,selectedPlayers=['yasser','khaled'],durationSeconds=90,targetRounds=3,match=null,onlineController=null;

  function setMode(active){document.body.classList.toggle('categories-game-mode',Boolean(active));}
  function hideStages(){for(const id of ['fwcSetup','fwcPlay','fwcJudge','fwcResult']){const node=byId(id);if(node)node.hidden=true;}}
  function stopTimer(){if(timer){clearInterval(timer);timer=null;}}
  function currentRound(){return match?.currentRound||null;}
  function activePlayers(){return selectedPlayers.map(playerById).filter(Boolean);}

  function renderPicker(){
    const host=byId('fwcPlayerPicker');if(!host)return;
    host.innerHTML=PLAYERS.map(player=>`<button type="button" class="fwc-player-choice ${selectedPlayers.includes(player.id)?'selected':''}" data-fwc-player="${player.id}" aria-pressed="${selectedPlayers.includes(player.id)}"><span>${visual(player)}</span><strong>${player.name}</strong></button>`).join('');
    host.querySelectorAll('[data-fwc-player]').forEach(button=>button.addEventListener('click',()=>togglePlayer(button.dataset.fwcPlayer)));
    const start=byId('fwcStart');if(start)start.disabled=selectedPlayers.length<2;
  }
  function togglePlayer(id){
    if(selectedPlayers.includes(id)){if(selectedPlayers.length>2)selectedPlayers=selectedPlayers.filter(item=>item!==id);}else if(selectedPlayers.length<5)selectedPlayers=[...selectedPlayers,id];
    renderPicker();
  }
  function renderOptions(){
    const durations=byId('fwcDurationChoices'),rounds=byId('fwcRoundChoices');
    if(durations){durations.innerHTML=DURATIONS.map(value=>`<button type="button" data-fwc-duration="${value}" class="${durationSeconds===value?'selected':''}">${value} ثانية</button>`).join('');durations.querySelectorAll('[data-fwc-duration]').forEach(button=>button.addEventListener('click',()=>{durationSeconds=Number(button.dataset.fwcDuration);renderOptions();}));}
    if(rounds){rounds.innerHTML=ROUND_COUNTS.map(value=>`<button type="button" data-fwc-rounds="${value}" class="${targetRounds===value?'selected':''}">${value} جولات</button>`).join('');rounds.querySelectorAll('[data-fwc-rounds]').forEach(button=>button.addEventListener('click',()=>{targetRounds=Number(button.dataset.fwcRounds);renderOptions();}));}
  }
  function renderHistory(){
    const host=byId('fwcHistory');if(!host)return;const history=safeReadHistory(),today=localDayKey(),todayMatches=history.filter(item=>item.day===today);
    const wins={};for(const item of todayMatches){for(const winnerId of item.winnerIds||[])wins[winnerId]=(wins[winnerId]||0)+1;}
    const leaders=Object.entries(wins).sort((a,b)=>b[1]-a[1]);
    if(!history.length){host.innerHTML='<strong>سجل الفوز</strong><p>أول مباراة بتفتح سجل أبطال العائلة 🏆</p>';return;}
    const top=leaders[0],champion=top?playerById(top[0])?.name||top[0]:null;
    host.innerHTML=`<strong>سجل اليوم</strong><p>${champion?`الأكثر فوزًا اليوم: <b>${escapeHtml(champion)}</b> — ${top[1]} فوز`:'ما فيه مباراة مكتملة اليوم.'}</p><div class="fwc-history-mini">${history.slice(0,5).map(item=>`<span><b>${escapeHtml((item.winnerNames||[]).join(' + ')||'تعادل')}</b><small>${escapeHtml(item.day)} · ${item.rounds} جولات</small></span>`).join('')}</div>`;
  }
  function renderSetup(){stopTimer();match=null;hideStages();byId('fwcSetup').hidden=false;renderPicker();renderOptions();renderHistory();}

  function startMatch(){
    if(selectedPlayers.length<2)return;
    match={players:activePlayers(),durationMs:durationSeconds*1000,targetRounds,usedLetters:[],rounds:[],currentRound:null};startRound();
  }
  function startRound(){
    stopTimer();const letter=chooseRoundLetter({usedLetters:match.usedLetters});match.usedLetters.push(letter);
    const players=match.players,answersByPlayer={},finishMsByPlayer={},verdictsByPlayer={};players.forEach(player=>{answersByPlayer[player.id]=Object.fromEntries(FAMILY_WORD_CATEGORIES.map(category=>[category.id,'']));verdictsByPlayer[player.id]={};});
    match.currentRound={number:match.rounds.length+1,letter,startedAt:performance.now(),answersByPlayer,finishMsByPlayer,verdictsByPlayer,activePlayerId:players[0].id};
    hideStages();byId('fwcPlay').hidden=false;renderPlay();timer=setInterval(tick,250);tick();
  }
  function elapsedMs(){const round=currentRound();return round?Math.min(match.durationMs,Math.max(0,performance.now()-round.startedAt)):0;}
  function remainingMs(){return Math.max(0,match.durationMs-elapsedMs());}
  function tick(){
    const round=currentRound();if(!round)return;const remaining=remainingMs(),seconds=Math.ceil(remaining/1000),time=byId('fwcTime');if(time)time.textContent=String(seconds);
    byId('fwcTimer')?.classList.toggle('urgent',seconds<=10);renderProgress(false);
    if(remaining<=0){for(const player of match.players){if(!Number.isFinite(round.finishMsByPlayer[player.id]))round.finishMsByPlayer[player.id]=match.durationMs;}beginJudging();}
  }
  function renderProgress(rebind=true){
    const host=byId('fwcProgressList'),round=currentRound();if(!host||!round)return;
    host.innerHTML=match.players.map(player=>{const finished=Number.isFinite(round.finishMsByPlayer[player.id]),active=round.activePlayerId===player.id&&!finished;return`<button class="fwc-progress-player ${active?'active':''} ${finished?'done':''}" data-fwc-open-player="${player.id}" ${finished?'disabled':''}><span>${visual(player)}</span><strong>${player.name}</strong><small>${finished?`خلص · ${formatSeconds(round.finishMsByPlayer[player.id])}`:'يكتب الآن'}</small></button>`;}).join('');
    if(rebind)host.querySelectorAll('[data-fwc-open-player]').forEach(button=>button.addEventListener('click',()=>switchPlayer(button.dataset.fwcOpenPlayer)));
    else host.querySelectorAll('[data-fwc-open-player]').forEach(button=>button.addEventListener('click',()=>switchPlayer(button.dataset.fwcOpenPlayer),{once:true}));
  }
  function switchPlayer(id){const round=currentRound();if(!round||Number.isFinite(round.finishMsByPlayer[id])||!match.players.some(player=>player.id===id))return;round.activePlayerId=id;renderPlay();}
  function renderPlay(){
    const round=currentRound();if(!round)return;byId('fwcLetter').textContent=round.letter;byId('fwcRoundLabel').textContent=`${round.number} / ${match.targetRounds}`;renderProgress();
    const player=playerById(round.activePlayerId),active=byId('fwcActivePlayer');if(active)active.innerHTML=`<span>${visual(player)}</span><div><small>ورقة اللاعب</small><strong>${player?.name||''}</strong></div>`;
    const fields=byId('fwcFields'),answers=round.answersByPlayer[round.activePlayerId];if(fields)fields.innerHTML=FAMILY_WORD_CATEGORIES.map(category=>`<label><span>${category.icon} ${category.label}</span><input data-fwc-answer="${category.id}" value="${escapeHtml(answers?.[category.id]||'')}" autocomplete="off" inputmode="text" placeholder="كلمة بحرف ${round.letter}"></label>`).join('');
    fields?.querySelectorAll('[data-fwc-answer]').forEach(input=>input.addEventListener('input',event=>{answers[event.target.dataset.fwcAnswer]=event.target.value;updateSubmitState();}));
    byId('fwcSubmitStatus').textContent='';updateSubmitState();
  }
  function updateSubmitState(){
    const round=currentRound(),submit=byId('fwcSubmit');if(!round||!submit)return;const result=validateAnswerSheet({answers:round.answersByPlayer[round.activePlayerId],letter:round.letter});submit.disabled=!result.ok;
    const status=byId('fwcSubmitStatus');if(!status)return;if(result.ok){status.textContent='كل الخانات جاهزة ✓';status.classList.remove('error');return;}
    const wrong=result.issues.find(issue=>issue.reason==='wrong-letter'),empty=result.issues.find(issue=>issue.reason==='empty');status.textContent=wrong?'في خانة ما تبدأ بالحرف المطلوب.':empty?'كمّل كل الخانات عشان يتفعل «خلصت».':'';status.classList.toggle('error',Boolean(wrong));
  }
  function submitActive(){
    const round=currentRound(),id=round?.activePlayerId;if(!round||!id||Number.isFinite(round.finishMsByPlayer[id]))return;const validation=validateAnswerSheet({answers:round.answersByPlayer[id],letter:round.letter});if(!validation.ok){updateSubmitState();return;}
    round.finishMsByPlayer[id]=elapsedMs();const remaining=match.players.find(player=>!Number.isFinite(round.finishMsByPlayer[player.id]));if(!remaining){beginJudging();return;}round.activePlayerId=remaining.id;renderPlay();
  }

  function beginJudging(){
    stopTimer();const round=currentRound();if(!round)return;for(const player of match.players){if(!Number.isFinite(round.finishMsByPlayer[player.id]))round.finishMsByPlayer[player.id]=match.durationMs;}
    hideStages();byId('fwcJudge').hidden=false;renderJudge();
  }
  function renderJudge(){
    const host=byId('fwcJudgeGrid'),round=currentRound();if(!host||!round)return;
    host.innerHTML=FAMILY_WORD_CATEGORIES.map(category=>`<section class="fwc-judge-category"><h3>${category.icon} ${category.label}</h3><div>${match.players.map(player=>{const answer=round.answersByPlayer[player.id][category.id],autoValid=Boolean(answer&&answerStartsWithLetter(answer,round.letter)),manual=round.verdictsByPlayer[player.id][category.id],accepted=autoValid&&manual!==false;if(manual===undefined)round.verdictsByPlayer[player.id][category.id]=autoValid;return`<button class="fwc-verdict ${accepted?'accepted':'rejected'}" data-fwc-verdict-player="${player.id}" data-fwc-verdict-category="${category.id}" ${autoValid?'':'disabled'}><span><b>${escapeHtml(player.name)}</b><small>${escapeHtml(answer||'بدون إجابة')}</small></span><strong>${accepted?'✓ مقبولة':'✕ مرفوضة'}</strong></button>`;}).join('')}</div></section>`).join('');
    host.querySelectorAll('[data-fwc-verdict-player]:not([disabled])').forEach(button=>button.addEventListener('click',()=>{const playerId=button.dataset.fwcVerdictPlayer,categoryId=button.dataset.fwcVerdictCategory;round.verdictsByPlayer[playerId][categoryId]=!round.verdictsByPlayer[playerId][categoryId];renderJudge();}));
  }
  function finishJudge(){
    const round=currentRound();if(!round)return;const result=scoreWordRound({players:match.players,answersByPlayer:round.answersByPlayer,verdictsByPlayer:round.verdictsByPlayer,finishMsByPlayer:round.finishMsByPlayer,letter:round.letter});
    match.rounds.push(Object.freeze({number:round.number,letter:round.letter,answersByPlayer:round.answersByPlayer,finishMsByPlayer:round.finishMsByPlayer,verdictsByPlayer:round.verdictsByPlayer,...result}));match.currentRound=null;renderRoundResult(result);
  }
  function scoreboardMarkup(summary,{showRound=false}={}){return summary.ranking.map((id,index)=>{const player=playerById(id),score=showRound?summary.scores[id].total:summary.totals[id],bonus=showRound?summary.scores[id].speedBonus:0;return`<article class="fwc-score-card ${index===0?'winner':''}"><span class="fwc-rank">${['🥇','🥈','🥉'][index]||`${index+1}`}</span><span class="fwc-score-avatar">${visual(player)}</span><div><strong>${escapeHtml(player?.name||id)}</strong>${showRound?`<small>${summary.scores[id].baseScore} نقاط${bonus?` + ${bonus} سرعة`:''}</small>`:`<small>${summary.wins[id]} فوز بالجولات</small>`}</div><b>${score}</b></article>`;}).join('');}
  function renderRoundResult(result){
    hideStages();byId('fwcResult').hidden=false;const winner=playerById(result.ranking[0]);byId('fwcResultEyebrow').textContent=`نتيجة الجولة ${match.rounds.length}`;byId('fwcResultTitle').textContent=`${winner?.name||''} يتصدر الجولة 🏆`;byId('fwcResultCopy').textContent='الفريدة 10 نقاط، المكررة 5، ومكافأة السرعة تُمنح فقط للورقة الصحيحة بالكامل.';byId('fwcScoreboard').innerHTML=scoreboardMarkup(result,{showRound:true});const next=byId('fwcNextRound');next.hidden=false;next.textContent=match.rounds.length>=match.targetRounds?'النتيجة النهائية':'الجولة التالية';byId('fwcNewMatch').hidden=true;
  }
  function nextRound(){if(match.rounds.length>=match.targetRounds){finishMatch();return;}startRound();}
  function finishMatch(){
    stopTimer();const total=cumulativeScore(match.rounds,match.players),topId=total.ranking[0],topScore=total.totals[topId],topWins=total.wins[topId],winnerIds=total.ranking.filter(id=>total.totals[id]===topScore&&total.wins[id]===topWins),winnerNames=winnerIds.map(id=>playerById(id)?.name||id);
    const entry={id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,day:localDayKey(),createdAt:new Date().toISOString(),winnerIds,winnerNames,rounds:match.rounds.length,totals:total.totals};safeWriteHistory([entry,...safeReadHistory()]);
    hideStages();byId('fwcResult').hidden=false;byId('fwcResultEyebrow').textContent='النتيجة النهائية';byId('fwcResultTitle').textContent=winnerIds.length>1?`تعادل ${winnerNames.join(' و ')} 🤝`:`${winnerNames[0]} بطل المباراة 🏆`;byId('fwcResultCopy').textContent=`تم حفظ الفوز في سجل اليوم — ${match.rounds.length} جولات.`;byId('fwcScoreboard').innerHTML=scoreboardMarkup(total);byId('fwcNextRound').hidden=true;byId('fwcNewMatch').hidden=false;
  }

  async function openOnline(){
    stopTimer();
    try{
      if(!onlineController){
        const module=await import('./categories-online-controller.js');
        onlineController=module.createCategoriesOnlineController({showView,onBack:()=>{showView?.('categoriesGameView');renderSetup();}});
      }
      onlineController.start();
    }catch{showView?.('categoriesGameView');renderSetup();}
  }
  function start(){ensureShell();onlineController?.stop?.();setMode(true);showView?.('categoriesGameView');renderSetup();}
  function leave({navigate=true}={}){stopTimer();onlineController?.stop?.();match=null;setMode(false);if(navigate)onBack?.();}
  function bind(){
    if(bound)return;bound=true;ensureShell();byId('fwcBack')?.addEventListener('click',()=>leave());document.querySelector('[data-fwc-mode="online"]')?.addEventListener('click',openOnline);byId('fwcStart')?.addEventListener('click',startMatch);byId('fwcSubmit')?.addEventListener('click',submitActive);byId('fwcFinishJudge')?.addEventListener('click',finishJudge);byId('fwcNextRound')?.addEventListener('click',nextRound);byId('fwcNewMatch')?.addEventListener('click',renderSetup);
  }
  bind();
  return Object.freeze({start,leave,getMatch(){return match;},getHistory:()=>Object.freeze([...safeReadHistory()])});
}
