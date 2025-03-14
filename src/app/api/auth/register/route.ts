import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, generateSessionId } from '@/lib/auth';

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
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: '이메일과 비밀번호는 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: '이미 사용 중인 이메일입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: 'pending', // 기본 역할은 'pending' (승인 대기)
      } as any,
    }) as unknown as UserWithAuth;

    // 응답에서 비밀번호 제외
    const { password: _, ...userWithoutPassword } = user;

    // 회원가입 성공 응답 (세션 쿠키 설정하지 않음)
    const response = NextResponse.json({
      message: '회원가입에 성공했습니다. 관리자 승인 후 로그인할 수 있습니다.',
      success: true,
    });
    
    // 디버깅 로그
    console.log('회원가입 성공:', user.id);
    
    return response;
  } catch (error) {
    console.error('회원가입 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { message: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
