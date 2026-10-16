import { getLearnerProfile } from '../learners/learner-registry.js';

const MODES=Object.freeze(['academic','developmental']);
const RULE_ID_PATTERN=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeRule(rule){
  if(!rule||typeof rule!=='object')throw new TypeError('reward rule is required');
  const id=String(rule.id||'').trim();
  const rewardId=String(rule.rewardId||'').trim();
  const eventTypes=[...new Set((rule.eventTypes||[]).map(value=>String(value||'').trim()).filter(Boolean))];
  if(!RULE_ID_PATTERN.test(id))throw new TypeError(`invalid reward rule id: ${id}`);
  if(!rewardId)throw new TypeError('reward rule rewardId is required');
  if(!eventTypes.length)throw new TypeError('reward rule eventTypes are required');
  return Object.freeze({
    ...rule,
    id,
    rewardId,
    eventTypes:Object.freeze(eventTypes),
    when:typeof rule.when==='function'?rule.when:()=>true,
    awardKey:typeof rule.awardKey==='function'?rule.awardKey:null
  });
}

export function createRewardRuleRegistry(){
  const entries=new Map();

  function register(learnerId,{mode='academic',rules=[]}={}){
    const profile=getLearnerProfile(learnerId);
    if(!profile)throw new TypeError('registered learner is required');
    if(!MODES.includes(mode))throw new TypeError('unsupported reward rule mode');
    if(entries.has(profile.id))throw new Error(`reward rules already registered: ${profile.id}`);
    if(!Array.isArray(rules))throw new TypeError('reward rules must be an array');
    const normalized=rules.map(normalizeRule);
    const ids=new Set();
    for(const rule of normalized){
      if(ids.has(rule.id))throw new Error(`duplicate reward rule: ${rule.id}`);
      ids.add(rule.id);
    }
    const entry=Object.freeze({learnerId:profile.id,mode,rules:Object.freeze(normalized)});
    entries.set(profile.id,entry);
    return entry;
  }

  function get(learnerId){return entries.get(String(learnerId||'').trim().toLowerCase())||null;}

  function matching(learnerId,event,context={}){
    const entry=get(learnerId);
    if(!entry||!event)return Object.freeze([]);
    const matches=entry.rules.filter(rule=>rule.eventTypes.includes(event.type)&&rule.when(event,context));
    return Object.freeze(matches);
  }

  return Object.freeze({register,get,matching});
}
