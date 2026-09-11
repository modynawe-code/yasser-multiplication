import { getLearnerProfile } from '../../shared/learners/learner-registry.js';

const REPORT_TYPES=Object.freeze(['academic','developmental','generic']);

export function createFamilyParentReportCapabilityRegistry(){
  const entries=new Map();

  function register(learnerId,{getState,renderReport,renderOverview,listSessions,reportType='generic'}={}){
    const profile=getLearnerProfile(learnerId);
    if(!profile)throw new TypeError('registered learner is required');
    if(typeof getState!=='function')throw new TypeError('parent report capability requires getState');
    if(typeof renderReport!=='function')throw new TypeError('parent report capability requires renderReport');
    if(!REPORT_TYPES.includes(reportType))throw new TypeError('unsupported parent report type');
    const capability=Object.freeze({
      learnerId:profile.id,
      profile,
      reportType,
      getState,
      renderReport,
      renderOverview:typeof renderOverview==='function'?renderOverview:null,
      listSessions:typeof listSessions==='function'?listSessions:null
    });
    entries.set(profile.id,capability);
    return capability;
  }

  function get(learnerId){return entries.get(String(learnerId||''))||null;}
  function list(){return Object.freeze([...entries.values()]);}
  function state(learnerId){const capability=get(learnerId);return capability?capability.getState():null;}
  function exportStates(){return Object.fromEntries(list().map(capability=>[capability.learnerId,capability.getState()]));}
  function overviewEntries(){return Object.freeze(list().map(capability=>Object.freeze({profile:capability.profile,reportType:capability.reportType,markup:capability.renderOverview?.(capability.getState(),capability.profile)||''})));}
  function sessionEntries(){return Object.freeze(list().flatMap(capability=>capability.listSessions?.(capability.getState(),capability.profile)||[]));}

  return Object.freeze({register,get,list,state,exportStates,overviewEntries,sessionEntries});
}
