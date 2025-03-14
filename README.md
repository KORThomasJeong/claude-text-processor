# Claude 텍스트 프로세서

Claude API를 기반으로 텍스트를 처리하는 웹 애플리케이션입니다. 사용자는 미리 정의된 프롬프트를 선택하거나 직접 만들어 텍스트를 처리하고, 결과를 HTML 또는 텍스트 형식으로 받을 수 있습니다.

## 주요 기능

- 텍스트 입력 및 프롬프트 처리 (분할 화면 UI)
- 프롬프트 관리 (추가/편집/삭제, 카테고리화, 즐겨찾기)
- API 연결 관리 (Claude 3.7 Sonnet API)
- 라이트/다크 모드 지원
- 처리 결과 히스토리 저장
- 결과 내보내기 (HTML, 텍스트)

## 기술 스택

- **프론트엔드**: Next.js, TypeScript, React
- **스타일링**: Tailwind CSS, shadcn/ui 컴포넌트
- **상태 관리**: Zustand
- **API 통신**: Axios
- **데이터 저장**: LocalStorage
- **컨테이너화**: Docker

## 시작하기

### 개발 환경 설정

1. 저장소 클론:
   ```bash
   git clone https://github.com/yourusername/claude-text-processor.git
   cd claude-text-processor
   ```

2. 의존성 설치:
   ```bash
   npm install
   ```

3. 개발 서버 실행:
   ```bash
   npm run dev
   ```

4. 브라우저에서 `http://localhost:3000` 접속

### Docker로 실행

1. Docker 이미지 빌드:
   ```bash
   docker-compose build
   ```

2. 컨테이너 실행:
   ```bash
   docker-compose up -d
   ```

3. 브라우저에서 `http://localhost:3000` 접속

## API 키 설정

이 애플리케이션을 사용하려면 Anthropic의 Claude API 키가 필요합니다:

1. [Anthropic 콘솔](https://console.anthropic.com/)에서 계정을 만들고 API 키를 발급받습니다.
2. 애플리케이션의 "API 설정" 섹션에서 발급받은 API 키를 입력합니다.

## 프롬프트 관리

- 기본 제공되는 프롬프트 템플릿을 사용하거나 직접 만들 수 있습니다.
- 각 프롬프트는 이름, 설명, 템플릿, 카테고리, 출력 형식(HTML/텍스트)을 가집니다.
- 자주 사용하는 프롬프트는 즐겨찾기로 등록할 수 있습니다.

## 라이선스

MIT
