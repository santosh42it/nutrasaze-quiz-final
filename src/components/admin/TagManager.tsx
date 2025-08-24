import React, { useState } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import type { Tag } from '../../types/database';

export const TagManager: React.FC = () => {
  const { tags, addTag, updateTag, deleteTag } = useAdminStore();
  const [newTagName, setNewTagName] = useState('');
  const [newTagIconUrl, setNewTagIconUrl] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagIconUrl, setEditTagIconUrl] = useState('');
  const [editTagDescription, setEditTagDescription] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; tag: Tag | null }>({
    isOpen: false,
    tag: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    await addTag(newTagName, newTagIconUrl, newTagDescription);
    setNewTagName('');
    setNewTagIconUrl('');
    setNewTagDescription('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !editTagName.trim()) return;

    await updateTag(editingTag.id, editTagName, editTagIconUrl, editTagDescription);
    setEditingTag(null);
    setEditTagName('');
    setEditTagIconUrl('');
    setEditTagDescription('');
  };

  const startEdit = (tag: Tag) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
    setEditTagIconUrl(tag.icon_url || '');
    setEditTagDescription(tag.description || '');
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setEditTagName('');
    setEditTagIconUrl('');
    setEditTagDescription('');
  };

  const handleDeleteClick = (tag: Tag) => {
    setDeleteDialog({ isOpen: true, tag });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.tag) {
      await deleteTag(deleteDialog.tag.id);
      setDeleteDialog({ isOpen: false, tag: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, tag: null });
  };

  return (
    <Card className="border-[#e9d6e4] bg-white">
      <CardContent className="p-6">
        <h2 className="[font-family:'DM_Serif_Display',Helvetica] text-2xl text-[#1d0917] mb-6">
          Tags
        </h2>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="space-y-3">
            <Input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Enter tag name"
              className="border-[#e9d6e4]"
            />
            <Input
              type="url"
              value={newTagIconUrl}
              onChange={(e) => setNewTagIconUrl(e.target.value)}
              placeholder="Enter icon URL (optional)"
              className="border-[#e9d6e4]"
            />
            <Input
              type="text"
              value={newTagDescription}
              onChange={(e) => setNewTagDescription(e.target.value)}
              placeholder="Enter description (optional)"
              className="border-[#e9d6e4]"
            />
            <Button
              type="submit"
              className="bg-[#913177] text-white hover:bg-[#913177]/90"
              disabled={!newTagName.trim()}
            >
              Add Tag
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          {editingTag && (
            <form onSubmit={handleEditSubmit} className="p-4 bg-[#fff4fc] rounded-md border border-[#e9d6e4]">
              <h3 className="text-lg font-medium text-[#1d0917] mb-3">Edit Tag</h3>
              <div className="space-y-3">
                <Input
                  type="text"
                  value={editTagName}
                  onChange={(e) => setEditTagName(e.target.value)}
                  placeholder="Tag name"
                  className="border-[#e9d6e4]"
                />
                <Input
                  type="url"
                  value={editTagIconUrl}
                  onChange={(e) => setEditTagIconUrl(e.target.value)}
                  placeholder="Icon URL (optional)"
                  className="border-[#e9d6e4]"
                />
                <Input
                  type="text"
                  value={editTagDescription}
                  onChange={(e) => setEditTagDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="border-[#e9d6e4]"
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="bg-[#913177] text-white hover:bg-[#913177]/90"
                    disabled={!editTagName.trim()}
                  >
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    onClick={cancelEdit}
                    variant="ghost"
                    className="text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="bg-[#fff4fc] rounded-lg p-4 border border-[#e9d6e4] flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {tag.icon_url && (
                      <img
                        src={tag.icon_url}
                        alt={tag.name}
                        className="w-8 h-8 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <h4 className="font-medium text-[#1d0917]">{tag.name}</h4>
                      {tag.description && (
                        <p className="text-sm text-gray-600">{tag.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(tag)}
                      className="text-[#913177] hover:text-[#913177]/80 p-1"
                      title="Edit tag"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteClick(tag)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete tag"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Tag"
          description={`Are you sure you want to delete the tag "${deleteDialog.tag?.name}"? This action cannot be undone and will remove this tag from all associated questions and products, which may affect quiz functionality.`}
        />
      </CardContent>
    </Card>
  );
};