import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { getSignedFileUrl } from '../../services/secureFileService';

interface SecureFileViewerProps {
  filePath: string;
  fileName?: string;
  className?: string;
}

export const SecureFileViewer: React.FC<SecureFileViewerProps> = ({ 
  filePath, 
  fileName, 
  className = '' 
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = fileName || filePath.split('/').pop()?.substring(0, 50) || 'Medical Document';

  const generateSignedUrl = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Generating signed URL for:', filePath);
      const url = await getSignedFileUrl(filePath);
      
      if (url) {
        setSignedUrl(url);
        console.log('🔐 Signed URL generated successfully');
      } else {
        setError('Failed to generate secure access URL');
      }
    } catch (err) {
      console.error('Error generating signed URL:', err);
      setError('Unable to access file securely');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async () => {
    if (signedUrl) {
      // URL is already generated, open it
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Generate URL first, then open
      await generateSignedUrl();
      // The effect below will handle opening the URL
    }
  };

  const handleDownload = async () => {
    if (!signedUrl) {
      await generateSignedUrl();
      return;
    }

    try {
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = displayName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('🔐 File downloaded securely');
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file');
    }
  };

  // Auto-open URL when it's generated
  useEffect(() => {
    if (signedUrl && !error) {
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    }
  }, [signedUrl, error]);

  return (
    <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-green-500 text-white rounded-full p-3 text-lg">
            📎
          </div>
          <div>
            <p className="font-bold text-green-900 text-lg">📄 Medical Document</p>
            <p className="text-green-700 text-sm mt-1">
              {displayName}
            </p>
            {error && (
              <p className="text-red-600 text-xs mt-1">
                🔒 {error}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={handleView}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                🔐 Securing...
              </>
            ) : (
              <>
                👁️ View Document
              </>
            )}
          </Button>
          
          <Button
            onClick={handleDownload}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            📥 Download
          </Button>
        </div>
      </div>
      
      {/* Security indicator */}
      <div className="mt-3 flex items-center gap-2 text-green-600 text-xs">
        <span className="text-lg">🔐</span>
        <span className="font-medium">
          Secure access • Files are private and authenticated • URLs expire in 1 hour
        </span>
      </div>
    </div>
  );
};