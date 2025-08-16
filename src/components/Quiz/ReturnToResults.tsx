
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';

export const ReturnToResults: React.FC = () => {
  const [lastResultUrl, setLastResultUrl] = useState<string | null>(null);

  useEffect(() => {
    const storedUrl = localStorage.getItem('nutrasage_last_result_url');
    if (storedUrl) {
      setLastResultUrl(storedUrl);
    }
  }, []);

  if (!lastResultUrl) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => window.location.href = lastResultUrl}
        className="bg-[#913177] text-white px-4 py-2 rounded-lg shadow-lg hover:bg-[#7d2b65] text-sm"
      >
        📋 View My Results
      </Button>
    </div>
  );
};
