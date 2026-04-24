CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO "public"."profiles" (
        "id",
        "email",
        "display_name",
        "created_at",
        "updated_at"
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NOW(),
        NOW()
    )
    ON CONFLICT ("id") DO NOTHING;

    RETURN NEW;
END;
$$;

ALTER TABLE "public"."profiles"
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
