DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;

DO $$
BEGIN
    IF to_regprocedure('auth.uid()') IS NOT NULL THEN
        GRANT SELECT ON public.messages TO authenticated;
        GRANT SELECT ON public.channel_members TO authenticated;
        GRANT SELECT ON public.direct_conversation_members TO authenticated;

        ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.direct_conversation_members ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "users can read their channel memberships" ON public.channel_members;
        DROP POLICY IF EXISTS "users can read their direct conversation memberships" ON public.direct_conversation_members;
        DROP POLICY IF EXISTS "members can read channel messages" ON public.messages;
        DROP POLICY IF EXISTS "participants can read direct messages" ON public.messages;

        CREATE POLICY "users can read their channel memberships"
        ON public.channel_members
        FOR SELECT
        TO authenticated
        USING (
            user_id = auth.uid()
        );

        CREATE POLICY "users can read their direct conversation memberships"
        ON public.direct_conversation_members
        FOR SELECT
        TO authenticated
        USING (
            user_id = auth.uid()
        );

        CREATE POLICY "members can read channel messages"
        ON public.messages
        FOR SELECT
        TO authenticated
        USING (
            channel_id IS NOT NULL
            AND EXISTS (
                SELECT 1
                FROM public.channel_members cm
                WHERE cm.channel_id = messages.channel_id
                  AND cm.user_id = auth.uid()
            )
        );

        CREATE POLICY "participants can read direct messages"
        ON public.messages
        FOR SELECT
        TO authenticated
        USING (
            conversation_id IS NOT NULL
            AND EXISTS (
                SELECT 1
                FROM public.direct_conversation_members dcm
                WHERE dcm.conversation_id = messages.conversation_id
                  AND dcm.user_id = auth.uid()
            )
        );
    END IF;
END $$;
