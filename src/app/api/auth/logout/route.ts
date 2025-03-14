import { NextRequest, NextResponse } from 'next/server';

// 환경 변수에서 설정 가져오기
const COOKIE_NAME = process.env.COOKIE_NAME || 'session-id';

export async function POST(request: NextRequest) {
  try {
    // 응답 생성
    const response = NextResponse.json({
      message: '로그아웃되었습니다.',
    });
    
    // 세션 쿠키 삭제
    response.cookies.set({
      name: COOKIE_NAME,
      value: '',
      expires: new Date(0), // 즉시 만료
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    // 사용자 역할 쿠키 삭제
    response.cookies.set({
      name: 'user-role',
      value: '',
      expires: new Date(0), // 즉시 만료
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    // 디버깅 로그
    console.log('로그아웃 성공, 세션 쿠키 삭제');
    
    return response;
  } catch (error) {
    console.error('로그아웃 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { message: '로그아웃 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
