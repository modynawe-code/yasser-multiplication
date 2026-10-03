export function createHubController({getElement=document.getElementById.bind(document),onBeforeShow,onAfterShow,onSelectLearner,onSelectYasser,onSelectKhaled}={}){
  let bound=false;

  function showHub(){
    onBeforeShow?.();
    document.body.classList.add('hub-mode');
    document.body.classList.remove('intro-mode','family-parent-mode','khaled-mode','mashaal-mode','games-mode','xo-game-mode','rps-game-mode');
    document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id==='hubView'));
    window.scrollTo(0,0);
    onAfterShow?.();
  }

  function selectLearner(learnerId){
    if(onSelectLearner){onSelectLearner(learnerId);return;}
    if(learnerId==='yasser')onSelectYasser?.();
    else if(learnerId==='khaled')onSelectKhaled?.();
  }

  function bind(){
    if(bound)return;
    bound=true;
    const grid=document.querySelector('.learner-grid');
    grid?.addEventListener('click',event=>{
      const card=event.target.closest('[data-learner-id]');
      if(card)selectLearner(card.dataset.learnerId);
    });
    getElement('hubYasser')?.addEventListener('click',()=>{if(!getElement('hubYasser')?.dataset.learnerId)selectLearner('yasser');});
    getElement('hubKhaled')?.addEventListener('click',()=>{if(!getElement('hubKhaled')?.dataset.learnerId)selectLearner('khaled');});
    getElement('switchLearnerBtn')?.addEventListener('click',showHub);
  }

  return{start(){bind();showHub();},show:showHub};
}
