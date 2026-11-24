import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';

export default defineConfig({
  plugins: [react(), basicSsl()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // 로컬 와이파이 네트워크(스마트폰) 접속 허용
    proxy: {
      '/api-forest': {
        target: 'https://apis.data.go.kr/1400377/forestPointV2',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api-forest/, ''),
      },
      '/api-kma': {
        target: 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api-kma/, ''),
      },
    },
  },
});
