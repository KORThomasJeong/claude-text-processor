import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { initAdminUser } from "@/lib/init-admin";
import { initDefaultPrompts } from "@/lib/init-prompts";

// 서버 시작 시 관리자 계정 및 기본 프롬프트 초기화
if (typeof window === 'undefined') {
  initAdminUser().catch(console.error);
  initDefaultPrompts().catch(console.error);
}

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: false
});

export const metadata: Metadata = {
  title: "희희락락의 텍스트 프로세서",
  description: "Claude API를 사용한 텍스트 처리 애플리케이션",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <main className="flex-1 container mx-auto">
                {children}
              </main>
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
