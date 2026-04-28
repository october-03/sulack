# Seed Data Strategy

## 1. 목표

이 문서는 Sulack 프로젝트의 개발/테스트용 seed 데이터 전략을 정의합니다.

목표는 아래 세 가지입니다.

- 로컬 개발자가 채널, DM, 메시지 흐름을 빠르게 재현할 수 있어야 합니다.
- Supabase Auth와 앱 데이터(`public` 스키마) 관계를 안전하게 유지해야 합니다.
- seed 실행이 반복 가능하고, 실패 시 복구 방향이 명확해야 합니다.

## 2. 현재 전제

현재 스키마 기준으로 사용자 데이터는 아래 두 계층으로 나뉩니다.

- 인증 사용자: `auth.users`
- 앱 프로필 및 메신저 데이터: `public.profiles`, `channels`, `messages` 등

또한 `auth.users` 생성 시 `public.profiles`를 자동 생성하는 DB trigger가 이미 존재합니다.

따라서 seed 전략도 두 단계로 분리하는 것이 안전합니다.

1. 테스트용 Auth 사용자 준비
2. 해당 사용자를 기준으로 앱 데이터 seed

## 3. 전략 원칙

### 3.1 Auth 데이터와 앱 데이터를 분리한다

- `auth.users`는 Prisma seed로 직접 다루지 않습니다.
- Auth 사용자는 Supabase Admin API 또는 Supabase SQL seed 절차로 준비합니다.
- Prisma seed는 `public` 스키마의 앱 데이터 중심으로 관리합니다.

이렇게 분리하면 Prisma가 관리하지 않는 Supabase 관리 영역과의 충돌을 줄일 수 있습니다.

### 3.2 최소하지만 실제 흐름이 보이는 데이터만 넣는다

초기 seed는 더미 대량 생성보다 "기능 검증용 시나리오 데이터"에 집중합니다.

우선 필요한 시나리오는 아래와 같습니다.

- 로그인 후 사용자 목록과 프로필 조회
- 공개 채널 입장
- 비공개 채널 접근 제어
- 1:1 DM 생성/조회
- 채널 메시지 목록
- DM 메시지 목록
- 읽음 상태 표시

### 3.3 반복 실행 가능한 idempotent seed를 만든다

- 자연 키가 있는 데이터는 `upsert`를 우선 사용합니다.
- 고정 식별자가 필요한 seed는 문서에 명시한 slug/이메일 기준으로 재실행 가능하게 만듭니다.
- 전체 초기화가 필요할 때만 별도의 reset 절차를 사용합니다.

### 3.4 환경별 seed 목적을 나눈다

한 종류의 seed로 모든 환경을 커버하려고 하지 않습니다.

- local development seed
- demo/staging seed
- test fixture seed

초기에는 `local development seed`만 먼저 구현하는 것을 권장합니다.

## 4. 권장 seed 구성

### 4.1 Layer A: Auth 사용자 seed

역할:

- `auth.users`에 테스트 계정을 생성
- 트리거로 `public.profiles`가 자동 생성되도록 유도

권장 계정:

- `alice@sulack.local`
- `bob@sulack.local`
- `carol@sulack.local`
- `dave@sulack.local`

권장 규칙:

- 비밀번호는 로컬 개발 전용 고정값 사용
- 이메일 도메인은 실제 발송이 일어나지 않도록 `*.local` 사용
- 표시 이름과 상태 메시지는 이후 Prisma seed에서 보정 가능하게 설계

구현 후보:

1. Supabase Admin API 기반 스크립트
2. 로컬 Supabase 사용 시 SQL 또는 CLI seed

현재 프로젝트 구조를 고려하면, 가장 무난한 1차 선택은 "별도 Auth seed 스크립트 + service role key 사용"입니다.

### 4.2 Layer B: Core app seed

역할:

- `profiles` 보정
- 채널 생성
- 채널 멤버십 생성
- DM 대화 생성
- 메시지 생성
- 읽음 상태 생성

이 레이어는 Prisma 기반으로 관리하는 것을 권장합니다.

### 4.3 Layer C: Optional rich seed

초기에는 선택 사항이지만 아래 데이터는 나중에 추가할 수 있습니다.

- 첨부 파일 메타데이터
- system message
- 삭제된 메시지 샘플
- 읽지 않음이 많은 긴 대화 데이터

이 레이어는 메시지/목록 UI가 어느 정도 완성된 뒤 추가하는 편이 효율적입니다.

## 5. MVP seed 데이터 범위

초기 버전에서는 아래 정도면 충분합니다.

### 사용자

- 4명
- 각 사용자별 `display_name`, `status_message`, `avatar_url`은 선택적으로 보정

### 채널

- `general` 공개 채널
- `frontend` 공개 채널
- `backend` 공개 채널
- `leadership` 비공개 채널

### 채널 멤버십

- `general`: 전체 참여
- `frontend`: Alice, Carol
- `backend`: Bob, Dave
- `leadership`: Alice, Bob

이렇게 구성하면 공개/비공개 권한, 멤버별 목록 차이를 쉽게 검증할 수 있습니다.

### DM

- Alice ↔ Bob
- Alice ↔ Carol
- Bob ↔ Dave

### 메시지

- 채널당 5~15개
- DM당 5~10개
- 작성 시점이 조금씩 다르도록 생성

메시지 패턴은 아래 3종이면 충분합니다.

- 일반 텍스트 메시지
- 여러 사용자가 번갈아 작성한 대화형 메시지
- 최근 메시지 1~2개는 unread 계산에 활용할 수 있도록 남겨두기

### 읽음 상태

- 일부 사용자는 마지막 메시지까지 읽음
- 일부 사용자는 2~3개 이전 메시지까지만 읽음

이 데이터가 있으면 unread badge와 마지막 읽음 시점을 테스트할 수 있습니다.

## 6. 구현 방식 제안

### 6.1 파일 구성

권장 구조는 아래와 같습니다.

```text
apps/api/
  prisma/
    seed/
      auth-users.md or auth-users.ts
      core.seed.ts
      data/
        users.ts
        channels.ts
        conversations.ts
```

핵심은 "정적 seed 정의"와 "실행 로직"을 분리하는 것입니다.

### 6.2 실행 책임

- Auth 사용자 준비: Supabase 쪽 스크립트
- 앱 데이터 준비: Prisma seed

즉, 개발자 입장에서는 아래 흐름이 되도록 만드는 것이 좋습니다.

1. migration 적용
2. Auth 사용자 seed 실행
3. Prisma core seed 실행

### 6.3 식별자 기준

재실행 가능성을 위해 아래 기준을 권장합니다.

- 사용자: `email`
- 채널: `name`
- DM: 참여자 두 명의 user id 조합

현재 스키마에는 DM 중복 방지를 위한 DB 레벨 제약이 없습니다.
따라서 seed 구현 시에는 "기존 참여자 조합 조회 후 있으면 재사용" 로직이 꼭 필요합니다.

이 점은 이후 실제 기능 구현 때도 별도 보완이 필요합니다.

### 6.4 메시지 seed 처리

메시지는 완전한 upsert가 어렵기 때문에 아래 방식이 현실적입니다.

- 채널/DM 단위로 기존 메시지를 먼저 정리하고 다시 넣기
- 또는 seed 전용 메시지에만 고정 prefix를 두고 그 범위만 삭제 후 재생성

초기에는 아래 방식이 가장 단순합니다.

- seed 대상 채널/DM만 조회
- 해당 대화의 기존 메시지와 read state를 삭제
- 문서에 정의한 메시지 세트를 다시 생성

단, 이 방식은 로컬 개발 DB 전용으로 한정하는 것이 안전합니다.

## 7. 실행 정책

### 7.1 local development

허용:

- 반복 실행
- 일부 데이터 삭제 후 재생성
- 고정 테스트 계정 사용

권장:

- `db reset + seed` 또는 `seed only` 두 경로 제공

### 7.2 shared dev / staging

주의:

- 실제 팀원이 같이 쓰는 환경에서는 destructive seed를 금지
- demo 계정/채널만 제한적으로 upsert

초기 단계에서는 shared 환경 seed를 굳이 자동화하지 않는 편이 안전합니다.

## 8. 체크리스트 기준 권장 결론

현재 체크리스트의 "seed 데이터 전략 수립" 항목은 아래 기준으로 완료 처리할 수 있습니다.

- seed 범위를 Auth / app 데이터로 분리한다.
- 1차 대상은 local development seed로 한정한다.
- MVP seed는 사용자 4명, 채널 4개, DM 3개, 메시지/읽음 상태 중심으로 구성한다.
- 실제 구현은 "Auth seed 스크립트"와 "Prisma core seed"의 2단계로 나눈다.

## 9. 다음 액션 제안

전략 다음 단계로는 아래 순서를 추천합니다.

1. Auth 사용자 seed 방식 확정
2. Prisma core seed 초안 구현
3. README 또는 개발 셋업 문서에 실행 순서 추가

구현 우선순위는 "인증 구현 직전" 또는 "채널 API 구현 직전"이 가장 적절합니다.
너무 일찍 만들면 인증 방식이 바뀔 수 있고, 너무 늦게 만들면 기능 검증이 불편해집니다.

## 10. 현재 구현 메모

현재 저장소에는 아래 실행 경로를 기준으로 seed 스크립트가 연결되어 있습니다.

1. `apps/api/.env`에 `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`를 채웁니다.
2. 루트에서 `pnpm seed`를 실행합니다.

동작 방식은 아래와 같습니다.

- Supabase Admin API로 테스트 Auth 사용자를 생성합니다.
- DB trigger로 생성된 `profiles`를 기준으로 채널, DM, 메시지, 읽음 상태를 다시 구성합니다.

이 스크립트는 로컬 개발용 기준이며, seed 대상 채널/DM의 메시지와 읽음 상태를 재생성합니다.
