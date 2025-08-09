import React from 'react';

// TODO: Hook real nav items in Step 3.

interface SidebarSectionProps {
  title?: string;
  children: React.ReactNode;
  collapsed?: boolean;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  children,
  collapsed = false,
}) => {
  return (
    <div className={`space-y-2 ${collapsed ? 'w-full' : ''}`}>
      {title && !collapsed && (
        <div className="px-4 py-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </h3>
        </div>
      )}
      <div className={`${collapsed ? 'flex flex-col items-center space-y-2' : 'space-y-1'}`}>
        {children}
      </div>
    </div>
  );
};

export default SidebarSection;
