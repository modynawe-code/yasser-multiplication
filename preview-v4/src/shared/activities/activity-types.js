export const EARLY_LEARNING_ACTIVITY_TYPES = Object.freeze([
  'choice',
  'matching',
  'sorting',
  'sequencing',
  'listening',
  'drag-drop',
  'guided-play',
  'story',
  'tracing'
]);

export function isSupportedActivityType(type){
  return EARLY_LEARNING_ACTIVITY_TYPES.includes(String(type||''));
}
