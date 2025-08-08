import React from 'react';
import { useLocation } from 'react-router-dom';
import Tooltip from '../ui/Tooltip';
import Badge from '../ui/Badge';

// TODO: Hook real nav items in Step 3.

interface NavItemProps {
  icon?: React.ReactNode;
  label: string;
  href?: string;
  isActive?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  href,
  isActive = false,
  onClick,
  collapsed = false,
  badge,
}) => {
  const location = useLocation();
  const isCurrentRoute = href ? location.pathname === href : isActive;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
  };

  const baseClasses = `
    flex items-center ${collapsed ? 'justify-center' : 'gap-3'} ${collapsed ? 'px-3 py-3' : 'px-4 py-3'} rounded-xl 
    transition-all duration-200 ease-out
    text-slate-300 hover:text-white hover:bg-slate-700/50
    hover:translate-x-1 hover:shadow-lg hover:shadow-slate-700/20
    focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2 focus:ring-offset-slate-800
    ${isCurrentRoute ? 'bg-slate-700/50 text-white shadow-lg shadow-blue-500/20' : ''}
    ${collapsed ? 'w-12 h-12' : ''}
  `;

  const content = (
    <>
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center relative text-slate-300">
        {icon}
        {badge && (
          <Badge 
            count={badge} 
            size="sm" 
            className="absolute -top-1 -right-1" 
          />
        )}
      </div>
      {!collapsed && (
        <span className="flex-1 truncate font-medium">{label}</span>
      )}
    </>
  );

  const navElement = (
    <>
      {href ? (
        <a
          href={href}
          className={baseClasses}
          onClick={handleClick}
          aria-current={isCurrentRoute ? 'page' : undefined}
        >
          {content}
        </a>
      ) : (
        <button
          type="button"
          className={baseClasses}
          onClick={handleClick}
          aria-pressed={isCurrentRoute}
        >
          {content}
        </button>
      )}
    </>
  );

  // Wrap with tooltip when collapsed
  if (collapsed) {
    return (
      <Tooltip content={label} position="right">
        {navElement}
      </Tooltip>
    );
  }

  return navElement;
};

export default NavItem;
