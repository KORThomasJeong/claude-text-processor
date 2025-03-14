// 데이터베이스 초기화 및 관리자 계정 생성 스크립트
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('데이터베이스 초기화 및 관리자 계정 생성을 시작합니다...');

    // 환경 변수에서 관리자 정보 가져오기
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || '관리자';

    // 관리자 계정이 이미 존재하는지 확인
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('관리자 계정이 이미 존재합니다. 업데이트합니다...');
      
      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // 관리자 계정 업데이트
      const updatedAdmin = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
          name: adminName,
          role: 'admin',
        },
      });
      
      console.log('관리자 계정이 업데이트되었습니다:', {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        name: updatedAdmin.name,
        role: updatedAdmin.role,
      });
    } else {
      console.log('관리자 계정을 생성합니다...');
      
      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // 관리자 계정 생성
      const newAdmin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: adminName,
          role: 'admin',
          apiConfig: {
            create: {
              apiKey: 'default-api-key', // 실제 API 키로 변경해야 함
              model: process.env.DEFAULT_MODEL || 'claude-3-7-sonnet-20250219',
              maxTokens: parseInt(process.env.DEFAULT_MAX_TOKENS || '4096'),
            },
          },
        },
        include: {
          apiConfig: true,
        },
      });
      
      console.log('관리자 계정이 생성되었습니다:', {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
      });
    }

    // 기본 프롬프트 생성
    const defaultPrompts = [
      {
        name: '텍스트 요약',
        description: '긴 텍스트를 간결하게 요약합니다.',
        template: '다음 텍스트를 3-5문장으로 요약해주세요:\n\n{input}',
        category: '텍스트 처리',
        outputFormat: 'text',
        isAdminPrompt: true,
      },
      {
        name: '문법 교정',
        description: '텍스트의 문법과 맞춤법을 교정합니다.',
        template: '다음 텍스트의 문법과 맞춤법을 교정해주세요:\n\n{input}',
        category: '텍스트 처리',
        outputFormat: 'text',
        isAdminPrompt: true,
      },
    ];

    // 기본 프롬프트 생성 또는 업데이트
    for (const prompt of defaultPrompts) {
      const existingPrompt = await prisma.prompt.findFirst({
        where: {
          name: prompt.name,
          isAdminPrompt: true,
        },
      });

      if (existingPrompt) {
        console.log(`프롬프트 '${prompt.name}'이(가) 이미 존재합니다. 업데이트합니다...`);
        await prisma.prompt.update({
          where: { id: existingPrompt.id },
          data: prompt,
        });
      } else {
        console.log(`프롬프트 '${prompt.name}'을(를) 생성합니다...`);
        await prisma.prompt.create({
          data: {
            ...prompt,
            userId: (await prisma.user.findUnique({ where: { email: adminEmail } })).id,
          },
        });
      }
    }

    console.log('데이터베이스 초기화 및 관리자 계정 생성이 완료되었습니다.');
  } catch (error) {
    console.error('데이터베이스 초기화 중 오류가 발생했습니다:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
