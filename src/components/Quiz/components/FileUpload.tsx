import React from "react";

interface FileUploadProps {
  selectedFile: File | null;
  validationError: string;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  acceptedFileTypes?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  selectedFile,
  validationError,
  handleFileChange,
  acceptedFileTypes = ".pdf,.doc,.docx,.jpg,.jpeg,.png"
}) => {
  return (
    <div className="space-y-4 w-full">
      <div className="relative w-full h-40 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
        <input
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-4 text-white px-4">
          {selectedFile ? (
            <>
              <div className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {selectedFile.name}
                </span>
              </div>
              <p className="text-sm text-green-400 text-center">
                ✓ File uploaded successfully! Click to replace if needed.
              </p>
            </>
          ) : (
            <>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-white/70 mt-1">
                  PDF, DOC, or Images (max 5MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      {validationError && (
        <p className="text-red-500 text-sm">{validationError}</p>
      )}
    </div>
  );
};