import React, { useState } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import type { Question, QuestionOption } from '../../types/database';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

interface SortableQuestionCardProps {
  question: Question;
  options: QuestionOption[];
  onToggleStatus: (question: Question) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  onAddOption: (questionId: number, optionText: string) => void;
  onDeleteOption: (optionId: number) => void;
}

const SortableQuestionCard: React.FC<SortableQuestionCardProps> = ({
  question,
  options,
  onToggleStatus,
  onDelete,
  onEdit,
  onAddOption,
  onDeleteOption,
}) => {
  const [newOption, setNewOption] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
      <Card className="border-[#e9d6e4] cursor-move" {...attributes} {...listeners}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-desktop-body-l-regular text-lg text-[#1d0917]">
                  {question.question_text}
                </h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  question.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {question.status}
                </span>
              </div>
              <p className="text-sm text-[#6d6d6e]">
                Type: {question.question_type}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onToggleStatus(question)}
                className={`${
                  question.status === 'active'
                    ? 'text-green-600 hover:bg-green-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                variant="ghost"
              >
                {question.status === 'active' ? 'Set as Draft' : 'Activate'}
              </Button>
              <Button
                onClick={() => onEdit(question.id)}
                className="text-[#913177] hover:bg-[#fff4fc]"
                variant="ghost"
              >
                Edit
              </Button>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:bg-red-50"
                variant="ghost"
              >
                Delete
              </Button>
            </div>
          </div>

          {question.question_type === 'select' && (
            <div className="mt-4">
              <h4 className="font-desktop-body-m-bold text-sm text-[#1d0917] mb-2">
                Options
              </h4>
              <div className="space-y-2">
                {questionOptions.map((option) => (
                  <div key={option.id} className="flex items-center justify-between bg-[#fff4fc] p-2 rounded">
                    <span>{option.option_text}</span>
                    <Button
                      onClick={() => onDeleteOption(option.id)}
                      className="text-red-600 hover:bg-red-50"
                      variant="ghost"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add new option"
                    className="border-[#e9d6e4]"
                  />
                  <Button
                    onClick={() => {
                      if (newOption.trim()) {
                        onAddOption(question.id, newOption.trim());
                        setNewOption('');
                      }
                    }}
                    className="bg-[#913177] text-white hover:bg-[#913177]/90"
                  >
                    Add
                  </Button>
                </div>
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
    addQuestion, 
    updateQuestion, 
    deleteQuestion, 
    reorderQuestions,
    addOption, 
    deleteOption 
  } = useAdminStore();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({});
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'draft'>('all');

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
    if (filter === 'all') return true;
    return q.status === filter;
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

  const handleAddOption = (questionId: number, optionText: string) => {
    const questionOptions = options.filter(o => o.question_id === questionId);
    const newOption = {
      question_id: questionId,
      option_text: optionText,
      order_index: questionOptions.length
    };
    addOption(newOption);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.question_text || !newQuestion.question_type) return;

    await addQuestion({
      ...newQuestion as Question,
      order_index: questions.length,
      has_text_area: newQuestion.has_text_area || false,
      has_file_upload: newQuestion.has_file_upload || false,
      status: 'draft'
    });
    setIsAdding(false);
    setNewQuestion({});
  };

  return (
    <div className="space-y-6">
      <Card className="border-[#e9d6e4] bg-white">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="[font-family:'DM_Serif_Display',Helvetica] text-2xl text-[#1d0917]">
                Quiz Questions
              </h2>
              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`text-sm ${filter === 'all' ? 'text-[#913177] font-bold' : 'text-[#6d6d6e]'}`}
                >
                  All ({questions.length})
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`text-sm ${filter === 'active' ? 'text-[#913177] font-bold' : 'text-[#6d6d6e]'}`}
                >
                  Active ({questions.filter(q => q.status === 'active').length})
                </button>
                <button
                  onClick={() => setFilter('draft')}
                  className={`text-sm ${filter === 'draft' ? 'text-[#913177] font-bold' : 'text-[#6d6d6e]'}`}
                >
                  Draft ({questions.filter(q => q.status === 'draft').length})
                </button>
              </div>
            </div>
            <Button
              onClick={() => setIsAdding(true)}
              className="bg-[#913177] text-white hover:bg-[#913177]/90"
            >
              Add New Question
            </Button>
          </div>

          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredQuestions} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {filteredQuestions.map((question) => (
                  <SortableQuestionCard
                    key={question.id}
                    question={question}
                    options={options}
                    onToggleStatus={(q) => updateQuestion(q.id, {
                      status: q.status === 'active' ? 'draft' : 'active'
                    })}
                    onDelete={deleteQuestion}
                    onEdit={setEditingQuestionId}
                    onAddOption={handleAddOption}
                    onDeleteOption={deleteOption}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {isAdding && (
        <Card className="border-[#e9d6e4] bg-white">
          <CardContent className="p-6">
            <h3 className="[font-family:'DM_Serif_Display',Helvetica] text-xl text-[#1d0917] mb-4">
              Add New Question
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1d0917] mb-1">
                  Question Text
                </label>
                <Input
                  value={newQuestion.question_text || ''}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                  className="border-[#e9d6e4]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1d0917] mb-1">
                  Question Type
                </label>
                <select
                  value={newQuestion.question_type || ''}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question_type: e.target.value as Question['question_type'] })}
                  className="w-full rounded-md border-[#e9d6e4] bg-white"
                >
                  <option value="">Select type</option>
                  <option value="text">Text</option>
                  <option value="select">Select</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="tel">Telephone</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  className="bg-[#913177] text-white hover:bg-[#913177]/90"
                >
                  Add Question
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNewQuestion({});
                  }}
                  variant="ghost"
                  className="text-[#1d0917]"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};