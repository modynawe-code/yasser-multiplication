export const DEVELOPMENTAL_STATUS = Object.freeze({
  NOT_STARTED:'not-started',
  DEVELOPING:'developing',
  MASTERED:'mastered'
});

export function normalizeDevelopmentalStatus(value){
  return Object.values(DEVELOPMENTAL_STATUS).includes(value)?value:DEVELOPMENTAL_STATUS.NOT_STARTED;
}
