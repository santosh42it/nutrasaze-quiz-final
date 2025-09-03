
import { useState, useCallback } from 'react';
import { 
  createPartialResponse, 
  updatePartialResponse, 
  saveQuizAnswer, 
  completeQuizResponse,
  type ProgressiveSaveData 
} from '../../services/quizService';

export const useProgressiveSave = () => {
  const [saveData, setSaveData] = useState<ProgressiveSaveData>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleEmailSave = useCallback(async (email: string) => {
    try {
      setIsSaving(true);
      console.log('Progressive save: Email entered', email);
      
      const responseId = await createPartialResponse(email);
      setSaveData(prev => ({ ...prev, responseId, email }));
      
      console.log('Progressive save: Created partial response', responseId);
      return responseId;
    } catch (error) {
      console.error('Error saving email:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleUserInfoSave = useCallback(async (name: string, contact?: string, age?: number) => {
    if (!saveData.responseId) {
      console.error('No response ID available for saving user info');
      return;
    }

    try {
      setIsSaving(true);
      console.log('Progressive save: User info', { name, contact, age });
      
      const updates: any = {};
      if (name) updates.name = name;
      if (contact) updates.contact = contact;
      if (age) updates.age = age;
      
      await updatePartialResponse(saveData.responseId, updates);
      setSaveData(prev => ({ ...prev, name, contact, age }));
      
      console.log('Progressive save: Updated user info');
    } catch (error) {
      console.error('Error saving user info:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [saveData.responseId]);

  const handleAnswerSave = useCallback(async (
    questionId: string | number,
    answer: string,
    additionalInfo?: string,
    fileUrl?: string
  ) => {
    if (!saveData.responseId) {
      console.error('No response ID available for saving answer');
      return;
    }

    try {
      setIsSaving(true);
      console.log('Progressive save: Answer', { questionId, answer });
      
      await saveQuizAnswer(saveData.responseId, questionId, answer, additionalInfo, fileUrl);
      
      console.log('Progressive save: Saved answer');
    } catch (error) {
      console.error('Error saving answer:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [saveData.responseId]);

  const handleQuizComplete = useCallback(async () => {
    if (!saveData.responseId) {
      console.error('No response ID available for completing quiz');
      return;
    }

    try {
      setIsSaving(true);
      console.log('Progressive save: Completing quiz', saveData.responseId);
      
      await completeQuizResponse(saveData.responseId);
      
      console.log('Progressive save: Quiz completed');
      return saveData.responseId;
    } catch (error) {
      console.error('Error completing quiz:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [saveData.responseId]);

  return {
    saveData,
    isSaving,
    handleEmailSave,
    handleUserInfoSave,
    handleAnswerSave,
    handleQuizComplete
  };
};
