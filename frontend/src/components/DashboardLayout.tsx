import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Calendar,
  TrendingUp,
  ChevronRight,
  Bell,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useLogout } from '../hooks/useAuth';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useNotifications } from '../hooks/useScheduler';
import { useState } from 'react';
import { NotificationPanel } from './NotificationPanel';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { name: 'Dashboard',  path: '/dashboard',            icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Group Chat', path: '/dashboard/group-chat', icon: <MessageSquare className="w-5 h-5" /> },
  { name: 'Notes & Test', path: '/dashboard/notes',   icon: <FileText className="w-5 h-5" /> },
  { name: 'Scheduler',  path: '/dashboard/scheduler', icon: <Calendar className="w-5 h-5" /> },
  { name: 'Progress',   path: '/dashboard/progress',  icon: <TrendingUp className="w-5 h-5" /> },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: logout, isPending } = useLogout();
  const { data: currentUser } = useCurrentUser();
  const { data: notifications = [] } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const initials = currentUser?.user
    ? `${currentUser.user.firstName?.[0] ?? ''}${currentUser.user.lastName?.[0] ?? ''}`.toUpperCase() || 'U'
    : 'U';

  const displayName = currentUser?.user
    ? `${currentUser.user.firstName ?? ''} ${currentUser.user.lastName ?? ''}`.trim()
      || currentUser.user.username
      || 'User'
    : 'User';

  const currentPage = navItems.find(item => item.path === location.pathname)?.name || 'Dashboard';

  return (
    /* Root: full viewport, no scroll, flex row */
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#f9fafb',
    }}>

      {/* ════ SIDEBAR ════ */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          width: '256px',
          minWidth: '256px',
          maxWidth: '256px',
          height: '100vh',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', flexShrink: 0,
              background: 'linear-gradient(to right, #667eea, #764ba2)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span style={{
              fontSize: '18px', fontWeight: 700,
              background: 'linear-gradient(to right, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              StudySync AI
            </span>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  // Active = purple gradient; inactive = plain white background, dark text
                  background: isActive
                    ? 'linear-gradient(to right, #667eea, #764ba2)'
                    : '#ffffff',
                  color: isActive ? '#ffffff' : '#374151',
                  boxShadow: isActive ? '0 4px 14px rgba(102,126,234,0.35)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff';
                }}
              >
                <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.name}</span>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', flexShrink: 0 }}>
          <button
            onClick={() => logout()}
            disabled={isPending}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              background: '#ffffff',
              color: '#6b7280',
              fontWeight: 500,
              fontSize: '14px',
              cursor: isPending ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fef2f2';
              (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff';
              (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
            }}
          >
            <LogOut className="w-5 h-5" style={{ flexShrink: 0 }} />
            <span>{isPending ? 'Logging out…' : 'Logout'}</span>
          </button>
        </div>
      </motion.aside>

      {/* ════ MAIN COLUMN ════ */}
      <div style={{
        flex: 1,
        minWidth: 0,           // crucial — prevents flex child from overflowing
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}>

        {/* ── Fixed top header ── */}
        <header style={{
          flexShrink: 0,
          height: '64px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          zIndex: 20,
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#111827' }}>
            {currentPage}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Notification bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(v => !v)}
                style={{
                  width: '38px', height: '38px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                  flexShrink: 0,
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f3f4f6'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'}
              >
                {/* Bell icon — always visible, never covered */}
                <Bell style={{ width: '20px', height: '20px', color: '#4b5563', display: 'block', flexShrink: 0 }} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '2px', right: '2px',
                    minWidth: '15px', height: '15px',
                    backgroundColor: '#ef4444', borderRadius: '9999px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '9px', fontWeight: 700, padding: '0 3px',
                    pointerEvents: 'none',   // badge never intercepts clicks
                    zIndex: 1,
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationPanel
                  notifications={notifications}
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </div>

            {/* User chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '34px', height: '34px', flexShrink: 0,
                background: 'linear-gradient(to right, #667eea, #764ba2)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '13px', fontWeight: 600,
              }}>
                {initials}
              </div>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                {displayName}
              </span>
            </div>
          </div>
        </header>

        {/* ── Scrollable page content ── */}
        <main style={{
          flex: 1,
          minHeight: 0,         // crucial — lets flex child scroll instead of expanding
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '32px',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}