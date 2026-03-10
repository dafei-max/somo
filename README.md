# Somo — 多模态情绪陪伴 MVP Demo

输入一句话，Somo 自动识别情绪、选择 skill、生成回应文本、生成 Live Card 图片，并可选生成音景。

---

## 快速启动

### 1. 启动后端

```bash
cd server
cp .env.example .env   # 按需填写 API Key
npm run dev            # 或 npm start
```

### 2. 启动前端

```bash
cd client
npm run dev
```

打开 http://localhost:5173

---

## Mock 模式（默认开启）

`server/.env` 中设置 `USE_MOCK=true`，无需任何 API Key 即可完整体验流程。

---

## 接入真实 API

编辑 `server/.env`，填入密钥后将 `USE_MOCK` 改为 `false`。

### LLM（情绪分析 + 回应生成）

`server/services/emotionAnalyzer.js` 和 `responseGenerator.js` 中找到 `callLLM()` 函数，替换为实际 API 调用。示例已在注释中给出（兼容 OpenAI 接口）。

### 图像生成

`server/services/imageGenerator.js` 中的 `callImageModel()` 函数。

### 音景生成

`server/services/soundGenerator.js` 中的 `callAudioModel()` 函数。

---

## API 说明

### `POST /api/emotion`

**请求体：**
```json
{
  "text": "最近好像一直在忙，但也不知道在忙什么",
  "audioUrl": "",
  "imageUrl": ""
}
```

**返回：**
```json
{
  "emotionScore": 0.22,
  "energyLevel": "Low",
  "mainEmotion": "疲惫",
  "skill": "comfort",
  "responseText": "...",
  "actionTip": "...",
  "cardTitle": "...",
  "cardMoodColor": "#A8C5DA",
  "cardImageUrl": "...",
  "soundUrl": ""
}
```

---

## 项目结构

```
somo/
├── client/                  # React + Vite 前端
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── InputSection.jsx
│           ├── ResultCard.jsx
│           ├── LiveCard.jsx
│           ├── AudioPlayer.jsx
│           └── EmotionBadge.jsx
└── server/                  # Node.js + Express 后端
    ├── server.js
    ├── routes/emotion.js
    ├── mock/mockData.js
    └── services/
        ├── emotionAnalyzer.js
        ├── skillRouter.js
        ├── responseGenerator.js
        ├── imageGenerator.js
        └── soundGenerator.js
```

---

## Skill 路由规则

| emotionScore | Skill   | 语气        |
|-------------|---------|-------------|
| < 0.3       | comfort | 温柔安抚    |
| 0.3 – 0.7   | reflect | 结构化复盘  |
| > 0.7       | inspire | 激励行动    |
