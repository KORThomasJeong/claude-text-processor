"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PendingApprovalPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  
  // 이미 승인된 사용자는 홈으로 리디렉션
  useEffect(() => {
    if (isAuthenticated && user && user.role !== 'pending') {
      router.push("/");
    }
  }, [user, isAuthenticated, router]);
  
  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };
  
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">승인 대기 중</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto py-12">
        <div className="max-w-2xl mx-auto">
          <div className="p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Clock className="h-20 w-20 text-yellow-500 dark:text-yellow-400" />
                <div className="absolute -top-2 -right-2 bg-yellow-200 dark:bg-yellow-700 rounded-full p-2">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
                </div>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">서비스 이용을 위해서는 승인이 필요합니다</h2>
            
            <p className="mb-6 text-lg">
              회원가입이 완료되었지만, 서비스를 이용하기 위해서는 관리자의 승인이 필요합니다.
              승인이 완료되면 서비스를 이용하실 수 있습니다.
            </p>
            
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium mb-2">승인 절차</h3>
                <p className="text-sm text-muted-foreground">
                  관리자가 회원 정보를 확인한 후 승인 처리를 진행합니다.
                  <p>승인 소요 시간은 영업일 기준 1-2일 정도 소요될 수 있습니다.</p>
                </p>
              </div>
              
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium mb-2">문의 안내</h3>
                <p className="text-sm text-muted-foreground">
                  승인 관련 문의사항은 관리자에게 문의해 주세요.
                  <br />
                  이메일: heerak@gmail.com
                </p>
              </div>
            </div>
            
            <div className="mt-8">
              <Button onClick={handleLogout} variant="outline">로그아웃</Button>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t mt-12">
        <div className="container mx-auto p-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Claude 텍스트 프로세서 | Anthropic Claude 3.7 Sonnet API 기반
        </div>
      </footer>
    </main>
  );
}
