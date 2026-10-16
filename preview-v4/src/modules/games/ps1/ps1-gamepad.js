const BUTTON_ACTIONS=Object.freeze({
  0:'CROSS',1:'CIRCLE',2:'SQUARE',3:'TRIANGLE',
  4:'L1',5:'R1',6:'L2',7:'R2',
  8:'SELECT',9:'START',10:'L3',11:'R3',
  12:'UP',13:'DOWN',14:'LEFT',15:'RIGHT'
});

const AXIS_ACTIONS=Object.freeze({
  0:Object.freeze({negative:'LEFT_STICK_LEFT',positive:'LEFT_STICK_RIGHT'}),
  1:Object.freeze({negative:'LEFT_STICK_UP',positive:'LEFT_STICK_DOWN'}),
  2:Object.freeze({negative:'RIGHT_STICK_LEFT',positive:'RIGHT_STICK_RIGHT'}),
  3:Object.freeze({negative:'RIGHT_STICK_UP',positive:'RIGHT_STICK_DOWN'})
});

/** Read the browser's standard Gamepad layout and return PlayStation control names. */
export function readPs1GamepadInputs(gamepad,{deadzone=0.55}={}){
  if(!gamepad?.connected||gamepad.mapping!=='standard')return [];
  const threshold=Math.min(0.95,Math.max(0.1,Number(deadzone)||0.55));
  const inputs=[];
  for(const [index,name] of Object.entries(BUTTON_ACTIONS)){
    const button=gamepad.buttons?.[Number(index)];
    if(button?.pressed||(button?.value??0)>0.5)inputs.push(name);
  }
  for(const [index,actions] of Object.entries(AXIS_ACTIONS)){
    const value=Number(gamepad.axes?.[Number(index)]??0);
    if(value<=-threshold)inputs.push(actions.negative);
    else if(value>=threshold)inputs.push(actions.positive);
  }
  return [...new Set(inputs)];
}

export const PS1_GAMEPAD_BUTTON_MAP=BUTTON_ACTIONS;
