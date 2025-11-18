# 서버 배포 가이드

## 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
# API 서버 URL (실제 서버 주소로 변경)
EXPO_PUBLIC_API_BASE_URL=https://your-server.com

# 카카오 JavaScript 키 (카카오 개발자 콘솔에서 발급)
EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY=your_kakao_javascript_key_here
```

### 환경 변수 설명
- `EXPO_PUBLIC_API_BASE_URL`: 백엔드 API 서버의 URL
- `EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY`: 카카오 로그인을 위한 JavaScript 키 (웹용)

## 2. 카카오 개발자 콘솔 설정

1. [카카오 개발자 콘솔](https://developers.kakao.com/)에 접속
2. 내 애플리케이션 > 앱 설정 > 플랫폼 설정
3. **Web 플랫폼 등록**:
   - 사이트 도메인: 배포할 서버 도메인 입력 (예: `https://your-domain.com`)
   - Redirect URI: `https://your-domain.com/login` 등 설정
4. **JavaScript 키 복사**하여 `.env` 파일에 입력

## 3. 웹 빌드 및 배포

### 로컬 빌드
```bash
npm run build:web
```

빌드된 파일은 `web-build/` 폴더에 생성됩니다.

### 배포 옵션

#### 옵션 1: Vercel 배포 (권장)
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

#### 옵션 2: Netlify 배포
```bash
# Netlify CLI 설치
npm i -g netlify-cli

# 배포
netlify deploy --prod --dir=web-build
```

#### 옵션 3: 정적 호스팅 서버
`web-build/` 폴더의 내용을 웹 서버의 루트 디렉토리에 업로드하세요.

## 4. 배포 전 체크리스트

- [ ] `.env` 파일에 올바른 서버 URL 설정
- [ ] `.env` 파일에 카카오 JavaScript 키 설정
- [ ] 카카오 개발자 콘솔에 웹 플랫폼 등록 및 도메인 설정
- [ ] 백엔드 서버 CORS 설정 확인 (프론트엔드 도메인 허용)
- [ ] API 서버가 정상 작동하는지 확인

## 5. CORS 설정 (백엔드)

백엔드 서버에서 프론트엔드 도메인을 허용해야 합니다:

```python
# Django 예시
CORS_ALLOWED_ORIGINS = [
    "https://your-domain.com",
    "http://localhost:8081",  # 개발용
]
```

## 6. 문제 해결

### 환경 변수가 적용되지 않는 경우
- Expo는 빌드 시점에 환경 변수를 번들에 포함시킵니다
- 환경 변수를 변경한 후 **반드시 다시 빌드**해야 합니다
- `EXPO_PUBLIC_` 접두사가 있는 변수만 클라이언트에서 접근 가능합니다

### 카카오 로그인이 작동하지 않는 경우
- 카카오 개발자 콘솔에서 도메인이 올바르게 등록되었는지 확인
- JavaScript 키가 올바른지 확인
- 브라우저 콘솔에서 에러 메시지 확인

