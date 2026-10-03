import { MASHAAL_RELEASE_EVIDENCE } from './release-evidence-data.js';

export const REQUIRED_PRODUCTION_MIGRATIONS=Object.freeze([
  '0004_open_family_learners.sql',
  '0005_learning_session_payload.sql'
]);

export const REQUIRED_IMMUTABILITY_TRIGGERS=Object.freeze([
  'learner_baselines_no_delete',
  'learner_baselines_no_update',
  'attempts_no_delete',
  'attempts_no_update',
  'learning_evidence_no_delete',
  'learning_evidence_no_update',
  'learning_sessions_no_delete',
  'learning_sessions_no_update'
]);

function nonEmptyString(value){return typeof value==='string'&&value.trim().length>0;}
function validIso(value){return nonEmptyString(value)&&Number.isFinite(Date.parse(value));}
function containsAll(values,required){const set=new Set(Array.isArray(values)?values:[]);return required.every(value=>set.has(value));}
function passedOrientation(value){return value?.status==='passed'&&nonEmptyString(value?.viewport)&&Array.isArray(value?.evidenceRefs)&&value.evidenceRefs.some(nonEmptyString);}

export function isMashaalManualVisualQaEvidenceComplete(evidence){
  return Boolean(
    evidence?.status==='passed'&&
    evidence?.actualDevice===true&&
    nonEmptyString(evidence?.deviceModel)&&
    nonEmptyString(evidence?.androidVersion)&&
    nonEmptyString(evidence?.browserMode)&&
    nonEmptyString(evidence?.browserVersion)&&
    validIso(evidence?.testedAt)&&
    passedOrientation(evidence?.landscape)&&
    passedOrientation(evidence?.portrait)&&
    evidence?.orientationChangePassed===true&&
    evidence?.offlineSmokePassed===true
  );
}

export function isMashaalProductionD1EvidenceComplete(evidence){
  return Boolean(
    evidence?.status==='applied'&&
    evidence?.databaseName==='yasser-khaled-family'&&
    validIso(evidence?.appliedAt)&&
    containsAll(evidence?.appliedMigrations,REQUIRED_PRODUCTION_MIGRATIONS)&&
    nonEmptyString(evidence?.d1Bookmark)&&
    nonEmptyString(evidence?.backupRef)&&
    evidence?.prePostRowCountsVerified===true&&
    containsAll(evidence?.verifiedTriggers,REQUIRED_IMMUTABILITY_TRIGGERS)
  );
}

export function getMashaalOperationalReleaseEvidenceStatus(evidence=MASHAAL_RELEASE_EVIDENCE){
  return Object.freeze({
    manualVisualQaPassed:isMashaalManualVisualQaEvidenceComplete(evidence?.manualVisualQa),
    productionD1Applied:isMashaalProductionD1EvidenceComplete(evidence?.productionD1)
  });
}
