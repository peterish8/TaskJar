import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskService, jarService, weeklyDumpService, analyticsService, userProfileService } from './supabase-services';
import { migrationService } from './migration';
import type { Task, Jar, WeeklyTask, ArchivedWeek, AppSettings } from '../app/types';

// Default settings
const defaultSettings: AppSettings = {
  studentName: "Student",
  xpValues: {
    light: 5,
    standard: 10,
    challenging: 15,
  },
  jarTarget: 100,
  emojis: {
    priority: {
      urgent: "🔴",
      scheduled: "🟡",
      optional: "🟢",
    },
    difficulty: {
      light: "🍃",
      standard: "⚡",
      challenging: "🔥",
    },
  },
  parentLock: {
    enabled: false,
    password: "",
    securityQuestion: "",
    securityAnswer: "",
  },
  preferences: {
    soundEnabled: true,
    theme: "dark",
  },
};

export function useSupabaseData() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [jars, setJars] = useState<Jar[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([]);
  const [archivedWeeks, setArchivedWeeks] = useState<ArchivedWeek[]>([]);

  // Initialize data when user logs in
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const initializeUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Run migration if needed
        await migrationService.migrateAllUserData(user.id, defaultSettings);

        // Load all data
        await Promise.all([
          loadSettings(),
          loadTasks(),
          loadJars(),
          loadWeeklyTasks(),
          loadArchivedWeeks(),
        ]);

        console.log('✅ User data loaded successfully');
      } catch (err) {
        console.error('❌ Failed to initialize user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeUserData();
  }, [user]);

  // Settings functions
  const loadSettings = useCallback(async () => {
    if (!user) return;
    try {
      const data = await userProfileService.getSettings(user.id);
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      // If profile doesn't exist, create it
      if (error.code === 'PGRST116') {
        await migrationService.migrateUserSettings(user.id, defaultSettings);
        const data = await userProfileService.getSettings(user.id);
        setSettings(data);
      }
    }
  }, [user]);

  const updateSettings = useCallback(async (newSettings: AppSettings) => {
    if (!user) return;
    try {
      await userProfileService.updateSettings(user.id, newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }, [user]);

  // Task functions
  const loadTasks = useCallback(async () => {
    if (!user) return;
    try {
      const data = await taskService.getTasks(user.id);
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, [user]);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      const newTask = await taskService.createTask(user.id, taskData);
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (error) {
      console.error('Failed to add task:', error);
      throw error;
    }
  }, [user]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const updatedTask = await taskService.updateTask(taskId, updates);
      setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
      return updatedTask;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }, []);

  const completeTask = useCallback(async (taskId: string) => {
    return await updateTask(taskId, { completed: true, completedAt: Date.now() });
  }, [updateTask]);

  const uncompleteTask = useCallback(async (taskId: string) => {
    return await updateTask(taskId, { completed: false, completedAt: undefined });
  }, [updateTask]);

  // Jar functions
  const loadJars = useCallback(async () => {
    if (!user) return;
    try {
      const data = await jarService.getJars(user.id);
      setJars(data);
    } catch (error) {
      console.error('Failed to load jars:', error);
    }
  }, [user]);

  const addJar = useCallback(async (jarData: Omit<Jar, 'id'>) => {
    if (!user) return;
    try {
      const newJar = await jarService.createJar(user.id, jarData);
      setJars(prev => [newJar, ...prev]);
      return newJar;
    } catch (error) {
      console.error('Failed to add jar:', error);
      throw error;
    }
  }, [user]);

  const updateJar = useCallback(async (jarId: string, updates: Partial<Jar>) => {
    try {
      const updatedJar = await jarService.updateJar(jarId, updates);
      setJars(prev => prev.map(jar => jar.id === jarId ? updatedJar : jar));
      return updatedJar;
    } catch (error) {
      console.error('Failed to update jar:', error);
      throw error;
    }
  }, []);

  const deleteJar = useCallback(async (jarId: string) => {
    try {
      await jarService.deleteJar(jarId);
      setJars(prev => prev.filter(jar => jar.id !== jarId));
    } catch (error) {
      console.error('Failed to delete jar:', error);
      throw error;
    }
  }, []);

  const addTaskToJar = useCallback(async (jarId: string, taskId: string) => {
    try {
      await jarService.addTaskToJar(jarId, taskId);
      // Refresh jars to get updated task lists
      await loadJars();
    } catch (error) {
      console.error('Failed to add task to jar:', error);
      throw error;
    }
  }, [loadJars]);

  const removeTaskFromJar = useCallback(async (jarId: string, taskId: string) => {
    try {
      await jarService.removeTaskFromJar(jarId, taskId);
      // Refresh jars to get updated task lists
      await loadJars();
    } catch (error) {
      console.error('Failed to remove task from jar:', error);
      throw error;
    }
  }, [loadJars]);

  // Weekly dump functions
  const loadWeeklyTasks = useCallback(async () => {
    if (!user) return;
    try {
      const data = await weeklyDumpService.getWeeklyTasks(user.id);
      setWeeklyTasks(data);
    } catch (error) {
      console.error('Failed to load weekly tasks:', error);
    }
  }, [user]);

  const addWeeklyTask = useCallback(async (taskData: Omit<WeeklyTask, 'id' | 'createdAt'>): Promise<WeeklyTask> => {
    if (!user) throw new Error('User not authenticated');
    try {
      const newTask = await weeklyDumpService.createWeeklyTask(user.id, taskData);
      setWeeklyTasks(prev => [...prev, newTask].sort((a, b) =>
        new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      ));
      return newTask;
    } catch (error) {
      console.error('Failed to add weekly task:', error);
      throw error;
    }
  }, [user]);

  const updateWeeklyTask = useCallback(async (taskId: string, updates: Partial<WeeklyTask>) => {
    try {
      const updatedTask = await weeklyDumpService.updateWeeklyTask(taskId, updates);
      setWeeklyTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
      return updatedTask;
    } catch (error) {
      console.error('Failed to update weekly task:', error);
      throw error;
    }
  }, []);

  const deleteWeeklyTask = useCallback(async (taskId: string) => {
    try {
      await weeklyDumpService.deleteWeeklyTask(taskId);
      setWeeklyTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete weekly task:', error);
      throw error;
    }
  }, []);

  const completeWeeklyTask = useCallback(async (taskId: string) => {
    return await updateWeeklyTask(taskId, { completed: true, completedAt: Date.now() });
  }, [updateWeeklyTask]);

  const archiveWeek = useCallback(async (weekData: ArchivedWeek) => {
    if (!user) return;
    try {
      await weeklyDumpService.archiveWeek(user.id, weekData);
      await loadArchivedWeeks();
    } catch (error) {
      console.error('Failed to archive week:', error);
      throw error;
    }
  }, [user]);

  const loadArchivedWeeks = useCallback(async () => {
    if (!user) return;
    try {
      const data = await weeklyDumpService.getArchivedWeeks(user.id);
      setArchivedWeeks(data);
    } catch (error) {
      console.error('Failed to load archived weeks:', error);
    }
  }, [user]);

  // Analytics functions
  const updateDailyCompletion = useCallback(async (completionPct: number) => {
    if (!user) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      await analyticsService.updateDailyCompletion(user.id, today, completionPct);
    } catch (error) {
      console.error('Failed to update daily completion:', error);
    }
  }, [user]);

  const getTodayCompletion = useCallback(async (): Promise<number> => {
    if (!user) return 0;
    try {
      return await analyticsService.getTodayCompletion(user.id);
    } catch (error) {
      console.error('Failed to get today completion:', error);
      return 0;
    }
  }, [user]);

  return {
    // Loading state
    isLoading,
    error,

    // Data
    settings,
    tasks,
    jars,
    weeklyTasks,
    archivedWeeks,

    // Settings functions
    updateSettings,

    // Task functions
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,

    // Jar functions
    addJar,
    updateJar,
    deleteJar,
    addTaskToJar,
    removeTaskFromJar,

    // Weekly dump functions
    addWeeklyTask,
    updateWeeklyTask,
    deleteWeeklyTask,
    completeWeeklyTask,
    archiveWeek,

    // Analytics functions
    updateDailyCompletion,
    getTodayCompletion,
  };
}
