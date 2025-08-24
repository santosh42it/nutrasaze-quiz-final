
import React from 'react';
import type { Tag } from '../../types/database';

interface TagDisplayProps {
  tags: Tag[];
  className?: string;
}

export const TagDisplay: React.FC<TagDisplayProps> = ({ tags, className = '' }) => {
  if (tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-4 justify-center ${className}`}>
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="flex flex-col items-center gap-2 p-3"
        >
          {tag.icon_url && (
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#5a303e' }}>
              <img
                src={tag.icon_url}
                alt={tag.name}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `
                    <div class="w-full h-full bg-[#913177] text-white flex items-center justify-center text-lg font-bold">
                      ${tag.name.charAt(0).toUpperCase()}
                    </div>
                  `;
                }}
              />
            </div>
          )}
          <div className="text-center">
            <h3 className="text-sm font-medium text-[#1d0917]">{tag.name}</h3>
            {tag.title && (
              <p className="text-xs text-gray-600 mt-1">{tag.title}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
