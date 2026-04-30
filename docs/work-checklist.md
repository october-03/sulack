# Work Checklist

현재 코드베이스를 기준으로, "무엇부터 작업해야 하는지"를 구현 순서대로 정리한 체크리스트입니다.

체크 기준은 아래와 같습니다.

- `[x]` 실제 코드나 마이그레이션으로 이미 반영된 항목
- `[ ]` 아직 구현되지 않았거나 일부만 준비된 항목

## 현재 상태 요약

지금 프로젝트는 "기반 세팅 + DB 모델링 + 문서화"까지는 진행되어 있고, 실제 메신저 기능 구현은 이제 시작하는 단계입니다.

이미 확인된 완료 항목:

- 모노레포(`apps/api`, `apps/web`) 구성
- NestJS API 기동 및 health endpoint
- React Web 기동 및 API health 확인 화면
- Prisma 런타임 모듈 연결
- 메신저 핵심 도메인 Prisma schema 작성
- 초기 migration 작성
- Supabase Auth user 생성 시 `profiles` 동기화를 위한 DB trigger migration 작성
- 프로젝트 기획 / 아키텍처 / DB / 로드맵 문서 작성

## 추천 작업 순서 체크리스트

### 1. 기반 환경 정리

- [x] `pnpm` workspace 기반 모노레포 구조 생성
- [x] `apps/api` NestJS 기본 실행 구조 구성
- [x] `apps/web` React + Vite 기본 실행 구조 구성
- [x] API health check endpoint 구성
- [x] Prisma runtime service와 module 연결
- [x] `apps/api/.env.example` 작성
- [x] `apps/web/.env.example` 작성

이 단계의 다음 액션:

- API와 Web에서 필요한 환경 변수를 명시적으로 정리합니다.
- 로컬 개발자가 바로 시작할 수 있도록 예시 env 파일을 맞춰줍니다.

### 2. DB / Prisma 정리

- [x] Supabase PostgreSQL을 기준으로 Prisma schema 설계
- [x] `profiles`, `channels`, `channel_members` 모델 정의
- [x] `direct_conversations`, `direct_conversation_members` 모델 정의
- [x] `messages`, `attachments` 모델 정의
- [x] `channel_read_states`, `conversation_read_states` 모델 정의
- [x] 초기 migration 생성
- [x] `profiles` 자동 생성 trigger migration 추가
- [x] seed 데이터 전략 수립 (`docs/seed-data-strategy.md`)

이 단계의 다음 액션:

- 실제 로컬 또는 Supabase 개발 DB에 migration을 적용하는 절차를 명확히 적습니다.
- 채널/DM 테스트용 seed 데이터가 필요하면 초기에 같이 준비하는 편이 좋습니다.

### 3. 인증과 사용자 프로필

- [x] Web에 Supabase client 설치 및 설정
- [x] 로그인 / 로그아웃 UI 구현
- [x] 세션 유지 처리
- [x] API에서 Supabase JWT 검증 구조 추가
- [x] 현재 사용자 추출 가드 또는 데코레이터 추가
- [x] `profiles` 조회 / 수정 API 구현
- [x] 최초 로그인 이후 프로필 보정 로직 점검

왜 이 순서인가:

인증과 현재 사용자 식별이 먼저 완료되어야 채널, DM, 메시지 권한 처리를 안전하게 붙일 수 있습니다.

### 4. 채널 기능

- [x] 채널 생성 API
- [x] 채널 목록 조회 API
- [x] 채널 상세 조회 API
- [x] 공개 채널 참여 API
- [x] 비공개 채널 초대/참여 정책 구현
- [x] 채널 멤버 목록 조회 API
- [x] Web 좌측 채널 목록 UI

완료 조건:

- 로그인 사용자가 채널을 생성하고 참여할 수 있어야 합니다.
- 채널 참여자만 채널 내용을 볼 수 있어야 합니다.

### 5. DM 기능

- [x] 사용자 검색 API
- [x] 1:1 DM 생성 API
- [x] 기존 DM 조회 API
- [x] 동일 사용자 쌍 중복 생성 방지 로직
- [ ] DM 목록 UI

완료 조건:

- 두 사용자 사이에 하나의 DM 대화만 유지되어야 합니다.
- DM 참여자만 대화에 접근할 수 있어야 합니다.

### 6. 메시지 기능

- [ ] 채널 메시지 목록 조회 API
- [ ] DM 메시지 목록 조회 API
- [ ] 메시지 작성 API
- [ ] 메시지 수정 API
- [ ] 메시지 삭제 API
- [ ] 메시지 입력 UI
- [ ] 메시지 리스트 UI

완료 조건:

- 채널과 DM 모두에서 메시지 CRUD가 가능해야 합니다.
- 작성자 권한 검증이 서버에서 동작해야 합니다.

### 7. 실시간 반영

- [ ] Supabase Realtime 구독 전략 확정
- [ ] 채널 메시지 실시간 수신
- [ ] DM 메시지 실시간 수신
- [ ] 메시지 수정/삭제 이벤트 반영
- [ ] 중복 이벤트 처리 방지

완료 조건:

- 새 메시지가 새로고침 없이 반영되어야 합니다.
- 같은 메시지가 API 응답과 Realtime 이벤트로 중복 추가되지 않아야 합니다.

### 8. 파일 첨부

- [ ] Storage bucket 설계
- [ ] 업로드 경로 규칙 정의
- [ ] 파일 업로드 API 또는 direct upload 흐름 확정
- [ ] 첨부 메타데이터 저장 API
- [ ] Web 파일 첨부 UI
- [ ] 대화 참여자 기준 접근 정책 적용

완료 조건:

- 파일이 Storage와 DB 양쪽에 정합성 있게 반영되어야 합니다.
- 참여자 외 사용자는 파일에 접근할 수 없어야 합니다.

### 9. 읽음 상태

- [ ] 채널 읽음 상태 갱신 API
- [ ] DM 읽음 상태 갱신 API
- [ ] 마지막 읽은 메시지 기준 저장
- [ ] 채널/DM 목록 unread 표시 UI

완료 조건:

- 사용자가 어디까지 읽었는지 방 단위로 저장되어야 합니다.
- 목록에서 읽지 않음 여부를 구분할 수 있어야 합니다.

### 10. UI 구조 고도화

- [ ] 현재 starter 화면을 메신저 레이아웃으로 전환
- [ ] 좌측 사이드바 / 중앙 메시지 패널 / 우측 보조 패널 구조 설계
- [ ] 모바일 대응 기준 정의
- [ ] 빈 상태 / 로딩 / 에러 상태 UI 정리

완료 조건:

- 실제 메신저처럼 탐색 가능한 기본 레이아웃이 갖춰져야 합니다.
