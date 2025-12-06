-- TaskJar Database Schema with RLS Policies
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- USER PROFILES TABLE
-- ==========================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT DEFAULT 'Student',
  initials TEXT CHECK (length(initials) >= 1 AND length(initials) <= 2),
  bg_color TEXT DEFAULT '#1DB954',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- XP Values
  xp_light INTEGER DEFAULT 5,
  xp_standard INTEGER DEFAULT 10,
  xp_challenging INTEGER DEFAULT 15,

  -- Jar Target
  jar_target INTEGER DEFAULT 100,

  -- Emojis
  emoji_priority_urgent TEXT DEFAULT '🔴',
  emoji_priority_scheduled TEXT DEFAULT '🟡',
  emoji_priority_optional TEXT DEFAULT '🟢',
  emoji_difficulty_light TEXT DEFAULT '🍃',
  emoji_difficulty_standard TEXT DEFAULT '⚡',
  emoji_difficulty_challenging TEXT DEFAULT '🔥',

  -- Parent Lock
  parent_lock_enabled BOOLEAN DEFAULT FALSE,
  parent_lock_password TEXT,
  parent_lock_security_question TEXT,
  parent_lock_security_answer TEXT,

  -- Preferences
  sound_enabled BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'dark',

  UNIQUE(user_id)
);

-- ==========================================
-- TASKS TABLE
-- ==========================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('urgent', 'scheduled', 'optional')) DEFAULT 'optional',
  difficulty TEXT CHECK (difficulty IN ('light', 'standard', 'challenging')) DEFAULT 'standard',
  xp_value INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_for DATE,

  -- Computed emoji fields (can be derived from user preferences)
  priority_emoji TEXT,
  difficulty_emoji TEXT
);

-- ==========================================
-- JARS TABLE
-- ==========================================
CREATE TABLE jars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'My Jar',
  current_xp INTEGER DEFAULT 0,
  target_xp INTEGER NOT NULL DEFAULT 100,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- JARS_TASKS RELATIONSHIP TABLE (many-to-many)
CREATE TABLE jar_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jar_id UUID REFERENCES jars(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(jar_id, task_id)
);

-- ==========================================
-- WEEKLY DUMP TASKS
-- ==========================================
CREATE TABLE weekly_dump_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  difficulty TEXT CHECK (difficulty IN ('easy', 'moderate', 'hard')) DEFAULT 'moderate',
  scheduled_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- For cycling tasks through time
  is_template BOOLEAN DEFAULT FALSE,
  cycle_days INTEGER DEFAULT 7, -- Days between recurrences
  last_scheduled DATE
);

-- ==========================================
-- ARCHIVED WEEKS (for weekly dump history)
-- ==========================================
CREATE TABLE archived_weeks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  dates DATE[] NOT NULL,
  tasks JSONB NOT NULL, -- Store the full task snapshots
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- TASK HISTORY/AUDIT LOG
-- ==========================================
CREATE TABLE task_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  action TEXT CHECK (action IN ('created', 'updated', 'completed', 'deleted')) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ANALYTICS / COMPLETION TRACKING
-- ==========================================
CREATE TABLE daily_completion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completion_percentage DECIMAL(5,2) DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ==========================================
-- UPDATED_AT TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jars_updated_at BEFORE UPDATE ON jars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weekly_dump_tasks_updated_at BEFORE UPDATE ON weekly_dump_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_completion_updated_at BEFORE UPDATE ON daily_completion FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- TASK HISTORY TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO task_history (user_id, task_id, action, new_values)
        VALUES (NEW.user_id, NEW.id, 'created', row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO task_history (user_id, task_id, action, old_values, new_values)
        VALUES (NEW.user_id, NEW.id, 'updated', row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO task_history (user_id, task_id, action, old_values)
        VALUES (OLD.user_id, OLD.id, 'deleted', row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER task_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION log_task_changes();

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE jars ENABLE ROW LEVEL SECURITY;
ALTER TABLE jar_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_dump_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_completion ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tasks: Users can only see/edit their own tasks
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Jars: Users can only see/edit their own jars
CREATE POLICY "Users can view own jars" ON jars
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jars" ON jars
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jars" ON jars
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own jars" ON jars
    FOR DELETE USING (auth.uid() = user_id);

-- Jar Tasks: Users can only see/edit jar-task relationships for their jars
CREATE POLICY "Users can view own jar tasks" ON jar_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jars
            WHERE jars.id = jar_tasks.jar_id
            AND jars.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own jar tasks" ON jar_tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM jars
            WHERE jars.id = jar_tasks.jar_id
            AND jars.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own jar tasks" ON jar_tasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM jars
            WHERE jars.id = jar_tasks.jar_id
            AND jars.user_id = auth.uid()
        )
    );

-- Weekly Dump Tasks: Users can only see/edit their own weekly tasks
CREATE POLICY "Users can view own weekly tasks" ON weekly_dump_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly tasks" ON weekly_dump_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly tasks" ON weekly_dump_tasks
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly tasks" ON weekly_dump_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Archived Weeks: Users can only see/edit their own archived weeks
CREATE POLICY "Users can view own archived weeks" ON archived_weeks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own archived weeks" ON archived_weeks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own archived weeks" ON archived_weeks
    FOR DELETE USING (auth.uid() = user_id);

-- Task History: Users can only see history for their own tasks
CREATE POLICY "Users can view own task history" ON task_history
    FOR SELECT USING (auth.uid() = user_id);

-- Daily Completion: Users can only see/edit their own completion data
CREATE POLICY "Users can view own daily completion" ON daily_completion
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily completion" ON daily_completion
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily completion" ON daily_completion
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, student_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student'));
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get weekly dump tasks for a specific date range
CREATE OR REPLACE FUNCTION get_weekly_tasks_for_date_range(user_uuid UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  priority TEXT,
  difficulty TEXT,
  scheduled_date DATE,
  completed BOOLEAN,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wdt.id,
    wdt.name,
    wdt.description,
    wdt.priority,
    wdt.difficulty,
    wdt.scheduled_date,
    wdt.completed,
    wdt.completed_at,
    wdt.created_at
  FROM weekly_dump_tasks wdt
  WHERE wdt.user_id = user_uuid
    AND wdt.scheduled_date >= start_date
    AND wdt.scheduled_date <= end_date
  ORDER BY wdt.scheduled_date, wdt.created_at;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to cycle weekly dump templates
CREATE OR REPLACE FUNCTION cycle_weekly_dump_templates()
RETURNS VOID AS $$
DECLARE
  template_record RECORD;
  next_date DATE;
BEGIN
  FOR template_record IN
    SELECT * FROM weekly_dump_tasks
    WHERE is_template = true
    AND (last_scheduled IS NULL OR last_scheduled + cycle_days <= CURRENT_DATE)
  LOOP
    next_date := COALESCE(template_record.last_scheduled + template_record.cycle_days, CURRENT_DATE);

    -- Insert new instance of the template
    INSERT INTO weekly_dump_tasks (
      user_id,
      name,
      description,
      priority,
      difficulty,
      scheduled_date,
      is_template,
      cycle_days,
      last_scheduled
    )
    VALUES (
      template_record.user_id,
      template_record.name,
      template_record.description,
      template_record.priority,
      template_record.difficulty,
      next_date,
      false, -- This is not a template, it's an instance
      template_record.cycle_days,
      next_date
    );

    -- Update the template's last_scheduled
    UPDATE weekly_dump_tasks
    SET last_scheduled = next_date
    WHERE id = template_record.id;
  END LOOP;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_jars_user_id ON jars(user_id);
CREATE INDEX idx_jar_tasks_jar_id ON jar_tasks(jar_id);
CREATE INDEX idx_jar_tasks_task_id ON jar_tasks(task_id);
CREATE INDEX idx_weekly_dump_tasks_user_id ON weekly_dump_tasks(user_id);
CREATE INDEX idx_weekly_dump_tasks_scheduled_date ON weekly_dump_tasks(scheduled_date);
CREATE INDEX idx_archived_weeks_user_id ON archived_weeks(user_id);
CREATE INDEX idx_task_history_user_id ON task_history(user_id);
CREATE INDEX idx_task_history_task_id ON task_history(task_id);
CREATE INDEX idx_daily_completion_user_id ON daily_completion(user_id);
CREATE INDEX idx_daily_completion_date ON daily_completion(date);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
