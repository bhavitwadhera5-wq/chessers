CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_id uuid,
  reported_username text,
  game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  engine_match numeric,
  accuracy numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can file reports" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

CREATE TABLE public.fair_play_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  player_id uuid NOT NULL,
  engine_match numeric NOT NULL,
  accuracy numeric NOT NULL,
  moves integer NOT NULL,
  suspicion text NOT NULL DEFAULT 'clean',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.fair_play_flags TO authenticated;
GRANT ALL ON public.fair_play_flags TO service_role;
ALTER TABLE public.fair_play_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view their own fair play records" ON public.fair_play_flags
  FOR SELECT TO authenticated USING (auth.uid() = player_id);

CREATE UNIQUE INDEX idx_flags_game_player ON public.fair_play_flags (game_id, player_id);
CREATE INDEX idx_reports_reporter ON public.reports (reporter_id, created_at DESC);