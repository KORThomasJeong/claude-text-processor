import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/db';

// 환경 변수에서 설정 가져오기
const COOKIE_NAME = process.env.COOKIE_NAME || 'session-id';

export async function GET(request: NextRequest) {
  try {
    console.log('사용자 정보 요청 받음');
    
    // authenticate 함수를 사용하여 인증 처리
    const auth = await authenticate(request);
    
    if (!auth) {
      console.log('인증 실패');
      return NextResponse.json(
        { message: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }
    
    console.log('인증 성공:', auth.user.id);
    
    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
    });
    
    if (!user) {
      console.log('사용자 정보 조회 실패');
      return NextResponse.json(
        { message: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    console.log('사용자 정보 조회 성공:', user);
    
    // 인증된 사용자 정보 반환
    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error('사용자 정보 조회 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { message: '사용자 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
