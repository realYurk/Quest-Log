# Quest Log · 征途手记

<div align="center">

![Platform](https://img.shields.io/badge/Platform-Win%20%7C%20Mac%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/License-Apache_2.0-blue)
![Node](https://img.shields.io/badge/Node.js-18+-green)

**像攻略游戏一样，通关你的人生副本**

*Your personal walkthrough guide to conquering life's quests*

</div>

---

## 写在前面

我们常常觉得人生像是一场没有进度提示的硬核游戏，埋头赶路却不知道自己究竟完成了多少经验值，距离下一个"升级"还有多远。

在这个被算法和即时反馈填满的时代，我们习惯了用别人的成功模板来衡量自己的坐标，却渐渐弄丢了自己真实的节奏。其实，每个人都在渴望一种清晰的掌控感——想知道当下的迷茫是不是必经的新手村，想知道每一次看似微小的努力，是否都在为未来的主线任务积攒着关键的经验值。

近期，"奥德赛时期"的概念在年轻人中引发了深深的共鸣。它不再是一个简单的心理学名词，而是我们当下的真实写照——那段在成年早期与稳定生活之间徘徊、探索、试错的宝贵时光。这就像一场没有剧本的即兴演出，我们是主角，也是编剧，更是那个在台下默默记录的观察者。我们根据自己的性格、兴趣和价值观，去探索世界的边界，去构建属于自己的独一无二的 SOP 体系。

这听起来既自由又令人不安。自由的是，我们拥有无限的可能；不安的是，我们似乎缺少了一样东西——**一个能够承载我们探索痕迹的容器，一个能够见证我们成长轨迹的伙伴**。

我们习惯了在游戏中寻找指引。当你踏入《巫师3》的陶森特庄园，面对错综复杂的支线任务和隐藏谜题，你会毫不犹豫地打开"任务日志"，寻找那份清晰的攻略和线索。因为你知道，那能帮你少走弯路，更快地抵达终点。

那么，面对"三个月内提升公开演讲能力"这样的人生挑战，面对"完成一次间隔年旅行"的奥德赛式探索，面对"掌握一门新技能"的成长目标，我们为什么不能也拥有一本专属于自己的"征途手记"呢？

**这正是我们想要为你呈现的——一款将游戏化思维融入人生记录的工具。**

在这里，你的每一个成长目标，都会被转化为一个值得探索的"征途"：
- 像在 RPG 游戏中一样，构建自己的**技能树**，将宏大的梦想拆解为一个个可量化的"关卡"和"里程碑"
- 在完成每一个小任务后，获得即时的反馈和**奖励**，让成长变得清晰可见
- 为你的人生副本编写标准的 **SOP**，将那些抽象的目标转化为一步步可执行的具体行动

我们希望，通过这本"征途手记"，你能像记录游戏冒险一样，记录你的人生旅程。让每一次尝试，都成为手记中的一笔；让每一次成长，都化作可触摸的印记。

在这里，你不再是那个在迷雾中独自摸索的旅人，而是自己人生故事的记录者，手握笔墨，心怀热望，一步步书写属于你的独一无二的奥德赛。

**欢迎打开你的"征途手记"，让我们一起，记录这场属于你自己的人生冒险。**

---

## 功能特性

| 模块 | 功能 |
|:---|:---|
| **技能树** | 创建/编辑/删除技能，Lv.0~Lv.MAX 进度追踪 |
| **阶段系统** | 每个技能可拆解多个阶段关卡 |
| **里程碑** | 阶段内可勾选的小任务点 |
| **证明材料** | 支持图片、视频、文档、链接作为达成凭证 |
| **SOP 管理** | Mermaid 流程图 + 动作卡片 + 代码高亮 + 变量替换 |
| **AI 协同** | 导出/导入 Markdown，与 AI 协同规划 |
| **主题切换** | 深色/浅色模式一键切换 |
| **本地存储** | 100% 本地存储，隐私优先 |

---

## 环境要求

| 项目 | 要求 |
|:---|:---|
| Node.js | 18.0+ |
| npm | 9.0+ |
| 操作系统 | Windows 10+ / macOS 10.15+ / Ubuntu 20.04+ |

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/realYurk/Quest-Log
cd Quest-Log
```

### 2. 安装依赖

```bash
npm install
```

> 国内网络建议设置镜像：
> ```bash
> npm config set registry https://registry.npmmirror.com
> npm config set ELECTRON_MIRROR https://npmmirror.com/mirrors/electron/
> ```

### 3. 开发模式

```bash
# 启动 Electron 桌面应用（推荐）
npm run electron:dev

# 或仅浏览器预览（数据存 localStorage）
npm run dev
```

### 4. 打包

```bash
# Windows x64 ZIP 压缩包
npm run build:win

# macOS DMG
npm run build:mac

# Linux AppImage
npm run build:linux
```

打包输出位于 `dist-electron/` 目录。

---

## 项目结构

```
Quest-Log/
├── electron/              # Electron 主进程
│   ├── main.js            # 窗口管理 / IPC / 文件监视器
│   ├── preload.js         # Context Bridge 安全 API
│   ├── seed.js            # 首次启动演示数据
│   └── sopFormat.js       # 导出格式工具
│
├── src/                   # Vue 源代码
│   ├── components/        # Vue 组件
│   ├── stores/            # Pinia 状态管理
│   ├── composables/       # Vue Composables
│   ├── types/             # TypeScript 类型定义
│   └── assets/            # CSS / 静态资源
│
├── public/                # 静态资源
├── package.json           # 项目配置
├── vite.config.ts         # Vite 构建配置
└── tsconfig.json          # TypeScript 配置
```

---

## 技术栈

| 层级 | 技术 |
|:---|:---|
| UI 框架 | Vue 3 + TypeScript |
| 状态管理 | Pinia |
| 构建工具 | Vite |
| 流程图 | Mermaid.js |
| 代码高亮 | Highlight.js |
| 桌面壳 | Electron 29 |
| 打包工具 | electron-builder |

---

## 常见问题

**Q: 打包后应用白屏**

A: 检查 `electron/main.js` 中 `backgroundColor: '#0f0f17'` 是否设置。

**Q: 下载 Electron 慢**

A: 设置镜像后重试：
```bash
npm config set ELECTRON_MIRROR https://npmmirror.com/mirrors/electron/
```

**Q: Windows 打包失败，提示 NSIS 错误**

A: 尝试使用 ZIP 模式打包：
```bash
# 修改 package.json 中 win.target 为 "zip"
npm run build:win
```

---

## 开源协议

[Apache License 2.0](./LICENSE) — 可自由使用、修改、分发。

---

<div align="center">

**Quest Log · 征途手记**

*让每一次成长，都像在游戏里升级一样清晰可见*

*Every quest deserves a walkthrough.*

</div>