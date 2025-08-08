import React, { useState, useEffect } from 'react';
import { useSidebar } from '../../hooks/useSidebar';
import { LayoutDashboard, FileText, Menu, ChevronLeft, Settings } from 'lucide-react';
import NavItem from './NavItem';
import SidebarSection from './SidebarSection';
import { getNavBadges } from '../../lib/nav/mockNavBadges';

// TODO: Hook real nav items in Step 3.
// TODO: Refine a11y for drawer focus trapping later.
// TODO: Wire badges to real counts later (e.g., total documents, unread questions).

const Sidebar: React.FC = () => {
  const { collapsed, toggle, isMobile, closeDrawer } = useSidebar();
  const [badges, setBadges] = useState({ documents: 0, questionsNew: 0 });

  useEffect(() => {
    const loadBadges = async () => {
      const badgeData = await getNavBadges();
      setBadges(badgeData);
    };
    loadBadges();
  }, []);

  return (
    <nav 
      aria-label="Primary"
      className="h-full flex flex-col bg-slate-800/80 backdrop-blur-md border-r border-slate-700/50"
    >
      {/* Header with toggle button */}
      <div className={`flex items-center p-4 border-b border-slate-700/50 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">S</span>
            </div>
            <span className="text-white font-semibold">Spectra</span>
          </div>
        )}
        <button
          onClick={toggle}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2 focus:ring-offset-slate-800"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <Menu className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation content */}
      <div className={`flex-1 overflow-y-auto p-4 ${collapsed ? 'flex flex-col items-center space-y-4' : 'space-y-6'}`}>
        {/* TODO: Hook real nav items in Step 3. */}
        <SidebarSection title="Main" collapsed={collapsed}>
          <NavItem
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
            href="/dashboard"
            collapsed={collapsed}
            onClick={isMobile ? closeDrawer : undefined}
          />
          <NavItem
            icon={<FileText className="w-5 h-5" />}
            label="PDF Viewer"
            href="/app"
            collapsed={collapsed}
            onClick={isMobile ? closeDrawer : undefined}
          />
        </SidebarSection>

        <SidebarSection title="Tools" collapsed={collapsed}>
          <NavItem
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
            href="/settings"
            collapsed={collapsed}
            onClick={isMobile ? closeDrawer : undefined}
          />
        </SidebarSection>

        {/* TODO: Add future sections here */}
      </div>
    </nav>
  );
};

export default Sidebar;
