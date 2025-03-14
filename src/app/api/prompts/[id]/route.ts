import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, isAdmin, isAdminOrOwner } from '@/lib/auth';

// Prompt 타입 정의
interface PromptWithAdmin {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  template: string;
  category: string;
  outputFormat: string;
  isFavorite: boolean;
  isAdminPrompt: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// GET: 프롬프트 상세 정보 가져오기
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // 인증 확인
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 프롬프트 조회
    const prompt = await prisma.prompt.findUnique({
      where: { id },
    }) as unknown as PromptWithAdmin;

    if (!prompt) {
      return NextResponse.json(
        { error: '프롬프트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 관리자 프롬프트인 경우 또는 자신의 프롬프트인 경우에만 접근 허용
    if (prompt.isAdminPrompt && !isAdmin(auth.user) && prompt.userId !== auth.user.id) {
      return NextResponse.json(
        { error: '이 프롬프트에 접근할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    return NextResponse.json(prompt);
  } catch (error) {
    console.error('프롬프트 정보를 가져오는 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { error: '프롬프트 정보를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 프롬프트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // 인증 확인
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 프롬프트 조회
    const existingPrompt = await prisma.prompt.findUnique({
      where: { id },
    }) as unknown as PromptWithAdmin;

    if (!existingPrompt) {
      return NextResponse.json(
        { error: '프롬프트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인: 관리자이거나 자신의 프롬프트인 경우에만 수정 허용
    if (!isAdminOrOwner(auth.user, existingPrompt.userId)) {
      return NextResponse.json(
        { error: '이 프롬프트를 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, template, category, outputFormat, isAdminPrompt, isFavorite } = body;

    if (!name || !template) {
      return NextResponse.json(
        { error: '이름과 템플릿은 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // 관리자 프롬프트로 변경하려는 경우 권한 확인
    if (isAdminPrompt && !existingPrompt.isAdminPrompt && !isAdmin(auth.user)) {
      return NextResponse.json(
        { error: '관리자 프롬프트로 변경할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 프롬프트 수정
    const updatedPrompt = await prisma.prompt.update({
      where: { id },
      data: {
        name,
        description: description || null,
        template,
        category: category || '일반',
        outputFormat: outputFormat || 'text',
        isAdminPrompt: isAdmin(auth.user) ? isAdminPrompt : existingPrompt.isAdminPrompt,
        isFavorite: isFavorite !== undefined ? isFavorite : existingPrompt.isFavorite,
      } as any,
    });

    return NextResponse.json({
      message: '프롬프트가 수정되었습니다.',
      prompt: updatedPrompt,
    });
  } catch (error) {
    console.error('프롬프트 수정 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { error: '프롬프트 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 프롬프트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // 인증 확인
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 프롬프트 조회
    const existingPrompt = await prisma.prompt.findUnique({
      where: { id },
    }) as unknown as PromptWithAdmin;

    if (!existingPrompt) {
      return NextResponse.json(
        { error: '프롬프트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인: 관리자이거나 자신의 프롬프트인 경우에만 삭제 허용
    if (!isAdminOrOwner(auth.user, existingPrompt.userId)) {
      return NextResponse.json(
        { error: '이 프롬프트를 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 프롬프트 삭제
    await prisma.prompt.delete({
      where: { id },
    });

    return NextResponse.json({
      message: '프롬프트가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('프롬프트 삭제 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { error: '프롬프트 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
