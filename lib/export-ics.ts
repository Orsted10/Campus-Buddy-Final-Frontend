export function generateTimetableICS(timetable: Record<string, any[]>) {
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Campus Buddy//Timetable Sync//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ]

  const now = new Date()
  
  // A helper to get the next date for a specific day of the week
  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const getNextDateOfWeek = (dayOfWeek: number) => {
    const resultDate = new Date(now.getTime())
    resultDate.setDate(now.getDate() + (7 + dayOfWeek - now.getDay()) % 7)
    return resultDate
  }

  const dayMap: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  }

  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  Object.keys(timetable).forEach((dayName) => {
    const dayIndex = dayMap[dayName]
    if (dayIndex === undefined) return
    
    const slots = timetable[dayName]
    if (!slots || !Array.isArray(slots)) return

    slots.forEach((slot, index) => {
      if (!slot.time || !slot.subject) return

      try {
        const [startTimeStr, endTimeStr] = slot.time.split(' - ')
        const nextDate = getNextDateOfWeek(dayIndex)
        
        // Parse "10:30 AM" or "02:00 PM"
        const parseTime = (timeStr: string, baseDate: Date) => {
          const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i)
          if (!match) return new Date(baseDate)
          let [_, h, m, ampm] = match
          let hours = parseInt(h)
          const mins = parseInt(m)
          if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12
          if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0
          
          const d = new Date(baseDate)
          d.setHours(hours, mins, 0, 0)
          return d
        }

        const startDateTime = parseTime(startTimeStr, nextDate)
        const endDateTime = parseTime(endTimeStr, nextDate)

        ics.push(
          'BEGIN:VEVENT',
          `UID:${dayName}-${index}-${now.getTime()}@campusbuddy`,
          `DTSTAMP:${formatICSDate(now)}`,
          `DTSTART:${formatICSDate(startDateTime)}`,
          `DTEND:${formatICSDate(endDateTime)}`,
          `SUMMARY:${slot.subject}`,
          `DESCRIPTION:Class for ${slot.subject}`,
          `RRULE:FREQ=WEEKLY;BYDAY=${dayName.substring(0, 2).toUpperCase()}`,
          'END:VEVENT'
        )
      } catch (e) {
        console.error('Failed to parse slot for ICS', e)
      }
    })
  })

  ics.push('END:VCALENDAR')
  return ics.join('\r\n')
}

export function downloadICS(timetable: Record<string, any[]>) {
  const icsString = generateTimetableICS(timetable)
  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = 'CampusBuddy_Timetable.ics'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
