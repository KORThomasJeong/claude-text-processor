// 관리자 계정 생성 스크립트
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // 이메일로 사용자 조회
    const email = process.argv[2];
    if (!email) {
      console.error('이메일을 입력해주세요.');
      console.error('사용법: node scripts/create-admin.js 이메일');
      process.exit(1);
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`이메일 ${email}의 사용자가 존재하지 않습니다.`);
      process.exit(1);
    }

    // 사용자 역할을 관리자로 변경
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        role: 'admin',
      },
    });

    console.log('관리자 권한이 부여되었습니다.');
    console.log('사용자 정보:', {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
    });
  } catch (error) {
    console.error('관리자 계정 생성 중 오류가 발생했습니다:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
