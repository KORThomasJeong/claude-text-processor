import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, isAdmin } from '@/lib/auth';

// 환경 변수에서 기본 모델 및 최대 토큰 수 가져오기
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'claude-3-7-sonnet-20250219';
const DEFAULT_MAX_TOKENS = parseInt(process.env.DEFAULT_MAX_TOKENS || '4096', 10);

// GET: API 설정 가져오기
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // URL에서 userId 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || auth.user.id;

    // 관리자가 아니고 다른 사용자의 API 키를 조회하려는 경우 권한 오류
    if (!isAdmin(auth.user) && userId !== auth.user.id) {
      return NextResponse.json(
        { error: '다른 사용자의 API 키를 조회할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    try {
      // 데이터베이스에서 API 설정 가져오기
      const apiConfig = await prisma.apiConfig.findUnique({
        where: { userId },
      });

      if (!apiConfig) {
        // 설정이 없는 경우 빈 설정 반환 (오류 대신)
        return NextResponse.json({
          apiKey: '',
          model: DEFAULT_MODEL,
          maxTokens: DEFAULT_MAX_TOKENS,
        });
      }

      // 민감한 정보인 API 키는 마스킹 처리하고, hasApiKey 필드 추가
      return NextResponse.json({
        ...apiConfig,
        hasApiKey: true,
        apiKey: apiConfig.apiKey.substring(0, 4) + '...' + apiConfig.apiKey.substring(apiConfig.apiKey.length - 4),
      });
    } catch (dbError) {
      console.error('데이터베이스 연결 오류:', dbError);
      // 데이터베이스 오류 시 기본 설정 반환 (오류 대신)
      return NextResponse.json({
        apiKey: '',
        model: DEFAULT_MODEL,
        maxTokens: DEFAULT_MAX_TOKENS,
      });
    }
  } catch (error) {
    console.error('API 설정을 가져오는 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { error: 'API 설정을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: API 설정 저장 또는 업데이트
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    let { userId, apiKey, model, maxTokens } = body;
    
    // userId가 없으면 현재 인증된 사용자의 ID 사용
    userId = userId || auth.user.id;
    
    // 관리자가 아니고 다른 사용자의 API 키를 설정하려는 경우 권한 오류
    if (!isAdmin(auth.user) && userId !== auth.user.id) {
      return NextResponse.json(
        { error: '다른 사용자의 API 키를 설정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    if (!apiKey || !model) {
      return NextResponse.json(
        { error: 'API 키와 모델은 필수 항목입니다.' },
        { status: 400 }
      );
    }

    try {
      // 사용자 존재 여부 확인
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return NextResponse.json(
          { error: '존재하지 않는 사용자입니다.' },
          { status: 404 }
        );
      }

      // 데이터베이스에 API 설정 저장 또는 업데이트
      const updatedConfig = await prisma.apiConfig.upsert({
        where: { userId },
        update: {
          apiKey,
          model,
          maxTokens: maxTokens || DEFAULT_MAX_TOKENS,
        },
        create: {
          userId,
          apiKey,
          model,
          maxTokens: maxTokens || DEFAULT_MAX_TOKENS,
        },
      });

      console.log('API 설정이 저장되었습니다:', {
        userId,
        model: updatedConfig.model,
        maxTokens: updatedConfig.maxTokens,
      });

      return NextResponse.json({
        success: true,
        message: 'API 설정이 저장되었습니다.',
      });
    } catch (dbError) {
      console.error('데이터베이스 연결 오류:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('API 설정을 저장하는 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { error: 'API 설정을 저장하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
