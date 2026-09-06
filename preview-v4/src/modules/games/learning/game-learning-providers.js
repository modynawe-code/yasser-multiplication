import { createAdaptiveQuestions } from '../../../domain/question-bank.js';
import { recordAttempt } from '../../../application/attempt-service.js';
import { createCountQuestion } from '../../khaled/domain/question-bank.js';
import { recordKhaledAttempt } from '../../khaled/domain/state-model.js';
import { createLearningAdapter } from '../core/learning-adapter.js';

function shuffle(values,random=Math.random){
  const copy=[...values];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  return copy;
}

function multiplicationOptions(correct,random=Math.random){
  const values=new Set([correct]);
  const nearby=[correct-1,correct+1,correct-2,correct+2,correct-5,correct+5].filter(value=>value>0);
  for(const value of shuffle(nearby,random)){values.add(value);if(values.size===3)break;}
  while(values.size<3)values.add(Math.max(1,correct+Math.floor(random()*9)-4));
  return shuffle([...values],random);
}

export function createGameLearningAdapter({
  getYasserState,
  saveYasserState,
  getKhaledState,
  saveKhaledState,
  random=Math.random
}={}){
  if(typeof getYasserState!=='function'||typeof getKhaledState!=='function')throw new TypeError('learner state getters are required');

  const providers={
    yasser:{
      nextChallenge(){
        const state=getYasserState();
        const selected=Array.isArray(state?.selected)&&state.selected.length?state.selected:[2,3];
        const question=createAdaptiveQuestions(state,selected,1,random)[0];
        if(!question)throw new Error('unable to create Yasser game challenge');
        const correctAnswer=question.table*question.multiplier;
        return Object.freeze({
          id:`game-yasser-${question.table}x${question.multiplier}-${Date.now()}`,
          learnerId:'yasser',
          kind:'multiplication',
          prompt:`${question.table} × ${question.multiplier} = ؟`,
          spokenPrompt:`كم يساوي ${question.table} ضرب ${question.multiplier}؟`,
          options:Object.freeze(multiplicationOptions(correctAnswer,random)),
          correctAnswer,
          source:Object.freeze({table:question.table,multiplier:question.multiplier})
        });
      },
      recordChallenge({result}){
        const state=getYasserState(),source=result.challenge?.source;
        if(!source)return null;
        const event=recordAttempt(state,{
          question:{table:source.table,multiplier:source.multiplier},
          answer:result.answer,
          responseMs:result.responseMs
        });
        saveYasserState?.(state);
        return event;
      }
    },
    khaled:{
      nextChallenge(){
        const question=createCountQuestion({min:0,max:10,random});
        return Object.freeze({
          id:`game-khaled-${question.id}`,
          learnerId:'khaled',
          kind:'count-dots',
          prompt:question.prompt,
          spokenPrompt:question.spokenPrompt,
          options:Object.freeze([...question.options]),
          correctAnswer:question.correctAnswer,
          visual:Object.freeze({kind:'dots',count:question.count}),
          source:Object.freeze({question})
        });
      },
      recordChallenge({result}){
        const state=getKhaledState(),question=result.challenge?.source?.question;
        if(!question)return null;
        const isCorrect=String(result.answer)===String(question.correctAnswer);
        const event=recordKhaledAttempt(state,{skillId:question.skillId,isCorrect,question,answer:result.answer});
        saveKhaledState?.(state);
        return event;
      }
    }
  };

  return createLearningAdapter({providers});
}
