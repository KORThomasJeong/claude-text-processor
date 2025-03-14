"use client";

import { ApiKeyInput } from "@/components/api-key-input";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  // 인증되지 않은 경우 접근 제한
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("로그인이 필요합니다.");
      router.push("/login");
    }
  }, [isAuthenticated, router]);
  
  // 인증되지 않은 경우 로딩 표시
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </main>
    );
  }

  // 승인 대기 상태인 경우 접근 제한
  if (user && user.role === 'pending') {
    return (
      <main className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">API 설정</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="container mx-auto py-8">
          <div className="max-w-2xl mx-auto">
            <div className="p-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-center">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-yellow-600 dark:text-yellow-400" />
              <h2 className="text-xl font-bold mb-2">접근 권한이 없습니다</h2>
              <p className="mb-4">승인 대기 상태에서는 API 키 설정을 사용할 수 없습니다. 관리자 승인 후 이용해주세요.</p>
              <Link href="/">
                <Button>홈으로 돌아가기</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">API 설정</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Claude API 설정</h2>
            <p className="text-muted-foreground mb-4">
              Claude API를 사용하기 위한 설정을 관리합니다. API 키는 데이터베이스에 안전하게 저장됩니다.
            </p>
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg mb-6">
              <h3 className="font-medium mb-2">API 키 보안 안내</h3>
              <p className="text-sm">
                API 키는 서버에 안전하게 저장됩니다. 다른 사용자는 귀하의 API 키에 접근할 수 없습니다.
                API 키는 Claude API 호출에만 사용되며, 다른 용도로 사용되지 않습니다.
              </p>
            </div>
          </div>
          
          <ApiKeyInput />
          
          {/* 관리자 기능 (관리자만 표시) */}
          {user && user.role === 'admin' && (
            <div className="mt-8 mb-8">
              <h2 className="text-xl font-semibold mb-4">관리자 기능</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/admin/users" className="h-full">
                  <div className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer h-full flex flex-col">
                    <h3 className="font-medium mb-2">사용자 관리</h3>
                    <p className="text-sm text-muted-foreground flex-grow">
                      사용자 계정을 관리하고, 역할을 변경하거나 비밀번호를 초기화합니다.
                    </p>
                  </div>
                </Link>
                <Link href="/" className="h-full">
                  <div className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer h-full flex flex-col">
                    <h3 className="font-medium mb-2">프롬프트 관리</h3>
                    <p className="text-sm text-muted-foreground flex-grow">
                      관리자 프롬프트를 생성하고 관리합니다. 모든 사용자가 사용할 수 있는 공통 프롬프트를 설정합니다.
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          )}
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-2">API 연결 문제 해결</h2>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">API 키가 올바르게 입력되었는지 확인</h3>
                <p className="text-sm text-muted-foreground">
                  API 키를 정확하게 복사하여 붙여넣었는지 확인하세요. 앞뒤 공백이 없어야 합니다.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">API 키 권한 확인</h3>
                <p className="text-sm text-muted-foreground">
                  Anthropic 대시보드에서 API 키가 활성화되어 있고 적절한 권한이 있는지 확인하세요.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">네트워크 연결 확인</h3>
                <p className="text-sm text-muted-foreground">
                  인터넷 연결이 안정적인지 확인하세요. 방화벽이나 프록시 설정이 API 호출을 차단하고 있을 수 있습니다.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">모델 가용성 확인</h3>
                <p className="text-sm text-muted-foreground">
                  선택한 Claude 모델이 현재 사용 가능한지 확인하세요. 모델 이름이 변경되었거나 
                  더 이상 지원되지 않을 수 있습니다.
                </p>
              </div>
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
