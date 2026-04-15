export const isNativeApp = () => {
  if (typeof window === 'undefined') return false
  
  // STRICT CAPACITOR DETECTION
  // We only return true if we are running inside the native wrapper
  const isCapacitor = (window as any).Capacitor?.isNative || 
                      (window as any).Capacitor?.platform !== undefined ||
                      (window as any)._cap !== undefined
                      
  const isCapacitorProtocol = window.location.protocol === 'capacitor:'
  const isAndroidEmulator = window.location.hostname === '10.0.2.2'
  
  return isCapacitor || isCapacitorProtocol || isAndroidEmulator
}

export const getBaseUrl = () => {
  // If we are in the browser and on a vercel domain
  if (typeof window !== 'undefined') {
    if (isNativeApp()) {
      // FORCE production URL for native apps to ensure they talk to the backend
      return 'https://campus-buddy-phi.vercel.app'
    }
    // Standard web browser - use relative paths
    return '' 
  }
  // Server side
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://campus-buddy-phi.vercel.app'
}

export const getApiUrl = (path: string) => {
  const base = getBaseUrl()
  return `${base}${path}`
}
