import { createLocalStorageRepository } from './infrastructure/storage/local-storage-repository.js';
import { createAppController } from './ui/app-controller.js';
import { registerServiceWorker } from './platform/pwa/register-service-worker.js';
const repository=createLocalStorageRepository();
const app=createAppController({repository});
app.start();
registerServiceWorker();
