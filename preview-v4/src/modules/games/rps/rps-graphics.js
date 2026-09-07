export const RPS_CHOICE_META=Object.freeze({
  rock:Object.freeze({label:'حجر'}),
  paper:Object.freeze({label:'ورق'}),
  scissors:Object.freeze({label:'مقص'})
});

function rockGraphic(){
  return `<svg class="rps-choice-svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <path class="rps-rock-shadow" d="M25 89c5 12 19 18 37 18 20 0 34-7 39-19-17 4-57 5-76 1Z"/>
    <path class="rps-rock-body" d="M19 78 28 43 47 23 78 18 101 41 106 73 89 97 55 103 29 94Z"/>
    <path class="rps-rock-face" d="m28 62 17-29 27-7 22 21-5 35-28 12-27-10Z"/>
    <path class="rps-rock-facet" d="m45 33 9 23-20 6m20-6 31-15 9 6M54 56l7 38m0-38 28 26"/>
    <path class="rps-rock-highlight" d="M48 31c8-4 17-5 25-4"/>
  </svg>`;
}

function paperGraphic(){
  return `<svg class="rps-choice-svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <path class="rps-paper-shadow" d="M31 99h60c6 0 10-4 10-10V35L82 16H38c-6 0-10 4-10 10v63c0 6 1 10 3 10Z"/>
    <path class="rps-paper-body" d="M24 91V24c0-7 4-11 11-11h43l22 22v56c0 7-4 11-11 11H35c-7 0-11-4-11-11Z"/>
    <path class="rps-paper-fold" d="M78 13v19c0 5 3 8 8 8h14"/>
    <path class="rps-paper-line" d="M39 49h45M39 62h45M39 75h34"/>
    <path class="rps-paper-highlight" d="M35 25v56"/>
  </svg>`;
}

function scissorsGraphic(){
  return `<svg class="rps-choice-svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <path class="rps-scissors-blade" d="m57 62 43-40c4-4 9 2 6 6L70 72m-13-10L89 98c4 5-3 10-7 6L55 75"/>
    <path class="rps-scissors-metal" d="m57 62 13 10-8 8-12-12Z"/>
    <circle class="rps-scissors-ring" cx="39" cy="78" r="17"/>
    <circle class="rps-scissors-ring" cx="35" cy="48" r="17"/>
    <circle class="rps-scissors-hole" cx="39" cy="78" r="8"/>
    <circle class="rps-scissors-hole" cx="35" cy="48" r="8"/>
    <circle class="rps-scissors-pin" cx="58" cy="64" r="5"/>
  </svg>`;
}

export function rpsChoiceGraphic(choice){
  if(choice==='rock')return rockGraphic();
  if(choice==='paper')return paperGraphic();
  if(choice==='scissors')return scissorsGraphic();
  return '<span class="rps-choice-unknown" aria-hidden="true">؟</span>';
}
