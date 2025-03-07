export const stage = import.meta.env.VITE_STAGE === 'production' ? 'production' : 'development';

export const assertEnvironmentVariables = () => {
  const assertStage = () => {
    if (!import.meta.env.VITE_STAGE) {
      throw new Error('VITE_STAGE 환경 변수를 설정해주세요.');
    }
    if (stage !== 'development' && stage !== 'production') {
      throw new Error('VITE_STAGE 환경 변수는 development 또는 production 이어야 해요.');
    }
  };

  const assertGCPInstanceIP = () => {
    if (!import.meta.env.VITE_GCP_INSTANCE_IP) {
      throw new Error('VITE_GCP_INSTANCE_IP 환경 변수를 설정해주세요.');
    }
  };

  assertStage();
  assertGCPInstanceIP();
};

const commonConfig = {
  routes: {
    auth: '/auth/slack/callback',
  },
};

export const config = {
  production: {
    port: 3000,
    url: `http://${import.meta.env.VITE_GCP_INSTANCE_IP}:3000`,
    ...commonConfig,
  },
  development: {
    port: 3333,
    url: 'http://localhost:3333',
    ...commonConfig,
  },
}[stage];
