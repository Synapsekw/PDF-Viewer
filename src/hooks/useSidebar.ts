import { useState, useEffect } from 'react';

// TODO: Refine a11y for drawer focus trapping later.

interface UseSidebarReturn {
  collapsed: boolean;
  isMobile: boolean;
  isOpen: boolean;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useSidebar = (): UseSidebarReturn => {
  const [collapsed, setCollapsedState] = useState<boolean>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem('sidebar:collapsed');
    return stored ? JSON.parse(stored) : false;
  });

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Close drawer when switching to desktop
      if (!mobile && isOpen) {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if focus is in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === '[' && !isMobile) {
        e.preventDefault();
        setCollapsedState(true);
      } else if (e.key === ']' && !isMobile) {
        e.preventDefault();
        setCollapsedState(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isOpen]);

  const toggle = () => {
    if (isMobile) {
      setIsOpen(!isOpen);
    } else {
      setCollapsedState(prev => !prev);
    }
  };

  const setCollapsed = (collapsed: boolean) => {
    setCollapsedState(collapsed);
  };

  const openDrawer = () => {
    if (isMobile) {
      setIsOpen(true);
    }
  };

  const closeDrawer = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // Persist to localStorage whenever collapsed state changes
  useEffect(() => {
    localStorage.setItem('sidebar:collapsed', JSON.stringify(collapsed));
    
    // Update CSS variables for sidebar width (desktop only)
    if (!isMobile) {
      const root = document.documentElement;
      const newWidth = collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w-expanded)';
      root.style.setProperty('--sidebar-w', newWidth);
    }
  }, [collapsed, isMobile]);

  return {
    collapsed,
    isMobile,
    isOpen,
    toggle,
    setCollapsed,
    openDrawer,
    closeDrawer,
  };
};
