export function isFactMastered(fact){
  if(!fact||fact.attempts<4) return false;
  const lastThree=fact.recent.slice(-3);
  return lastThree.length===3 && lastThree.every(Boolean) && (fact.correct/fact.attempts)>=0.75;
}
export function getFactMasteryLevel(fact){
  if(!fact||fact.attempts===0) return 'new';
  if(isFactMastered(fact)) return 'mastered';
  const accuracy=fact.correct/Math.max(1,fact.attempts);
  if(fact.wrong>0 && fact.recent.slice(-2).some(v=>!v)) return 'review';
  if(fact.attempts>=3 && accuracy>=0.7) return 'good';
  return 'learning';
}
export function getTableMastery(state,table){let mastered=0;for(let multiplier=1;multiplier<=10;multiplier++){if(isFactMastered(state.tables[table].facts[multiplier])) mastered++;}return mastered*10;}
export function getTableAccuracy(state,table){const data=state.tables[table];return data.attempts?Math.round((data.correct/data.attempts)*100):0;}
