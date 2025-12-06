import { supabase } from './supabase';
import { taskService, jarService, weeklyDumpService, analyticsService, userProfileService } from './supabase-services';
import { load, save, STORAGE_KEYS } from './storage';
import type { Task, Jar, WeeklyTask, ArchivedWeek, AppSettings, UserProfile } from '../app/types';

/**
 * Migration utilities to move data from localStorage to Supabase
 */
export const migrationService = {
  /**
   * Migrate user settings from localStorage to Supabase
   */
  async migrateUserSettings(userId: string, defaultSettings: AppSettings) {
    try {
      // Check if user profile already exists
      const existingProfile = await userProfileService.getProfile(userId).catch(() => null);

      if (existingProfile) {
        console.log('User profile already exists in Supabase');
        return existingProfile;
      }

      // Get settings from localStorage
      const localSettings = load('taskjar.settings', defaultSettings);
      const localProfile = load('taskjar.profile', { initials: 'ST', bgColor: '#1DB954' } as UserProfile);

      // Create profile in Supabase
      const profile = await userProfileService.createProfile(userId, {
        student_name: localSettings.studentName,
        initials: localProfile.initials,
        bg_color: localProfile.bgColor,
        xp_light: localSettings.xpValues.light,
        xp_standard: localSettings.xpValues.standard,
        xp_challenging: localSettings.xpValues.challenging,
        jar_target: localSettings.jarTarget,
        emoji_priority_urgent: localSettings.emojis.priority.urgent,
        emoji_priority_scheduled: localSettings.emojis.priority.scheduled,
        emoji_priority_optional: localSettings.emojis.priority.optional,
        emoji_difficulty_light: localSettings.emojis.difficulty.light,
        emoji_difficulty_standard: localSettings.emojis.difficulty.standard,
        emoji_difficulty_challenging: localSettings.emojis.difficulty.challenging,
        parent_lock_enabled: localSettings.parentLock.enabled,
        parent_lock_password: localSettings.parentLock.password,
        parent_lock_security_question: localSettings.parentLock.securityQuestion,
        parent_lock_security_answer: localSettings.parentLock.securityAnswer,
        sound_enabled: localSettings.preferences.soundEnabled,
        theme: localSettings.preferences.theme,
      });

      console.log('Migrated user settings to Supabase');
      return profile;
    } catch (error) {
      console.error('Failed to migrate user settings:', error);
      throw error;
    }
  },

  /**
   * Migrate tasks from localStorage to Supabase
   */
  async migrateTasks(userId: string, settings: AppSettings) {
    try {
      // Check if tasks already exist
      const existingTasks = await taskService.getTasks(userId);
      if (existingTasks.length > 0) {
        console.log('Tasks already exist in Supabase');
        return existingTasks;
      }

      // Get tasks from localStorage
      const localTasks = load('taskjar.tasks', [] as Task[]);

      if (localTasks.length === 0) {
        console.log('No local tasks to migrate');
        return [];
      }

      // Migrate each task
      const migratedTasks: Task[] = [];
      for (const task of localTasks) {
        try {
          const migratedTask = await taskService.createTask(userId, {
            name: task.name,
            description: task.description,
            priority: task.priority,
            difficulty: task.difficulty,
            xpValue: task.xpValue,
            completed: task.completed,
            completedAt: task.completedAt,
            scheduledFor: task.scheduledFor,
            priorityEmoji: task.priorityEmoji,
            difficultyEmoji: task.difficultyEmoji,
          });
          migratedTasks.push(migratedTask);
        } catch (error) {
          console.error('Failed to migrate task:', task.name, error);
        }
      }

      console.log(`Migrated ${migratedTasks.length} tasks to Supabase`);
      return migratedTasks;
    } catch (error) {
      console.error('Failed to migrate tasks:', error);
      throw error;
    }
  },

  /**
   * Migrate jars from localStorage to Supabase
   */
  async migrateJars(userId: string) {
    try {
      // Check if jars already exist
      const existingJars = await jarService.getJars(userId);
      if (existingJars.length > 0) {
        console.log('Jars already exist in Supabase');
        return existingJars;
      }

      // Get jars from localStorage
      const localJars = load('taskjar.jars', [] as Jar[]);

      if (localJars.length === 0) {
        console.log('No local jars to migrate');
        return [];
      }

      // Migrate each jar
      const migratedJars: Jar[] = [];
      for (const jar of localJars) {
        try {
          const migratedJar = await jarService.createJar(userId, {
            name: jar.name,
            currentXP: jar.currentXP,
            targetXP: jar.targetXP,
            completed: jar.completed,
            completedAt: jar.completedAt,
            tasks: jar.tasks,
          });

          // Migrate jar-task relationships
          for (const taskId of jar.tasks) {
            try {
              await jarService.addTaskToJar(migratedJar.id, taskId);
            } catch (error) {
              console.error('Failed to migrate jar-task relationship:', error);
            }
          }

          migratedJars.push(migratedJar);
        } catch (error) {
          console.error('Failed to migrate jar:', jar.name, error);
        }
      }

      console.log(`Migrated ${migratedJars.length} jars to Supabase`);
      return migratedJars;
    } catch (error) {
      console.error('Failed to migrate jars:', error);
      throw error;
    }
  },

  /**
   * Migrate weekly dump data from localStorage to Supabase
   */
  async migrateWeeklyDump(userId: string) {
    try {
      // Check if weekly tasks already exist
      const existingTasks = await weeklyDumpService.getWeeklyTasks(userId);
      if (existingTasks.length > 0) {
        console.log('Weekly tasks already exist in Supabase');
        return existingTasks;
      }

      // Get weekly dump tasks from localStorage
      const localTasks = load(STORAGE_KEYS.WEEKLY_DUMP_TASKS, [] as WeeklyTask[]);

      if (localTasks.length === 0) {
        console.log('No local weekly tasks to migrate');
        return [];
      }

      // Migrate each weekly task
      const migratedTasks: WeeklyTask[] = [];
      for (const task of localTasks) {
        try {
          const migratedTask = await weeklyDumpService.createWeeklyTask(userId, {
            name: task.name,
            description: task.description,
            priority: task.priority,
            difficulty: task.difficulty,
            scheduledDate: task.scheduledDate,
            completed: task.completed,
            completedAt: task.completedAt,
          });
          migratedTasks.push(migratedTask);
        } catch (error) {
          console.error('Failed to migrate weekly task:', task.name, error);
        }
      }

      // Get archived weeks
      const localArchivedWeeks = load(STORAGE_KEYS.ARCHIVED_WEEKS, [] as ArchivedWeek[]);

      // Migrate archived weeks
      for (const week of localArchivedWeeks) {
        try {
          await weeklyDumpService.archiveWeek(userId, week);
        } catch (error) {
          console.error('Failed to migrate archived week:', error);
        }
      }

      console.log(`Migrated ${migratedTasks.length} weekly tasks and ${localArchivedWeeks.length} archived weeks to Supabase`);
      return migratedTasks;
    } catch (error) {
      console.error('Failed to migrate weekly dump:', error);
      throw error;
    }
  },

  /**
   * Migrate analytics data from localStorage to Supabase
   */
  async migrateAnalytics(userId: string) {
    try {
      // Check if analytics data already exists
      const existingData = await analyticsService.getDailyCompletion(userId);
      if (existingData.length > 0) {
        console.log('Analytics data already exists in Supabase');
        return existingData;
      }

      // Get analytics data from localStorage
      const localData = load('taskjar.analytics.dailyCompletion', [] as Array<{ dateISO: string; completionPct: number }[]>);

      if (!Array.isArray(localData) || localData.length === 0) {
        console.log('No local analytics data to migrate');
        return [];
      }

      // Migrate analytics data
      for (const record of localData) {
        try {
          await analyticsService.updateDailyCompletion(userId, record.dateISO, record.completionPct);
        } catch (error) {
          console.error('Failed to migrate analytics record:', record, error);
        }
      }

      console.log(`Migrated ${localData.length} analytics records to Supabase`);
      return localData;
    } catch (error) {
      console.error('Failed to migrate analytics:', error);
      throw error;
    }
  },

  /**
   * Run complete migration for a user
   */
  async migrateAllUserData(userId: string, defaultSettings: AppSettings) {
    console.log('Starting complete data migration for user:', userId);

    try {
      // Migrate in order of dependencies
      await this.migrateUserSettings(userId, defaultSettings);
      await this.migrateTasks(userId, defaultSettings);
      await this.migrateJars(userId);
      await this.migrateWeeklyDump(userId);
      await this.migrateAnalytics(userId);

      console.log('✅ Complete data migration finished successfully!');
      return true;
    } catch (error) {
      console.error('❌ Data migration failed:', error);
      throw error;
    }
  },
};
