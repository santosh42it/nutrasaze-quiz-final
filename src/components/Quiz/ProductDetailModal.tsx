
import React from 'react';
import { Button } from '../ui/button';
import type { Product } from '../../types/database';

interface ProductDetailModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ isOpen, product, onClose }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1d0917]">{product.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          {/* Product Image */}
          {product.image_url && (
            <div className="mb-6 flex justify-center">
              <div className="w-64 h-64">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-contain rounded-lg bg-gray-50 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400";
                  }}
                />
              </div>
            </div>
          )}

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-[#913177]">
                ₹{product.srp || product.mrp || '999'}
              </span>
              {product.mrp && product.srp && product.mrp > product.srp && (
                <span className="text-lg text-gray-500 line-through">
                  ₹{product.mrp}
                </span>
              )}
            </div>
            {product.mrp && product.srp && product.mrp > product.srp && (
              <div className="text-sm text-green-600 font-medium">
                Save ₹{product.mrp - product.srp} ({Math.round(((product.mrp - product.srp) / product.mrp) * 100)}% off)
              </div>
            )}
          </div>

          {/* Full Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#1d0917] mb-3">Description</h3>
            <div 
              className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: product.description || 'No description available.' 
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-[#e9d6e4] text-[#1d0917] hover:bg-[#fff4fc] px-8"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
