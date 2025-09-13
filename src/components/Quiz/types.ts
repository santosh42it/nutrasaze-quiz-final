export interface Question {
  id: string;
  question: string;
  type: string;
  placeholder?: string;
  description?: string;
  options?: string[];
  hasTextArea?: boolean;
  hasFileUpload?: boolean;
  textAreaPlaceholder?: string;
  acceptedFileTypes?: string;
  validation?: (value: string) => string;
}

export interface QuestionProps {
  question: Question;
  currentQuestion: number;
  totalQuestions: number;
  inputValue: string;
  setInputValue: (value: string) => void;
  additionalInfo: string;
  setAdditionalInfo: (value: string) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  validationError: string;
  setValidationError: (error: string) => void;
  answers: Record<string, string>;
  handleNext: () => void;
  handleOptionSelect: (option: string) => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}