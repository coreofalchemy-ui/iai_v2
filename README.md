# AI 상세페이지 생성기

AI 기반 쇼핑몰 상세페이지 자동 생성 도구

## 주요 기능

- ✅ 제품/모델 이미지 업로드
- ✅ AI 텍스트 자동 생성 (상품 설명, 스펙 등)
- ✅ K-POP 비주얼 모델 얼굴 생성
- ✅ 프리뷰 전체 얼굴 일괄 교체
- ✅ VFX 신발 교체
- ✅ 포즈 변형 생성
- ✅ HTML 다운로드

## 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. API 키 설정
`.env.local` 파일에 Gemini API 키 설정:
```
VITE_GEMINI_API_KEY=your_api_key_here
```

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
iai_v2/
├── src/
│   ├── apps/
│   │   └── detail-generator/     # 상세페이지 생성기
│   │       ├── components/       # UI 컴포넌트
│   │       └── services/         # API 서비스
│   ├── components/shared/        # 공통 컴포넌트
│   └── App.tsx                   # 앱 진입점
├── package.json
└── vite.config.ts
```

## 기술 스택

- React 18
- TypeScript
- Vite
- Google Gemini AI (2.5 Flash / 3.0 Pro)
- Framer Motion
- Tailwind CSS

## License

Apache-2.0
