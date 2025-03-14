import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, generateSessionId } from '@/lib/auth';

// 환경 변수에서 설정 가져오기
const COOKIE_NAME = process.env.COOKIE_NAME || 'session-id';
const SESSION_EXPIRY = parseInt(process.env.SESSION_EXPIRY || '604800', 10); // 기본값 7일 (초 단위)

// User 타입 정의
interface UserWithAuth {
  id: string;
  email: string;
  name: string | null;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: '이메일과 비밀번호는 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
    }) as unknown as UserWithAuth;

    if (!user) {
      return NextResponse.json(
        { message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 검증
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 세션 ID 생성 (사용자 ID를 포함하여 나중에 추출할 수 있도록)
    const sessionId = `${user.id}_${generateSessionId()}`;

    // 응답에서 비밀번호 제외
    const { password: _, ...userWithoutPassword } = user;

    // 쿠키에 세션 ID 저장
    const response = NextResponse.json({
      message: '로그인에 성공했습니다.',
      user: userWithoutPassword,
    });
    
    // 세션 쿠키 설정
    response.cookies.set({
      name: COOKIE_NAME,
      value: sessionId,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_EXPIRY,
      path: '/',
      sameSite: 'lax',
    });
    
    // 사용자 역할 쿠키 설정 (미들웨어에서 사용)
    response.cookies.set({
      name: 'user-role',
      value: user.role,
      httpOnly: false, // 클라이언트에서 접근 가능
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_EXPIRY,
      path: '/',
      sameSite: 'lax',
    });
    
    // 디버깅 로그
    console.log('로그인 성공, 세션 ID 생성:', sessionId);
    
    return response;
  } catch (error) {
    console.error('로그인 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { message: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
