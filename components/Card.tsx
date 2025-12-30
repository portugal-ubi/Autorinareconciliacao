import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action }) => {
  return (
    <div className={`bg-white dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden transition-colors duration-200 ${className}`}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/[0.02]">
          {title && <h3 className="text-lg font-medium text-gray-900 dark:text-white tracking-wide">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};