import {drawParticipants,normalizeParticipants} from './selection-engine.js';
import {answerDotsBoxesEdge,createDotsBoxesGame,pickDotsBoxesEdge,startDotsBoxesGame} from './dots-boxes-engine.js';
import {loadGameQuestionBank,nextGameQuestion,orderCurriculumQuestions,saveGameQuestionBank} from './question-bank.js';
import {PRIMARY_QUESTION_BANK,PRIMARY_QUESTION_BANK_VERSION} from './primary-question-bank.js';
import {loadIndependentGameSetup,saveIndependentGameSetup} from './setup-store.js';
import {newLettersGame,pickLetterCell,startLettersGame,verdictLetterCell} from './letters-challenge-engine.js';
import {newTreasureGame,setTreasurePlayer,startTreasureGame,stopsFor,TREASURE_ART,verdictTreasureGame} from './treasure-map-engine.js';
import {ensureInteractiveGamesShell} from './interactive-games-shell.js?v=20260929-5';

function byId(id){return document.getElementById(id);}
function showView(id){document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===id));window.scrollTo(0,0);}
const arabicNumber=value=>new Intl.NumberFormat('ar-SA').format(value);
const DIE_PIPS=Object.freeze({1:['center'],2:['top-left','bottom-right'],3:['top-left','center','bottom-right'],4:['top-left','top-right','bottom-left','bottom-right'],5:['top-left','top-right','center','bottom-left','bottom-right'],6:['top-left','top-right','middle-left','middle-right','bottom-left','bottom-right']});
const diePips=face=>(DIE_PIPS[face]||DIE_PIPS[5]).map(position=>`<i class="pip pip-${position}${face===5&&position==='center'?' pip-accent':''}" aria-hidden="true"></i>`).join('');

export function createInteractiveGamesController({onBeforeEnter,onExitToHub,random=Math.random}={}){
  const storedSetup=loadIndependentGameSetup();
  let bound=false,participants=storedSetup.participants,groups=storedSetup.groups,wheelMode='students',remaining=[...storedSetup.participants],history=[],questions=loadGameQuestionBank(undefined,PRIMARY_QUESTION_BANK,PRIMARY_QUESTION_BANK_VERSION),askedQuestionIds=[],activeQuestion=null,drawnNames=[],drawnIndex=0,drawCycleRestarted=false,activeGame='dice',animationTimer=null,cycleMode=true,dotsGame=null,lettersGame=null,treasureGame=null,pendingEdge=null,diceCount=1,diceFace=5,shakeEnabled=false,lastMotionAt=0,treasurePick='random',recordMode='play';
  function stopAnimation(){
    if(animationTimer){clearTimeout(animationTimer);animationTimer=null;}
    const drawButton=byId('independentDrawButton');if(drawButton)drawButton.disabled=false;
    const resetButton=byId('independentResetCycle');if(resetButton)resetButton.disabled=false;
    const wheelModeSelect=byId('independentWheelMode');if(wheelModeSelect)wheelModeSelect.disabled=false;
    byId('independentStage')?.querySelectorAll('[data-game-draw]').forEach(button=>button.disabled=false);
    window.removeEventListener('devicemotion',onDeviceMotion);shakeEnabled=false;
  }
  function status(message){const node=byId('independentGamesStatus');if(node)node.textContent=message||'';}
  function renderParticipants(){
    const host=byId('independentParticipants'),count=byId('independentParticipantCount');
    if(count)count.textContent=`${arabicNumber(participants.length)} ${participants.length===1?'مشارك':'مشاركين'}`;
    if(!host)return;
    host.innerHTML=participants.length?participants.map((name,index)=>`<span class="independent-participant"><span>${escapeHtml(name)}</span><button type="button" data-remove-participant="${index}" aria-label="حذف ${escapeHtml(name)}">×</button></span>`).join(''):'<p class="independent-empty">أضف أسماء المشاركين لبدء اللعب.</p>';
    host.querySelectorAll('[data-remove-participant]').forEach(button=>button.addEventListener('click',()=>{
      const index=Number(button.dataset.removeParticipant);participants=participants.filter((_,i)=>i!==index);remaining=[...drawPool()];saveIndependentGameSetup({participants,groups});history=[];if(activeGame==='dots'&&!dotsGame?.started)dotsGame=createDotsBoxesGame(participants,{random});if(activeGame==='letters'&&!lettersGame?.started)lettersGame=newLettersGame(participants,random);renderParticipants();renderHistory();renderStage();status('');
    }));
  }
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
  function drawPool(){return activeGame==='wheel'&&wheelMode==='groups'?groups:participants;}
  function renderGroups(){const input=byId('independentGroupInput'),summary=byId('independentGroupSummary');if(input)input.value=groups.join('\n');if(summary)summary.textContent=groups.length?`المجموعات المحفوظة: ${groups.join('، ')}`:'لم تُضف مجموعات بعد.';}
  function renderHistory(){
    const host=byId('independentHistory');if(!host)return;
    host.innerHTML=history.length?history.slice(0,8).map((item,index)=>`<li><span>${escapeHtml(item.name)}</span><small>${arabicNumber(history.length-index)}</small></li>`).join(''):'<li class="independent-empty-history">ما فيه اختيارات بهالجلسة.</li>';
  }
  function renderQuestionBank(){
    const count=byId('independentQuestionCount'),host=byId('independentQuestionList');
    if(count)count.textContent=`${arabicNumber(questions.length)} سؤال`;
    if(host){let previousGroup='';host.innerHTML=questions.length?orderCurriculumQuestions(questions).map((question,index)=>{const grouped=question.grade!==undefined&&question.grade!==null&&question.grade!==''&&question.semester!==undefined&&question.semester!==null&&question.semester!==''&&Boolean(question.subject)&&Number.isFinite(Number(question.grade))&&Number.isFinite(Number(question.semester)),group=grouped?`الصف ${arabicNumber(Number(question.grade))} · الفصل ${arabicNumber(Number(question.semester))} · ${escapeHtml(question.subject)}`:'أسئلة إضافية';const heading=group===previousGroup?'':`<li class="question-bank-group" role="presentation">${group}</li>`;previousGroup=group;return`${heading}<li>${escapeHtml(question.text)}${question.answer?` <small>— ${escapeHtml(question.answer)}</small>`:''}<button type="button" data-remove-question="${index}" aria-label="حذف السؤال">×</button></li>`;}).join(''):'<li>أضف أسئلة لبدء اللعب.</li>';}
  }
  function chooseQuestion(){
    const result=nextGameQuestion(questions,askedQuestionIds);activeQuestion=result.question;askedQuestionIds=result.askedIds;return result;
  }
  function questionUnavailableMessage(){return questions.length?'انتهت أسئلة البنك المستخدمة في هذه الجولة.':'أضف أسئلة في بنك الألعاب.';}
  function renderQuestion(){
    if(!activeQuestion)return'';
    return`<div class="game-question-card" role="group" aria-label="سؤال الجولة"><strong>${escapeHtml(activeQuestion.text)}</strong>${activeQuestion.answer?`<details><summary>إظهار الإجابة</summary><p>${escapeHtml(activeQuestion.answer)}</p></details>`:''}<div><button type="button" class="btn primary" data-independent-verdict="correct">صحيحة</button><button type="button" class="btn secondary" data-independent-verdict="wrong">خطأ</button><button type="button" class="btn secondary" data-independent-verdict="none">لم يجب</button></div></div>`;
  }
  function renderStage(){
    const host=byId('independentStage');if(!host)return;
    host.classList.toggle('independent-stage-dots',['dots','letters'].includes(activeGame));
    host.dataset.game=activeGame;
    if(activeGame==='dice')renderDice(host);
    else if(activeGame==='wheel')host.innerHTML=`<div class="wafy-wheel-screen"><label class="wheel-mode">الاختيار من<select id="independentWheelMode"><option value="students" ${wheelMode==='students'?'selected':''}>أسماء الطلاب</option><option value="groups" ${wheelMode==='groups'?'selected':''}>المجموعات</option></select></label><div class="independent-wheel-wrap"><span class="independent-wheel-pointer" aria-hidden="true"><img src="assets/wafy-games/wheelpointer.png" alt="" /></span><img class="independent-wheel-rim" src="assets/wafy-games/wheelrim.png" alt="" /><div class="independent-wheel" id="independentWheel" role="img" aria-label="عجلة الحظ"></div><button type="button" class="independent-wheel-hub" data-game-draw aria-label="دور"><img src="assets/wafy-games/wheelhub.png" alt="" /><span>دور</span></button></div><p class="wafy-wheel-hint">اضغط العجلة لتدور</p><label class="wafy-source-toggle"><input type="checkbox" data-dice-no-repeat ${cycleMode?'checked':''} /><span><strong>لا تكرر من اختير</strong><small data-cycle-count></small></span><span class="wafy-toggle" aria-hidden="true"></span></label></div>`;
    else if(activeGame==='dots')renderDotsBoxes(host);
    else if(activeGame==='letters')renderLettersChallenge(host);
    else renderTreasureMap(host);
    if(activeGame==='wheel')renderWheel();
  }
  function renderDice(host=byId('independentStage')){
    if(!host)return;
    const pips=diePips(diceFace);
    host.innerHTML=`<div class="wafy-dice-screen"><button type="button" class="independent-die" id="independentDie" data-game-draw aria-label="ارم النرد"><span class="die-face">${pips}</span></button><strong class="wafy-dice-instruction">اضغط النرد أو رج الجهاز</strong><span class="wafy-dice-available">${arabicNumber(drawPool().length)} أسماء متاحة</span><label class="wafy-source-toggle"><input type="checkbox" data-dice-no-repeat ${cycleMode?'checked':''} /><span><strong>لا تكرر من اختير</strong><small data-cycle-count>${cycleRemainingLabel()}</small></span><span class="wafy-toggle" aria-hidden="true"></span></label><label class="wafy-source-toggle"><input type="checkbox" data-dice-shake /><span><strong>الرج</strong><small>رُج الجهاز بدل الضغط</small></span><span class="wafy-toggle" aria-hidden="true"></span></label><div class="wafy-player-count"><strong>عدد المسحوبين</strong>${[1,2,3].map(value=>`<button type="button" data-dice-count="${value}" class="${diceCount===value?'selected':''}">${arabicNumber(value)}</button>`).join('')}</div></div>`;
  }
  function cycleRemainingLabel(){const pool=drawPool();const available=cycleMode?remaining.filter(name=>pool.includes(name)).length:pool.length;return`بقي ${arabicNumber(available)} من ${arabicNumber(pool.length)}`;}
  function treasureStopsMarkup(art,count,activeAt=0,finished=false){
    return art.trail.slice(0,count).map((point,index)=>{const state=index<activeAt?'done':index===activeAt&&!finished?'now':'locked',asset=index===count-1&&state==='now'?'stopfinal.png':state==='done'?'stopdone.png':state==='now'?'stopnow.png':'stoplocked.png';return`<img class="treasure-stop ${state}" src="assets/wafy-games/${asset}" style="left:${point.x*100}%;top:${point.y*100}%" alt="محطة ${arabicNumber(index+1)}" />`;}).join('');
  }
  function onDeviceMotion(event){
    if(!shakeEnabled||activeGame!=='dice'||animationTimer)return;
    const motion=event.accelerationIncludingGravity||event.acceleration;if(!motion)return;
    const force=Math.abs(motion.x||0)+Math.abs(motion.y||0)+Math.abs(motion.z||0);
    if(force>28&&Date.now()-lastMotionAt>1300){lastMotionAt=Date.now();draw();}
  }
  async function setShake(enabled){
    if(!enabled){shakeEnabled=false;window.removeEventListener('devicemotion',onDeviceMotion);return;}
    const Motion=window.DeviceMotionEvent;if(!Motion){status('ميزة رج الجهاز غير متاحة على هذا الجهاز.');return;}
    try{if(typeof Motion.requestPermission==='function'&&await Motion.requestPermission()!=='granted'){status('لم يُسمح باستخدام مستشعر الحركة.');return;}shakeEnabled=true;window.addEventListener('devicemotion',onDeviceMotion,{passive:true});status('رج الجهاز للاختيار.');}catch{status('لم يتفعّل مستشعر الحركة على هذا الجهاز.');}
  }
  function renderDotsBoxes(host=byId('independentStage')){
    if(!host)return;
    if(!dotsGame){host.innerHTML='<p class="wafy-empty-game">أضف مشاركين لبدء اللعبة.</p>';return;}
    const size=dotsGame.size,board=[];
    for(let row=0;row<=size*2;row++){
      const cells=[];
      for(let col=0;col<=size*2;col++){
        if(row%2===0&&col%2===0)cells.push('<span class="dots-node" aria-hidden="true"></span>');
        else if(row%2===0){
          const edge=`h-${row/2}-${(col-1)/2}`,owner=dotsGame.edges[edge];
          cells.push(`<button type="button" class="dots-edge dots-edge-h ${owner===undefined?'':owner===-1?'seed':'claimed team-'+owner}" data-dots-edge="${edge}" aria-label="${owner===undefined?'اختر ضلعًا أفقيًا':owner===-1?'ضلع ابتدائي':`ضلع يملكه ${escapeHtml(dotsGame.teams[owner])}`}" ${owner===undefined&&!dotsGame.finished&&dotsGame.started?'':'disabled'}></button>`);
        }else if(col%2===0){
          const edge=`v-${(row-1)/2}-${col/2}`,owner=dotsGame.edges[edge];
          cells.push(`<button type="button" class="dots-edge dots-edge-v ${owner===undefined?'':owner===-1?'seed':'claimed team-'+owner}" data-dots-edge="${edge}" aria-label="${owner===undefined?'اختر ضلعًا عموديًا':owner===-1?'ضلع ابتدائي':`ضلع يملكه ${escapeHtml(dotsGame.teams[owner])}`}" ${owner===undefined&&!dotsGame.finished&&dotsGame.started?'':'disabled'}></button>`);
        }else{
          const owner=dotsGame.boxes[`${(row-1)/2}-${(col-1)/2}`];
          cells.push(`<span class="dots-box ${owner===undefined?'':'claimed team-'+owner}" aria-label="${owner===undefined?'مربع فارغ':`مربع لصالح ${escapeHtml(dotsGame.teams[owner])}`}">${owner===undefined?'':escapeHtml(dotsGame.teams[owner])}</span>`);
        }
      }
      board.push(`<div class="dots-row">${cells.join('')}</div>`);
    }
    const player=dotsGame.teamPlayers[dotsGame.turn][dotsGame.cursor[dotsGame.turn]];
    const turn=dotsGame.finished?(dotsGame.winner===null?'انتهت المباراة بالتعادل':`فاز ${dotsGame.teams[dotsGame.winner]}`):`دور ${dotsGame.teams[dotsGame.turn]} — ${escapeHtml(player||'')}`;
    const last=dotsGame.lastMove?(dotsGame.lastMove.correct?dotsGame.lastMove.closed.length?`إجابة صحيحة! أُغلق ${arabicNumber(dotsGame.lastMove.closed.length)} مربع.`:'إجابة صحيحة؛ لم يُغلق مربع.':dotsGame.lastMove.verdict==='none'?'لم يجب الفريق؛ بقي الضلع متاحًا وانتقل الدور.':'إجابة خاطئة؛ بقي الضلع متاحًا وانتقل الدور.') :'';
    const startControls=dotsGame.started?'':`<div class="wafy-game-start-options"><div class="wafy-mode-options"><button type="button" data-record-mode="play" class="${recordMode==='play'?'selected':''}">لعب فقط</button><button type="button" data-record-mode="linked" class="${recordMode==='linked'?'selected':''}">مرتبط بسجل المتابعة</button></div><button type="button" class="btn primary" data-dots-start ${participants.length<2?'disabled':''}>ابدأ اللعب</button></div>`;
    host.innerHTML=`<div class="dots-game"><div class="dots-scoreboard"><div class="dots-score team-0"><strong>البرتقالي</strong><b>${arabicNumber(dotsGame.scores[0])}</b></div><div class="dots-score team-1"><strong>الأخضر</strong><b>${arabicNumber(dotsGame.scores[1])}</b></div></div><p class="dots-turn" aria-live="polite">${escapeHtml(dotsGame.started?turn:'اختر وضع اللعب ثم ابدأ')}</p><div class="dots-board" role="group" aria-label="لوحة أكمل المربع">${board.join('')}</div>${startControls}${pendingEdge&&!dotsGame.finished?(activeQuestion?renderQuestion():`<p class="dots-feedback">${questionUnavailableMessage()}</p>`):''}${last?`<p class="dots-feedback" role="status">${escapeHtml(last)}</p>`:''}${dotsGame.finished?'<button type="button" class="btn primary" data-dots-restart>مباراة جديدة</button>':''}</div>`;
  }
  function renderLettersChallenge(host=byId('independentStage')){
    if(!host)return;
    if(!lettersGame){host.innerHTML='<p class="wafy-empty-game">أضف مشاركين لبدء اللعبة.</p>';return;}
    const team=lettersGame.turn,player=lettersGame.teams[team][lettersGame.cursor[team]]||'',turnLabel=lettersGame.winner?`فاز الفريق ${lettersGame.winner==='orange'?'البرتقالي':'الأخضر'}`:lettersGame.finished?'اكتملت اللوحة':`دور ${team==='orange'?'البرتقالي':'الأخضر'} · ${escapeHtml(player)}`,orangeScore=lettersGame.board.flat().filter(cell=>cell.owner==='orange').length,greenScore=lettersGame.board.flat().filter(cell=>cell.owner==='green').length,board=lettersGame.board.map(row=>`<div class="letters-row">${row.map(cell=>`<button type="button" class="letters-cell ${cell.owner?`team-${cell.owner==='orange'?0:1}`:''}" data-letter-cell="${cell.row}-${cell.col}" ${!lettersGame.started||cell.owner||lettersGame.finished||lettersGame.selected?'disabled':''} aria-label="${cell.letter}${cell.owner?`، للفريق ${cell.owner==='orange'?'البرتقالي':'الأخضر'}`:''}">${escapeHtml(cell.letter)}</button>`).join('')}</div>`).join('');
    const startControls=lettersGame.started?'':`<div class="wafy-game-start-options"><div class="wafy-mode-options"><button type="button" data-record-mode="play" class="${recordMode==='play'?'selected':''}">لعب فقط</button><button type="button" data-record-mode="linked" class="${recordMode==='linked'?'selected':''}">مرتبط بسجل المتابعة</button></div><button type="button" class="btn primary" data-letters-start ${participants.length<2?'disabled':''}>ابدأ اللعب</button></div>`;
    host.innerHTML=`<div class="letters-game"><div class="letters-scoreline"><strong class="orange"><span>↓</span><b>${arabicNumber(orangeScore)}</b><small>${escapeHtml(lettersGame.teams.orange.join('، ')||'البرتقالي')}</small></strong><span>${lettersGame.started?turnLabel:'اختر وضع اللعب ثم ابدأ'}</span><strong class="green"><span>←</span><b>${arabicNumber(greenScore)}</b><small>${escapeHtml(lettersGame.teams.green.join('، ')||'الأخضر')}</small></strong></div><div class="letters-playfield" aria-label="مسارات الفريقين"><span class="letters-direction letters-direction-top" aria-hidden="true"></span><span class="letters-direction letters-direction-right" aria-hidden="true"></span><div class="letters-board" role="group" aria-label="لوحة تحدي الحروف">${board}</div><span class="letters-direction letters-direction-bottom" aria-hidden="true"></span><span class="letters-direction letters-direction-left" aria-hidden="true"></span></div>${startControls}${lettersGame.selected&&!lettersGame.finished?(activeQuestion?renderQuestion():`<p class="dots-feedback">${questionUnavailableMessage()}</p>`):''}${lettersGame.finished?'<button type="button" class="btn primary" data-letters-restart>تحدٍ جديد</button>':''}</div>`;
  }
  function renderTreasureMap(host=byId('independentStage')){
    if(!host)return;
    const art=matchMedia('(orientation: portrait)').matches?TREASURE_ART.portrait:TREASURE_ART.landscape;
    if(!treasureGame){host.innerHTML=`<div class="treasure-before"><div class="treasure-map-art ${art===TREASURE_ART.portrait?'portrait':''}" role="img" aria-label="خريطة الكنز">${treasureStopsMarkup(art,8)}</div><div class="treasure-options"><button type="button" data-record-mode="play" class="${recordMode==='play'?'selected':''}">🎮 لعب فقط</button><button type="button" data-record-mode="linked" class="${recordMode==='linked'?'selected':''}">✋ مرتبط بسجل المتابعة</button><button type="button" data-treasure-pick="controlled" class="${treasurePick==='controlled'?'selected':''}">✋ أنا أختار</button><button type="button" data-treasure-pick="random" class="${treasurePick==='random'?'selected':''}">🎲 اختيار عشوائي</button></div><p class="treasure-summary"><label>عدد المحطات <input id="treasureStops" type="number" min="6" max="10" value="8" required /></label><span>٨ محطات، والسؤال شفهي حتى تجهز أسئلتك</span></p><button type="button" class="btn primary treasure-start" data-treasure-start>ابدأ الرحلة</button></div>`;return;}
    const current=Math.min(treasureGame.at,treasureGame.stops-1),stops=treasureStopsMarkup(art,treasureGame.stops,current,treasureGame.finished);
    const picker=treasureGame.pick==='controlled'&&!treasureGame.answering&&!treasureGame.finished?`<div class="treasure-player-pick"><strong>اختر الطالب لهذه المحطة</strong>${treasureGame.roster.map(player=>`<button type="button" class="btn secondary" data-treasure-player="${escapeHtml(player)}">${escapeHtml(player)}</button>`).join('')}</div>`:'';
    const progress=`المحطة ${arabicNumber(Math.min(treasureGame.at+1,treasureGame.stops))} من ${arabicNumber(treasureGame.stops)}`;
    host.innerHTML=`<div class="treasure-game"><div class="treasure-map-art ${art===TREASURE_ART.portrait?'portrait':''}" role="img" aria-label="خريطة كنز وافي">${stops}</div><div class="treasure-progress">${treasureGame.finished?'اكتملت خريطة الكنز':progress}</div>${picker}${treasureGame.answering&&!treasureGame.finished?`<div class="treasure-current-player">دور ${escapeHtml(treasureGame.answering)}</div>${activeQuestion?renderQuestion():`<p>${questionUnavailableMessage()}</p>`}`:''}${treasureGame.finished?'<button type="button" class="btn primary" data-treasure-restart>خريطة جديدة</button>':''}</div>`;
  }
  function startDotsBoxes(){
    if(participants.length<2){status('أضف مشاركين اثنين على الأقل قبل بدء أكمل المربع.');return;}
    const game=!dotsGame||dotsGame.started||dotsGame.finished?createDotsBoxesGame(participants,{random}):dotsGame;dotsGame=startDotsBoxesGame(game,{random});pendingEdge=null;renderDotsBoxes();
  }
  function startLettersChallenge(){
    if(participants.length<2){status('أضف اسمين على الأقل للعب تحدي الحروف.');return;}
    const game=!lettersGame||lettersGame.started||lettersGame.finished?newLettersGame(participants,random):lettersGame;lettersGame=startLettersGame(game,random);renderLettersChallenge();
  }
  function startTreasureMap(){
    const rawStops=Number(byId('treasureStops')?.value);
    const stops=stopsFor(rawStops),pick=treasurePick;
    treasureGame=startTreasureGame(newTreasureGame(participants,stops,pick),random);
    activeQuestion=treasureGame.answering?chooseQuestion().question:null;renderTreasureMap();
  }
  function resolveLettersAnswer(verdict){
    if(!lettersGame?.selected||!activeQuestion)return;
    lettersGame=verdictLetterCell(lettersGame,verdict);activeQuestion=null;renderLettersChallenge();
  }
  function resolveTreasureAnswer(verdict){
    if(!treasureGame?.answering||!activeQuestion)return;
    treasureGame=verdictTreasureGame(treasureGame,activeQuestion.id,verdict,random);
    if(verdict==='correct'&&!treasureGame.finished)chooseQuestion();
    renderTreasureMap();
  }
  function resolveDotsAnswer(verdict){
    if(!pendingEdge||!dotsGame||!activeQuestion)return;
    dotsGame=answerDotsBoxesEdge(dotsGame,pendingEdge,verdict);pendingEdge=null;activeQuestion=null;renderDotsBoxes();
  }
  function renderWheel(){
    const wheel=byId('independentWheel');if(!wheel)return;
    const entries=drawPool();if(!entries.length){wheel.style.background='conic-gradient(#e8edf5 0 100%)';wheel.innerHTML='';return;}
    const colors=['#39a5ee','#ffb126','#2fd0a5','#fa6682','#39a5ee','#ffb126','#2fd0a5','#fa6682'];
    const segment=360/entries.length;
    wheel.style.background=`conic-gradient(${entries.map((_,index)=>`${colors[index%colors.length]} ${segment*index}deg ${segment*(index+1)}deg`).join(',')})`;
    wheel.innerHTML=entries.map((name,index)=>`<span class="independent-wheel-label" style="--angle:${segment*index+segment/2}deg">${escapeHtml(name)}</span>`).join('');
  }
  function open(game){
    if(!['dice','wheel','dots','letters','treasure'].includes(game))return;
    stopAnimation();
    activeGame=game;cycleMode=byId('independentNoRepeat')?.checked!==false;dotsGame=null;lettersGame=null;treasureGame=null;pendingEdge=null;askedQuestionIds=[];activeQuestion=null;
    remaining=[...drawPool()];
    byId('independentPlayTitle').textContent=game==='dice'?'النرد العشوائي':game==='wheel'?'عجلة الحظ':game==='dots'?'أكمل المربع':game==='letters'?'تحدي الحروف':'خريطة الكنز';
    byId('independentPlayKicker').textContent=game==='dice'?'اختيار عشوائي':game==='wheel'?'دوران واختيار':game==='treasure'?'محطات الخريطة':'تنافس فريقين';
    byId('independentDrawButton').textContent=game==='dice'?'ارمِ النرد':'أدر العجلة';
    byId('independentDrawButton').hidden=true;byId('independentResetCycle').hidden=true;byId('independentHistoryWrap').hidden=true;byId('independentPlayActions').hidden=true;byId('independentResult').hidden=false;
    byId('independentResult').innerHTML='<span>النتيجة تظهر هنا</span>';
    renderStage();if(game==='dots'){dotsGame=createDotsBoxesGame(participants,{random});renderDotsBoxes();}if(game==='letters'){lettersGame=newLettersGame(participants,random);renderLettersChallenge();}renderHistory();showView('independentGameView');
  }
  function draw(){
    const pool=drawPool();if(activeGame==='dots'||!pool.length){status(activeGame==='wheel'&&wheelMode==='groups'?'أضف مجموعة واحدة على الأقل لعجلة الحظ.':'أضف مشاركين أولًا.');return;}
    if(animationTimer){clearTimeout(animationTimer);animationTimer=null;}
    cycleMode=byId('independentNoRepeat')?.checked!==false;
    if(!cycleMode)remaining=[...pool];
    if(remaining.some(name=>!pool.includes(name)))remaining=[...pool];
    const count=activeGame==='dice'?Math.max(1,Math.min(pool.length,diceCount)):1;
    const result=drawParticipants(pool,{remaining,noRepeat:cycleMode,count,random});
    if(!result.participants.length)return;
    remaining=result.remaining;result.participants.forEach(name=>history.unshift({name,at:Date.now()}));
    const remainingLabel=byId('independentStage')?.querySelector('[data-cycle-count]');if(remainingLabel)remainingLabel.textContent=cycleRemainingLabel();
    byId('independentStage')?.querySelectorAll('[data-game-draw]').forEach(button=>button.disabled=true);
    const button=byId('independentDrawButton');if(button)button.disabled=true;
    const resetButton=byId('independentResetCycle');if(resetButton)resetButton.disabled=true;
    const wheelModeSelect=byId('independentWheelMode');if(wheelModeSelect)wheelModeSelect.disabled=true;
    const resultNode=byId('independentResult');if(resultNode)resultNode.innerHTML='<span>جاري الاختيار…</span>';
    if(activeGame==='dice'){
      const die=byId('independentDie');die?.classList.add('rolling');
      animationTimer=setTimeout(()=>{die?.classList.remove('rolling');diceFace=1+Math.floor(random()*6);const face=die?.querySelector('.die-face');if(face)face.innerHTML=diePips(diceFace);showDrawResult(result.participants,result.cycleRestarted);},760);
    }else{
      const wheel=byId('independentWheel');
      const segment=360/pool.length;const center=segment*pool.indexOf(result.participants[0])+segment/2;
      if(wheel){wheel.style.transition='none';wheel.style.transform='rotate(0deg)';void wheel.offsetWidth;wheel.style.transition='transform 3.3s cubic-bezier(.12,.72,.12,1)';wheel.style.transform=`rotate(${360*5+360-center}deg)`;}
      animationTimer=setTimeout(()=>showDrawResult(result.participants,result.cycleRestarted),3350);
    }
    renderHistory();
  }
  function showDrawResult(names,cycleRestarted){
    animationTimer=null;const button=byId('independentDrawButton');if(button)button.disabled=false;
    byId('independentStage')?.querySelectorAll('[data-game-draw]').forEach(button=>button.disabled=false);
    const resetButton=byId('independentResetCycle');if(resetButton)resetButton.disabled=false;
    const wheelModeSelect=byId('independentWheelMode');if(wheelModeSelect)wheelModeSelect.disabled=false;
    drawnNames=[...names];drawnIndex=0;drawCycleRestarted=cycleRestarted;chooseQuestion();renderDrawQuestion();
  }
  function renderDrawQuestion(){
    const target=byId('independentResult');if(!target)return;
    const name=drawnNames[drawnIndex];
    target.innerHTML=`<small>${drawCycleRestarted?'بدأت دورة جديدة':`الاختيار ${arabicNumber(drawnIndex+1)} من ${arabicNumber(drawnNames.length)}`}</small><strong>${escapeHtml(name||'')}</strong>${activeQuestion?renderQuestion():`<p class="dots-feedback">${questionUnavailableMessage()}</p>`}`;
  }
  function addNames(value){
    const incoming=normalizeParticipants(String(value||'').split(/[\n,،]+/));
    const combined=normalizeParticipants([...participants,...incoming]);
    const added=combined.length-participants.length;
    participants=combined;remaining=[...drawPool()];saveIndependentGameSetup({participants,groups});history=[];if(activeGame==='dots'&&!dotsGame?.started)dotsGame=createDotsBoxesGame(participants,{random});if(activeGame==='letters'&&!lettersGame?.started)lettersGame=newLettersGame(participants,random);renderParticipants();renderHistory();renderStage();
    status(added?`أُضيف ${arabicNumber(added)} ${added===1?'مشارك':'مشاركين'}.`:'الاسم موجود بالقائمة أو الحقل فارغ.');
  }
  function setGroups(value){groups=normalizeParticipants(String(value||'').split(/[\n,،]+/));remaining=[...drawPool()];saveIndependentGameSetup({participants,groups});renderGroups();renderStage();status(groups.length?`حُفظت ${arabicNumber(groups.length)} مجموعة.`:'أضف أسماء المجموعات كلًّا في سطر.');}
  function resetCycle(){if(animationTimer)return;remaining=[...drawPool()];const target=byId('independentResult');if(target)target.innerHTML='<span>بدأت دورة جديدة</span>';}
  function enter(){
    onBeforeEnter?.();document.body.classList.remove('hub-mode','khaled-mode','mashaal-mode','family-parent-mode','games-mode','xo-game-mode','rps-game-mode');document.body.classList.add('independent-games-mode');
    renderParticipants();renderGroups();renderStage();showView('independentGamesView');
  }
  function leave(){
    stopAnimation();
    document.body.classList.remove('independent-games-mode');
  }
  function bind(){
    if(bound)return;bound=true;ensureInteractiveGamesShell();
    byId('independentGamesOpenBtn')?.addEventListener('click',enter);
    byId('independentGamesBack')?.addEventListener('click',()=>{leave();onExitToHub?.();});
    byId('independentPlayBack')?.addEventListener('click',()=>{stopAnimation();byId('independentDrawButton').hidden=false;byId('independentResetCycle').hidden=false;byId('independentHistoryWrap').hidden=false;byId('independentResult').hidden=false;if(location.hash.startsWith('#game-'))window.history.replaceState(null,'',location.pathname+location.search);showView('independentGamesView');});
    document.querySelectorAll('[data-independent-game]').forEach(link=>link.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      const game=link.dataset.independentGame;
      window.history.pushState(null,'',`${location.pathname}${location.search}#game-${game}`);
      open(game);
    }));
    window.addEventListener('hashchange',()=>{const game=location.hash.slice('#game-'.length);if(['dice','wheel','dots','letters','treasure'].includes(game))open(game);});
    byId('independentParticipantForm')?.addEventListener('submit',event=>{event.preventDefault();const input=byId('independentParticipantInput');addNames(input.value);input.value='';input.focus();});
    byId('independentGroupForm')?.addEventListener('submit',event=>{event.preventDefault();setGroups(byId('independentGroupInput')?.value);});
    byId('independentNoRepeat')?.addEventListener('change',event=>{cycleMode=event.target.checked;remaining=[...drawPool()];});
    byId('independentDrawButton')?.addEventListener('click',draw);byId('independentResetCycle')?.addEventListener('click',resetCycle);
    byId('independentStage')?.addEventListener('change',event=>{
      if(event.target.id==='independentWheelMode'){wheelMode=event.target.value==='groups'?'groups':'students';remaining=[...drawPool()];renderStage();return;}
      if(event.target.matches('[data-dice-no-repeat]')){cycleMode=event.target.checked;const toggle=byId('independentNoRepeat');if(toggle)toggle.checked=cycleMode;remaining=[...drawPool()];const label=byId('independentStage')?.querySelector('[data-cycle-count]');if(label)label.textContent=cycleRemainingLabel();return;}
      if(event.target.matches('[data-dice-shake]')){setShake(event.target.checked);return;}
    });
    byId('independentStage')?.addEventListener('click',event=>{
      const quickDraw=event.target.closest('[data-game-draw]'),diceCountButton=event.target.closest('[data-dice-count]'),mapPick=event.target.closest('[data-treasure-pick]'),record=event.target.closest('[data-record-mode]'),start=event.target.closest('[data-dots-start]'),edge=event.target.closest('[data-dots-edge]'),letterStart=event.target.closest('[data-letters-start]'),letter=event.target.closest('[data-letter-cell]'),letterRestart=event.target.closest('[data-letters-restart]'),treasureStart=event.target.closest('[data-treasure-start]'),treasurePlayer=event.target.closest('[data-treasure-player]'),treasureRestart=event.target.closest('[data-treasure-restart]'),answer=event.target.closest('[data-dots-answer]'),restart=event.target.closest('[data-dots-restart]');
      if(quickDraw){draw();return;}
      if(diceCountButton){diceCount=Number(diceCountButton.dataset.diceCount)||1;renderDice();return;}
      if(mapPick){treasurePick=mapPick.dataset.treasurePick==='controlled'?'controlled':'random';byId('independentStage')?.querySelectorAll('[data-treasure-pick]').forEach(button=>button.classList.toggle('selected',button===mapPick));return;}
      if(record){recordMode=record.dataset.recordMode==='linked'?'linked':'play';byId('independentStage')?.querySelectorAll('[data-record-mode]').forEach(button=>button.classList.toggle('selected',button===record));return;}
      if(start){startDotsBoxes();return;}
      if(edge&&dotsGame&&!dotsGame.finished){dotsGame=pickDotsBoxesEdge(dotsGame,edge.dataset.dotsEdge);pendingEdge=dotsGame.selected;if(pendingEdge)chooseQuestion();renderDotsBoxes();return;}
      if(letterStart){startLettersChallenge();return;}
      if(letter){const[row,col]=letter.dataset.letterCell.split('-').map(Number);lettersGame=pickLetterCell(lettersGame,row,col);if(lettersGame.selected)chooseQuestion();renderLettersChallenge();return;}
      if(letterRestart){startLettersChallenge();return;}
      if(treasureStart){startTreasureMap();return;}
      if(treasurePlayer){treasureGame=setTreasurePlayer(treasureGame,treasurePlayer.dataset.treasurePlayer);chooseQuestion();renderTreasureMap();return;}
      if(treasureRestart){const {roster,stops,pick}=treasureGame;treasureGame=startTreasureGame(newTreasureGame(roster,stops,pick),random);activeQuestion=treasureGame.answering?chooseQuestion().question:null;renderTreasureMap();return;}
      if(answer){resolveDotsAnswer(answer.dataset.dotsAnswer);return;}
      if(restart)startDotsBoxes();
    });
    byId('independentQuestionForm')?.addEventListener('submit',event=>{
      event.preventDefault();const textInput=byId('independentQuestionText'),answerInput=byId('independentQuestionAnswer');
      const text=String(textInput?.value||'').trim();if(!text)return;
      questions=saveGameQuestionBank([...questions,{id:`manual-${Date.now()}-${Math.random().toString(16).slice(2)}`,text,answer:answerInput?.value||'',source:'manual'}]);
      textInput.value='';if(answerInput)answerInput.value='';renderQuestionBank();status('أُضيف السؤال إلى بنك الألعاب المستقل.');
    });
    byId('independentQuestionList')?.addEventListener('click',event=>{
      const button=event.target.closest('[data-remove-question]');if(!button)return;
      questions=saveGameQuestionBank(questions.filter((_,index)=>index!==Number(button.dataset.removeQuestion)));renderQuestionBank();
    });
    const route=location.hash.slice('#game-'.length);if(['dice','wheel','dots','letters','treasure'].includes(route))open(route);
    byId('independentPlayView')?.addEventListener('click',event=>{
      const button=event.target.closest('[data-independent-verdict]');if(!button)return;
      const verdict=button.dataset.independentVerdict;
      if(activeGame==='dots'){resolveDotsAnswer(verdict);return;}
      if(activeGame==='letters'){resolveLettersAnswer(verdict);return;}
      if(activeGame==='treasure'){resolveTreasureAnswer(verdict);return;}
      drawnIndex++;
      if(drawnIndex<drawnNames.length){chooseQuestion();renderDrawQuestion();}
      else{const result=byId('independentResult');if(result)result.innerHTML=`<small>${verdict==='correct'?'إجابة صحيحة':verdict==='wrong'?'إجابة خاطئة':'لم يجب'}</small><strong>اكتملت السحبة</strong>`;activeQuestion=null;}
    });
    renderQuestionBank();
  }
  return Object.freeze({start:bind,enter,leave,addNames,getParticipants:()=>[...participants]});
}
