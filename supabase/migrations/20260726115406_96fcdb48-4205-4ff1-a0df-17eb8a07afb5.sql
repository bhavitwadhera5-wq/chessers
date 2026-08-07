
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by signed in users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  white_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  black_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_username TEXT,
  fen TEXT NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  status TEXT NOT NULL DEFAULT 'waiting',
  result TEXT,
  last_move TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.games TO authenticated;
GRANT ALL ON public.games TO service_role;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players and open lobby can view games" ON public.games FOR SELECT TO authenticated
  USING (auth.uid() = white_id OR auth.uid() = black_id OR status = 'waiting');
CREATE POLICY "Users can create their own games" ON public.games FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = white_id);
CREATE POLICY "Players can update their games" ON public.games FOR UPDATE TO authenticated
  USING (auth.uid() = white_id OR auth.uid() = black_id OR (status = 'waiting' AND black_id IS NULL))
  WITH CHECK (auth.uid() = white_id OR auth.uid() = black_id);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER games_updated_at BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'player_' || substr(NEW.id::text, 1, 8)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
