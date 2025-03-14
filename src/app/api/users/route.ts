import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, isAdmin, hashPassword } from '@/lib/auth';

// GET: 사용자 목록 가져오기 (관리자만 접근 가능)
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    if (!isAdmin(auth.user)) {
      return NextResponse.json(
        { error: '관리자만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // 검색 조건 설정
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // 사용자 목록 조회
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            prompts: true,
            results: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // 전체 개수 조회
    const total = await prisma.user.count({ where });

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('사용자 목록을 가져오는 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { error: '사용자 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 사용자 추가 (관리자만 접근 가능)
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

    // 관리자 권한 확인
    if (!isAdmin(auth.user)) {
      return NextResponse.json(
        { error: '관리자만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호는 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: role || 'user',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: '사용자가 생성되었습니다.',
      user,
    });
  } catch (error) {
    console.error('사용자 생성 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { error: '사용자 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
