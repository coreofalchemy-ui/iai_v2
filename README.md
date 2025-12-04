# AI Fashion Hub

통합 4개의 AI 패션 이미지 생성 툴을 하나의 웹 애플리케이션으로 통합했습니다.

## 포함된 앱

1. **모델 생성기** - 패션 캠페인 이미지 생성 (얼굴 합성, 신발 교체, 포즈 변형)
2. **상세페이지 생성기** - 쇼핑몰 상세페이지 자동 생성
3. **신발 이미지 AI 에디터** - 제품 이미지 전문 편집
4. **패션 콘텐츠 생성기** - 빠른 신발 교체 및 포즈 변경

## 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. API 키 설정
`.env.local` 파일에 Gemini API 키가 이미 설정되어 있습니다.

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속

### 4. 프로덕션 빌드
```bash
npm run build
```

## 프로젝트 구조

```
ai-fashion-hub/
├── src/
│   ├── apps/                    # 4개 독립 앱
│   │   ├── model-generator/
│   │   ├── detail-generator/
│   │   ├── shoe-editor/
│   │   └── content-generator/
│   ├── components/shared/       # 공통 컴포넌트
│   ├── App.tsx                  # React Router 설정
│   └── Home.tsx                 # 랜딩 페이지
├── package.json
└── vite.config.ts
```

## 기술 스택

- React 19.2.0
- TypeScript
- React Router 7.1.1
- Vite 6.2.0
- Google Gemini AI 3.0 Pro
- Framer Motion

## 주요 기능

- ✅ 단일 통합 웹 애플리케이션
- ✅ React Router 기반 라우팅
- ✅ 4개 앱 모두 100% 기능 보존
- ✅ API 연결 정상 작동
- ✅ 프리미엄 UI/UX 디자인
- ✅ 배포 가능한 프로덕션 빌드

## License

Apache-2.0
