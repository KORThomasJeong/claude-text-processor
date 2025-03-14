"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    
    try {
      // 직접 API 호출
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '로그인에 실패했습니다.');
      }
      
      const data = await response.json();
      
      // 로컬 상태 업데이트
      useAuthStore.getState().setUser(data.user);
      
      toast.success("로그인에 성공했습니다.");
      
      // 로그인 성공 후 홈페이지로 이동
      console.log('로그인 성공, 홈페이지로 이동');
      
      // 쿠키가 적용될 시간을 주기 위해 약간의 지연 후 이동
      setTimeout(() => {
        try {
          console.log('홈페이지로 이동 실행');
          // 홈페이지로 이동 (미들웨어가 실행되도록)
          window.location.href = '/';
        } catch (error) {
          console.error('페이지 이동 중 오류:', error);
        }
      }, 1000);
    } catch (error) {
      console.error("로그인 중 오류가 발생했습니다:", error);
      toast.error(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">희희락락의 텍스트 프로세서</h1>
        <p className="text-muted-foreground">Claude API를 활용한 강력한 텍스트 처리 도구</p>
      </div>
      
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">로그인</CardTitle>
            <CardDescription className="text-center">
              계정에 로그인하여 텍스트 프로세서를 사용하세요.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  이메일
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="이메일 주소"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    비밀번호
                  </label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-10">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  "로그인"
                )}
              </Button>
              <div className="text-center text-sm">
                계정이 없으신가요?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  회원가입
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
