// Supabase Configuration
const SUPABASE_URL = 'https://ymwxkasxjebrtlnjipaj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltd3hrYXN4amVicnRsbmppcGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDYwMjMsImV4cCI6MjA3ODcyMjAyM30.eThLkMY8RGIxPsHtYVbpLHom1y2IvIqx6zQe1XzIEuI';

// Check if Supabase library loaded
if (!window.supabase) {
    alert('ERROR: Failed to load Supabase library. Please check your internet connection and reload the page.');
    throw new Error('Supabase library not loaded');
}

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Application State
let currentSemaphore = null;
let semaphoreHistory = [];
let semaphoreList = [];
let currentLocation = null;
let semaphoreLocations = {}; // Store locations by semaphore name

// DOM Elements
const elements = {
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
        const { data, error } = await supabase
            .from('semaphores')
            .select('*')
            .eq('name', semaphoreName)
            .order('timestamp', { ascending: false });

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
            timestamp: new Date().toISOString()
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

// Prediction Logic
function calculateStats() {
    if (semaphoreHistory.length < 2) {
        return {
            avgOpenDuration: null,
            avgClosedDuration: null,
            totalCycles: 0
        };
    }

    let openDurations = [];
    let closedDurations = [];

    // Sort by timestamp ascending for calculation
    const sortedHistory = [...semaphoreHistory].reverse();

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

    return {
        state: currentState,
        confidence: `${stats.totalCycles} cycles tracked, ${Math.round(percentComplete)}% into ${currentState} phase`,
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
    elements.totalCycles.textContent = stats.totalCycles;

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

// Auto-refresh prediction every 10 seconds
setInterval(() => {
    if (currentSemaphore && semaphoreHistory.length > 0) {
        updateUI();
    }
}, 10000);

// Initialize app
async function init() {
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
