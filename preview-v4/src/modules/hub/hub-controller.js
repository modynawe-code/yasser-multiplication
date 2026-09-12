export function createHubController({getElement=document.getElementById.bind(document),onBeforeShow,onAfterShow,onSelectYasser,onSelectKhaled}={}){
  let bound=false;

  function showHub(){
    onBeforeShow?.();
    document.body.classList.add('hub-mode');
    document.body.classList.remove('intro-mode','family-parent-mode','khaled-mode');
    document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id==='hubView'));
    window.scrollTo(0,0);
    onAfterShow?.();
  }

  function bind(){
    if(bound)return;
    bound=true;
    getElement('hubYasser')?.addEventListener('click',()=>onSelectYasser?.());
    getElement('hubKhaled')?.addEventListener('click',()=>onSelectKhaled?.());
    getElement('switchLearnerBtn')?.addEventListener('click',showHub);
  }

  return{
    start(){bind();showHub();},
    show:showHub
  };
}
