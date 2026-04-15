export const isNativeApp = () => {
  if (typeof window === 'undefined') return false
  
  const hostname = window.location.hostname
  const protocol = window.location.protocol
  const isCap = (window as any).Capacitor !== undefined || (window as any)._cap !== undefined
  
  return (
    isCap ||
    protocol === 'capacitor:' ||
    protocol === 'http:' && hostname === 'localhost' && !window.location.port ||
    hostname === 'localhost' && !window.location.port ||
    hostname.includes('10.0.2.2') // Android Emulator
  )
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
