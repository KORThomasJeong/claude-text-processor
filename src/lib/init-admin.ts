import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

/**
 * 관리자 계정 초기화 함수
 * 환경 변수에 설정된 관리자 계정 정보를 사용하여 관리자 계정을 생성합니다.
 * 이미 존재하는 경우 업데이트합니다.
 */
export async function initAdminUser() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME;

    if (!adminEmail || !adminPassword) {
      console.log('관리자 계정 정보가 환경 변수에 설정되지 않았습니다.');
      return;
    }

    console.log(`관리자 계정 초기화 시작: ${adminEmail}`);

    // 이미 존재하는 관리자 계정 확인
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('관리자 계정이 이미 존재합니다. 역할 업데이트 중...');
      
      // 역할 업데이트
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          role: 'admin',
        },
      });
      
      console.log('관리자 계정 역할이 업데이트되었습니다.');
    } else {
      console.log('관리자 계정 생성 중...');
      
      // 비밀번호 해싱
      const hashedPassword = await hashPassword(adminPassword);
      
      // 관리자 계정 생성
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: adminName || '관리자',
          role: 'admin',
        },
      });
      
      console.log('관리자 계정이 생성되었습니다.');
    }
  } catch (error) {
    console.error('관리자 계정 초기화 중 오류가 발생했습니다:', error);
  }
}
