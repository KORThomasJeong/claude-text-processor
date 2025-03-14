import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * 기본 프롬프트 템플릿 목록
 * 애플리케이션 초기 실행 시 DB에 저장됩니다.
 */
const defaultPrompts = [
  {
    name: '텍스트 요약',
    description: '긴 텍스트를 간결하게 요약합니다.',
    template: `다음 텍스트를 3-5개의 핵심 요점으로 간결하게 요약해주세요:

{{input}}

요약:`,
    category: '텍스트 분석',
    outputFormat: 'text',
    isAdminPrompt: true,
  },
  {
    name: '문법 교정',
    description: '텍스트의 문법, 맞춤법, 구두점 등을 교정합니다.',
    template: `다음 텍스트의 문법, 맞춤법, 구두점 등을 교정해주세요. 원문의 의미와 스타일은 유지하면서 오류만 수정해주세요:

{{input}}

교정된 텍스트:`,
    category: '텍스트 편집',
    outputFormat: 'text',
    isAdminPrompt: true,
  },
  {
    name: '블로그 포스트 생성',
    description: '주제에 대한 블로그 포스트를 생성합니다.',
    template: `다음 주제에 대한 블로그 포스트를 작성해주세요. 제목, 소개, 본문(여러 섹션으로 구성), 결론을 포함해야 합니다:

{{input}}

블로그 포스트:`,
    category: '콘텐츠 생성',
    outputFormat: 'html',
    isAdminPrompt: true,
  },
  {
    name: 'HTML 변환',
    description: '텍스트를 HTML 형식으로 변환합니다.',
    template: `다음 텍스트를 HTML 형식으로 변환해주세요. 적절한 HTML 태그를 사용하여 구조화하고, 필요한 경우 CSS 스타일을 추가해주세요:

{{input}}

HTML:`,
    category: '코드 생성',
    outputFormat: 'html',
    isAdminPrompt: true,
  },
  {
    name: '마크다운 변환',
    description: '텍스트를 마크다운 형식으로 변환합니다.',
    template: `다음 텍스트를 마크다운 형식으로 변환해주세요. 제목, 목록, 강조, 링크 등 적절한 마크다운 문법을 사용해주세요:

{{input}}

마크다운:`,
    category: '텍스트 편집',
    outputFormat: 'text',
    isAdminPrompt: true,
  },
  {
    name: '코드 리팩토링',
    description: '코드를 더 효율적이고 가독성 있게 리팩토링합니다.',
    template: `다음 코드를 리팩토링해주세요. 코드의 가독성, 효율성, 유지보수성을 개선하고, 모범 사례를 따르도록 수정해주세요:

{{input}}

리팩토링된 코드:`,
    category: '코드 생성',
    outputFormat: 'text',
    isAdminPrompt: true,
  },
  {
    name: 'SQL 쿼리 생성',
    description: '자연어 설명을 SQL 쿼리로 변환합니다.',
    template: `다음 요구사항을 SQL 쿼리로 변환해주세요:

{{input}}

SQL 쿼리:`,
    category: '코드 생성',
    outputFormat: 'text',
    isAdminPrompt: true,
  },
  {
    name: '이메일 작성',
    description: '전문적인 이메일을 작성합니다.',
    template: `다음 상황에 맞는 전문적인 이메일을 작성해주세요:

{{input}}

이메일:`,
    category: '콘텐츠 생성',
    outputFormat: 'text',
    isAdminPrompt: true,
  },
  {
    name: '번역 (영어 → 한국어)',
    description: '영어 텍스트를 한국어로 번역합니다.',
    template: `다음 영어 텍스트를 한국어로 번역해주세요. 자연스러운 한국어로 번역하되, 원문의 의미와 뉘앙스를 최대한 유지해주세요:

{{input}}

한국어 번역:`,
    category: '번역',
    outputFormat: 'text',
    isAdminPrompt: true,
  },
  {
    name: '번역 (한국어 → 영어)',
    description: '한국어 텍스트를 영어로 번역합니다.',
    template: `다음 한국어 텍스트를 영어로 번역해주세요. 자연스러운 영어로 번역하되, 원문의 의미와 뉘앙스를 최대한 유지해주세요:

{{input}}

영어 번역:`,
    category: '번역',
    outputFormat: 'text',
    isAdminPrompt: true,
  }
];

/**
 * 기본 프롬프트 초기화 함수
 * 애플리케이션 초기 실행 시 기본 프롬프트를 DB에 저장합니다.
 */
export async function initDefaultPrompts() {
  try {
    console.log('기본 프롬프트 초기화 시작');

    // 관리자 사용자 찾기
    let adminUser = await prisma.user.findFirst({
      where: { role: 'admin' },
    });

    // 관리자 사용자가 없는 경우 시스템 사용자 생성
    if (!adminUser) {
      console.log('관리자 사용자를 찾을 수 없습니다. 시스템 사용자를 생성합니다.');
      
      // 시스템 사용자 생성
      adminUser = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: 'system@example.com',
          password: 'system-password-not-for-login',  // 로그인에 사용되지 않는 임의의 비밀번호
          name: '시스템',
          role: 'admin',
        },
      });
      
      console.log('시스템 사용자가 생성되었습니다.');
    }

    // 이미 존재하는 프롬프트 이름 목록 가져오기
    const existingPrompts = await prisma.prompt.findMany({
      where: { isAdminPrompt: true },
      select: { name: true },
    });
    
    const existingPromptNames = new Set(existingPrompts.map(p => p.name));
    
    console.log('기본 프롬프트 확인 및 생성 중...');
    
    let createdCount = 0;

    // 기본 프롬프트 생성 (이미 존재하지 않는 프롬프트만)
    for (const promptData of defaultPrompts) {
      // 이미 같은 이름의 프롬프트가 있으면 건너뛰기
      if (existingPromptNames.has(promptData.name)) {
        console.log(`프롬프트 "${promptData.name}"은(는) 이미 존재합니다. 건너뜁니다.`);
        continue;
      }
      
      await prisma.prompt.create({
        data: {
          id: uuidv4(),
          name: promptData.name,
          description: promptData.description,
          template: promptData.template,
          category: promptData.category,
          outputFormat: promptData.outputFormat,
          isAdminPrompt: promptData.isAdminPrompt,
          isFavorite: false,
          userId: adminUser.id,
        },
      });
      
      createdCount++;
    }

    if (createdCount > 0) {
      console.log(`${createdCount}개의 새로운 기본 프롬프트가 생성되었습니다.`);
    } else {
      console.log('모든 기본 프롬프트가 이미 존재합니다.');
    }
  } catch (error) {
    console.error('기본 프롬프트 초기화 중 오류가 발생했습니다:', error);
  }
}
