import { APP_PORT, slackApp } from '@/core/slack';

const setSlackBot = async () => {
  await slackApp.start(APP_PORT);
  slackApp.logger.info(`⚡️ 슬랙 봇이 켜졌어요 (포트: ${APP_PORT})`);
};

const setSlackAppReloader = () => {
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
  await setSlackBot();
  setSlackAppReloader();
})();
