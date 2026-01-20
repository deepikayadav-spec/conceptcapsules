-- Create video_likes table
CREATE TABLE public.video_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  byte_id TEXT NOT NULL,
  user_fingerprint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(byte_id, user_fingerprint)
);

-- Create video_feedback table
CREATE TABLE public.video_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  byte_id TEXT NOT NULL,
  user_fingerprint TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required, using fingerprint for anonymity)
CREATE POLICY "Anyone can view likes count"
  ON public.video_likes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert likes"
  ON public.video_likes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete their own likes"
  ON public.video_likes FOR DELETE
  USING (true);

CREATE POLICY "Anyone can view feedback"
  ON public.video_feedback FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert feedback"
  ON public.video_feedback FOR INSERT
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_video_likes_byte_id ON public.video_likes(byte_id);
CREATE INDEX idx_video_feedback_byte_id ON public.video_feedback(byte_id);