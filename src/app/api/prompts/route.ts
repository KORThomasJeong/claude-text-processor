import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, isAdmin, isAdminOrOwner } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET: 프롬프트 목록 가져오기
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

    const { searchParams } = new URL(request.url);
    const adminOnly = searchParams.get('adminOnly') === 'true';
    
    // 관리자 프롬프트만 요청한 경우 관리자 권한 확인
    if (adminOnly && !isAdmin(auth.user)) {
      return NextResponse.json(
        { error: '관리자 프롬프트 조회 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 프롬프트 조회 조건 설정
    const where: any = {};
    
    // 관리자인 경우
    if (isAdmin(auth.user)) {
      if (adminOnly) {
        // 관리자 프롬프트만 조회
        where.isAdminPrompt = true;
      }
      // 관리자는 모든 프롬프트 조회 가능
    } else {
      // 일반 사용자는 자신의 프롬프트와 관리자 프롬프트만 조회 가능
      where.OR = [
        { userId: auth.user.id },
        { isAdminPrompt: true }
      ];
    }

    // 프롬프트 조회
    const prompts = await prisma.prompt.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(prompts);
  } catch (error) {
    console.error('프롬프트 목록을 가져오는 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { error: '프롬프트 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 프롬프트 추가
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
    const { name, description, template, category, outputFormat, isAdminPrompt } = body;

    if (!name || !template) {
      return NextResponse.json(
        { error: '이름과 템플릿은 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // 관리자 프롬프트 생성 시 권한 확인
    if (isAdminPrompt && !isAdmin(auth.user)) {
      return NextResponse.json(
        { error: '관리자 프롬프트 생성 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 프롬프트 생성
    const prompt = await prisma.prompt.create({
      data: {
        id: uuidv4(),
        name,
        description: description || null,
        template,
        category: category || '일반',
        outputFormat: outputFormat || 'text',
        isAdminPrompt: isAdminPrompt && isAdmin(auth.user) ? true : false,
        isFavorite: false,
        userId: auth.user.id,
      } as any,
    });

    return NextResponse.json({
      message: '프롬프트가 추가되었습니다.',
      prompt,
    });
  } catch (error) {
    console.error('프롬프트 추가 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { error: '프롬프트 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
