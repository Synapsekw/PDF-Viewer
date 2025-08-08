import React from 'react';

interface BadgeProps {
  count: number;
  size?: 'sm' | 'md';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  count, 
  size = 'sm',
  className = '' 
}) => {
  if (count === 0 || count === undefined) return null;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3 text-xs',
  };

  return (
    <div
      className={`
        flex items-center justify-center
        bg-red-500 text-white font-medium
        rounded-full
        ${sizeClasses[size]}
        shadow-lg shadow-red-500/25
        transition-all duration-200 ease-out
        ${className}
      `}
    >
      {size === 'sm' ? '' : (count > 99 ? '99+' : count)}
    </div>
  );
};

export default Badge;
