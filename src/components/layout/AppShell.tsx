'use client'
import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { PipelinePage } from '@/components/deals/PipelinePage'
import { ContactsPage } from '@/components/contacts/ContactsPage'
import { SettingsPage } from '@/components/settings/SettingsPage'
import { useStore } from '@/lib/store'

export type NavPage = 'pipeline' | 'contacts' | 'settings'

export function AppShell() {
  const [page, setPage] = useState<NavPage>('pipeline')
  const theme = useStore(s => s.settings.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar activePage={page} onNavigate={setPage} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {page === 'pipeline'  && <PipelinePage />}
        {page === 'contacts'  && <ContactsPage />}
        {page === 'settings'  && <SettingsPage />}
      </main>
    </div>
  )
}
