

import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import type { Question, QuestionOption, Tag } from '../../types/database';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

interface OptionWithTags {
  id?: number; // Track existing option ID for updates
  option: string;
  tags: number[];
}

interface QuestionModalProps {
  isOpen: boolean;
  question?: Question;
  options?: QuestionOption[];
  tags: Tag[];
  onSave: (questionData: Partial<Question>, questionOptions?: OptionWithTags[]) => void;
  onClose: () => void;
}

const QuestionModal: React.FC<QuestionModalProps> = ({ isOpen, question, options, tags, onSave, onClose }) => {
  const { optionTags, fetchOptionTags } = useAdminStore();
  
  const [formData, setFormData] = useState<Partial<Question>>({
    question_text: question?.question_text || '',
    question_type: question?.question_type || 'text',
    placeholder: question?.placeholder || '',
    description: question?.description || '',
    has_text_area: question?.has_text_area || false,
    has_file_upload: question?.has_file_upload || false,
    text_area_placeholder: question?.text_area_placeholder || '',
    accepted_file_types: question?.accepted_file_types || '',
    status: question?.status || 'draft'
  });

  const [questionOptions, setQuestionOptions] = useState<OptionWithTags[]>([]);
  const [newOption, setNewOption] = useState('');
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [editingOptionText, setEditingOptionText] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    const loadModalData = async () => {
      if (isOpen) {
        // Ensure optionTags are loaded before setting up the form
        if (optionTags.length === 0) {
          console.log('Loading option tags for modal...');
          await fetchOptionTags();
        }

        setFormData({
          question_text: question?.question_text || '',
          question_type: question?.question_type || 'text',
          placeholder: question?.placeholder || '',
          description: question?.description || '',
          has_text_area: question?.has_text_area || false,
          has_file_upload: question?.has_file_upload || false,
          text_area_placeholder: question?.text_area_placeholder || '',
          accepted_file_types: question?.accepted_file_types || '',
          status: question?.status || 'draft'
        });
        
        if (question && options && options.length > 0) {
          // Filter options for this specific question first
          const questionOptionsForThisQuestion = options.filter(option => option.question_id === question.id);
          
          const optionsWithTags = questionOptionsForThisQuestion.map(option => {
            const optionTagsForOption = optionTags.filter(ot => Number(ot.option_id) === Number(option.id));
            
            console.log(`Option ${option.option_text} (ID: ${option.id}) has tags:`, optionTagsForOption);
            
            return {
              id: option.id, // Include the database ID
              option: option.option_text,
              tags: optionTagsForOption.map(ot => Number(ot.tag_id))
            };
          });
          
          setQuestionOptions(optionsWithTags);
        } else {
          setQuestionOptions([]);
        }
        
        setNewOption('');
        setEditingOptionIndex(null);
        setEditingOptionText('');
      }
    };

    loadModalData();
  }, [isOpen, question, options, optionTags]);

  const isGenericQuestion = ['text', 'email', 'tel', 'number'].includes(formData.question_type || '');

  const handleAddOption = () => {
    if (newOption.trim()) {
      const existingOption = questionOptions.find(opt => opt.option === newOption.trim());
      if (!existingOption) {
        setQuestionOptions([...questionOptions, { option: newOption.trim(), tags: [] }]); // No ID for new options
        setNewOption('');
      }
    }
  };

  const handleRemoveOption = (index: number) => {
    setQuestionOptions(questionOptions.filter((_, i) => i !== index));
  };

  const handleEditOption = (index: number) => {
    setEditingOptionIndex(index);
    setEditingOptionText(questionOptions[index].option);
  };

  const handleSaveOptionEdit = () => {
    if (editingOptionIndex !== null && editingOptionText.trim()) {
      setQuestionOptions(prev => prev.map((opt, index) => 
        index === editingOptionIndex 
          ? { ...opt, option: editingOptionText.trim() }
          : opt
      ));
      setEditingOptionIndex(null);
      setEditingOptionText('');
    }
  };

  const handleCancelOptionEdit = () => {
    setEditingOptionIndex(null);
    setEditingOptionText('');
  };

  const handleShuffleOptions = () => {
    const shuffled = [...questionOptions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setQuestionOptions(shuffled);
  };

  const handleOptionTagToggle = (optionIndex: number, tagId: number) => {
    setQuestionOptions(prev => prev.map((opt, index) => {
      if (index === optionIndex) {
        const updatedTags = opt.tags.includes(tagId)
          ? opt.tags.filter(id => id !== tagId)
          : [...opt.tags, tagId];
        return { ...opt, tags: updatedTags };
      }
      return opt;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, formData.question_type === 'select' ? questionOptions : undefined);
  };

  // Handle ESC key press and outside click
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-[#1d0917]">
              {question ? 'Edit Question' : 'Add New Question'}
            </h3>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-[#1d0917] mb-2">
              Question Text *
            </label>
            <Input
              value={formData.question_text || ''}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              placeholder="Enter your question..."
              className="border-[#e9d6e4]"
              required
            />
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-[#1d0917] mb-2">
              Question Type *
            </label>
            <select
              value={formData.question_type || ''}
              onChange={(e) => setFormData({ ...formData, question_type: e.target.value as Question['question_type'] })}
              className="w-full p-2 border border-[#e9d6e4] rounded-md bg-white"
              required
            >
              <option value="">Select type</option>
              <option value="text">Text Input</option>
              <option value="email">Email</option>
              <option value="tel">Phone Number</option>
              <option value="number">Number</option>
              <option value="select">Multiple Choice</option>
            </select>
          </div>

          {/* Placeholder */}
          <div>
            <label className="block text-sm font-medium text-[#1d0917] mb-2">
              Placeholder Text
            </label>
            <Input
              value={formData.placeholder || ''}
              onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
              placeholder="Enter placeholder text..."
              className="border-[#e9d6e4]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#1d0917] mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional context or instructions..."
              className="w-full p-2 border border-[#e9d6e4] rounded-md bg-white h-20 resize-none"
            />
          </div>

          {/* Options for Select Type */}
          {formData.question_type === 'select' && (
            <div>
              <label className="block text-sm font-medium text-[#1d0917] mb-2">
                Options with Tags
              </label>
              <div className="space-y-4">
                {questionOptions.map((optionWithTags, index) => (
                  <div key={index} className="p-4 bg-[#fff4fc] rounded-md space-y-3 border border-[#e9d6e4]">
                    <div className="flex items-center gap-2">
                      {editingOptionIndex === index ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={editingOptionText}
                            onChange={(e) => setEditingOptionText(e.target.value)}
                            className="border-[#e9d6e4]"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveOptionEdit();
                              }
                              if (e.key === 'Escape') {
                                handleCancelOptionEdit();
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            type="button"
                            onClick={handleSaveOptionEdit}
                            size="sm"
                            className="bg-green-600 text-white hover:bg-green-700"
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            onClick={handleCancelOptionEdit}
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:bg-gray-50"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 font-medium">{optionWithTags.option}</span>
                          <Button
                            type="button"
                            onClick={() => handleEditOption(index)}
                            variant="ghost"
                            size="sm"
                            className="text-[#913177] hover:bg-[#fff4fc]"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove this option: "${optionWithTags.option}"? This action cannot be undone.`)) {
                                handleRemoveOption(index);
                              }
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {!isGenericQuestion && tags.length > 0 && editingOptionIndex !== index && (
                      <div>
                        <p className="text-xs text-gray-600 mb-2">Tags for Product Recommendations:</p>
                        <div className="flex flex-wrap gap-2">
                          {tags.map(tag => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => handleOptionTagToggle(index, tag.id)}
                              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                                optionWithTags.tags.includes(tag.id)
                                  ? 'bg-[#913177] text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {tag.name}
                            </button>
                          ))}
                        </div>
                        {optionWithTags.tags.length === 0 && (
                          <p className="text-xs text-gray-400 mt-1">No tags selected</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add new option..."
                    className="border-[#e9d6e4] flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                  />
                  <Button
                    type="button"
                    onClick={handleAddOption}
                    className="bg-[#913177] text-white hover:bg-[#913177]/90"
                    disabled={!newOption.trim()}
                  >
                    Add Option
                  </Button>
                  {questionOptions.length > 1 && (
                    <Button
                      type="button"
                      onClick={handleShuffleOptions}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      title="Shuffle option order randomly"
                    >
                      🔀 Shuffle
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Additional Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.has_text_area || false}
                onChange={(e) => setFormData({ ...formData, has_text_area: e.target.checked })}
                className="rounded border-[#e9d6e4]"
              />
              <span className="text-sm text-[#1d0917]">Include text area</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.has_file_upload || false}
                onChange={(e) => setFormData({ ...formData, has_file_upload: e.target.checked })}
                className="rounded border-[#e9d6e4]"
              />
              <span className="text-sm text-[#1d0917]">Include file upload</span>
            </label>
          </div>

          {/* Text Area Placeholder */}
          {formData.has_text_area && (
            <div>
              <label className="block text-sm font-medium text-[#1d0917] mb-2">
                Text Area Placeholder
              </label>
              <Input
                value={formData.text_area_placeholder || ''}
                onChange={(e) => setFormData({ ...formData, text_area_placeholder: e.target.value })}
                placeholder="Placeholder for additional text area..."
                className="border-[#e9d6e4]"
              />
            </div>
          )}

          {/* File Types */}
          {formData.has_file_upload && (
            <div>
              <label className="block text-sm font-medium text-[#1d0917] mb-2">
                Accepted File Types
              </label>
              <Input
                value={formData.accepted_file_types || ''}
                onChange={(e) => setFormData({ ...formData, accepted_file_types: e.target.value })}
                placeholder=".pdf,.jpg,.jpeg,.png"
                className="border-[#e9d6e4]"
              />
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-[#1d0917] mb-2">
              Status
            </label>
            <select
              value={formData.status || 'draft'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'active' })}
              className="w-full p-2 border border-[#e9d6e4] rounded-md bg-white"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <Button
              type="submit"
              className="bg-[#913177] text-white hover:bg-[#913177]/90"
            >
              {question ? 'Update Question' : 'Create Question'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-[#e9d6e4] text-[#1d0917]"
            >
              Cancel
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

interface SortableQuestionCardProps {
  question: Question;
  options: QuestionOption[];
  onToggleStatus: (question: Question) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}

const SortableQuestionCard: React.FC<SortableQuestionCardProps> = ({
  question,
  options,
  onToggleStatus,
  onDelete,
  onEdit,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { optionTags, tags } = useAdminStore();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const questionOptions = options.filter(o => o.question_id === question.id);

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="border-[#e9d6e4] hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1" {...attributes} {...listeners}>
              <div className="flex items-center gap-2 mb-2 cursor-move">
                <div className="flex flex-col gap-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                </div>
                <h3 className="font-medium text-[#1d0917] text-sm">
                  {question.question_text}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  question.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {question.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span className="capitalize">{question.question_type}</span>
                {question.has_text_area && <span>• Text Area</span>}
                {question.has_file_upload && <span>• File Upload</span>}
                {questionOptions.length > 0 && <span>• {questionOptions.length} options</span>}
              </div>
            </div>
            
            <div className="flex gap-1">
              <Button
                onClick={() => onToggleStatus(question)}
                size="sm"
                variant="ghost"
                className={`h-8 px-2 text-xs ${
                  question.status === 'active'
                    ? 'text-yellow-600 hover:bg-yellow-50'
                    : 'text-green-600 hover:bg-green-50'
                }`}
              >
                {question.status === 'active' ? 'Draft' : 'Activate'}
              </Button>
              <Button
                onClick={() => onEdit(question.id)}
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs text-[#913177] hover:bg-[#fff4fc]"
              >
                Edit
              </Button>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs text-red-600 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
          </div>

          {questionOptions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="space-y-2">
                {questionOptions.slice(0, 3).map((option) => {
                  const optionTagsForOption = optionTags.filter(ot => Number(ot.option_id) === Number(option.id));
                  const tagNames = optionTagsForOption.map(ot => {
                    const tag = tags.find(t => Number(t.id) === Number(ot.tag_id));
                    return tag?.name;
                  }).filter(Boolean);
                  
                  return (
                    <div key={option.id} className="text-xs">
                      <span className="bg-gray-100 px-2 py-1 rounded mr-2">
                        {option.option_text}
                      </span>
                      {tagNames.length > 0 && (
                        <span className="text-gray-500">
                          Tags: {tagNames.join(', ')}
                        </span>
                      )}
                    </div>
                  );
                })}
                {questionOptions.length > 3 && (
                  <span className="text-xs text-gray-500">+{questionOptions.length - 3} more options</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          onDelete(question.id);
          setShowDeleteDialog(false);
        }}
        title="Delete Question"
        description="Are you sure you want to delete this question? This action cannot be undone."
      />
    </div>
  );
};

export const QuestionManager: React.FC = () => {
  const { 
    questions, 
    options, 
    tags,
    optionTags,
    addQuestion, 
    updateQuestion, 
    deleteQuestion, 
    reorderQuestions,
    addOption,
    updateOption,
    deleteOption,
    updateOptionTags,
    fetchOptionTags,
    fetchQuestions,
    fetchOptions,
    fetchTags
  } = useAdminStore();
  
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all required data when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchQuestions(),
          fetchOptions(), 
          fetchTags(),
          fetchOptionTags()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [fetchQuestions, fetchOptions, fetchTags, fetchOptionTags]);

  useEffect(() => {
    if (showModal || editingQuestion) {
      console.log('Refreshing option tags for modal...');
      const loadData = async () => {
        try {
          await fetchOptionTags();
        } catch (error) {
          console.error('Error refreshing option tags:', error);
        }
      };
      loadData();
    }
  }, [showModal, editingQuestion, fetchOptionTags]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const filteredQuestions = questions.filter(q => {
    const matchesFilter = filter === 'all' || q.status === filter;
    const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      
      const reordered = arrayMove(questions, oldIndex, newIndex);
      reorderQuestions(reordered);
    }
  };

  const handleSaveQuestion = async (questionData: Partial<Question>, questionOptions?: OptionWithTags[]) => {
    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, questionData);
        
        // Simply refresh the data after updating the question
        await Promise.all([
          fetchQuestions(),
          fetchOptions(), 
          fetchTags(),
          fetchOptionTags()
        ]);
      } else {
        const { data: newQuestion } = await addQuestion({
          ...questionData as Question,
          order_index: questions.length,
          status: questionData.status || 'draft'
        });
        
        if (newQuestion) {
          
          // Add options with tags if it's a select question
          if (questionData.question_type === 'select' && questionOptions) {
            for (let i = 0; i < questionOptions.length; i++) {
              const { data: newOption } = await addOption({
                question_id: newQuestion.id,
                option_text: questionOptions[i].option,
                order_index: i
              });
              
              if (newOption && questionOptions[i].tags.length > 0) {
                await updateOptionTags(newOption.id, questionOptions[i].tags);
              }
            }
          }
        }
      }
      
      setShowModal(false);
      setEditingQuestion(null);
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };

  const handleEditQuestion = (id: number) => {
    const question = questions.find(q => q.id === id);
    if (question) {
      setEditingQuestion(question);
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingQuestion(null);
  };

  const activeCount = questions.filter(q => q.status === 'active').length;
  const draftCount = questions.filter(q => q.status === 'draft').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-[#1d0917] mb-2">
            Quiz Questions
          </h2>
          <div className="flex gap-6">
            <button
              onClick={() => setFilter('all')}
              className={`text-sm transition-colors ${
                filter === 'all' ? 'text-[#913177] font-medium' : 'text-gray-600 hover:text-[#913177]'
              }`}
            >
              All Questions ({questions.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`text-sm transition-colors ${
                filter === 'active' ? 'text-[#913177] font-medium' : 'text-gray-600 hover:text-[#913177]'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`text-sm transition-colors ${
                filter === 'draft' ? 'text-[#913177] font-medium' : 'text-gray-600 hover:text-[#913177]'
              }`}
            >
              Draft ({draftCount})
            </button>
          </div>
        </div>
        
        <Button
          onClick={() => {
            setEditingQuestion(null);
            setShowModal(true);
          }}
          className="bg-[#913177] text-white hover:bg-[#913177]/90"
        >
          Add Question
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-[#e9d6e4]"
        />
      </div>

      {/* Questions List */}
      <Card className="border-[#e9d6e4] bg-white">
        <CardContent className="p-6">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No questions match your search.' : 'No questions found.'}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => {
                    setEditingQuestion(null);
                    setShowModal(true);
                  }}
                  variant="outline"
                  className="border-[#e9d6e4] text-[#913177]"
                >
                  Create your first question
                </Button>
              )}
            </div>
          ) : (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext items={filteredQuestions} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {filteredQuestions.map((question) => (
                    <SortableQuestionCard
                      key={question.id}
                      question={question}
                      options={options}
                      onToggleStatus={(q) => updateQuestion(q.id, {
                        status: q.status === 'active' ? 'draft' : 'active'
                      })}
                      onDelete={deleteQuestion}
                      onEdit={handleEditQuestion}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Question Modal */}
      <QuestionModal
        isOpen={showModal}
        question={editingQuestion || undefined}
        options={editingQuestion ? options.filter(o => o.question_id === editingQuestion.id) : undefined}
        tags={tags}
        onSave={handleSaveQuestion}
        onClose={handleCloseModal}
      />
    </div>
  );
};
