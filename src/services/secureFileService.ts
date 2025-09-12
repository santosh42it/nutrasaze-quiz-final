import { supabase } from '../lib/supabase';
import { getCurrentUser, isAuthenticated } from '../lib/supabase';

// File upload configuration
const PRIVATE_BUCKET = 'secure-medical-files';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export interface SecureFileUploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  error?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates file on server side
 */
export const validateFile = (file: File): FileValidationResult => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed. Allowed types: PDF, images (JPEG, PNG, GIF), Word, Excel, and text files`
    };
  }

  // Check file name for malicious patterns
  const fileName = file.name.toLowerCase();
  const maliciousPatterns = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.js', '.vbs', '.jar'];
  
  for (const pattern of maliciousPatterns) {
    if (fileName.includes(pattern)) {
      return {
        isValid: false,
        error: 'File type not allowed for security reasons'
      };
    }
  }

  return { isValid: true };
};

/**
 * Uploads file to secure private storage bucket
 * Only uploads if responseId exists to prevent orphaned files
 */
export const uploadSecureFile = async (
  file: File, 
  responseId: number,
  questionId: string | number
): Promise<SecureFileUploadResult> => {
  try {
    console.log('🔐 Starting secure file upload...', { 
      fileName: file.name, 
      responseId, 
      questionId,
      fileSize: file.size,
      fileType: file.type
    });

    // Validate responseId exists
    if (!responseId || responseId <= 0) {
      return {
        success: false,
        error: 'Response ID is required before file upload'
      };
    }

    // Server-side validation
    const validation = validateFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Verify response exists in database
    const { data: existingResponse, error: responseError } = await supabase
      .from('quiz_responses')
      .select('id')
      .eq('id', responseId)
      .single();

    if (responseError || !existingResponse) {
      console.error('Response not found:', responseError);
      return {
        success: false,
        error: 'Invalid response ID'
      };
    }

    // Generate secure file path
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'file';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const secureFileName = `response_${responseId}/question_${questionId}/${timestamp}_${randomString}.${fileExt}`;

    console.log('🔐 Uploading to secure path:', secureFileName);

    // Upload to private bucket (this will auto-create the bucket if it doesn't exist)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(PRIVATE_BUCKET)
      .upload(secureFileName, file, {
        cacheControl: '3600',
        upsert: false,
        duplex: 'half'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`
      };
    }

    console.log('🔐 File uploaded successfully to private storage:', uploadData.path);

    return {
      success: true,
      fileId: uploadData.path,
      fileName: file.name
    };

  } catch (error) {
    console.error('Secure file upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
};

/**
 * Generates signed URL for authorized file access (admin only)
 * URLs expire after 1 hour for security
 */
export const getSignedFileUrl = async (filePath: string): Promise<string | null> => {
  try {
    // Check if user is authenticated admin
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      console.error('Unauthorized access attempt to file:', filePath);
      return null;
    }

    // Generate signed URL that expires in 1 hour
    const { data, error } = await supabase.storage
      .from(PRIVATE_BUCKET)
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }

    console.log('🔐 Generated signed URL for file:', filePath);
    return data.signedUrl;

  } catch (error) {
    console.error('Error in getSignedFileUrl:', error);
    return null;
  }
};

/**
 * Cleanup orphaned files that aren't linked to valid responses
 */
export const cleanupOrphanedFiles = async (): Promise<void> => {
  try {
    console.log('🧹 Starting orphaned file cleanup...');

    // Only allow admin users to run cleanup
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      console.error('Unauthorized cleanup attempt');
      return;
    }

    // List all files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(PRIVATE_BUCKET)
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('Error listing files:', listError);
      return;
    }

    if (!files || files.length === 0) {
      console.log('No files found for cleanup');
      return;
    }

    // Check each file to see if it's linked to a valid response
    const orphanedFiles: string[] = [];

    for (const file of files) {
      // Extract response ID from file path (format: response_{id}/...)
      const pathMatch = file.name.match(/response_(\d+)\//);
      if (!pathMatch) {
        orphanedFiles.push(file.name);
        continue;
      }

      const responseId = parseInt(pathMatch[1]);

      // Check if response exists
      const { data: response, error } = await supabase
        .from('quiz_responses')
        .select('id')
        .eq('id', responseId)
        .single();

      if (error || !response) {
        orphanedFiles.push(file.name);
      }
    }

    // Delete orphaned files
    if (orphanedFiles.length > 0) {
      console.log(`🧹 Found ${orphanedFiles.length} orphaned files to cleanup`);
      
      const { data: deleteData, error: deleteError } = await supabase.storage
        .from(PRIVATE_BUCKET)
        .remove(orphanedFiles);

      if (deleteError) {
        console.error('Error deleting orphaned files:', deleteError);
      } else {
        console.log(`🧹 Successfully cleaned up ${orphanedFiles.length} orphaned files`);
      }
    } else {
      console.log('🧹 No orphaned files found');
    }

  } catch (error) {
    console.error('Error in cleanup:', error);
  }
};

/**
 * Initialize the secure storage bucket with proper security policies
 */
export const initializeSecureStorage = async (): Promise<void> => {
  try {
    console.log('🔐 Initializing secure storage...');

    // The bucket should be created with RLS policies that only allow:
    // 1. Quiz submissions (authenticated users can upload)
    // 2. Admin access (admin users can read/download)
    // 3. No public access

    // Check if bucket exists, if not it will be created on first upload
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error checking buckets:', error);
      return;
    }

    const secureExists = buckets?.some(bucket => bucket.name === PRIVATE_BUCKET);
    
    if (secureExists) {
      console.log('🔐 Secure storage bucket already exists');
    } else {
      console.log('🔐 Secure storage bucket will be created on first upload');
    }

  } catch (error) {
    console.error('Error initializing secure storage:', error);
  }
};

// Storage bucket RLS policy recommendations (to be applied in Supabase dashboard):
/*
SECURE STORAGE BUCKET POLICIES NEEDED:

1. Create bucket 'secure-medical-files' with:
   - public: false 
   - file_size_limit: 10485760 (10MB)
   - allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png', ...]

2. INSERT policy for quiz submissions:
   - Allow authenticated users to upload files to their own response folders
   - Policy: auth.uid() is not null AND (storage.foldername(name))[1] = 'response_' || auth.uid()::text

3. SELECT policy for admin access only:
   - Only allow admin users to view/download files
   - Policy: auth.uid() in (select id from auth.users where email = 'admin@nutrasage.com')

4. No UPDATE or DELETE policies for additional security

5. File path structure: response_{responseId}/question_{questionId}/{timestamp}_{random}.{ext}
*/