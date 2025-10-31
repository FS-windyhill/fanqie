/* ==================== 全局变量 ==================== */
// 默认 API（开箱即食）
const DEFAULT_API = {
  url: "https://api.siliconflow.cn/v1/chat/completions",
  key: "sk-mvhfuozxnqmthysxdmhmxuxbsrcssgzjxlhtrokckcdcrbop",
  model: "THUDM/glm-4-9b-chat"
};

// DOM 元素
let avatar, startBtn, resetBtn, timerText, thinking, progressCircle;
let settingsBtn, settingsPanel, appearanceBtn, appearancePanel;
let personalityInput, saveBtn, closeBtn, appearanceSave, appearanceClose;
let taskInput, stats, historyBtn, historyPanel, historyList, clearHistoryBtn, closeHistoryBtn;
let bgSelect, bgUpload, containerBgColor, containerOpacityInput, opacityValue, themeColorInput;
let changeAvatarBtn, avatarUpload, avatarPreview, mainAvatar, resetAvatarBtn;
let workMinutesInput;
let apiProviderSelect;

// API 面板相关
const apiBtn = document.getElementById('api-btn');
const apiPanel = document.getElementById('api-panel');
const apiClose = document.getElementById('api-close');
const apiSave = document.getElementById('api-save');
const apiUrlInput = document.getElementById('api-url');
const apiKeyInput = document.getElementById('api-key');
const apiModelInput = document.getElementById('api-model');
const apiStatus = document.getElementById('api-status'); // 你 HTML 里要加这个 <span id="api-status"></span>

/* ==================== 状态 ==================== */
let personality = localStorage.getItem("tomatoPersonality") || "你是一个可爱的西红柿学习搭子。";
let currentTask = localStorage.getItem("currentTask") || "";
let completedTomatoes = parseInt(localStorage.getItem("completedTomatoes") || "0", 10);
let sessionCount = parseInt(localStorage.getItem("sessionCount") || "0", 10);
let history = JSON.parse(localStorage.getItem("tomatoHistory") || "[]");

let bgStyle = localStorage.getItem("bgStyle") || "gradient1";
let bgImage = localStorage.getItem("bgImage") || "";
let containerColor = localStorage.getItem("containerColor") || "#ffffff";
let containerOpacity = localStorage.getItem("containerOpacity") || "100";
let themeColor = localStorage.getItem("themeColor") || "#ff6b6b";

let workMinutes = parseInt(localStorage.getItem("workMinutes") || "25", 10);

let timer = null;
let timeLeft = workMinutes * 60;
let totalTime = workMinutes * 60;
let isRunning = false;
let expectedEndTime = null;

const CIRCUMFERENCE = 527;

/* ==================== 获取当前 API 配置 ==================== */
function getApiConfig() {
  const provider = localStorage.getItem('apiProvider') || 'openai';

  const customUrl = localStorage.getItem('customApiUrl')?.trim();
  const customKey = localStorage.getItem('customApiKey')?.trim();
  const customModel = localStorage.getItem('customApiModel')?.trim();

  const isFullCustom = customUrl && customKey && customModel;

  if (isFullCustom) {
    return {
      provider,
      url: customUrl,
      key: customKey,
      model: customModel,
      isCustom: true
    };
  } else {
    // 使用默认（OpenAI 兼容）
    return {
      provider: 'openai',
      url: DEFAULT_API.url,
      key: DEFAULT_API.key,
      model: DEFAULT_API.model,
      isCustom: false
    };
  }
}


/* ==================== 测试自定义 API ==================== */
async function testApiConnectionManually() {
  const statusEl = apiStatus;
  if (!statusEl) return;

  const url = apiUrlInput.value.trim();
  const key = apiKeyInput.value.trim();
  const model = apiModelInput.value.trim();

  if (!url || !key || !model) {
    statusEl.innerHTML = '请完整填写三项<br>或点【使用默认】';
    statusEl.className = 'status-failure';
    return;
  }

  statusEl.textContent = '连接中…';
  statusEl.className = 'status-pending';

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1
      })
    });

    if (response.ok) {
      statusEl.innerHTML = '√ 已连接';
      statusEl.className = 'status-success';
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (err) {
    statusEl.innerHTML = '× 连接失败';
    statusEl.className = 'status-failure';
    console.error("API 测试失败：", err);
  }
}

/* ==================== 测试默认 API ==================== */
async function testDefaultApi() {
  const statusEl = apiStatus;
  if (!statusEl) return;

  statusEl.textContent = '连接中…';
  statusEl.className = 'status-pending';

  try {
    const response = await fetch(DEFAULT_API.url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEFAULT_API.key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: DEFAULT_API.model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1
      })
    });

    if (response.ok) {
      statusEl.innerHTML = '√ 已连接';
      statusEl.className = 'status-success';
      statusEl.title = '默认 API 连接成功';
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (err) {
    statusEl.innerHTML = '× 连接失败';
    statusEl.className = 'status-failure';
    console.error("默认 API 测试失败：", err);
  }
}

/* ==================== 页面加载完成后初始化 ==================== */
window.onload = function() {
  // 每天自动清零
  const today = new Date().toLocaleDateString('zh-CN');
  const lastDate = localStorage.getItem("lastTomatoDate");
  if (lastDate !== today) {
    localStorage.setItem("completedTomatoes", "0");
    completedTomatoes = 0;
    localStorage.setItem("lastTomatoDate", today);
  } else {
    completedTomatoes = parseInt(localStorage.getItem("completedTomatoes") || "0", 10);
  }

  // 获取 DOM
  avatar = document.getElementById("avatar");
  startBtn = document.getElementById("start-btn");
  resetBtn = document.getElementById("reset-btn");
  timerText = document.getElementById("timer-text");
  thinking = document.getElementById("thinking");
  progressCircle = document.querySelector(".progress-ring__circle");
  settingsBtn = document.getElementById("settings-btn");
  settingsPanel = document.getElementById("settings-panel");
  appearanceBtn = document.getElementById("appearance-btn");
  appearancePanel = document.getElementById("appearance-panel");
  personalityInput = document.getElementById("personality");
  saveBtn = document.getElementById("save-btn");
  closeBtn = document.getElementById("close-btn");
  appearanceSave = document.getElementById("appearance-save");
  appearanceClose = document.getElementById("appearance-close");
  taskInput = document.getElementById("task-name");
  stats = document.getElementById("stats");
  historyBtn = document.getElementById("history-btn");
  historyPanel = document.getElementById("history-panel");
  historyList = document.getElementById("history-list");
  clearHistoryBtn = document.getElementById("clear-history");
  closeHistoryBtn = document.getElementById("close-history");
  bgSelect = document.getElementById("bg-select");
  bgUpload = document.getElementById("bg-upload");
  containerBgColor = document.getElementById("container-bg-color");
  containerOpacityInput = document.getElementById("container-opacity");
  opacityValue = document.getElementById("opacity-value");
  themeColorInput = document.getElementById("theme-color");
  changeAvatarBtn = document.getElementById("change-avatar-btn");
  avatarUpload = document.getElementById("avatar-upload");
  avatarPreview = document.querySelector("#avatar-preview img");
  mainAvatar = document.getElementById("avatar");
  resetAvatarBtn = document.getElementById("reset-avatar-btn");
  workMinutesInput = document.getElementById("work-minutes");
  apiProviderSelect = document.getElementById('api-provider');

  // 初始化
  taskInput.value = currentTask;
  workMinutesInput.value = workMinutes;

  const savedAvatar = localStorage.getItem("customAvatar");
  if (savedAvatar && mainAvatar && avatarPreview) {
    mainAvatar.src = savedAvatar;
    avatarPreview.src = savedAvatar;
  }

  applyAppearance();
  updateTimer();
  updateStats();
  thinking.textContent = "戳我一下试试～";

  // 绑定事件
  bindEvents();

  // 【关键】加载时填充 API 输入框 + 测试连接
  const saved = {
    url: localStorage.getItem('customApiUrl'),
    key: localStorage.getItem('customApiKey'),
    model: localStorage.getItem('customApiModel')
  };
  if (apiUrlInput) apiUrlInput.value = saved.url || DEFAULT_API.url;
  if (apiKeyInput) apiKeyInput.value = saved.key || '';
  if (apiModelInput) apiModelInput.value = saved.model || DEFAULT_API.model;

};

/* ==================== 绑定所有事件 ==================== */
function bindEvents() {
  // 面板切换
  if (settingsBtn) settingsBtn.addEventListener("click", openSettings);
  if (appearanceBtn) appearanceBtn.addEventListener("click", openAppearance);
  if (historyBtn) historyBtn.addEventListener("click", openHistory);

  // 保存设置
  if (saveBtn) saveBtn.addEventListener("click", saveSettings);
  if (appearanceSave) appearanceSave.addEventListener("click", saveAppearance);
  if (closeBtn) closeBtn.addEventListener("click", () => settingsPanel.style.display = "none");
  if (appearanceClose) appearanceClose.addEventListener("click", () => appearancePanel.style.display = "none");
  if (closeHistoryBtn) closeHistoryBtn.addEventListener("click", () => historyPanel.style.display = "none");

  // 背景上传
  if (document.getElementById("bg-upload-btn")) {
    document.getElementById("bg-upload-btn").addEventListener("click", () => {
      bgUpload.click();
    });
  }

  if (bgUpload) {
  bgUpload.addEventListener("change", handleBgUpload);
  } 

  // 透明度滑块
  if (containerOpacityInput) containerOpacityInput.addEventListener("input", () => {
    opacityValue.textContent = containerOpacityInput.value + "%";
    document.querySelector(".container").style.opacity = containerOpacityInput.value / 100;
  });

  // 头像上传
  if (changeAvatarBtn) changeAvatarBtn.addEventListener("click", () => avatarUpload.click());
  if (avatarUpload) avatarUpload.addEventListener("change", handleAvatarUpload);
  if (resetAvatarBtn) resetAvatarBtn.addEventListener("click", resetToDefaultAvatar);

  // 任务输入
  if (taskInput) taskInput.addEventListener("change", () => {
    currentTask = taskInput.value.trim();
    localStorage.setItem("currentTask", currentTask);
  });

  // 头像点击
  if (avatar) avatar.addEventListener("click", () => speak(`我现在准备完成${currentTask}，但是我有时候也会分心来找你。我现在来找你啦！你想说啥就说啥，不必拘束，比如督促我专心完成任务，或者关心我一下，想说什么都行，不过不要长篇大论哦。`, true));
  
  // 开始 / 暂停
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      if (isRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
    });
  }

  // API 面板
  if (apiBtn) apiBtn.addEventListener('click', openApiPanel);
  if (apiClose) apiClose.addEventListener('click', () => apiPanel.style.display = 'none');
  const apiSaveTestBtn = document.getElementById('api-save-test');
  if (apiSaveTestBtn) {
    apiSaveTestBtn.addEventListener('click', saveAndTestApiConfig);
  }

  // 在 bindEvents() 中添加
  const apiDefaultBtn = document.getElementById('api-default');
  if (apiDefaultBtn) {
    apiDefaultBtn.addEventListener('click', () => {
      if (confirm('确定恢复默认 API 配置？')) {
        // 清空存储和输入框
        localStorage.removeItem('customApiUrl');
        localStorage.removeItem('customApiKey');
        localStorage.removeItem('customApiModel');

        if (apiUrlInput) apiUrlInput.value = DEFAULT_API.url;
        if (apiKeyInput) apiKeyInput.value = '';
        if (apiModelInput) apiModelInput.value = '';

        speak('我回来啦。', false);

        // 直接测试默认 API
        testDefaultApi();
      }
    });
  }

  // 清零
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("确定要清零当前番茄吗？进度将丢失哦。")) {
        clearInterval(timer);
        isRunning = false;
        totalTime = workMinutes * 60;
        timeLeft = totalTime;
        updateTimer();
        startBtn.textContent = "开始专注";
        startBtn.classList.remove("paused");
        resetBtn.classList.remove("show");
        speak("番茄钟已清零！重新开始吧～", false);
      }
    });
  }

  // 清空历史
  if (clearHistoryBtn) clearHistoryBtn.addEventListener("click", () => {
    if (confirm("确定清空所有历史记录？")) {
      history = [];
      localStorage.setItem("tomatoHistory", "[]");
      renderHistory();
    }
  });

  // 字数限制 
  const personalityTextarea = document.getElementById("personality");
  const charCountSpan = document.getElementById("char-count");
  const MAX_CHARS = 1500;

  if (personalityTextarea && charCountSpan) {
    const updateCharCount = () => {
      const current = personalityTextarea.value.length;
      const remaining = MAX_CHARS - current;
      charCountSpan.textContent = `您还可以输入 ${remaining} 字`;

      if (remaining < 0) {
        charCountSpan.textContent = `已超出 ${-remaining} 字`;
        charCountSpan.classList.add("warning");
        personalityTextarea.classList.add("warning");
      } else if (remaining <= 50) {
        charCountSpan.classList.add("warning");
        personalityTextarea.classList.add("warning");
      } else {
        charCountSpan.classList.remove("warning");
        personalityTextarea.classList.remove("warning");
      }
    };

    updateCharCount();
    personalityTextarea.addEventListener("input", () => {
      const value = personalityTextarea.value;
      if (value.length > MAX_CHARS) {
        personalityTextarea.value = value.substring(0, MAX_CHARS);
      }
      updateCharCount();
    });
    settingsBtn.addEventListener("click", updateCharCount);
  }

  // 复制当天
  const copyTodayBtn = document.getElementById("copy-today");
  if (copyTodayBtn) {
    copyTodayBtn.addEventListener("click", () => copyHistoryByDate("today"));
  }

  // 复制全部
  const copyAllBtn = document.getElementById("copy-all");
  if (copyAllBtn) {
    copyAllBtn.addEventListener("click", () => copyHistoryByDate("all"));
  }

  // 复制函数
  function copyHistoryByDate(mode) {
    if (!history.length) {
      alert("暂无历史记录可复制！");
      return;
    }

    const today = new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'numeric', day:'numeric' });
    let lines = [];

    if (mode === "today") {
      lines.push(`历史番茄记录（${today}）`);
      history
        .filter(it => it.date === today)
        .forEach(it => {
          lines.push(`${it.task || "无任务"} - ${it.minutes}分钟 - ${it.time || ""}`);
        });
    } else {
      lines.push("历史番茄记录");
      const grouped = {};
      history.forEach(it => {
        if (!grouped[it.date]) grouped[it.date] = [];
        grouped[it.date].push(it);
      });
      Object.keys(grouped).sort().reverse().forEach(date => {
        lines.push(`\n${date}`);
        grouped[date].forEach(it => {
          lines.push(`${it.task || "无任务"} - ${it.minutes}分钟 - ${it.time || ""}`);
        });
      });
    }

    const text = lines.join("\n").trim();
    navigator.clipboard.writeText(text).then(() => {
      const btn = mode === "today" ? copyTodayBtn : copyAllBtn;
      const original = btn.textContent;
      btn.textContent = "√";
      btn.style.opacity = "0.8";
      speak(mode === "today" ? "当天记录已复制！" : "全部记录已复制！", false);
      setTimeout(() => {
        btn.textContent = original;
        btn.style.opacity = "1";
      }, 1500);
    });
  }

}

/* ==================== 面板打开函数 ==================== */
function openSettings() {
  personalityInput.value = personality;
  workMinutesInput.value = workMinutes;
  avatarPreview.src = mainAvatar.src;

  settingsPanel.style.display = "block";
  appearancePanel.style.display = "none";
  historyPanel.style.display = "none";
}

function openAppearance() {
  bgSelect.value = bgStyle;
  containerBgColor.value = containerColor;
  containerOpacityInput.value = containerOpacity;
  opacityValue.textContent = containerOpacity + "%";
  themeColorInput.value = themeColor;

  appearancePanel.style.display = "block";
  settingsPanel.style.display = "none";
  historyPanel.style.display = "none";
}

function openHistory() {
  renderHistory();
  historyPanel.style.display = "block";
  settingsPanel.style.display = "none";
  appearancePanel.style.display = "none";
}

/* ==================== 保存设置 ==================== */
function saveSettings() {
  let inputText = personalityInput.value.trim();
  if (inputText.length > 1500) {
    inputText = inputText.substring(0, 1500);
    alert("人设已自动截断至 1500 字！");
  }
  personality = inputText || "-姓名：\n-性别：\n-身份：\n-性格：\n-对用户的称呼：\n-和用户的关系：";
  workMinutes = parseInt(workMinutesInput.value, 10) || 25;

  localStorage.setItem("tomatoPersonality", personality);
  localStorage.setItem("apiUrl", API_URL);
  localStorage.setItem("apiKey", API_KEY);
  localStorage.setItem("apiModel", API_MODEL);
  localStorage.setItem("workMinutes", workMinutes);

  // 保存设置，但不影响当前计时
  localStorage.setItem("tomatoPersonality", personality);
  localStorage.setItem("apiUrl", API_URL);
  localStorage.setItem("apiKey", API_KEY);
  localStorage.setItem("apiModel", API_MODEL);
  localStorage.setItem("workMinutes", workMinutes);

  // 只更新输入框，不动计时器
  settingsPanel.style.display = "none";

  // 判断是否正在计时
  if (isRunning) {
    // 正在计时 → 延迟生效
    speak("设置已保存！下个番茄钟生效", false);
  } else {
    // 空闲状态 → 立即生效
    const latestWorkMinutes = parseInt(workMinutesInput.value, 10) || 25;
    totalTime = latestWorkMinutes * 60;
    timeLeft = totalTime;
    updateTimer();
    speak("设置已保存！立即生效", false);
  }
}

function saveAppearance() {
  bgStyle = bgSelect.value;
  containerColor = containerBgColor.value;
  containerOpacity = containerOpacityInput.value;
  themeColor = themeColorInput.value;

  localStorage.setItem("bgStyle", bgStyle);
  if (bgStyle === "custom") localStorage.setItem("bgImage", bgImage);
  localStorage.setItem("containerColor", containerColor);
  localStorage.setItem("containerOpacity", containerOpacity);
  localStorage.setItem("themeColor", themeColor);

  applyAppearance();
  appearancePanel.style.display = "none";
  speak("番茄钟外观已保存！", false);
}

/* ==================== 背景上传 ==================== */
function handleBgUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    bgImage = ev.target.result;
    bgStyle = "custom";
    bgSelect.value = "custom";
    applyAppearance();
  };
  reader.readAsDataURL(file);
}

/* ==================== 头像处理 ==================== */
function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const dataUrl = ev.target.result;
    mainAvatar.src = dataUrl;
    avatarPreview.src = dataUrl;
    localStorage.setItem("customAvatar", dataUrl);
    speak("头像换好啦！", false);
  };
  reader.readAsDataURL(file);
}

function resetToDefaultAvatar() {
  mainAvatar.src = "avatar.jpg";
  avatarPreview.src = "avatar.jpg";
  localStorage.removeItem("customAvatar");
  speak("已恢复默认头像～", false);
}

// 在 JS 文件顶部或 applyAppearance 前定义
function addAlpha(color, alpha) {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ==================== 外观应用 ==================== */
function applyAppearance() {
  const body = document.body;
  const container = document.querySelector(".container");

  /* ---------- 1. 背景 ---------- */
  if (bgStyle === "custom" && bgImage) {
    body.style.background = `url(${bgImage}) center/cover no-repeat`;
  } else if (bgStyle === "gradient5") {
    body.style.background = `url('wallpaper.jpg') center/cover no-repeat fixed`;
  } else {
    const gradients = {
      gradient1: "linear-gradient(to bottom, #a1c4fd, #c2e9fb)",
      gradient2: "linear-gradient(to bottom, #cdb4db, #ffc8dd)",
      gradient3: "linear-gradient(to bottom, #a7f3d0, #d9f7be)",
      gradient4: "linear-gradient(to bottom, #ffffff, #ffffff)"
    };
    body.style.background = gradients[bgStyle] || gradients.gradient1;
  }

  /* ---------- 2. 容器 ---------- */
  container.style.backgroundColor = containerColor;
  container.style.opacity = containerOpacity / 100;

  /* ---------- 3. 主题色 CSS 变量 ---------- */
  const r = parseInt(themeColor.slice(1, 3), 16);
  const g = parseInt(themeColor.slice(3, 5), 16);
  const b = parseInt(themeColor.slice(5, 7), 16);
  document.documentElement.style.setProperty('--theme-color', themeColor);
  document.documentElement.style.setProperty('--theme-rgb', `${r}, ${g}, ${b}`);

  /* ---------- 4. 文字 / 边框颜色 ---------- */
  [timerText, thinking, stats, taskInput].forEach(el => {
    if (el && el.tagName === "INPUT") {
      el.style.borderColor = themeColor;
      el.style.color = themeColor;
    } else if (el) {
      el.style.color = themeColor;
    }
  });

  if (startBtn) {
    startBtn.style.backgroundColor = themeColor;
    startBtn.style.color = "#fff";
  }
  if (progressCircle) progressCircle.style.stroke = themeColor;

  /* ---------- 5. 统一阴影（全部使用主题色） ---------- */
  const themeShadow = `0 0 12px ${addAlpha(themeColor, 0.5)}`;   // 普通发光
  const focusShadow = `0 0 0 3px ${addAlpha(themeColor, 0.25)}`; // focus 光圈

  // 1. .warning
  document.querySelectorAll('.warning').forEach(el => {
    el.style.boxShadow = themeShadow;
    el.style.borderColor = themeColor;
  });

  // 2. .control-btn（开始、暂停、重置）
  document.querySelectorAll('.control-btn').forEach(btn => {
    btn.style.boxShadow = themeShadow;
  });

  // 3. #avatar
  if (avatar) avatar.style.boxShadow = themeShadow;

  // 4. .digital-timer
  const digitalTimer = document.querySelector('.digital-timer');
  if (digitalTimer) digitalTimer.style.textShadow = themeShadow;   // 如果是文字发光可改成 textShadow

  /* ---------- 6. task‑name 输入框（淡背景 + focus 光圈） ---------- */
  const taskInputEl = document.querySelector('#task-name');
  if (taskInputEl) {
    // 默认
    taskInputEl.style.backgroundColor = addAlpha(themeColor, 0.1);
    taskInputEl.style.borderColor = themeColor;
    taskInputEl.style.color = themeColor;
    taskInputEl.style.boxShadow = 'none';
    taskInputEl.style.outline = 'none';

    // 聚焦
    taskInputEl.addEventListener('focus', () => {
      taskInputEl.style.boxShadow = focusShadow;
      taskInputEl.style.backgroundColor = addAlpha(themeColor, 0.18);
    });
    // 失焦
    taskInputEl.addEventListener('blur', () => {
      taskInputEl.style.boxShadow = 'none';
      taskInputEl.style.backgroundColor = addAlpha(themeColor, 0.1);
    });
  }
}



/* ==================== 历史记录 ==================== */
function renderHistory() {
  if (!history.length) {
    historyList.innerHTML = "<p style='color:#ccc;text-align:center;'>暂无记录</p>";
    return;
  }

  // 按日期分组
  const grouped = {};
  history.forEach(it => {
    const date = it.date;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(it);
  });

  let html = "";
  Object.keys(grouped).sort().reverse().forEach(date => {
    html += `<div class="history-date">${date}</div>`;
    grouped[date].forEach(it => {
      html += `
        <div class="history-item">
          <strong>${it.task || "无任务"}</strong> - 
          ${it.minutes}分钟 - 
          ${it.time || ""}
        </div>`;
    });
  });

  historyList.innerHTML = html;
}

/* ==================== API 面板控制（新增【连接】按钮）=================== */
const apiTestBtn = document.getElementById('api-test'); // 新增

function openApiPanel() {
  apiPanel.style.display = 'block';

  const savedProvider = localStorage.getItem('apiProvider') || 'openai';
  const savedUrl = localStorage.getItem('customApiUrl');
  const savedKey = localStorage.getItem('customApiKey');
  const savedModel = localStorage.getItem('customApiModel');

  if (apiProviderSelect) apiProviderSelect.value = savedProvider;
  if (apiUrlInput) apiUrlInput.value = savedUrl || (savedProvider === 'openai' ? DEFAULT_API.url : '');
  if (apiKeyInput) apiKeyInput.value = savedKey || '';
  if (apiModelInput) apiModelInput.value = savedModel || '';

  if (apiStatus) {
    apiStatus.textContent = '未测试';
    apiStatus.className = 'status-default';
  }

  // 打开时自动测一次（不影响保存逻辑）
  testApiConnectionManually();

}


// 保存API配置
function saveApiConfig() {
  const url = apiUrlInput.value.trim();
  const key = apiKeyInput.value.trim();
  const model = apiModelInput.value.trim();
  const provider = apiProviderSelect.value;

  if (url && key && model) {
    localStorage.setItem('customApiUrl', url);
    localStorage.setItem('customApiKey', key);
    localStorage.setItem('customApiModel', model);
    localStorage.setItem('apiProvider', provider);
    speak("我回来啦！", false);
  } else {
    localStorage.removeItem('customApiUrl');
    localStorage.removeItem('customApiKey');
    localStorage.removeItem('customApiModel');
    localStorage.setItem('apiProvider', 'openai'); // 默认
    speak("我回来啦。", false);
  }

  apiPanel.style.display = 'none';
}

async function testDefaultApi() {
  const statusEl = apiStatus;
  if (!statusEl) return;

  statusEl.textContent = '连接中…';
  statusEl.className = 'if (apiStatus)';

  try {
    const response = await fetch(DEFAULT_API.url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEFAULT_API.key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: DEFAULT_API.model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1
      })
    });

    if (response.ok) {
      statusEl.innerHTML = '√ 已连接';
      statusEl.className = 'status-success';
      statusEl.title = '默认 API 连接成功';
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (err) {
    statusEl.innerHTML = '× 连接失败';
    statusEl.className = 'status-failure';
    console.error("默认 API 测试失败：", err);
  }
}

// 【关键】独立的连接测试函数
async function testApiConnectionManually() {
  const statusEl = apiStatus;
  if (!statusEl) return;

  const inputUrl = apiUrlInput.value.trim();
  const inputKey = apiKeyInput.value.trim();
  const inputModel = apiModelInput.value.trim();
  const provider = apiProviderSelect.value;  // 获取提供商

  if (!inputUrl || !inputKey || !inputModel) {
    statusEl.innerHTML = '请完整填写三项<br>或点【使用默认】';
    statusEl.className = 'status-failure';
    return;
  }

  statusEl.textContent = '连接中…';
  statusEl.className = 'status-pending';

  try {
    let response;

    if (provider === 'gemini') {
      // ===== Gemini 测试请求 =====
      const modelUrl = inputUrl.includes(':generateContent') 
        ? inputUrl 
        : `${inputUrl}?key=${inputKey}`;  // 如果 URL 不含 key，自动添加（备用）

      response = await fetch(modelUrl, {
        method: "POST",
        headers: {
          "x-goog-api-key": inputKey,  // 【关键】Gemini 用这个头！
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: "ping" }]  // Gemini 风格：parts.text
            }
          ],
          generationConfig: {
            maxOutputTokens: 1,
            temperature: 0.9
          }
        })
      });

    } else if (provider === 'claude') {
      // ===== Claude 测试 =====
      response = await fetch(inputUrl, {
        method: "POST",
        headers: {
          "x-api-key": inputKey,  // Claude 用这个
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: inputModel,
          max_tokens: 1,
          messages: [{ role: "user", content: "ping" }]
        })
      });

    } else {
      // ===== OpenAI 兼容测试（默认）=====
      response = await fetch(inputUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${inputKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: inputModel,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1
        })
      });
    }

    if (response.ok) {
      statusEl.innerHTML = '√ 已连接';
      statusEl.className = 'status-success';
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (err) {
    statusEl.innerHTML = '× 连接失败';
    statusEl.className = 'status-failure';
    console.error("API 测试失败：", err);
  }
}

/** 保存配置 → 立即测试 → 保持面板打开 */
async function saveAndTestApiConfig() {
  // 1. 先保存（和原来的 saveApiConfig 完全一样）
  const url = apiUrlInput.value.trim();
  const key = apiKeyInput.value.trim();
  const model = apiModelInput.value.trim();
  const provider = apiProviderSelect.value;

  if (url && key && model) {
    localStorage.setItem('customApiUrl', url);
    localStorage.setItem('customApiKey', key);
    localStorage.setItem('customApiModel', model);
    localStorage.setItem('apiProvider', provider);
    speak("我回来啦！", false);
  } else {
    localStorage.removeItem('customApiUrl');
    localStorage.removeItem('customApiKey');
    localStorage.removeItem('customApiModel');
    localStorage.setItem('apiProvider', 'openai');
    speak("我回来啦。", false);
  }

  // 2. **不关闭面板**（关键！）
  // apiPanel.style.display = 'none';   <-- 删除这行

  // 3. 立即测试（复用已有的手动测试函数）
  await testApiConnectionManually();
}



/* ==================== 计时器控制 ==================== */
function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startBtn.textContent = "暂停";
  startBtn.classList.add("paused");
  resetBtn.classList.add("show");

  // 关键改动：计算并存储预期的结束时间
  // 如果是从暂停状态恢复，则基于剩余时间计算；如果是全新开始，则基于总时间计算
  expectedEndTime = Date.now() + timeLeft * 1000;

  speak("我开始专注啦！", false);

  // 关键：只有在新番茄开始时，才读取最新时长
  if (!isRunning && (timeLeft <= 0 || timeLeft === totalTime)) {
    const latestWorkMinutes = parseInt(localStorage.getItem("workMinutes") || "25", 10);
    totalTime = latestWorkMinutes * 60;
    timeLeft = totalTime;
    progressCircle.style.strokeDashoffset = 0;
  }

  timer = setInterval(() => {
    // 关键改动：不再是 timeLeft--，而是通过时间差计算
    const remainingMilliseconds = expectedEndTime - Date.now();
    timeLeft = Math.max(0, Math.round(remainingMilliseconds / 1000));
    
    updateTimer();


    if (timeLeft <= 0) {
      clearInterval(timer); 
      isRunning = false;
      startBtn.textContent = "开始专注"; 
      startBtn.classList.remove("paused");
      resetBtn.classList.remove("show");
      
      completedTomatoes++;
      sessionCount++;
      localStorage.setItem("completedTomatoes", completedTomatoes);
      localStorage.setItem("sessionCount", sessionCount);
      updateStats();

      const today = new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'numeric', day:'numeric' });
      const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      history.push({ 
        task: currentTask, 
        date: today, 
        time: now,
        minutes: workMinutes // 使用设定的分钟数，更准确
      });
      localStorage.setItem("tomatoHistory", JSON.stringify(history));

      speak(`我完成了第 ${completedTomatoes} 个番茄！`, false);

      const latestWorkMinutes = parseInt(localStorage.getItem("workMinutes") || "25", 10);
      totalTime = latestWorkMinutes * 60;
      timeLeft = totalTime;

      progressCircle.style.strokeDashoffset = 0;
      updateTimer();
    }
  }, 1000);
}


function pauseTimer() {
  clearInterval(timer); 
  isRunning = false;
  startBtn.textContent = "继续";
  resetBtn.classList.add("show");
  speak("我先暂停一下番茄钟～", false);
}


function updateTimer() {
  const m = Math.floor(timeLeft/60).toString().padStart(2,'0');
  const s = (timeLeft%60).toString().padStart(2,'0');
  timerText.textContent = `${m}:${s}`;
  const progress = timeLeft / totalTime;
  progressCircle.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
}

function updateStats() { 
  stats.textContent = `今日已完成 ${completedTomatoes} 个番茄`; 
}

/* ==================== AI 对话（使用动态 API + 控制台日志）================== */
async function speak(userPrompt, showThinking = true) {
  // 永远显示“对方正在输入...”
  thinking.textContent = "对方正在输入...";
  thinking.style.opacity = "1";
  thinking.style.color = "var(--theme-color)";

  const elapsedSeconds = totalTime - timeLeft;
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const minutesLeft = Math.ceil(timeLeft / 60);
  const taskDisplay = currentTask ? `“${currentTask}”` : "专注";

  const context = `
用户在进行一个番茄钟任务。
- 当前任务：${taskDisplay}
- 今天已完成 ${completedTomatoes} 个番茄
- 距离下次休息还有 ${minutesLeft} 分钟
- 已经专注了 ${elapsedMinutes} 分钟
请参考“已经专注的时间”“距离下次休息的时间”“当前任务”，根据你人设的性格回复用户。人类说话是不会带括号和动作描写的。你想说啥就说啥，不必拘束，不过不要长篇大论哦。你的任务：模仿人类说话，直接输出说话的内容。不要长篇大论哦，简单一点。
`.trim();

  const enhancedPersonality = `用户的角色扮演请求：请完全带入以下角色，并以该角色的语气和思考方式说话。以下是人设：${personality}`;
  const fullPrompt = enhancedPersonality + "\n" + context + "\n\n用户: " + userPrompt;

  // 【保留你原来的控制台日志！】
  console.log("【发送给 AI 的完整 Prompt】\n", fullPrompt);

  const config = getApiConfig();

try {
    let response, data, reply;

    if (config.provider === 'claude') {
      // ===== Claude API =====
      response = await fetch(config.url, {
        method: "POST",
        headers: {
          "x-api-key": config.key,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: config.model,
          system: personality + "\n" + context,
          messages: [{ role: "user", content: userPrompt }],
          max_tokens: 60,
          temperature: 0.9
        })
      });

      if (!response.ok) throw new Error(`Claude ${response.status}`);
      data = await response.json();
      reply = data.content[0].text.trim();

    } else if (config.provider === 'gemini') {
      // ===== Gemini API =====
      let modelUrl;
      if (config.url.includes(':generateContent')) {
        modelUrl = config.url;  // 用户已填完整 URL
      } else {
        // 自动构建：替换模型名到 URL
        const baseUrl = config.url.replace(/\/v1(\/beta)?\/.*/, '/v1beta/models/');  // 假设用户填 base 如 https://generativelanguage.googleapis.com
        modelUrl = `${baseUrl}${config.model}:generateContent`;
      }

      // 如果 URL 没含 ?key=，用 header（推荐）
      const useHeader = !modelUrl.includes('?key=');

      response = await fetch(modelUrl, {
        method: "POST",
        headers: { 
          ...(useHeader ? { "x-goog-api-key": config.key } : {}),  // 【关键】用 header，不是 Bearer
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: fullPrompt }]  // Gemini：单次生成用一个 contents（system + user 合并）
            }
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 60  // Gemini 用这个，不是 max_tokens
          }
        })
      });

      if (!response.ok) throw new Error(`Gemini ${response.status}`);
      data = await response.json();
      reply = data.candidates[0].content.parts[0].text.trim();  // 【确认】官方解析路径

    } else {
      // ===== OpenAI 兼容（默认）=====
      response = await fetch(config.url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: personality + "\n" + context },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.9,
          max_tokens: 60
        })
      });

      if (!response.ok) throw new Error(`OpenAI ${response.status}`);
      data = await response.json();
      reply = data.choices[0].message.content.trim();
    }

    thinking.textContent = reply;

  } catch (err) {
    thinking.textContent = "网络错误，戳我重试~";
    console.error("API 错误：", err);
    if (apiStatus) {
      apiStatus.innerHTML = '× 连接失败';
      apiStatus.className = 'status-failure';
    }
  }
}