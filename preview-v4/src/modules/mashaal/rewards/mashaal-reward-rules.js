import { MASHAAL_REWARD_CATALOG } from './mashaal-reward-catalog.js';
import { rewardRequirementsMet } from '../../../shared/rewards/reward-requirement-progress.js';

const REWARD_BY_ID=Object.freeze(Object.fromEntries(MASHAAL_REWARD_CATALOG.map(item=>[item.id,item])));
const progress=context=>context?.rewardProgress||{};
const rule=(id,rewardId,eventTypes)=>Object.freeze({
  id,rewardId,eventTypes:Object.freeze(eventTypes),
  when:(_event,context)=>rewardRequirementsMet(REWARD_BY_ID[rewardId],progress(context)),
  awardKey:()=>`${rewardId}:requirements-complete`
});

export const MASHAAL_REWARD_RULES=Object.freeze([
  rule('attempt-flower','mashaal-attempt-flower',['game.completed']),
  rule('progress-butterfly','mashaal-progress-butterfly',['game.completed']),
  rule('consistency-star','mashaal-consistency-star',['game.completed']),
  rule('cooperation-heart','mashaal-cooperation-heart',['game.cooperation.completed']),
  rule('distinction-crown','mashaal-distinction-crown',['game.won']),
  rule('achievement-ribbon','mashaal-achievement-ribbon',['game.goal.reached']),
  rule('persistence-pearl','mashaal-persistence-pearl',['game.retry']),
  rule('variety-rainbow','mashaal-variety-rainbow',['game.completed']),
  rule('surprise-box','mashaal-surprise-box',['game.completed']),
  rule('mashaal-cup','mashaal-cup',['game.completed']),
  rule('courage-star','mashaal-courage-star',['game.completed']),
  rule('magic-wand','mashaal-magic-wand',['game.goal.reached','game.retry']),
  rule('premium-shoes','mashaal-premium-shoes',['game.completed']),
  rule('premium-hair-bows','mashaal-premium-hair-bows',['game.completed']),
  rule('premium-mirror','mashaal-premium-mirror',['game.won','game.retry']),
  rule('premium-makeup','mashaal-premium-makeup',['game.completed','game.retry']),
  rule('premium-necklace','mashaal-premium-necklace',['game.won']),
  rule('premium-wand','mashaal-premium-wand',['game.goal.reached']),
  rule('premium-bracelet','mashaal-premium-bracelet',['game.completed']),
  rule('premium-gown','mashaal-premium-gown',['game.completed']),
  rule('premium-crown','mashaal-premium-crown',['game.completed','game.won']),
  rule('premium-treasure-chest','mashaal-premium-treasure-chest',['game.completed','game.won','game.goal.reached'])
]);
