import test from 'node:test';
import assert from 'node:assert/strict';
import { readPs1GamepadInputs,PS1_GAMEPAD_BUTTON_MAP } from '../src/modules/games/ps1/ps1-gamepad.js';

test('PS1 profile maps standard face, shoulder, menu, and D-pad buttons',()=>{
  const buttons=Array.from({length:16},()=>({pressed:false,value:0}));
  for(const index of [0,2,4,7,8,9,12,15])buttons[index]={pressed:true,value:1};
  const pad={connected:true,mapping:'standard',buttons,axes:[0,0,0,0]};
  assert.deepEqual(readPs1GamepadInputs(pad),['CROSS','SQUARE','L1','R2','SELECT','START','UP','RIGHT']);
  assert.equal(PS1_GAMEPAD_BUTTON_MAP[0],'CROSS');
  assert.equal(PS1_GAMEPAD_BUTTON_MAP[1],'CIRCLE');
});

test('PS1 profile reads both analog sticks and ignores small drift',()=>{
  const pad={connected:true,mapping:'standard',buttons:[],axes:[-0.8,0.2,0.7,-0.9]};
  assert.deepEqual(readPs1GamepadInputs(pad),['LEFT_STICK_LEFT','RIGHT_STICK_RIGHT','RIGHT_STICK_UP']);
});

test('PS1 profile refuses disconnected or nonstandard layouts',()=>{
  const pad={connected:true,mapping:'',buttons:[{pressed:true}],axes:[]};
  assert.deepEqual(readPs1GamepadInputs(pad),[]);
  assert.deepEqual(readPs1GamepadInputs({...pad,connected:false,mapping:'standard'}),[]);
});
