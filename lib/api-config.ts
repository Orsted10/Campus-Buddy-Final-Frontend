export const getBaseUrl = () => {
  // If we are in the browser and on a vercel domain
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' && !window.location.port) {
      // This is likely Capacitor's local server (no port or special domain)
      return 'https://campus-buddy-phi.vercel.app'
    }
    // Standard web browser
    return '' 
  }
  // Server side
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://campus-buddy-phi.vercel.app'
}

export const isNativeApp = () => {
  if (typeof window === 'undefined') return false
  // Capacitor runs on localhost without a port by default, 
  // or it will have a 'capacitor://' origin
  return (
    window.location.hostname === 'localhost' && !window.location.port ||
    window.location.protocol === 'capacitor:' ||
    (window as any).Capacitor !== undefined
  )
}

export const getApiUrl = (path: string) => {
  const base = getBaseUrl()
  return `${base}${path}`
}
