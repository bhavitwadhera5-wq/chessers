ALTER TABLE public.games
  ALTER COLUMN white_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS time_control integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS white_ms integer,
  ADD COLUMN IF NOT EXISTS black_ms integer,
  ADD COLUMN IF NOT EXISTS turn_started_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS elo_applied boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS elo integer NOT NULL DEFAULT 1000;

DROP POLICY IF EXISTS "Users can create their own games" ON public.games;
CREATE POLICY "Users can create their own games"
ON public.games FOR INSERT TO authenticated
WITH CHECK (auth.uid() = white_id OR auth.uid() = black_id);

DROP POLICY IF EXISTS "Players can update their games" ON public.games;
CREATE POLICY "Players can update their games"
ON public.games FOR UPDATE TO authenticated
USING (
  auth.uid() = white_id
  OR auth.uid() = black_id
  OR (status = 'waiting' AND (black_id IS NULL OR white_id IS NULL))
)
WITH CHECK (auth.uid() = white_id OR auth.uid() = black_id);