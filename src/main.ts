import { assertEnvironmentVariables, config, stage } from '@/config';
import { slackApp } from '@/core/slack';

const startSlackBot = async () => {
  const stageMessage = stage === 'production' ? '[프로덕션]' : '[개발]';

  await slackApp.start(config.port);
  slackApp.logger.info(`⚡️ [${stageMessage}] 슬랙 봇이 켜졌어요 (포트: ${config.port})`);
};

const setSlackBotReloader = () => {
  if (!import.meta.hot) {
    return;
  }

  import.meta.hot.on('vite:beforeFullReload', () => {
    slackApp.stop();
  });

  import.meta.hot.dispose(() => {
    slackApp.stop();
  });
};

(async () => {
  assertEnvironmentVariables();

  await startSlackBot();
  setSlackBotReloader();
})();
