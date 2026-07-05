'use client'

import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

interface NavItem {
  label: string
  href: string
  icon: string
}

interface SidebarProps {
  navItems: NavItem[]
  sectionLabel: string
}

export default function Sidebar({ navItems, sectionLabel }: SidebarProps) {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoMark}>
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#6366f1" />
            <path
              d="M7 14h4l3-7 3 14 3-7h4"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span style={styles.logoText}>EduApp</span>
      </div>

      <p style={styles.sectionLabel}>{sectionLabel}</p>

      <nav style={styles.nav}>
  {navItems.map((item) => (
    <a
      key={item.href}
      href={item.href}
      style={styles.navItem}
      onMouseEnter={(e) =>
        Object.assign((e.currentTarget as HTMLElement).style, styles.navItemHover)
      }
      onMouseLeave={(e) =>
        Object.assign((e.currentTarget as HTMLElement).style, styles.navItem)
      }
    >
      <span style={styles.navIcon}>{item.icon}</span>
      <span>{item.label}</span>
    </a>
  ))}
</nav>

      <div style={styles.bottom}>
        <div style={styles.divider} />
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: { width: '240px', minHeight: '100vh', backgroundColor: '#1e1b4b', display: 'flex', flexDirection: 'column', padding: '24px 16px', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, overflowY: 'auto' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', padding: '0 8px' },
  logoMark: { display: 'flex', alignItems: 'center' },
  logoText: { fontSize: '18px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.3px' },
  sectionLabel: { fontSize: '11px', fontWeight: '600', color: '#6366f1', letterSpacing: '0.1em', padding: '0 8px', marginBottom: '8px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', color: '#c7d2fe', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'all 0.15s' },
  navItemHover: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', color: '#ffffff', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'all 0.15s', backgroundColor: '#312e81' },
  navIcon: { fontSize: '16px', width: '20px', textAlign: 'center' },
  bottom: { marginTop: 'auto' },
  divider: { height: '1px', backgroundColor: '#312e81', marginBottom: '16px' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', color: '#fca5a5', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', width: '100%' },
}