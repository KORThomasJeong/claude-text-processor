"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, isAuthenticated, token, setUser, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // 인증 상태 초기화
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 로그인/회원가입 페이지에서는 인증 체크 건너뛰기
        if (pathname === "/login" || pathname === "/register") {
          setIsLoading(false);
          return;
        }

        console.log('인증 상태 초기화 시작');

        // 사용자 정보 가져오기 (쿠키에 저장된 토큰 사용)
        const response = await fetch("/api/auth/me", {
          // 캐시 방지
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        console.log('API 응답 상태:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('사용자 정보 가져오기 성공:', data.user);
          setUser(data.user);
          setIsLoading(false);
        } else {
          // 인증 실패 시 로그인 페이지로 리디렉션
          console.log('인증 실패, 로그인 페이지로 리디렉션');
          toast.error("인증이 만료되었습니다. 다시 로그인해주세요.");
          
          // 로컬 상태 초기화
          logout();
          
          // 강제로 페이지 새로고침 (쿠키 삭제를 위해)
          window.location.href = "/login";
          return;
        }
      } catch (error) {
        console.error("인증 초기화 중 오류가 발생했습니다:", error);
        // 오류 발생 시 로그인 페이지로 리디렉션
        window.location.href = "/login";
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [pathname, setUser, logout]);

  // 로딩 중일 때 로딩 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
