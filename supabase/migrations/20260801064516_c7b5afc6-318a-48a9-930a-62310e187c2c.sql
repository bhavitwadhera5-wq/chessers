ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS bot_name text,
  ADD COLUMN IF NOT EXISTS bot_elo integer;