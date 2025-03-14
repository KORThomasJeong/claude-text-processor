FROM node:20-alpine AS base

# 1. 의존성 설치
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Prisma 생성을 위한 추가 설정
COPY prisma ./prisma
RUN npx prisma generate

# 2. 빌드
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# 3. 프로덕션 이미지
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 정적 파일 및 빌드 결과물 복사
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
