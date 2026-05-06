# Supabase Realtime Subscription Strategy

## 1. 목표

채널과 DM 메시지를 새로고침 없이 반영하되, 기존 API 중심 권한 검증과 데이터 조회 흐름을 유지합니다.

## 2. 핵심 원칙

- 최초 메시지 목록과 이전 페이지 조회는 NestJS API를 사용합니다.
- 메시지 생성, 수정, 삭제 같은 변경 작업도 NestJS API를 거칩니다.
- Supabase Realtime은 현재 사용자가 보고 있는 대화방의 증분 변경만 수신합니다.
- Web 상태는 `message.id` 기준으로 정규화하거나 upsert 해서 중복 이벤트를 방지합니다.
- 삭제는 hard delete가 아니라 `deleted_at`을 갱신하는 soft delete 이벤트로 처리합니다.

## 3. 구독 대상

초기 구현에서는 `public.messages` 테이블만 구독합니다.

구독 이벤트:

- `INSERT`: 새 메시지 수신
- `UPDATE`: 메시지 수정 또는 soft delete 반영

구독하지 않는 이벤트:

- `DELETE`: 현재 메시지 삭제 정책이 soft delete이므로 사용하지 않습니다.

후속 단계에서 읽음 상태를 구현할 때 아래 테이블을 별도 구독 대상으로 추가할 수 있습니다.

- `public.channel_read_states`
- `public.conversation_read_states`
- `public.channel_members`
- `public.direct_conversation_members`

## 4. 구독 범위

### 채널 메시지

현재 열린 채널 하나만 구독합니다.

구독 필터:

```ts
const channel = supabase
  .channel(`messages:channel:${channelId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `channel_id=eq.${channelId}`,
    },
    handleMessageInserted,
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
      filter: `channel_id=eq.${channelId}`,
    },
    handleMessageUpdated,
  )
  .subscribe();
```

### DM 메시지

현재 열린 DM 대화 하나만 구독합니다.

구독 필터:

```ts
const channel = supabase
  .channel(`messages:conversation:${conversationId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    },
    handleMessageInserted,
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    },
    handleMessageUpdated,
  )
  .subscribe();
```

### 대화방 전환

사용자가 다른 채널 또는 DM으로 이동하면 기존 Realtime channel을 먼저 해제하고 새 구독을 생성합니다.

권장 channel 이름:

- `messages:channel:${channelId}`
- `messages:conversation:${conversationId}`

## 5. 데이터 흐름

### 초기 로딩

1. 사용자가 채널 또는 DM을 선택합니다.
2. Web이 API로 최근 메시지 목록을 조회합니다.
3. 응답 메시지를 `message.id` 기준으로 상태에 저장합니다.
4. 같은 대화방에 대한 Supabase Realtime 구독을 시작합니다.

### 새 메시지 작성

1. Web이 메시지 작성 API를 호출합니다.
2. API가 권한을 검증하고 `messages`에 INSERT 합니다.
3. Web은 API 응답 메시지를 즉시 상태에 upsert 합니다.
4. 이후 도착하는 Realtime `INSERT` 이벤트도 같은 `message.id` 기준으로 upsert 합니다.

이 흐름에서는 API 응답과 Realtime 이벤트가 모두 도착해도 같은 메시지가 두 번 추가되지 않습니다.

### 메시지 수정

1. Web이 메시지 수정 API를 호출합니다.
2. API가 작성자 권한을 검증하고 `content`, `updated_at`을 갱신합니다.
3. Realtime `UPDATE` 이벤트가 도착하면 같은 `message.id`의 기존 메시지를 병합합니다.

### 메시지 삭제

1. Web이 메시지 삭제 API를 호출합니다.
2. API가 작성자 권한을 검증하고 `deleted_at`을 갱신합니다.
3. Realtime `UPDATE` 이벤트가 도착하면 UI에서 삭제된 메시지 상태로 표시합니다.

삭제된 메시지를 목록에서 제거하지 않고 "삭제된 메시지" 상태로 남기는 편이 페이징과 읽음 상태 처리에 유리합니다.

## 6. 중복 이벤트 방지 규칙

메시지 목록 상태는 배열만으로 append 하지 않습니다.

권장 규칙:

- `message.id`가 없으면 추가합니다.
- `message.id`가 이미 있으면 기존 항목을 새 payload로 병합합니다.
- 병합 후 `created_at` 오름차순으로 정렬합니다.
- 동일한 `created_at` 값이 있을 수 있으므로 최종 tie-breaker로 `id`를 사용합니다.
- 현재 열린 대화방과 다른 `channel_id` 또는 `conversation_id` 이벤트는 무시합니다.

간단한 상태 갱신 형태:

```ts
function upsertMessage(messages: MessageItem[], incoming: MessageItem) {
  const next = new Map(messages.map((message) => [message.id, message]));
  next.set(incoming.id, {
    ...next.get(incoming.id),
    ...incoming,
  });

  return [...next.values()].sort((a, b) => {
    const createdAtDiff = a.createdAt.localeCompare(b.createdAt);
    return createdAtDiff === 0 ? a.id.localeCompare(b.id) : createdAtDiff;
  });
}
```

## 7. 권한과 RLS 기준

API 요청은 이미 NestJS에서 참여자 권한을 검증합니다. Realtime은 브라우저가 직접 Supabase에 연결하므로 별도 보호가 필요합니다.

권장 정책:

- `public.messages`는 Supabase Realtime publication에 포함합니다.
- `public.messages`에 RLS를 켭니다.
- 채널 메시지는 `channel_members`에 현재 사용자가 존재할 때만 SELECT를 허용합니다.
- DM 메시지는 `direct_conversation_members`에 현재 사용자가 존재할 때만 SELECT를 허용합니다.
- INSERT, UPDATE, DELETE는 클라이언트에서 직접 허용하지 않고 API 경유를 유지합니다.

예시 방향:

```sql
alter publication supabase_realtime add table public.messages;

alter table public.messages enable row level security;

create policy "members can read channel messages"
on public.messages
for select
using (
  channel_id is not null
  and exists (
    select 1
    from public.channel_members cm
    where cm.channel_id = messages.channel_id
      and cm.user_id = auth.uid()
  )
);

create policy "participants can read direct messages"
on public.messages
for select
using (
  conversation_id is not null
  and exists (
    select 1
    from public.direct_conversation_members dcm
    where dcm.conversation_id = messages.conversation_id
      and dcm.user_id = auth.uid()
  )
);
```

현재 프로젝트가 서버 검증 중심으로 출발하더라도, Realtime을 실제 사용자에게 열기 전에는 위 RLS 정책을 migration으로 추가해야 합니다.

## 8. 장애와 재연결 처리

Realtime 연결은 네트워크 상태에 따라 끊길 수 있으므로, 구독 상태를 UI 데이터 정합성과 분리해서 다룹니다.

권장 처리:

- 구독이 `SUBSCRIBED`가 되면 현재 대화방을 정상 구독 중으로 표시할 수 있습니다.
- 구독이 `TIMED_OUT` 또는 `CHANNEL_ERROR`가 되면 메시지 작성 자체는 막지 않습니다.
- 재구독이 성공하면 현재 대화방 메시지 목록을 API로 다시 조회해 누락 이벤트를 보정합니다.
- 사용자가 로그아웃하면 모든 Realtime channel을 제거합니다.
- Supabase access token이 갱신되면 Realtime client에도 최신 세션이 반영되어야 합니다.

## 9. 구현 위치 제안

### Web

권장 파일 또는 모듈:

- `apps/web/src/shared/supabase`
- `apps/web/src/features/messages`
- 현재 단일 파일 구조를 유지한다면 `apps/web/src/App.tsx`의 선택된 대화방 effect

권장 책임:

- Supabase client 생성
- 선택된 채널/DM에 대한 Realtime 구독 생성 및 해제
- payload를 API 응답 모델에 맞게 변환
- 메시지 상태 upsert

### API

권장 책임:

- 메시지 CRUD 권한 검증 유지
- soft delete 유지
- Realtime을 위한 RLS migration 추가
- API 응답 모델과 Realtime payload 모델 차이를 최소화

## 10. 완료 기준

- 채널 메시지 작성 시 같은 채널을 보고 있는 사용자의 화면에 새 메시지가 반영됩니다.
- DM 메시지 작성 시 해당 DM 참여자의 화면에 새 메시지가 반영됩니다.
- 메시지 수정 이벤트가 기존 메시지 항목에 병합됩니다.
- 메시지 삭제 이벤트가 `deleted_at` 기반 UI 상태로 반영됩니다.
- API 응답과 Realtime 이벤트가 모두 도착해도 메시지가 중복 표시되지 않습니다.
- 대화방 전환 후 이전 대화방 이벤트가 현재 화면에 섞이지 않습니다.

## 11. 참고 문서

- [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Supabase Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
