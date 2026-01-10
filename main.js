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
const statusOptions = ['미정', '참석', '불참'];
const transportOptions = ['', 'SRT', '비행기', '자차', '대중교통', '버스'];
const overnightOptions = ['', '예', '아니오'];

const defaultEntry = {
    status: '미정',
    transport: '',
    departTime: '',
    returnTime: '',
    overnight: ''
};

const listElement = document.getElementById('attendeeList');
const saveStatus = document.getElementById('saveStatus');
const countAttend = document.getElementById('countAttend');
const countAbsent = document.getElementById('countAbsent');
const countPending = document.getElementById('countPending');

const state = loadState();

renderList();
updateCounts();

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
        saveStatus.textContent = `자동 저장됨 · ${timestamp}`;
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
        row.appendChild(createSelectCell('status', statusOptions, state[id].status, id));
        row.appendChild(createSelectCell('overnight', overnightOptions, state[id].overnight, id));
        row.appendChild(createInputCell('returnTime', 'time', state[id].returnTime, id));

        listElement.appendChild(row);
    });
}

function createNameCell(name) {
    const cell = document.createElement('td');
    cell.className = 'attendee-name';
    cell.textContent = name;
    return cell;
}

function createSelectCell(key, options, value, id) {
    const cell = document.createElement('td');
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
    updateCounts();
}

function updateCounts() {
    let attend = 0;
    let absent = 0;
    let pending = 0;

    attendees.forEach((_, index) => {
        const entry = state[`attendee-${index}`] || defaultEntry;
        if (entry.status === '참석') {
            attend += 1;
        } else if (entry.status === '불참') {
            absent += 1;
        } else {
            pending += 1;
        }
    });

    countAttend.textContent = attend;
    countAbsent.textContent = absent;
    countPending.textContent = pending;
}
