import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCqYns7sjXUoNMIRvLA5G34KevtEl3HM1w",
    authDomain: "aitestweb.firebaseapp.com",
    projectId: "aitestweb",
    storageBucket: "aitestweb.firebasestorage.app",
    messagingSenderId: "270440605110",
    appId: "1:270440605110:web:8d6c0f378e849ad9150d17",
    measurementId: "G-4FGM1ZNKKY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const eventId = '2025-01-24';

const attendees = [
    '문병식',
    '류광우',
    '박재환',
    '이민호',
    '기성도',
    '류광우',
    '나호영',
    '백영준'
];

const storageKey = 'wedding-attendance-v1';
const noteStorageKey = 'wedding-after-note-v1';
const transportOptions = ['', 'SRT', '비행기', '자차', '버스'];
const overnightOptions = ['', '예', '아니오'];

const defaultEntry = {
    transport: '',
    departTime: '',
    returnTime: '',
    overnight: ''
};

const listElement = document.getElementById('attendeeList');
const saveStatus = document.getElementById('saveStatus');
const afterPartyNote = document.getElementById('afterPartyNote');

const state = loadState();
const saveTimers = new Map();
let isRefreshing = false;

renderList();
loadRemoteState();
initAfterNote();
setupPullToRefresh();

function loadState() {
    try {
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        return {};
    }
}

function persistState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
    if (saveStatus) {
        const now = new Date();
        const timestamp = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        saveStatus.textContent = `로컬 저장됨 · ${timestamp}`;
    }
}

function renderList() {
    listElement.innerHTML = '';
    attendees.forEach((name, index) => {
        const id = `attendee-${index}`;
        if (!state[id]) {
            state[id] = { name, ...defaultEntry };
        }
        const row = document.createElement('tr');
        row.dataset.id = id;

        row.appendChild(createNameCell(name));
        row.appendChild(createInputCell('departTime', 'time', state[id].departTime, id));
        row.appendChild(createSelectCell('transport', transportOptions, state[id].transport, id));
        row.appendChild(createSelectCell('overnight', overnightOptions, state[id].overnight, id));
        row.appendChild(createInputCell('returnTime', 'time', state[id].returnTime, id));

        listElement.appendChild(row);
    });
}

function createNameCell(name) {
    const cell = document.createElement('td');
    cell.className = 'attendee-name';
    cell.dataset.label = '이름';
    cell.textContent = name;
    return cell;
}

function createSelectCell(key, options, value, id) {
    const cell = document.createElement('td');
    cell.dataset.label = getLabelForKey(key);
    const field = document.createElement('div');
    field.className = 'field';
    const select = document.createElement('select');
    select.name = key;

    options.forEach((optionValue) => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue === '' ? '선택' : optionValue;
        if (optionValue === value) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    select.addEventListener('change', (event) => updateEntry(id, key, event.target.value));

    field.appendChild(select);
    cell.appendChild(field);
    return cell;
}

function createInputCell(key, type, value, id) {
    const cell = document.createElement('td');
    cell.dataset.label = getLabelForKey(key);
    const field = document.createElement('div');
    field.className = 'field';
    const input = document.createElement('input');
    input.type = type;
    input.name = key;
    input.value = value || '';
    input.placeholder = type === 'time' ? '--:--' : '입력';

    input.addEventListener('input', (event) => updateEntry(id, key, event.target.value));

    field.appendChild(input);
    cell.appendChild(field);
    return cell;
}

function updateEntry(id, key, value) {
    if (!state[id]) {
        state[id] = { ...defaultEntry };
    }
    state[id][key] = value;
    persistState();
    scheduleRemoteSave(id);
}

function getLabelForKey(key) {
    switch (key) {
        case 'departTime':
            return '출발시간';
        case 'transport':
            return '교통수단';
        case 'returnTime':
            return '귀가 출발';
        case 'overnight':
            return '1박 여부';
        default:
            return '';
    }
}

function scheduleRemoteSave(id) {
    if (saveTimers.has(id)) {
        clearTimeout(saveTimers.get(id));
    }
    const timer = setTimeout(() => {
        saveRemoteState(id);
        saveTimers.delete(id);
    }, 500);
    saveTimers.set(id, timer);
}

async function saveRemoteState(id) {
    const entry = state[id];
    if (!entry) {
        return;
    }
    try {
        await setDoc(doc(db, 'events', eventId, 'attendees', id), {
            ...entry,
            name: entry.name
        }, { merge: true });
        const now = new Date();
        const timestamp = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        if (saveStatus) {
            saveStatus.textContent = `Firebase 저장됨 · ${timestamp}`;
        }
    } catch (error) {
        if (saveStatus) {
            saveStatus.textContent = 'Firebase 저장 실패';
        }
        console.error('Firebase save error:', error);
    }
}

async function loadRemoteState() {
    try {
        const entries = await Promise.all(attendees.map(async (_, index) => {
            const id = `attendee-${index}`;
            const snapshot = await getDoc(doc(db, 'events', eventId, 'attendees', id));
            if (snapshot.exists()) {
                return { id, data: snapshot.data() };
            }
            return null;
        }));

        entries.filter(Boolean).forEach(({ id, data }) => {
            state[id] = { ...defaultEntry, ...state[id], ...data };
        });

        const eventSnapshot = await getDoc(doc(db, 'events', eventId));
        if (eventSnapshot.exists()) {
            const data = eventSnapshot.data();
            if (afterPartyNote && typeof data.afterPartyNote === 'string') {
                afterPartyNote.value = data.afterPartyNote;
            }
        }

        renderList();
        persistState();
    } catch (error) {
        console.error('Firebase load error:', error);
    }
}

function initAfterNote() {
    if (!afterPartyNote) {
        return;
    }
    const localNote = localStorage.getItem(noteStorageKey);
    if (localNote) {
        afterPartyNote.value = localNote;
    }
    let noteTimer = null;
    afterPartyNote.addEventListener('input', (event) => {
        localStorage.setItem(noteStorageKey, event.target.value);
        if (noteTimer) {
            clearTimeout(noteTimer);
        }
        noteTimer = setTimeout(() => {
            saveRemoteNote(event.target.value);
        }, 500);
    });
}

async function saveRemoteNote(value) {
    try {
        await setDoc(doc(db, 'events', eventId), { afterPartyNote: value }, { merge: true });
        if (saveStatus) {
            const now = new Date();
            const timestamp = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
            saveStatus.textContent = `Firebase 저장됨 · ${timestamp}`;
        }
    } catch (error) {
        if (saveStatus) {
            saveStatus.textContent = 'Firebase 저장 실패';
        }
        console.error('Firebase note save error:', error);
    }
}

function setupPullToRefresh() {
    if (!('ontouchstart' in window)) {
        return;
    }
    let startY = null;
    let triggered = false;
    const threshold = 70;

    window.addEventListener('touchstart', (event) => {
        if (window.scrollY === 0) {
            startY = event.touches[0].clientY;
        }
    }, { passive: true });

    window.addEventListener('touchmove', (event) => {
        if (startY === null || triggered || isRefreshing) {
            return;
        }
        const currentY = event.touches[0].clientY;
        if (currentY - startY > threshold) {
            triggered = true;
            refreshFromRemote();
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        startY = null;
        triggered = false;
    });
}

async function refreshFromRemote() {
    if (isRefreshing) {
        return;
    }
    isRefreshing = true;
    if (saveStatus) {
        saveStatus.textContent = '데이터 갱신 중...';
    }
    await loadRemoteState();
    if (saveStatus) {
        const now = new Date();
        const timestamp = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        saveStatus.textContent = `갱신 완료 · ${timestamp}`;
    }
    isRefreshing = false;
}
