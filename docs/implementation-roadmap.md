# Implementation Roadmap

## 1. 목표

문서 기준을 바탕으로 Supabase 학습 효과가 높은 순서대로 메신저 기능을 단계적으로 구현합니다.

## 2. 단계별 계획

### Phase 1. 기본 환경 구성

산출물:

- Supabase 프로젝트 생성
- `apps/web`용 Supabase client 설정
- `apps/api`용 환경 변수 및 DB 연결 설정
- Prisma와 Supabase PostgreSQL 연결

체크포인트:

- Web과 API가 각각 로컬에서 실행된다.
- Prisma가 DB에 연결된다.
- Supabase 프로젝트 키와 URL이 안전하게 주입된다.

### Phase 2. 인증과 사용자 프로필

산출물:

- 로그인/로그아웃 UI
- 세션 유지 처리
- `profiles` 테이블 생성
- 최초 로그인 사용자 프로필 동기화

체크포인트:

- 로그인 후 사용자 식별이 가능하다.
- API가 토큰 기준으로 현재 사용자를 판별한다.

### Phase 3. 채널 기능

산출물:

- 채널 생성 API
- 채널 목록 조회 API
- 채널 참여/초대 처리
- 채널 메시지 목록 조회 API

체크포인트:

- 공개 채널과 비공개 채널의 접근 차이가 동작한다.
- 참여자만 메시지를 볼 수 있다.

### Phase 4. DM 기능

산출물:

- 사용자 검색
- 1:1 DM 생성/조회 API
- DM 메시지 목록 조회 API

체크포인트:

- 동일 사용자 쌍에 대해 DM이 중복 생성되지 않는다.
- DM 참여자만 대화 내용을 볼 수 있다.

### Phase 5. 메시지 작성과 실시간 반영

산출물:

- 메시지 작성/수정/삭제 API
- Web 메시지 입력 UI
- Supabase Realtime 구독 처리

체크포인트:

- 새 메시지가 즉시 반영된다.
- 수정/삭제 상태가 UI에 반영된다.

### Phase 6. 파일 첨부

산출물:

- Storage bucket 설계
- 파일 업로드 흐름 구현
- 첨부 파일 메타데이터 저장

체크포인트:

- 메시지와 파일이 연결된다.
- 참여자만 첨부 파일에 접근할 수 있다.

### Phase 7. 읽음 상태

산출물:

- 채널/DM 읽음 상태 저장
- 읽지 않음 표시 UI

체크포인트:

- 대화방별 마지막 읽은 시점이 유지된다.
- 목록에서 unread 여부를 표현할 수 있다.

## 3. 우선순위 제안

가장 추천하는 구현 순서는 아래와 같습니다.

1. Auth
2. Profiles
3. Channels
4. DMs
5. Messages
6. Realtime
7. Storage
8. Read states

이 순서를 추천하는 이유는 "로그인 가능한 사용자"와 "대화 단위"가 먼저 안정되어야 이후 실시간/파일 기능을 자연스럽게 붙일 수 있기 때문입니다.

## 4. 작업 분할 제안

### API

- 인증 가드
- 사용자 프로필 API
- 채널/DM 서비스
- 메시지 서비스
- 첨부 파일 서비스

### Web

- 로그인 화면
- 좌측 사이드바
- 채팅 메시지 패널
- 메시지 입력창
- 파일 첨부 UI

### Infra / DB

- Supabase 프로젝트 설정
- Storage bucket 정책
- Prisma schema 및 migration

## 5. 예상 리스크

- Supabase Auth와 서버 세션 해석 방식 차이
- 실시간 이벤트와 API 응답 간 중복 반영 처리
- Storage 접근 권한 설계
- Prisma migration과 Supabase 관리 스키마 간 경계 설정

## 6. 구현 시작 추천 포인트

바로 구현을 시작한다면 다음 순서를 추천합니다.

1. `profiles`, `channels`, `channel_members`, `messages` Prisma 모델 작성
2. Web에 Supabase 인증 클라이언트 연결
3. API에 인증 가드와 현재 사용자 추출 로직 추가
4. 채널 목록 / 채널 메시지 조회 API 구현
5. 메시지 작성 API와 Realtime 구독 연결
