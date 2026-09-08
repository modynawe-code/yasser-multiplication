export function isMashaalReleaseReady(gate){
  return Boolean(
    gate?.foundationReady&&
    gate?.hubIntegrated&&
    gate?.parentIntegrated&&
    gate?.backendIntegrated&&
    gate?.regressionsGreen&&
    gate?.contentVerified&&
    gate?.requiredMediaReady
  );
}
