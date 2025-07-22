# 📊 BD Tracker Guide

## **🎯 What is BD Tracker?**

The BD Tracker is an Excel-like spreadsheet interface built into your dashboard that helps you track your Business Development outreach and partnerships. It replicates the functionality of an Excel-based BD tracker with a modern web interface.

## **📋 Features**

### **✅ Excel-like Interface**
- Grid layout with headers and rows
- Alternating row colors for easy reading
- Fixed header row that stays visible
- Inline editing capabilities

### **✅ All Required Columns**
- **Company** - Target company name
- **Program Pitched** - What you pitched to them
- **Outreach Dates** - When you contacted them
- **Contact Function** - Their role/function
- **Contact Person** - Specific person's name
- **CDA (Yes or No)** - Confidential Disclosure Agreement status
- **Feedback** - Their response/feedback
- **Next Steps** - What to do next
- **Timelines to Remember** - Important dates
- **Reminders** - Any reminders for follow-up

### **✅ Advanced Features**
- **Search & Filter** - Find entries quickly
- **Add New Entries** - Form-based entry creation
- **Edit Entries** - Inline editing with save/cancel
- **Delete Entries** - Remove unwanted entries
- **Export to Excel** - Download as CSV file
- **Real-time Updates** - No page reloads needed
- **Data Persistence** - Saved to backend database

## **🚀 How to Use**

### **1. Access BD Tracker**
- Login to your dashboard
- Click on "BD Tracker" in the sidebar under "MY DEALS"

### **2. Add New Entry**
1. Click the "Add Entry" button
2. Fill in the form with your BD information
3. **Required fields:** Company and Contact Person
4. Click "Save Entry"

### **3. Edit Existing Entry**
1. Click the edit icon (pencil) next to any row
2. Make your changes inline
3. Click the save icon (checkmark) to save
4. Click the cancel icon (X) to cancel

### **4. Delete Entry**
1. Click the delete icon (trash) next to any row
2. Confirm the deletion

### **5. Search & Filter**
- **Search:** Type in the search box to find companies, contacts, or programs
- **Filter:** Use the dropdown to filter by:
  - All Entries
  - With CDA
  - Without CDA
  - Pending Feedback

### **6. Export Data**
- Click "Export Excel" to download your data as a CSV file
- File will be named: `BD_Tracker_YYYY-MM-DD.csv`

## **📊 Data Management**

### **✅ Automatic Saving**
- All data is automatically saved to the backend
- No need to manually save
- Data persists between sessions

### **✅ User-specific Data**
- Each user sees only their own entries
- Data is secure and private
- Admin users can see all entries

### **✅ Backup & Export**
- Regular backups to JSON files
- Export functionality for external use
- CSV format compatible with Excel

## **🔧 Technical Details**

### **Frontend Features**
- React-based with Framer Motion animations
- Tailwind CSS for styling
- Responsive design for all devices
- Real-time updates without page refresh

### **Backend Features**
- RESTful API endpoints
- JWT authentication
- Data validation
- File-based storage with JSON
- Automatic data persistence

### **API Endpoints**
- `GET /api/bd-tracker` - Get all entries
- `POST /api/bd-tracker` - Add new entry
- `PUT /api/bd-tracker/:id` - Update entry
- `DELETE /api/bd-tracker/:id` - Delete entry

## **🎯 Best Practices**

### **✅ Data Entry**
- Always fill in Company and Contact Person (required)
- Use consistent formatting for dates
- Add detailed feedback for better tracking
- Set reminders for important follow-ups

### **✅ Organization**
- Use the search function to find specific entries
- Filter by CDA status to prioritize follow-ups
- Export regularly for backup purposes
- Keep entries updated with latest information

### **✅ Follow-up**
- Check "Pending Feedback" filter regularly
- Update "Next Steps" as you progress
- Set reminders for important timelines
- Use the summary stats to track progress

## **📱 Mobile Friendly**

The BD Tracker works perfectly on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## **🔒 Security**

- All data is protected by JWT authentication
- User-specific data isolation
- Secure API endpoints
- No data sharing between users

## **🚀 Getting Started**

1. **Login** to your dashboard
2. **Navigate** to BD Tracker in the sidebar
3. **Add** your first entry using the "Add Entry" button
4. **Explore** the search and filter features
5. **Export** your data when needed

**Your BD Tracker is ready to help you manage your business development outreach!** 🎉 