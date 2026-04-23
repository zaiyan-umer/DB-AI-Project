/**
 * src/components/DashboardLayout.tsx
 => Changes
 - Settings gear icon sits just above the Logout button in the sidebar.
 - Clicking the user avatar/name chip in the header opens a small dropdown with "Settings" and "Logout" options.
 - SettingsModal is rendered (and opened) from here.
 */

import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { LayoutDashboard, MessageSquare, FileText, Calendar, TrendingUp, ChevronRight, Bell, Sparkles, LogOut, Settings, ChevronDown,} from 'lucide-react'
import { useLogout } from '../hooks/useAuth'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useNotifications } from '../hooks/useScheduler'
import { useState, useRef, useEffect } from 'react'
import { NotificationPanel } from './NotificationPanel'
import { SettingsModal } from './SettingsModal'
import { useTheme } from '../contexts/ThemeContext'
import Chatbot from './Chatbot'
import useCopilot from '@/hooks/useCopilot'

interface NavItem {
    name: string
    path: string
    icon: React.ReactNode
}

const navItems: NavItem[] = [
    { name: 'Dashboard',    path: '/dashboard',            icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Group Chat',   path: '/dashboard/group-chat', icon: <MessageSquare className="w-5 h-5" /> },
    { name: 'Notes & Test', path: '/dashboard/notes',      icon: <FileText className="w-5 h-5" /> },
    { name: 'Scheduler',    path: '/dashboard/scheduler',  icon: <Calendar className="w-5 h-5" /> },
    { name: 'Progress',     path: '/dashboard/progress',   icon: <TrendingUp className="w-5 h-5" /> },
]

export function DashboardLayout() {
    const navigate  = useNavigate()
    const location  = useLocation()
    const { mutate: logout, isPending } = useLogout()
    const { data: currentUser }         = useCurrentUser()
    const { data: notifications = [] }  = useNotifications()
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark'

    // Dark mode tokens
    const surface  = isDark ? '#1a1d27' : '#ffffff'
    const border   = isDark ? '#2e3347' : '#e5e7eb'
    const pageBg   = isDark ? '#0f1117' : '#f9fafb'
    const textPri  = isDark ? '#f9fafb' : '#111827'
    const textMut  = isDark ? '#9ca3af' : '#6b7280'
    const hoverBg  = isDark ? '#252836' : '#f3f4f6'
    const hoverRed = isDark ? '#2d1515' : '#fef2f2'

    const [showNotifications, setShowNotifications] = useState(false)
    const [showSettings, setShowSettings]           = useState(false)
    const [showUserMenu, setShowUserMenu]            = useState(false)
    
    const {messages, isStreaming, sendMessage, isLoadingHistory,} = useCopilot()

    const userMenuRef = useRef<HTMLDivElement>(null)

    // Close user-menu when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const unreadCount = notifications.filter((n: { isRead?: boolean }) => !n.isRead).length

    const initials = currentUser?.user ? `${currentUser.user.firstName?.[0] ?? ''}${currentUser.user.lastName?.[0] ?? ''}`.toUpperCase() || 'U' : 'U'

    const displayName = currentUser?.user ? `${currentUser.user.firstName ?? ''} ${currentUser.user.lastName ?? ''}`.trim() || currentUser.user.username || 'User' : 'User'

    const currentPage = navItems.find((item) => item.path === location.pathname)?.name ?? 'Dashboard'

    return (
        <div style={{
            display: 'flex',
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            backgroundColor: pageBg,
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
                    backgroundColor: surface,
                    borderRight: `1px solid ${border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
            >
                {/* Logo */}
                <div style={{ padding: '24px', borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
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
                <nav style={{
                    flex: 1,
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    overflowY: 'auto',
                }}>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path
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
                                    background: isActive
                                        ? 'linear-gradient(to right, #667eea, #764ba2)'
                                        : surface,
                                    color: isActive ? '#ffffff' : textPri,
                                    boxShadow: isActive
                                        ? '0 4px 14px rgba(102,126,234,0.35)'
                                        : 'none',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive)
                                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = hoverBg
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive)
                                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = surface
                                }}
                            >
                                <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                                <span style={{ flex: 1 }}>{item.name}</span>
                                {isActive && <ChevronRight className="w-4 h-4" />}
                            </button>
                        )
                    })}
                </nav>

                {/* Bottom actions: Settings + Logout */}
                <div style={{ padding: '16px', borderTop: `1px solid ${border}`, flexShrink: 0 }}>

                    {/* Settings button */}
                    <button
                        onClick={() => setShowSettings(true)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: 'none',
                            background: surface,
                            color: textMut,
                            fontWeight: 500,
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            marginBottom: '4px',
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = hoverBg
                            ;(e.currentTarget as HTMLButtonElement).style.color = textPri
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = surface
                            ;(e.currentTarget as HTMLButtonElement).style.color = textMut
                        }}
                    >
                        <Settings className="w-5 h-5" style={{ flexShrink: 0 }} />
                        <span>Settings</span>
                    </button>

                    {/* Logout button */}
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
                            background: surface,
                            color: textMut,
                            fontWeight: 500,
                            fontSize: '14px',
                            cursor: isPending ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = hoverRed
                            ;(e.currentTarget as HTMLButtonElement).style.color = '#ef4444'
                        }}
                        onMouseLeave={(e) => {
                            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = surface
                            ;(e.currentTarget as HTMLButtonElement).style.color = textMut
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
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                overflow: 'hidden',
            }}>

                {/* ── Fixed top header ── */}
                <header style={{
                    flexShrink: 0,
                    height: '64px',
                    backgroundColor: surface,
                    borderBottom: `1px solid ${border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 32px',
                    zIndex: 20,
                }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: textPri }}>
                        {currentPage}
                    </h2>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

                        {/* Notification bell */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowNotifications((v) => !v)}
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
                                onMouseEnter={(e) =>
                                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = hoverBg
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                                }
                            >
                                <Bell style={{ width: '20px', height: '20px', color: textMut, display: 'block', flexShrink: 0 }} />
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '2px', right: '2px',
                                        minWidth: '15px', height: '15px',
                                        backgroundColor: '#ef4444', borderRadius: '9999px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontSize: '9px', fontWeight: 700, padding: '0 3px',
                                        pointerEvents: 'none',
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

                        {/* User chip — click opens dropdown */}
                        <div ref={userMenuRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowUserMenu((v) => !v)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '4px 8px 4px 4px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = hoverBg
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                                }
                            >
                                <div style={{
                                    width: '34px', height: '34px', flexShrink: 0,
                                    background: 'linear-gradient(to right, #667eea, #764ba2)',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: '13px', fontWeight: 600,
                                }}>
                                    {initials}
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 500, color: textPri }}>
                                    {displayName}
                                </span>
                                <ChevronDown
                                    style={{
                                        width: '14px', height: '14px', color: textMut,
                                        transform: showUserMenu ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.2s',
                                    }}
                                />
                            </button>

                            {/* Dropdown */}
                            <AnimatePresence>
                                {showUserMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                        transition={{ duration: 0.12 }}
                                        style={{
                                            position: 'absolute',
                                            right: 0,
                                            top: 'calc(100% + 8px)',
                                            width: '180px',
                                            backgroundColor: surface,
                                            border: `1px solid ${border}`,
                                            borderRadius: '12px',
                                            boxShadow: isDark
                                                ? '0 10px 30px rgba(0,0,0,0.5)'
                                                : '0 10px 30px rgba(0,0,0,0.12)',
                                            padding: '6px',
                                            zIndex: 50,
                                        }}
                                    >
                                        <DropdownItem
                                            icon={<Settings className="w-4 h-4" />}
                                            label="Settings"
                                            isDark={isDark}
                                            onClick={() => {
                                                setShowUserMenu(false)
                                                setShowSettings(true)
                                            }}
                                        />
                                        <DropdownItem
                                            icon={<LogOut className="w-4 h-4" />}
                                            label={isPending ? 'Logging out…' : 'Logout'}
                                            danger
                                            isDark={isDark}
                                            onClick={() => {
                                                setShowUserMenu(false)
                                                logout()
                                            }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* ── Scrollable page content ── */}
                <main style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    backgroundColor: pageBg,
                }}>
                    <Outlet />
                </main>
            </div>

            {/* Settings modal */}
            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

            <Chatbot
                messages={messages}
                isStreaming={isStreaming}
                onSendMessage={sendMessage}
            />
        </div>
    )
}

// ── tiny helper ───────────────────────────────────────────────────────────────

function DropdownItem({
    icon,
    label,
    danger = false,
    isDark = false,
    onClick,
}: {
    icon: React.ReactNode
    label: string
    danger?: boolean
    isDark?: boolean
    onClick: () => void
}) {
    const normalText = isDark ? '#e5e7eb' : '#374151'
    const normalHover = isDark ? '#252836' : '#f3f4f6'
    const dangerHover = isDark ? '#2d1515' : '#fef2f2'

    return (
        <button
            onClick={onClick}
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: danger ? '#ef4444' : normalText,
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.12s',
                textAlign: 'left',
            }}
            onMouseEnter={(e) =>
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = danger
                    ? dangerHover
                    : normalHover
            }
            onMouseLeave={(e) =>
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
            }
        >
            {icon}
            {label}
        </button>
    )
}