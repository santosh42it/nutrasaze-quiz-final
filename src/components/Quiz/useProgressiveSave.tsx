
import { useState, useCallback } from 'react';
import { 
  createPartialResponse, 
  updatePartialResponse, 
  saveQuizAnswer, 
  saveQuizAnswerWithFile,
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
      
      // If we already have a response with placeholder email, update it instead of creating new one
      if (saveData.responseId && saveData.email && saveData.email.includes('placeholder.com')) {
        console.log('Progressive save: Updating placeholder response with real email');
        await updatePartialResponse(saveData.responseId, { email });
        setSaveData(prev => ({ ...prev, email }));
        return saveData.responseId;
      } else if (saveData.responseId && saveData.email === email) {
        // We already have this exact email saved, just return the ID
        console.log('Progressive save: Using existing response for same email', saveData.responseId);
        return saveData.responseId;
      } else if (saveData.responseId && saveData.email !== email) {
        // Different email, update the existing response
        console.log('Progressive save: Updating existing response with new email');
        await updatePartialResponse(saveData.responseId, { email });
        setSaveData(prev => ({ ...prev, email }));
        return saveData.responseId;
      }
      
      const responseId = await createPartialResponse(email);
      setSaveData(prev => ({ ...prev, responseId, email }));
      
      console.log('Progressive save: Created/reused partial response', responseId);
      return responseId;
    } catch (error) {
      console.error('Error saving email:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [saveData]);

  const handleBasicInfoSave = useCallback(async (field: string, value: string) => {
    // If we don't have a response ID yet, try to create one with a placeholder email
    if (!saveData.responseId && !saveData.email) {
      try {
        setIsSaving(true);
        console.log('Progressive save: Basic info entered without email, creating placeholder response');
        
        // Create a temporary response with placeholder email
        const placeholderEmail = `temp_${Date.now()}@placeholder.com`;
        const responseId = await createPartialResponse(placeholderEmail);
        setSaveData(prev => ({ ...prev, responseId, email: placeholderEmail }));
        
        console.log('Progressive save: Created placeholder response', responseId);
        
        // Now save the basic info
        const updates: any = {};
        updates[field] = value;
        await updatePartialResponse(responseId, updates);
        setSaveData(prev => ({ ...prev, [field]: value }));
        
        console.log('Progressive save: Saved basic info', field, value);
      } catch (error) {
        console.error('Error saving basic info:', error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    } else if (saveData.responseId) {
      // We have a response ID, just update the field directly
      try {
        setIsSaving(true);
        console.log('Progressive save: User info', { field, value });
        
        const updates: any = {};
        updates[field] = field === 'age' ? parseInt(value) : value;
        
        await updatePartialResponse(saveData.responseId, updates);
        setSaveData(prev => ({ 
          ...prev, 
          [field]: field === 'age' ? parseInt(value) : value
        }));
        
        console.log('Progressive save: Updated user info');
      } catch (error) {
        console.error('Error saving user info:', error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    }
  }, [saveData]);

  const handleUserInfoSave = useCallback(async (name?: string, contact?: string, age?: number) => {
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
      setSaveData(prev => ({ 
        ...prev, 
        ...(name && { name }), 
        ...(contact && { contact }), 
        ...(age && { age }) 
      }));
      
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
    file?: File // Changed from fileUrl to file for secure upload
  ) => {
    // FIX 1: Guarantee response creation - create placeholder if none exists
    let currentResponseId = saveData.responseId;
    if (!currentResponseId) {
      console.log('🔧 No response ID - creating placeholder response for file upload');
      try {
        // Create a placeholder response to ensure we have a responseId
        const placeholderEmail = `temp_${Date.now()}@placeholder.com`;
        currentResponseId = await handleEmailSave(placeholderEmail);
        
        if (!currentResponseId) {
          console.error('Failed to create placeholder response for file upload');
          return;
        }
        console.log('✅ Created placeholder response with ID:', currentResponseId);
      } catch (error) {
        console.error('Error creating placeholder response:', error);
        return;
      }
    }

    try {
      setIsSaving(true);
      console.log('Progressive save: Answer', { questionId, answer, hasFile: !!file });
      
      // Use secure file upload if file is provided - use local responseId to avoid stale closure
      if (file) {
        await saveQuizAnswerWithFile(currentResponseId, questionId, answer, file, additionalInfo);
      } else {
        await saveQuizAnswer(currentResponseId, questionId, answer, additionalInfo);
      }
      
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
    handleQuizComplete,
    handleBasicInfoSave
  };
};
