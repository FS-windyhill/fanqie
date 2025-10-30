const API_KEY = "sk-bmbubpzosfskzyhpfvmjnietpougrvxhvebyowxxhpdzeqvx";
const API_URL = "https://api.siliconflow.cn/v1/chat/completions";

const avatar = document.getElementById("avatar");
const startBtn = document.getElementById("start-btn");
const timerText = document.getElementById("timer-text");
const thinking = document.getElementById("thinking");
const progressCircle = document.querySelector(".progress-ring__circle");
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const personalityInput = document.getElementById("personality");
const saveBtn = document.getElementById("save-btn");
const closeBtn = document.getElementById("close-btn");
const taskInput = document.getElementById("task-name");
const stats = document.getElementById("stats");

let personality = localStorage.getItem("tomatoPersonality") || "你是一个可爱的西红柿学习搭子，陪我专注 25 分钟，说话温柔又有趣。";
let currentTask = localStorage.getItem("currentTask") || "";
let completedTomatoes = parseInt(localStorage.getItem("completedTomatoes") || "0", 10);
let sessionCount = parseInt(localStorage.getItem("sessionCount") || "0", 10);

let timer = null;
let timeLeft = 25 * 60;
let totalTime = 25 * 60;
let isRunning = false;
let isWorkSession = true;

const CIRCUMFERENCE = 527;

// 初始化任务输入
taskInput.value = currentTask;
taskInput.addEventListener("change", () => {
  currentTask = taskInput.value.trim();
  localStorage.setItem("currentTask", currentTask);
});

// 设置面板
settingsBtn.addEventListener("click", () => {
  personalityInput.value = personality;
  settingsPanel.style.display = "block";
});

saveBtn.addEventListener("click", () => {
  personality = personalityInput.value.trim() || "你是一个可爱的西红柿学习搭子。";
  localStorage.setItem("tomatoPersonality", personality);
  settingsPanel.style.display = "none";
  speak("人设已更新！", false);
});

closeBtn.addEventListener("click", () => {
  settingsPanel.style.display = "none";
});

// 戳头像说话
avatar.addEventListener("click", () => {
  speak("我戳了你一下，请说一句鼓励或调侃的话，控制在30字以内。", true);
});

// 开始/暂停
startBtn.addEventListener("click", () => {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

// 开始计时
function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startBtn.textContent = "暂停";
  startBtn.classList.add("paused");

  // 只有新一轮才重置
  if (timeLeft <= 0 || timeLeft === totalTime) {
    totalTime = isWorkSession ? 25 * 60 : 5 * 60;
    timeLeft = totalTime;
    progressCircle.style.strokeDashoffset = 0;
  }

  timer = setInterval(() => {
    timeLeft--;
    updateTimer();

    if (timeLeft <= 0) {
      clearInterval(timer);
      isRunning = false;
      startBtn.textContent = "开始专注";
      startBtn.classList.remove("paused");

      if (isWorkSession) {
        // 专注结束 → 完成一个番茄
        completedTomatoes++;
        sessionCount++;
        localStorage.setItem("completedTomatoes", completedTomatoes);
        localStorage.setItem("sessionCount", sessionCount);
        updateStats();

        speak(`完成第 ${completedTomatoes} 个番茄！休息 5 分钟～`, false);
        isWorkSession = false;
        totalTime = 5 * 60;
        timeLeft = totalTime;

        // 每4轮长休息
        if (sessionCount % 4 === 0) {
          totalTime = 15 * 60;
          timeLeft = totalTime;
          speak(`第 ${completedTomatoes} 个番茄！奖励长休息 15 分钟！`, false);
        }

      } else {
        speak("休息够啦！再来一轮？", false);
        isWorkSession = true;
        totalTime = 25 * 60;
        timeLeft = totalTime;
      }

      progressCircle.style.strokeDashoffset = 0;
      updateTimer();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  isRunning = false;
  startBtn.textContent = "继续";
}

// 更新计时器（倒走）
function updateTimer() {
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  timerText.textContent = `${minutes}:${seconds}`;

  const progress = timeLeft / totalTime;
  const offset = CIRCUMFERENCE * (1 - progress);
  progressCircle.style.strokeDashoffset = offset;
}

// 更新统计
function updateStats() {
  stats.textContent = `今日已完成 ${completedTomatoes} 个番茄`;
}

// AI 说话（智能注入上下文）
// AI 说话（智能注入 + 日志 + 已专注时间）
async function speak(userPrompt, showThinking = true) {
  if (showThinking) {
    thinking.textContent = "思考中...";
  }

  // 新增：已专注时间（仅在专注时段）
  const elapsedSeconds = isWorkSession ? (totalTime - timeLeft) : 0;
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  const minutesLeft = Math.ceil(timeLeft / 60);
  const taskDisplay = currentTask ? `“${currentTask}”` : "学习";

  const context = `
你现在是我的番茄钟搭子。
- 当前任务：${taskDisplay}
- 今天已完成 ${completedTomatoes} 个番茄
- 距离下次休息还有 ${minutesLeft} 分钟
- 已经专注了 ${elapsedMinutes} 分钟
- 当前是${isWorkSession ? "专注" : "休息"}时段
请根据①当前任务、②已经专注的时间和③距离下次休息的时间（三者任选其一），回复一条温柔鼓励或调侃的话，控制在30字以内。
`.trim();

  // 关键：打印发送给 AI 的完整 Prompt
  console.log("发送给 AI 的完整 Prompt：");
  console.log(context);
  console.log("用户输入：", userPrompt);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "zai-org/GLM-4.6",
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

    // 打印 AI 回复
    console.log("AI 回复：", reply);

    thinking.textContent = reply;

  } catch (err) {
    thinking.textContent = "网络错误，戳我重试~";
    console.error("API 错误：", err);
  }
}

// 初始化
updateTimer();
updateStats();
thinking.textContent = "戳我一下试试～";