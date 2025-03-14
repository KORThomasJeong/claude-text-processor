# Docker를 이용한 Claude Text Processor 배포 가이드

이 문서는 Claude Text Processor 애플리케이션을 Docker를 사용하여 배포하는 방법을 설명합니다.

## 사전 요구 사항

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## 배포 방법

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd claude-text-processor
```

### 2. 환경 변수 설정 (선택 사항)

기본적으로 docker-compose.yml 파일에 환경 변수가 설정되어 있습니다. 필요한 경우 docker-compose.yml 파일을 수정하여 환경 변수를 변경할 수 있습니다.

주요 환경 변수:
- `DATABASE_URL`: PostgreSQL 데이터베이스 연결 문자열
- `SESSION_SECRET`: 세션 암호화 키 (프로덕션 환경에서는 반드시 변경해야 함)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`: 관리자 계정 정보

### 3. Docker 이미지 빌드 및 컨테이너 실행

```bash
docker-compose up -d
```

이 명령은 다음 작업을 수행합니다:
1. PostgreSQL 데이터베이스 컨테이너 실행
2. 애플리케이션 이미지 빌드 및 컨테이너 실행
3. 데이터베이스 마이그레이션 및 초기 설정 실행

### 4. 애플리케이션 접속

브라우저에서 `http://localhost:3000`으로 접속하여 애플리케이션을 사용할 수 있습니다.

기본 관리자 계정:
- 이메일: admin@example.com
- 비밀번호: admin123

**중요**: 프로덕션 환경에서는 반드시 관리자 계정 정보를 변경해야 합니다.

## 컨테이너 관리

### 컨테이너 상태 확인

```bash
docker-compose ps
```

### 로그 확인

```bash
# 모든 컨테이너의 로그 확인
docker-compose logs

# 특정 서비스의 로그 확인
docker-compose logs app
docker-compose logs postgres
```

### 컨테이너 중지

```bash
docker-compose stop
```

### 컨테이너 재시작

```bash
docker-compose restart
```

### 컨테이너 삭제 (데이터 유지)

```bash
docker-compose down
```

### 컨테이너 및 볼륨 삭제 (데이터 삭제)

```bash
docker-compose down -v
```

## 데이터베이스 백업 및 복원

### 데이터베이스 백업

```bash
docker exec claude-text-processor-db pg_dump -U claude claude_text_processor > backup.sql
```

### 데이터베이스 복원

```bash
cat backup.sql | docker exec -i claude-text-processor-db psql -U claude claude_text_processor
```

## 프로덕션 환경 설정

프로덕션 환경에서는 다음 사항을 고려해야 합니다:

1. 보안 강화
   - `SESSION_SECRET` 환경 변수를 강력한 무작위 문자열로 변경
   - 관리자 계정 비밀번호 변경
   - PostgreSQL 비밀번호 변경

2. HTTPS 설정
   - 프록시 서버(Nginx, Apache 등)를 사용하여 HTTPS 설정
   - Let's Encrypt를 사용하여 무료 SSL 인증서 발급

3. 백업 자동화
   - 정기적인 데이터베이스 백업 스크립트 설정

4. 모니터링 설정
   - 컨테이너 상태 및 리소스 사용량 모니터링

## 문제 해결

### 데이터베이스 연결 오류

데이터베이스 연결 오류가 발생하는 경우:

1. PostgreSQL 컨테이너가 실행 중인지 확인
   ```bash
   docker-compose ps postgres
   ```

2. 데이터베이스 연결 문자열 확인
   ```bash
   docker-compose logs app
   ```

3. PostgreSQL 로그 확인
   ```bash
   docker-compose logs postgres
   ```

### 애플리케이션 오류

애플리케이션 오류가 발생하는 경우:

1. 애플리케이션 로그 확인
   ```bash
   docker-compose logs app
   ```

2. 컨테이너 재시작
   ```bash
   docker-compose restart app
   ```

3. 이미지 재빌드
   ```bash
   docker-compose build app
   docker-compose up -d
