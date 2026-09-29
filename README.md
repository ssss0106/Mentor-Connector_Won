# Mentor connector

지역 청소년과 대학생 선배를 **고민 기반**으로 연결하는 1:1 진로·학습 멘토링 플랫폼 (MVP 데모)

## 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

## 구성

- Next.js 15 (App Router) + TypeScript, 백엔드 없이 브라우저 localStorage에 저장 (`lib/store.ts`)
- 조건 기반 매칭 (`lib/match.ts`): 관심 분야 +3 · 고민 유형 +3 · 관심 전공 +2 · 경험 분야 +2 · 시간 겹침 +1
- 가상 멘토 데이터 8명 (`lib/data.ts`)

| 화면 | 경로 |
| --- | --- |
| 메인 | `/` |
| 회원가입 / 시연용 로그인 | `/signup` |
| 학생 고민 입력 | `/concern` |
| 맞춤 멘토 추천 | `/recommend` |
| 멘토 목록 | `/mentors` |
| 멘토 상세 / 신청 | `/mentors/[id]`, `/mentors/[id]/apply` |
| 마이페이지 (학생·멘토) | `/mypage` |
| 멘토 프로필 등록 | `/mentor/profile` |
