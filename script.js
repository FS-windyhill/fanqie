/* ==================== 全局变量 ==================== */
// 固定 API
const API_URL = "https://api.siliconflow.cn/v1/chat/completions";
const API_KEY = "sk-mvhfuozxnqmthysxdmhmxuxbsrcssgzjxlhtrokckcdcrbop";  
const API_MODEL = "THUDM/GLM-4-9B-0414";


let avatar, startBtn, resetBtn, timerText, thinking, progressCircle;
let settingsBtn, settingsPanel, appearanceBtn, appearancePanel;
let personalityInput, saveBtn, closeBtn, appearanceSave, appearanceClose;
let taskInput, stats, historyBtn, historyPanel, historyList, clearHistoryBtn, closeHistoryBtn;
let bgSelect, bgUpload, containerBgColor, containerOpacityInput, opacityValue, themeColorInput;
let changeAvatarBtn, avatarUpload, avatarPreview, mainAvatar, resetAvatarBtn;
let apiUrlInput, apiKeyInput, apiModelInput, workMinutesInput;

// ==================== 状态 ====================
let personality = localStorage.getItem("tomatoPersonality") || "你是一个可爱的西红柿学习搭子，陪我专注一个番茄钟，说话温柔又有趣。";
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
let expectedEndTime = null; // <-- 新增此行


const CIRCUMFERENCE = 527;

/* ==================== 页面加载完成后初始化 ==================== */
window.onload = function() {
  // ========== 每天自动清零今日番茄数 ==========
  const today = new Date().toLocaleDateString('zh-CN');
  const lastDate = localStorage.getItem("lastTomatoDate");

  if (lastDate !== today) {
    localStorage.setItem("completedTomatoes", "0");
    completedTomatoes = 0;
    localStorage.setItem("lastTomatoDate", today);
  } else {
    completedTomatoes = parseInt(localStorage.getItem("completedTomatoes") || "0", 10);
  }

  // 获取 DOM 元素（确保存在）
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
  resetAvatarBtn =  document.getElementById("reset-avatar-btn");

  workMinutesInput = document.getElementById("work-minutes");

  // 初始化输入框
  taskInput.value = currentTask;
  workMinutesInput.value = workMinutes;

  // 头像初始化
  const savedAvatar = localStorage.getItem("customAvatar");
  if (savedAvatar && mainAvatar && avatarPreview) {
    mainAvatar.src = savedAvatar;
    avatarPreview.src = savedAvatar;
  }

  // 应用外观
  applyAppearance();

  // 初始化显示
  updateTimer();
  updateStats();
  thinking.textContent = "戳我一下试试～";

  // 绑定事件
  bindEvents();
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
  if (bgSelect) bgSelect.addEventListener("change", () => {
      if (bgSelect.value === "custom") {
        bgUpload.click();  // 触发文件选择
      }
    });
    
  if (bgUpload) bgUpload.addEventListener("change", handleBgUpload);

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
  if (avatar) avatar.addEventListener("click", () => speak("我现在准备专心工作和学习，但是我有时候也会分心来找你玩。我现在来找你玩啦！你可以畅所欲言，比如督促我专心完成任务，或者关心我一下，想说什么都行，不过不要长篇大论哦，简单一点。", true));

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
  personality = inputText || "你是一个可爱的西红柿学习搭子。";
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
/* ==================== 外观应用 ==================== */
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

/* ==================== AI 对话（带控制台日志） ==================== */
async function speak(userPrompt, showThinking = true) {
  // 永远显示“电波传送中...”
  thinking.textContent = "电波传送中...";
  thinking.style.opacity = "1";
  thinking.style.color = "var(--theme-color)";

  const elapsedSeconds = totalTime - timeLeft;
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const minutesLeft = Math.ceil(timeLeft / 60);
  const taskDisplay = currentTask ? `“${currentTask}”` : "学习";

  const context = `
用户在进行一个番茄钟任务。
- 当前任务：${taskDisplay}
- 今天已完成 ${completedTomatoes} 个番茄
- 距离下次休息还有 ${minutesLeft} 分钟
- 已经专注了 ${elapsedMinutes} 分钟
请参考“已经专注的时间”“距离下次休息的时间”“当前任务”，根据你人设的性格，回复一下用户。人类说话是不会带括号和动作描写的。你的任务：模仿人类说话，直接输出说话的内容。不要长篇大论哦，简单一点。
`.trim();

  const enhancedPersonality = `用户的角色扮演请求：请完全带入以下角色，并以该角色的语气和思考方式说话。以下是人设：${personality}`;
  const fullPrompt = enhancedPersonality + "\n" + context + "\n\n用户: " + userPrompt;
  console.log("【发送给 AI 的完整 Prompt】\n", fullPrompt);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: API_MODEL,
        messages: [
          { role: "system", content: personality + "\n" + context },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.9,
        max_tokens: 60
      })
    });
    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    const reply = data.choices[0].message.content.trim();
    thinking.textContent = reply;
  } catch (err) {
    thinking.textContent = "网络错误，戳我重试~";
    console.error("API 错误：", err);
  }
}