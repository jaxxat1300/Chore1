// Google Apps Script for My Habit & Chore Tracker - SIMPLE VERSION
// Only tracks: Chore Name | Date Created | Completed Date | Week

function doGet(e) {
  try {
    // Download: return all shared data
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const choresSheet = getOrCreateSheet(ss, 'Chores', ['id','title','notes','startDate','recurrence','createdAt']);
    const compsSheet = getOrCreateSheet(ss, 'Completions', ['choreId','occurrenceDate']);
    
    // Read all chores
    const choresData = choresSheet.getDataRange().getValues();
    const chores = [];
    for (let i = 1; i < choresData.length; i++) {
      const row = choresData[i];
      if (row[0]) {
        chores.push({
          id: row[0],
          title: row[1] || '',
          notes: row[2] || '',
          startDate: row[3] || '',
          recurrence: row[4] || '',
          createdAt: row[5] || '',
        });
      }
    }
    
    // Read all completions
    const compsData = compsSheet.getDataRange().getValues();
    const completionMap = {};
    for (let i = 1; i < compsData.length; i++) {
      const row = compsData[i];
      if (row[0] && row[1]) {
        const key = `${row[0]}|${row[1]}`;
        completionMap[key] = true;
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      chores,
      completionMap,
      syncedAt: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      error: err.message || String(err)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'No payload' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const payload = JSON.parse(e.postData.contents || '{}');
    const action = payload.action || 'upload';
    
    if (action !== 'upload') {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Unknown action' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const chores = Array.isArray(payload.chores) ? payload.chores : [];
    const completionMap = (payload.completionMap && typeof payload.completionMap === 'object') ? payload.completionMap : {};
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const choresSheet = getOrCreateSheet(ss, 'Chores', ['id','title','notes','startDate','recurrence','createdAt']);
    const compsSheet = getOrCreateSheet(ss, 'Completions', ['choreId','occurrenceDate']);
    
    // Overwrite all chores
    if (chores.length > 0) {
      choresSheet.getRange(2, 1, choresSheet.getLastRow() - 1, 6).clear();
      
      const rows = chores.map(c => [
        c.id || '',
        c.title || '',
        c.notes || '',
        c.startDate || '',
        c.recurrence || '',
        c.createdAt || ''
      ]);
      if (rows.length > 0) {
        choresSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      }
    }
    
    // Append new completions to Activity Log (avoid duplicates)
    const logSheet = getOrCreateSheet(ss, 'Activity Log', ['Chore','Date Completed','Week','Time Completed']);
    const now = new Date();
    
    // Get existing log entries to check for duplicates
    const logData = logSheet.getDataRange().getValues();
    const existingLogKeys = new Set();
    for (let i = 1; i < logData.length; i++) {
      const row = logData[i];
      if (row[0] && row[1]) {
        existingLogKeys.add(`${row[0]}|${row[1]}`); // chore|date
      }
    }
    
    // Only log new completions
    for (const key in completionMap) {
      if (completionMap.hasOwnProperty(key)) {
        const parts = key.split('|');
        const choreId = parts[0];
        const dateCompleted = parts[1];
        
        // Find chore title
        const chore = chores.find(c => c.id === choreId);
        const choreTitle = (chore && chore.title) || choreId;
        
        // Check if already logged
        if (!existingLogKeys.has(`${choreTitle}|${dateCompleted}`)) {
          const weekStart = getMonday(new Date(dateCompleted));
          const weekStr = weekStart.toISOString().split('T')[0];
          logSheet.appendRow([choreTitle, dateCompleted, weekStr, now.toLocaleTimeString()]);
        }
      }
    }
    
    // Overwrite completions tracking sheet
    if (Object.keys(completionMap).length > 0) {
      compsSheet.getRange(2, 1, compsSheet.getLastRow() - 1, 2).clear();
      
      const rows = Object.keys(completionMap).map(key => {
        const parts = key.split('|');
        return [parts[0] || '', parts[1] || ''];
      });
      if (rows.length > 0) {
        compsSheet.getRange(2, 1, rows.length, 2).setValues(rows);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      choresWritten: chores.length,
      completionsWritten: Object.keys(completionMap).length
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: (err && err.message) || String(err)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  } else {
    const range = sheet.getRange(1, 1, 1, headers.length);
    const row = range.getValues()[0] || [];
    const hasHeaders = row.some(v => v && ('' + v).trim() !== '');
    if (!hasHeaders) {
      range.setValues([headers]);
    }
  }
  return sheet;
}
