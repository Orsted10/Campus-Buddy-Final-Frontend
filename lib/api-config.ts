export const isNativeApp = () => {
  if (typeof window === 'undefined') return false
  
  // 1. Check for Capacitor object/bridge
  const isCapacitorObject = (window as any).Capacitor?.isNative || 
                             (window as any)._cap !== undefined

  // 2. Check User Agent (Most reliable for early detection in Android)
  const isCapacitorUA = navigator.userAgent.includes('Capacitor')

  // 3. Check for native-only protocols
  const isCapacitorProtocol = window.location.protocol === 'capacitor:' || 
                               window.location.protocol === 'http:' && window.location.hostname === 'localhost' && !window.location.port
  
  const isAndroidEmulator = window.location.hostname === '10.0.2.2'
  
  return isCapacitorObject || isCapacitorUA || isCapacitorProtocol || isAndroidEmulator
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
