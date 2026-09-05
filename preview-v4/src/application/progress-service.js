import { TABLES } from '../domain/constants.js';
import { getTableAccuracy, getTableMastery } from '../domain/mastery.js';
export function getProgressRows(state){return TABLES.map(table=>({table,attempts:state.tables[table].attempts,wrong:state.tables[table].wrong,accuracy:getTableAccuracy(state,table),mastery:getTableMastery(state,table)}));}
export function getOverallProgress(state){const accuracy=state.totalAttempts?Math.round((state.totalCorrect/state.totalAttempts)*100):0,masteredTables=TABLES.filter(table=>getTableMastery(state,table)>=80).length;return{attempts:state.totalAttempts,correct:state.totalCorrect,wrong:state.totalWrong,accuracy,masteredTables};}
