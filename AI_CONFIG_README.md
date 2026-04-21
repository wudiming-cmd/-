# AI功能配置说明

## 📋 概述

本控制中心定制工具集成了两种AI功能：

1. **AI智能填充**：使用 Gemini API 分析图片并自动配色
2. **文生图**：使用硅基流动（SiliconFlow）API 根据文字描述生成图标

---

## 🎨 硅基流动（SiliconFlow）文生图配置

### 1. 获取API密钥

1. 访问 [硅基流动官网](https://siliconflow.cn)
2. 注册/登录账号
3. 进入控制台，找到API密钥管理
4. 创建新的API密钥并复制

### 2. 配置API密钥

打开 `/src/app/utils/textToImage.ts` 文件，将第3行的占位符替换为你的真实API密钥：

```typescript
// 修改前
const SILICONFLOW_API_KEY = 'YOUR_SILICONFLOW_API_KEY_HERE';

// 修改后
const SILICONFLOW_API_KEY = 'sk-xxxxxxxxxxxxxxxxxxxxxxxxx';
```

### 3. 功能说明

配置完成后，你可以：

- **输入提示词**：在"文生图"输入框中输入图标描述（例如："WiFi icon"、"音乐图标"）
- **选择模型**：点击"高级选项"可以选择不同的AI模型
  - `FLUX.1 Schnell`：快速生成，适合图标（推荐）
  - `Stable Diffusion 3.5 Large`：高质量通用图像生成
  - `Logo Design`：专门用于Logo和图标设计
  - `SDXL Base`：经典SDXL模型

- **使用预设模板**：点击预设按钮快速填充常用图标的提示词
  - WiFi信号图标
  - 蓝牙连接图标
  - 飞行模式图标
  - 音乐图标
  - 相机图标
  - 手电筒图标
  - 等等...

### 4. Mock模式（开发测试）

如果你还没有配置API密钥，工具会自动进入Mock模式：

- 使用Unsplash作为临时图片源
- 根据提示词搜索相关图片
- 方便开发和测试UI功能

---

## ✨ Gemini AI智能填充配置

### 1. 获取API密钥

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录Google账号
3. 创建API密钥

### 2. 配置API密钥

打开 `/src/app/utils/aiAnalyze.ts` 文件，将第3行的API密钥替换为你的真实密钥：

```typescript
// 修改前
const GEMINI_API_KEY = 'AIzaSyDWodY6sjmj9LYeAR-MdLR0SqK0l_8jDLA';

// 修改后
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
```

### 3. 功能说明

AI智能填充可以：
- 分析上传图片的内容和风格
- 自动识别主色调
- 推荐合适的背景颜色和图标颜色
- 生成中文标签
- 建议渐变色方案

---

## ⚠️ 安全提示

**重要**：API密钥直接暴露在前端代码中存在安全风险！

### 生产环境建议：

1. **使用后端代理**：创建一���后端API来代理AI服务调用
2. **环境变量**：将API密钥存储在环境变量中
3. **访问控制**：实施速率限制和访问控制
4. **密钥轮换**：定期更换API密钥

### 示例后端代理结构：

```
前端应用 → 你的后端服务 → 硅基流动/Gemini API
                ↓
        密钥安全存储
```

---

## 🚀 使用示例

### 文生图生成图标

1. 选择任意模块
2. 在右侧面板找到"文生图"区域
3. 输入描述，例如：
   - "WiFi signal icon"
   - "Camera lens icon"
   - "Music note icon"
   - "蓝牙图标"（支持中文）
4. 点击"生成图标"
5. 等待2-5秒，图标将自动应用到模块

### AI智能填充

1. 选择任意模块
2. 在"AI智能填充"区域点击上传图片
3. 选择一张图片
4. AI会自动分析并填充：
   - 背景颜色/渐变
   - 图标颜色
   - 标签文字

---

## 🛠️ 故障排除

### 问题：生成失败，提示"API密钥无效"

**解决方案**：
1. 检查API密钥是否正确配置
2. 确认密钥没有过期
3. 检查硅基流动账户余额

### 问题：生成很慢或超时

**解决方案**：
1. 检查网络连接
2. 尝试选择更快的模型（FLUX.1 Schnell）
3. 简化提示词

### 问题：生成的图标不符合预期

**解决方案**：
1. 使用更详细的提示词
2. 尝试使用预设模板
3. 在高级选项中切换不同的模型
4. 参考图标设计的关键词：
   - "minimalist"（极简）
   - "flat design"（扁平设计）
   - "simple icon"（简单图标）
   - "clean"（干净）

---

## 📚 推荐提示词模板

### 系统图标
```
WiFi signal icon, minimalist, flat design
Bluetooth connection icon, simple, modern
Airplane mode icon, clean, professional
Battery charging icon, minimal style
```

### 功能图标
```
Music note icon, flat design, centered
Camera lens icon, minimalist, modern
Flashlight beam icon, simple, clean
Calculator icon, professional, minimal
```

### 自定义图标
```
[描述] + minimalist icon, flat design, simple, clean, modern, professional
```

---

## 💡 提示

1. **提示词可以用中文或英文**，系统会自动优化
2. **Mock模式**可用于测试，无需API密钥
3. **预设模板**提供了常用图标的最佳提示词
4. **高级选项**中可以选择最适合的AI模型

---

## 📞 联系支持

如有问题，请查看：
- 硅基流动文档：https://docs.siliconflow.cn
- Google AI Studio：https://ai.google.dev

---

**祝使用愉快！🎉**
