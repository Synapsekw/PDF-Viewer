import React from 'react';
import { useSidebar } from '../hooks/useSidebar';
import { Menu } from 'lucide-react';
import Sidebar from '../components/nav/Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { collapsed, isMobile, isOpen, openDrawer, closeDrawer } = useSidebar();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-inter">

      {/* Background gradient overlay with blur effect - matches landing exactly */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm"></div>
      
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={closeDrawer}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`
          fixed left-0 top-0 h-full transition-all duration-200 ease-out z-40
          ${isMobile ? 'w-80' : ''}
          ${isMobile && !isOpen ? '-translate-x-full' : ''}
        `}
        style={{ 
          width: isMobile ? undefined : 'var(--sidebar-w)',
        }}
      >
        <Sidebar />
      </div>



      {/* Content area */}
      <div 
        className="relative z-10 min-h-screen transition-all duration-200 ease-out"
        style={{ 
          marginLeft: isMobile ? 0 : 'var(--sidebar-w)',
        }}
      >
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppShell;
