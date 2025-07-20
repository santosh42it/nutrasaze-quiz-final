import React, { useState } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import type { Tag } from '../../types/database';

export const TagManager: React.FC = () => {
  const { tags, addTag, deleteTag } = useAdminStore();
  const [newTagName, setNewTagName] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; tag: Tag | null }>({
    isOpen: false,
    tag: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    await addTag(newTagName);
    setNewTagName('');
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
          <div className="flex gap-2">
            <Input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Enter new tag name"
              className="border-[#e9d6e4]"
            />
            <Button
              type="submit"
              className="bg-[#913177] text-white hover:bg-[#913177]/90"
            >
              Add Tag
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="bg-[#fff4fc] rounded-full px-3 py-1 flex items-center gap-2"
            >
              <span className="text-[#1d0917]">{tag.name}</span>
              <button
                onClick={() => handleDeleteClick(tag)}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          ))}
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