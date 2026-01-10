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
const transportOptions = ['', '자가', '대중교통', '카풀', '기타'];

const defaultEntry = {
    status: '미정',
    transport: '',
    departFrom: '',
    departTime: '',
    returnTime: '',
    note: ''
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
        const card = document.createElement('div');
        card.className = 'attendee-card';
        card.dataset.id = id;

        card.appendChild(createNameBlock(name, index));
        card.appendChild(createSelectField('참여 여부', 'status', statusOptions, state[id].status, id));
        card.appendChild(createSelectField('교통수단', 'transport', transportOptions, state[id].transport, id));
        card.appendChild(createInputField('출발지', 'departFrom', 'text', state[id].departFrom, id));
        card.appendChild(createInputField('출발 시간', 'departTime', 'time', state[id].departTime, id));
        card.appendChild(createInputField('귀가 출발', 'returnTime', 'time', state[id].returnTime, id));
        card.appendChild(createInputField('메모', 'note', 'text', state[id].note, id));

        listElement.appendChild(card);
    });
}

function createNameBlock(name, index) {
    const wrapper = document.createElement('div');
    wrapper.className = 'attendee-name';
    const title = document.createElement('strong');
    title.textContent = name;
    const subtitle = document.createElement('span');
    subtitle.textContent = `참석자 ${index + 1}`;
    wrapper.appendChild(title);
    wrapper.appendChild(subtitle);
    return wrapper;
}

function createSelectField(label, key, options, value, id) {
    const field = document.createElement('label');
    field.className = 'field';
    const span = document.createElement('span');
    span.className = 'field-label';
    span.textContent = label;
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

    select.addEventListener('change', (event) => {
        updateEntry(id, key, event.target.value);
    });

    field.appendChild(span);
    field.appendChild(select);
    return field;
}

function createInputField(label, key, type, value, id) {
    const field = document.createElement('label');
    field.className = 'field';
    const span = document.createElement('span');
    span.className = 'field-label';
    span.textContent = label;
    const input = document.createElement('input');
    input.type = type;
    input.name = key;
    input.value = value || '';
    input.placeholder = type === 'time' ? '--:--' : '입력';

    input.addEventListener('input', (event) => {
        updateEntry(id, key, event.target.value);
    });

    field.appendChild(span);
    field.appendChild(input);
    return field;
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
