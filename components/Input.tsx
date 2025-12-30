import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`
          w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-sm px-4 py-2.5 
          text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 
          focus:border-[#e82127] focus:ring-1 focus:ring-[#e82127] 
          focus:outline-none transition-all duration-200
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};