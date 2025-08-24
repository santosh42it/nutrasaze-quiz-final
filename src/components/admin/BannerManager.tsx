
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';

interface Banner {
  id: number;
  name: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BannerModalProps {
  isOpen: boolean;
  banner: Banner | null;
  onSave: (bannerData: Partial<Banner>) => Promise<void>;
  onClose: () => void;
}

const BannerModal: React.FC<BannerModalProps> = ({ isOpen, banner, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<Banner>>({
    name: banner?.name || '',
    image_url: banner?.image_url || '',
  });

  React.useEffect(() => {
    if (banner) {
      setFormData({
        name: banner.name,
        image_url: banner.image_url,
      });
    } else {
      setFormData({
        name: '',
        image_url: '',
      });
    }
  }, [banner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.image_url) return;

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Failed to save banner. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="[font-family:'DM_Serif_Display',Helvetica] text-xl text-[#1d0917]">
            {banner ? 'Edit Banner' : 'Add New Banner'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1d0917] mb-2">
              Banner Name *
            </label>
            <Input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter banner name"
              className="border-[#e9d6e4]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d0917] mb-2">
              Banner Image URL *
            </label>
            <Input
              type="url"
              value={formData.image_url || ''}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/banner.jpg"
              className="border-[#e9d6e4]"
            />
          </div>

          {formData.image_url && (
            <div>
              <label className="block text-sm font-medium text-[#1d0917] mb-2">
                Preview
              </label>
              <img 
                src={formData.image_url} 
                alt="Banner preview"
                className="w-full max-h-32 object-cover rounded-md border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="flex items-center gap-4 pt-4">
            <Button
              type="submit"
              className="bg-[#913177] text-white hover:bg-[#913177]/90"
            >
              {banner ? 'Update Banner' : 'Add Banner'}
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

export const BannerManager: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleSave = async (bannerData: Partial<Banner>) => {
    if (editingBanner) {
      // Update banner
      const { error } = await supabase
        .from('banners')
        .update({
          ...bannerData,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingBanner.id);

      if (error) throw error;
    } else {
      // Create new banner
      const { error } = await supabase
        .from('banners')
        .insert([{
          ...bannerData,
          is_active: true,
        }]);

      if (error) throw error;
    }

    await fetchBanners();
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingBanner(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingBanner(null);
  };

  const toggleBannerStatus = async (banner: Banner) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ 
          is_active: !banner.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', banner.id);

      if (error) throw error;
      await fetchBanners();
    } catch (error) {
      console.error('Error updating banner status:', error);
    }
  };

  const deleteBanner = async (bannerId: number) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', bannerId);

      if (error) throw error;
      await fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="[font-family:'DM_Serif_Display',Helvetica] text-2xl text-[#1d0917]">
          Banner Management
        </h2>
        <Button
          onClick={handleAddNew}
          className="bg-[#913177] text-white hover:bg-[#913177]/90"
        >
          + Add New Banner
        </Button>
      </div>

      {/* Banner Modal */}
      <BannerModal
        isOpen={modalOpen}
        banner={editingBanner}
        onSave={handleSave}
        onClose={handleModalClose}
      />

      {/* Existing Banners */}
      <div>
        <h3 className="[font-family:'DM_Serif_Display',Helvetica] text-xl text-[#1d0917] mb-4">
          Existing Banners ({banners.length})
        </h3>

        {loading ? (
          <Card className="border-[#e9d6e4] bg-white">
            <CardContent className="p-8 text-center">
              <p className="text-[#3d3d3d]">Loading banners...</p>
            </CardContent>
          </Card>
        ) : banners.length === 0 ? (
          <Card className="border-[#e9d6e4] bg-white">
            <CardContent className="p-8 text-center">
              <p className="text-[#3d3d3d] mb-4">No banners created yet</p>
              <Button
                onClick={handleAddNew}
                className="bg-[#913177] text-white hover:bg-[#913177]/90"
              >
                Create Your First Banner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <Card key={banner.id} className="border-[#e9d6e4] bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="[font-family:'DM_Serif_Display',Helvetica] text-lg text-[#1d0917] font-medium mb-2">
                        {banner.name}
                      </h4>
                    </div>
                    <div className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      banner.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <img 
                      src={banner.image_url} 
                      alt={banner.name}
                      className="w-full h-32 object-cover rounded-md"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleEdit(banner)}
                      size="sm"
                      className="bg-[#913177] text-white hover:bg-[#913177]/90 text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => toggleBannerStatus(banner)}
                      size="sm"
                      variant="outline"
                      className="border-[#e9d6e4] text-[#913177] hover:bg-[#fff4fc] text-xs"
                    >
                      {banner.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      onClick={() => deleteBanner(banner.id)}
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 text-xs"
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
