export function createHubController({getElement=document.getElementById.bind(document),onBeforeShow,onAfterShow,onSelectLearner,onSelectYasser,onSelectKhaled}={}){
  let bound=false;

  function showHub(){
    onBeforeShow?.();
    document.body.classList.add('hub-mode');
    document.body.classList.remove('intro-mode','family-parent-mode','mashaal-mode');
    document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id==='hubView'));
    window.scrollTo(0,0);
    onAfterShow?.();
  }

  function selectLearner(learnerId){
    if(onSelectLearner)return onSelectLearner(learnerId);
    if(learnerId==='yasser')return onSelectYasser?.();
    if(learnerId==='khaled')return onSelectKhaled?.();
  }

  function bind(){
    if(bound)return;
    bound=true;
    document.querySelectorAll('[data-learner-id]').forEach(card=>card.addEventListener('click',()=>selectLearner(card.dataset.learnerId)));
    getElement('switchLearnerBtn')?.addEventListener('click',showHub);
  }

  return{
    start(){bind();showHub();},
    show:showHub
  };
}
