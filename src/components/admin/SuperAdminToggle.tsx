
import React, { useState } from 'react';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface SuperAdminToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const SuperAdminToggle: React.FC<SuperAdminToggleProps> = ({
  isEnabled,
  onToggle,
}) => {
  const [showWarning, setShowWarning] = useState(false);

  const handleToggleClick = () => {
    if (isEnabled) {
      // Disable immediately without warning
      onToggle(false);
    } else {
      // Show warning before enabling
      setShowWarning(true);
    }
  };

  const handleConfirm = () => {
    onToggle(true);
    setShowWarning(false);
  };

  return (
    <>
      <Button
        onClick={handleToggleClick}
        className={`${
          isEnabled
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-orange-600 hover:bg-orange-700'
        } text-white`}
      >
        {isEnabled ? 'Disable Edit Mode' : 'Enable Edit Mode'}
      </Button>

      <AlertDialog open={showWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">⚠️ Super Admin Warning</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold">You are about to enable Super Admin Edit Mode.</p>
              <p>This will give you access to:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Quiz Questions management</li>
                <li>Tags management</li>
                <li>Products management</li>
                <li>Answer Key management</li>
              </ul>
              <p className="text-red-600 font-semibold">
                ⚠️ These are critical system components. Changes can affect the entire quiz functionality 
                and user experience. Please proceed with extreme caution.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowWarning(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              I Understand - Enable Edit Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
