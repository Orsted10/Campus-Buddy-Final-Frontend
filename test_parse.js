const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('e:/CampusBuddyFinal/Detailed class.txt', 'utf8');

function parseAttendanceHistory(html) {
  const $ = cheerio.load(html)
  const history = []
  
  // Target the #fullreport table specifically (from portal inspect element)
  let targetTable = $('table#fullreport')
  if (targetTable.length === 0) {
    targetTable = $('table').first()
  }

  if (targetTable.length === 0) {
    console.log('[parseAttendanceHistory] No table found in HTML.')
    return []
  }

  console.log('[parseAttendanceHistory] Found table.')

  // Try to find the exact structure we see in the View Modal
  const rows = targetTable.find('tbody tr')
  console.log('[parseAttendanceHistory] Found ' + rows.length + ' rows in tbody.')
  
  if (rows.length === 0) {
    // maybe no tbody?
    console.log('[parseAttendanceHistory] No rows found in tbody.')
  }

  let successCount = 0
  rows.each((_, row) => {
    const cells = $(row).find('td')
    
    // Strategy 1: Use data-label attributes (mobile responsive)
    const hasDataLabels = cells.filter((__, c) => !!$(c).attr('data-label')).length > 0
    
    if (hasDataLabels) {
      const getLabel = (needle) => {
        let val = ''
        cells.each((__, c) => {
          const label = ($(c).attr('data-label') || '').toLowerCase()
          if (label.includes(needle.toLowerCase())) {
            val = $(c).text().trim()
            return false // break each
          }
        })
        return val
      }
      
      const date = getLabel('date')
      const status = getLabel('attendance') || getLabel('status')
      
      if (date && status) {
        history.push({
          date,
          type: getLabel('type') || 'Class',
          time: getLabel('time') || '--:--',
          status,
          section: getLabel('section') || '',
          group: getLabel('group') || '',
          markedBy: getLabel('marked by') || getLabel('marked') || 'System'
        })
        successCount++
      }
      return // next row
    }
  });

  console.log('Successfully parsed: ' + successCount)
  return history
}

console.log(parseAttendanceHistory(html).slice(0, 2))
