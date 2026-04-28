import { randomUUID } from 'node:crypto';
import process from 'node:process';
import pg from 'pg';

const { Client } = pg;

const seedUsers = [
	{
		email: 'alice@sulack.local',
		displayName: '김민지',
		statusMessage: '다음 릴리스를 준비하는 중',
		avatarUrl: null
	},
	{
		email: 'bob@sulack.local',
		displayName: '박준호',
		statusMessage: '백엔드 작업 정리 중',
		avatarUrl: null
	},
	{
		email: 'carol@sulack.local',
		displayName: '이서연',
		statusMessage: '웹 사용성을 다듬는 중',
		avatarUrl: null
	},
	{
		email: 'dave@sulack.local',
		displayName: '최도윤',
		statusMessage: '로컬 인프라 상태 확인 중',
		avatarUrl: null
	}
];

const seedChannels = [
	{
		name: 'general',
		description: '팀 전체 공지와 일상적인 업무 공유를 위한 채널입니다.',
		visibility: 'public',
		createdByEmail: 'alice@sulack.local',
		members: [
			{ email: 'alice@sulack.local', role: 'admin' },
			{ email: 'bob@sulack.local', role: 'member' },
			{ email: 'carol@sulack.local', role: 'member' },
			{ email: 'dave@sulack.local', role: 'member' }
		],
		messages: [
			{ authorEmail: 'alice@sulack.local', content: '설랙 개발용 공용 채널입니다. 편하게 진행 상황 남겨주세요.' },
			{ authorEmail: 'bob@sulack.local', content: '백엔드 API 기본 구조는 올라왔고 헬스 체크도 정상입니다.' },
			{
				authorEmail: 'carol@sulack.local',
				content: '웹 기본 화면도 준비됐고 이제 인증이랑 채널 목록을 붙이면 될 것 같아요.'
			},
			{ authorEmail: 'dave@sulack.local', content: '로컬 DB 연결이랑 마이그레이션 적용 상태도 문제 없습니다.' },
			{ authorEmail: 'alice@sulack.local', content: '이제 seed 데이터만 있으면 화면 검증이 훨씬 수월해질 것 같네요.' }
		]
	},
	{
		name: 'frontend',
		description: 'UI, 상호작용, 웹 클라이언트 구현을 다루는 채널입니다.',
		visibility: 'public',
		createdByEmail: 'carol@sulack.local',
		members: [
			{ email: 'alice@sulack.local', role: 'member' },
			{ email: 'carol@sulack.local', role: 'admin' }
		],
		messages: [
			{ authorEmail: 'carol@sulack.local', content: '사이드바 레이아웃은 데스크톱 기준으로는 꽤 안정적으로 보입니다.' },
			{ authorEmail: 'alice@sulack.local', content: '모바일 빈 상태 화면도 처음부터 같이 고려하면 좋겠어요.' },
			{ authorEmail: 'carol@sulack.local', content: '좋아요. 메시지 리스트 간격은 반응형으로 여유 있게 잡아둘게요.' },
			{ authorEmail: 'alice@sulack.local', content: '인증만 붙으면 이 채널이 프런트 쪽 스모크 테스트에 딱 좋겠네요.' }
		]
	},
	{
		name: 'backend',
		description: 'API, 인증, 데이터베이스 접근, 비즈니스 로직을 다루는 채널입니다.',
		visibility: 'public',
		createdByEmail: 'bob@sulack.local',
		members: [
			{ email: 'bob@sulack.local', role: 'admin' },
			{ email: 'dave@sulack.local', role: 'member' }
		],
		messages: [
			{
				authorEmail: 'bob@sulack.local',
				content: '인증 검증 구조를 붙인 다음 채널 API와 DM API로 넘어가면 될 것 같습니다.'
			},
			{
				authorEmail: 'dave@sulack.local',
				content: '로컬 DB에서 마이그레이션이랑 seed 재실행 동작은 제가 같이 확인해볼게요.'
			},
			{
				authorEmail: 'bob@sulack.local',
				content: '도메인이 아직 작으니 서비스 레이어는 최대한 단순하게 유지하고 싶어요.'
			},
			{
				authorEmail: 'dave@sulack.local',
				content: '샘플 메시지가 들어가면 읽음 상태 엣지 케이스도 훨씬 보기 쉬워질 것 같아요.'
			}
		]
	},
	{
		name: 'leadership',
		description: '리드 간 비공개 논의를 위한 채널입니다.',
		visibility: 'private',
		createdByEmail: 'alice@sulack.local',
		members: [
			{ email: 'alice@sulack.local', role: 'admin' },
			{ email: 'bob@sulack.local', role: 'admin' }
		],
		messages: [
			{ authorEmail: 'alice@sulack.local', content: '비공개 채널 접근 제어는 출시 전에 꼭 먼저 검증해야 합니다.' },
			{ authorEmail: 'bob@sulack.local', content: '동의해요. 이 정도 seed 채널이면 1차 확인에는 충분할 것 같습니다.' },
			{ authorEmail: 'alice@sulack.local', content: '운영 로그나 감사 요구사항은 MVP 이후에 다시 정리해보죠.' }
		]
	}
];

const seedDirectConversations = [
	{
		participants: ['alice@sulack.local', 'bob@sulack.local'],
		messages: [
			{ authorEmail: 'alice@sulack.local', content: '오늘 인증 가드 구조 정도는 같이 맞춰볼 수 있을까요?' },
			{ authorEmail: 'bob@sulack.local', content: '좋아요. JWT 추출 로직은 최대한 얇고 명확하게 두고 싶습니다.' },
			{ authorEmail: 'alice@sulack.local', content: '좋네요. 그 다음에 seed 데이터로 바로 흐름 데모도 가능하겠어요.' }
		]
	},
	{
		participants: ['alice@sulack.local', 'carol@sulack.local'],
		messages: [
			{
				authorEmail: 'carol@sulack.local',
				content: '로그인만 동작하면 왼쪽 사이드바를 실제 채널 데이터에 연결할 수 있어요.'
			},
			{
				authorEmail: 'alice@sulack.local',
				content: '좋아요. unread 상태도 몇 개 남겨두면 목록이 더 살아 보일 것 같아요.'
			},
			{ authorEmail: 'carol@sulack.local', content: '네, 그렇게 해두면 정렬 순서 확인에도 도움이 되겠네요.' }
		]
	},
	{
		participants: ['bob@sulack.local', 'dave@sulack.local'],
		messages: [
			{ authorEmail: 'dave@sulack.local', content: 'seed는 여러 번 다시 실행해도 안전한 쪽으로 가는 거죠?' },
			{
				authorEmail: 'bob@sulack.local',
				content: '네. 로컬에서는 기존 상태를 완벽히 보존하는 것보다 재실행 가능성이 더 중요해요.'
			},
			{ authorEmail: 'dave@sulack.local', content: '좋습니다. 그럼 seed 대상 대화는 재구성된다고 보고 확인하겠습니다.' }
		]
	}
];

function requireEnv(name) {
	const value = process.env[name];

	if (!value) {
		throw new Error(`${name} is required to run the seed script.`);
	}

	return value;
}

function log(message) {
	process.stdout.write(`${message}\n`);
}

function buildAdminHeaders() {
	const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

	return {
		apikey: serviceRoleKey,
		Authorization: `Bearer ${serviceRoleKey}`,
		'Content-Type': 'application/json'
	};
}

async function fetchExistingAuthUsers(baseUrl) {
	const response = await fetch(`${baseUrl}/auth/v1/admin/users?page=1&per_page=1000`, {
		method: 'GET',
		headers: buildAdminHeaders()
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Failed to list Supabase auth users: ${response.status} ${body}`);
	}

	const payload = await response.json();
	return Array.isArray(payload.users) ? payload.users : [];
}

async function createAuthUser(baseUrl, password, user) {
	const response = await fetch(`${baseUrl}/auth/v1/admin/users`, {
		method: 'POST',
		headers: buildAdminHeaders(),
		body: JSON.stringify({
			email: user.email,
			password,
			email_confirm: true,
			user_metadata: {
				display_name: user.displayName
			}
		})
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Failed to create auth user ${user.email}: ${response.status} ${body}`);
	}

	return response.json();
}

async function ensureAuthUsers() {
	const baseUrl = requireEnv('SUPABASE_URL').replace(/\/$/, '');
	const password = process.env.SEED_USER_PASSWORD ?? 'sulack-dev-password';
	const existingUsers = await fetchExistingAuthUsers(baseUrl);
	const byEmail = new Map(existingUsers.map((user) => [user.email, user]));

	for (const user of seedUsers) {
		if (byEmail.has(user.email)) {
			log(`auth user exists: ${user.email}`);
			continue;
		}

		await createAuthUser(baseUrl, password, user);
		log(`auth user created: ${user.email}`);
	}
}

function buildTimestamp(minutesAgo) {
	return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

async function loadProfiles(client) {
	const result = await client.query(
		`
      SELECT id, email
      FROM public.profiles
      WHERE email = ANY($1::text[])
    `,
		[seedUsers.map((user) => user.email)]
	);

	return new Map(result.rows.map((row) => [row.email, row.id]));
}

async function upsertProfiles(client, profileIdsByEmail) {
	for (const user of seedUsers) {
		const userId = profileIdsByEmail.get(user.email);

		if (!userId) {
			throw new Error(
				`Profile was not created for auth user ${user.email}. Check the DB trigger and Supabase auth settings.`
			);
		}

		await client.query(
			`
        INSERT INTO public.profiles (
          id,
          email,
          display_name,
          avatar_url,
          status_message,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (id) DO UPDATE
        SET
          email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          avatar_url = EXCLUDED.avatar_url,
          status_message = EXCLUDED.status_message,
          updated_at = NOW()
      `,
			[userId, user.email, user.displayName, user.avatarUrl, user.statusMessage]
		);
	}
}

async function ensureChannel(client, channel, profileIdsByEmail) {
	const existing = await client.query(
		`
      SELECT id
      FROM public.channels
      WHERE name = $1
      ORDER BY created_at ASC
      LIMIT 1
    `,
		[channel.name]
	);

	const createdById = profileIdsByEmail.get(channel.createdByEmail);

	if (!createdById) {
		throw new Error(`Missing profile id for channel owner ${channel.createdByEmail}`);
	}

	let channelId = existing.rows[0]?.id;

	if (channelId) {
		await client.query(
			`
        UPDATE public.channels
        SET
          description = $2,
          visibility = $3::"ChannelVisibility",
          created_by = $4,
          updated_at = NOW()
        WHERE id = $1
      `,
			[channelId, channel.description, channel.visibility, createdById]
		);
	} else {
		channelId = randomUUID();
		await client.query(
			`
        INSERT INTO public.channels (
          id,
          name,
          description,
          visibility,
          created_by,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4::"ChannelVisibility", $5, NOW(), NOW())
      `,
			[channelId, channel.name, channel.description, channel.visibility, createdById]
		);
	}

	await client.query(`DELETE FROM public.channel_read_states WHERE channel_id = $1`, [channelId]);
	await client.query(`DELETE FROM public.messages WHERE channel_id = $1`, [channelId]);
	await client.query(`DELETE FROM public.channel_members WHERE channel_id = $1`, [channelId]);

	for (const member of channel.members) {
		const userId = profileIdsByEmail.get(member.email);

		if (!userId) {
			throw new Error(`Missing profile id for channel member ${member.email}`);
		}

		await client.query(
			`
        INSERT INTO public.channel_members (
          id,
          channel_id,
          user_id,
          role
        )
        VALUES ($1, $2, $3, $4::"ChannelMemberRole")
      `,
			[randomUUID(), channelId, userId, member.role]
		);
	}

	const insertedMessages = [];

	for (const [index, message] of channel.messages.entries()) {
		const authorId = profileIdsByEmail.get(message.authorEmail);
		const createdAt = buildTimestamp(120 - index * 7);
		const messageId = randomUUID();

		await client.query(
			`
        INSERT INTO public.messages (
          id,
          channel_id,
          author_id,
          content,
          message_type,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, 'text'::"MessageType", $5::timestamptz, $5::timestamptz)
      `,
			[messageId, channelId, authorId, message.content, createdAt]
		);

		insertedMessages.push({
			id: messageId,
			createdAt
		});
	}

	for (const [index, member] of channel.members.entries()) {
		const userId = profileIdsByEmail.get(member.email);
		const lastReadableIndex = Math.max(insertedMessages.length - 1 - index, 0);
		const lastReadMessage = insertedMessages[lastReadableIndex];

		await client.query(
			`
        INSERT INTO public.channel_read_states (
          id,
          channel_id,
          user_id,
          last_read_message_id,
          last_read_at
        )
        VALUES ($1, $2, $3, $4, $5::timestamptz)
      `,
			[randomUUID(), channelId, userId, lastReadMessage.id, lastReadMessage.createdAt]
		);
	}
}

async function findConversationIdsByParticipants(client, participantEmails) {
	const result = await client.query(
		`
      SELECT dcm.conversation_id
      FROM public.direct_conversation_members AS dcm
      JOIN public.profiles AS p
        ON p.id = dcm.user_id
      GROUP BY dcm.conversation_id
      HAVING COUNT(*) = 2
        AND COUNT(*) FILTER (WHERE p.email = ANY($1::text[])) = 2
    `,
		[participantEmails]
	);

	return result.rows.map((row) => row.conversation_id);
}

async function ensureDirectConversation(client, conversation, profileIdsByEmail) {
	const conversationIds = await findConversationIdsByParticipants(client, conversation.participants);

	for (const conversationId of conversationIds) {
		await client.query(`DELETE FROM public.conversation_read_states WHERE conversation_id = $1`, [conversationId]);
		await client.query(`DELETE FROM public.messages WHERE conversation_id = $1`, [conversationId]);
		await client.query(`DELETE FROM public.direct_conversation_members WHERE conversation_id = $1`, [conversationId]);
		await client.query(`DELETE FROM public.direct_conversations WHERE id = $1`, [conversationId]);
	}

	const conversationId = randomUUID();

	await client.query(
		`
      INSERT INTO public.direct_conversations (
        id,
        created_at
      )
      VALUES ($1, NOW())
    `,
		[conversationId]
	);

	for (const email of conversation.participants) {
		const userId = profileIdsByEmail.get(email);

		if (!userId) {
			throw new Error(`Missing profile id for DM participant ${email}`);
		}

		await client.query(
			`
        INSERT INTO public.direct_conversation_members (
          id,
          conversation_id,
          user_id
        )
        VALUES ($1, $2, $3)
      `,
			[randomUUID(), conversationId, userId]
		);
	}

	const insertedMessages = [];

	for (const [index, message] of conversation.messages.entries()) {
		const authorId = profileIdsByEmail.get(message.authorEmail);
		const createdAt = buildTimestamp(45 - index * 5);
		const messageId = randomUUID();

		await client.query(
			`
        INSERT INTO public.messages (
          id,
          conversation_id,
          author_id,
          content,
          message_type,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, 'text'::"MessageType", $5::timestamptz, $5::timestamptz)
      `,
			[messageId, conversationId, authorId, message.content, createdAt]
		);

		insertedMessages.push({
			id: messageId,
			createdAt
		});
	}

	for (const [index, email] of conversation.participants.entries()) {
		const userId = profileIdsByEmail.get(email);
		const lastReadableIndex = Math.max(insertedMessages.length - 1 - index, 0);
		const lastReadMessage = insertedMessages[lastReadableIndex];

		await client.query(
			`
        INSERT INTO public.conversation_read_states (
          id,
          conversation_id,
          user_id,
          last_read_message_id,
          last_read_at
        )
        VALUES ($1, $2, $3, $4, $5::timestamptz)
      `,
			[randomUUID(), conversationId, userId, lastReadMessage.id, lastReadMessage.createdAt]
		);
	}
}

async function seedCoreData() {
	const databaseUrl = requireEnv('DATABASE_URL');
	const client = new Client({ connectionString: databaseUrl });

	await client.connect();

	try {
		await client.query('BEGIN');

		const profileIdsByEmail = await loadProfiles(client);
		await upsertProfiles(client, profileIdsByEmail);

		for (const channel of seedChannels) {
			await ensureChannel(client, channel, profileIdsByEmail);
		}

		for (const conversation of seedDirectConversations) {
			await ensureDirectConversation(client, conversation, profileIdsByEmail);
		}

		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		await client.end();
	}
}

async function main() {
	if (process.env.NODE_ENV === 'production') {
		throw new Error('The seed script is blocked in production.');
	}

	log('seeding auth users...');
	await ensureAuthUsers();

	log('seeding core app data...');
	await seedCoreData();

	log('seed complete');
}

main().catch((error) => {
	process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
	process.exitCode = 1;
});
