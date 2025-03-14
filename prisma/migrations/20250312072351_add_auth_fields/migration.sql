-- AlterTable
ALTER TABLE "Prompt" ADD COLUMN     "isAdminPrompt" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
-- 먼저 password 컬럼을 NULL 허용으로 추가
ALTER TABLE "User" ADD COLUMN     "password" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';

-- 기존 사용자에게 기본 비밀번호 설정 (bcrypt로 해싱된 'password123')
UPDATE "User" SET "password" = '$2a$10$yCw.Jj9xJH1gqZYOh5UYxuW8nTWLmKdHoGxQyXpkVNKJzXUUzxluy' WHERE "password" IS NULL;

-- password 컬럼을 NOT NULL로 변경
ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;
