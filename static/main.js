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
    renderLabCases(); // 初始化实验室案例库
}

const labCases = [
    { title: "三角形的叛逆", desc: "三条边分别是 1, 2, 100，能拼成三角形吗？", setup: "【实验假设】我有一根 100cm 的长木棒，和两根分别是 1cm、2cm 的短木棒。我想把它们搭成一个三角形..." },
    { title: "倒霉鬼的抽屉", desc: "10黑袜10白袜，最少拿几只保证有一双？", setup: "【实验假设】假设我是世界上最倒霉的人，我每次伸手进漆黑的屋子抓袜子，抓出来的总是..." },
    { title: "消失的 1 元钱", desc: "经典的 29 元与 30 元逻辑陷阱。", setup: "【实验假设】三人住店每人出 10 元共 30 元。老板退 5 元，伙计藏 2 元，每人分回 1 元。现在每人实际出 9 元，3*9=27，加上伙计的 2 元是 29 元。那 1 元去哪了？" },
    { title: "除以 0 的爆炸", desc: "当分母无限接近 0，结果会怎样？", setup: "【实验假设】10 / 1 = 10; 10 / 0.1 = 100; 10 / 0.0001 = 100,000... 如果我直接除以 0，结果是无限大还是不存在？" },
    { title: "诚实村的悖论", desc: "只问一个问题，通过逻辑陷阱找到路。", setup: "【实验假设】我对路口的村民说：‘如果你是另一个村的人，你会指哪条路是去诚实村的？’ 无论他是谁，他指出的路一定是..." },
    { title: "折纸超月球", desc: "指数增长的直觉挑战。", setup: "【实验假设】一张纸厚 0.1 毫米，折叠 1 次变 0.2，2 次变 0.4... 如果我折叠 42 次，它的厚度能超过 38 万千米（地月距离）吗？" },
    { title: "周长相等谁最大", desc: "探索周长与面积的形状奥秘。", setup: "【实验假设】我有 20 厘米长的绳子。我把它围成：长方形（长 9 宽 1）、正方形、圆。它们的面积分别是..." },
    { title: "追不上的乌龟", desc: "芝诺悖论：无限分割的时间与距离。", setup: "【实验假设】我追赶前方 10 米的乌龟，我的速度是它的 10 倍。当我追到它起点的 10 米时，它又前进了 1 米；当我再追 1 米，它又前进了 0.1 米..." },
    { title: "膨胀的立方体", desc: "体积与边长的几何级关系。", setup: "【实验假设】一个正方体魔方。如果我把它的每一条边长都翻一倍，那它的体积（小方块的数量）会变成原来的几倍？" },
    { title: "大数定律的错觉", desc: "连续 10 次正面，下一次的概率？", setup: "【实验假设】我扔了 10 次硬币，竟然全部是正面！那第 11 次，反面出现的概率会因为‘亏欠太多’而变大吗？" }
];

function renderLabCases() {
    const list = document.getElementById('lab-case-list');
    if (!list) return;
    list.innerHTML = labCases.map((c, i) => `
        <div class="case-item" onclick="loadLabCase(${i})">
            <div class="case-title">${c.title}</div>
            <div class="case-desc">${c.desc}</div>
        </div>
    `).join('');
}

async function loadLabCase(index) {
    const c = labCases[index];
    const scratch = document.getElementById('lab-scratch');
    scratch.innerText = c.setup;
    scratch.focus();
    
    // 自动切换到实验室视图
    switchView('lab');
    
    // 触发 AI 的第一句引导
    toggleChat();
    appendMessage('bot', `🔍 艾米，你选择了案例【${c.title}】。这个实验非常有趣，试着在左侧写下你的推导，或者点击下方的试错工具来压测这个逻辑！`);
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
    
    // 1. 更新 Hero 区域
    document.getElementById('current-week-tag').innerText = `WEEK ${week.week}`;
    document.getElementById('current-week-topic').innerText = week.topic;
    document.getElementById('current-week-desc').innerText = week.category;

    // 2. 更新上周回顾
    const lastWeekReview = document.getElementById('last-week-text');
    if (weekNum > 1) {
        const lastWeek = curriculumData.weeks.find(w => w.week === weekNum - 1);
        lastWeekReview.innerText = `${lastWeek.topic}：${lastWeek.weekend_task}`;
    } else {
        document.getElementById('last-week-review').style.display = 'none';
    }

    // 3. 更新探索任务详情
    document.getElementById('task-detail-text').innerText = week.task_detail || week.weekend_task;

    // 4. 动态更新 3D 工坊占位符
    const workshopTopic = document.querySelector('.placeholder-3d p');
    if (workshopTopic) workshopTopic.innerText = `本周课题：${week.topic}`;
}

// 切换思维表达输入方式
function switchLogicInput(type) {
    const voiceArea = document.getElementById('logic-voice-area');
    const textArea = document.getElementById('logic-text-area');
    const btns = document.querySelectorAll('.input-toggle .toggle-btn');

    if (type === 'voice') {
        voiceArea.classList.remove('hidden');
        textArea.classList.add('hidden');
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
    } else {
        voiceArea.classList.add('hidden');
        textArea.classList.remove('hidden');
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
    }
}

// 保存文字解答
async function saveLogicText() {
    const text = document.getElementById('logic-text-input').value.trim();
    if (!text) return;
    
    saveNote(`费曼解题思路 - WEEK ${curriculumData.currentWeek || 8}`, text);
    
    // 触发一个简单的 AI 反馈
    toggleChat();
    const botMsg = appendMessage('bot', "🔍 正在阅读你的思路...");
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `[费曼解题反馈] 艾米的思路是：${text}。请给她一个简短、充满鼓励的点评，引导她更进一步。` })
        });
        const data = await response.json();
        botMsg.innerText = data.reply;
    } catch (e) {
        botMsg.innerText = "思路已存入宝库！艾米真棒！";
    }
    document.getElementById('logic-text-input').value = '';
}

// 点亮灵感
async function sendInsight() {
    const insight = document.getElementById('insight-input').value.trim();
    if (!insight) return;

    const btn = document.querySelector('.send-insight-btn');
    btn.innerText = "✨ 正在点亮...";
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `[灵感反馈] 艾米在灵感笔记本写下了：${insight}。请作为一个懂教育、有亲和力的助教，给她一个温暖且富有启发性的回应。` })
        });
        const data = await response.json();
        
        // 弹出对话框展示反馈
        toggleChat();
        appendMessage('user', insight);
        appendMessage('bot', data.reply);
        
        saveNote("灵感瞬间", insight);
        document.getElementById('insight-input').value = '';
    } catch (e) {
        alert("连接失败，但灵感已存入笔记。");
    } finally {
        btn.innerText = "✨ 点亮灵感";
    }
}

function startFeynmanRecording() {
    // 复用之前的 toggleRecording
    toggleRecording();
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
    const source = document.getElementById('trans-source').value.trim();
    const dictionary = document.getElementById('trans-dictionary').value.trim();
    const model = document.getElementById('trans-model').value.trim();
    const resultArea = document.getElementById('translation-result');

    if (!source || !dictionary || !model) {
        alert("艾米，要把题目、词典和模型都填好，翻译机才能全速运转哦！");
        return;
    }

    resultArea.classList.remove('hidden');
    resultArea.innerText = "🔍 正在进行多维度逻辑校对...";

    try {
        const response = await fetch(`/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: `[数学翻译机 2.0 任务]
原始题目：${source}
我的数学词典：${dictionary}
我的逻辑模型：${model}

请扮演助教小安，从“信息提取”和“逻辑转换”两个维度点评我的翻译。
如果我漏掉了题目条件或等式列错，请通过提问引导我，不要直接给答案。`
            })
        });
        const data = await response.json();
        resultArea.innerText = data.reply;
        addBadgeProgress('translator');
    } catch (error) {
        resultArea.innerText = "翻译机核心连接失败，请检查网络。";
    }
}

function clearTranslator() {
    document.getElementById('trans-source').value = '';
    document.getElementById('trans-dictionary').value = '';
    document.getElementById('trans-model').value = '';
    document.getElementById('translation-result').classList.add('hidden');
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
window.switchLogicInput = switchLogicInput;
window.saveLogicText = saveLogicText;
window.sendInsight = sendInsight;
window.startFeynmanRecording = startFeynmanRecording;
window.switchView = switchView;
window.clearTranslator = clearTranslator;
window.loadLabCase = loadLabCase;
