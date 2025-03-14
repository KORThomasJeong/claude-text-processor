import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, isAdmin, hashPassword } from '@/lib/auth';

// GET: 특정 사용자 정보 가져오기 (관리자만 접근 가능)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 인증 확인
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인 또는 자신의 정보인지 확인
    if (!isAdmin(auth.user) && auth.user.id !== params.id) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            prompts: true,
            results: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('사용자 정보를 가져오는 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { error: '사용자 정보를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 사용자 정보 업데이트 (관리자만 접근 가능)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 인증 확인
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인 또는 자신의 정보인지 확인
    const isSelfUpdate = auth.user.id === params.id;
    if (!isAdmin(auth.user) && !isSelfUpdate) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, role } = body;

    // 역할 변경은 관리자만 가능
    if (role && !isAdmin(auth.user)) {
      return NextResponse.json(
        { error: '역할 변경은 관리자만 가능합니다.' },
        { status: 403 }
      );
    }

    // 사용자 존재 확인
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 업데이트할 데이터 준비
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined && isAdmin(auth.user)) updateData.role = role;

    // 사용자 정보 업데이트
    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: '사용자 정보가 업데이트되었습니다.',
      user,
    });
  } catch (error) {
    console.error('사용자 정보 업데이트 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { error: '사용자 정보 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 사용자 삭제 (관리자만 접근 가능)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 인증 확인
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    if (!isAdmin(auth.user)) {
      return NextResponse.json(
        { error: '관리자만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 자기 자신을 삭제하는 것 방지
    if (auth.user.id === params.id) {
      return NextResponse.json(
        { error: '자기 자신을 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 사용자 존재 확인
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 사용자 삭제
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: '사용자가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('사용자 삭제 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { error: '사용자 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH: 사용자 비밀번호 초기화 (관리자만 접근 가능)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 인증 확인
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인 또는 자신의 정보인지 확인
    const isSelfUpdate = auth.user.id === params.id;
    if (!isAdmin(auth.user) && !isSelfUpdate) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { password, currentPassword } = body;

    if (!password) {
      return NextResponse.json(
        { error: '새 비밀번호는 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // 사용자 존재 확인
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password);

    // 사용자 비밀번호 업데이트
    await prisma.user.update({
      where: { id: params.id },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      message: '비밀번호가 초기화되었습니다.',
    });
  } catch (error) {
    console.error('비밀번호 초기화 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { error: '비밀번호 초기화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
