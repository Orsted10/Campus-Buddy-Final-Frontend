'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { usePortalStore } from '@/store/usePortalStore'
import Sidebar from '@/components/shared/Sidebar'
import Topbar from '@/components/shared/Topbar'
import BottomNav from '@/components/shared/BottomNav'
import { AnimatePresence, motion } from 'framer-motion'
import { PageTransition } from '@/components/shared/PageTransition'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const hasHydrated = useAuthStore((state) => state._hasHydrated)
  const isLoading = useAuthStore((state: any) => state.isLoading)
  const portalStatus = usePortalStore((state) => state.portalStatus)
  const syncAll = usePortalStore((state) => state.syncAll)
  const lastSync = usePortalStore((state) => state.lastSync)

  useEffect(() => {
    // Only redirect AFTER zustand has hydrated AND auth has finished loading
    if (hasHydrated && !isLoading && !user) {
      window.location.href = '/login'
    }
  }, [user, hasHydrated, isLoading])

  // Global Auto-Sync
  useEffect(() => {
    if (hasHydrated && !isLoading && portalStatus === 'connected') {
      const now = Date.now()
      const last = lastSync ? new Date(lastSync).getTime() : 0
      if (now - last > 60000) { // 1 minute threshold
        console.log('[DashboardLayout] Auto-sync triggered on mount')
        syncAll().catch(() => {})
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, isLoading, portalStatus])

  // Show a loading screen while zustand is reading from localStorage or auth is loading
  if (!hasHydrated || isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">
            {!hasHydrated ? 'Loading your session...' : isLoading ? 'Authenticating...' : 'Redirecting to login...'}
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-transparent overflow-hidden flex-col md:flex-row">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 w-full">
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 pb-20 md:pb-6">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={pathname}>
              {children}
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
