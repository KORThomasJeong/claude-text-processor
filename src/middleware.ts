import { NextRequest, NextResponse } from 'next/server';

// 환경 변수에서 설정 가져오기
const PUBLIC_PATHS = process.env.PUBLIC_PATHS?.split(',') || ['/login', '/register'];
const API_PATH_PREFIX = process.env.API_PATH_PREFIX || '/api';
const COOKIE_NAME = process.env.COOKIE_NAME || 'session-id';
const PENDING_PATH = '/pending-approval';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // 디버깅 로그 추가
  console.log('미들웨어 실행:', path);
  console.log('요청 URL:', request.url);
  
  // API 요청은 미들웨어에서 처리하지 않음 (API 라우트에서 인증 처리)
  if (path.startsWith(API_PATH_PREFIX)) {
    return NextResponse.next();
  }
  
  // 정적 파일 요청은 미들웨어에서 처리하지 않음
  if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
    return NextResponse.next();
  }
  
  // 인증이 필요하지 않은 경로는 통과
  if (PUBLIC_PATHS.some(publicPath => path === publicPath || path.startsWith(`${publicPath}/`))) {
    console.log('공개 경로 통과:', path);
    return NextResponse.next();
  }
  
  // 승인 대기 페이지는 통과
  if (path === PENDING_PATH) {
    console.log('승인 대기 페이지 통과');
    return NextResponse.next();
  }
  
  // 쿠키에서 세션 ID와 사용자 역할 추출
  const sessionId = request.cookies.get(COOKIE_NAME)?.value;
  const userRole = request.cookies.get('user-role')?.value;
  console.log('세션 ID 존재 여부:', !!sessionId);
  console.log('사용자 역할:', userRole);
  
  // 세션 ID가 없는 경우 로그인 페이지로 리디렉션
  if (!sessionId) {
    console.log('세션 ID 없음, 로그인 페이지로 리디렉션');
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', encodeURIComponent(path));
    return NextResponse.redirect(url);
  }
  
  // 승인 대기 상태인 경우 승인 대기 페이지로 리디렉션
  if (userRole === 'pending' && path !== PENDING_PATH) {
    console.log('승인 대기 상태, 승인 대기 페이지로 리디렉션');
    const url = new URL(PENDING_PATH, request.url);
    console.log('리디렉션 URL:', url.toString());
    return NextResponse.redirect(url);
  }
    
  // 세션 ID가 있고 승인된 사용자면 통과
  console.log('인증 성공, 다음 단계로 진행');
  return NextResponse.next();
}

// 미들웨어가 적용될 경로 설정
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
