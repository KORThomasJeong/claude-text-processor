/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint 검사 비활성화
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 타입스크립트 검사 비활성화
  typescript: {
    ignoreBuildErrors: true,
  },
  // WebSocket 연결 비활성화 (개발 모드에서만 적용)
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // 개발 모드에서 HMR 비활성화
      config.watchOptions = {
        ignored: ['**/.git/**', '**/node_modules/**'],
      };
    }
    return config;
  },
  // 외부 폰트 도메인 허용
  images: {
    domains: ['fonts.googleapis.com', 'fonts.gstatic.com'],
  },
  // Docker 배포를 위한 standalone 모드 활성화
  output: 'standalone',
};

module.exports = nextConfig;
