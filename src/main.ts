import { App } from '@/core/app';

(async () => {
  await App.start(3000);
  App.logger.info('⚡️ Bolt app is running!');
})();
