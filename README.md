# Sulack

Slack를 레퍼런스로 삼아, 회사 내부에서 사용하는 프라이빗 메신저를 만드는 `supabase study` 프로젝트입니다.

이 프로젝트의 핵심 목적은 다음과 같습니다.

- `Supabase Auth`로 사내 사용자 인증 처리
- `Supabase Realtime`으로 채널/DM 메시지 실시간 반영
- `Supabase Storage`로 파일 업로드 및 공유 처리
- `Supabase PostgreSQL`을 기본 데이터베이스로 사용
- 현재 모노레포 스택인 `NestJS + Prisma + React` 위에서 구현 구조를 정리

중요한 전제는 다음과 같습니다.

- 멀티 워크스페이스 구조는 고려하지 않습니다.
- 하나의 회사가 내부적으로 사용하는 단일 테넌트 메신저를 가정합니다.
- 초기 목표는 Slack의 모든 기능 복제가 아니라, 학습 목적에 맞는 핵심 협업 기능 구현입니다.

## Project Structure

```text
.
├── apps
│   ├── api     # NestJS + Prisma
│   └── web     # Vite + React + TypeScript
└── docs
    ├── README.md
    ├── product-overview.md
    ├── functional-requirements.md
    ├── technical-architecture.md
    ├── database-schema.md
    └── implementation-roadmap.md
```

## Documentation

프로젝트 기획과 구현 기준 문서는 아래에서 확인할 수 있습니다.

- [문서 인덱스](./docs/README.md)
- [프로젝트 개요](./docs/product-overview.md)
- [기능 요구사항](./docs/functional-requirements.md)
- [기술 아키텍처](./docs/technical-architecture.md)
- [DB 설계 초안](./docs/database-schema.md)
- [구현 로드맵](./docs/implementation-roadmap.md)

## MVP Scope

MVP에서는 아래 기능을 우선 구현합니다.

- 이메일 기반 로그인 또는 초대 기반 사내 사용자 인증
- 공개 채널 / 비공개 채널 생성 및 참여
- 1:1 DM
- 메시지 작성, 수정, 삭제
- 실시간 메시지 수신
- 파일 업로드 및 다운로드
- 읽음 상태와 마지막 확인 시점 표시

후순위 기능은 아래와 같습니다.

- 스레드 답글
- 이모지 리액션
- 멘션 자동완성
- 검색 고도화
- 관리자 기능

## Tech Direction

### Web

- React 기반 UI
- 채널 목록, DM 목록, 메시지 패널, 파일 첨부 UI 구성
- Supabase client를 활용한 인증 상태 확인 및 실시간 구독

### API

- NestJS를 BFF/도메인 API 계층으로 활용
- 권한 검사, 입력 검증, 업로드 정책, 비즈니스 규칙 처리
- Prisma를 통해 Supabase PostgreSQL에 접근

### Database

- Supabase PostgreSQL 사용
- Prisma schema로 애플리케이션 데이터 모델 관리
- 인증 사용자 정보는 Supabase Auth와 앱 프로필 테이블을 함께 사용

## Getting Started

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
pnpm dev
```

`apps/web/.env`에는 아래 값들을 채워 넣습니다.

- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

API와 DB용 환경 변수는 이후 구현 단계에서 `apps/api`에 추가합니다.

## Scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm format:check
```

## Next Step

권장 구현 순서는 아래와 같습니다.

1. Supabase 프로젝트 생성 및 Auth/Storage/Realtime 사용 조건 정리
2. Prisma schema에 맞춘 핵심 테이블 설계
3. 인증 흐름과 사용자 프로필 동기화 구현
4. 채널/DM/메시지 API 구현
5. Web에서 채팅 UI와 실시간 구독 연결
6. 파일 업로드 및 읽음 상태 기능 추가
