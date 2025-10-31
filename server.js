const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const CORRECT_PASSWORD = 'chevy2488$';

// Configure multer for file uploads
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

// Session configuration
app.use(session({
    secret: 'investigation-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize database
const db = new Database();

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.authenticated) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized' });
};

// Password authentication endpoint
app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    
    if (password === CORRECT_PASSWORD) {
        req.session.authenticated = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

// Check authentication status
app.get('/api/auth/check', (req, res) => {
    res.json({ authenticated: !!req.session.authenticated });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ success: true });
    });
});

// Case endpoints
app.get('/api/cases', requireAuth, (req, res) => {
    try {
        const cases = db.getCases();
        res.json(cases);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/cases/:id', requireAuth, (req, res) => {
    try {
        const caseData = db.getCase(req.params.id);
        if (!caseData) {
            return res.status(404).json({ error: 'Case not found' });
        }
        res.json(caseData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/cases', requireAuth, (req, res) => {
    try {
        const newCase = db.addCase(req.body);
        res.json(newCase);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/cases/:id', requireAuth, (req, res) => {
    try {
        const updatedCase = db.updateCase(req.params.id, req.body);
        if (!updatedCase) {
            return res.status(404).json({ error: 'Case not found' });
        }
        res.json(updatedCase);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/cases/:id', requireAuth, (req, res) => {
    try {
        db.deleteCase(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Evidence endpoints
app.get('/api/evidence', requireAuth, (req, res) => {
    try {
        const evidence = db.getEvidence();
        res.json(evidence);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/evidence/:id', requireAuth, (req, res) => {
    try {
        const evidence = db.getEvidence();
        const item = evidence.find(e => e.id === req.params.id);
        if (!item) {
            return res.status(404).json({ error: 'Evidence not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/evidence', requireAuth, (req, res) => {
    try {
        const newEvidence = db.addEvidence(req.body);
        res.json(newEvidence);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/evidence/:id', requireAuth, (req, res) => {
    try {
        const updatedEvidence = db.updateEvidence(req.params.id, req.body);
        if (!updatedEvidence) {
            return res.status(404).json({ error: 'Evidence not found' });
        }
        res.json(updatedEvidence);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/evidence/:id', requireAuth, (req, res) => {
    try {
        db.deleteEvidence(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Suspect endpoints
app.get('/api/suspects', requireAuth, (req, res) => {
    try {
        const suspects = db.getSuspects();
        res.json(suspects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/suspects/:id', requireAuth, (req, res) => {
    try {
        const suspect = db.getSuspect(req.params.id);
        if (!suspect) {
            return res.status(404).json({ error: 'Suspect not found' });
        }
        res.json(suspect);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/suspects', requireAuth, (req, res) => {
    try {
        const newSuspect = db.addSuspect(req.body);
        res.json(newSuspect);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/suspects/:id', requireAuth, (req, res) => {
    try {
        const updatedSuspect = db.updateSuspect(req.params.id, req.body);
        if (!updatedSuspect) {
            return res.status(404).json({ error: 'Suspect not found' });
        }
        res.json(updatedSuspect);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/suspects/:id', requireAuth, (req, res) => {
    try {
        db.deleteSuspect(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Witness endpoints
app.get('/api/witnesses', requireAuth, (req, res) => {
    try {
        const witnesses = db.getWitnesses();
        res.json(witnesses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/witnesses/:id', requireAuth, (req, res) => {
    try {
        const witnesses = db.getWitnesses();
        const witness = witnesses.find(w => w.id === req.params.id);
        if (!witness) {
            return res.status(404).json({ error: 'Witness not found' });
        }
        res.json(witness);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/witnesses', requireAuth, (req, res) => {
    try {
        const newWitness = db.addWitness(req.body);
        res.json(newWitness);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/witnesses/:id', requireAuth, (req, res) => {
    try {
        const updatedWitness = db.updateWitness(req.params.id, req.body);
        if (!updatedWitness) {
            return res.status(404).json({ error: 'Witness not found' });
        }
        res.json(updatedWitness);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/witnesses/:id', requireAuth, (req, res) => {
    try {
        db.deleteWitness(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Timeline endpoints
app.get('/api/timeline', requireAuth, (req, res) => {
    try {
        const timeline = db.getTimeline();
        res.json(timeline);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/timeline', requireAuth, (req, res) => {
    try {
        const newEvent = db.addTimelineEvent(req.body);
        res.json(newEvent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/timeline/:id', requireAuth, (req, res) => {
    try {
        const updatedEvent = db.updateTimelineEvent(req.params.id, req.body);
        if (!updatedEvent) {
            return res.status(404).json({ error: 'Timeline event not found' });
        }
        res.json(updatedEvent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/timeline/:id', requireAuth, (req, res) => {
    try {
        db.deleteTimelineEvent(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Document endpoints
app.get('/api/documents', requireAuth, (req, res) => {
    try {
        const documents = db.getDocuments();
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/documents', requireAuth, (req, res) => {
    try {
        const newDocument = db.addDocument(req.body);
        res.json(newDocument);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/documents/:id', requireAuth, (req, res) => {
    try {
        const updatedDocument = db.updateDocument(req.params.id, req.body);
        if (!updatedDocument) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json(updatedDocument);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/documents/:id', requireAuth, (req, res) => {
    try {
        db.deleteDocument(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search endpoint
app.post('/api/search', requireAuth, (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        const results = db.search(query);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', requireAuth, (req, res) => {
    try {
        const cases = db.getCases();
        const evidence = db.getEvidence();
        const suspects = db.getSuspects();
        const witnesses = db.getWitnesses();
        
        const stats = {
            totalCases: cases.length,
            activeCases: cases.filter(c => c.status !== 'closed').length,
            closedCases: cases.filter(c => c.status === 'closed').length,
            evidenceCount: evidence.length,
            suspectsCount: suspects.length,
            witnessesCount: witnesses.length
        };
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Photo upload endpoint
app.post('/api/evidence/:id/upload', requireAuth, upload.array('photos', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const evidence = db.getEvidence().find(e => e.id === req.params.id);
        if (!evidence) {
            return res.status(404).json({ error: 'Evidence not found' });
        }

        const photoUrls = req.files.map(file => `/uploads/${file.filename}`);
        if (!evidence.photos) {
            evidence.photos = [];
        }
        evidence.photos = [...evidence.photos, ...photoUrls];
        
        const updated = db.updateEvidence(req.params.id, { photos: evidence.photos });
        res.json({ photos: updated.photos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete photo endpoint
app.delete('/api/evidence/:id/photo/:filename', requireAuth, (req, res) => {
    try {
        const evidence = db.getEvidence().find(e => e.id === req.params.id);
        if (!evidence) {
            return res.status(404).json({ error: 'Evidence not found' });
        }

        const photoPath = path.join(uploadDir, req.params.filename);
        if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
        }

        evidence.photos = evidence.photos.filter(p => !p.includes(req.params.filename));
        db.updateEvidence(req.params.id, { photos: evidence.photos });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Vehicle endpoints
app.get('/api/vehicles', requireAuth, (req, res) => {
    try {
        const vehicles = db.getVehicles();
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/vehicles/:id', requireAuth, (req, res) => {
    try {
        const vehicle = db.getVehicle(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/vehicles', requireAuth, (req, res) => {
    try {
        const newVehicle = db.addVehicle(req.body);
        res.json(newVehicle);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/vehicles/:id', requireAuth, (req, res) => {
    try {
        const updatedVehicle = db.updateVehicle(req.params.id, req.body);
        if (!updatedVehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.json(updatedVehicle);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/vehicles/:id', requireAuth, (req, res) => {
    try {
        db.deleteVehicle(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Incident endpoints
app.get('/api/incidents', requireAuth, (req, res) => {
    try {
        const incidents = db.getIncidents();
        res.json(incidents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/incidents', requireAuth, (req, res) => {
    try {
        const newIncident = db.addIncident(req.body);
        res.json(newIncident);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/incidents/:id', requireAuth, (req, res) => {
    try {
        const updatedIncident = db.updateIncident(req.params.id, req.body);
        if (!updatedIncident) {
            return res.status(404).json({ error: 'Incident not found' });
        }
        res.json(updatedIncident);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/incidents/:id', requireAuth, (req, res) => {
    try {
        db.deleteIncident(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Investigation Database Server running on http://localhost:${PORT}`);
    console.log('Data is stored in ./data/database.json');
    console.log('Uploads stored in ./public/uploads');
});
