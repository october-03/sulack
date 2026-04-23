# Technical Architecture

## 1. 아키텍처 목표

이 프로젝트는 Supabase 기능을 적극적으로 활용하면서도, 애플리케이션 비즈니스 로직은 `NestJS`에서 관리하는 구조를 목표로 합니다.

즉, "프론트가 Supabase만 직접 붙는 구조"보다 아래 구조를 지향합니다.

- 인증과 실시간, 파일 저장은 Supabase 기능 활용
- 도메인 로직과 검증은 NestJS API에서 처리
- 데이터 모델 관리는 Prisma schema 중심으로 정리

## 2. 전체 구성

```text
React Web
  -> Supabase Auth Client
  -> Supabase Realtime Subscription
  -> NestJS API
       -> Prisma
       -> Supabase PostgreSQL
       -> Supabase Storage (signed URL or upload flow)
```

## 3. 역할 분리

### Web

- 로그인 상태 관리
- 채널/DM UI 렌더링
- 메시지 목록 표시
- 실시간 이벤트 수신 후 화면 갱신
- 파일 선택 및 업로드 요청

### API

- 인증 토큰 검증
- 채널/DM/메시지 관련 비즈니스 규칙 처리
- 참여 권한 검증
- 파일 업로드 정책 제어
- DB CRUD 및 응답 모델 구성

### Supabase

- Auth: 사용자 인증 및 세션 발급
- PostgreSQL: 애플리케이션 데이터 저장
- Realtime: 메시지/읽음 상태 변경 이벤트 전달
- Storage: 첨부 파일 저장소

## 4. 인증 구조

권장 흐름은 아래와 같습니다.

1. 사용자가 Web에서 Supabase Auth로 로그인
2. Web은 세션 또는 access token을 획득
3. API 요청 시 Bearer token 전달
4. NestJS는 Supabase JWT 기준으로 사용자 식별
5. 앱 내부 `profiles` 레코드와 연결해 권한 판단

이 구조를 사용하면 인증은 Supabase에 맡기고, API는 앱 규칙에 집중할 수 있습니다.

## 5. 실시간 처리 구조

### 기본 전략

- 메시지 생성/수정/삭제 이벤트를 Realtime로 구독
- 현재 열린 채널 또는 DM 기준으로 UI를 즉시 갱신
- 초기 로딩은 API 조회, 이후 증분 반영은 Realtime 구독으로 처리

### 이유

- 최초 데이터 조회와 페이징은 API가 더 관리하기 쉽습니다.
- 실시간 변경 전파는 Supabase Realtime이 잘 담당합니다.
- 둘을 함께 쓰면 "초기 데이터는 안정적으로, 이후 변경은 빠르게" 처리할 수 있습니다.

## 6. Storage 처리 구조

권장 방식은 아래와 같습니다.

1. Web이 API에 업로드 준비 요청
2. API가 업로드 가능 여부와 저장 경로를 검증
3. Storage 업로드 수행
4. 업로드 성공 후 메시지와 파일 메타데이터를 DB에 저장

초기 구현에서는 단순화를 위해 Web에서 직접 업로드 후 API에 메타데이터를 등록하는 흐름도 가능합니다. 다만 접근 정책과 감사 로그가 중요해지면 API 관여 비중을 높이는 편이 좋습니다.

## 7. Prisma 사용 원칙

- Prisma는 Supabase PostgreSQL에 연결합니다.
- 애플리케이션 테이블은 Prisma schema로 관리합니다.
- Supabase Auth의 시스템 스키마는 직접 제어하지 않습니다.
- Auth 사용자와 앱 사용자 프로필 연결은 UUID 기준으로 맞춥니다.

## 8. 권한 모델

### 서버 레벨

- 요청 사용자 인증 확인
- 채널/DM 참여 여부 확인
- 메시지 작성자 본인 여부 확인

### DB / Supabase 레벨

- 가능한 경우 RLS 정책으로 보조 보호
- Storage 접근 정책도 참여자 기반으로 제한

학습 목적상 처음에는 서버 검증 중심으로 시작하고, 이후 RLS를 추가해 비교 학습하는 방식이 좋습니다.

## 9. 추천 모듈 분리

NestJS 기준으로 아래 모듈 구성을 추천합니다.

- `auth`
- `profiles`
- `channels`
- `conversations` 또는 `dms`
- `messages`
- `attachments`
- `read-states`

React 기준으로는 아래 구조를 추천합니다.

- `features/auth`
- `features/channels`
- `features/dms`
- `features/messages`
- `features/attachments`
- `shared/api`
- `shared/supabase`

## 10. 초기 기술 리스크

- Supabase Auth 사용자와 앱 프로필 동기화 시점 설계
- Prisma와 Supabase RLS를 함께 사용할 때의 권한 처리 전략
- Realtime 구독 범위가 넓어질수록 생기는 성능/복잡도 이슈
- Storage 파일 접근 URL 정책 설계
