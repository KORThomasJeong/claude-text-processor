import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, isAdmin, isAdminOrOwner } from '@/lib/auth';

// GET: 처리 기록 상세 정보 가져오기
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

    // 처리 기록 조회
    const result = await prisma.result.findUnique({
      where: { id },
      include: {
        prompt: {
          select: {
            id: true,
            name: true,
            category: true,
            outputFormat: true,
            template: true,
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

    if (!result) {
      return NextResponse.json(
        { error: '처리 기록을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인: 관리자이거나 자신의 처리 기록인 경우에만 조회 허용
    if (!isAdminOrOwner(auth.user, result.userId)) {
      return NextResponse.json(
        { error: '이 처리 기록에 접근할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('처리 기록 정보를 가져오는 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { error: '처리 기록 정보를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 처리 기록 삭제
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

    // 처리 기록 조회
    const result = await prisma.result.findUnique({
      where: { id },
    });

    if (!result) {
      return NextResponse.json(
        { error: '처리 기록을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인: 관리자이거나 자신의 처리 기록인 경우에만 삭제 허용
    if (!isAdminOrOwner(auth.user, result.userId)) {
      return NextResponse.json(
        { error: '이 처리 기록을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 처리 기록 삭제
    await prisma.result.delete({
      where: { id },
    });

    return NextResponse.json({
      message: '처리 기록이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('처리 기록 삭제 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { error: '처리 기록 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
