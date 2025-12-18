CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  forum_handle text,
  forum_avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid,
  post_id uuid,
  user_id uuid NOT NULL,
  file_url text NOT NULL,
  file_name text,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_thread_id FOREIGN KEY (thread_id) REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_id FOREIGN KEY (post_id) REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to user_profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Allow users to update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow users to insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow public read access to forum_attachments" ON public.forum_attachments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to upload attachments" ON public.forum_attachments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to delete own attachments" ON public.forum_attachments FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles (id);
CREATE INDEX IF NOT EXISTS idx_forum_attachments_thread ON public.forum_attachments (thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_attachments_post ON public.forum_attachments (post_id);
CREATE INDEX IF NOT EXISTS idx_forum_attachments_user ON public.forum_attachments (user_id);
