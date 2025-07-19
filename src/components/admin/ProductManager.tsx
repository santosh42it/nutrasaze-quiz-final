import React, { useState } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import type { Product } from '../../types/database';

export const ProductManager: React.FC = () => {
  const { products, tags, addProduct, updateProduct, deleteProduct } = useAdminStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({});
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.description) return;

    await addProduct({
      ...newProduct as Product,
      is_active: true,
    });
    setIsAdding(false);
    setNewProduct({});
    setSelectedTags([]);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-6">Products</h2>

      <div className="space-y-4">
        {products.map((product) => (
          <div key={product.id} className="border p-4 rounded">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.description}</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Delete
                </button>
                <button
                  onClick={() => updateProduct(product.id, { is_active: !product.is_active })}
                  className={`text-sm hover:underline ${product.is_active ? 'text-green-600' : 'text-gray-600'}`}
                >
                  {product.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Product Name
            </label>
            <input
              type="text"
              value={newProduct.name || ''}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={newProduct.description || ''}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Image URL
            </label>
            <input
              type="text"
              value={newProduct.image_url || ''}
              onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tags
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <label key={tag.id} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTags([...selectedTags, tag.id]);
                      } else {
                        setSelectedTags(selectedTags.filter(id => id !== tag.id));
                      }
                    }}
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">{tag.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Add Product
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewProduct({});
                setSelectedTags([]);
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Add New Product
        </button>
      )}
    </div>
  );
};