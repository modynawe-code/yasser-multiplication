import { DATA_SCHEMA_VERSION, DEFAULT_SELECTED_TABLES, TABLES } from './constants.js';
import { createLedgerBaseline, normalizeAttemptLog, normalizeLedgerBaseline, summarizeAttemptLedger } from '../shared/data/attempt-ledger.js';

export function createBlankFact(){
  return {attempts:0,correct:0,wrong:0,recent:[],last:null,lastResponseMs:null,responseTimes:[]};
}

export function createBlankTable(){
  const facts={};
  for(let multiplier=1;multiplier<=10;multiplier++) facts[multiplier]=createBlankFact();
  return {attempts:0,correct:0,wrong:0,facts};
}

export function createInitialState(){
  const tables={};
  TABLES.forEach(table=>tables[table]=createBlankTable());
  return {
    schemaVersion:DATA_SCHEMA_VERSION,
    selected:[...DEFAULT_SELECTED_TABLES],
    tables,
    sessions:[],
    attemptLog:[],
    ledgerBaseline:createLedgerBaseline(),
    totalAttempts:0,
    totalCorrect:0,
    totalWrong:0
  };
}

export function normalizeState(candidate){
  const state=candidate && typeof candidate==='object' ? candidate : createInitialState();
  const sourceVersion=Number(state.schemaVersion||0);
  if(!Array.isArray(state.selected)||!state.selected.length) state.selected=[...DEFAULT_SELECTED_TABLES];
  state.selected=[...new Set(state.selected.map(Number).filter(n=>TABLES.includes(n)))].sort((a,b)=>a-b);
  if(!state.selected.length) state.selected=[...DEFAULT_SELECTED_TABLES];
  if(!state.tables||typeof state.tables!=='object') state.tables={};
  TABLES.forEach(table=>{
    if(!state.tables[table]) state.tables[table]=createBlankTable();
    const tableState=state.tables[table];
    tableState.attempts=Number(tableState.attempts||0);tableState.correct=Number(tableState.correct||0);tableState.wrong=Number(tableState.wrong||0);
    if(!tableState.facts||typeof tableState.facts!=='object') tableState.facts={};
    for(let multiplier=1;multiplier<=10;multiplier++){
      if(!tableState.facts[multiplier]) tableState.facts[multiplier]=createBlankFact();
      const fact=tableState.facts[multiplier];
      fact.attempts=Number(fact.attempts||0);fact.correct=Number(fact.correct||0);fact.wrong=Number(fact.wrong||0);
      fact.recent=Array.isArray(fact.recent)?fact.recent.map(Boolean).slice(-5):[];fact.last=fact.last||null;
      fact.lastResponseMs=Number.isFinite(Number(fact.lastResponseMs))?Number(fact.lastResponseMs):null;
      fact.responseTimes=Array.isArray(fact.responseTimes)?fact.responseTimes.map(Number).filter(Number.isFinite).slice(-20):[];
    }
  });
  state.sessions=Array.isArray(state.sessions)?state.sessions:[];
  state.totalAttempts=Number(state.totalAttempts||0);state.totalCorrect=Number(state.totalCorrect||0);state.totalWrong=Number(state.totalWrong||0);
  state.attemptLog=normalizeAttemptLog(state.attemptLog);
  state.ledgerBaseline=normalizeLedgerBaseline(state.ledgerBaseline,sourceVersion<DATA_SCHEMA_VERSION?{
    attempts:state.totalAttempts,
    correct:state.totalCorrect,
    wrong:state.totalWrong
  }:{attempts:0,correct:0,wrong:0});
  const ledgerTotals=summarizeAttemptLedger({baseline:state.ledgerBaseline,attemptLog:state.attemptLog});
  state.totalAttempts=Math.max(state.totalAttempts,ledgerTotals.attempts);
  state.totalCorrect=Math.max(state.totalCorrect,ledgerTotals.correct);
  state.totalWrong=Math.max(state.totalWrong,ledgerTotals.wrong);
  state.schemaVersion=DATA_SCHEMA_VERSION;
  return state;
}
