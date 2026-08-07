ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason text,
  ADD COLUMN IF NOT EXISTS banned_at timestamp with time zone;

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));