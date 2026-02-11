CREATE TABLE public.activity_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_identifier TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_snapshots_recorded_at ON public.activity_snapshots (recorded_at DESC);
CREATE INDEX idx_activity_snapshots_user ON public.activity_snapshots (user_identifier, recorded_at DESC);

ALTER TABLE public.activity_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert snapshots" ON public.activity_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view snapshots" ON public.activity_snapshots FOR SELECT USING (true);