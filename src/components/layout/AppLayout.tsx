import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Settings,
  LogOut,
  LogIn,
} from 'lucide-react';
import { ChatWidget } from '@/components/chat/ChatWidget';
import Dock from '@/components/ui/Dock';
import FloatingLines from '@/components/ui/FloatingLines';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const authenticatedDockItems = [
    {
      icon: <LayoutDashboard size={24} className="text-white" />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
      className: location.pathname === '/dashboard' ? 'bg-primary/20 border-primary' : ''
    },
    {
      icon: <CheckSquare size={24} className="text-white" />,
      label: 'Tasks',
      onClick: () => navigate('/tasks'),
      className: location.pathname === '/tasks' ? 'bg-primary/20 border-primary' : ''
    },
    {
      icon: <FileText size={24} className="text-white" />,
      label: 'Notes',
      onClick: () => navigate('/notes'),
      className: location.pathname === '/notes' ? 'bg-primary/20 border-primary' : ''
    },
    {
      icon: <Settings size={24} className="text-white" />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
      className: location.pathname === '/settings' ? 'bg-primary/20 border-primary' : ''
    },
    {
      icon: <LogOut size={24} className="text-red-400" />,
      label: 'Sign Out',
      onClick: handleSignOut
    },
  ];

  const guestDockItems = [
    {
      icon: <LogIn size={24} className="text-green-400" />,
      label: 'Login / Sign Up',
      onClick: () => navigate('/auth'),
      className: location.pathname === '/auth' ? 'bg-primary/20 border-primary' : ''
    }
  ];

  const dockItems = user ? authenticatedDockItems : guestDockItems;

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Animation - Same as Login Page */}
      {/* Background Animation - Hidden on mobile for performance, generic for non-landing pages */}
      {location.pathname !== '/' && (
        <div className="absolute inset-0 z-0 pointer-events-none hidden md:block">
          <FloatingLines
            enabledWaves={['top', 'middle', 'bottom']}
            lineCount={[10, 15, 20]}
            lineDistance={[8, 6, 4]}
            bendRadius={5.0}
            bendStrength={-0.5}
            interactive={true}
            parallax={true}
            linesGradient={['#ff00ff', '#0000ff']}
            mixBlendMode="screen"
          />
        </div>
      )}

      {/* Main Content */}
      <main className="min-h-screen pb-24 relative z-10">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Dock Navigation */}
      <Dock
        items={dockItems}
        panelHeight={68}
        baseItemSize={50}
        magnification={70}
      />

      {/* n8n Chat Bot Widget */}
      <ChatWidget />
    </div>
  );
}