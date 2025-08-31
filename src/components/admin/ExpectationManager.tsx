
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';
import { Expectation } from '../../types/database';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

export const ExpectationManager: React.FC = () => {
  const [expectations, setExpectations] = useState<Expectation[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    order_index: 0,
    is_active: true
  });

  useEffect(() => {
    fetchExpectations();
  }, []);

  const fetchExpectations = async () => {
    try {
      const { data, error } = await supabase
        .from('expectations')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setExpectations(data || []);
    } catch (error) {
      console.error('Error fetching expectations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('expectations')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('expectations')
          .insert([formData]);

        if (error) throw error;
      }

      await fetchExpectations();
      resetForm();
    } catch (error) {
      console.error('Error saving expectation:', error);
      alert('Error saving expectation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expectation: Expectation) => {
    setFormData({
      title: expectation.title,
      description: expectation.description,
      image_url: expectation.image_url,
      order_index: expectation.order_index,
      is_active: expectation.is_active
    });
    setEditingId(expectation.id);
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('expectations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchExpectations();
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting expectation:', error);
      alert('Error deleting expectation. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      order_index: 0,
      is_active: true
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#1d0917]">Manage Expectations</h2>
        <Button
          onClick={resetForm}
          className="bg-[#913177] text-white hover:bg-[#913177]/90"
        >
          Add New
        </Button>
      </div>

      {/* Form */}
      <div className="bg-white p-6 rounded-lg border border-[#e9d6e4]">
        <h3 className="text-lg font-semibold mb-4">
          {editingId ? 'Edit Expectation' : 'Add New Expectation'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Personalised diet chart"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://cdn.shopify.com/..."
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what users can expect..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#913177] focus:border-transparent"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Order Index</label>
              <Input
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                min="0"
                required
              />
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300 text-[#913177] focus:ring-[#913177]"
              />
              <label htmlFor="is_active" className="text-sm font-medium">Active</label>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#913177] text-white hover:bg-[#913177]/90"
            >
              {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
            {editingId && (
              <Button
                type="button"
                onClick={resetForm}
                variant="outline"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Expectations List */}
      <div className="bg-white rounded-lg border border-[#e9d6e4] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f4fc]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#1d0917]">Order</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#1d0917]">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#1d0917]">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#1d0917]">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#1d0917]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e9d6e4]">
              {expectations.map((expectation) => (
                <tr key={expectation.id} className="hover:bg-[#fff4fc]">
                  <td className="px-4 py-3 text-sm">{expectation.order_index}</td>
                  <td className="px-4 py-3 text-sm font-medium">{expectation.title}</td>
                  <td className="px-4 py-3 text-sm max-w-md truncate">{expectation.description}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      expectation.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {expectation.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    <Button
                      onClick={() => handleEdit(expectation)}
                      size="sm"
                      variant="outline"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => setDeleteId(expectation.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Delete Expectation"
        description="Are you sure you want to delete this expectation? This action cannot be undone."
      />
    </div>
  );
};
