import { getMashaalKg3Activity } from '../curriculum/kg3-activity-catalog.js';
import { createMashaalActivityViewModel } from './activity-view-model.js';
import { createMashaalChoiceVisual,createMashaalStimulusVisual } from './mashaal-visuals.js';

function viewModelFor(challenge){
  const activityId=challenge?.source?.activityId;
  const activity=activityId?getMashaalKg3Activity(activityId):null;
  return activity?createMashaalActivityViewModel(activity):null;
}

export function createMashaalGameChallengePresenter(){
  return Object.freeze({
    getViewModel:challenge=>viewModelFor(challenge),
    labelForOption(challenge,value){
      const viewModel=viewModelFor(challenge);
      return viewModel?.choices?.find(item=>String(item.value)===String(value))?.label||String(value);
    },
    renderStimulus(challenge,{compact=false}={}){
      const viewModel=viewModelFor(challenge);
      return viewModel?createMashaalStimulusVisual(viewModel.stimulus,{compact}):null;
    },
    renderOption(challenge,value,{compact=false}={}){
      const viewModel=viewModelFor(challenge);
      return viewModel?createMashaalChoiceVisual(String(value),viewModel,{compact}):null;
    }
  });
}
