import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar, { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from './components/Sidebar'

export default function Layout({ user, onLogout }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)

  return (
    <div
      className="app-layout"
      style={{ '--sidebar-width': sidebarExpanded ? `${SIDEBAR_WIDTH_EXPANDED}px` : `${SIDEBAR_WIDTH_COLLAPSED}px` }}
    >
      <Sidebar
        user={user}
        onLogout={onLogout}
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded((e) => !e)}
      />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
