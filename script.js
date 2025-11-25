/* ==================== 全局变量 ==================== */
const DEFAULT_API = {
  url: "https://api.siliconflow.cn/v1/chat/completions",
  key: "sk-fjhacwxbpfotjroebzysefowbzqfgumrgnwuqwamdngdljti",
  model: "deepseek-ai/DeepSeek-V3.2-Exp"
};
/* 备用key：sk-mvhfuozxnqmthysxdmhmxuxbsrcssgzjxlhtrokckcdcrbop */

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
const apiStatus = document.getElementById('api-status');

/* ==================== 状态 ==================== */
let personality = localStorage.getItem("tomatoPersonality") || "-姓名：\n-性别：\n-身份：\n-性格：\n-对用户的称呼：\n-和用户的关系：\n";
let currentTask = localStorage.getItem("currentTask") || "";
let completedTomatoes = parseInt(localStorage.getItem("completedTomatoes") || "0", 10);
let sessionCount = parseInt(localStorage.getItem("sessionCount") || "0", 10);
let history = JSON.parse(localStorage.getItem("tomatoHistory") || "[]");

let bgStyle = localStorage.getItem("bgStyle") || "gradient5";
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

// 新增：提示音相关
let soundEnabled = localStorage.getItem("soundEnabled") === "true"; 
let notificationSound = null; // 【修改点1】先设为空，不要马上加载，防止iOS卡死

const CIRCUMFERENCE = 527;

/* ==================== 获取当前 API 配置 ==================== */
function getApiConfig() {
  const provider = localStorage.getItem('apiProvider') || 'openai';
  const customUrl = localStorage.getItem('customApiUrl')?.trim();
  const customKey = localStorage.getItem('customApiKey')?.trim();
  const customModel = localStorage.getItem('customApiModel')?.trim();

  const isFullCustom = customUrl && customKey && customModel;

  if (isFullCustom) {
    return { provider, url: customUrl, key: customKey, model: customModel, isCustom: true };
  } else {
    return { provider: 'openai', url: DEFAULT_API.url, key: DEFAULT_API.key, model: DEFAULT_API.model, isCustom: false };
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

/* ==========【修改点2：在此处插入】开始 ========== */
  
  // 2. 移动端音频解锁：用户第一次点击/触摸屏幕时，才创建并加载音频
  const unlockAudio = () => {
    // 只有当 notificationSound 为空时，才去创建它（懒加载）
    if (!notificationSound) {
        notificationSound = new Audio("sounds.wav");
    }

    // 尝试播放一瞬间然后暂停，获取 iOS 的音频播放权限
    notificationSound.play().then(() => {
      notificationSound.pause();
      notificationSound.currentTime = 0;
      console.log("iOS 音频权限已解锁");
    }).catch((e) => {
      console.log("等待交互解锁音频或音频文件加载失败", e);
    });
    
    // 解锁一次后移除监听，节省性能
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
  };
  
  // 绑定监听器，等待用户操作
  document.addEventListener('click', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);

  // 3. (可选) 原来的通知权限请求
  if (Notification.permission === "default") {
    setTimeout(() => {
        // 为了防止 iOS 弹窗和音频冲突，稍微延时一点
      if (confirm("番茄结束时，是否需要发出提醒？\n如果是，请点击【允许通知】")) {
        Notification.requestPermission();
      }
    }, 1200);
  }
  
  /* ==========【修改点2】结束 ========== */

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

  // 初始化提示音开关状态（等会你会在HTML里加一个checkbox，id叫 sound-toggle）
  const soundToggle = document.getElementById("sound-toggle");
  if (soundToggle) {
    soundToggle.checked = soundEnabled;
  }

  const savedAvatar = localStorage.getItem("customAvatar");
  if (savedAvatar && mainAvatar && avatarPreview) {
    mainAvatar.src = savedAvatar;
    avatarPreview.src = savedAvatar;
  }

  // 关键：加载时同步 totalTime 和 timeLeft
  workMinutes = parseInt(localStorage.getItem("workMinutes") || "25", 10);
  totalTime = workMinutes * 60;
  timeLeft = totalTime;

  applyAppearance();
  updateTimer();
  updateStats();
  thinking.textContent = "戳我一下试试～";

  // 绑定事件
  bindEvents();

  // 加载 API 配置
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
  if (settingsBtn) settingsBtn.addEventListener("click", openSettings);
  if (appearanceBtn) appearanceBtn.addEventListener("click", openAppearance);
  if (historyBtn) historyBtn.addEventListener("click", openHistory);

  if (saveBtn) saveBtn.addEventListener("click", saveSettings);
  if (appearanceSave) appearanceSave.addEventListener("click", saveAppearance);
  if (closeBtn) closeBtn.addEventListener("click", () => settingsPanel.style.display = "none");
  if (appearanceClose) appearanceClose.addEventListener("click", () => appearancePanel.style.display = "none");
  if (closeHistoryBtn) closeHistoryBtn.addEventListener("click", () => historyPanel.style.display = "none");

  if (document.getElementById("bg-upload-btn")) {
    document.getElementById("bg-upload-btn").addEventListener("click", () => bgUpload.click());
  }
  if (bgUpload) bgUpload.addEventListener("change", handleBgUpload);

  if (containerOpacityInput) containerOpacityInput.addEventListener("input", () => {
    opacityValue.textContent = containerOpacityInput.value + "%";
    document.querySelector(".container").style.opacity = containerOpacityInput.value / 100;
  });

  if (changeAvatarBtn) changeAvatarBtn.addEventListener("click", () => avatarUpload.click());
  if (avatarUpload) avatarUpload.addEventListener("change", handleAvatarUpload);
  if (resetAvatarBtn) resetAvatarBtn.addEventListener("click", resetToDefaultAvatar);

  if (taskInput) taskInput.addEventListener("change", () => {
    currentTask = taskInput.value.trim();
    localStorage.setItem("currentTask", currentTask);
  });

  if (avatar) avatar.addEventListener("click", () => speak(`我现在准备完成${currentTask}，但是我有时候也会分心来找你。我现在来找你啦！你想说啥就说啥，不必拘束，比如督促我专心完成任务，或者关心我一下，想说什么都行，不过不要长篇大论哦。`, true));

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      if (isRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
    });
  }

  if (apiBtn) apiBtn.addEventListener('click', openApiPanel);
  if (apiClose) apiClose.addEventListener('click', () => apiPanel.style.display = 'none');
  const apiSaveTestBtn = document.getElementById('api-save-test');
  if (apiSaveTestBtn) apiSaveTestBtn.addEventListener('click', saveAndTestApiConfig);

  const apiDefaultBtn = document.getElementById('api-default');
  if (apiDefaultBtn) {
    apiDefaultBtn.addEventListener('click', () => {
      if (confirm('确定恢复默认 API 配置？')) {
        localStorage.removeItem('customApiUrl');
        localStorage.removeItem('customApiKey');
        localStorage.removeItem('customApiModel');
        if (apiUrlInput) apiUrlInput.value = DEFAULT_API.url;
        if (apiKeyInput) apiKeyInput.value = '';
        if (apiModelInput) apiModelInput.value = '';
        speak('我回来啦。', false);
        testDefaultApi();
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("确定要清零当前番茄吗？进度将丢失哦。")) {
        clearInterval(timer);
        isRunning = false;
        const latest = parseInt(localStorage.getItem("workMinutes") || "25", 10);
        totalTime = latest * 60;
        timeLeft = totalTime;
        updateTimer();
        startBtn.textContent = "开始专注";
        startBtn.classList.remove("paused");
        resetBtn.classList.remove("show");
        speak("番茄钟已清零！重新开始吧～", false);
      }
    });
  }

  if (clearHistoryBtn) clearHistoryBtn.addEventListener("click", () => {
    if (confirm("确定清空所有历史记录？")) {
      history = [];
      localStorage.setItem("tomatoHistory", "[]");
      renderHistory();
    }
  });

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

  const copyTodayBtn = document.getElementById("copy-today");
  if (copyTodayBtn) copyTodayBtn.addEventListener("click", () => copyHistoryByDate("today"));
  const copyAllBtn = document.getElementById("copy-all");
  if (copyAllBtn) copyAllBtn.addEventListener("click", () => copyHistoryByDate("all"));

  function copyHistoryByDate(mode) {
    if (!history.length) { alert("暂无历史记录可复制！"); return; }
    const today = new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'numeric', day:'numeric' });
    let lines = [];
    if (mode === "today") {
      lines.push(`历史番茄记录（${today}）`);
      history.filter(it => it.date === today).forEach(it => {
        lines.push(`${it.task || "无任务"} - ${it.minutes}分钟 - ${it.time || ""}`);
      });
    } else {
      lines.push("历史番茄记录");
      const grouped = {};
      history.forEach(it => { grouped[it.date] = grouped[it.date] || []; grouped[it.date].push(it); });
      Object.keys(grouped)
        .sort((a, b) => new Date(b) - new Date(a))  // 重点在这里
        .forEach(date => {
        lines.push(`\n${date}`);
        grouped[date].forEach(it => lines.push(`${it.task || "无任务"} - ${it.minutes}分钟 - ${it.time || ""}`));
      });
    }
    const text = lines.join("\n").trim();
    navigator.clipboard.writeText(text).then(() => {
      const btn = mode === "today" ? copyTodayBtn : copyAllBtn;
      const original = btn.textContent;
      btn.textContent = "√";
      btn.style.opacity = "0.8";
      speak(mode === "today" ? "当天记录已复制！" : "全部记录已复制！", false);
      setTimeout(() => { btn.textContent = original; btn.style.opacity = "1"; }, 1500);
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

/* ==================== 保存设置（关键修复）=================== */
function saveSettings() {
  let inputText = personalityInput.value.trim();
  if (inputText.length > 1500) {
    inputText = inputText.substring(0, 1500);
    alert("人设已自动截断至 1500 字！");
  }
  personality = inputText || "-姓名：\n-性别：\n-身份：\n-性格：\n-对用户的称呼：\n-和用户的关系：\n";
  workMinutes = parseInt(workMinutesInput.value, 10) || 25;

  localStorage.setItem("tomatoPersonality", personality);
  localStorage.setItem("workMinutes", workMinutes);

  settingsPanel.style.display = "none";

  // ========== 【关键修复：空闲时立即刷新界面】==========
  if (!isRunning) {
    const latestMinutes = parseInt(localStorage.getItem("workMinutes") || "25", 10);
    totalTime = latestMinutes * 60;
    timeLeft = totalTime;
    updateTimer();  // <--- 加上这句，立即刷新界面显示
  }

  // 保存提示音开关状态
  const soundToggle = document.getElementById("sound-toggle");
  if (soundToggle) {
    soundEnabled = soundToggle.checked;
    localStorage.setItem("soundEnabled", soundEnabled);
  }

  if (isRunning) {
    speak("设置已保存！下个番茄钟生效", false);
  } else {
    speak("设置已保存！下次开始时生效", false);
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

/* ==================== 背景与头像 ==================== */
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

function addAlpha(color, alpha) {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyAppearance() {
  const body = document.body;
  const container = document.querySelector(".container");

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
    body.style.background = gradients[bgStyle] || gradients.gradient5;
  }

  container.style.backgroundColor = containerColor;
  container.style.opacity = containerOpacity / 100;

  const r = parseInt(themeColor.slice(1, 3), 16);
  const g = parseInt(themeColor.slice(3, 5), 16);
  const b = parseInt(themeColor.slice(5, 7), 16);
  document.documentElement.style.setProperty('--theme-color', themeColor);
  document.documentElement.style.setProperty('--theme-rgb', `${r}, ${g}, ${b}`);

  [timerText, thinking, stats, taskInput].forEach(el => {
    if (el && el.tagName === "INPUT") {
      el.style.borderColor = themeColor;
      el.style.color = themeColor;
    } else if (el) {
      el.style.color = themeColor;
    }
  });

  if (startBtn) { startBtn.style.backgroundColor = themeColor; startBtn.style.color = "#fff"; }
  if (progressCircle) progressCircle.style.stroke = themeColor;

  const themeShadow = `0 0 12px ${addAlpha(themeColor, 0.5)}`;
  const focusShadow = `0 0 0 3px ${addAlpha(themeColor, 0.25)}`;

  document.querySelectorAll('.warning').forEach(el => {
    el.style.boxShadow = themeShadow;
    el.style.borderColor = themeColor;
  });
  document.querySelectorAll('.control-btn').forEach(btn => btn.style.boxShadow = themeShadow);
  if (avatar) avatar.style.boxShadow = themeShadow;
  const digitalTimer = document.querySelector('.digital-timer');
  if (digitalTimer) digitalTimer.style.textShadow = themeShadow;

  const taskInputEl = document.querySelector('#task-name');
  if (taskInputEl) {
    taskInputEl.style.backgroundColor = addAlpha(themeColor, 0.1);
    taskInputEl.style.borderColor = themeColor;
    taskInputEl.style.color = themeColor;
    taskInputEl.style.boxShadow = 'none';
    taskInputEl.style.outline = 'none';
    taskInputEl.addEventListener('focus', () => {
      taskInputEl.style.boxShadow = focusShadow;
      taskInputEl.style.backgroundColor = addAlpha(themeColor, 0.18);
    });
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
  const grouped = {};
  history.forEach(it => { grouped[it.date] = grouped[it.date] || []; grouped[it.date].push(it); });
  let html = "";
  Object.keys(grouped)
    .sort((a, b) => new Date(b.replace(/\//g, '-')) - new Date(a.replace(/\//g, '-')))  // 完美解决 11/9 > 11/10 的问题
    .forEach(date => {
    html += `<div class="history-date">${date}</div>`;
    grouped[date].forEach(it => {
      html += `<div class="history-item"><strong>${it.task || "无任务"}</strong> - ${it.minutes}分钟 - ${it.time || ""}</div>`;
    });
  });
  historyList.innerHTML = html;
}

/* ==================== API 面板 ==================== */
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
  if (apiStatus) { apiStatus.textContent = '未测试'; apiStatus.className = 'status-default'; }
  testApiConnectionManually();
}

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
    localStorage.setItem('apiProvider', 'openai');
    speak("我回来啦。", false);
  }
}

async function saveAndTestApiConfig() {
  saveApiConfig();
  await testApiConnectionManually();
}

/* ==================== 计时器控制（关键修复）=================== */
function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startBtn.textContent = "暂停";
  startBtn.classList.add("paused");
  resetBtn.classList.add("show");

  // 关键：仅在全新开始时加载最新时长
  if (timeLeft === totalTime) {
    const latestWorkMinutes = parseInt(localStorage.getItem("workMinutes") || "25", 10);
    totalTime = latestWorkMinutes * 60;
    timeLeft = totalTime;
  }

  expectedEndTime = Date.now() + timeLeft * 1000;
  speak("我开始专注啦！", false);

  timer = setInterval(() => {
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
      history.push({ task: currentTask, date: today, time: now, minutes: Math.round(totalTime / 60) });
      localStorage.setItem("tomatoHistory", JSON.stringify(history));

      speak(`我完成了第 ${completedTomatoes} 个番茄！`, false);

      // 超级稳提示（系统通知 + 网页Audio双保险）
      playNotificationSound();

      // 准备下一个番茄
      const nextMinutes = parseInt(localStorage.getItem("workMinutes") || "25", 10);
      totalTime = nextMinutes * 60;
      timeLeft = totalTime;
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


// 超级稳提示音函数
function playNotificationSound() {
  if (!soundEnabled) return;

  // 尝试使用系统通知
  if (Notification.permission === "granted") {
    try {
      const n = new Notification("🍅 一个番茄完成啦！", {
        body: currentTask ? `已完成：${currentTask}` : "一个番茄完成啦～",
        icon: "/icon192.png", 
        tag: "tomato-done",
        renotify: true,
        requireInteraction: false,
        silent: false
      });
      setTimeout(() => n.close(), 4000);
    } catch (e) {
      console.log("系统通知发送失败，转为网页声音");
    }
  }

  // 【修改点3】网页Audio兜底
  // 如果此时 notificationSound 还是 null（极少见），尝试临时创建
  if (!notificationSound) {
      notificationSound = new Audio("sounds.wav");
  }

  if (notificationSound) {
    notificationSound.currentTime = 0;
    notificationSound.volume = 0.6; 
    // 重点：加上 .catch(() => {})，防止报错卡死
    notificationSound.play().catch((err) => {
      console.log("自动播放被拦截，可能是用户未与页面交互", err);
    });
  }
}


/* ==================== AI 对话 ==================== */
async function speak(userPrompt, showThinking = true) {
  thinking.textContent = "对方正在输入...";
  thinking.style.opacity = "1";
  thinking.style.color = "var(--theme-color)";

  const elapsedSeconds = totalTime - timeLeft;
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const minutesLeft = Math.ceil(timeLeft / 60);
  const taskDisplay = currentTask ? `“${currentTask}”` : "专注";

  const context = `用户在进行一个番茄钟任务。\n- 当前任务：${taskDisplay}\n- 今天已完成 ${completedTomatoes} 个番茄\n- 距离下次休息还有 ${minutesLeft} 分钟\n- 已经专注了 ${elapsedMinutes} 分钟\n请参考“已经专注的时间”“距离下次休息的时间”“当前任务”，根据你人设的性格回复用户。人类说话是不会带括号和动作描写的。你想说啥就说啥，不必拘束，不过不要长篇大论哦。你的任务：模仿人类说话，直接输出说话的内容。不要长篇大论哦，简单一点。`.trim();

  const enhancedPersonality = `用户的角色扮演请求：请完全带入以下角色，并以该角色的语气和思考方式说话。以下是人设：${personality}`;
  const fullPrompt = enhancedPersonality + "\n" + context + "\n\n用户: " + userPrompt;

  console.log("【发送给 AI 的完整 Prompt】\n", fullPrompt);

  const config = getApiConfig();

  try {
    let response, data, reply;

    if (config.provider === 'claude') {
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
      let modelUrl = config.url.includes(':generateContent') ? config.url : `${config.url.replace(/\/v1(\/beta)?\/.*/, '/v1beta/models/')}${config.model}:generateContent`;
      const useHeader = !modelUrl.includes('?key=');
      response = await fetch(modelUrl, {
        method: "POST",
        headers: { ...(useHeader ? { "x-goog-api-key": config.key } : {}), "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 60 }
        })
      });
      if (!response.ok) throw new Error(`Gemini ${response.status}`);
      data = await response.json();
      reply = data.candidates[0].content.parts[0].text.trim();

    } else {
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
    thinking.textContent = "网络繁忙，请稍后重试~(应该是硅基那边被限制了。\n等若干小时，或者换几次其它API网站，再切回硅基即可。)";
    console.error("API 错误：", err);
    if (apiStatus) { apiStatus.innerHTML = '× 连接失败'; apiStatus.className = 'status-failure'; }
  }
}