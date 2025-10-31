// Database Management System using JSON files
const fs = require('fs');
const path = require('path');

class Database {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.dbFile = path.join(this.dataDir, 'database.json');
        this.ensureDataDirectory();
        this.initializeDatabase();
    }

    ensureDataDirectory() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    initializeDatabase() {
        if (!fs.existsSync(this.dbFile)) {
            const initialData = {
                cases: [],
                evidence: [],
                suspects: [],
                witnesses: [],
                timeline: [],
                documents: [],
                vehicles: [],
                officers: [],
                incidents: [],
                lastUpdated: new Date().toISOString()
            };
            this.saveData(initialData);
        }
    }

    getData() {
        try {
            if (!fs.existsSync(this.dbFile)) {
                this.initializeDatabase();
            }
            const data = fs.readFileSync(this.dbFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading database:', error);
            // Return empty structure if file is corrupted
            const empty = {
                cases: [],
                evidence: [],
                suspects: [],
                witnesses: [],
                timeline: [],
                documents: [],
                lastUpdated: new Date().toISOString()
            };
            this.saveData(empty);
            return empty;
        }
    }

    saveData(data) {
        try {
            data.lastUpdated = new Date().toISOString();
            fs.writeFileSync(this.dbFile, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('Error saving database:', error);
            throw error;
        }
    }

    // Case Operations
    getCases() {
        const data = this.getData();
        return data.cases || [];
    }

    getCase(id) {
        const cases = this.getCases();
        return cases.find(c => c.id === id);
    }

    addCase(caseData) {
        const data = this.getData();
        const newCase = {
            id: this.generateId(),
            ...caseData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.cases.push(newCase);
        this.saveData(data);
        return newCase;
    }

    updateCase(id, updates) {
        const data = this.getData();
        const index = data.cases.findIndex(c => c.id === id);
        if (index !== -1) {
            data.cases[index] = {
                ...data.cases[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveData(data);
            return data.cases[index];
        }
        return null;
    }

    deleteCase(id) {
        const data = this.getData();
        data.cases = data.cases.filter(c => c.id !== id);
        // Also delete related evidence, timeline, documents
        data.evidence = data.evidence.filter(e => e.caseId !== id);
        data.timeline = data.timeline.filter(t => t.caseId !== id);
        data.documents = data.documents.filter(d => d.caseId !== id);
        this.saveData(data);
        return true;
    }

    // Evidence Operations
    getEvidence() {
        const data = this.getData();
        return data.evidence || [];
    }

    getEvidenceByCase(caseId) {
        return this.getEvidence().filter(e => e.caseId === caseId);
    }

    addEvidence(evidenceData) {
        const data = this.getData();
        const newEvidence = {
            id: this.generateId(),
            ...evidenceData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.evidence.push(newEvidence);
        this.saveData(data);
        return newEvidence;
    }

    updateEvidence(id, updates) {
        const data = this.getData();
        const index = data.evidence.findIndex(e => e.id === id);
        if (index !== -1) {
            data.evidence[index] = {
                ...data.evidence[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveData(data);
            return data.evidence[index];
        }
        return null;
    }

    deleteEvidence(id) {
        const data = this.getData();
        data.evidence = data.evidence.filter(e => e.id !== id);
        this.saveData(data);
        return true;
    }

    // Suspect Operations
    getSuspects() {
        const data = this.getData();
        return data.suspects || [];
    }

    getSuspect(id) {
        const suspects = this.getSuspects();
        return suspects.find(s => s.id === id);
    }

    addSuspect(suspectData) {
        const data = this.getData();
        const newSuspect = {
            id: this.generateId(),
            ...suspectData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.suspects.push(newSuspect);
        this.saveData(data);
        return newSuspect;
    }

    updateSuspect(id, updates) {
        const data = this.getData();
        const index = data.suspects.findIndex(s => s.id === id);
        if (index !== -1) {
            data.suspects[index] = {
                ...data.suspects[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveData(data);
            return data.suspects[index];
        }
        return null;
    }

    deleteSuspect(id) {
        const data = this.getData();
        data.suspects = data.suspects.filter(s => s.id !== id);
        this.saveData(data);
        return true;
    }

    // Witness Operations
    getWitnesses() {
        const data = this.getData();
        return data.witnesses || [];
    }

    addWitness(witnessData) {
        const data = this.getData();
        const newWitness = {
            id: this.generateId(),
            ...witnessData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.witnesses.push(newWitness);
        this.saveData(data);
        return newWitness;
    }

    updateWitness(id, updates) {
        const data = this.getData();
        const index = data.witnesses.findIndex(w => w.id === id);
        if (index !== -1) {
            data.witnesses[index] = {
                ...data.witnesses[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveData(data);
            return data.witnesses[index];
        }
        return null;
    }

    deleteWitness(id) {
        const data = this.getData();
        data.witnesses = data.witnesses.filter(w => w.id !== id);
        this.saveData(data);
        return true;
    }

    // Timeline Operations
    getTimeline() {
        const data = this.getData();
        return data.timeline || [];
    }

    getTimelineByCase(caseId) {
        return this.getTimeline().filter(t => t.caseId === caseId);
    }

    addTimelineEvent(timelineData) {
        const data = this.getData();
        const newEvent = {
            id: this.generateId(),
            ...timelineData,
            createdAt: new Date().toISOString()
        };
        data.timeline.push(newEvent);
        // Sort by date
        data.timeline.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        this.saveData(data);
        return newEvent;
    }

    updateTimelineEvent(id, updates) {
        const data = this.getData();
        const index = data.timeline.findIndex(t => t.id === id);
        if (index !== -1) {
            data.timeline[index] = {
                ...data.timeline[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            data.timeline.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
            this.saveData(data);
            return data.timeline[index];
        }
        return null;
    }

    deleteTimelineEvent(id) {
        const data = this.getData();
        data.timeline = data.timeline.filter(t => t.id !== id);
        this.saveData(data);
        return true;
    }

    // Document Operations
    getDocuments() {
        const data = this.getData();
        return data.documents || [];
    }

    getDocumentsByCase(caseId) {
        return this.getDocuments().filter(d => d.caseId === caseId);
    }

    addDocument(documentData) {
        const data = this.getData();
        const newDocument = {
            id: this.generateId(),
            ...documentData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.documents.push(newDocument);
        this.saveData(data);
        return newDocument;
    }

    updateDocument(id, updates) {
        const data = this.getData();
        const index = data.documents.findIndex(d => d.id === id);
        if (index !== -1) {
            data.documents[index] = {
                ...data.documents[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveData(data);
            return data.documents[index];
        }
        return null;
    }

    deleteDocument(id) {
        const data = this.getData();
        data.documents = data.documents.filter(d => d.id !== id);
        this.saveData(data);
        return true;
    }

    // Search across all entities
    search(query) {
        const lowerQuery = query.toLowerCase();
        const results = {
            cases: [],
            evidence: [],
            suspects: [],
            witnesses: [],
            timeline: [],
            documents: []
        };

        // Search cases
        this.getCases().forEach(c => {
            if (this.matchesSearch(c, lowerQuery, ['caseNumber', 'title', 'description', 'location', 'status', 'officer'])) {
                results.cases.push(c);
            }
        });

        // Search evidence
        this.getEvidence().forEach(e => {
            if (this.matchesSearch(e, lowerQuery, ['itemNumber', 'description', 'type', 'location', 'officer', 'notes'])) {
                results.evidence.push(e);
            }
        });

        // Search suspects
        this.getSuspects().forEach(s => {
            if (this.matchesSearch(s, lowerQuery, ['name', 'aliases', 'address', 'phone', 'email', 'description', 'notes'])) {
                results.suspects.push(s);
            }
        });

        // Search witnesses
        this.getWitnesses().forEach(w => {
            if (this.matchesSearch(w, lowerQuery, ['name', 'address', 'phone', 'email', 'statement', 'notes'])) {
                results.witnesses.push(w);
            }
        });

        // Search timeline
        this.getTimeline().forEach(t => {
            if (this.matchesSearch(t, lowerQuery, ['description', 'location', 'officer', 'notes'])) {
                results.timeline.push(t);
            }
        });

        // Search documents
        this.getDocuments().forEach(d => {
            if (this.matchesSearch(d, lowerQuery, ['title', 'content', 'type', 'author', 'notes'])) {
                results.documents.push(d);
            }
        });

        // Search vehicles
        this.getVehicles().forEach(v => {
            if (this.matchesSearch(v, lowerQuery, ['plate', 'vin', 'make', 'model', 'color', 'owner', 'status', 'notes'])) {
                results.vehicles.push(v);
            }
        });

        return results;
    }

    matchesSearch(obj, query, fields) {
        return fields.some(field => {
            const value = obj[field];
            if (value && typeof value === 'string') {
                return value.toLowerCase().includes(query);
            }
            return false;
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Vehicle Operations
    getVehicles() {
        const data = this.getData();
        return data.vehicles || [];
    }

    getVehicle(id) {
        const vehicles = this.getVehicles();
        return vehicles.find(v => v.id === id);
    }

    addVehicle(vehicleData) {
        const data = this.getData();
        const newVehicle = {
            id: this.generateId(),
            ...vehicleData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.vehicles.push(newVehicle);
        this.saveData(data);
        return newVehicle;
    }

    updateVehicle(id, updates) {
        const data = this.getData();
        const index = data.vehicles.findIndex(v => v.id === id);
        if (index !== -1) {
            data.vehicles[index] = {
                ...data.vehicles[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveData(data);
            return data.vehicles[index];
        }
        return null;
    }

    deleteVehicle(id) {
        const data = this.getData();
        data.vehicles = data.vehicles.filter(v => v.id !== id);
        this.saveData(data);
        return true;
    }

    // Incident Operations
    getIncidents() {
        const data = this.getData();
        return data.incidents || [];
    }

    addIncident(incidentData) {
        const data = this.getData();
        const newIncident = {
            id: this.generateId(),
            ...incidentData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.incidents.push(newIncident);
        this.saveData(data);
        return newIncident;
    }

    updateIncident(id, updates) {
        const data = this.getData();
        const index = data.incidents.findIndex(i => i.id === id);
        if (index !== -1) {
            data.incidents[index] = {
                ...data.incidents[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveData(data);
            return data.incidents[index];
        }
        return null;
    }

    deleteIncident(id) {
        const data = this.getData();
        data.incidents = data.incidents.filter(i => i.id !== id);
        this.saveData(data);
        return true;
    }

    // Officer Operations
    getOfficers() {
        const data = this.getData();
        return data.officers || [];
    }

    addOfficer(officerData) {
        const data = this.getData();
        const newOfficer = {
            id: this.generateId(),
            ...officerData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.officers.push(newOfficer);
        this.saveData(data);
        return newOfficer;
    }
}

module.exports = Database;