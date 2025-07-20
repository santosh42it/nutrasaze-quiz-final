
import React, { useState } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import type { Product } from '../../types/database';

export const ProductManager: React.FC = () => {
  const { products, tags, addProduct, updateProduct, deleteProduct, fetchProducts } = useAdminStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({});
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.description) return;

    try {
      if (editingProduct) {
        // Update product details
        await updateProduct(editingProduct.id, {
          ...newProduct,
          mrp: newProduct.mrp ? Number(newProduct.mrp) : undefined,
          srp: newProduct.srp ? Number(newProduct.srp) : undefined,
        });

        // Update product tags
        // First, remove all existing tag associations
        await supabase
          .from('product_tags')
          .delete()
          .eq('product_id', editingProduct.id);

        // Then add the new tag associations
        if (selectedTags.length > 0) {
          const tagInserts = selectedTags.map(tagId => ({
            product_id: editingProduct.id,
            tag_id: tagId
          }));
          
          await supabase
            .from('product_tags')
            .insert(tagInserts);
        }

        // Refresh products list to show updated data
        await fetchProducts();
        
        setEditingProduct(null);
      } else {
        // Create new product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .insert([{
            ...newProduct as Product,
            mrp: newProduct.mrp ? Number(newProduct.mrp) : undefined,
            srp: newProduct.srp ? Number(newProduct.srp) : undefined,
            is_active: true,
          }])
          .select()
          .single();

        if (productError) throw productError;

        // Add tag associations for new product
        if (selectedTags.length > 0 && productData) {
          const tagInserts = selectedTags.map(tagId => ({
            product_id: productData.id,
            tag_id: tagId
          }));
          
          await supabase
            .from('product_tags')
            .insert(tagInserts);
        }

        // Refresh products list
        await fetchProducts();
        setIsAdding(false);
      }
      
      setNewProduct({});
      setSelectedTags([]);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      image_url: product.image_url,
      url: product.url,
      mrp: product.mrp,
      srp: product.srp,
    });
    
    // Fetch and set existing tags for this product
    try {
      const { data: productTags } = await supabase
        .from('product_tags')
        .select('tag_id')
        .eq('product_id', product.id);
      
      if (productTags) {
        setSelectedTags(productTags.map(pt => pt.tag_id));
      }
    } catch (error) {
      console.error('Error fetching product tags:', error);
    }
    
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingProduct(null);
    setNewProduct({});
    setSelectedTags([]);
  };

  const handleDeleteClick = (product: Product) => {
    setDeleteDialog({ isOpen: true, product });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.product) {
      await deleteProduct(deleteDialog.product.id);
      setDeleteDialog({ isOpen: false, product: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, product: null });
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="[font-family:'DM_Serif_Display',Helvetica] text-2xl text-[#1d0917]">
          Product Management
        </h2>
        {!isAdding && !editingProduct && (
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-[#913177] text-white hover:bg-[#913177]/90"
          >
            + Add New Product
          </Button>
        )}
      </div>

      {/* Add/Edit Product Form */}
      {(isAdding || editingProduct) && (
        <Card className="border-[#e9d6e4] bg-white">
          <CardContent className="p-6">
            <h3 className="[font-family:'DM_Serif_Display',Helvetica] text-xl text-[#1d0917] mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1d0917] mb-2">
                    Product Name *
                  </label>
                  <Input
                    type="text"
                    value={newProduct.name || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Enter product name"
                    className="border-[#e9d6e4]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1d0917] mb-2">
                    Product URL
                  </label>
                  <Input
                    type="url"
                    value={newProduct.url || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, url: e.target.value })}
                    placeholder="https://example.com/product"
                    className="border-[#e9d6e4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1d0917] mb-2">
                    MRP (₹)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newProduct.mrp || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, mrp: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="Enter MRP"
                    className="border-[#e9d6e4]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1d0917] mb-2">
                    SRP (₹)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newProduct.srp || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, srp: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="Enter SRP"
                    className="border-[#e9d6e4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1d0917] mb-2">
                  Description *
                </label>
                <textarea
                  value={newProduct.description || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Enter product description"
                  className="w-full px-3 py-2 border border-[#e9d6e4] rounded-md focus:outline-none focus:ring-2 focus:ring-[#913177] focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1d0917] mb-2">
                  Image URL
                </label>
                <Input
                  type="url"
                  value={newProduct.image_url || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="border-[#e9d6e4]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1d0917] mb-2">
                  Tags
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                        className="rounded border-[#e9d6e4] text-[#913177] focus:ring-[#913177]"
                      />
                      <span className="ml-2 text-sm text-[#1d0917]">{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button
                  type="submit"
                  className="bg-[#913177] text-white hover:bg-[#913177]/90"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
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

      {/* Existing Products Grid */}
      <div>
        <h3 className="[font-family:'DM_Serif_Display',Helvetica] text-xl text-[#1d0917] mb-4">
          Existing Products ({products.length})
        </h3>
        
        {products.length === 0 ? (
          <Card className="border-[#e9d6e4] bg-white">
            <CardContent className="p-8 text-center">
              <p className="text-[#3d3d3d] mb-4">No products created yet</p>
              <Button
                onClick={() => setIsAdding(true)}
                className="bg-[#913177] text-white hover:bg-[#913177]/90"
              >
                Create Your First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="border-[#e9d6e4] bg-white hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {product.image_url && (
                    <div className="mb-3">
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-[#1d0917] text-lg">{product.name}</h4>
                    <p className="text-sm text-[#3d3d3d] line-clamp-2">{product.description}</p>
                    
                    {(product.mrp || product.srp) && (
                      <div className="flex items-center gap-2 text-sm">
                        {product.mrp && (
                          <span className="text-gray-500 line-through">MRP: ₹{product.mrp}</span>
                        )}
                        {product.srp && (
                          <span className="text-[#913177] font-medium">SRP: ₹{product.srp}</span>
                        )}
                      </div>
                    )}
                    
                    {product.url && (
                      <a 
                        href={product.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-[#913177] hover:underline block truncate"
                      >
                        View Product →
                      </a>
                    )}
                    
                    <div className="flex items-center justify-between pt-3 border-t border-[#e9d6e4]">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-xs text-[#913177] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => updateProduct(product.id, { is_active: !product.is_active })}
                          className="text-xs text-[#913177] hover:underline"
                        >
                          {product.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product)}
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
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteDialog.product?.name}"? This action cannot be undone and may affect quiz recommendations that reference this product.`}
      />
    </div>
  );
};
