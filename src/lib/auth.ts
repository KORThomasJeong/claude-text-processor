import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { compare, hash } from 'bcryptjs';
import { cookies } from 'next/headers';

// 환경 변수에서 설정 가져오기
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';
const COOKIE_NAME = process.env.COOKIE_NAME || 'session-id';
const SESSION_EXPIRY = parseInt(process.env.SESSION_EXPIRY || '604800', 10); // 기본값 7일 (초 단위)

// 사용자 타입 정의
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin' | 'pending';
}

// 인증 결과 타입 정의
export interface AuthResult {
  user: AuthUser;
  sessionId: string;
}

// 비밀번호 해싱
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

// 비밀번호 검증
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

// 세션 ID 생성
export function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// 요청에서 세션 ID 추출
export function extractSessionIdFromRequest(request: NextRequest): string | null {
  // 쿠키에서 세션 ID 추출
  const sessionId = request.cookies.get(COOKIE_NAME)?.value;
  if (sessionId) {
    return sessionId;
  }
  
  return null;
}

// 요청 인증 처리
export async function authenticate(
  request: NextRequest
): Promise<AuthResult | null> {
  const sessionId = extractSessionIdFromRequest(request);
  if (!sessionId) {
    console.log('인증 실패: 세션 ID 없음');
    return null;
  }
  
  console.log('세션 ID 확인:', sessionId);

  try {
    // 세션 ID로 사용자 찾기 (실제로는 세션 테이블을 만들어 사용해야 함)
    // 임시로 세션 ID에서 사용자 ID 추출 (실제 구현에서는 세션 테이블 사용)
    const userId = sessionId.split('_')[0];
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
    }) as any; // 타입 단언 사용

    if (!user) {
      return null;
    }

    // 사용자 정보 반환
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user', // role이 없는 경우 기본값 'user' 사용
    };

    return {
      user: authUser,
      sessionId,
    };
  } catch (error) {
    console.error('사용자 인증 중 오류가 발생했습니다:', error);
    return null;
  }
}

// 관리자 권한 확인
export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin';
}

// 관리자 또는 소유자 권한 확인
export function isAdminOrOwner(user: AuthUser | null, resourceOwnerId: string): boolean {
  if (!user) {
    return false;
  }
  
  return user.role === 'admin' || user.id === resourceOwnerId;
}
