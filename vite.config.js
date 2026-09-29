import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      proxy: {
        '/profile-estate': {
          target: env.API_PROXY_TARGET || 'https://ntestate.ntplc.co.th',
          changeOrigin: true,
        },
      },
    },
  };
});
