import { supabase } from './supabase';
import type { Task, Jar, WeeklyTask, ArchivedWeek, UserProfile, AppSettings } from '../app/types';

// ==========================================
// USER PROFILE SERVICES
// ==========================================
export const userProfileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async createProfile(userId: string, profile: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        ...profile,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSettings(userId: string): Promise<AppSettings> {
    const profile = await this.getProfile(userId);

    return {
      studentName: profile.student_name,
      xpValues: {
        light: profile.xp_light,
        standard: profile.xp_standard,
        challenging: profile.xp_challenging,
      },
      jarTarget: profile.jar_target,
      emojis: {
        priority: {
          urgent: profile.emoji_priority_urgent,
          scheduled: profile.emoji_priority_scheduled,
          optional: profile.emoji_priority_optional,
        },
        difficulty: {
          light: profile.emoji_difficulty_light,
          standard: profile.emoji_difficulty_standard,
          challenging: profile.emoji_difficulty_challenging,
        },
      },
      parentLock: {
        enabled: profile.parent_lock_enabled,
        password: profile.parent_lock_password,
        securityQuestion: profile.parent_lock_security_question,
        securityAnswer: profile.parent_lock_security_answer,
      },
      preferences: {
        soundEnabled: profile.sound_enabled,
        theme: profile.theme,
      },
    };
  },

  async updateSettings(userId: string, settings: AppSettings) {
    const updates = {
      student_name: settings.studentName,
      xp_light: settings.xpValues.light,
      xp_standard: settings.xpValues.standard,
      xp_challenging: settings.xpValues.challenging,
      jar_target: settings.jarTarget,
      emoji_priority_urgent: settings.emojis.priority.urgent,
      emoji_priority_scheduled: settings.emojis.priority.scheduled,
      emoji_priority_optional: settings.emojis.priority.optional,
      emoji_difficulty_light: settings.emojis.difficulty.light,
      emoji_difficulty_standard: settings.emojis.difficulty.standard,
      emoji_difficulty_challenging: settings.emojis.difficulty.challenging,
      parent_lock_enabled: settings.parentLock.enabled,
      parent_lock_password: settings.parentLock.password,
      parent_lock_security_question: settings.parentLock.securityQuestion,
      parent_lock_security_answer: settings.parentLock.securityAnswer,
      sound_enabled: settings.preferences.soundEnabled,
      theme: settings.preferences.theme,
    };

    return await this.updateProfile(userId, updates);
  },
};

// ==========================================
// TASKS SERVICES
// ==========================================
export const taskService = {
  async getTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(task => ({
      id: task.id,
      name: task.name,
      description: task.description || '',
      priority: task.priority as Task['priority'],
      difficulty: task.difficulty as Task['difficulty'],
      xpValue: task.xp_value,
      completed: task.completed,
      completedAt: task.completed_at ? new Date(task.completed_at).getTime() : undefined,
      createdAt: new Date(task.created_at).getTime(),
      scheduledFor: task.scheduled_for,
      priorityEmoji: task.priority_emoji,
      difficultyEmoji: task.difficulty_emoji,
    }));
  },

  async createTask(userId: string, taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        name: taskData.name,
        description: taskData.description,
        priority: taskData.priority,
        difficulty: taskData.difficulty,
        xp_value: taskData.xpValue,
        completed: taskData.completed,
        completed_at: taskData.completedAt ? new Date(taskData.completedAt) : null,
        scheduled_for: taskData.scheduledFor,
        priority_emoji: taskData.priorityEmoji,
        difficulty_emoji: taskData.difficultyEmoji,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      priority: data.priority,
      difficulty: data.difficulty,
      xpValue: data.xp_value,
      completed: data.completed,
      completedAt: data.completed_at ? new Date(data.completed_at).getTime() : undefined,
      createdAt: new Date(data.created_at).getTime(),
      scheduledFor: data.scheduled_for,
      priorityEmoji: data.priority_emoji,
      difficultyEmoji: data.difficulty_emoji,
    };
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty;
    if (updates.xpValue !== undefined) updateData.xp_value = updates.xpValue;
    if (updates.completed !== undefined) updateData.completed = updates.completed;
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt ? new Date(updates.completedAt) : null;
    if (updates.scheduledFor !== undefined) updateData.scheduled_for = updates.scheduledFor;
    if (updates.priorityEmoji !== undefined) updateData.priority_emoji = updates.priorityEmoji;
    if (updates.difficultyEmoji !== undefined) updateData.difficulty_emoji = updates.difficultyEmoji;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      priority: data.priority,
      difficulty: data.difficulty,
      xpValue: data.xp_value,
      completed: data.completed,
      completedAt: data.completed_at ? new Date(data.completed_at).getTime() : undefined,
      createdAt: new Date(data.created_at).getTime(),
      scheduledFor: data.scheduled_for,
      priorityEmoji: data.priority_emoji,
      difficultyEmoji: data.difficulty_emoji,
    };
  },

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  },

  async completeTask(taskId: string): Promise<Task> {
    return await this.updateTask(taskId, {
      completed: true,
      completedAt: Date.now(),
    });
  },

  async uncompleteTask(taskId: string): Promise<Task> {
    return await this.updateTask(taskId, {
      completed: false,
      completedAt: undefined,
    });
  },
};

// ==========================================
// JARS SERVICES
// ==========================================
export const jarService = {
  async getJars(userId: string): Promise<Jar[]> {
    const { data, error } = await supabase
      .from('jars')
      .select(`
        *,
        jar_tasks (
          task_id
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(jar => ({
      id: jar.id,
      name: jar.name,
      currentXP: jar.current_xp,
      targetXP: jar.target_xp,
      completed: jar.completed,
      completedAt: jar.completed_at ? new Date(jar.completed_at).getTime() : undefined,
      tasks: jar.jar_tasks?.map((jt: any) => jt.task_id) || [],
    }));
  },

  async createJar(userId: string, jarData: Omit<Jar, 'id'>): Promise<Jar> {
    const { data, error } = await supabase
      .from('jars')
      .insert({
        user_id: userId,
        name: jarData.name,
        current_xp: jarData.currentXP,
        target_xp: jarData.targetXP,
        completed: jarData.completed,
        completed_at: jarData.completedAt ? new Date(jarData.completedAt) : null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      currentXP: data.current_xp,
      targetXP: data.target_xp,
      completed: data.completed,
      completedAt: data.completed_at ? new Date(data.completed_at).getTime() : undefined,
      tasks: [],
    };
  },

  async updateJar(jarId: string, updates: Partial<Jar>): Promise<Jar> {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.currentXP !== undefined) updateData.current_xp = updates.currentXP;
    if (updates.targetXP !== undefined) updateData.target_xp = updates.targetXP;
    if (updates.completed !== undefined) updateData.completed = updates.completed;
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt ? new Date(updates.completedAt) : null;

    const { data, error } = await supabase
      .from('jars')
      .update(updateData)
      .eq('id', jarId)
      .select(`
        *,
        jar_tasks (
          task_id
        )
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      currentXP: data.current_xp,
      targetXP: data.target_xp,
      completed: data.completed,
      completedAt: data.completed_at ? new Date(data.completed_at).getTime() : undefined,
      tasks: data.jar_tasks?.map((jt: any) => jt.task_id) || [],
    };
  },

  async deleteJar(jarId: string): Promise<void> {
    const { error } = await supabase
      .from('jars')
      .delete()
      .eq('id', jarId);

    if (error) throw error;
  },

  async addTaskToJar(jarId: string, taskId: string): Promise<void> {
    const { error } = await supabase
      .from('jar_tasks')
      .insert({
        jar_id: jarId,
        task_id: taskId,
      });

    if (error) throw error;
  },

  async removeTaskFromJar(jarId: string, taskId: string): Promise<void> {
    const { error } = await supabase
      .from('jar_tasks')
      .delete()
      .eq('jar_id', jarId)
      .eq('task_id', taskId);

    if (error) throw error;
  },
};

// ==========================================
// WEEKLY DUMP SERVICES
// ==========================================
export const weeklyDumpService = {
  async getWeeklyTasks(userId: string, startDate?: Date, endDate?: Date): Promise<WeeklyTask[]> {
    let query = supabase
      .from('weekly_dump_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: true });

    if (startDate) {
      query = query.gte('scheduled_date', startDate.toISOString().split('T')[0]);
    }
    if (endDate) {
      query = query.lte('scheduled_date', endDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(task => ({
      id: task.id,
      name: task.name,
      description: task.description,
      priority: task.priority as WeeklyTask['priority'],
      difficulty: task.difficulty as WeeklyTask['difficulty'],
      scheduledDate: task.scheduled_date,
      completed: task.completed,
      completedAt: task.completed_at ? new Date(task.completed_at).getTime() : undefined,
      createdAt: new Date(task.created_at).getTime(),
    }));
  },

  async createWeeklyTask(userId: string, taskData: Omit<WeeklyTask, 'id' | 'createdAt'>): Promise<WeeklyTask> {
    const { data, error } = await supabase
      .from('weekly_dump_tasks')
      .insert({
        user_id: userId,
        name: taskData.name,
        description: taskData.description,
        priority: taskData.priority,
        difficulty: taskData.difficulty,
        scheduled_date: taskData.scheduledDate,
        completed: taskData.completed,
        completed_at: taskData.completedAt ? new Date(taskData.completedAt) : null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      priority: data.priority,
      difficulty: data.difficulty,
      scheduledDate: data.scheduled_date,
      completed: data.completed,
      completedAt: data.completed_at ? new Date(data.completed_at).getTime() : undefined,
      createdAt: new Date(data.created_at).getTime(),
    };
  },

  async updateWeeklyTask(taskId: string, updates: Partial<WeeklyTask>): Promise<WeeklyTask> {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty;
    if (updates.scheduledDate !== undefined) updateData.scheduled_date = updates.scheduledDate;
    if (updates.completed !== undefined) updateData.completed = updates.completed;
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt ? new Date(updates.completedAt) : null;

    const { data, error } = await supabase
      .from('weekly_dump_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      priority: data.priority,
      difficulty: data.difficulty,
      scheduledDate: data.scheduled_date,
      completed: data.completed,
      completedAt: data.completed_at ? new Date(data.completed_at).getTime() : undefined,
      createdAt: new Date(data.created_at).getTime(),
    };
  },

  async deleteWeeklyTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('weekly_dump_tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  },

  async completeWeeklyTask(taskId: string): Promise<WeeklyTask> {
    return await this.updateWeeklyTask(taskId, {
      completed: true,
      completedAt: Date.now(),
    });
  },

  async archiveWeek(userId: string, weekData: ArchivedWeek): Promise<void> {
    const { error } = await supabase
      .from('archived_weeks')
      .insert({
        user_id: userId,
        start_date: weekData.startDateISO,
        dates: weekData.dates,
        tasks: weekData.tasks,
      });

    if (error) throw error;
  },

  async getArchivedWeeks(userId: string): Promise<ArchivedWeek[]> {
    const { data, error } = await supabase
      .from('archived_weeks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(week => ({
      id: week.id,
      startDateISO: week.start_date,
      dates: week.dates,
      tasks: week.tasks,
      createdAtISO: new Date(week.created_at).toISOString(),
    }));
  },
};

// ==========================================
// ANALYTICS SERVICES
// ==========================================
export const analyticsService = {
  async getDailyCompletion(userId: string): Promise<Array<{ dateISO: string; completionPct: number }>> {
    const { data, error } = await supabase
      .from('daily_completion')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) throw error;

    return data.map(record => ({
      dateISO: record.date,
      completionPct: record.completion_percentage,
    }));
  },

  async updateDailyCompletion(userId: string, date: string, completionPct: number): Promise<void> {
    const { error } = await supabase
      .from('daily_completion')
      .upsert({
        user_id: userId,
        date,
        completion_percentage: completionPct,
      }, {
        onConflict: 'user_id,date'
      });

    if (error) throw error;
  },

  async getTodayCompletion(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_completion')
      .select('completion_percentage')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data?.completion_percentage || 0;
  },
};
