CREATE TABLE IF NOT EXISTS public.forum_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  user_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_thread_id FOREIGN KEY (thread_id) REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_id_post FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_forum_threads_user ON public.forum_threads (user_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_created ON public.forum_threads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread ON public.forum_posts (thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user ON public.forum_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON public.forum_posts (created_at DESC);

ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to forum_threads" ON public.forum_threads;
CREATE POLICY "Allow public read access to forum_threads"
  ON public.forum_threads
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to create forum_threads" ON public.forum_threads;
CREATE POLICY "Allow authenticated users to create forum_threads"
  ON public.forum_threads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update own forum_threads" ON public.forum_threads;
CREATE POLICY "Allow users to update own forum_threads"
  ON public.forum_threads
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete own forum_threads" ON public.forum_threads;
CREATE POLICY "Allow users to delete own forum_threads"
  ON public.forum_threads
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public read access to forum_posts" ON public.forum_posts;
CREATE POLICY "Allow public read access to forum_posts"
  ON public.forum_posts
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to create forum_posts" ON public.forum_posts;
CREATE POLICY "Allow authenticated users to create forum_posts"
  ON public.forum_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update own forum_posts" ON public.forum_posts;
CREATE POLICY "Allow users to update own forum_posts"
  ON public.forum_posts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete own forum_posts" ON public.forum_posts;
CREATE POLICY "Allow users to delete own forum_posts"
  ON public.forum_posts
  FOR DELETE
  USING (auth.uid() = user_id);
