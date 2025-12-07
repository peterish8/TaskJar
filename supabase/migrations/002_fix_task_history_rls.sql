-- Fix RLS policy for task_history table
-- The trigger function needs to be able to insert into task_history

-- Drop the policy if it exists (to avoid errors on re-run)
DROP POLICY IF EXISTS "Users can insert own task history" ON task_history;

-- Add INSERT policy for task_history (allows users to insert their own history)
CREATE POLICY "Users can insert own task history" ON task_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Make the trigger function SECURITY DEFINER (bypasses RLS)
-- This is the recommended approach as it ensures the trigger always works
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
$$ language 'plpgsql' SECURITY DEFINER;

