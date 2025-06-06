import { storage } from './firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export interface ImageUploadResult {
  url: string
  success: boolean
  error?: string
}

/**
 * Firebase Storage Service for handling exercise image uploads
 */
export class FirebaseStorageService {
  private static instance: FirebaseStorageService
  
  public static getInstance(): FirebaseStorageService {
    if (!FirebaseStorageService.instance) {
      FirebaseStorageService.instance = new FirebaseStorageService()
    }
    return FirebaseStorageService.instance
  }

  /**
   * Upload image blob to Firebase Storage and return download URL
   */
  async uploadExerciseImage(
    imageBlob: Blob, 
    exerciseName: string, 
    userId?: string
  ): Promise<ImageUploadResult> {
    try {
      // Create unique filename with exercise name, timestamp, and UUID
      const timestamp = Date.now()
      const safeExerciseName = exerciseName.replace(/[^a-zA-Z0-9]/g, '_')
      const randomId = Math.random().toString(36).substring(2, 15)
      const fileName = `${safeExerciseName}_${timestamp}_${randomId}.png`
      
      // Determine storage path (user-specific or public)
      const storagePath = userId 
        ? `users/${userId}/exercises/${fileName}`
        : `exercises/public/${fileName}`
      
      console.log('[DEBUG] Uploading image to Firebase Storage:', {
        exerciseName,
        fileName,
        storagePath,
        blobSize: imageBlob.size,
        blobType: imageBlob.type
      })

      // Create storage reference
      const storageRef = ref(storage, storagePath)
      
      // Upload the blob
      const uploadResult = await uploadBytes(storageRef, imageBlob, {
        contentType: 'image/png',
        customMetadata: {
          exerciseName: exerciseName,
          uploadedAt: new Date().toISOString(),
          userId: userId || 'anonymous'
        }
      })
      
      console.log('[DEBUG] Upload completed:', {
        path: uploadResult.ref.fullPath,
        size: uploadResult.metadata.size
      })

      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref)
      
      console.log('[DEBUG] Download URL generated:', {
        url: downloadURL.substring(0, 100) + '...',
        exerciseName
      })

      return {
        url: downloadURL,
        success: true
      }

    } catch (error: unknown) {
      console.error('[ERROR] Firebase Storage upload failed:', {
        error,
        exerciseName,
        userId,
        message: (error as Error)?.message,
        code: (error as any)?.code
      })

      return {
        url: '',
        success: false,
        error: (error as Error)?.message || 'Upload failed'
      }
    }
  }

  /**
   * Convert base64 data URL to Blob
   */
  base64ToBlob(base64DataUrl: string): Blob | null {
    try {
      // Extract base64 data from data URL
      const base64Data = base64DataUrl.split(',')[1]
      if (!base64Data) {
        throw new Error('Invalid base64 data URL format')
      }

      // Convert base64 to binary
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      return new Blob([bytes], { type: 'image/png' })
    } catch (error) {
      console.error('[ERROR] Base64 to Blob conversion failed:', error)
      return null
    }
  }

  /**
   * Upload base64 image to Firebase Storage
   */
  async uploadBase64Image(
    base64DataUrl: string,
    exerciseName: string,
    userId?: string
  ): Promise<ImageUploadResult> {
    const blob = this.base64ToBlob(base64DataUrl)
    
    if (!blob) {
      return {
        url: '',
        success: false,
        error: 'Failed to convert base64 to blob'
      }
    }

    return this.uploadExerciseImage(blob, exerciseName, userId)
  }
}

// Export singleton instance
export const storageService = FirebaseStorageService.getInstance()