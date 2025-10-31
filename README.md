# Investigation Database System

A comprehensive, fully-functional investigation database system built with Node.js and Express. All data is securely stored in JSON files on the server.

## Features

### 🔒 Security
- **Server-Side Password Protection**: Secure authentication with password "chevy2488$"
- **Session Management**: Express sessions for secure authentication
- **Server-Side Validation**: All authentication and data operations handled on the server

### 📊 Core Systems

1. **Case Management**
   - Create, edit, and delete cases
   - Case status tracking (Open, Investigating, Pending, Closed)
   - Priority levels (Low, Normal, High, Urgent)
   - Case numbering system
   - Officer/investigator assignment
   - Location and incident date tracking

2. **Evidence Management**
   - Evidence item numbering
   - Chain of custody tracking
   - Evidence types (Physical, Digital, Biological, Document, Weapon, Other)
   - Collection date and officer tracking
   - Storage location management
   - Linked to cases

3. **Persons of Interest / Suspects**
   - Full profile management
   - Aliases tracking
   - Contact information (phone, email, address)
   - Status tracking (Active, In Custody, Released, Cleared)
   - Detailed descriptions and notes

4. **Witnesses**
   - Witness profile management
   - Statement recording
   - Statement date tracking
   - Contact information

5. **Timeline / Chronology**
   - Chronological event tracking
   - Linked to cases
   - Date/time sorting
   - Location and officer tracking
   - Event descriptions and notes

6. **Documents & Notes**
   - Document creation and management
   - Multiple document types (Report, Note, Interview, Statement, Analysis)
   - Content editing
   - Author tracking
   - Linked to cases

7. **Global Search**
   - Search across all records
   - Case-aware results
   - Comprehensive search results display

### 📱 Mobile Responsive
- Fully responsive design for mobile devices
- Touch-friendly interface
- Mobile navigation menu
- Optimized layouts for small screens

### 💾 Data Storage
- All data stored in JSON files in `./data/database.json`
- Secure server-side file operations
- Automatic data persistence
- No browser storage - all data on server

## Installation

1. **Install Node.js** (v14 or higher recommended)

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

   Or for development:
   ```bash
   node server.js
   ```

4. **Access the Application**
   - Open your browser and navigate to: `http://localhost:3000`
   - Enter the password: `chevy2488$`

## Project Structure

```
investigation-database/
├── server.js              # Express server and API routes
├── database.js            # Database operations (JSON file management)
├── package.json           # Dependencies and scripts
├── public/                # Frontend files
│   ├── index.html         # Main HTML page
│   ├── styles.css         # Stylesheet
│   └── app.js             # Frontend application logic
├── data/                  # Data storage (created automatically)
│   └── database.json      # All database records
└── README.md              # This file
```

## Data Storage

All data is stored in `./data/database.json`. The file structure:

```json
{
  "cases": [],
  "evidence": [],
  "suspects": [],
  "witnesses": [],
  "timeline": [],
  "documents": [],
  "lastUpdated": "ISO timestamp"
}
```

**Important**: 
- The `data/` directory is automatically created on first run
- Backup the `data/database.json` file regularly
- The file is human-readable JSON for easy inspection and backup

## API Endpoints

All endpoints require authentication (except `/api/auth/login`):

### Authentication
- `POST /api/auth/login` - Login with password
- `GET /api/auth/check` - Check authentication status
- `POST /api/auth/logout` - Logout

### Cases
- `GET /api/cases` - Get all cases
- `GET /api/cases/:id` - Get single case
- `POST /api/cases` - Create new case
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case

### Evidence
- `GET /api/evidence` - Get all evidence
- `GET /api/evidence/:id` - Get single evidence item
- `POST /api/evidence` - Create new evidence
- `PUT /api/evidence/:id` - Update evidence
- `DELETE /api/evidence/:id` - Delete evidence

### Suspects
- `GET /api/suspects` - Get all suspects
- `GET /api/suspects/:id` - Get single suspect
- `POST /api/suspects` - Create new suspect
- `PUT /api/suspects/:id` - Update suspect
- `DELETE /api/suspects/:id` - Delete suspect

### Witnesses
- `GET /api/witnesses` - Get all witnesses
- `POST /api/witnesses` - Create new witness
- `PUT /api/witnesses/:id` - Update witness
- `DELETE /api/witnesses/:id` - Delete witness

### Timeline
- `GET /api/timeline` - Get all timeline events
- `POST /api/timeline` - Create new event
- `PUT /api/timeline/:id` - Update event
- `DELETE /api/timeline/:id` - Delete event

### Documents
- `GET /api/documents` - Get all documents
- `POST /api/documents` - Create new document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Search
- `POST /api/search` - Global search across all records

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Usage

1. **Start the Server**
   ```bash
   npm start
   ```

2. **Access the System**
   - Open `http://localhost:3000` in your browser
   - Enter password: `chevy2488$`
   - Click "Authenticate"

3. **Creating Records**
   - Click the "+ New" button in any section
   - Fill out the form
   - Click "Create" to save

4. **Editing Records**
   - Click "Edit" on any record card
   - Modify the information
   - Click "Update" to save changes

5. **Searching**
   - Use the search bar in each section for filtered results
   - Use the Global Search page to search across all records

6. **Deleting Records**
   - Click "Delete" on any record
   - Confirm deletion (note: deleting a case also deletes related evidence, timeline events, and documents)

## Security Notes

- **Password**: Default password is `chevy2488$`. Change this in `server.js` (line 8) for production use.
- **Session Secret**: Change the session secret in `server.js` (line 19) for production.
- **HTTPS**: For production, enable HTTPS and set `secure: true` in session cookie configuration.
- **Data Files**: The JSON database file contains sensitive information. Ensure proper file permissions.

## Configuration

### Change Port
Edit `server.js`:
```javascript
const PORT = process.env.PORT || 3000; // Change 3000 to your desired port
```

### Change Password
Edit `server.js`:
```javascript
const CORRECT_PASSWORD = 'your-new-password-here';
```

### Change Data Directory
Edit `database.js`:
```javascript
this.dataDir = path.join(__dirname, 'data'); // Change 'data' to your desired directory
```

## Dependencies

- **express**: Web framework
- **body-parser**: Parse request bodies
- **express-session**: Session management

## Browser Compatibility

Works in all modern browsers that support:
- Fetch API
- ES6 JavaScript features
- CSS Grid and Flexbox

## Backup Recommendations

1. Regularly backup `./data/database.json`
2. The JSON format is human-readable for easy inspection
3. Consider automated backups if running in production

## Troubleshooting

- **Port already in use**: Change the PORT in `server.js` or set environment variable `PORT`
- **Data not persisting**: Check file permissions on `./data/` directory
- **Authentication issues**: Clear browser cookies and try again
- **Cannot access**: Ensure the server is running and firewall allows connections

---

**Note**: This system stores all data locally on the server in JSON files. All operations are handled server-side for security.
