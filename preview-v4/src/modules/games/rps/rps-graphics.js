export const RPS_CHOICE_META=Object.freeze({
  rock:Object.freeze({label:'حجر',asset:'assets/games/rps/rock.webp'}),
  paper:Object.freeze({label:'ورق',asset:'assets/games/rps/paper.webp'}),
  scissors:Object.freeze({label:'مقص',asset:'assets/games/rps/scissors.webp'})
});

export function rpsChoiceGraphic(choice){
  const meta=RPS_CHOICE_META[choice];
  if(!meta)return '<span class="rps-choice-unknown" aria-hidden="true">؟</span>';
  return `<img class="rps-choice-image" src="${meta.asset}" alt="" aria-hidden="true" draggable="false" decoding="async">`;
}
