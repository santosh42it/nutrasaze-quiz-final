/**
 * Utility script for cleaning up orphaned files in the storage system
 * This should be run periodically to maintain storage hygiene
 */

import { cleanupOrphanedFiles } from '../services/secureFileService';

export const runCleanup = async (): Promise<void> => {
  try {
    console.log('🧹 Starting orphaned file cleanup process...');
    await cleanupOrphanedFiles();
    console.log('✅ Orphaned file cleanup completed successfully');
  } catch (error) {
    console.error('❌ Orphaned file cleanup failed:', error);
    throw error;
  }
};

// Export for use in admin panel or scheduled tasks
export default runCleanup;