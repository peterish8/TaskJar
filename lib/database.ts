import { supabase } from './supabase';

export interface Task {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'moderate' | 'hard';
  status: 'pending' | 'completed' | 'archived';
  scheduled_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Jar {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  total_tasks: number;
  completed_tasks: number;
  created_at: string;
  updated_at: string;
}

export interface WeeklyDump {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  prompt?: string;
  tasks_generated: number;
  created_at: string;
}

// Task operations
export const createTask = async (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...task, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserTasks = async (status?: string, date?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (date) query = query.eq('scheduled_date', date);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const updateTask = async (id: string, updates: Partial<Task>) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const completeTask = async (id: string) => {
  return updateTask(id, { 
    status: 'completed', 
    completed_at: new Date().toISOString() 
  });
};

// Jar operations
export const createJar = async (jar: Omit<Jar, 'id' | 'user_id' | 'total_tasks' | 'completed_tasks' | 'created_at' | 'updated_at'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('jars')
    .insert({ ...jar, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserJars = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('jars')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Weekly dump operations
export const createWeeklyDump = async (weekStart: string, weekEnd: string, prompt: string, tasksCount: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('weekly_dumps')
    .insert({
      user_id: user.id,
      week_start: weekStart,
      week_end: weekEnd,
      prompt,
      tasks_generated: tasksCount
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserWeeklyDumps = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('weekly_dumps')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};