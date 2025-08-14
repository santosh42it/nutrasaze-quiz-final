import React, { useState } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import type { AnswerKey } from '../../types/database';

interface AnswerKeyModalProps {
  isOpen: boolean;
  answerKey: AnswerKey | null;
  onSave: (answerKeyData: Partial<AnswerKey>) => Promise<void>;
  onClose: () => void;
}

const AnswerKeyModal: React.FC<AnswerKeyModalProps> = ({ isOpen, answerKey, onSave, onClose }) => {
  const { products, tags } = useAdminStore();
  const [formData, setFormData] = useState<Partial<AnswerKey>>({
    tag_combination: answerKey?.tag_combination || '',
    recommended_products: answerKey?.recommended_products || '',
    coupon_code: answerKey?.coupon_code || '',
    discount_percentage: answerKey?.discount_percentage || null,
  });
  const [selectedTags, setSelectedTags] = useState<string[]>(
    answerKey?.tag_combination?.split(',').map(tag => tag.trim()) || []
  );
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    answerKey?.recommended_products?.split(',').map(product => product.trim()) || []
  );

  React.useEffect(() => {
    if (answerKey) {
      setFormData({
        tag_combination: answerKey.tag_combination,
        recommended_products: answerKey.recommended_products,
        coupon_code: answerKey.coupon_code,
        discount_percentage: answerKey.discount_percentage,
      });
      setSelectedTags(answerKey.tag_combination?.split(',').map(tag => tag.trim()) || []);
      setSelectedProducts(answerKey.recommended_products?.split(',').map(product => product.trim()) || []);
    } else {
      setFormData({ tag_combination: '', recommended_products: '', coupon_code: '', discount_percentage: null });
      setSelectedTags([]);
      setSelectedProducts([]);
    }
  }, [answerKey]);

  const handleTagToggle = (tagName: string) => {
    const newSelectedTags = selectedTags.includes(tagName)
      ? selectedTags.filter(t => t !== tagName)
      : [...selectedTags, tagName];

    setSelectedTags(newSelectedTags);
    setFormData({
      ...formData,
      tag_combination: newSelectedTags.sort().join(',')
    });
  };

  const handleProductToggle = (productName: string) => {
    const newSelectedProducts = selectedProducts.includes(productName)
      ? selectedProducts.filter(p => p !== productName)
      : [...selectedProducts, productName];

    setSelectedProducts(newSelectedProducts);
    setFormData({
      ...formData,
      recommended_products: newSelectedProducts.join(',')
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tag_combination || !formData.recommended_products) return;

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving answer key:', error);
      alert('Failed to save answer key. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="[font-family:'DM_Serif_Display',Helvetica] text-xl text-[#1d0917]">
            {answerKey ? 'Edit Answer Key' : 'Add New Answer Key'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#1d0917] mb-3">
              Select Tags *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-3">
              {tags.map((tag) => (
                <label key={tag.id} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.name)}
                    onChange={() => handleTagToggle(tag.name)}
                    className="rounded border-[#e9d6e4] text-[#913177] focus:ring-[#913177]"
                  />
                  <span className="ml-2 text-sm text-[#1d0917]">{tag.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Selected: {selectedTags.sort().join(', ') || 'None'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d0917] mb-3">
              Select Recommended Products *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-3">
              {products.filter(p => p.is_active).map((product) => (
                <label key={product.id} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.name)}
                    onChange={() => handleProductToggle(product.name)}
                    className="rounded border-[#e9d6e4] text-[#913177] focus:ring-[#913177]"
                  />
                  <span className="ml-2 text-sm text-[#1d0917]">{product.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Selected: {selectedProducts.join(', ') || 'None'}
            </p>
          </div>

          {/* New fields for Coupon Code and Discount Percentage */}
          <div>
            <label className="block text-sm font-medium text-[#1d0917] mb-3">
              Coupon Code
            </label>
            <Input
              value={formData.coupon_code || ''}
              onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value })}
              placeholder="e.g., SAVE10"
              className="border-[#e9d6e4] text-[#1d0917] focus:ring-[#913177] focus:border-[#913177]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d0917] mb-3">
              Discount Percentage
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.discount_percentage === null ? '' : formData.discount_percentage}
              onChange={(e) => {
                const value = e.target.value === '' ? null : parseInt(e.target.value);
                setFormData({ ...formData, discount_percentage: value });
              }}
              placeholder="e.g., 10"
              className="border-[#e9d6e4] text-[#1d0917] focus:ring-[#913177] focus:border-[#913177]"
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button
              type="submit"
              className="bg-[#913177] text-white hover:bg-[#913177]/90"
            >
              {answerKey ? 'Update Answer Key' : 'Add Answer Key'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-[#e9d6e4] text-[#1d0917] hover:bg-[#fff4fc]"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AnswerKeyManager: React.FC = () => {
  const { answerKeys, products, addAnswerKey, updateAnswerKey, deleteAnswerKey, fetchAnswerKeys } = useAdminStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnswerKey, setEditingAnswerKey] = useState<AnswerKey | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; answerKey: AnswerKey | null }>({
    isOpen: false,
    answerKey: null
  });

  // State for the form in the modal, including new fields
  const [newKey, setNewKey] = React.useState({
    tag_combination: '',
    recommended_products: '',
    coupon_code: '',
    discount_percentage: null as number | null
  });

  const handleSave = async (answerKeyData: Partial<AnswerKey>) => {
    // Prepare data for saving, ensuring correct types and handling nulls
    const payload: Partial<AnswerKey> = {
      ...answerKeyData,
      discount_percentage: answerKeyData.discount_percentage === null || answerKeyData.discount_percentage === '' ? null : Number(answerKeyData.discount_percentage),
    };

    if (editingAnswerKey) {
      await updateAnswerKey(editingAnswerKey.id, payload);
    } else {
      await addAnswerKey(payload);
    }
    await fetchAnswerKeys();
    setModalOpen(false);
    setEditingAnswerKey(null);
  };

  const handleEdit = (answerKey: AnswerKey) => {
    setEditingAnswerKey(answerKey);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingAnswerKey(null);
    setModalOpen(true);
    // Reset form state when opening for a new entry
    setNewKey({
      tag_combination: '',
      recommended_products: '',
      coupon_code: '',
      discount_percentage: null
    });
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingAnswerKey(null);
  };

  const handleDeleteClick = (answerKey: AnswerKey) => {
    setDeleteDialog({ isOpen: true, answerKey });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.answerKey) {
      await deleteAnswerKey(deleteDialog.answerKey.id);
      setDeleteDialog({ isOpen: false, answerKey: null });
      await fetchAnswerKeys(); // Refresh the list after deletion
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, answerKey: null });
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="[font-family:'DM_Serif_Display',Helvetica] text-2xl text-[#1d0917]">
          Answer Key Management
        </h2>
        <Button
          onClick={handleAddNew}
          className="bg-[#913177] text-white hover:bg-[#913177]/90"
        >
          + Add New Answer Key
        </Button>
      </div>

      {/* Answer Key Modal */}
      <AnswerKeyModal
        isOpen={modalOpen}
        answerKey={editingAnswerKey}
        onSave={handleSave}
        onClose={handleModalClose}
      />

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
                onClick={handleAddNew}
                className="bg-[#913177] text-white hover:bg-[#913177]/90"
              >
                Create Your First Answer Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tag Combination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recommended Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coupon Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {answerKeys.map((key) => (
                  <tr key={key.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {key.tag_combination}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {key.recommended_products}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 font-mono">
                        {key.coupon_code || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {key.discount_percentage ? `${key.discount_percentage}%` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(key)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(key)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Answer Key"
        description={`Are you sure you want to delete this answer key for "${deleteDialog.answerKey?.tag_combination}"? This action cannot be undone.`}
      />
    </div>
  );
};