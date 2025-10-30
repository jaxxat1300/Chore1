// My Habit & Chore Tracker - JavaScript
// Privacy-first, fully client-side. Uses localStorage only.

// ----- Configuration -----
// Paste your Google Apps Script Web App URL here (after you deploy as web app)
// Example: const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/XXXXX/exec';
const GOOGLE_SHEETS_WEB_APP_URL = '';

// ----- State -----
// Base chores/habits (do not store per-day completion here)
// Schema: { id, title, notes, startDate (YYYY-MM-DD), recurrence: '', 'daily', 'weekly', 'monthly', createdAt }
let chores = [];

// Completion state per occurrence: key = `${choreId}|${YYYY-MM-DD}` → true/false
let completionMap = {};

// Calendar navigation state
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// ----- DOM -----
const choreForm = document.getElementById('chore-form');
const choreList = document.getElementById('chore-list');
const calendarGrid = document.getElementById('calendar-grid');
const currentMonthDisplay = document.getElementById('current-month');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const exportSheetsBtn = document.getElementById('export-sheets-btn');
const clearCompletedBtn = document.getElementById('clear-completed-btn');

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default in the date input
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('chore-date').value = today;
    
    // Load from localStorage (with migration for older format)
    loadFromStorage();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Render initial views
    renderCalendar();
    renderChoreList();
    
    // Show success message if this is first visit
    if (chores.length === 0) {
        showMessage('Welcome! Add your first habit/chore to get started.', 'success');
    }
});

// Initialize all event listeners
function initializeEventListeners() {
    // Form submission
    choreForm.addEventListener('submit', handleFormSubmit);
    
    // Tab navigation
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', switchTab);
    });
    
    // Calendar navigation
    prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
    nextMonthBtn.addEventListener('click', () => navigateMonth(1));
    
    // List view controls
    exportSheetsBtn.addEventListener('click', exportToGoogleSheets);
    clearCompletedBtn.addEventListener('click', clearCompletedChores);
}

// Handle form submission for adding new chores
function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(choreForm);
    const chore = {
        id: Date.now().toString(), // Simple ID generation
        title: formData.get('title').trim(),
        notes: formData.get('notes').trim(),
        startDate: formData.get('date'),
        recurrence: formData.get('recurrence') || '',
        createdAt: new Date().toISOString()
    };
    
    // Validate required fields
    if (!chore.title) {
        showMessage('Please enter a chore title.', 'error');
        return;
    }
    
    if (!chore.startDate) {
        showMessage('Please select a date.', 'error');
        return;
    }
    
    // Add chore to the array
    chores.push(chore);
    
    // Save to localStorage
    saveToStorage();
    
    // Clear form
    choreForm.reset();
    document.getElementById('chore-date').value = new Date().toISOString().split('T')[0];
    
    // Update views
    renderCalendar();
    renderChoreList();
    
    // Show success message
    showMessage('Added successfully!', 'success');
    
    // Switch to calendar view to show the new chore
    switchTab({ target: document.querySelector('[data-tab="calendar"]') });
}

// Toggle completion for a specific occurrence date (YYYY-MM-DD)
function toggleOccurrence(choreId, dateISO, isCompleted) {
    const key = `${choreId}|${dateISO}`;
    if (isCompleted) {
        completionMap[key] = true;
    } else {
        delete completionMap[key];
    }
    saveToStorage();
    renderCalendar();
    renderChoreList();
}

// Delete a chore
function deleteChore(choreId) {
    if (confirm('Are you sure you want to delete this chore?')) {
        chores = chores.filter(c => c.id !== choreId);
        // Remove any completion entries for this chore
        Object.keys(completionMap).forEach(k => { if (k.startsWith(`${choreId}|`)) delete completionMap[k]; });
        saveToStorage();
        renderCalendar();
        renderChoreList();
        showMessage('Chore deleted successfully!', 'success');
    }
}

// Switch between tabs
function switchTab(event) {
    const targetTab = event.target.getAttribute('data-tab');
    
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    event.target.classList.add('active');
    document.getElementById(targetTab).classList.add('active');
    
    // Refresh calendar if switching to calendar view
    if (targetTab === 'calendar') {
        renderCalendar();
    }
}

// Calendar navigation
function navigateMonth(direction) {
    currentMonth += direction;
    
    // Handle year changes
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    
    renderCalendar();
}

// Render the calendar view
function renderCalendar() {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Update month display
    currentMonthDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Clear calendar grid
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Check if this is today
        const today = new Date();
        if (currentYear === today.getFullYear() && 
            currentMonth === today.getMonth() && 
            day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        // Add chores that occur on this date
        const dayDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayChores = chores.filter(chore => occursOnDate(chore, dayDate));
        
        dayChores.forEach(chore => {
            const key = `${chore.id}|${dayDate}`;
            const isDone = Boolean(completionMap[key]);
            const wrapper = document.createElement('label');
            wrapper.className = `chore-item ${isDone ? 'completed' : ''}`;
            wrapper.title = chore.notes || chore.title;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = isDone;
            checkbox.style.marginRight = '6px';
            checkbox.addEventListener('change', (e) => {
                toggleOccurrence(chore.id, dayDate, e.target.checked);
            });

            const span = document.createElement('span');
            span.textContent = chore.title;

            wrapper.appendChild(checkbox);
            wrapper.appendChild(span);
            dayElement.appendChild(wrapper);
        });
        
        calendarGrid.appendChild(dayElement);
    }
}

// Render the chore list view
function renderChoreList() {
    if (chores.length === 0) {
        choreList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No items yet. Add your first habit/chore!</p>';
        return;
    }

    // Generate occurrences for the next 60 days for a minimal, practical list
    const today = new Date();
    const horizonDays = 60;
    const occurrences = [];

    for (let offset = 0; offset < horizonDays; offset++) {
        const d = new Date(today);
        d.setDate(d.getDate() + offset);
        const dateISO = toISODate(d);
        chores.forEach(chore => {
            if (occursOnDate(chore, dateISO)) {
                occurrences.push({ chore, dateISO });
            }
        });
    }

    // Sort by date ascending, then by title
    occurrences.sort((a, b) => (a.dateISO.localeCompare(b.dateISO) || a.chore.title.localeCompare(b.chore.title)));

    choreList.innerHTML = occurrences.map(({ chore, dateISO }) => {
        const key = `${chore.id}|${dateISO}`;
        const isDone = Boolean(completionMap[key]);
        return `
        <div class="chore-card ${isDone ? 'completed' : ''}">
            <div class="chore-header">
                <div>
                    <div class="chore-title ${isDone ? 'completed' : ''}">${escapeHtml(chore.title)}</div>
                    <div class="chore-date">${formatDate(dateISO)}</div>
                    ${chore.recurrence ? `<span class="chore-recurrence">${chore.recurrence}</span>` : ''}
                </div>
                <div>
                    <label style="display:flex;align-items:center;gap:8px;">
                        <input type="checkbox" ${isDone ? 'checked' : ''} onchange="toggleOccurrence('${chore.id}','${dateISO}', this.checked)">
                        <span>${isDone ? 'Done' : 'Mark done'}</span>
                    </label>
                </div>
            </div>
            ${chore.notes ? `<div class="chore-notes">${escapeHtml(chore.notes)}</div>` : ''}
            <div class="chore-actions">
                <button class="btn btn-danger" onclick="deleteChore('${chore.id}')">Delete</button>
            </div>
        </div>`;
    }).join('');
}

// Export to Google Sheets via Apps Script Web App
async function exportToGoogleSheets() {
    if (!GOOGLE_SHEETS_WEB_APP_URL) {
        alert('Please paste your Google Apps Script Web App URL in app.js (GOOGLE_SHEETS_WEB_APP_URL).');
        return;
    }

    try {
        const payload = {
            chores,
            completionMap,
            exportedAt: new Date().toISOString(),
        };

        const res = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            showMessage('Exported to Google Sheets!', 'success');
        } else {
            showMessage('Export request sent. If sheet not updated, check Apps Script CORS/permissions.', 'error');
        }
    } catch (e) {
        console.error(e);
        showMessage('Failed to export. Check your internet and Apps Script URL.', 'error');
    }
}

// Clear all completed chores
function clearCompletedChores() {
    const completedKeys = Object.keys(completionMap);
    const completedCount = completedKeys.length;
    
    if (completedCount === 0) {
        showMessage('No completed chores to clear.', 'error');
        return;
    }
    
    if (confirm(`Clear ${completedCount} completed occurrence(s)? This does not delete chores.`)) {
        completionMap = {};
        saveToStorage();
        renderCalendar();
        renderChoreList();
        showMessage('Cleared completion states.', 'success');
    }
}

// Save to localStorage (chores + completionMap)
function saveToStorage() {
    try {
        localStorage.setItem('mhct_chores', JSON.stringify(chores));
        localStorage.setItem('mhct_completion', JSON.stringify(completionMap));
    } catch (error) {
        console.error('Error saving to storage:', error);
        showMessage('Error saving data. Please try again.', 'error');
    }
}

// Load from localStorage with migration support
function loadFromStorage() {
    try {
        const storedChores = localStorage.getItem('mhct_chores');
        const storedCompletion = localStorage.getItem('mhct_completion');

        if (storedChores) {
            chores = JSON.parse(storedChores);
        } else {
            // Migration path from older key 'choreTracker'
            const legacy = localStorage.getItem('choreTracker');
            if (legacy) {
                const legacyChores = JSON.parse(legacy);
                chores = legacyChores.map(c => ({
                    id: c.id,
                    title: c.title,
                    notes: c.notes || '',
                    startDate: c.date || c.startDate,
                    recurrence: c.recurrence || '',
                    createdAt: c.createdAt || new Date().toISOString(),
                }));
            } else {
                chores = [];
            }
        }

        completionMap = storedCompletion ? JSON.parse(storedCompletion) : {};
    } catch (error) {
        console.error('Error loading from storage:', error);
        showMessage('Error loading data. Starting fresh.', 'error');
        chores = [];
        completionMap = {};
    }
}

// Utility function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Convert Date → YYYY-MM-DD
function toISODate(dateObj) {
    return [dateObj.getFullYear(), String(dateObj.getMonth() + 1).padStart(2, '0'), String(dateObj.getDate()).padStart(2, '0')].join('-');
}

// Check if a chore occurs on a given ISO date considering recurrence
function occursOnDate(chore, dateISO) {
    const start = new Date(chore.startDate);
    const target = new Date(dateISO);

    // If target is before start, it does not occur
    if (target < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false;

    // No recurrence: only on startDate
    if (!chore.recurrence) {
        return chore.startDate === dateISO;
    }

    switch (chore.recurrence) {
        case 'daily':
            return true; // every day after start
        case 'weekly': {
            // Same weekday and at least 0 weeks apart
            return start.getDay() === target.getDay();
        }
        case 'monthly': {
            // Same day-of-month; if day doesn't exist in target month, skip
            return start.getDate() === target.getDate();
        }
        default:
            return chore.startDate === dateISO;
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show success/error messages
function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at the top of the container
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 3000);
}

// Handle keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + Enter to submit form
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (choreForm.checkValidity()) {
            handleFormSubmit(event);
        }
    }
});
// Optional: add one friendly sample item only on a pristine install
if (chores.length === 0) {
    const todayISO = new Date().toISOString().split('T')[0];
    chores.push({
        id: 'sample-1',
        title: 'Sample: Check this off to try it',
        notes: 'Edit or delete me anytime.',
        startDate: todayISO,
        recurrence: '',
        createdAt: new Date().toISOString(),
    });
    saveToStorage();
}
