ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Update trigger to use name from allowed_emails if set
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
BEGIN
  SELECT full_name INTO v_full_name
  FROM public.allowed_emails
  WHERE email = new.email AND full_name IS NOT NULL;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(v_full_name, new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    CASE WHEN new.email = current_setting('app.admin_email', true) THEN 'admin' ELSE 'member' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.allowed_emails TO service_role;
