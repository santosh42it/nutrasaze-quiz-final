import React, { useState } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import type { Product } from '../../types/database';

interface ProductModalProps {
  isOpen: boolean;
  product: Product | null;
  onSave: (productData: Partial<Product>) => Promise<void>;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, product, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: product?.name || '',
    description: product?.description || '',
    image_url: product?.image_url || '',
    url: product?.url || '',
    mrp: product?.mrp || undefined,
    srp: product?.srp || undefined,
  });

  React.useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        image_url: product.image_url,
        url: product.url,
        mrp: product.mrp,
        srp: product.srp,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        image_url: '',
        url: '',
        mrp: undefined,
        srp: undefined,
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) return;

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="[font-family:'DM_Serif_Display',Helvetica] text-xl text-[#1d0917]">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1d0917] mb-2">
                Product Name *
              </label>
              <Input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                value={formData.url || ''}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
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
                value={formData.mrp || ''}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value ? parseFloat(e.target.value) : undefined })}
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
                value={formData.srp || ''}
                onChange={(e) => setFormData({ ...formData, srp: e.target.value ? parseFloat(e.target.value) : undefined })}
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
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              value={formData.image_url || ''}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="border-[#e9d6e4]"
            />
          </div>

          

          <div className="flex items-center gap-4 pt-4">
            <Button
              type="submit"
              className="bg-[#913177] text-white hover:bg-[#913177]/90"
            >
              {product ? 'Update Product' : 'Add Product'}
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

export const ProductManager: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, fetchProducts } = useAdminStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null
  });

  // Load products when component mounts
  React.useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        await fetchProducts();
        console.log('Products loaded:', products);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [fetchProducts]);

  const handleSave = async (productData: Partial<Product>) => {
    if (editingProduct) {
      // Update product details directly through Supabase
      const updateData = {
        name: productData.name,
        description: productData.description,
        image_url: productData.image_url || null,
        url: productData.url || null,
        mrp: productData.mrp ? Number(productData.mrp) : null,
        srp: productData.srp ? Number(productData.srp) : null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', editingProduct.id);

      if (updateError) {
        console.error('Product update error:', updateError);
        throw updateError;
      }
    } else {
      // Create new product
      const { error: productError } = await supabase
        .from('products')
        .insert([{
          ...productData as Product,
          mrp: productData.mrp ? Number(productData.mrp) : undefined,
          srp: productData.srp ? Number(productData.srp) : undefined,
          is_active: true,
        }]);

      if (productError) {
        console.error('Product creation error:', productError);
        throw productError;
      }
    }

    // Refresh products list
    await fetchProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingProduct(null);
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
        <Button
          onClick={handleAddNew}
          className="bg-[#913177] text-white hover:bg-[#913177]/90"
        >
          + Add New Product
        </Button>
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={modalOpen}
        product={editingProduct}
        onSave={handleSave}
        onClose={handleModalClose}
      />

      {/* Existing Products Grid */}
      <div>
        <h3 className="[font-family:'DM_Serif_Display',Helvetica] text-xl text-[#1d0917] mb-4">
          Existing Products ({products.length})
        </h3>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
            Debug: Products loaded: {products.length} | Loading: {loading ? 'Yes' : 'No'}
          </div>
        )}

        {loading ? (
          <Card className="border-[#e9d6e4] bg-white">
            <CardContent className="p-8 text-center">
              <p className="text-[#3d3d3d]">Loading products...</p>
            </CardContent>
          </Card>
        ) : products.length === 0 ? (
          <Card className="border-[#e9d6e4] bg-white">
            <CardContent className="p-8 text-center">
              <p className="text-[#3d3d3d] mb-4">No products created yet</p>
              <Button
                onClick={handleAddNew}
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
        description={`Are you sure you want to delete the product "${deleteDialog.product?.name}"? This action cannot be undone and may affect quiz recommendations.`}
      />
    </div>
  );
};