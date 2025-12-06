-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  difficulty TEXT CHECK (difficulty IN ('easy', 'moderate', 'hard')) DEFAULT 'moderate',
  status TEXT CHECK (status IN ('pending', 'completed', 'archived')) DEFAULT 'pending',
  scheduled_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jars table (task containers/categories)
CREATE TABLE IF NOT EXISTS public.jars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jar_tasks junction table
CREATE TABLE IF NOT EXISTS public.jar_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jar_id UUID REFERENCES public.jars(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(jar_id, task_id)
);

-- Create weekly_dumps table
CREATE TABLE IF NOT EXISTS public.weekly_dumps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  prompt TEXT,
  tasks_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jar_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_dumps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own jars" ON public.jars FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own jars" ON public.jars FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own jars" ON public.jars FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own jars" ON public.jars FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own jar_tasks" ON public.jar_tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.jars WHERE jars.id = jar_tasks.jar_id AND jars.user_id = auth.uid())
);
CREATE POLICY "Users can insert own jar_tasks" ON public.jar_tasks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.jars WHERE jars.id = jar_tasks.jar_id AND jars.user_id = auth.uid())
);
CREATE POLICY "Users can delete own jar_tasks" ON public.jar_tasks FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.jars WHERE jars.id = jar_tasks.jar_id AND jars.user_id = auth.uid())
);

CREATE POLICY "Users can view own weekly_dumps" ON public.weekly_dumps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weekly_dumps" ON public.weekly_dumps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weekly_dumps" ON public.weekly_dumps FOR UPDATE USING (auth.uid() = user_id);