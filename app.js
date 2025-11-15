// Supabase Configuration
const SUPABASE_URL = 'https://ymwxkasxjebrtlnjipaj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltd3hrYXN4amVicnRsbmppcGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDYwMjMsImV4cCI6MjA3ODcyMjAyM30.eThLkMY8RGIxPsHtYVbpLHom1y2IvIqx6zQe1XzIEuI';

// Admin Authentication
const ADMIN_PASSCODE = 'semaphore2025';

// Check if Supabase library loaded
if (!window.supabase) {
    alert('ERROR: Failed to load Supabase library. Please check your internet connection and reload the page.');
    throw new Error('Supabase library not loaded');
}

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Authentication Helper Functions
function isAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
}

function setAdminStatus(status) {
    if (status) {
        localStorage.setItem('isAdmin', 'true');
    } else {
        localStorage.removeItem('isAdmin');
    }
    updateUIForAuthStatus();
}

function updateUIForAuthStatus() {
    const admin = isAdmin();

    // Update status text and button
    if (admin) {
        elements.authStatusText.textContent = '✅ Admin Mode';
        elements.authBtn.textContent = '🚪 Logout';
        elements.authBtn.classList.add('logout');
    } else {
        elements.authStatusText.textContent = '🔒 View Only Mode';
        elements.authBtn.textContent = '🔑 Enter Passcode';
        elements.authBtn.classList.remove('logout');
    }

    // Enable/disable write buttons
    const writeButtons = [
        elements.newSemaphoreBtn,
        elements.newSessionBtn,
        elements.recordOpenBtn,
        elements.recordClosedBtn,
        elements.resetHistoryBtn,
        elements.renameSemaphoreBtn
    ];

    writeButtons.forEach(btn => {
        if (btn) {
            btn.disabled = !admin;
            if (!admin) {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.title = 'Login required to modify data';
            } else {
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.title = '';
            }
        }
    });
}

// Application State
let currentSemaphore = null;
let semaphoreHistory = [];
let semaphoreList = [];
let currentLocation = null;
let semaphoreLocations = {}; // Store locations by semaphore name
let currentSessionId = null; // Current active collection session
let sessionList = []; // List of all sessions for current semaphore

// DOM Elements
const elements = {
    authStatusText: document.getElementById('authStatusText'),
    authBtn: document.getElementById('authBtn'),
    sessionSelect: document.getElementById('sessionSelect'),
    newSessionBtn: document.getElementById('newSessionBtn'),
    dashboardViewBtn: document.getElementById('dashboardViewBtn'),
    singleViewBtn: document.getElementById('singleViewBtn'),
    aboutViewBtn: document.getElementById('aboutViewBtn'),
    dashboardView: document.getElementById('dashboardView'),
    singleView: document.getElementById('singleView'),
    aboutView: document.getElementById('aboutView'),
    dashboardGrid: document.getElementById('dashboardGrid'),
    semaphoreSelect: document.getElementById('semaphoreSelect'),
    newSemaphoreBtn: document.getElementById('newSemaphoreBtn'),
    newSemaphoreForm: document.getElementById('newSemaphoreForm'),
    semaphoreName: document.getElementById('semaphoreName'),
    createSemaphoreBtn: document.getElementById('createSemaphoreBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    currentStateSection: document.getElementById('currentStateSection'),
    semaphoreTitle: document.getElementById('semaphoreTitle'),
    predictedState: document.getElementById('predictedState'),
    confidenceValue: document.getElementById('confidenceValue'),
    lastUpdate: document.getElementById('lastUpdate'),
    recordOpenBtn: document.getElementById('recordOpenBtn'),
    recordClosedBtn: document.getElementById('recordClosedBtn'),
    avgOpenDuration: document.getElementById('avgOpenDuration'),
    avgClosedDuration: document.getElementById('avgClosedDuration'),
    totalCycles: document.getElementById('totalCycles'),
    historySection: document.getElementById('historySection'),
    historyList: document.getElementById('historyList'),
    toggleHistoryBtn: document.getElementById('toggleHistoryBtn'),
    resetHistoryBtn: document.getElementById('resetHistoryBtn'),
    renameSemaphoreBtn: document.getElementById('renameSemaphoreBtn'),
    renameForm: document.getElementById('renameForm'),
    newSemaphoreName: document.getElementById('newSemaphoreName'),
    confirmRenameBtn: document.getElementById('confirmRenameBtn'),
    cancelRenameBtn: document.getElementById('cancelRenameBtn'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toast: document.getElementById('toast')
};

// Utility Functions
function showLoading() {
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

function showToast(message, type = 'success') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.remove('hidden');
    setTimeout(() => {
        elements.toast.classList.add('hidden');
    }, 3000);
}

function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
}

function formatDateTime(date) {
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Geolocation Functions
async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            (error) => {
                console.warn('Geolocation error:', error);
                resolve(null); // Don't reject, just return null
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    });
}

function getGoogleMapsLink(lat, lon) {
    return `https://www.google.com/maps?q=${lat},${lon}`;
}

// Session Management Functions
function generateSessionId() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
    return `session_${dateStr}_${timeStr}`;
}

function formatSessionName(sessionId) {
    if (sessionId === 'default') return 'Default Collection';
    if (sessionId === 'all') return 'All Sessions (Average)';

    // Format: session_2025-11-14_103045 -> "Nov 14, 10:30"
    const parts = sessionId.split('_');
    if (parts.length >= 3) {
        const datePart = parts[1]; // 2025-11-14
        const timePart = parts[2]; // 103045
        const date = new Date(datePart);
        const hours = timePart.substring(0, 2);
        const minutes = timePart.substring(2, 4);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[date.getMonth()]} ${date.getDate()}, ${hours}:${minutes}`;
    }
    return sessionId;
}

async function loadSessionsForSemaphore(semaphoreName) {
    try {
        const { data, error } = await supabase
            .from('semaphores')
            .select('session_id')
            .eq('name', semaphoreName)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading sessions:', error);
            return [];
        }

        // Get unique session IDs
        const sessions = [...new Set(data.map(record => record.session_id || 'default'))];
        return sessions;
    } catch (error) {
        console.error('Error loading sessions:', error);
        return [];
    }
}

function updateSessionDropdown() {
    elements.sessionSelect.innerHTML = '<option value="all">All Sessions (Average)</option>';

    sessionList.forEach(sessionId => {
        const option = document.createElement('option');
        option.value = sessionId;
        option.textContent = formatSessionName(sessionId);
        elements.sessionSelect.appendChild(option);
    });

    // Select current session or "all"
    if (currentSessionId && sessionList.includes(currentSessionId)) {
        elements.sessionSelect.value = currentSessionId;
    } else {
        elements.sessionSelect.value = 'all';
    }
}

// Database Functions
async function loadSemaphoreList() {
    try {
        const { data, error } = await supabase
            .from('semaphores')
            .select('name, latitude, longitude')
            .order('name');

        if (error) {
            console.error('Database error:', error);
            showToast(`Database Error: ${error.message}. Have you run database-setup.sql?`, 'error');
            throw error;
        }

        // Check if data is valid
        if (!data) {
            console.error('No data returned from database');
            showToast('No data returned. Check database connection.', 'error');
            return [];
        }

        // Get unique semaphore names and their locations
        const semaphoreMap = {};
        data.forEach(item => {
            if (!semaphoreMap[item.name]) {
                semaphoreMap[item.name] = {
                    name: item.name,
                    latitude: item.latitude,
                    longitude: item.longitude
                };
            }
        });

        semaphoreList = Object.keys(semaphoreMap);
        semaphoreLocations = semaphoreMap;

        // Update dropdown
        elements.semaphoreSelect.innerHTML = '<option value="">-- Select a semaphore --</option>';
        semaphoreList.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            const location = semaphoreMap[name];
            const locationText = location.latitude && location.longitude
                ? ' 📍'
                : '';
            option.textContent = name + locationText;
            elements.semaphoreSelect.appendChild(option);
        });

        return semaphoreList;
    } catch (error) {
        console.error('Error loading semaphore list:', error);
        // Error already shown in toast above
        return [];
    }
}

async function loadSemaphoreHistory(semaphoreName) {
    try {
        showLoading();

        // Load all sessions for this semaphore
        sessionList = await loadSessionsForSemaphore(semaphoreName);
        updateSessionDropdown();

        // Get selected session filter
        const selectedSession = elements.sessionSelect ? elements.sessionSelect.value : 'all';

        // Build query
        let query = supabase
            .from('semaphores')
            .select('*')
            .eq('name', semaphoreName);

        // Filter by session if specific session selected
        if (selectedSession !== 'all') {
            query = query.eq('session_id', selectedSession);
        }

        query = query.order('timestamp', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        semaphoreHistory = data.map(item => ({
            ...item,
            timestamp: new Date(item.timestamp)
        }));

        return semaphoreHistory;
    } catch (error) {
        console.error('Error loading history:', error);
        showToast('Error loading history', 'error');
        return [];
    } finally {
        hideLoading();
    }
}

async function recordState(semaphoreName, state) {
    if (!isAdmin()) {
        showToast('❌ Login required to record states', 'error');
        return;
    }

    try {
        showLoading();

        // Try to get location if not already cached for this semaphore
        let location = semaphoreLocations[semaphoreName];
        if (!location || (!location.latitude && !location.longitude)) {
            currentLocation = await getCurrentLocation();
            if (currentLocation) {
                location = currentLocation;
                semaphoreLocations[semaphoreName] = currentLocation;
            }
        }

        const record = {
            name: semaphoreName,
            current_state: state,
            timestamp: new Date().toISOString(),
            session_id: currentSessionId || 'default'
        };

        // Add location if available
        if (location && location.latitude && location.longitude) {
            record.latitude = location.latitude;
            record.longitude = location.longitude;
        }

        const { data, error } = await supabase
            .from('semaphores')
            .insert([record])
            .select();

        if (error) {
            console.error('Database insert error:', error);
            showToast(`Error: ${error.message}. Check database setup!`, 'error');
            throw error;
        }

        showToast(`Recorded as ${state.toUpperCase()}`, 'success');
        await loadSemaphoreHistory(semaphoreName);
        updateUI();
        return data;
    } catch (error) {
        console.error('Error recording state:', error);
        // Error already shown in toast above
        return null;
    } finally {
        hideLoading();
    }
}

async function deleteHistory(semaphoreName) {
    if (!isAdmin()) {
        showToast('❌ Login required to reset history', 'error');
        return false;
    }

    try {
        showLoading();
        const { error } = await supabase
            .from('semaphores')
            .delete()
            .eq('name', semaphoreName);

        if (error) {
            console.error('Database delete error:', error);
            showToast(`Error deleting history: ${error.message}`, 'error');
            throw error;
        }

        showToast('History reset successfully', 'success');
        semaphoreHistory = [];
        updateUI();
        return true;
    } catch (error) {
        console.error('Error deleting history:', error);
        return false;
    } finally {
        hideLoading();
    }
}

async function renameSemaphore(oldName, newName) {
    if (!isAdmin()) {
        showToast('❌ Login required to rename semaphores', 'error');
        return false;
    }

    try {
        showLoading();

        // Check if new name already exists
        const { data: existing, error: checkError } = await supabase
            .from('semaphores')
            .select('name')
            .eq('name', newName)
            .limit(1);

        if (checkError) {
            console.error('Database check error:', checkError);
            showToast(`Error checking name: ${checkError.message}`, 'error');
            throw checkError;
        }

        if (existing && existing.length > 0) {
            showToast('A semaphore with this name already exists', 'error');
            return false;
        }

        // Update all records with the old name to the new name
        const { error } = await supabase
            .from('semaphores')
            .update({ name: newName })
            .eq('name', oldName);

        if (error) {
            console.error('Database rename error:', error);
            showToast(`Error renaming: ${error.message}`, 'error');
            throw error;
        }

        showToast(`Renamed to "${newName}"`, 'success');

        // Update local state
        if (semaphoreLocations[oldName]) {
            semaphoreLocations[newName] = semaphoreLocations[oldName];
            delete semaphoreLocations[oldName];
        }

        // Reload semaphore list
        await loadSemaphoreList();

        // Update current semaphore and reload
        currentSemaphore = newName;
        elements.semaphoreSelect.value = newName;
        await loadSemaphoreHistory(newName);
        updateUI();

        return true;
    } catch (error) {
        console.error('Error renaming semaphore:', error);
        return false;
    } finally {
        hideLoading();
    }
}

// Dashboard Functions
async function loadAllSemaphoresData() {
    try {
        showLoading();
        const allData = [];

        for (const semaphoreName of semaphoreList) {
            const { data, error } = await supabase
                .from('semaphores')
                .select('*')
                .eq('name', semaphoreName)
                .order('timestamp', { ascending: false });

            if (!error && data) {
                const history = data.map(item => ({
                    ...item,
                    timestamp: new Date(item.timestamp)
                }));

                // Calculate stats using session averaging (same as single view)
                const stats = calculateStatsWithSessionAveraging(history);
                const prediction = predictStateForHistory(history, stats);

                allData.push({
                    name: semaphoreName,
                    history,
                    prediction,
                    stats,
                    location: semaphoreLocations[semaphoreName]
                });
            }
        }

        return allData;
    } catch (error) {
        console.error('Error loading all semaphores:', error);
        return [];
    } finally {
        hideLoading();
    }
}

// Calculate stats with session averaging for more accurate predictions
function calculateStatsWithSessionAveraging(history) {
    if (history.length < 2) {
        return {
            avgOpenDuration: null,
            avgClosedDuration: null,
            totalCycles: 0
        };
    }

    // Group history by session
    const sessionGroups = {};
    history.forEach(record => {
        const sessionId = record.session_id || 'default';
        if (!sessionGroups[sessionId]) {
            sessionGroups[sessionId] = [];
        }
        sessionGroups[sessionId].push(record);
    });

    // Calculate stats for each session
    const sessionStats = [];
    Object.keys(sessionGroups).forEach(sessionId => {
        const stats = calculateStatsForHistory(sessionGroups[sessionId]);
        if (stats.avgOpenDuration !== null || stats.avgClosedDuration !== null) {
            sessionStats.push(stats);
        }
    });

    // If no valid session stats, return empty
    if (sessionStats.length === 0) {
        return {
            avgOpenDuration: null,
            avgClosedDuration: null,
            totalCycles: 0
        };
    }

    // Average the averages across sessions
    const validOpenStats = sessionStats.filter(s => s.avgOpenDuration !== null);
    const validClosedStats = sessionStats.filter(s => s.avgClosedDuration !== null);

    const avgOpen = validOpenStats.length > 0
        ? validOpenStats.reduce((sum, s) => sum + s.avgOpenDuration, 0) / validOpenStats.length
        : null;

    const avgClosed = validClosedStats.length > 0
        ? validClosedStats.reduce((sum, s) => sum + s.avgClosedDuration, 0) / validClosedStats.length
        : null;

    const totalCycles = sessionStats.reduce((sum, s) => sum + s.totalCycles, 0);

    return {
        avgOpenDuration: avgOpen,
        avgClosedDuration: avgClosed,
        totalCycles,
        sessionsCount: sessionStats.length
    };
}

function calculateStatsForHistory(history) {
    if (history.length < 2) {
        return {
            avgOpenDuration: null,
            avgClosedDuration: null,
            totalCycles: 0
        };
    }

    let openDurations = [];
    let closedDurations = [];
    const sortedHistory = [...history].reverse();

    for (let i = 0; i < sortedHistory.length - 1; i++) {
        const current = sortedHistory[i];
        const next = sortedHistory[i + 1];
        const duration = next.timestamp - current.timestamp;

        if (current.current_state === 'open') {
            openDurations.push(duration);
        } else if (current.current_state === 'closed') {
            closedDurations.push(duration);
        }
    }

    const avgOpen = openDurations.length > 0
        ? openDurations.reduce((a, b) => a + b, 0) / openDurations.length
        : null;

    const avgClosed = closedDurations.length > 0
        ? closedDurations.reduce((a, b) => a + b, 0) / closedDurations.length
        : null;

    return {
        avgOpenDuration: avgOpen,
        avgClosedDuration: avgClosed,
        totalCycles: Math.min(openDurations.length, closedDurations.length)
    };
}

function predictStateForHistory(history, providedStats = null) {
    if (history.length === 0) {
        return { state: 'unknown', timeUntilChange: null, confidence: 'No data' };
    }

    const lastRecord = history[0];
    // Use provided stats (with session averaging) or calculate basic stats
    const stats = providedStats || calculateStatsForHistory(history);
    const now = new Date();
    const timeSinceLastRecord = now - lastRecord.timestamp;

    if (history.length < 2 || !stats.avgOpenDuration || !stats.avgClosedDuration) {
        return {
            state: lastRecord.current_state,
            timeUntilChange: null,
            confidence: 'Insufficient data',
            timeSince: timeSinceLastRecord
        };
    }

    const lastState = lastRecord.current_state;
    let currentState = lastState;
    let timeRemaining = timeSinceLastRecord;

    while (timeRemaining > 0) {
        const duration = currentState === 'open'
            ? stats.avgOpenDuration
            : stats.avgClosedDuration;

        if (!duration || timeRemaining < duration) {
            break;
        }

        timeRemaining -= duration;
        currentState = currentState === 'open' ? 'closed' : 'open';
    }

    const currentDuration = currentState === 'open'
        ? stats.avgOpenDuration
        : stats.avgClosedDuration;

    const timeUntilChange = currentDuration ? currentDuration - timeRemaining : null;

    // Show session count in confidence if available
    const confidenceText = stats.sessionsCount
        ? `${stats.totalCycles} cycles (${stats.sessionsCount} sessions avg)`
        : `${stats.totalCycles} cycles`;

    return {
        state: currentState,
        timeUntilChange,
        confidence: confidenceText,
        timeSince: timeSinceLastRecord
    };
}

async function updateDashboard() {
    const allData = await loadAllSemaphoresData();

    if (allData.length === 0) {
        elements.dashboardGrid.innerHTML = '<p class="no-data">No semaphores yet. Create one to get started!</p>';
        return;
    }

    // Sort by: open first, then by time until change
    allData.sort((a, b) => {
        if (a.prediction.state === 'open' && b.prediction.state !== 'open') return -1;
        if (a.prediction.state !== 'open' && b.prediction.state === 'open') return 1;
        if (a.prediction.timeUntilChange && b.prediction.timeUntilChange) {
            return a.prediction.timeUntilChange - b.prediction.timeUntilChange;
        }
        return 0;
    });

    elements.dashboardGrid.innerHTML = '';

    allData.forEach(semaphoreData => {
        const card = createDashboardCard(semaphoreData);
        elements.dashboardGrid.appendChild(card);
    });
}

function createDashboardCard(semaphoreData) {
    const { name, prediction, stats, location } = semaphoreData;

    const card = document.createElement('div');
    card.className = 'semaphore-card';
    card.addEventListener('click', () => {
        // Switch to single view and select this semaphore
        switchToSingleView();
        elements.semaphoreSelect.value = name;
        elements.semaphoreSelect.dispatchEvent(new Event('change'));
    });

    const stateIcon = prediction.state === 'open' ? '🟢' : prediction.state === 'closed' ? '🔴' : '⚪';
    const locationIcon = location && location.latitude && location.longitude ? '📍' : '';

    const timeUntilChangeText = prediction.timeUntilChange
        ? formatDuration(prediction.timeUntilChange)
        : '--';

    const isSoon = prediction.timeUntilChange && prediction.timeUntilChange < 60000; // Less than 1 minute

    card.innerHTML = `
        <div class="semaphore-card-header">
            <div class="semaphore-card-name">${name}</div>
            ${locationIcon ? `<div class="semaphore-card-location">${locationIcon}</div>` : ''}
        </div>

        <div class="semaphore-card-state ${prediction.state}">
            <div class="semaphore-card-icon">${stateIcon}</div>
            <div class="semaphore-card-state-info">
                <div class="semaphore-card-state-label">Current State</div>
                <div class="semaphore-card-state-value ${prediction.state}">${prediction.state.toUpperCase()}</div>
            </div>
        </div>

        <div class="semaphore-card-timer">
            <div class="semaphore-card-timer-label">Changes in</div>
            <div class="semaphore-card-timer-value ${isSoon ? 'soon' : ''}">${timeUntilChangeText}</div>
        </div>

        <div class="semaphore-card-info">
            <span>${stats.totalCycles} cycles tracked</span>
            <span>${prediction.confidence}</span>
        </div>
    `;

    return card;
}

function switchToDashboardView() {
    elements.dashboardView.classList.remove('hidden');
    elements.singleView.classList.add('hidden');
    elements.aboutView.classList.add('hidden');
    elements.dashboardViewBtn.classList.add('active');
    elements.singleViewBtn.classList.remove('active');
    elements.aboutViewBtn.classList.remove('active');
    updateDashboard();
}

function switchToSingleView() {
    elements.dashboardView.classList.add('hidden');
    elements.singleView.classList.remove('hidden');
    elements.aboutView.classList.add('hidden');
    elements.dashboardViewBtn.classList.remove('active');
    elements.singleViewBtn.classList.add('active');
    elements.aboutViewBtn.classList.remove('active');
}

function switchToAboutView() {
    elements.dashboardView.classList.add('hidden');
    elements.singleView.classList.add('hidden');
    elements.aboutView.classList.remove('hidden');
    elements.dashboardViewBtn.classList.remove('active');
    elements.singleViewBtn.classList.remove('active');
    elements.aboutViewBtn.classList.add('active');
}

// Prediction Logic
function calculateStatsForHistory(history) {
    if (history.length < 2) {
        return {
            avgOpenDuration: null,
            avgClosedDuration: null,
            totalCycles: 0
        };
    }

    let openDurations = [];
    let closedDurations = [];

    // Sort by timestamp ascending for calculation
    const sortedHistory = [...history].reverse();

    for (let i = 0; i < sortedHistory.length - 1; i++) {
        const current = sortedHistory[i];
        const next = sortedHistory[i + 1];
        const duration = next.timestamp - current.timestamp;

        if (current.current_state === 'open') {
            openDurations.push(duration);
        } else if (current.current_state === 'closed') {
            closedDurations.push(duration);
        }
    }

    const avgOpen = openDurations.length > 0
        ? openDurations.reduce((a, b) => a + b, 0) / openDurations.length
        : null;

    const avgClosed = closedDurations.length > 0
        ? closedDurations.reduce((a, b) => a + b, 0) / closedDurations.length
        : null;

    const totalCycles = Math.min(openDurations.length, closedDurations.length);

    return {
        avgOpenDuration: avgOpen,
        avgClosedDuration: avgClosed,
        totalCycles
    };
}

function calculateStats() {
    const selectedSession = elements.sessionSelect ? elements.sessionSelect.value : 'all';

    // If viewing a specific session, calculate stats for that session only
    if (selectedSession !== 'all') {
        return calculateStatsForHistory(semaphoreHistory);
    }

    // If viewing "all sessions", calculate average across all sessions
    // Group history by session
    const sessionGroups = {};
    semaphoreHistory.forEach(record => {
        const sessionId = record.session_id || 'default';
        if (!sessionGroups[sessionId]) {
            sessionGroups[sessionId] = [];
        }
        sessionGroups[sessionId].push(record);
    });

    // Calculate stats for each session
    const sessionStats = [];
    Object.keys(sessionGroups).forEach(sessionId => {
        const stats = calculateStatsForHistory(sessionGroups[sessionId]);
        if (stats.avgOpenDuration !== null || stats.avgClosedDuration !== null) {
            sessionStats.push(stats);
        }
    });

    // If no valid session stats, return empty
    if (sessionStats.length === 0) {
        return {
            avgOpenDuration: null,
            avgClosedDuration: null,
            totalCycles: 0
        };
    }

    // Average the averages across sessions
    const validOpenStats = sessionStats.filter(s => s.avgOpenDuration !== null);
    const validClosedStats = sessionStats.filter(s => s.avgClosedDuration !== null);

    const avgOpen = validOpenStats.length > 0
        ? validOpenStats.reduce((sum, s) => sum + s.avgOpenDuration, 0) / validOpenStats.length
        : null;

    const avgClosed = validClosedStats.length > 0
        ? validClosedStats.reduce((sum, s) => sum + s.avgClosedDuration, 0) / validClosedStats.length
        : null;

    const totalCycles = sessionStats.reduce((sum, s) => sum + s.totalCycles, 0);

    return {
        avgOpenDuration: avgOpen,
        avgClosedDuration: avgClosed,
        totalCycles,
        sessionsCount: sessionStats.length
    };
}

function predictCurrentState() {
    if (semaphoreHistory.length === 0) {
        return {
            state: 'unknown',
            confidence: 'No data available',
            lastUpdate: null
        };
    }

    const lastRecord = semaphoreHistory[0];
    const stats = calculateStats();
    const now = new Date();
    const timeSinceLastRecord = now - lastRecord.timestamp;

    // If we have less than 2 records, we can't predict cycles
    if (semaphoreHistory.length < 2) {
        return {
            state: lastRecord.current_state,
            confidence: `Only 1 record`,
            lastUpdate: lastRecord.timestamp,
            timeSince: timeSinceLastRecord
        };
    }

    const lastState = lastRecord.current_state;
    const avgDuration = lastState === 'open'
        ? stats.avgOpenDuration
        : stats.avgClosedDuration;

    if (!avgDuration) {
        return {
            state: lastState,
            confidence: `Assuming still ${lastState}`,
            lastUpdate: lastRecord.timestamp,
            timeSince: timeSinceLastRecord
        };
    }

    // Calculate how many full cycles have passed
    let currentState = lastState;
    let timeRemaining = timeSinceLastRecord;
    let cycleCount = 0;

    while (timeRemaining > 0) {
        const duration = currentState === 'open'
            ? stats.avgOpenDuration
            : stats.avgClosedDuration;

        if (!duration || timeRemaining < duration) {
            break;
        }

        timeRemaining -= duration;
        currentState = currentState === 'open' ? 'closed' : 'open';
        cycleCount++;
    }

    const currentDuration = currentState === 'open'
        ? stats.avgOpenDuration
        : stats.avgClosedDuration;

    const percentComplete = currentDuration
        ? (timeRemaining / currentDuration) * 100
        : 0;

    // Build confidence message with session info if available
    let confidenceMsg = `${stats.totalCycles} cycles tracked`;
    if (stats.sessionsCount && stats.sessionsCount > 1) {
        confidenceMsg += ` (${stats.sessionsCount} sessions avg)`;
    }
    confidenceMsg += `, ${Math.round(percentComplete)}% into ${currentState} phase`;

    return {
        state: currentState,
        confidence: confidenceMsg,
        lastUpdate: lastRecord.timestamp,
        timeSince: timeSinceLastRecord,
        cycleCount
    };
}

// UI Update Functions
function updateUI() {
    if (!currentSemaphore) {
        elements.currentStateSection.classList.add('hidden');
        elements.historySection.classList.add('hidden');
        return;
    }

    elements.currentStateSection.classList.remove('hidden');
    elements.historySection.classList.remove('hidden');

    // Update title with location if available
    const location = semaphoreLocations[currentSemaphore];
    if (location && location.latitude && location.longitude) {
        const mapLink = getGoogleMapsLink(location.latitude, location.longitude);
        elements.semaphoreTitle.innerHTML = `${currentSemaphore} <a href="${mapLink}" target="_blank" class="location-link" title="View on map">📍</a>`;
    } else {
        elements.semaphoreTitle.textContent = currentSemaphore;
    }

    // Update prediction
    const prediction = predictCurrentState();
    elements.predictedState.textContent = prediction.state.toUpperCase();
    elements.predictedState.className = `state-value ${prediction.state}`;
    elements.confidenceValue.textContent = prediction.confidence;

    if (prediction.lastUpdate) {
        elements.lastUpdate.textContent = formatRelativeTime(prediction.lastUpdate);
    } else {
        elements.lastUpdate.textContent = 'Never';
    }

    // Update stats
    const stats = calculateStats();
    elements.avgOpenDuration.textContent = stats.avgOpenDuration
        ? formatDuration(stats.avgOpenDuration)
        : '--';
    elements.avgClosedDuration.textContent = stats.avgClosedDuration
        ? formatDuration(stats.avgClosedDuration)
        : '--';

    // Show total cycles with session count if multiple sessions
    let cyclesText = stats.totalCycles.toString();
    if (stats.sessionsCount && stats.sessionsCount > 1) {
        cyclesText += ` (${stats.sessionsCount} sessions)`;
    }
    elements.totalCycles.textContent = cyclesText;

    // Update history
    updateHistoryList();
}

function updateHistoryList() {
    if (semaphoreHistory.length === 0) {
        elements.historyList.innerHTML = '<p class="no-data">No records yet. Start by recording the current state!</p>';
        return;
    }

    elements.historyList.innerHTML = '';
    semaphoreHistory.forEach(record => {
        const item = document.createElement('div');
        item.className = 'history-item';

        const stateDiv = document.createElement('div');
        stateDiv.className = `history-state ${record.current_state}`;
        stateDiv.innerHTML = `
            <span>${record.current_state === 'open' ? '🟢' : '🔴'}</span>
            <span>${record.current_state.toUpperCase()}</span>
        `;

        const timeDiv = document.createElement('div');
        timeDiv.className = 'history-time';
        timeDiv.textContent = formatDateTime(record.timestamp);

        item.appendChild(stateDiv);
        item.appendChild(timeDiv);
        elements.historyList.appendChild(item);
    });
}

// Event Handlers
// View toggle
elements.dashboardViewBtn.addEventListener('click', () => {
    switchToDashboardView();
});

elements.singleViewBtn.addEventListener('click', () => {
    switchToSingleView();
});

elements.aboutViewBtn.addEventListener('click', () => {
    switchToAboutView();
});

// Authentication
elements.authBtn.addEventListener('click', () => {
    if (isAdmin()) {
        // Logout
        if (confirm('Logout from admin mode?')) {
            setAdminStatus(false);
            showToast('Logged out - now in View Only mode', 'info');
        }
    } else {
        // Login
        const passcode = prompt('Enter admin passcode:');
        if (passcode === ADMIN_PASSCODE) {
            setAdminStatus(true);
            showToast('✅ Admin access granted!', 'success');
        } else if (passcode) {
            showToast('❌ Incorrect passcode', 'error');
        }
    }
});

elements.newSemaphoreBtn.addEventListener('click', () => {
    elements.newSemaphoreForm.classList.remove('hidden');
    elements.semaphoreName.focus();
});

elements.cancelBtn.addEventListener('click', () => {
    elements.newSemaphoreForm.classList.add('hidden');
    elements.semaphoreName.value = '';
});

elements.createSemaphoreBtn.addEventListener('click', async () => {
    const name = elements.semaphoreName.value.trim();
    if (!name) {
        showToast('Please enter a semaphore name', 'error');
        return;
    }

    elements.newSemaphoreForm.classList.add('hidden');
    elements.semaphoreName.value = '';

    // Add to dropdown if not exists
    if (!semaphoreList.includes(name)) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        elements.semaphoreSelect.appendChild(option);
        semaphoreList.push(name);
    }

    // Select the new semaphore
    elements.semaphoreSelect.value = name;
    currentSemaphore = name;
    await loadSemaphoreHistory(name);
    updateUI();
    showToast(`Created semaphore: ${name}`, 'success');
});

elements.semaphoreSelect.addEventListener('change', async (e) => {
    const selectedName = e.target.value;
    if (!selectedName) {
        currentSemaphore = null;
        updateUI();
        return;
    }

    currentSemaphore = selectedName;
    await loadSemaphoreHistory(selectedName);
    updateUI();
});

// Session Controls
elements.sessionSelect.addEventListener('change', async (e) => {
    if (!currentSemaphore) return;
    await loadSemaphoreHistory(currentSemaphore);
    updateUI();
});

elements.newSessionBtn.addEventListener('click', () => {
    if (!isAdmin()) {
        showToast('❌ Login required to create sessions', 'error');
        return;
    }

    const confirmed = confirm(
        'Start a new collection session?\n\n' +
        'This will create a separate timing collection that you can compare with others.\n\n' +
        'Tip: Collect the same semaphore at different times of day to average out timing errors!'
    );

    if (confirmed) {
        currentSessionId = generateSessionId();
        showToast(`✅ New session started: ${formatSessionName(currentSessionId)}`, 'success');
    }
});

elements.recordOpenBtn.addEventListener('click', async () => {
    if (!currentSemaphore) return;
    await recordState(currentSemaphore, 'open');
});

elements.recordClosedBtn.addEventListener('click', async () => {
    if (!currentSemaphore) return;
    await recordState(currentSemaphore, 'closed');
});

elements.toggleHistoryBtn.addEventListener('click', () => {
    elements.historyList.classList.toggle('collapsed');
    elements.toggleHistoryBtn.textContent = elements.historyList.classList.contains('collapsed')
        ? 'Show All'
        : 'Show Less';
});

elements.resetHistoryBtn.addEventListener('click', async () => {
    if (!currentSemaphore) return;

    const confirmed = confirm(
        `Are you sure you want to reset ALL history for "${currentSemaphore}"?\n\n` +
        `This will delete all ${semaphoreHistory.length} records and cannot be undone.\n\n` +
        `Use this when the semaphore timing has changed and you want to start fresh.`
    );

    if (confirmed) {
        await deleteHistory(currentSemaphore);
    }
});

elements.renameSemaphoreBtn.addEventListener('click', () => {
    if (!currentSemaphore) return;
    elements.renameForm.classList.remove('hidden');
    elements.newSemaphoreName.value = currentSemaphore;
    elements.newSemaphoreName.focus();
    elements.newSemaphoreName.select();
});

elements.cancelRenameBtn.addEventListener('click', () => {
    elements.renameForm.classList.add('hidden');
    elements.newSemaphoreName.value = '';
});

elements.confirmRenameBtn.addEventListener('click', async () => {
    if (!currentSemaphore) return;

    const newName = elements.newSemaphoreName.value.trim();
    if (!newName) {
        showToast('Please enter a name', 'error');
        return;
    }

    if (newName === currentSemaphore) {
        showToast('Name is the same', 'error');
        return;
    }

    const success = await renameSemaphore(currentSemaphore, newName);
    if (success) {
        elements.renameForm.classList.add('hidden');
        elements.newSemaphoreName.value = '';
    }
});

// Auto-refresh prediction every 10 seconds
setInterval(() => {
    if (!elements.dashboardView.classList.contains('hidden')) {
        // Dashboard view is active
        updateDashboard();
    } else if (currentSemaphore && semaphoreHistory.length > 0) {
        // Single view is active
        updateUI();
    }
}, 10000);

// Initialize app
async function init() {
    // Set initial UI based on auth status
    updateUIForAuthStatus();

    showLoading();
    try {
        await loadSemaphoreList();
        hideLoading();

        // If there's only one semaphore, auto-select it
        if (semaphoreList.length === 1) {
            elements.semaphoreSelect.value = semaphoreList[0];
            currentSemaphore = semaphoreList[0];
            await loadSemaphoreHistory(currentSemaphore);
            updateUI();
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('Error initializing app. Please refresh the page.', 'error');
        hideLoading();
    }
}

// Start the app
init();
