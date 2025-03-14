import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/db';

// 환경 변수에서 기본 모델 및 최대 토큰 수 가져오기
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'claude-3-7-sonnet-20250219';
const DEFAULT_MAX_TOKENS = parseInt(process.env.DEFAULT_MAX_TOKENS || '4096', 10);

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { input, prompt, model: requestModel, maxTokens: requestMaxTokens } = body;

    // 사용자의 API 설정 가져오기
    const apiConfig = await prisma.apiConfig.findUnique({
      where: { userId: auth.user.id },
    });

    if (!apiConfig || !apiConfig.apiKey) {
      // API 키가 없는 경우 기본 응답 반환
      return NextResponse.json({
        content: [
          {
            type: 'text',
            text: `[데모 모드] API 키가 설정되지 않아 실제 API 호출 없이 기본 응답을 반환합니다.\n\n입력 텍스트: ${input}\n\n프롬프트: ${prompt}\n\n실제 결과를 보려면 설정 페이지에서 API 키를 설정해주세요.`
          }
        ]
      });
    }

    // 요청에서 받은 모델과 최대 토큰 수 또는 사용자 설정 사용
    const model = requestModel || apiConfig.model || DEFAULT_MODEL;
    const maxTokens = requestMaxTokens || apiConfig.maxTokens || DEFAULT_MAX_TOKENS;

    if (!model || !input || !prompt) {
      return NextResponse.json(
        { error: '모델, 입력 텍스트, 프롬프트는 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // Claude API 호출
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt + '\n\n' + input }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiConfig.apiKey,
          'anthropic-version': '2023-06-01',
          'Authorization': `Bearer ${apiConfig.apiKey}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Claude API 호출 중 오류가 발생했습니다:', error);
    
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
      { error: '텍스트 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
