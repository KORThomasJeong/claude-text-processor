import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, isAdmin } from '@/lib/auth';

// GET: 처리 기록 목록 가져오기
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const auth = await authenticate(request);
    if (!auth) {
      console.error('GET /api/results: 인증되지 않은 요청');
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }
    
    console.log('GET /api/results: 인증된 사용자', auth.user.id);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // 조회 조건 설정
    const where: any = {};
    
    // 관리자가 아닌 경우 자신의 기록만 조회 가능
    if (!isAdmin(auth.user)) {
      where.userId = auth.user.id;
    }

    // 처리 기록 조회
    const results = await prisma.result.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
      include: {
        prompt: {
          select: {
            name: true,
            category: true,
            outputFormat: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // 전체 개수 조회
    const total = await prisma.result.count({ where });

    return NextResponse.json({
      results,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('처리 기록 목록을 가져오는 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { error: '처리 기록 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 처리 기록 추가
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const auth = await authenticate(request);
    if (!auth) {
      console.error('POST /api/results: 인증되지 않은 요청');
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }
    
    console.log('POST /api/results: 인증된 사용자', auth.user.id);

    const body = await request.json();
    const { promptId, input, output, format } = body;

    if (!promptId || !input || !output) {
      return NextResponse.json(
        { error: '프롬프트 ID, 입력 텍스트, 출력 결과는 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // 프롬프트 존재 확인 (데이터베이스에 없을 수 있음)
    let dbPromptId = promptId;
    
    try {
      const prompt = await prisma.prompt.findUnique({
        where: { id: promptId },
      });
      
      // 프롬프트가 없는 경우 자동으로 생성
      if (!prompt) {
        console.log('프롬프트가 데이터베이스에 없습니다. 자동으로 생성합니다:', promptId);
        
        // 새로운 프롬프트 생성 (새 ID 사용)
        const newPrompt = await prisma.prompt.create({
          data: {
            name: '자동 생성 프롬프트',
            description: '클라이언트에서 생성된 프롬프트',
            template: '',
            category: '기타',
            outputFormat: format || 'text',
            userId: auth.user.id,
            isFavorite: false,
            isAdminPrompt: false,
          },
        });
        
        // 새로 생성된 프롬프트 ID 사용
        dbPromptId = newPrompt.id;
        console.log('새 프롬프트 ID:', dbPromptId);
      }
    } catch (error) {
      console.error('프롬프트 확인 중 오류가 발생했습니다:', error);
      
      // 오류 발생 시 새 프롬프트 생성 시도
      try {
        const newPrompt = await prisma.prompt.create({
          data: {
            name: '자동 생성 프롬프트',
            description: '클라이언트에서 생성된 프롬프트',
            template: '',
            category: '기타',
            outputFormat: format || 'text',
            userId: auth.user.id,
            isFavorite: false,
            isAdminPrompt: false,
          },
        });
        
        dbPromptId = newPrompt.id;
        console.log('오류 후 새 프롬프트 ID:', dbPromptId);
      } catch (createError) {
        console.error('새 프롬프트 생성 중 오류가 발생했습니다:', createError);
        // 계속 진행 (기존 ID 사용)
      }
    }

    // 처리 기록 생성
    const result = await prisma.result.create({
      data: {
        input,
        output,
        format: format || 'text',
        userId: auth.user.id,
        promptId: dbPromptId,
      },
    });

    return NextResponse.json({
      message: '처리 기록이 저장되었습니다.',
      result,
    });
  } catch (error) {
    console.error('처리 기록 저장 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { error: '처리 기록 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
