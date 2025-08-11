
import React, { useState } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import type { AnswerKey } from '../../types/database';

export const AnswerKeyManager: React.FC = () => {
  const { answerKeys, products, addAnswerKey, updateAnswerKey, deleteAnswerKey, fetchAnswerKeys } = useAdminStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingAnswerKey, setEditingAnswerKey] = useState<AnswerKey | null>(null);
  const [newAnswerKey, setNewAnswerKey] = useState<Partial<AnswerKey>>({});
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; answerKey: AnswerKey | null }>({
    isOpen: false,
    answerKey: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswerKey.tag_combination || !newAnswerKey.recommended_products) return;

    try {
      if (editingAnswerKey) {
        await updateAnswerKey(editingAnswerKey.id, newAnswerKey);
        setEditingAnswerKey(null);
      } else {
        await addAnswerKey(newAnswerKey);
        setIsAdding(false);
      }
      
      setNewAnswerKey({});
      await fetchAnswerKeys();
    } catch (error) {
      console.error('Error saving answer key:', error);
      alert('Failed to save answer key. Please try again.');
    }
  };

  const handleEdit = (answerKey: AnswerKey) => {
    setEditingAnswerKey(answerKey);
    setNewAnswerKey({
      tag_combination: answerKey.tag_combination,
      recommended_products: answerKey.recommended_products,
    });
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingAnswerKey(null);
    setNewAnswerKey({});
  };

  const handleDeleteClick = (answerKey: AnswerKey) => {
    setDeleteDialog({ isOpen: true, answerKey });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.answerKey) {
      await deleteAnswerKey(deleteDialog.answerKey.id);
      setDeleteDialog({ isOpen: false, answerKey: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, answerKey: null });
  };

  const getProductNames = (productString: string) => {
    return productString.split(',').map(name => name.trim()).join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="[font-family:'DM_Serif_Display',Helvetica] text-2xl text-[#1d0917]">
          Answer Key Management
        </h2>
        {!isAdding && !editingAnswerKey && (
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-[#913177] text-white hover:bg-[#913177]/90"
          >
            + Add New Answer Key
          </Button>
        )}
      </div>

      {/* Add/Edit Answer Key Form */}
      {(isAdding || editingAnswerKey) && (
        <Card className="border-[#e9d6e4] bg-white">
          <CardContent className="p-6">
            <h3 className="[font-family:'DM_Serif_Display',Helvetica] text-xl text-[#1d0917] mb-4">
              {editingAnswerKey ? 'Edit Answer Key' : 'Add New Answer Key'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1d0917] mb-2">
                  Tag Combination *
                </label>
                <Input
                  type="text"
                  value={newAnswerKey.tag_combination || ''}
                  onChange={(e) => setNewAnswerKey({ ...newAnswerKey, tag_combination: e.target.value })}
                  placeholder="e.g., bone,omega3,sleep"
                  className="border-[#e9d6e4]"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Enter tags separated by commas (alphabetically sorted)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1d0917] mb-2">
                  Recommended Products *
                </label>
                <Input
                  type="text"
                  value={newAnswerKey.recommended_products || ''}
                  onChange={(e) => setNewAnswerKey({ ...newAnswerKey, recommended_products: e.target.value })}
                  placeholder="e.g., Noxis,Elixir,Pulse"
                  className="border-[#e9d6e4]"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Enter product names separated by commas
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button
                  type="submit"
                  className="bg-[#913177] text-white hover:bg-[#913177]/90"
                >
                  {editingAnswerKey ? 'Update Answer Key' : 'Add Answer Key'}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="outline"
                  className="border-[#e9d6e4] text-[#1d0917] hover:bg-[#fff4fc]"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Existing Answer Keys */}
      <div>
        <h3 className="[font-family:'DM_Serif_Display',Helvetica] text-xl text-[#1d0917] mb-4">
          Existing Answer Keys ({answerKeys.length})
        </h3>
        
        {answerKeys.length === 0 ? (
          <Card className="border-[#e9d6e4] bg-white">
            <CardContent className="p-8 text-center">
              <p className="text-[#3d3d3d] mb-4">No answer keys created yet</p>
              <Button
                onClick={() => setIsAdding(true)}
                className="bg-[#913177] text-white hover:bg-[#913177]/90"
              >
                Create Your First Answer Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {answerKeys.map((answerKey) => (
              <Card key={answerKey.id} className="border-[#e9d6e4] bg-white hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-[#1d0917] text-lg mb-2">
                        Tag Combination
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {answerKey.tag_combination.split(',').map((tag, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-[#913177]/10 text-[#913177] rounded-full text-xs font-medium"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-[#1d0917] text-lg mb-2">
                        Recommended Products
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {answerKey.recommended_products.split(',').map((product, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
                          >
                            {product.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-[#e9d6e4]">
                      <div className="text-xs text-gray-500">
                        ID: {answerKey.id}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(answerKey)}
                          className="text-xs text-[#913177] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(answerKey)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Answer Key"
        description={`Are you sure you want to delete this answer key for "${deleteDialog.answerKey?.tag_combination}"? This action cannot be undone and may affect product recommendations.`}
      />
    </div>
  );
};
