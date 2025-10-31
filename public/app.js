// Main Application Logic - API-based version
const API_BASE = '/api';

// API Helper Functions
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include' // Include cookies for session
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        
        if (response.status === 401) {
            // Unauthorized - redirect to login
            window.location.reload();
            return null;
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Password Protection
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication status
    try {
        const authStatus = await apiCall('/auth/check');
        if (authStatus && authStatus.authenticated) {
            showMainApp();
            return;
        }
    } catch (error) {
        // Not authenticated, show login
    }

    const passwordForm = document.getElementById('passwordForm');
    const passwordInput = document.getElementById('passwordInput');
    const passwordScreen = document.getElementById('passwordScreen');
    const passwordError = document.getElementById('passwordError');

    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const enteredPassword = passwordInput.value;
        
        try {
            const result = await apiCall('/auth/login', 'POST', { password: enteredPassword });
            
            if (result && result.success) {
                passwordScreen.classList.add('hidden');
                showMainApp();
                passwordInput.value = '';
                passwordError.classList.remove('show');
            } else {
                throw new Error('Invalid password');
            }
        } catch (error) {
            passwordError.textContent = 'Invalid access code. Access denied.';
            passwordError.classList.add('show');
            passwordInput.value = '';
        }
    });

    // Prevent right-click and view source
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
            e.preventDefault();
        }
    });
});

function showMainApp() {
    document.getElementById('passwordScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    initializeApp();
}

// Initialize Application
function initializeApp() {
    setupNavigation();
    setupEventListeners();
    loadDashboard();
}

// Navigation Setup
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const pageName = btn.dataset.page;
            
            // Update active button
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show corresponding page
            pages.forEach(p => p.classList.remove('active'));
            const targetPage = document.getElementById(`${pageName}Page`);
            if (targetPage) {
                targetPage.classList.add('active');
            }

            // Load page data
            switch(pageName) {
                case 'dashboard':
                    loadDashboard();
                    break;
                case 'cases':
                    loadCases();
                    break;
                case 'evidence':
                    loadEvidence();
                    break;
                case 'suspects':
                    loadSuspects();
                    break;
                case 'witnesses':
                    loadWitnesses();
                    break;
                case 'timeline':
                    loadTimeline();
                    break;
                case 'documents':
                    loadDocuments();
                    break;
                case 'search':
                    // Search page loaded on demand
                    break;
                case 'vehicles':
                    loadVehicles();
                    break;
                case 'osint':
                    // OSINT page ready
                    break;
            }

            // Close mobile menu
            navMenu.classList.remove('active');
        });
    });

    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Event Listeners Setup
function setupEventListeners() {
    // Case Management
    document.getElementById('newCaseBtn').addEventListener('click', () => showCaseForm());
    document.getElementById('caseSearch').addEventListener('input', filterCases);
    document.getElementById('caseStatusFilter').addEventListener('change', filterCases);

    // Evidence Management
    document.getElementById('newEvidenceBtn').addEventListener('click', () => showEvidenceForm());
    document.getElementById('evidenceSearch').addEventListener('input', filterEvidence);
    document.getElementById('evidenceCaseFilter').addEventListener('change', filterEvidence);

    // Suspects
    document.getElementById('newSuspectBtn').addEventListener('click', () => showSuspectForm());
    document.getElementById('suspectSearch').addEventListener('input', filterSuspects);

    // Witnesses
    document.getElementById('newWitnessBtn').addEventListener('click', () => showWitnessForm());
    document.getElementById('witnessSearch').addEventListener('input', filterWitnesses);

    // Timeline
    document.getElementById('newTimelineEventBtn').addEventListener('click', () => showTimelineForm());
    document.getElementById('timelineCaseFilter').addEventListener('change', filterTimeline);

    // Documents
    document.getElementById('newDocumentBtn').addEventListener('click', () => showDocumentForm());
    document.getElementById('documentSearch').addEventListener('input', filterDocuments);
    document.getElementById('documentCaseFilter').addEventListener('change', filterDocuments);

    // Search
    document.getElementById('executeSearchBtn').addEventListener('click', executeGlobalSearch);
    document.getElementById('globalSearchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') executeGlobalSearch();
    });

    // Vehicles
    const newVehicleBtn = document.getElementById('newVehicleBtn');
    if (newVehicleBtn) {
        newVehicleBtn.addEventListener('click', () => showVehicleForm());
    }
    const vehicleSearch = document.getElementById('vehicleSearch');
    if (vehicleSearch) {
        vehicleSearch.addEventListener('input', filterVehicles);
    }
    const vehicleStatusFilter = document.getElementById('vehicleStatusFilter');
    if (vehicleStatusFilter) {
        vehicleStatusFilter.addEventListener('change', filterVehicles);
    }

    // Modal close
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') closeModal();
    });

    // Load case filters
    loadCaseFilters();
}

// Dashboard
async function loadDashboard() {
    try {
        const stats = await apiCall('/dashboard/stats');
        if (stats) {
            document.getElementById('statTotalCases').textContent = stats.totalCases;
            document.getElementById('statActiveCases').textContent = stats.activeCases;
            document.getElementById('statEvidence').textContent = stats.evidenceCount;
            document.getElementById('statSuspects').textContent = stats.suspectsCount;
            document.getElementById('statWitnesses').textContent = stats.witnessesCount;
            document.getElementById('statClosedCases').textContent = stats.closedCases;
        }

        // Load recent activity
        const [cases, evidence, suspects, witnesses] = await Promise.all([
            apiCall('/cases'),
            apiCall('/evidence'),
            apiCall('/suspects'),
            apiCall('/witnesses')
        ]);

        const allItems = [
            ...(cases || []).map(c => ({...c, type: 'case', date: c.updatedAt})),
            ...(evidence || []).map(e => ({...e, type: 'evidence', date: e.updatedAt})),
            ...(suspects || []).map(s => ({...s, type: 'suspect', date: s.updatedAt})),
            ...(witnesses || []).map(w => ({...w, type: 'witness', date: w.updatedAt}))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

        const recentActivity = document.getElementById('recentActivity');
        recentActivity.innerHTML = '';
        
        if (allItems.length === 0) {
            recentActivity.innerHTML = '<p style="color: #7f8c8d;">No recent activity</p>';
        } else {
            allItems.forEach(item => {
                const div = document.createElement('div');
                div.className = 'activity-item';
                const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);
                const name = item.type === 'case' ? item.title : (item.name || item.itemNumber || 'Unknown');
                div.textContent = `${typeLabel}: ${name} - ${formatDate(item.date)}`;
                recentActivity.appendChild(div);
            });
        }

        // Priority Cases
        const priorityCases = document.getElementById('priorityCases');
        priorityCases.innerHTML = '';
        
        const priority = (cases || []).filter(c => c.priority === 'high' && c.status !== 'closed').slice(0, 5);
        if (priority.length === 0) {
            priorityCases.innerHTML = '<p style="color: #7f8c8d;">No priority cases</p>';
        } else {
            priority.forEach(c => {
                const div = document.createElement('div');
                div.className = 'activity-item';
                div.innerHTML = `<strong>${c.caseNumber || c.title}</strong> - ${c.status} - ${formatDate(c.updatedAt)}`;
                priorityCases.appendChild(div);
            });
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Case Management
let allCases = [];
let allEvidence = [];
let allSuspects = [];
let allWitnesses = [];
let allTimeline = [];
let allDocuments = [];

async function loadCases() {
    try {
        allCases = await apiCall('/cases') || [];
        displayCases(allCases);
    } catch (error) {
        console.error('Error loading cases:', error);
        document.getElementById('casesList').innerHTML = '<p style="text-align: center; color: #e74c3c;">Error loading cases</p>';
    }
}

function displayCases(cases) {
    const container = document.getElementById('casesList');
    container.innerHTML = '';

    if (cases.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No cases found. Create your first case.</p>';
        return;
    }

    cases.forEach(c => {
        const card = createCaseCard(c);
        container.appendChild(card);
    });
}

function createCaseCard(caseData) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
        <div class="item-card-header">
            <div>
                <h3 class="item-card-title">${escapeHtml(caseData.caseNumber || 'No Case Number')}</h3>
                <p class="item-card-title" style="font-size: 1rem; font-weight: normal;">${escapeHtml(caseData.title || 'Untitled Case')}</p>
            </div>
            <div class="item-card-actions">
                <span class="status-badge status-${caseData.status || 'open'}">${escapeHtml((caseData.status || 'open').toUpperCase())}</span>
                <button class="btn btn-primary" onclick="editCase('${caseData.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteCase('${caseData.id}')">Delete</button>
            </div>
        </div>
        <div class="item-card-body">
            <div class="item-card-field">
                <span class="item-card-label">Status</span>
                <span class="item-card-value">${escapeHtml(caseData.status || 'open')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Officer</span>
                <span class="item-card-value">${escapeHtml(caseData.officer || 'N/A')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Location</span>
                <span class="item-card-value">${escapeHtml(caseData.location || 'N/A')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Priority</span>
                <span class="item-card-value">${escapeHtml(caseData.priority || 'normal')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Created</span>
                <span class="item-card-value">${formatDate(caseData.createdAt)}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Updated</span>
                <span class="item-card-value">${formatDate(caseData.updatedAt)}</span>
            </div>
        </div>
        ${caseData.description ? `<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;"><strong>Description:</strong> ${escapeHtml(caseData.description)}</div>` : ''}
    `;
    return card;
}

async function showCaseForm(caseId = null) {
    let caseData = null;
    if (caseId) {
        try {
            caseData = await apiCall(`/cases/${caseId}`);
        } catch (error) {
            console.error('Error loading case:', error);
        }
    }
    
    const cases = allCases.length > 0 ? allCases : await apiCall('/cases') || [];
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <h3>${caseId ? 'Edit Case' : 'New Case'}</h3>
        <form id="caseForm">
            <div class="form-group">
                <label>Case Number *</label>
                <input type="text" id="caseNumber" value="${caseData ? escapeHtml(caseData.caseNumber || '') : ''}" required>
            </div>
            <div class="form-group">
                <label>Title *</label>
                <input type="text" id="caseTitle" value="${caseData ? escapeHtml(caseData.title || '') : ''}" required>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="caseStatus">
                    <option value="open" ${caseData && caseData.status === 'open' ? 'selected' : ''}>Open</option>
                    <option value="investigating" ${caseData && caseData.status === 'investigating' ? 'selected' : ''}>Investigating</option>
                    <option value="pending" ${caseData && caseData.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="closed" ${caseData && caseData.status === 'closed' ? 'selected' : ''}>Closed</option>
                </select>
            </div>
            <div class="form-group">
                <label>Priority</label>
                <select id="casePriority">
                    <option value="low" ${caseData && caseData.priority === 'low' ? 'selected' : ''}>Low</option>
                    <option value="normal" ${caseData && caseData.priority === 'normal' ? 'selected' : ''}>Normal</option>
                    <option value="high" ${caseData && caseData.priority === 'high' ? 'selected' : ''}>High</option>
                    <option value="urgent" ${caseData && caseData.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
                </select>
            </div>
            <div class="form-group">
                <label>Officer/Investigator</label>
                <input type="text" id="caseOfficer" value="${caseData ? escapeHtml(caseData.officer || '') : ''}">
            </div>
            <div class="form-group">
                <label>Location</label>
                <input type="text" id="caseLocation" value="${caseData ? escapeHtml(caseData.location || '') : ''}">
            </div>
            <div class="form-group">
                <label>Date of Incident</label>
                <input type="datetime-local" id="caseDate" value="${caseData && caseData.incidentDate ? formatDateTimeLocal(caseData.incidentDate) : ''}">
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="caseDescription" rows="5">${caseData ? escapeHtml(caseData.description || '') : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="caseNotes" rows="3">${caseData ? escapeHtml(caseData.notes || '') : ''}</textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">${caseId ? 'Update' : 'Create'} Case</button>
            </div>
        </form>
    `;

    modal.classList.remove('hidden');
    document.getElementById('caseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveCase(caseId);
    });
}

async function saveCase(caseId) {
    const caseData = {
        caseNumber: document.getElementById('caseNumber').value,
        title: document.getElementById('caseTitle').value,
        status: document.getElementById('caseStatus').value,
        priority: document.getElementById('casePriority').value,
        officer: document.getElementById('caseOfficer').value,
        location: document.getElementById('caseLocation').value,
        incidentDate: document.getElementById('caseDate').value,
        description: document.getElementById('caseDescription').value,
        notes: document.getElementById('caseNotes').value
    };

    try {
        if (caseId) {
            await apiCall(`/cases/${caseId}`, 'PUT', caseData);
        } else {
            await apiCall('/cases', 'POST', caseData);
        }
        closeModal();
        await loadCases();
        await loadDashboard();
        await loadCaseFilters();
    } catch (error) {
        alert('Error saving case: ' + error.message);
    }
}

async function editCase(id) {
    await showCaseForm(id);
}

async function deleteCase(id) {
    if (confirm('Are you sure you want to delete this case? This will also delete related evidence, timeline events, and documents.')) {
        try {
            await apiCall(`/cases/${id}`, 'DELETE');
            await loadCases();
            await loadDashboard();
            await loadCaseFilters();
        } catch (error) {
            alert('Error deleting case: ' + error.message);
        }
    }
}

function filterCases() {
    const search = document.getElementById('caseSearch').value.toLowerCase();
    const statusFilter = document.getElementById('caseStatusFilter').value;
    
    const filtered = allCases.filter(c => {
        const matchesSearch = !search || 
            (c.caseNumber && c.caseNumber.toLowerCase().includes(search)) ||
            (c.title && c.title.toLowerCase().includes(search)) ||
            (c.description && c.description.toLowerCase().includes(search));
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    displayCases(filtered);
}

async function loadCaseFilters() {
    try {
        const cases = await apiCall('/cases') || [];
        const evidenceFilter = document.getElementById('evidenceCaseFilter');
        const timelineFilter = document.getElementById('timelineCaseFilter');
        const documentFilter = document.getElementById('documentCaseFilter');

        [evidenceFilter, timelineFilter, documentFilter].forEach(select => {
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="all">All Cases</option>';
                cases.forEach(c => {
                    const option = document.createElement('option');
                    option.value = c.id;
                    option.textContent = `${c.caseNumber || 'No Number'} - ${c.title || 'Untitled'}`;
                    if (currentValue === c.id) option.selected = true;
                    select.appendChild(option);
                });
            }
        });
        allCases = cases;
    } catch (error) {
        console.error('Error loading case filters:', error);
    }
}

// Evidence Management
async function loadEvidence() {
    try {
        allEvidence = await apiCall('/evidence') || [];
        displayEvidence(allEvidence);
    } catch (error) {
        console.error('Error loading evidence:', error);
    }
}

function displayEvidence(evidence) {
    const container = document.getElementById('evidenceList');
    container.innerHTML = '';

    if (evidence.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No evidence items found.</p>';
        return;
    }

    evidence.forEach(e => {
        const card = createEvidenceCard(e);
        container.appendChild(card);
    });
}

function createEvidenceCard(evidenceData) {
    const caseData = allCases.find(c => c.id === evidenceData.caseId);
    const card = document.createElement('div');
    card.className = 'item-card';
    
    let photoSection = '';
    if (evidenceData.photos && evidenceData.photos.length > 0) {
        photoSection = `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--terminal-border);">
                <strong style="color: var(--terminal-green);">Photos (${evidenceData.photos.length}):</strong>
                <div class="photo-gallery" style="margin-top: 0.5rem;">
                    ${evidenceData.photos.slice(0, 4).map(photo => `
                        <div class="photo-gallery-item">
                            <img src="${photo}" alt="Evidence photo" onclick="showLightbox('${photo}')">
                        </div>
                    `).join('')}
                    ${evidenceData.photos.length > 4 ? `<div style="grid-column: span 1; display: flex; align-items: center; justify-content: center; color: var(--terminal-text);">+${evidenceData.photos.length - 4} more</div>` : ''}
                </div>
            </div>
        `;
    }
    
    card.innerHTML = `
        <div class="item-card-header">
            <div>
                <h3 class="item-card-title">${escapeHtml(evidenceData.itemNumber || 'No Item Number')}</h3>
                <p style="font-size: 0.9rem; color: #7f8c8d;">${escapeHtml(evidenceData.type || 'Unknown Type')}</p>
            </div>
            <div class="item-card-actions">
                <button class="btn btn-primary" onclick="editEvidence('${evidenceData.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteEvidence('${evidenceData.id}')">Delete</button>
            </div>
        </div>
        <div class="item-card-body">
            <div class="item-card-field">
                <span class="item-card-label">Case</span>
                <span class="item-card-value">${caseData ? escapeHtml(caseData.caseNumber || caseData.title) : 'No Case'}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Type</span>
                <span class="item-card-value">${escapeHtml(evidenceData.type || 'N/A')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Collected By</span>
                <span class="item-card-value">${escapeHtml(evidenceData.officer || 'N/A')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Collection Date</span>
                <span class="item-card-value">${evidenceData.collectionDate ? formatDate(evidenceData.collectionDate) : 'N/A'}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Location</span>
                <span class="item-card-value">${escapeHtml(evidenceData.location || 'N/A')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Chain of Custody</span>
                <span class="item-card-value">${evidenceData.custodyChain ? escapeHtml(evidenceData.custodyChain) : 'Not documented'}</span>
            </div>
        </div>
        ${evidenceData.description ? `<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--terminal-border);"><strong>Description:</strong> ${escapeHtml(evidenceData.description)}</div>` : ''}
        ${photoSection}
    `;
    return card;
}

async function showEvidenceForm(evidenceId = null) {
    let evidenceData = null;
    if (evidenceId) {
        try {
            evidenceData = await apiCall(`/evidence/${evidenceId}`);
        } catch (error) {
            console.error('Error loading evidence:', error);
        }
    }
    
    const cases = allCases.length > 0 ? allCases : await apiCall('/cases') || [];
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');

    let caseOptions = '<option value="">No Case</option>';
    cases.forEach(c => {
        const selected = evidenceData && evidenceData.caseId === c.id ? 'selected' : '';
        caseOptions += `<option value="${c.id}" ${selected}>${escapeHtml(c.caseNumber || c.title)}</option>`;
    });

    modalBody.innerHTML = `
        <h3>${evidenceId ? 'Edit Evidence' : 'New Evidence'}</h3>
        <form id="evidenceForm">
            <div class="form-group">
                <label>Item Number *</label>
                <input type="text" id="evidenceItemNumber" value="${evidenceData ? escapeHtml(evidenceData.itemNumber || '') : ''}" required>
            </div>
            <div class="form-group">
                <label>Case</label>
                <select id="evidenceCaseId">
                    ${caseOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Type *</label>
                <select id="evidenceType" required>
                    <option value="">Select Type</option>
                    <option value="Physical" ${evidenceData && evidenceData.type === 'Physical' ? 'selected' : ''}>Physical</option>
                    <option value="Digital" ${evidenceData && evidenceData.type === 'Digital' ? 'selected' : ''}>Digital</option>
                    <option value="Biological" ${evidenceData && evidenceData.type === 'Biological' ? 'selected' : ''}>Biological</option>
                    <option value="Document" ${evidenceData && evidenceData.type === 'Document' ? 'selected' : ''}>Document</option>
                    <option value="Weapon" ${evidenceData && evidenceData.type === 'Weapon' ? 'selected' : ''}>Weapon</option>
                    <option value="Other" ${evidenceData && evidenceData.type === 'Other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="evidenceDescription" rows="4">${evidenceData ? escapeHtml(evidenceData.description || '') : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Collected By</label>
                <input type="text" id="evidenceOfficer" value="${evidenceData ? escapeHtml(evidenceData.officer || '') : ''}">
            </div>
            <div class="form-group">
                <label>Collection Date</label>
                <input type="datetime-local" id="evidenceCollectionDate" value="${evidenceData && evidenceData.collectionDate ? formatDateTimeLocal(evidenceData.collectionDate) : ''}">
            </div>
            <div class="form-group">
                <label>Location Found</label>
                <input type="text" id="evidenceLocation" value="${evidenceData ? escapeHtml(evidenceData.location || '') : ''}">
            </div>
            <div class="form-group">
                <label>Storage Location</label>
                <input type="text" id="evidenceStorage" value="${evidenceData ? escapeHtml(evidenceData.storage || '') : ''}">
            </div>
            <div class="form-group">
                <label>Chain of Custody Notes</label>
                <textarea id="evidenceCustody" rows="3">${evidenceData ? escapeHtml(evidenceData.custodyChain || '') : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Additional Notes</label>
                <textarea id="evidenceNotes" rows="3">${evidenceData ? escapeHtml(evidenceData.notes || '') : ''}</textarea>
            </div>
            ${evidenceId ? `
            <div class="form-group">
                <label>Evidence Photos</label>
                <div class="photo-upload-area">
                    <input type="file" id="evidencePhotos" accept="image/*" multiple capture="environment">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('evidencePhotos').click()" style="margin-top: 0.5rem;">Choose Files</button>
                    <button type="button" class="btn btn-secondary" onclick="takePhoto('evidencePhotos')" style="margin-top: 0.5rem;">Use Camera</button>
                </div>
                ${evidenceData && evidenceData.photos && evidenceData.photos.length > 0 ? `
                <div class="photo-preview-grid" id="evidencePhotoGrid">
                    ${evidenceData.photos.map((photo, idx) => `
                        <div class="photo-preview">
                            <img src="${photo}" alt="Evidence photo ${idx + 1}" onclick="showLightbox('${photo}')">
                            <button type="button" class="remove-photo" onclick="removeEvidencePhoto('${evidenceId}', '${photo.split('/').pop()}')">×</button>
                        </div>
                    `).join('')}
                </div>
                ` : '<div id="evidencePhotoGrid" class="photo-preview-grid"></div>'}
            </div>
            ` : ''}
            <div class="form-actions">
                <button type="button" class="btn" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">${evidenceId ? 'Update' : 'Create'} Evidence</button>
            </div>
        </form>
    `;

    modal.classList.remove('hidden');
    
    // Setup photo upload handler if editing
    if (evidenceId) {
        const photoInput = document.getElementById('evidencePhotos');
        if (photoInput) {
            photoInput.addEventListener('change', async (e) => {
                await uploadEvidencePhotos(evidenceId, e.target.files);
            });
        }
    }
    
    document.getElementById('evidenceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveEvidence(evidenceId);
    });
}

async function saveEvidence(evidenceId) {
    const evidenceData = {
        itemNumber: document.getElementById('evidenceItemNumber').value,
        caseId: document.getElementById('evidenceCaseId').value || null,
        type: document.getElementById('evidenceType').value,
        description: document.getElementById('evidenceDescription').value,
        officer: document.getElementById('evidenceOfficer').value,
        collectionDate: document.getElementById('evidenceCollectionDate').value,
        location: document.getElementById('evidenceLocation').value,
        storage: document.getElementById('evidenceStorage').value,
        custodyChain: document.getElementById('evidenceCustody').value,
        notes: document.getElementById('evidenceNotes').value
    };

    try {
        if (evidenceId) {
            await apiCall(`/evidence/${evidenceId}`, 'PUT', evidenceData);
        } else {
            await apiCall('/evidence', 'POST', evidenceData);
        }
        closeModal();
        await loadEvidence();
        await loadDashboard();
    } catch (error) {
        alert('Error saving evidence: ' + error.message);
    }
}

async function editEvidence(id) {
    await showEvidenceForm(id);
}

async function deleteEvidence(id) {
    if (confirm('Are you sure you want to delete this evidence item?')) {
        try {
            await apiCall(`/evidence/${id}`, 'DELETE');
            await loadEvidence();
            await loadDashboard();
        } catch (error) {
            alert('Error deleting evidence: ' + error.message);
        }
    }
}

function filterEvidence() {
    const search = document.getElementById('evidenceSearch').value.toLowerCase();
    const caseFilter = document.getElementById('evidenceCaseFilter').value;
    
    const filtered = allEvidence.filter(e => {
        const matchesSearch = !search || 
            (e.itemNumber && e.itemNumber.toLowerCase().includes(search)) ||
            (e.description && e.description.toLowerCase().includes(search)) ||
            (e.type && e.type.toLowerCase().includes(search));
        const matchesCase = caseFilter === 'all' || e.caseId === caseFilter;
        return matchesSearch && matchesCase;
    });

    displayEvidence(filtered);
}

// Suspect Management
async function loadSuspects() {
    try {
        allSuspects = await apiCall('/suspects') || [];
        displaySuspects(allSuspects);
    } catch (error) {
        console.error('Error loading suspects:', error);
    }
}

function displaySuspects(suspects) {
    const container = document.getElementById('suspectsList');
    container.innerHTML = '';

    if (suspects.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No persons of interest found.</p>';
        return;
    }

    suspects.forEach(s => {
        const card = createSuspectCard(s);
        container.appendChild(card);
    });
}

function createSuspectCard(suspectData) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
        <div class="item-card-header">
            <div>
                <h3 class="item-card-title">${escapeHtml(suspectData.name || 'Unknown')}</h3>
                <p style="font-size: 0.9rem; color: #7f8c8d;">${escapeHtml(suspectData.type || 'Person of Interest')}</p>
            </div>
            <div class="item-card-actions">
                <button class="btn btn-primary" onclick="editSuspect('${suspectData.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteSuspect('${suspectData.id}')">Delete</button>
            </div>
        </div>
        <div class="item-card-body">
            <div class="item-card-field">
                <span class="item-card-label">Type</span>
                <span class="item-card-value">${escapeHtml(suspectData.type || 'N/A')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Date of Birth</span>
                <span class="item-card-value">${suspectData.dob ? formatDate(suspectData.dob) : 'N/A'}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Phone</span>
                <span class="item-card-value">${escapeHtml(suspectData.phone || 'N/A')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Email</span>
                <span class="item-card-value">${escapeHtml(suspectData.email || 'N/A')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Address</span>
                <span class="item-card-value">${escapeHtml(suspectData.address || 'N/A')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Status</span>
                <span class="item-card-value">${escapeHtml(suspectData.status || 'N/A')}</span>
            </div>
        </div>
        ${suspectData.description ? `<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;"><strong>Description:</strong> ${escapeHtml(suspectData.description)}</div>` : ''}
    `;
    return card;
}

async function showSuspectForm(suspectId = null) {
    let suspectData = null;
    if (suspectId) {
        try {
            suspectData = await apiCall(`/suspects/${suspectId}`);
        } catch (error) {
            console.error('Error loading suspect:', error);
        }
    }
    
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <h3>${suspectId ? 'Edit Person of Interest' : 'New Person of Interest'}</h3>
        <form id="suspectForm">
            <div class="form-group">
                <label>Full Name *</label>
                <input type="text" id="suspectName" value="${suspectData ? escapeHtml(suspectData.name || '') : ''}" required>
            </div>
            <div class="form-group">
                <label>Type</label>
                <select id="suspectType">
                    <option value="Suspect" ${suspectData && suspectData.type === 'Suspect' ? 'selected' : ''}>Suspect</option>
                    <option value="Person of Interest" ${suspectData && suspectData.type === 'Person of Interest' ? 'selected' : ''}>Person of Interest</option>
                    <option value="Witness" ${suspectData && suspectData.type === 'Witness' ? 'selected' : ''}>Witness</option>
                    <option value="Victim" ${suspectData && suspectData.type === 'Victim' ? 'selected' : ''}>Victim</option>
                </select>
            </div>
            <div class="form-group">
                <label>Aliases (comma-separated)</label>
                <input type="text" id="suspectAliases" value="${suspectData ? escapeHtml(suspectData.aliases || '') : ''}">
            </div>
            <div class="form-group">
                <label>Date of Birth</label>
                <input type="date" id="suspectDob" value="${suspectData && suspectData.dob ? suspectData.dob.split('T')[0] : ''}">
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input type="text" id="suspectPhone" value="${suspectData ? escapeHtml(suspectData.phone || '') : ''}">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="suspectEmail" value="${suspectData ? escapeHtml(suspectData.email || '') : ''}">
            </div>
            <div class="form-group">
                <label>Address</label>
                <textarea id="suspectAddress" rows="2">${suspectData ? escapeHtml(suspectData.address || '') : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="suspectStatus">
                    <option value="Active" ${suspectData && suspectData.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="In Custody" ${suspectData && suspectData.status === 'In Custody' ? 'selected' : ''}>In Custody</option>
                    <option value="Released" ${suspectData && suspectData.status === 'Released' ? 'selected' : ''}>Released</option>
                    <option value="Cleared" ${suspectData && suspectData.status === 'Cleared' ? 'selected' : ''}>Cleared</option>
                </select>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="suspectDescription" rows="4">${suspectData ? escapeHtml(suspectData.description || '') : ''}</textarea>
            </div>
            <div class="osint-panel" style="margin-top: 1rem;">
                <h4>OSINT Information</h4>
                <div class="osint-grid">
                    <div class="form-group">
                        <label>Social Media Handles (comma-separated)</label>
                        <input type="text" id="suspectSocialMedia" value="${suspectData ? escapeHtml(suspectData.socialMedia || '') : ''}" placeholder="@username1, @username2">
                    </div>
                    <div class="form-group">
                        <label>IP Addresses (comma-separated)</label>
                        <input type="text" id="suspectIPAddresses" value="${suspectData ? escapeHtml(suspectData.ipAddresses || '') : ''}" placeholder="192.168.1.1, 10.0.0.1">
                    </div>
                    <div class="form-group">
                        <label>Vehicle License Plates</label>
                        <input type="text" id="suspectVehicles" value="${suspectData ? escapeHtml(suspectData.vehicles || '') : ''}" placeholder="ABC-1234, XYZ-5678">
                    </div>
                </div>
            </div>
            <div class="osint-panel" style="margin-top: 1rem;">
                <h4>Tracking Information</h4>
                <div class="form-group">
                    <label>Last Seen Location</label>
                    <input type="text" id="suspectLastSeenLocation" value="${suspectData ? escapeHtml(suspectData.lastSeenLocation || '') : ''}">
                </div>
                <div class="form-group">
                    <label>Last Seen Date/Time</label>
                    <input type="datetime-local" id="suspectLastSeenDate" value="${suspectData && suspectData.lastSeenDate ? formatDateTimeLocal(suspectData.lastSeenDate) : ''}">
                </div>
                <div class="form-group">
                    <label>Known Associates (comma-separated)</label>
                    <input type="text" id="suspectAssociates" value="${suspectData ? escapeHtml(suspectData.associates || '') : ''}" placeholder="Name1, Name2">
                </div>
                <div class="form-group">
                    <label>Movement History / Pattern</label>
                    <textarea id="suspectMovementHistory" rows="3">${suspectData ? escapeHtml(suspectData.movementHistory || '') : ''}</textarea>
                </div>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="suspectNotes" rows="3">${suspectData ? escapeHtml(suspectData.notes || '') : ''}</textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">${suspectId ? 'Update' : 'Create'} Person</button>
            </div>
        </form>
    `;

    modal.classList.remove('hidden');
    document.getElementById('suspectForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveSuspect(suspectId);
    });
}

async function saveSuspect(suspectId) {
    const suspectData = {
        name: document.getElementById('suspectName').value,
        type: document.getElementById('suspectType').value,
        aliases: document.getElementById('suspectAliases').value,
        dob: document.getElementById('suspectDob').value,
        phone: document.getElementById('suspectPhone').value,
        email: document.getElementById('suspectEmail').value,
        address: document.getElementById('suspectAddress').value,
        status: document.getElementById('suspectStatus').value,
        description: document.getElementById('suspectDescription').value,
        socialMedia: document.getElementById('suspectSocialMedia').value,
        ipAddresses: document.getElementById('suspectIPAddresses').value,
        vehicles: document.getElementById('suspectVehicles').value,
        lastSeenLocation: document.getElementById('suspectLastSeenLocation').value,
        lastSeenDate: document.getElementById('suspectLastSeenDate').value,
        associates: document.getElementById('suspectAssociates').value,
        movementHistory: document.getElementById('suspectMovementHistory').value,
        notes: document.getElementById('suspectNotes').value
    };

    try {
        if (suspectId) {
            await apiCall(`/suspects/${suspectId}`, 'PUT', suspectData);
        } else {
            await apiCall('/suspects', 'POST', suspectData);
        }
        closeModal();
        await loadSuspects();
        await loadDashboard();
    } catch (error) {
        alert('Error saving suspect: ' + error.message);
    }
}

async function editSuspect(id) {
    await showSuspectForm(id);
}

async function deleteSuspect(id) {
    if (confirm('Are you sure you want to delete this person?')) {
        try {
            await apiCall(`/suspects/${id}`, 'DELETE');
            await loadSuspects();
            await loadDashboard();
        } catch (error) {
            alert('Error deleting suspect: ' + error.message);
        }
    }
}

function filterSuspects() {
    const search = document.getElementById('suspectSearch').value.toLowerCase();
    
    const filtered = allSuspects.filter(s => {
        return !search || 
            (s.name && s.name.toLowerCase().includes(search)) ||
            (s.aliases && s.aliases.toLowerCase().includes(search)) ||
            (s.phone && s.phone.includes(search)) ||
            (s.email && s.email.toLowerCase().includes(search));
    });

    displaySuspects(filtered);
}

// Witness Management
async function loadWitnesses() {
    try {
        allWitnesses = await apiCall('/witnesses') || [];
        displayWitnesses(allWitnesses);
    } catch (error) {
        console.error('Error loading witnesses:', error);
    }
}

function displayWitnesses(witnesses) {
    const container = document.getElementById('witnessesList');
    container.innerHTML = '';

    if (witnesses.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No witnesses found.</p>';
        return;
    }

    witnesses.forEach(w => {
        const card = createWitnessCard(w);
        container.appendChild(card);
    });
}

function createWitnessCard(witnessData) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
        <div class="item-card-header">
            <div>
                <h3 class="item-card-title">${escapeHtml(witnessData.name || 'Unknown')}</h3>
            </div>
            <div class="item-card-actions">
                <button class="btn btn-primary" onclick="editWitness('${witnessData.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteWitness('${witnessData.id}')">Delete</button>
            </div>
        </div>
        <div class="item-card-body">
            <div class="item-card-field">
                <span class="item-card-label">Phone</span>
                <span class="item-card-value">${escapeHtml(witnessData.phone || 'N/A')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Email</span>
                <span class="item-card-value">${escapeHtml(witnessData.email || 'N/A')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Address</span>
                <span class="item-card-value">${escapeHtml(witnessData.address || 'N/A')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Statement Date</span>
                <span class="item-card-value">${witnessData.statementDate ? formatDate(witnessData.statementDate) : 'N/A'}</span>
            </div>
        </div>
        ${witnessData.statement ? `<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;"><strong>Statement:</strong> ${escapeHtml(witnessData.statement)}</div>` : ''}
    `;
    return card;
}

async function showWitnessForm(witnessId = null) {
    let witnessData = null;
    if (witnessId) {
        try {
            witnessData = await apiCall(`/witnesses/${witnessId}`);
        } catch (error) {
            console.error('Error loading witness:', error);
        }
    }
    
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <h3>${witnessId ? 'Edit Witness' : 'New Witness'}</h3>
        <form id="witnessForm">
            <div class="form-group">
                <label>Full Name *</label>
                <input type="text" id="witnessName" value="${witnessData ? escapeHtml(witnessData.name || '') : ''}" required>
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input type="text" id="witnessPhone" value="${witnessData ? escapeHtml(witnessData.phone || '') : ''}">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="witnessEmail" value="${witnessData ? escapeHtml(witnessData.email || '') : ''}">
            </div>
            <div class="form-group">
                <label>Address</label>
                <textarea id="witnessAddress" rows="2">${witnessData ? escapeHtml(witnessData.address || '') : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Statement Date</label>
                <input type="datetime-local" id="witnessStatementDate" value="${witnessData && witnessData.statementDate ? formatDateTimeLocal(witnessData.statementDate) : ''}">
            </div>
            <div class="form-group">
                <label>Statement</label>
                <textarea id="witnessStatement" rows="5">${witnessData ? escapeHtml(witnessData.statement || '') : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="witnessNotes" rows="3">${witnessData ? escapeHtml(witnessData.notes || '') : ''}</textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">${witnessId ? 'Update' : 'Create'} Witness</button>
            </div>
        </form>
    `;

    modal.classList.remove('hidden');
    document.getElementById('witnessForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveWitness(witnessId);
    });
}

async function saveWitness(witnessId) {
    const witnessData = {
        name: document.getElementById('witnessName').value,
        phone: document.getElementById('witnessPhone').value,
        email: document.getElementById('witnessEmail').value,
        address: document.getElementById('witnessAddress').value,
        statementDate: document.getElementById('witnessStatementDate').value,
        statement: document.getElementById('witnessStatement').value,
        notes: document.getElementById('witnessNotes').value
    };

    try {
        if (witnessId) {
            await apiCall(`/witnesses/${witnessId}`, 'PUT', witnessData);
        } else {
            await apiCall('/witnesses', 'POST', witnessData);
        }
        closeModal();
        await loadWitnesses();
        await loadDashboard();
    } catch (error) {
        alert('Error saving witness: ' + error.message);
    }
}

async function editWitness(id) {
    await showWitnessForm(id);
}

async function deleteWitness(id) {
    if (confirm('Are you sure you want to delete this witness?')) {
        try {
            await apiCall(`/witnesses/${id}`, 'DELETE');
            await loadWitnesses();
            await loadDashboard();
        } catch (error) {
            alert('Error deleting witness: ' + error.message);
        }
    }
}

function filterWitnesses() {
    const search = document.getElementById('witnessSearch').value.toLowerCase();
    
    const filtered = allWitnesses.filter(w => {
        return !search || 
            (w.name && w.name.toLowerCase().includes(search)) ||
            (w.phone && w.phone.includes(search)) ||
            (w.email && w.email.toLowerCase().includes(search)) ||
            (w.statement && w.statement.toLowerCase().includes(search));
    });

    displayWitnesses(filtered);
}

// Timeline Management
async function loadTimeline() {
    try {
        allTimeline = await apiCall('/timeline') || [];
        displayTimeline(allTimeline);
    } catch (error) {
        console.error('Error loading timeline:', error);
    }
}

function displayTimeline(timeline) {
    const container = document.getElementById('timelineList');
    container.innerHTML = '';

    if (timeline.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No timeline events found.</p>';
        return;
    }

    timeline.forEach(t => {
        const item = createTimelineItem(t);
        container.appendChild(item);
    });
}

function createTimelineItem(timelineData) {
    const caseData = allCases.find(c => c.id === timelineData.caseId);
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = `
        <div class="timeline-date">${formatDate(timelineData.dateTime)}</div>
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
            <h4 style="margin: 0;">${escapeHtml(timelineData.description || 'Event')}</h4>
            <div>
                <button class="btn btn-primary" onclick="editTimelineEvent('${timelineData.id}')" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;">Edit</button>
                <button class="btn btn-danger" onclick="deleteTimelineEvent('${timelineData.id}')" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;">Delete</button>
            </div>
        </div>
        <div style="color: #7f8c8d; font-size: 0.9rem; margin-bottom: 0.5rem;">
            Case: ${caseData ? escapeHtml(caseData.caseNumber || caseData.title) : 'No Case'} | 
            Location: ${escapeHtml(timelineData.location || 'N/A')} | 
            Officer: ${escapeHtml(timelineData.officer || 'N/A')}
        </div>
        ${timelineData.notes ? `<div style="margin-top: 0.5rem;">${escapeHtml(timelineData.notes)}</div>` : ''}
    `;
    return item;
}

async function showTimelineForm(eventId = null) {
    let eventData = null;
    if (eventId) {
        const timeline = await apiCall('/timeline') || [];
        eventData = timeline.find(t => t.id === eventId);
    }
    
    const cases = allCases.length > 0 ? allCases : await apiCall('/cases') || [];
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');

    let caseOptions = '<option value="">No Case</option>';
    cases.forEach(c => {
        const selected = eventData && eventData.caseId === c.id ? 'selected' : '';
        caseOptions += `<option value="${c.id}" ${selected}>${escapeHtml(c.caseNumber || c.title)}</option>`;
    });

    modalBody.innerHTML = `
        <h3>${eventId ? 'Edit Timeline Event' : 'New Timeline Event'}</h3>
        <form id="timelineForm">
            <div class="form-group">
                <label>Case</label>
                <select id="timelineCaseId">
                    ${caseOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Date & Time *</label>
                <input type="datetime-local" id="timelineDateTime" value="${eventData && eventData.dateTime ? formatDateTimeLocal(eventData.dateTime) : ''}" required>
            </div>
            <div class="form-group">
                <label>Description *</label>
                <input type="text" id="timelineDescription" value="${eventData ? escapeHtml(eventData.description || '') : ''}" required>
            </div>
            <div class="form-group">
                <label>Location</label>
                <input type="text" id="timelineLocation" value="${eventData ? escapeHtml(eventData.location || '') : ''}">
            </div>
            <div class="form-group">
                <label>Officer</label>
                <input type="text" id="timelineOfficer" value="${eventData ? escapeHtml(eventData.officer || '') : ''}">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="timelineNotes" rows="4">${eventData ? escapeHtml(eventData.notes || '') : ''}</textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">${eventId ? 'Update' : 'Create'} Event</button>
            </div>
        </form>
    `;

    modal.classList.remove('hidden');
    document.getElementById('timelineForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveTimelineEvent(eventId);
    });
}

async function saveTimelineEvent(eventId) {
    const eventData = {
        caseId: document.getElementById('timelineCaseId').value || null,
        dateTime: document.getElementById('timelineDateTime').value,
        description: document.getElementById('timelineDescription').value,
        location: document.getElementById('timelineLocation').value,
        officer: document.getElementById('timelineOfficer').value,
        notes: document.getElementById('timelineNotes').value
    };

    try {
        if (eventId) {
            await apiCall(`/timeline/${eventId}`, 'PUT', eventData);
        } else {
            await apiCall('/timeline', 'POST', eventData);
        }
        closeModal();
        await loadTimeline();
    } catch (error) {
        alert('Error saving timeline event: ' + error.message);
    }
}

async function editTimelineEvent(id) {
    await showTimelineForm(id);
}

async function deleteTimelineEvent(id) {
    if (confirm('Are you sure you want to delete this timeline event?')) {
        try {
            await apiCall(`/timeline/${id}`, 'DELETE');
            await loadTimeline();
        } catch (error) {
            alert('Error deleting timeline event: ' + error.message);
        }
    }
}

function filterTimeline() {
    const caseFilter = document.getElementById('timelineCaseFilter').value;
    const filtered = caseFilter === 'all' ? allTimeline : allTimeline.filter(t => t.caseId === caseFilter);
    displayTimeline(filtered);
}

// Document Management
async function loadDocuments() {
    try {
        allDocuments = await apiCall('/documents') || [];
        displayDocuments(allDocuments);
    } catch (error) {
        console.error('Error loading documents:', error);
    }
}

function displayDocuments(documents) {
    const container = document.getElementById('documentsList');
    container.innerHTML = '';

    if (documents.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No documents found.</p>';
        return;
    }

    documents.forEach(d => {
        const card = createDocumentCard(d);
        container.appendChild(card);
    });
}

function createDocumentCard(documentData) {
    const caseData = allCases.find(c => c.id === documentData.caseId);
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
        <div class="item-card-header">
            <div>
                <h3 class="item-card-title">${escapeHtml(documentData.title || 'Untitled Document')}</h3>
                <p style="font-size: 0.9rem; color: #7f8c8d;">${escapeHtml(documentData.type || 'Document')}</p>
            </div>
            <div class="item-card-actions">
                <button class="btn btn-primary" onclick="editDocument('${documentData.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteDocument('${documentData.id}')">Delete</button>
            </div>
        </div>
        <div class="item-card-body">
            <div class="item-card-field">
                <span class="item-card-label">Case</span>
                <span class="item-card-value">${caseData ? escapeHtml(caseData.caseNumber || caseData.title) : 'No Case'}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Type</span>
                <span class="item-card-value">${escapeHtml(documentData.type || 'N/A')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Author</span>
                <span class="item-card-value">${escapeHtml(documentData.author || 'N/A')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Created</span>
                <span class="item-card-value">${formatDate(documentData.createdAt)}</span>
            </div>
        </div>
        ${documentData.content ? `<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee; white-space: pre-wrap;">${escapeHtml(documentData.content)}</div>` : ''}
    `;
    return card;
}

async function showDocumentForm(documentId = null) {
    let documentData = null;
    if (documentId) {
        const documents = await apiCall('/documents') || [];
        documentData = documents.find(d => d.id === documentId);
    }
    
    const cases = allCases.length > 0 ? allCases : await apiCall('/cases') || [];
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');

    let caseOptions = '<option value="">No Case</option>';
    cases.forEach(c => {
        const selected = documentData && documentData.caseId === c.id ? 'selected' : '';
        caseOptions += `<option value="${c.id}" ${selected}>${escapeHtml(c.caseNumber || c.title)}</option>`;
    });

    modalBody.innerHTML = `
        <h3>${documentId ? 'Edit Document' : 'New Document'}</h3>
        <form id="documentForm">
            <div class="form-group">
                <label>Title *</label>
                <input type="text" id="documentTitle" value="${documentData ? escapeHtml(documentData.title || '') : ''}" required>
            </div>
            <div class="form-group">
                <label>Case</label>
                <select id="documentCaseId">
                    ${caseOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Type</label>
                <select id="documentType">
                    <option value="Report" ${documentData && documentData.type === 'Report' ? 'selected' : ''}>Report</option>
                    <option value="Note" ${documentData && documentData.type === 'Note' ? 'selected' : ''}>Note</option>
                    <option value="Interview" ${documentData && documentData.type === 'Interview' ? 'selected' : ''}>Interview</option>
                    <option value="Statement" ${documentData && documentData.type === 'Statement' ? 'selected' : ''}>Statement</option>
                    <option value="Analysis" ${documentData && documentData.type === 'Analysis' ? 'selected' : ''}>Analysis</option>
                    <option value="Other" ${documentData && documentData.type === 'Other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            <div class="form-group">
                <label>Author</label>
                <input type="text" id="documentAuthor" value="${documentData ? escapeHtml(documentData.author || '') : ''}">
            </div>
            <div class="form-group">
                <label>Content</label>
                <textarea id="documentContent" rows="10" style="font-family: monospace;">${documentData ? escapeHtml(documentData.content || '') : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="documentNotes" rows="3">${documentData ? escapeHtml(documentData.notes || '') : ''}</textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">${documentId ? 'Update' : 'Create'} Document</button>
            </div>
        </form>
    `;

    modal.classList.remove('hidden');
    document.getElementById('documentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveDocument(documentId);
    });
}

async function saveDocument(documentId) {
    const documentData = {
        title: document.getElementById('documentTitle').value,
        caseId: document.getElementById('documentCaseId').value || null,
        type: document.getElementById('documentType').value,
        author: document.getElementById('documentAuthor').value,
        content: document.getElementById('documentContent').value,
        notes: document.getElementById('documentNotes').value
    };

    try {
        if (documentId) {
            await apiCall(`/documents/${documentId}`, 'PUT', documentData);
        } else {
            await apiCall('/documents', 'POST', documentData);
        }
        closeModal();
        await loadDocuments();
    } catch (error) {
        alert('Error saving document: ' + error.message);
    }
}

async function editDocument(id) {
    await showDocumentForm(id);
}

async function deleteDocument(id) {
    if (confirm('Are you sure you want to delete this document?')) {
        try {
            await apiCall(`/documents/${id}`, 'DELETE');
            await loadDocuments();
        } catch (error) {
            alert('Error deleting document: ' + error.message);
        }
    }
}

function filterDocuments() {
    const search = document.getElementById('documentSearch').value.toLowerCase();
    const caseFilter = document.getElementById('documentCaseFilter').value;
    
    const filtered = allDocuments.filter(d => {
        const matchesSearch = !search || 
            (d.title && d.title.toLowerCase().includes(search)) ||
            (d.content && d.content.toLowerCase().includes(search)) ||
            (d.type && d.type.toLowerCase().includes(search));
        const matchesCase = caseFilter === 'all' || d.caseId === caseFilter;
        return matchesSearch && matchesCase;
    });

    displayDocuments(filtered);
}

// Global Search
async function executeGlobalSearch() {
    const query = document.getElementById('globalSearchInput').value;
    if (!query.trim()) {
        alert('Please enter a search query');
        return;
    }

    try {
        const results = await apiCall('/search', 'POST', { query });
        const container = document.getElementById('searchResults');
        container.innerHTML = '';

        let hasResults = false;
        
        if (results.cases && results.cases.length > 0) {
            hasResults = true;
            const section = document.createElement('div');
            section.className = 'search-result-section';
            section.innerHTML = `<h3>Cases (${results.cases.length})</h3>`;
            results.cases.forEach(c => {
                section.appendChild(createCaseCard(c));
            });
            container.appendChild(section);
        }

        if (results.evidence && results.evidence.length > 0) {
            hasResults = true;
            const section = document.createElement('div');
            section.className = 'search-result-section';
            section.innerHTML = `<h3>Evidence (${results.evidence.length})</h3>`;
            results.evidence.forEach(e => {
                section.appendChild(createEvidenceCard(e));
            });
            container.appendChild(section);
        }

        if (results.suspects && results.suspects.length > 0) {
            hasResults = true;
            const section = document.createElement('div');
            section.className = 'search-result-section';
            section.innerHTML = `<h3>Persons of Interest (${results.suspects.length})</h3>`;
            results.suspects.forEach(s => {
                section.appendChild(createSuspectCard(s));
            });
            container.appendChild(section);
        }

        if (results.witnesses && results.witnesses.length > 0) {
            hasResults = true;
            const section = document.createElement('div');
            section.className = 'search-result-section';
            section.innerHTML = `<h3>Witnesses (${results.witnesses.length})</h3>`;
            results.witnesses.forEach(w => {
                section.appendChild(createWitnessCard(w));
            });
            container.appendChild(section);
        }

        if (results.timeline && results.timeline.length > 0) {
            hasResults = true;
            const section = document.createElement('div');
            section.className = 'search-result-section';
            section.innerHTML = `<h3>Timeline Events (${results.timeline.length})</h3>`;
            results.timeline.forEach(t => {
                section.appendChild(createTimelineItem(t));
            });
            container.appendChild(section);
        }

        if (results.documents && results.documents.length > 0) {
            hasResults = true;
            const section = document.createElement('div');
            section.className = 'search-result-section';
            section.innerHTML = `<h3>Documents (${results.documents.length})</h3>`;
            results.documents.forEach(d => {
                section.appendChild(createDocumentCard(d));
            });
            container.appendChild(section);
        }

        if (!hasResults) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No results found.</p>';
        }
    } catch (error) {
        alert('Error searching: ' + error.message);
    }
}

// Utility Functions
function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function formatDateTimeLocal(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions global for onclick handlers
window.editCase = editCase;
window.deleteCase = deleteCase;
window.editEvidence = editEvidence;
window.deleteEvidence = deleteEvidence;
window.editSuspect = editSuspect;
window.deleteSuspect = deleteSuspect;
window.editWitness = editWitness;
window.deleteWitness = deleteWitness;
window.editTimelineEvent = editTimelineEvent;
window.deleteTimelineEvent = deleteTimelineEvent;
window.editDocument = editDocument;
window.deleteDocument = deleteDocument;

// Vehicle Management
let allVehicles = [];

async function loadVehicles() {
    try {
        allVehicles = await apiCall('/vehicles') || [];
        displayVehicles(allVehicles);
    } catch (error) {
        console.error('Error loading vehicles:', error);
    }
}

function displayVehicles(vehicles) {
    const container = document.getElementById('vehiclesList');
    container.innerHTML = '';

    if (vehicles.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No vehicles found.</p>';
        return;
    }

    vehicles.forEach(v => {
        const card = createVehicleCard(v);
        container.appendChild(card);
    });
}

function createVehicleCard(vehicleData) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
        <div class="item-card-header">
            <div>
                <h3 class="item-card-title">${escapeHtml(vehicleData.plate || 'NO PLATE')}</h3>
                <p style="font-size: 0.9rem; color: #7f8c8d;">${escapeHtml(vehicleData.make || '')} ${escapeHtml(vehicleData.model || '')} ${escapeHtml(vehicleData.year || '')}</p>
            </div>
            <div class="item-card-actions">
                <span class="status-badge status-${vehicleData.status || 'registered'}">${escapeHtml((vehicleData.status || 'registered').toUpperCase())}</span>
                <button class="btn btn-primary" onclick="editVehicle('${vehicleData.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteVehicle('${vehicleData.id}')">Delete</button>
            </div>
        </div>
        <div class="item-card-body">
            <div class="item-card-field">
                <span class="item-card-label">VIN</span>
                <span class="item-card-value">${escapeHtml(vehicleData.vin || 'N/A')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Owner</span>
                <span class="item-card-value">${escapeHtml(vehicleData.owner || 'N/A')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Color</span>
                <span class="item-card-value">${escapeHtml(vehicleData.color || 'N/A')}</span>
            </div>
            <div class="item-card-field">
                <span class="item-card-label">Status</span>
                <span class="item-card-value">${escapeHtml(vehicleData.status || 'N/A')}</span>
            </div>
        </div>
    `;
    return card;
}

async function showVehicleForm(vehicleId = null) {
    let vehicleData = null;
    if (vehicleId) {
        try {
            vehicleData = await apiCall(`/vehicles/${vehicleId}`);
        } catch (error) {
            console.error('Error loading vehicle:', error);
        }
    }
    
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <h3>${vehicleId ? 'Edit Vehicle' : 'New Vehicle'}</h3>
        <form id="vehicleForm">
            <div class="form-group">
                <label>License Plate *</label>
                <input type="text" id="vehiclePlate" value="${vehicleData ? escapeHtml(vehicleData.plate || '') : ''}" required>
            </div>
            <div class="form-group">
                <label>VIN</label>
                <input type="text" id="vehicleVIN" value="${vehicleData ? escapeHtml(vehicleData.vin || '') : ''}">
            </div>
            <div class="form-group">
                <label>Make</label>
                <input type="text" id="vehicleMake" value="${vehicleData ? escapeHtml(vehicleData.make || '') : ''}">
            </div>
            <div class="form-group">
                <label>Model</label>
                <input type="text" id="vehicleModel" value="${vehicleData ? escapeHtml(vehicleData.model || '') : ''}">
            </div>
            <div class="form-group">
                <label>Year</label>
                <input type="number" id="vehicleYear" value="${vehicleData ? escapeHtml(vehicleData.year || '') : ''}">
            </div>
            <div class="form-group">
                <label>Color</label>
                <input type="text" id="vehicleColor" value="${vehicleData ? escapeHtml(vehicleData.color || '') : ''}">
            </div>
            <div class="form-group">
                <label>Owner</label>
                <input type="text" id="vehicleOwner" value="${vehicleData ? escapeHtml(vehicleData.owner || '') : ''}">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="vehicleStatus">
                    <option value="registered" ${vehicleData && vehicleData.status === 'registered' ? 'selected' : ''}>Registered</option>
                    <option value="stolen" ${vehicleData && vehicleData.status === 'stolen' ? 'selected' : ''}>Stolen</option>
                    <option value="abandoned" ${vehicleData && vehicleData.status === 'abandoned' ? 'selected' : ''}>Abandoned</option>
                    <option value="impounded" ${vehicleData && vehicleData.status === 'impounded' ? 'selected' : ''}>Impounded</option>
                </select>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="vehicleNotes" rows="3">${vehicleData ? escapeHtml(vehicleData.notes || '') : ''}</textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">${vehicleId ? 'Update' : 'Create'} Vehicle</button>
            </div>
        </form>
    `;

    modal.classList.remove('hidden');
    document.getElementById('vehicleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveVehicle(vehicleId);
    });
}

async function saveVehicle(vehicleId) {
    const vehicleData = {
        plate: document.getElementById('vehiclePlate').value,
        vin: document.getElementById('vehicleVIN').value,
        make: document.getElementById('vehicleMake').value,
        model: document.getElementById('vehicleModel').value,
        year: document.getElementById('vehicleYear').value,
        color: document.getElementById('vehicleColor').value,
        owner: document.getElementById('vehicleOwner').value,
        status: document.getElementById('vehicleStatus').value,
        notes: document.getElementById('vehicleNotes').value
    };

    try {
        if (vehicleId) {
            await apiCall(`/vehicles/${vehicleId}`, 'PUT', vehicleData);
        } else {
            await apiCall('/vehicles', 'POST', vehicleData);
        }
        closeModal();
        await loadVehicles();
    } catch (error) {
        alert('Error saving vehicle: ' + error.message);
    }
}

async function editVehicle(id) {
    await showVehicleForm(id);
}

async function deleteVehicle(id) {
    if (confirm('Are you sure you want to delete this vehicle?')) {
        try {
            await apiCall(`/vehicles/${id}`, 'DELETE');
            await loadVehicles();
        } catch (error) {
            alert('Error deleting vehicle: ' + error.message);
        }
    }
}

function filterVehicles() {
    const search = document.getElementById('vehicleSearch').value.toLowerCase();
    const statusFilter = document.getElementById('vehicleStatusFilter').value;
    
    const filtered = allVehicles.filter(v => {
        const matchesSearch = !search || 
            (v.plate && v.plate.toLowerCase().includes(search)) ||
            (v.vin && v.vin.toLowerCase().includes(search)) ||
            (v.make && v.make.toLowerCase().includes(search)) ||
            (v.model && v.model.toLowerCase().includes(search));
        const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    displayVehicles(filtered);
}

// OSINT Tools
async function performOSINTLookup(type) {
    const resultsDiv = document.getElementById('osintResults');
    const resultsContent = document.getElementById('osintResultsContent');
    
    let query = '';
    let searchType = '';
    
    switch(type) {
        case 'username':
            query = document.getElementById('osintUsername').value;
            searchType = 'Username';
            break;
        case 'phone':
            query = document.getElementById('osintPhone').value;
            searchType = 'Phone Number';
            break;
        case 'email':
            query = document.getElementById('osintEmail').value;
            searchType = 'Email Address';
            break;
        case 'ip':
            query = document.getElementById('osintIP').value;
            searchType = 'IP Address';
            break;
        case 'plate':
            query = document.getElementById('osintPlate').value;
            searchType = 'License Plate';
            break;
    }
    
    if (!query.trim()) {
        alert('Please enter a search query');
        return;
    }
    
    resultsDiv.style.display = 'block';
    resultsContent.innerHTML = '<p class="terminal-text">Searching...</p>';
    
    try {
        // Search database for matches
        const results = await apiCall('/search', 'POST', { query });
        
        let html = `<h4>Database Search Results for ${searchType}: ${escapeHtml(query)}</h4>`;
        
        if (results.cases && results.cases.length > 0) {
            html += `<p><strong>Found in Cases:</strong> ${results.cases.length}</p>`;
            results.cases.forEach(c => {
                html += `<p>• Case ${escapeHtml(c.caseNumber || c.title)}</p>`;
            });
        }
        
        if (results.suspects && results.suspects.length > 0) {
            html += `<p><strong>Found in Suspects:</strong> ${results.suspects.length}</p>`;
            results.suspects.forEach(s => {
                html += `<p>• ${escapeHtml(s.name)} - ${escapeHtml(s.phone || '')} ${escapeHtml(s.email || '')}</p>`;
            });
        }
        
        if (results.witnesses && results.witnesses.length > 0) {
            html += `<p><strong>Found in Witnesses:</strong> ${results.witnesses.length}</p>`;
            results.witnesses.forEach(w => {
                html += `<p>• ${escapeHtml(w.name)} - ${escapeHtml(w.phone || '')} ${escapeHtml(w.email || '')}</p>`;
            });
        }
        
        if (results.vehicles && results.vehicles.length > 0) {
            html += `<p><strong>Found in Vehicles:</strong> ${results.vehicles.length}</p>`;
            results.vehicles.forEach(v => {
                html += `<p>• ${escapeHtml(v.plate)} - ${escapeHtml(v.make)} ${escapeHtml(v.model)}</p>`;
            });
        }
        
        if (!results.cases?.length && !results.suspects?.length && !results.witnesses?.length && !results.vehicles?.length) {
            html += `<p class="terminal-text">No matches found in database.</p>`;
            html += `<p style="margin-top: 1rem; color: #ffaa00;">Note: For external OSINT lookups, use specialized tools and follow legal guidelines.</p>`;
        }
        
        resultsContent.innerHTML = html;
    } catch (error) {
        resultsContent.innerHTML = `<p style="color: #ff0040;">Error: ${escapeHtml(error.message)}</p>`;
    }
}

// Photo Upload Functions
async function uploadEvidencePhotos(evidenceId, files) {
    if (!files || files.length === 0) return;
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('photos', files[i]);
    }
    
    try {
        const response = await fetch(`/api/evidence/${evidenceId}/upload`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            displayEvidencePhotos(evidenceId, result.photos);
            // Reload evidence to refresh
            await loadEvidence();
        } else {
            alert('Error uploading photos');
        }
    } catch (error) {
        alert('Error uploading photos: ' + error.message);
    }
}

function displayEvidencePhotos(evidenceId, photos) {
    const grid = document.getElementById('evidencePhotoGrid');
    if (!grid) return;
    
    grid.innerHTML = photos.map((photo, idx) => `
        <div class="photo-preview">
            <img src="${photo}" alt="Evidence photo ${idx + 1}" onclick="showLightbox('${photo}')">
            <button type="button" class="remove-photo" onclick="removeEvidencePhoto('${evidenceId}', '${photo.split('/').pop()}')">×</button>
        </div>
    `).join('');
}

async function removeEvidencePhoto(evidenceId, filename) {
    if (!confirm('Delete this photo?')) return;
    
    try {
        await apiCall(`/evidence/${evidenceId}/photo/${filename}`, 'DELETE');
        await loadEvidence();
        // Refresh modal if open
        const evidence = await apiCall(`/evidence/${evidenceId}`);
        if (evidence && evidence.photos) {
            displayEvidencePhotos(evidenceId, evidence.photos);
        }
    } catch (error) {
        alert('Error removing photo: ' + error.message);
    }
}

function takePhoto(inputId) {
    const input = document.getElementById(inputId);
    if (input && input.files) {
        // Create a file input with camera capture
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.capture = 'environment';
        fileInput.onchange = (e) => {
            input.files = e.target.files;
            if (input.onchange) input.onchange(e);
        };
        fileInput.click();
    }
}

function showLightbox(imageSrc) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    lightboxImage.src = imageSrc;
    lightbox.classList.remove('hidden');
    
    const closeBtn = document.querySelector('.lightbox-close');
    closeBtn.onclick = () => {
        lightbox.classList.add('hidden');
    };
    lightbox.onclick = (e) => {
        if (e.target.id === 'lightbox') {
            lightbox.classList.add('hidden');
        }
    };
}

window.editVehicle = editVehicle;
window.deleteVehicle = deleteVehicle;
window.performOSINTLookup = performOSINTLookup;
window.removeEvidencePhoto = removeEvidencePhoto;
window.showLightbox = showLightbox;
window.takePhoto = takePhoto;
