// Aimee Portal 1.0 - Core Engine

let curriculumData = null;
const API_BASE = ""; // 在 Vercel 中，前后端同域，使用相对路径即可

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    await loadData();
    renderJourney(8); 
    initNav();
    updateVault();
    initWorkshop();
}

function initWorkshop() {
    const canvas = document.querySelector('.canvas-area');
    // 添加一个简单的互动 SVG
    canvas.innerHTML = `
        <svg viewBox="0 0 200 200" style="width: 100%; height: 100%;">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:var(--accent-primary);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:var(--accent-secondary);stop-opacity:1" />
                </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="80" fill="none" stroke="url(#grad1)" stroke-width="2" stroke-dasharray="5,5">
                <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="20s" repeatCount="indefinite" />
            </circle>
            <text x="100" y="105" text-anchor="middle" fill="var(--accent-primary)" font-size="10" font-weight="bold">思维实验室活跃中</text>
            <path d="M60,100 L140,100 M100,60 L100,140" stroke="var(--glass-border)" stroke-width="1" />
        </svg>
    `;
}

async function loadData() {
    try {
        const response = await fetch('curriculum.json');
        curriculumData = await response.json();
    } catch (error) {
        console.error('Data load failed:', error);
    }
}

function switchView(viewId) {
    // 1. 更新 UI 状态
    document.querySelectorAll('.content-view').forEach(view => {
        view.classList.add('hidden');
    });
    document.getElementById(`view-${viewId}`).classList.remove('hidden');

    // 2. 更新侧边栏激活状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeItem = Array.from(document.querySelectorAll('.nav-item')).find(item => 
        item.getAttribute('onclick').includes(viewId)
    );
    if (activeItem) activeItem.classList.add('active');

    // 3. 更新标题
    const titles = {
        'journey': '每周任务',
        'translator': '数学翻译机',
        'lab': '试错实验室',
        'workshop': '重新发明工坊',
        'studio': '费曼录音棚',
        'upload': '习题册上传',
        'vault': '学习笔记'
    };
    document.getElementById('view-title').innerText = titles[viewId];

    if (viewId === 'upload') initUpload();
}

function initUpload() {
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');

    fileInput.onchange = async (e) => {
        const files = Array.from(e.target.files);
        fileList.innerHTML = '';

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);

            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = `<span>📄</span><span>${file.name}</span><span class="status">上传中...</span>`;
            fileList.appendChild(item);

            try {
                const response = await fetch(`${API_BASE}/upload`, {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    item.querySelector('.status').innerText = '✅ 已同步';
                    item.querySelector('.status').style.color = 'var(--accent-secondary)';
                }
            } catch (error) {
                item.querySelector('.status').innerText = '❌ 失败';
                console.error("Upload failed:", error);
            }
        }
    };
}

function renderJourney(weekNum) {
    if (!curriculumData) return;
    const week = curriculumData.weeks.find(w => w.week === weekNum) || curriculumData.weeks[0];
    
    document.getElementById('current-week-tag').innerText = `WEEK ${week.week}`;
    document.getElementById('current-week-topic').innerText = week.topic;
    document.getElementById('current-week-desc').innerText = week.category;

    const taskList = document.getElementById('task-list');
    taskList.innerHTML = `
        <div class="task-card current">
            <div class="task-icon">📍</div>
            <div class="task-info">
                <h3>本周探索任务</h3>
                <p>${week.weekend_task}</p>
                <div class="mini-progress"><div class="bar" style="width: 40%"></div></div>
            </div>
        </div>
        <div class="task-card" onclick="switchView('studio')">
            <div class="task-icon">🎙️</div>
            <div class="task-info">
                <h3>费曼复盘目标</h3>
                <p>${week.feynman_goal}</p>
                <span class="tap-hint">点击进入录音棚 →</span>
            </div>
        </div>
        <div class="task-card">
            <div class="task-icon">💡</div>
            <div class="task-info">
                <h3>思维方法论</h3>
                <p>${week.methodology}</p>
            </div>
        </div>
    `;

    // 动态更新 3D 工坊占位符
    const workshopTopic = document.querySelector('.placeholder-3d p');
    if (workshopTopic) workshopTopic.innerText = `本周课题：${week.topic}`;
}


function toggleGroup(groupId) {
    const group = document.getElementById(`group-${groupId}`);
    group.classList.toggle('collapsed');
}

function initNav() {
    // 已经在 HTML 中通过 onclick 实现
}

window.switchView = switchView;
window.toggleChat = toggleChat;


function handleChatKey(e) {
    if (e.key === 'Enter') sendChatMessage();
}

async function sendChatMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    if (!message) return;

    appendMessage('user', message);
    input.value = '';

    const botMsgDiv = appendMessage('bot', "..."); // Placeholder for typing

    try {
        const response = await fetch(`/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });
        const data = await response.json();
        
        if (response.ok) {
            botMsgDiv.innerText = data.reply;
        } else {
            console.error("Backend error:", data);
            botMsgDiv.innerHTML = `<span style="color: #ff6b6b">❌ 连接失败: ${data.reply || '未知错误'}</span><br><small style="font-size: 0.7rem; opacity: 0.7">${JSON.stringify(data.debug || data.trace || '')}</small>`;
        }
    } catch (error) {
        botMsgDiv.innerText = "哎呀，连接助教失败了。请检查网络。";
    }
}

function appendMessage(role, text) {
    const chatMessages = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    msgDiv.innerText = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv;
}

async function runTranslation() {
    const step1 = document.getElementById('trans-step-1').value;
    const step2 = document.getElementById('trans-step-2').value;
    const resultArea = document.getElementById('translation-result');

    if (!step1 || !step2) {
        alert("艾米，请先完成白描和建模两个步骤哦！");
        return;
    }

    resultArea.classList.remove('hidden');
    resultArea.innerText = "🔍 正在分析你的翻译逻辑...";

    try {
        const response = await fetch(`/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: `[数学翻译机任务] 题目条件：${step1}。列出的等式：${step2}。请点评我的翻译逻辑，引导我检查是否正确，不要直接给答案。`
            })
        });
        const data = await response.json();
        resultArea.innerText = data.reply;
        addBadgeProgress('translator');
    } catch (error) {
        resultArea.innerText = "分析失败，请检查网络。";
    }
}

async function runExperiment() {
    const scratch = document.getElementById('lab-scratch').innerText;
    const resultArea = document.getElementById('lab-result');

    resultArea.classList.remove('hidden');
    resultArea.innerText = "🧪 正在验证你的试错路径...";

    try {
        const response = await fetch(`/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: `[试错实验室任务] 我的试错记录：${scratch}。请根据我的尝试，引导我发现矛盾点或验证规律。`
            })
        });
        const data = await response.json();
        resultArea.innerText = data.reply;
        addBadgeProgress('lab');
    } catch (error) {
        resultArea.innerText = "实验室连接中断。";
    }
}

function insertLabSnippet(type) {
    const scratch = document.getElementById('lab-scratch');
    const snippets = {
        '0 或 1': "\n[代入尝试] 如果未知数是 0 或 1，会发生：",
        '极大值': "\n[极限尝试] 如果未知数变成 1,000,000，会发生：",
        '反证法': "\n[反证假设] 假设结论不成立，那么："
    };
    scratch.innerText += snippets[type];
    scratch.focus();
}

let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];

async function toggleRecording() {
    const btn = document.querySelector('.record-btn');
    const studio = document.querySelector('.studio-ui');
    
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                saveNote(`费曼复盘录音 - ${new Date().toLocaleString()}`, audioUrl);
                appendMessage('bot', "艾米，你的讲解我已经收到了！录音已存入你的魔法宝库。");
            };
            
            mediaRecorder.start();
            isRecording = true;
            btn.innerText = "■ 停止录制";
            studio.classList.add('recording');
        } catch (err) {
            alert("无法访问麦克风，请检查权限。");
        }
    } else {
        mediaRecorder.stop();
        isRecording = false;
        btn.innerText = "● 开始录制";
        studio.classList.remove('recording');
        
        // 增加成就进度
        addBadgeProgress('studio');
    }
}

function saveNote(title, content) {
    let notes = JSON.parse(localStorage.getItem('aimee_notes') || '[]');
    notes.unshift({ title, content, date: new Date().toISOString() });
    localStorage.setItem('aimee_notes', JSON.stringify(notes));
    updateVault();
}

function addBadgeProgress(type) {
    let progress = JSON.parse(localStorage.getItem('aimee_progress') || '{}');
    progress[type] = (progress[type] || 0) + 1;
    localStorage.setItem('aimee_progress', JSON.stringify(progress));
    updateVault();
}

function updateVault() {
    const spellList = document.querySelector('.spell-card ul');
    const notes = JSON.parse(localStorage.getItem('aimee_notes') || '[]');
    
    if (spellList) {
        spellList.innerHTML = notes.map(n => `
            <li>
                <strong>${n.title}</strong>
                ${n.content.startsWith('blob:') ? `<br><audio controls src="${n.content}"></audio>` : `<p>${n.content}</p>`}
            </li>
        `).join('') || '<li>还没有笔记哦，快去完成任务吧！</li>';
    }

    const progress = JSON.parse(localStorage.getItem('aimee_progress') || '{}');
    const translatorBadge = document.querySelector('.badge-card:nth-child(1)');
    const labBadge = document.querySelector('.badge-card:nth-child(2)');

    if (progress.translator >= 5) translatorBadge.classList.remove('locked');
    if (progress.lab >= 3) labBadge.classList.remove('locked');
}

function toggleChat() {
    const wrapper = document.getElementById('chat-wrapper');
    const toggle = document.getElementById('chat-toggle');
    wrapper.classList.toggle('active');
    toggle.style.display = wrapper.classList.contains('active') ? 'none' : 'flex';
}

// 绑定到 window
window.toggleChat = toggleChat;
window.runTranslation = runTranslation;
window.runExperiment = runExperiment;
window.insertLabSnippet = insertLabSnippet;
window.toggleRecording = toggleRecording;
