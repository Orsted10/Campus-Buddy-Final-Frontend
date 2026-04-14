'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { fetchRemoteConfig, getLocalConfig, AppConfig } from '@/lib/remote-config'

const ConfigContext = createContext<AppConfig | null>(null)

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(getLocalConfig())

  useEffect(() => {
    const load = async () => {
      const remote = await fetchRemoteConfig()
      setConfig(remote)
      // Cache for offline/boot speed
      localStorage.setItem('campus_buddy_remote_config', JSON.stringify(remote))
    }
    load()
  }, [])

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  )
}

export const useConfig = () => {
  const context = useContext(ConfigContext)
  if (!context) throw new Error('useConfig must be used within ConfigProvider')
  return context
}
