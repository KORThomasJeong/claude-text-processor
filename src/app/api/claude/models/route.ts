import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/db';

// 환경 변수에서 기본 모델 가져오기
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'claude-3-7-sonnet-20250219';

export async function GET(request: NextRequest) {
  try {
    // URL에서 apiKey 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const apiKeyParam = searchParams.get('apiKey');
    let apiKey = apiKeyParam;

    // URL 파라미터로 API 키를 받지 않은 경우, 인증된 사용자의 API 키 사용
    if (!apiKey) {
      // 인증 확인
      const auth = await authenticate(request);
      if (!auth) {
        return NextResponse.json(
          { error: '인증되지 않은 요청입니다.' },
          { status: 401 }
        );
      }

      // 사용자의 API 설정 가져오기
      const apiConfig = await prisma.apiConfig.findUnique({
        where: { userId: auth.user.id },
      });

      if (!apiConfig || !apiConfig.apiKey) {
        // API 키가 없는 경우 기본 모델 목록 반환
        return NextResponse.json({
          data: [
            {
              id: DEFAULT_MODEL,
              display_name: 'Claude 3.7 Sonnet (기본)',
              created_at: '2025-02-19',
            },
            {
              id: 'claude-3-5-sonnet-20240620',
              display_name: 'Claude 3.5 Sonnet',
              created_at: '2024-06-20',
            }
          ]
        });
      }

      apiKey = apiConfig.apiKey;
    }

    // Claude API 호출
    const response = await axios.get(
      'https://api.anthropic.com/v1/models',
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Claude API 모델 목록 호출 중 오류가 발생했습니다:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        return NextResponse.json(
          { error: `API 오류 (${error.response.status}): ${error.response.data.error?.message || JSON.stringify(error.response.data)}` },
          { status: error.response.status }
        );
      } else if (error.request) {
        return NextResponse.json(
          { error: 'API 서버에서 응답이 없습니다. 네트워크 연결을 확인하세요.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: '모델 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
