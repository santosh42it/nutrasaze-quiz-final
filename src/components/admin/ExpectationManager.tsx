
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { supabase } from '../../lib/supabase';
import type { Expectation } from '../../types/database';

export const ExpectationManager: React.FC = () => {
  const [expectations, setExpectations] = useState<Expectation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpectation, setEditingExpectation] = useState<Expectation | null>(null);
  const [isCreating, setIsCreating] = useState(false);
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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingExpectation) {
        const { error } = await supabase
          .from('expectations')
          .update(formData)
          .eq('id', editingExpectation.id);

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
      alert('Error saving expectation');
    }
  };

  const handleEdit = (expectation: Expectation) => {
    setEditingExpectation(expectation);
    setFormData({
      title: expectation.title,
      description: expectation.description,
      image_url: expectation.image_url,
      order_index: expectation.order_index,
      is_active: expectation.is_active
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expectation?')) return;

    try {
      const { error } = await supabase
        .from('expectations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchExpectations();
    } catch (error) {
      console.error('Error deleting expectation:', error);
      alert('Error deleting expectation');
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
    setEditingExpectation(null);
    setIsCreating(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading expectations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Expectations</h2>
        <Button onClick={() => setIsCreating(true)}>Add New Expectation</Button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingExpectation ? 'Edit Expectation' : 'Create New Expectation'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border rounded h-24"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Order Index</label>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({...formData, order_index: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm font-medium">Active</label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingExpectation ? 'Update' : 'Create'}
                </Button>
                <Button type="button" onClick={resetForm} className="bg-gray-500">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Expectations List */}
      <div className="grid gap-4">
        {expectations.map((expectation) => (
          <Card key={expectation.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{expectation.title}</h3>
                    <span className="text-sm text-gray-500">
                      (Order: {expectation.order_index})
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      expectation.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {expectation.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{expectation.description}</p>
                  <img 
                    src={expectation.image_url} 
                    alt={expectation.title}
                    className="w-32 h-20 object-cover rounded mb-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400";
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(expectation)}
                    className="bg-blue-500 text-white text-sm"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(expectation.id)}
                    className="bg-red-500 text-white text-sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {expectations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No expectations found. Create your first expectation!
        </div>
      )}
    </div>
  );
};
