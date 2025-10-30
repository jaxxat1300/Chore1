# Personal Chore Tracker

A simple, client-side web application for tracking personal chores and tasks. Built with HTML, CSS, and JavaScript with no backend required.

## Features

### ✅ Core Functionality
- **Add Chores**: Create new chores with title, optional notes, date, and recurrence options
- **Track Completion**: Mark chores as done/undone with visual indicators
- **Calendar View**: See all chores organized by date on a monthly calendar
- **List View**: View all chores in a detailed list format
- **Data Persistence**: All data is stored locally using localStorage

### 📅 Calendar Features
- Monthly calendar view with navigation
- Visual distinction for completed chores (green with strikethrough)
- Click on chores in calendar to toggle completion status
- Today's date is highlighted
- Responsive design for mobile and desktop

### 📋 List Features
- Sortable list of all chores (newest first)
- Detailed chore cards with all information
- Quick action buttons for completion and deletion
- Clear completed chores functionality

### 💾 Export/Import
- Export all chores as JSON format
- Copy to clipboard functionality
- No server required - fully client-side

### 📱 Responsive Design
- Mobile-first approach
- Touch-friendly interface
- Responsive calendar and form layouts
- Works on all screen sizes

## How to Use

1. **Open the Application**: Simply open `index.html` in any modern web browser
2. **Add Your First Chore**: 
   - Fill in the title (required)
   - Add optional notes
   - Select a date
   - Choose recurrence if needed
   - Click "Add Chore"
3. **View Your Chores**:
   - **Calendar View**: See chores organized by date
   - **List View**: See all chores in a detailed list
4. **Manage Chores**:
   - Click on chores to mark them complete/incomplete
   - Use action buttons to delete chores
   - Clear all completed chores at once
5. **Export Data**: Use the export button to save your chores as JSON

## File Structure

```
Chore 1/
├── index.html          # Main HTML structure
├── style.css           # Styling and responsive design
├── app.js             # JavaScript functionality
└── README.md          # This file
```

## Technical Details

- **No Dependencies**: Pure HTML, CSS, and JavaScript
- **Local Storage**: Data persists between browser sessions
- **Responsive**: Works on desktop, tablet, and mobile
- **Accessible**: Keyboard navigation and screen reader friendly
- **Modern**: Uses ES6+ JavaScript features

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Keyboard Shortcuts

- `Ctrl/Cmd + Enter`: Submit the chore form
- `Escape`: Close modal dialogs

## Sample Data

The app includes sample chores on first load to help you get started. You can delete these and add your own chores.

## Privacy

All data is stored locally in your browser's localStorage. No data is sent to any server or stored externally. Your chores remain private and secure on your device.
