// --- DATA & STATE ---
const STORAGE_KEY = 'devtracker_state';
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let timerInterval = null;

// --- CORE LOGIC ---
function saveState() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
	render();
}

function addTask() {
	const titleInput = document.getElementById('task-input');
	const catInput = document.getElementById('category-input');

	const title = titleInput.value.trim();
	const category = catInput.value.trim() || 'General';

	if (!title) return;

	tasks.push({
		id: Date.now().toString(),
		title,
		category,
		completed: false,
		timeSpent: 0,
		isRunning: false,
		lastStartTime: null,
	});

	titleInput.value = '';
	saveState();
}

function toggleComplete(id, element) {
	const task = tasks.find((t) => t.id === id);
	task.completed = !task.completed;

	if (task.completed) {
		if (task.isRunning) toggleTimer(id); // Stop timer if running
		burstConfettiAtElement(element);
	}
	saveState();
}

function deleteTask(id) {
	tasks = tasks.filter((t) => t.id !== id);
	saveState();
}

function toggleTimer(id) {
	const task = tasks.find((t) => t.id === id);
	const now = Date.now();

	if (task.isRunning) {
		// Pause it
		task.timeSpent += Math.floor((now - task.lastStartTime) / 1000);
		task.isRunning = false;
		task.lastStartTime = null;
	} else {
		// Play it - Stop all other timers first (Focus mode)
		tasks.forEach((t) => {
			if (t.isRunning) {
				t.timeSpent += Math.floor((now - t.lastStartTime) / 1000);
				t.isRunning = false;
			}
		});
		task.isRunning = true;
		task.lastStartTime = now;
	}
	saveState();
}

// --- TIMER LOOP ---
setInterval(() => {
	const now = Date.now();
	let needsSave = false;

	tasks.forEach((task) => {
		if (task.isRunning) {
			const currentRunTime = Math.floor((now - task.lastStartTime) / 1000);
			const totalTime = task.timeSpent + currentRunTime;

			const el = document.getElementById(`time-${task.id}`);
			if (el) el.textContent = formatTime(totalTime);
			needsSave = true; // Timer is actively running
		}
	});

	// Silently save in background every 10 seconds if a timer is running
	if (needsSave && Math.floor(now / 1000) % 10 === 0) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
	}
}, 1000);

function formatTime(totalSeconds) {
	const h = Math.floor(totalSeconds / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	const s = totalSeconds % 60;
	if (h > 0) return `${h}h ${m}m ${s}s`;
	return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// --- UI RENDER ---
function render() {
	const container = document.getElementById('app-container');
	const dataList = document.getElementById('category-list');

	// Group tasks by category
	const categories = {};
	tasks.forEach((t) => {
		if (!categories[t.category]) categories[t.category] = [];
		categories[t.category].push(t);
	});

	// Update datalist for auto-complete
	dataList.innerHTML = Object.keys(categories)
		.map((c) => `<option value="${c}">`)
		.join('');

	// Render DOM
	container.innerHTML = Object.keys(categories)
		.map(
			(catName) => `
                <div class="category-card">
                    <div class="category-header">
                        <span>📁 ${catName}</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted)">
                            ${categories[catName].filter((t) => t.completed).length}/${categories[catName].length}
                        </span>
                    </div>
                    <ul class="entity-list">
                        ${categories[catName]
													.map(
														(task) => `
                            <li class="entity-item ${task.completed ? 'completed' : ''}">
                                <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleComplete('${task.id}', this)">
                                <span class="entity-name">${task.title}</span>

                                <div class="timer-controls">
                                    <span class="timer-display" id="time-${task.id}">
                                        ${formatTime(task.isRunning ? task.timeSpent + Math.floor((Date.now() - task.lastStartTime) / 1000) : task.timeSpent)}
                                    </span>
                                    <button class="btn-icon play ${task.isRunning ? 'active' : ''}" onclick="toggleTimer('${task.id}')" ${task.completed ? 'disabled' : ''}>
                                        ${task.isRunning ? '⏸' : '▶'}
                                    </button>
                                    <button class="btn-icon delete" onclick="deleteTask('${task.id}')">🗑</button>
                                </div>
                            </li>
                        `
													)
													.join('')}
                    </ul>
                </div>
            `
		)
		.join('');
}

// --- EVENT LISTENERS ---
document.getElementById('add-btn').addEventListener('click', addTask);
document.getElementById('task-input').addEventListener('keypress', (e) => {
	if (e.key === 'Enter') addTask();
});
document.getElementById('category-input').addEventListener('keypress', (e) => {
	if (e.key === 'Enter') addTask();
});

// --- CONFETTI (Simplified for MVP) ---
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function burstConfettiAtElement(el) {
	const rect = el.getBoundingClientRect();
	for (let i = 0; i < 40; i++) {
		particles.push({
			x: rect.left + rect.width / 2,
			y: rect.top + rect.height / 2,
			vx: (Math.random() - 0.5) * 10,
			vy: (Math.random() - 1) * 10 - 2,
			life: 1,
			color: ['#10b981', '#34d399', '#f59e0b', '#6366f1'][
				Math.floor(Math.random() * 4)
			],
		});
	}
	animate();
}

function animate() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	let alive = false;
	particles.forEach((p) => {
		p.x += p.vx;
		p.y += p.vy;
		p.vy += 0.2;
		p.life -= 0.02;
		if (p.life > 0) {
			alive = true;
			ctx.globalAlpha = p.life;
			ctx.fillStyle = p.color;
			ctx.fillRect(p.x, p.y, 6, 6);
		}
	});
	particles = particles.filter((p) => p.life > 0);
	if (alive) requestAnimationFrame(animate);
	else ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// INIT
render();
