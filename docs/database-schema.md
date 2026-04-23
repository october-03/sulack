# Database Schema Draft

## 1. 설계 원칙

- 단일 회사용 메신저이므로 `workspace_id`는 두지 않습니다.
- 사용자 인증은 Supabase Auth가 담당하고, 앱 데이터는 별도 프로필 테이블로 관리합니다.
- 채널과 DM을 하나의 메시지 모델로 풀 수 있도록 대화 단위를 명확히 둡니다.
- unread 계산, 참여 권한, 파일 연결이 가능한 구조를 우선합니다.

## 2. 핵심 테이블

### profiles

앱 내부 사용자 프로필입니다.

주요 컬럼 예시:

- `id`
- `email`
- `display_name`
- `avatar_url`
- `status_message`
- `created_at`
- `updated_at`

메모:

- `id`는 Supabase Auth user id와 동일 UUID 사용을 권장합니다.

### channels

공개/비공개 채널 정보입니다.

주요 컬럼 예시:

- `id`
- `name`
- `description`
- `visibility` (`public` | `private`)
- `created_by`
- `created_at`
- `updated_at`

### channel_members

채널 참여자 관계입니다.

주요 컬럼 예시:

- `id`
- `channel_id`
- `user_id`
- `role`
- `joined_at`

제약:

- `(channel_id, user_id)` unique

### direct_conversations

1:1 DM 대화방입니다.

주요 컬럼 예시:

- `id`
- `created_at`

메모:

- 지금 범위에서는 그룹 DM 없이 1:1만 다룹니다.

### direct_conversation_members

DM 참여자 관계입니다.

주요 컬럼 예시:

- `id`
- `conversation_id`
- `user_id`
- `joined_at`

제약:

- `(conversation_id, user_id)` unique
- 애플리케이션 레벨에서 참여자 수 2명 강제

### messages

채널/DM 메시지를 공통 관리합니다.

주요 컬럼 예시:

- `id`
- `channel_id` nullable
- `conversation_id` nullable
- `author_id`
- `content`
- `message_type`
- `created_at`
- `updated_at`
- `deleted_at`

제약:

- `channel_id`와 `conversation_id` 중 하나만 값 존재

메모:

- soft delete를 두면 감사 및 UI 처리에 유리합니다.

### attachments

메시지 첨부 파일 메타데이터입니다.

주요 컬럼 예시:

- `id`
- `message_id`
- `storage_bucket`
- `storage_path`
- `original_name`
- `mime_type`
- `size_bytes`
- `uploaded_by`
- `created_at`

### channel_read_states

채널 읽음 상태입니다.

주요 컬럼 예시:

- `id`
- `channel_id`
- `user_id`
- `last_read_message_id`
- `last_read_at`

제약:

- `(channel_id, user_id)` unique

### conversation_read_states

DM 읽음 상태입니다.

주요 컬럼 예시:

- `id`
- `conversation_id`
- `user_id`
- `last_read_message_id`
- `last_read_at`

제약:

- `(conversation_id, user_id)` unique

## 3. 관계 요약

- 한 명의 사용자(`profiles`)는 여러 채널에 참여할 수 있습니다.
- 한 채널은 여러 메시지를 가질 수 있습니다.
- 한 DM 대화는 정확히 두 명의 참여자를 가집니다.
- 한 메시지는 채널 또는 DM 중 하나에 속합니다.
- 한 메시지는 여러 첨부 파일을 가질 수 있습니다.

## 4. Prisma 모델링 방향

Prisma에서는 아래 방향을 추천합니다.

- `Profile`
- `Channel`
- `ChannelMember`
- `DirectConversation`
- `DirectConversationMember`
- `Message`
- `Attachment`
- `ChannelReadState`
- `ConversationReadState`

채널과 DM 메시지를 하나의 `Message`로 통합하면 공통 UI와 서비스 로직을 재사용하기 쉽습니다.

## 5. 향후 확장 테이블

후속 단계에서 아래 테이블을 추가할 수 있습니다.

- `message_reactions`
- `message_threads`
- `message_mentions`
- `notifications`
- `audit_logs`

## 6. 설계 시 주의점

- `auth.users`와 앱 테이블 간 참조 전략을 먼저 확정해야 합니다.
- 메시지 페이징과 인덱스 설계를 초기에 함께 고려해야 합니다.
- 파일 삭제 시 Storage 객체와 DB 메타데이터 정합성을 맞춰야 합니다.
- unread count를 실시간 계산할지, 상태 테이블 기반으로 가져갈지 조기에 정해야 합니다.
