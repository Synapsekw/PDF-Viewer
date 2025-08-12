import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../../hooks/useSidebar';
import { LayoutDashboard, FileText, Menu, ChevronLeft, Settings, User, Library, BarChart3, Home, Shield, LogOut } from 'lucide-react';
import NavItem from './NavItem';
import SidebarSection from './SidebarSection';
import { getNavBadges } from '../../lib/nav/mockNavBadges';
import { repositoryManager } from '../../lib/repositories/RepositoryManager';



// TODO: Hook real nav items in Step 3.
// TODO: Refine a11y for drawer focus trapping later.
// TODO: Wire badges to real counts later (e.g., total documents, unread questions).

const Sidebar: React.FC = () => {
  const { collapsed, toggle, isMobile, closeDrawer } = useSidebar();
  const navigate = useNavigate();
  const [badges, setBadges] = useState({ documents: 0, questionsNew: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadBadges = async () => {
      const badgeData = await getNavBadges();
      setBadges(badgeData);
    };
    loadBadges();

    // Set up auth state listener
    const setupAuthListener = async () => {
      const { SupabaseClientManager } = await import('../../lib/supabase/client');
      const supabase = SupabaseClientManager.getClient();
      
      if (supabase) {
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
          setIsAuthenticated(!!session);
          if (session) {
            checkUserAdminStatus();
          }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('🔄 Auth state changed:', event, session?.user?.email);
          setIsAuthenticated(!!session);
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Check admin status when user signs in
            checkUserAdminStatus();
          } else if (event === 'SIGNED_OUT') {
            setIsAdmin(false);
          }
        });

        return () => subscription.unsubscribe();
      }
    };

    const cleanup = setupAuthListener();
    return () => {
      cleanup?.then(fn => fn?.());
    };
  }, []);

  const checkUserAdminStatus = async () => {
    try {
      const { SupabaseClientManager } = await import('../../lib/supabase/client');
      const supabase = SupabaseClientManager.getClient();
      
      if (!supabase) return;

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setIsAdmin(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        const settings = profile.settings as any || {};
        const isAdminUser = settings.role === 'admin' || settings.permissions?.includes('admin');
        setIsAdmin(isAdminUser);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.warn('Failed to check admin status:', error);
      setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { SupabaseClientManager } = await import('../../lib/supabase/client');
      const supabase = SupabaseClientManager.getClient();
      
      if (supabase) {
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Logout error:', error);
          return;
        }
      }
      
      // Clear all local storage and session storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Reset repository manager to local mode
      repositoryManager.configure({ mode: 'local' });
      
      // Navigate to home page
      navigate('/');
      
      console.log('Successfully logged out');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };



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
            icon={<Home className="w-5 h-5" />}
            label="Home"
            href="/"
            collapsed={collapsed}
            onClick={isMobile ? closeDrawer : undefined}
          />
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
          <NavItem
            icon={<Library className="w-5 h-5" />}
            label="Library"
            href="/library"
            collapsed={collapsed}
            onClick={isMobile ? closeDrawer : undefined}
          />
          <NavItem
            icon={<BarChart3 className="w-5 h-5" />}
            label="Reports"
            href="/reports"
            collapsed={collapsed}
            onClick={isMobile ? closeDrawer : undefined}
          />
        </SidebarSection>

        <SidebarSection title="Account" collapsed={collapsed}>
          <NavItem
            icon={<User className="w-5 h-5" />}
            label="Profile"
            href="/user"
            collapsed={collapsed}
            onClick={isMobile ? closeDrawer : undefined}
          />
          <NavItem
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
            href="/settings"
            collapsed={collapsed}
            onClick={isMobile ? closeDrawer : undefined}
          />
        </SidebarSection>

        {/* Admin Section - Only visible to admin users */}
        {(isAdmin || process.env.NODE_ENV === 'development') && (
          <SidebarSection title="Admin" collapsed={collapsed}>
            <NavItem
              icon={<Shield className="w-5 h-5" />}
              label={isAdmin ? "Admin Panel" : "Admin Panel (Dev)"}
              href="/admin"
              collapsed={collapsed}
              onClick={isMobile ? closeDrawer : undefined}
            />
          </SidebarSection>
        )}



        {/* TODO: Add future sections here */}
      </div>

      {/* Logout Button - Only show when authenticated */}
      {isAuthenticated && (
        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-2 
              text-slate-300 hover:text-white hover:bg-slate-700/50 
              rounded-lg transition-colors
              ${collapsed ? 'justify-center' : 'justify-start'}
            `}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      )}
    </nav>
  );
};

export default Sidebar;
