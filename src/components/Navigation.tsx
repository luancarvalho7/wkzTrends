import React from 'react';
import { Play, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavigationProps {
  currentPage: 'feed' | 'settings';
  onPageChange: (page: 'feed' | 'settings') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  return (
    <>
      {/* Mobile Bottom Navigation */}
      <motion.nav 
        className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 z-50 md:hidden"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-4">
            <button 
              className={`flex flex-col items-center transition-colors ${
                currentPage === 'feed' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => onPageChange('feed')}
            >
              <Play className="w-6 h-6" />
              <span className="text-xs mt-1">Feed</span>
            </button>
            <button 
              className={`flex flex-col items-center transition-colors ${
                currentPage === 'settings' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => onPageChange('settings')}
            >
              <Settings className="w-6 h-6" />
              <span className="text-xs mt-1">Settings</span>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Desktop Sidebar */}
      <motion.nav
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-16 bg-white/90 backdrop-blur-lg border-r border-gray-200 z-50 flex-col items-center py-8"
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col items-center space-y-8 py-10">
          <button 
            className={`p-3 rounded-lg transition-colors ${
              currentPage === 'feed' 
                ? 'bg-gray-200 text-gray-900' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            onClick={() => onPageChange('feed')}
          >
            <Play className="w-6 h-6" />
          </button>
          <button 
            className={`p-3 rounded-lg transition-colors ${
              currentPage === 'settings' 
                ? 'bg-gray-200 text-gray-900' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            onClick={() => onPageChange('settings')}
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </motion.nav>
    </>
  );
};

export default Navigation;