import { WorkoutMenu } from '@/types/workout';

interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Safely store data in localStorage with capacity checking and error handling
 */
export class SafeStorage {
  /**
   * Calculate the approximate size of data in bytes
   */
  private static calculateSize(data: string): number {
    return new Blob([data]).size;
  }

  /**
   * Check available localStorage capacity
   */
  private static getAvailableSpace(): number {
    if (typeof window === 'undefined') return 0;
    
    try {
      const testKey = '__storage_test__';
      const testValue = 'x'.repeat(1024); // 1KB test
      let size = 0;
      
      // Find maximum storage by binary search
      for (let i = 0; i < 10000; i++) {
        try {
          localStorage.setItem(testKey, testValue.repeat(i));
          size = i * 1024;
        } catch {
          localStorage.removeItem(testKey);
          return size;
        }
      }
      
      localStorage.removeItem(testKey);
      return size;
    } catch {
      return 0;
    }
  }

  /**
   * Remove image data from workout menu to reduce size
   */
  private static stripImageData(menu: WorkoutMenu): WorkoutMenu {
    return {
      ...menu,
      exercises: menu.exercises.map(exercise => ({
        ...exercise,
        imageUrl: undefined // Remove image URLs to save space
      }))
    };
  }

  /**
   * Safely set item in localStorage with fallbacks
   */
  static setItem<T>(key: string, value: T, options?: { 
    useSessionStorage?: boolean;
    stripImages?: boolean;
    maxRetries?: number;
  }): StorageResult<T> {
    const {
      useSessionStorage = false,
      stripImages = false,
      maxRetries = 2
    } = options || {};

    if (typeof window === 'undefined') {
      return { success: false, error: 'Server-side rendering detected' };
    }

    const storage = useSessionStorage ? sessionStorage : localStorage;
    let dataToStore = value;

    // Strip image data if requested and value is a WorkoutMenu
    if (stripImages && typeof value === 'object' && value !== null && 'exercises' in value) {
      dataToStore = this.stripImageData(value as WorkoutMenu) as T;
    }

    const serialized = JSON.stringify(dataToStore);
    const dataSize = this.calculateSize(serialized);

    // Check if data exceeds reasonable size (4MB for localStorage, 8MB for sessionStorage)
    const maxSize = useSessionStorage ? 8 * 1024 * 1024 : 4 * 1024 * 1024;
    if (dataSize > maxSize) {
      console.warn(`Data size (${Math.round(dataSize / 1024)}KB) exceeds limit`);
      
      // Auto-strip images if not already done and it's a WorkoutMenu
      if (!stripImages && typeof value === 'object' && value !== null && 'exercises' in value) {
        return this.setItem(key, value, { ...options, stripImages: true });
      }
      
      return { 
        success: false, 
        error: `Data too large: ${Math.round(dataSize / 1024)}KB exceeds ${maxSize / 1024 / 1024}MB limit` 
      };
    }

    // Try to store with retries
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        storage.setItem(key, serialized);
        return { success: true, data: dataToStore };
      } catch (error: any) {
        console.warn(`Storage attempt ${attempt + 1} failed:`, error);

        if (error.name === 'QuotaExceededError' || error.code === 22) {
          // Try clearing some space
          this.clearOldData(storage);
          
          // If this is localStorage and we haven't tried sessionStorage yet
          if (!useSessionStorage && attempt === 0) {
            console.log('Falling back to sessionStorage');
            return this.setItem(key, value, { ...options, useSessionStorage: true });
          }
          
          // If we haven't stripped images yet, try that
          if (!stripImages && typeof value === 'object' && value !== null && 'exercises' in value) {
            console.log('Stripping image data and retrying');
            return this.setItem(key, value, { ...options, stripImages: true });
          }
        }
        
        if (attempt === maxRetries - 1) {
          return { 
            success: false, 
            error: `Storage failed after ${maxRetries} attempts: ${error.message}` 
          };
        }
      }
    }

    return { success: false, error: 'Unexpected storage failure' };
  }

  /**
   * Safely get item from localStorage with fallbacks
   */
  static getItem<T>(key: string, options?: { 
    checkSessionStorage?: boolean;
    defaultValue?: T;
  }): StorageResult<T> {
    const { checkSessionStorage = true, defaultValue } = options || {};

    if (typeof window === 'undefined') {
      return { success: false, error: 'Server-side rendering detected' };
    }

    // Try localStorage first
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        return { success: true, data: JSON.parse(value) };
      }
    } catch (error: any) {
      console.warn('localStorage.getItem failed:', error);
    }

    // Try sessionStorage as fallback
    if (checkSessionStorage) {
      try {
        const value = sessionStorage.getItem(key);
        if (value !== null) {
          return { success: true, data: JSON.parse(value) };
        }
      } catch (error: any) {
        console.warn('sessionStorage.getItem failed:', error);
      }
    }

    // Return default value if provided
    if (defaultValue !== undefined) {
      return { success: true, data: defaultValue };
    }

    return { success: false, error: 'Item not found in storage' };
  }

  /**
   * Clear old data to free up space
   */
  private static clearOldData(storage: Storage): void {
    try {
      // Clear error logs first (they're less important)
      storage.removeItem('aiWorkoutPro_errors');
      
      // Clear old workout generations (keep only the most recent)
      const keys = Object.keys(storage);
      const workoutKeys = keys.filter(k => k.startsWith('generatedWorkout_'));
      if (workoutKeys.length > 1) {
        // Sort by timestamp and remove older ones
        workoutKeys.sort().slice(0, -1).forEach(key => storage.removeItem(key));
      }
    } catch (error) {
      console.warn('Failed to clear old data:', error);
    }
  }

  /**
   * Remove item from both localStorage and sessionStorage
   */
  static removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove item from storage:', error);
    }
  }

  /**
   * Get storage usage statistics
   */
  static getStorageStats(): { 
    localStorage: { used: number; available: number; total: number };
    sessionStorage: { used: number; available: number; total: number };
  } | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const getUsage = (storage: Storage) => {
        let used = 0;
        for (let key in storage) {
          if (storage.hasOwnProperty(key)) {
            used += storage[key].length + key.length;
          }
        }
        return used;
      };
      
      const localUsed = getUsage(localStorage);
      const sessionUsed = getUsage(sessionStorage);
      const localAvailable = this.getAvailableSpace();
      
      return {
        localStorage: {
          used: localUsed,
          available: localAvailable,
          total: localUsed + localAvailable
        },
        sessionStorage: {
          used: sessionUsed,
          available: 10 * 1024 * 1024, // Approximate 10MB limit
          total: 10 * 1024 * 1024
        }
      };
    } catch {
      return null;
    }
  }
}

/**
 * Convenience functions for common storage operations
 */
export const storageUtils = {
  saveWorkout: (menu: WorkoutMenu): StorageResult<WorkoutMenu> => {
    return SafeStorage.setItem('generatedWorkout', menu, { 
      stripImages: true,
      useSessionStorage: true 
    });
  },

  loadWorkout: (): StorageResult<WorkoutMenu> => {
    return SafeStorage.getItem<WorkoutMenu>('generatedWorkout', { 
      checkSessionStorage: true 
    });
  },

  saveFavorites: (favorites: string[]): StorageResult<string[]> => {
    return SafeStorage.setItem('favoriteWorkouts', favorites);
  },

  loadFavorites: (): StorageResult<string[]> => {
    return SafeStorage.getItem<string[]>('favoriteWorkouts', { 
      defaultValue: [] 
    });
  },

  saveUserPreferences: (prefs: any): StorageResult<any> => {
    return SafeStorage.setItem('aiWorkoutPro_userPreferences', prefs);
  },

  loadUserPreferences: (): StorageResult<any> => {
    return SafeStorage.getItem('aiWorkoutPro_userPreferences');
  }
};