import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Clock, Heart, MessageCircle, Share2, ChevronDown } from 'lucide-react';
import { SortOption } from '../types';

interface FilterBarProps {
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  activeSort,
  onSortChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions = [
    { value: 'popular', label: 'Popular', icon: TrendingUp },
    { value: 'latest', label: 'Latest', icon: Clock },
    { value: 'likes', label: 'Likes', icon: Heart },
    { value: 'comments', label: 'Comments', icon: MessageCircle },
    { value: 'shares', label: 'Shares', icon: Share2 },
  ];

  const activeOption = sortOptions.find(option => option.value === activeSort);
  const Icon = activeOption?.icon || TrendingUp;

  const handleSelect = (value: SortOption) => {
    onSortChange(value);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        className="w-full flex items-center justify-between px-4 py-2 text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center">
          <Icon className="h-4 w-4 mr-2" />
          <span>{activeOption?.label}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {sortOptions.map((option) => {
              const OptionIcon = option.icon;
              const isActive = activeSort === option.value;
              
              return (
                <motion.button
                  key={option.value}
                  className={`w-full flex items-center px-4 py-3 text-sm transition-colors ${
                    isActive 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => handleSelect(option.value as SortOption)}
                  whileTap={{ scale: 0.98 }}
                >
                  <OptionIcon className="h-4 w-4 mr-2" />
                  {option.label}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterBar;