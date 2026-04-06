/**
 * Utility to handle India Standard Time (IST) logic
 */

export function getISTDate(): Date {
  const now = new Date()
  // Offset for IST is UTC + 5.5 hours
  const istOffset = 5.5 * 60 * 60 * 1000
  return new Date(now.getTime() + istOffset)
}

export function getCurrentDayIST(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const istDate = getISTDate()
  return days[istDate.getUTCDay()]
}

export function isBetweenTimings(currentIST: Date, startStr: string, endStr: string): boolean {
  try {
    const [startH, startM] = parseTimeString(startStr)
    const [endH, endM] = parseTimeString(endStr)
    
    const currentH = currentIST.getUTCHours()
    const currentM = currentIST.getUTCMinutes()
    
    const currentTimeMinutes = currentH * 60 + currentM
    const startTimeMinutes = startH * 60 + startM
    const endTimeMinutes = endH * 60 + endM
    
    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes
  } catch (e) {
    return false
  }
}

function parseTimeString(timeStr: string): [number, number] {
  // Format: "07:30 AM" or "12:00 PM"
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) throw new Error('Invalid time format')
  
  let hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const ampm = match[3].toUpperCase()
  
  if (ampm === 'PM' && hours < 12) hours += 12
  if (ampm === 'AM' && hours === 12) hours = 0
  
  return [hours, minutes]
}
