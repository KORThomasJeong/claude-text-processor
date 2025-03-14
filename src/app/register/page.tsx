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

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast.error("모든 필수 항목을 입력해주세요.");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }
    
    try {
      // 직접 API 호출
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '회원가입에 실패했습니다.');
      }
      
      const data = await response.json();
      
      // 성공 메시지 표시
      toast.success(data.message || "회원가입에 성공했습니다. 관리자 승인 후 로그인할 수 있습니다.");
      
      // 잠시 후 로그인 페이지로 리디렉션
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error("회원가입 중 오류가 발생했습니다:", error);
      toast.error(error instanceof Error ? error.message : "회원가입에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">회원가입</CardTitle>
            <CardDescription className="text-center">
              새 계정을 만들어 텍스트 프로세서를 사용하세요.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
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
                <label htmlFor="name" className="text-sm font-medium">
                  이름 (선택사항)
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="이름"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  비밀번호
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  비밀번호 확인
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="비밀번호 확인"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-10">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    회원가입 중...
                  </>
                ) : (
                  "회원가입"
                )}
              </Button>
              <div className="text-center text-sm">
                이미 계정이 있으신가요?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  로그인
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
