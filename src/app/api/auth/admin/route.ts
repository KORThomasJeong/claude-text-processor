import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate } from '@/lib/auth';

// 관리자 계정 생성 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // 이메일 필수 체크
    if (!email) {
      return NextResponse.json(
        { message: '이메일은 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // 사용자 조회
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: '해당 이메일의 사용자가 존재하지 않습니다.' },
        { status: 404 }
      );
    }

    // 사용자 역할을 관리자로 변경
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        role: 'admin',
      },
    });

    // 사용자 정보에서 민감한 정보 제외
    const userWithoutSensitiveInfo = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    return NextResponse.json({
      message: '관리자 권한이 부여되었습니다.',
      user: userWithoutSensitiveInfo,
    });
  } catch (error) {
    console.error('관리자 계정 생성 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { message: '관리자 계정 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 관리자 계정 목록 조회 API
export async function GET(request: NextRequest) {
  try {
    // 관리자 계정 목록 조회
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'admin',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      users: adminUsers,
    });
  } catch (error) {
    console.error('관리자 계정 목록 조회 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { message: '관리자 계정 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
