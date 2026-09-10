export const EARLY_LEARNING_ACTIVITY_PRESENTATION_TYPES=Object.freeze([
  'choice',
  'scene-choice',
  'scene-choice-options-only',
  'sound-choice',
  'letter-sound-choice',
  'pattern-choice',
  'spatial-choice',
  'counting-choice',
  'comparison-choice',
  'multi-select',
  'ordered-sequence',
  'guided-speaking',
  'guided-tracing',
  'guided-emotion',
  'guided-movement',
  'guided-fine-motor',
  'quran-recitation'
]);

const contract=(renderer,mode,{hideStimulus=false}={})=>Object.freeze({renderer,mode,hideStimulus});

export const EARLY_LEARNING_ACTIVITY_RENDERER_CONTRACTS=Object.freeze({
  choice:contract('choice-grid','choice'),
  'scene-choice':contract('choice-grid','choice'),
  'scene-choice-options-only':contract('choice-grid','choice',{hideStimulus:true}),
  'sound-choice':contract('choice-grid','choice'),
  'letter-sound-choice':contract('choice-grid','choice'),
  'pattern-choice':contract('choice-grid','choice'),
  'spatial-choice':contract('choice-grid','choice',{hideStimulus:true}),
  'counting-choice':contract('choice-grid','counting'),
  'comparison-choice':contract('choice-grid','comparison',{hideStimulus:true}),
  'multi-select':contract('choice-grid','multi-select'),
  'ordered-sequence':contract('choice-grid','sequence',{hideStimulus:true}),
  'guided-speaking':contract('guided-completion','guided-speaking'),
  'guided-tracing':contract('guided-completion','guided-tracing'),
  'guided-emotion':contract('guided-completion','guided-emotion'),
  'guided-movement':contract('guided-completion','guided-movement'),
  'guided-fine-motor':contract('guided-completion','guided-fine-motor'),
  'quran-recitation':contract('quran-recitation','recitation')
});

export function isSupportedActivityPresentationType(type){
  return EARLY_LEARNING_ACTIVITY_PRESENTATION_TYPES.includes(String(type||''));
}

export function getActivityRendererContract(type){
  return EARLY_LEARNING_ACTIVITY_RENDERER_CONTRACTS[String(type||'')]||null;
}
