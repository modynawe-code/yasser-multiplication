import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_RELEASE_EVIDENCE } from '../src/modules/mashaal/release-evidence-data.js';
import {
  REQUIRED_IMMUTABILITY_TRIGGERS,
  REQUIRED_PRODUCTION_MIGRATIONS,
  getMashaalOperationalReleaseEvidenceStatus,
  isMashaalManualVisualQaEvidenceComplete,
  isMashaalProductionD1EvidenceComplete
} from '../src/modules/mashaal/release-evidence.js';

const validVisualQa=()=>({
  status:'passed',
  actualDevice:true,
  deviceModel:'Samsung Galaxy Tab',
  androidVersion:'Android 16',
  browserMode:'installed-pwa',
  browserVersion:'Chrome 140',
  testedAt:'2026-09-08T13:30:00.000Z',
  landscape:{status:'passed',viewport:'1280x800',evidenceRefs:['qa://landscape']},
  portrait:{status:'passed',viewport:'800x1280',evidenceRefs:['qa://portrait']},
  orientationChangePassed:true,
  offlineSmokePassed:true
});

const validD1=()=>({
  status:'applied',
  databaseName:'yasser-khaled-family',
  appliedAt:'2026-09-08T13:35:00.000Z',
  appliedMigrations:[...REQUIRED_PRODUCTION_MIGRATIONS],
  d1Bookmark:'bookmark-before-migrations',
  backupRef:'family-d1-before-migrations.sql',
  prePostRowCountsVerified:true,
  verifiedTriggers:[...REQUIRED_IMMUTABILITY_TRIGGERS]
});

test('committed operational evidence remains pending until real release work is performed',()=>{
  assert.equal(MASHAAL_RELEASE_EVIDENCE.manualVisualQa.status,'pending');
  assert.equal(MASHAAL_RELEASE_EVIDENCE.productionD1.status,'pending');
  assert.deepEqual(getMashaalOperationalReleaseEvidenceStatus(),{
    manualVisualQaPassed:false,
    productionD1Applied:false
  });
});

test('manual Galaxy Tab evidence requires a real device, both orientations, rotation and offline smoke evidence',()=>{
  assert.equal(isMashaalManualVisualQaEvidenceComplete(validVisualQa()),true);
  assert.equal(isMashaalManualVisualQaEvidenceComplete({...validVisualQa(),actualDevice:false}),false);
  assert.equal(isMashaalManualVisualQaEvidenceComplete({...validVisualQa(),portrait:{status:'pending',viewport:null,evidenceRefs:[]}}),false);
  assert.equal(isMashaalManualVisualQaEvidenceComplete({...validVisualQa(),orientationChangePassed:false}),false);
  assert.equal(isMashaalManualVisualQaEvidenceComplete({...validVisualQa(),offlineSmokePassed:false}),false);
  assert.equal(isMashaalManualVisualQaEvidenceComplete({status:'passed'}),false);
});

test('production D1 evidence requires exact database, migrations, backup/bookmark, row verification and all immutable triggers',()=>{
  assert.equal(isMashaalProductionD1EvidenceComplete(validD1()),true);
  assert.equal(isMashaalProductionD1EvidenceComplete({...validD1(),databaseName:'wrong-database'}),false);
  assert.equal(isMashaalProductionD1EvidenceComplete({...validD1(),appliedMigrations:['0004_open_family_learners.sql']}),false);
  assert.equal(isMashaalProductionD1EvidenceComplete({...validD1(),d1Bookmark:null}),false);
  assert.equal(isMashaalProductionD1EvidenceComplete({...validD1(),backupRef:null}),false);
  assert.equal(isMashaalProductionD1EvidenceComplete({...validD1(),prePostRowCountsVerified:false}),false);
  assert.equal(isMashaalProductionD1EvidenceComplete({...validD1(),verifiedTriggers:REQUIRED_IMMUTABILITY_TRIGGERS.slice(0,-1)}),false);
  assert.equal(isMashaalProductionD1EvidenceComplete({status:'applied'}),false);
});

test('validated operational evidence status opens each gate only from its own complete evidence',()=>{
  assert.deepEqual(getMashaalOperationalReleaseEvidenceStatus({manualVisualQa:validVisualQa(),productionD1:{status:'pending'}}),{
    manualVisualQaPassed:true,
    productionD1Applied:false
  });
  assert.deepEqual(getMashaalOperationalReleaseEvidenceStatus({manualVisualQa:{status:'pending'},productionD1:validD1()}),{
    manualVisualQaPassed:false,
    productionD1Applied:true
  });
});
