"use client";

import { TextProcessor } from "@/components/text-processor";
import { HistoryView } from "@/components/history-view";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, MessageSquare, Settings, LogOut, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 로그아웃 API 호출
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('로그아웃에 실패했습니다.');
      }
      
      // 로컬 상태 초기화
      logout();
      
      toast.success("로그아웃되었습니다.");
      
      // 쿠키가 적용될 시간을 주기 위해 약간의 지연 후 리디렉션
      setTimeout(() => {
        // 강제로 페이지 새로고침 (쿠키 삭제를 위해)
        try {
          console.log('로그아웃 후 리디렉션 실행');
          window.location.replace('/login');
        } catch (error) {
          console.error('리디렉션 중 오류:', error);
          // 오류 발생 시 로그인 페이지로 리디렉션
          window.location.replace('/login');
        }
      }, 1000); // 지연 시간 증가
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
      toast.error('로그아웃 중 오류가 발생했습니다.');
    }
  };
  return (
    <main className="min-h-screen bg-background pb-16 flex flex-col">
      <header className="border-0 w-full z-20 relative">
        <div className="container mx-auto p-3 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors">희희락락의 텍스트 프로세서</h1>
          </Link>
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center mr-2">
                <User className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  {user.name || user.email} ({user.role === 'admin' ? '관리자' : '사용자'})
                </span>
              </div>
            )}
            <Link href="/settings">
              <Button variant="ghost" size="icon" title="API 설정">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" title="로그아웃" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="w-full border-0">
        <Tabs defaultValue="processor" className="container mx-auto py-6 flex-1 h-full">
        <TabsList className="bg-muted text-muted-foreground h-9 items-center justify-center rounded-lg p-1 grid w-full max-w-md mx-auto grid-cols-2 mb-6">
          <TabsTrigger value="processor" className="flex items-center justify-center gap-2">
            <MessageSquare className="h-4 w-4" />
            텍스트 처리
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center justify-center gap-2">
            <History className="h-4 w-4" />
            처리 기록
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="processor" className="h-full">
          <TextProcessor />
        </TabsContent>
        
        <TabsContent value="history" className="h-full">
          <HistoryView />
        </TabsContent>
      </Tabs>
      </div>

      <footer className="bottom-0 w-full z-20">
        <div className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} 희희락락의 텍스트 프로세서 by ThomasJeong
        </div>
      </footer>
    </main>
  );
}
