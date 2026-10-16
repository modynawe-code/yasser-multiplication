import { DEVELOPMENTAL_STATUS, normalizeDevelopmentalStatus } from '../../../shared/progress/developmental-status.js';

export function createMashaalSkillProgress(){
  return {status:DEVELOPMENTAL_STATUS.NOT_STARTED,evidenceCount:0,lastEvidenceAt:null};
}

export function normalizeMashaalSkillProgress(candidate){
  const value=candidate&&typeof candidate==='object'?candidate:{};
  return {
    status:normalizeDevelopmentalStatus(value.status),
    evidenceCount:Math.max(0,Number(value.evidenceCount||0)),
    lastEvidenceAt:value.lastEvidenceAt||null
  };
}
