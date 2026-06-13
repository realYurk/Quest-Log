import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LifeAppData, Collection, Folder, SopItem, ActionCard, Toast } from '@/types'
import { useGamificationStore } from './gamification'

function uid() { return Math.random().toString(36).slice(2,9) + Date.now().toString(36) }

// CRITICAL: strip Vue Proxy before any IPC call
// contextBridge structured-clone rejects Proxy objects
function toRaw<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// 创建默认 SOP 示例数据
function createDefaultCollections(): Collection[] {
  const now = Date.now()
  return [
    {
      id: uid(),
      name: '工作流程',
      icon: '💼',
      color: '#6366f1',
      sortOrder: 1,
      folders: [
        {
          id: uid(),
          name: '项目管理',
          sortOrder: 1,
          sopItems: [
            {
              id: uid(),
              title: '需求评审流程',
              mermaidSource: 'graph LR\n    A[接收需求] --> B[需求分析]\n    B --> C[技术方案设计]\n    C --> D[评审会议]\n    D --> E[方案确认]\n    E --> F[进入开发]',
              variables: { '项目名称': '', '优先级': '中' },
              actionCards: [
                { id: uid(), title: '收集需求文档', language: 'markdown', code: '# 需求文档模板\n\n## 基本信息\n- 项目名称：{{项目名称}}\n- 优先级：{{优先级}}\n- 需求方：\n- 期望交付：', notes: '从产品经理处获取详细需求文档，确保包含业务背景、用户画像、功能需求和非功能需求', completed: true, sortOrder: 1 },
                { id: uid(), title: '分析需求可行性', language: 'bash', code: '# 技术可行性评估脚本\n./evaluate.sh --project {{项目名称}} --aspect security,performance,scalability', notes: '技术可行性评估与风险识别，包括技术选型、架构设计、性能考量', completed: true, sortOrder: 2 },
                { id: uid(), title: '编写技术方案', language: 'markdown', code: '# 技术方案设计\n\n## 系统架构\n```\n┌─────────┐    ┌─────────┐    ┌─────────┐\n│  Client │───▶│ Gateway │───▶│ Service │\n└─────────┘    └─────────┘    └─────────┘\n```\n\n## 核心模块\n1. 模块A\n2. 模块B', notes: '输出系统设计文档，包含架构图、接口设计、数据库设计', completed: false, sortOrder: 3 },
                { id: uid(), title: '组织评审会议', language: 'bash', code: '# 发送评审通知\n./notify.sh --meeting "技术方案评审" \\\n  --attendees "dev,qa,po" \\\n  --time "2024-01-15 14:00"', notes: '邀请相关干系人参与评审会议，提前准备评审材料', completed: false, sortOrder: 4 },
                { id: uid(), title: '收集评审意见', language: 'markdown', code: '# 评审记录\n\n## 通过项 ✅\n- 架构设计\n- 接口协议\n\n## 需改进项 ⚠️\n1. 安全性加固\n2. 监控告警\n\n## 待确认项 ❓\n- 第三方依赖', notes: '记录并跟进修改项，使用评审表格追踪每项反馈', completed: false, sortOrder: 5 },
                { id: uid(), title: '最终方案定稿', language: 'bash', code: '# 合并技术方案到主分支\ngit checkout main\ngit merge tech/design-{{版本号}}\ngit tag -a v{{版本号}} -m "技术方案评审通过"', notes: '输出评审通过的技术方案，合并到主干并打标签', completed: false, sortOrder: 6 }
              ],
              sortOrder: 1
            },
            {
              id: uid(),
              title: '迭代版本发布',
              mermaidSource: 'graph LR\n    A[代码开发] --> B[代码评审]\n    B --> C[测试验证]\n    C --> D[预发布]\n    D --> E[正式发布]\n    E --> F[版本复盘]',
              variables: { '版本号': '', '发布时间': '' },
              actionCards: [
                { id: uid(), title: '功能开发完成', language: 'bash', code: '# 提交开发分支\ngit checkout feature/{{版本号}}\ngit add .\ngit commit -m "feat: 完成{{版本号}}功能开发"\ngit push origin feature/{{版本号}}', notes: '所有功能代码提交到开发分支，确保 CI 通过', completed: false, sortOrder: 1 },
                { id: uid(), title: '提交代码评审', language: 'bash', code: '# 创建 PR\ngh pr create \\\n  --title "Feature: {{版本号}} 功能" \\\n  --body "## 功能清单\\n- [ ] 功能1\\n- [ ] 功能2" \\\n  --reviewer "@team-lead"', notes: '发起 PR 并通知评审者，邀请至少2位评审者', completed: false, sortOrder: 2 },
                { id: uid(), title: '执行测试用例', language: 'bash', code: '# 运行测试套件\npytest tests/ -v --tb=short\n# 生成覆盖率报告\npytest --cov=. --cov-report=html', notes: '包括功能测试与回归测试，确保覆盖率 > 80%', completed: false, sortOrder: 3 },
                { id: uid(), title: '部署预发布环境', language: 'bash', code: '# 部署到预发布\nexport ENV=staging\n./deploy.sh --env=$ENV --version={{版本号}}\n# 验证部署\ncurl -f https://staging.example.com/health', notes: '验证生产环境兼容性，检查日志和监控指标', completed: false, sortOrder: 4 },
                { id: uid(), title: '执行发布检查单', language: 'markdown', code: '# 发布检查单\n\n## 代码检查 ✅\n- [ ] PR 已审批\n- [ ] 测试全部通过\n- [ ] 覆盖率达标\n\n## 部署检查 ✅\n- [ ] 预发布验证通过\n- [ ] 配置检查完成\n- [ ] 监控告警配置完成', notes: '确认各项检查项通过，逐项打勾确认', completed: false, sortOrder: 5 },
                { id: uid(), title: '执行正式发布', language: 'bash', code: '# 灰度发布 10%\n./deploy.sh --env=prod --version={{版本号}} --strategy=canary\n# 观察30分钟\nsleep 1800\n# 全量发布\n./deploy.sh --env=prod --version={{版本号}} --strategy=full', notes: '灰度发布 → 全量发布，密切监控各项指标', completed: false, sortOrder: 6 },
                { id: uid(), title: '发布后验证', language: 'bash', code: '# 健康检查\ncurl -f https://api.example.com/health\n# 冒烟测试\n./smoke_test.sh --env=prod\n# 检查错误率\ngrep "ERROR" /var/log/app.log | wc -l', notes: '确认功能正常运行，检查错误率是否异常', completed: false, sortOrder: 7 },
                { id: uid(), title: '版本复盘记录', language: 'markdown', code: '# {{版本号}} 版本复盘\n\n## 📅 日期：2024-01-15\n\n## ✅ 做得好\n1. 团队协作顺畅\n2. PR 评审及时\n\n## ⚠️ 需要改进\n1. 测试覆盖率可以更高\n2. 文档可以更完善\n\n## 📝 Action Items\n- [ ] 优化测试用例\n- [ ] 补充技术文档', notes: '总结本次迭代的得失，记录改进项和后续行动', completed: false, sortOrder: 8 }
              ],
              sortOrder: 2
            }
          ]
        },
        {
          id: uid(),
          name: '会议管理',
          sortOrder: 2,
          sopItems: [
            {
              id: uid(),
              title: '高效会议 SOP',
              mermaidSource: 'graph TD\n    A[会前准备] --> B[会议通知]\n    B --> C[会议进行]\n    C --> D[会议记录]\n    D --> E[任务跟踪]',
              variables: { '会议类型': '', '时长': '30分钟' },
              actionCards: [
                { id: uid(), title: '明确会议目标', language: 'markdown', code: '# 会议目标设定\n\n## 核心议题\n{{会议类型}}\n\n## 预期产出\n- [ ] 决策清单\n- [ ] 行动项列表\n\n## 参会人员\n| 姓名 | 角色 | 职责 |\n|------|------|------|\n| | 主持人 | 引导讨论 |\n| | 记录人 | 记录纪要 |', notes: '确定本次会议的核心议题，确保目标清晰可量化', completed: true, sortOrder: 1 },
                { id: uid(), title: '准备会议议程', language: 'markdown', code: '# 会议议程\n\n## 时间：{{时长}}\n\n| 时间 | 议题 | 时长 | 负责人 |\n|------|------|------|--------|\n| 0-5min | 开场 | 5min | 主持人 |\n| 5-20min | 议题1 | 15min | 主讲人 |\n| 20-35min | 议题2 | 15min | 主讲人 |\n| 35-45min | 讨论 | 10min | 全体 |\n| 45-50min | 总结 | 5min | 主持人 |', notes: '包括时间分配与主持人安排，确保每项议题都有时间控制', completed: true, sortOrder: 2 },
                { id: uid(), title: '发送会议通知', language: 'bash', code: '# 发送会议邀请\n./calendar.sh create \\\n  --title "{{会议类型}}会议" \\\n  --start "2024-01-15 14:00" \\\n  --duration 30 \\\n  --attendees "dev@example.com,qa@example.com" \\\n  --location "Conference Room A" \\\n  --notes "请提前5分钟入会"', notes: '提前至少24小时发送，确保参会人员有时间准备', completed: false, sortOrder: 3 },
                { id: uid(), title: '会议签到与开场', language: 'bash', code: '# 会议记录开始\n./meeting.sh start \\\n  --meeting-id "M{{日期}}" \\\n  --record true\n\n# 确认参会人员\ncat attendees.txt\n[ ] 张三\n[ ] 李四\n[ ] 王五', notes: '确认参会人员与会议目的，记录缺席人员', completed: false, sortOrder: 4 },
                { id: uid(), title: '按照议程讨论', language: 'bash', code: '# 计时器\n./timer.sh start --duration 15\n\n# 发言记录\n[14:05] 张三: 建议优化数据库索引\n[14:12] 李四: 同意，考虑分区表方案\n\n# 决策记录\nDECISION: 采用分区表方案，迁移周期2周', notes: '控制时间，确保议题覆盖，使用计时器把控节奏', completed: false, sortOrder: 5 },
                { id: uid(), title: '总结行动项', language: 'markdown', code: '# 行动项清单\n\n| 序号 | 行动项 | 负责人 | 截止时间 | 状态 |\n|------|--------|--------|----------|------|\n| 1 | 完成技术方案设计 | 张三 | 2024-01-20 | 🔄 |\n| 2 | 联系 DBA 评估 | 李四 | 2024-01-18 | 🔄 |\n| 3 | 更新项目文档 | 王五 | 2024-01-22 | 🔄 |', notes: '明确负责人与截止时间，确保每项都可追踪', completed: false, sortOrder: 6 },
                { id: uid(), title: '发送会议纪要', language: 'bash', code: '# 生成并发送会议纪要\n./meeting.sh generate \\\n  --meeting-id "M{{日期}}" \\\n  --format markdown \\\n  --recipients "dev@example.com,qa@example.com,po@example.com"\n\n# 同步到项目 Wiki\n./wiki.sh update "会议纪要/{{日期}}" \\\n  --file ./meeting-notes/{{日期}}.md', notes: '会后24小时内发出，抄送所有干系人和项目负责人', completed: false, sortOrder: 7 }
              ],
              sortOrder: 1
            }
          ]
        }
      ]
    },
    {
      id: uid(),
      name: '个人成长',
      icon: '📈',
      color: '#22c55e',
      sortOrder: 2,
      folders: [
        {
          id: uid(),
          name: '学习体系',
          sortOrder: 1,
          sopItems: [
            {
              id: uid(),
              title: '知识学习闭环',
              mermaidSource: 'graph LR\n    A[输入] --> B[整理]\n    B --> C[实践]\n    C --> D[输出]\n    D --> A',
              variables: { '学习主题': '', '周期': '一周' },
              actionCards: [
                { id: uid(), title: '确定学习主题', language: 'markdown', code: '# {{学习主题}} 学习计划\n\n## 学习目标\n1. 掌握核心概念\n2. 理解原理机制\n3. 能够实践应用\n\n## 学习周期：{{周期}}\n\n\n## 资源清单\n- 书籍：《{{学习主题}}》\n- 课程：Coursera / Udemy\n- 文章：Medium / 掘金', notes: '明确要学习的核心知识点，设定可量化的目标', completed: false, sortOrder: 1 },
                { id: uid(), title: '收集学习资料', language: 'bash', code: '# 克隆学习仓库\ngit clone https://github.com/learning/{{学习主题}}.git\n\n# 整理资源\nmkdir -p ~/learning/{{学习主题}}/{books,courses,notes}\n\n# 收藏资源链接\necho "https://example.com/docs" >> resources.md', notes: '收集书籍/课程/文章等多渠道学习资源', completed: false, sortOrder: 2 },
                { id: uid(), title: '系统学习整理', language: 'markdown', code: '# {{学习主题}} 知识框架\n\n## 核心概念\n```\n概念1 → 概念2 → 概念3\n```\n\n## 原理机制\n> 原理：XXX\n\n## 代码示例\n```python\ndef example():\n    # 示例代码\n    pass\n```\n\n## 常见问题\n1. Q: XXX?\n2. A: XXX', notes: '构建知识框架与笔记，使用思维导图整理结构', completed: false, sortOrder: 3 },
                { id: uid(), title: '实践应用', language: 'bash', code: '# 创建实践项目\nmkdir -p ~/projects/{{学习主题}}-practice\ncd ~/projects/{{学习主题}}-practice\n\n# 初始化项目\ngit init\ngit remote add origin https://github.com/yourname/{{学习主题}}-practice.git\n\n# 编写实践代码\ncat > main.py << EOF\n# {{学习主题}} 实践代码\ndef main():\n    print("Hello, {{学习主题}}!")\nEOF', notes: '将知识应用到实际工作中，完成一个小项目', completed: false, sortOrder: 4 },
                { id: uid(), title: '输出分享', language: 'bash', code: '# 写博客\nhugo new posts/{{学习主题}}-learning.md\n\n# 同步到知识库\ngitbook build\n\n# 发布到技术社区\n./publish.sh --platform "medium,zhihu" \\\n  --title "{{学习主题}}学习总结" \\\n  --file ./output/article.md', notes: '写博客/做分享/教他人，以输出倒逼输入', completed: false, sortOrder: 5 },
                { id: uid(), title: '复盘优化', language: 'markdown', code: '# {{学习主题}} 学习复盘\n\n## 学习效果评估\n| 指标 | 目标值 | 实际值 | 达成率 |\n|------|--------|--------|--------|\n| 知识点掌握 | 80% | ? | ? |\n| 实践项目完成 | 1个 | ? | ? |\n| 输出文章 | 1篇 | ? | ? |\n\n## 改进计划\n1. 下次学习周期调整为：\n2. 资源筛选标准：\n3. 时间分配优化：', notes: '总结学习效果，分析差距原因，优化学习方法', completed: false, sortOrder: 6 }
              ],
              sortOrder: 1
            }
          ]
        }
      ]
    },
    {
      id: uid(),
      name: '技术实践',
      icon: '🔐',
      color: '#f59e0b',
      sortOrder: 3,
      folders: [
        {
          id: uid(),
          name: '认证授权',
          sortOrder: 1,
          sopItems: [
            {
              id: uid(),
              title: 'JWT 登录认证流程',
              mermaidSource: 'graph LR\n    A[用户登录] --> B[验证账号密码]\n    B --> C[生成 Token]\n    C --> D[返回 Access+Refresh]\n    D --> E[前端存储 Token]\n    E --> F[携带 Token 请求]\n    F --> G[验证 Token]\n    G --> H[返回受保护资源]',
              variables: { '项目名称': '', 'Token过期时间': '15m', 'Refresh过期时间': '7d' },
              actionCards: [
                { id: uid(), title: '验证用户账号密码', language: 'javascript', code: 'const user = await db.users.findOne({ username })\nif (!user || !await bcrypt.compare(password, user.passwordHash)) {\n  throw new Error("用户名或密码错误")\n}', notes: '使用 bcrypt 密码比对，确认用户存在且密码正确', completed: true, sortOrder: 1 },
                { id: uid(), title: '生成 Access Token', language: 'javascript', code: 'const accessToken = jwt.sign(\n  { sub: user.id, username: user.username, role: user.role },\n  process.env.JWT_SECRET,\n  { expiresIn: "15m" }\n)', notes: 'Access Token 短期有效，包含用户身份信息', completed: true, sortOrder: 2 },
                { id: uid(), title: '生成 Refresh Token', language: 'javascript', code: 'const refreshToken = jwt.sign(\n  { sub: user.id, type: "refresh" },\n  process.env.JWT_REFRESH_SECRET,\n  { expiresIn: "7d" }\n)', notes: 'Refresh Token 长期有效，仅用于续期', completed: false, sortOrder: 3 },
                { id: uid(), title: '前端存储 Token', language: 'javascript', code: 'localStorage.setItem("access_token", accessToken)\nlocalStorage.setItem("refresh_token", refreshToken)', notes: '建议使用 HttpOnly Cookie 存储 Refresh Token 更安全', completed: false, sortOrder: 4 },
                { id: uid(), title: '请求时携带 Token', language: 'bash', code: 'curl -H "Authorization: Bearer <token>" \\\n  https://api.example.com/protected', notes: '在 Axios 拦截器中统一添加 Authorization 头', completed: false, sortOrder: 5 },
                { id: uid(), title: '后端验证 Token', language: 'javascript', code: 'try {\n  const payload = jwt.verify(token, process.env.JWT_SECRET)\n  req.user = payload\n  next()\n} catch (err) {\n  if (err.name === "TokenExpiredError") {\n    return res.status(401).json({ error: "Token 已过期" })\n  }\n  return res.status(401).json({ error: "Token 无效" })\n}', notes: 'Token 验证中间件，检查过期和签名有效性', completed: false, sortOrder: 6 },
                { id: uid(), title: 'Refresh Token 续期', language: 'javascript', code: 'const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)\nconst newAccessToken = jwt.sign(\n  { sub: user.id, username: user.username },\n  process.env.JWT_SECRET,\n  { expiresIn: "15m" }\n)\nres.json({ accessToken: newAccessToken })', notes: '用 Refresh Token 换取新的 Access Token', completed: false, sortOrder: 7 }
              ],
              sortOrder: 1
            }
          ]
        }
      ]
    }
  ]
}

export const useSopStore = defineStore('sop', () => {
  // data is the full LifeAppData structure
  const data         = ref<LifeAppData>({
    version: '2.0',
    skillTrees: [],
    collections: [],
    settings: { theme: 'dark', skillTreeLayout: 'horizontal', showWelcome: true, autoBackup: true },
    lastModified: Date.now()
  })
  const activeSopId  = ref<string | null>(null)
  const theme        = ref<'dark' | 'light'>('dark')   // DEFAULT: dark for Life SOP
  const toasts       = ref<Toast[]>([])
  const isSaving     = ref(false)
  const currentSavePromise = ref<Promise<void> | null>(null)
  const searchQuery  = ref('')
  const dataPath     = ref('')
  const showSettings = ref(false)

  // 完整的应用数据引用（用于保存）
  let fullData: LifeAppData | null = null

  // Collections getter/setter for backward compatibility
  const collections = computed(() => data.value.collections)
  function setCollections(cols: Collection[]) { data.value.collections = cols }

  const activeSop = computed<SopItem | null>(() => {
    if (!activeSopId.value) return null
    for (const col of data.value.collections)
      for (const folder of col.folders) {
        const f = folder.sopItems.find(s => s.id === activeSopId.value)
        if (f) return f
      }
    return null
  })

  const searchResults = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return []
    const out: { sop: SopItem; path: string }[] = []
    for (const col of data.value.collections)
      for (const folder of col.folders)
        for (const sop of folder.sopItems)
          if (sop.title.toLowerCase().includes(q))
            out.push({ sop, path: `${col.name} / ${folder.name}` })
    return out
  })

  const completionStats = computed(() => {
    const s = activeSop.value
    if (!s || !s.actionCards.length) return null
    const done = s.actionCards.filter(c => c.completed).length
    return { done, total: s.actionCards.length, pct: Math.round(done / s.actionCards.length * 100) }
  })

  async function loadData() {
    const gStore = useGamificationStore()
    if (window.electronAPI) {
      try {
        const loaded: LifeAppData = await window.electronAPI.loadData()
        // 只加载collections等数据，skillTrees由SkillTree store单独管理
        data.value = {
          ...loaded,
          skillTrees: []  // 清空，避免与SkillTree store冲突
        }
        dataPath.value = await window.electronAPI.getDataPath()
        // 保存完整数据引用
        fullData = loaded
        // 加载游戏化档案
        if (loaded.profile) {
          gStore.loadProfile(loaded.profile)
        }
      } catch (e) {
        console.error('loadData error:', e)
        data.value = {
          version: '2.1',
          skillTrees: [],
          collections: createDefaultCollections(),
          settings: { theme: 'dark', skillTreeLayout: 'horizontal', showWelcome: true, autoBackup: true },
          lastModified: Date.now()
        }
      }
    } else {
      const raw = localStorage.getItem('questlog-data')
      if (raw) {
        const loaded: LifeAppData = JSON.parse(raw)
        data.value = {
          ...loaded,
          skillTrees: []  // 清空，避免与SkillTree store冲突
        }
        fullData = loaded
        // 加载游戏化档案
        if (loaded.profile) {
          gStore.loadProfile(loaded.profile)
        }
      } else {
        data.value = {
          version: '2.1',
          skillTrees: [],
          collections: createDefaultCollections(),
          settings: { theme: 'dark', skillTreeLayout: 'horizontal', showWelcome: true, autoBackup: true },
          lastModified: Date.now()
        }
        fullData = null
      }
    }
  }

  async function saveData() {
    isSaving.value = true
    // 记录当前保存操作，用于后续等待
    currentSavePromise.value = (async () => {
      try {
        // Get gamification profile
        const gStore = useGamificationStore()
        const profile = gStore.getProfile()

        if (window.electronAPI && fullData && typeof fullData === 'object') {
          // 更新整个data到fullData（但保留skillTrees由SkillTree store单独保存）
          fullData.collections = data.value.collections
          fullData.lastModified = Date.now()
          fullData.profile = profile
          // toRaw() strips Vue Proxy - REQUIRED before IPC
          await window.electronAPI.saveData(toRaw(fullData))
        } else {
          const appData: LifeAppData = {
            version: '2.1',
            skillTrees: data.value.skillTrees,
            collections: data.value.collections,
            settings: { theme: theme.value, skillTreeLayout: 'horizontal', showWelcome: true, autoBackup: true },
            lastModified: Date.now(),
            profile
          }
          localStorage.setItem('questlog-data', JSON.stringify(appData))
        }
      } catch (e) {
        console.error('saveData error:', e)
      } finally {
        isSaving.value = false
      }
    })()
    await currentSavePromise.value
  }

  // 等待当前保存完成（用于其他store在读取数据前确保SOP已保存）
  async function waitForSave() {
    if (currentSavePromise.value) {
      await currentSavePromise.value
    }
  }

  function applyExternalData(d: LifeAppData) {
    data.value = d
    // Assign plain object to fullData - toRaw ensures no Proxy contamination
    fullData = JSON.parse(JSON.stringify(d))
  }

  function initTheme() {
    const saved = localStorage.getItem('questlog-theme') as 'dark'|'light'|null
    theme.value = saved ?? 'dark'   // default dark
    applyTheme(theme.value)
  }

  function applyTheme(t: 'dark'|'light') {
    document.documentElement.classList.toggle('dark',  t === 'dark')
    document.documentElement.classList.toggle('light', t === 'light')
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    applyTheme(theme.value)
    localStorage.setItem('questlog-theme', theme.value)
  }

  function toast(message: string, type: Toast['type'] = 'success') {
    const id = uid()
    toasts.value.push({ id, message, type })
    setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 3000)
  }

  function setDataPath(p: string) { dataPath.value = p }

  // ── Collections ──────────────────────────────────────────────────────────
  function createCollection(name: string, icon = '📁', color = '#6366f1'): Collection {
    const col: Collection = {
      id: uid(), name, icon, color,
      sortOrder: data.value.collections.length,
      folders: [
        {
          id: uid(),
          name: '示例文件夹',
          sortOrder: 0,
          sopItems: [
            {
              id: uid(),
              title: '示例 SOP',
              mermaidSource: 'graph LR\n  A[开始] --> B[步骤1]\n  B --> C[步骤2]\n  C --> D[完成]',
              variables: {},
              actionCards: [
                {
                  id: uid(),
                  title: '第一步',
                  language: 'bash',
                  code: '# 在这里编写你的步骤内容',
                  notes: '这是备注说明',
                  completed: false,
                  sortOrder: 0
                }
              ],
              sortOrder: 0
            }
          ]
        }
      ]
    }
    data.value.collections.push(col)
    saveData()
    // Collection achievement check
    const gStore = useGamificationStore()
    gStore.checkAchievements({ collectionCount: data.value.collections.length })
    return col
  }
  function updateCollection(id: string, patch: Partial<Pick<Collection,'name'|'icon'|'color'>>) {
    const c = data.value.collections.find(c => c.id === id)
    if (c) { Object.assign(c, patch); saveData() }
  }
  function deleteCollection(id: string) {
    data.value.collections = data.value.collections.filter(c => c.id !== id)
    if (activeSopId.value) {
      const ok = data.value.collections.some(c => c.folders.some(f => f.sopItems.some(s => s.id === activeSopId.value)))
      if (!ok) activeSopId.value = null
    }
    saveData()
  }

  // ── Folders ───────────────────────────────────────────────────────────────
  function createFolder(collectionId: string, name: string): Folder | null {
    const col = data.value.collections.find(c => c.id === collectionId)
    if (!col) return null
    // 检查同名文件夹是否已存在
    if (col.folders.some(f => f.name === name)) {
      toast(`文件夹 "${name}" 已存在`, 'error')
      return null
    }
    const f: Folder = { id: uid(), name, sortOrder: col.folders.length, sopItems: [] }
    col.folders.push(f); saveData(); return f
  }
  function renameFolder(collectionId: string, folderId: string, name: string) {
    const f = data.value.collections.find(c=>c.id===collectionId)?.folders.find(f=>f.id===folderId)
    if (f) { f.name = name; saveData() }
  }
  function deleteFolder(collectionId: string, folderId: string) {
    const col = data.value.collections.find(c=>c.id===collectionId)
    if (col) { col.folders = col.folders.filter(f=>f.id!==folderId); saveData() }
  }

  // 重置为默认示例数据
  function resetCollections() {
    const defaults = createDefaultCollections()
    data.value.collections = defaults
    // 确保 fullData 正确引用，以便 saveData() 能正确保存到 electron
    if (fullData) {
      fullData.collections = defaults
    } else if (window.electronAPI) {
      // fullData 为 null 但 electron 可用，需要重新初始化 fullData
      fullData = {
        version: '2.1',
        skillTrees: data.value.skillTrees,
        collections: defaults,
        settings: data.value.settings,
        lastModified: Date.now()
      }
    }
    saveData()
  }

  // ── SOP Items ─────────────────────────────────────────────────────────────
  function findSop(id: string): SopItem | undefined {
    for (const col of data.value.collections)
      for (const folder of col.folders) {
        const s = folder.sopItems.find(s=>s.id===id)
        if (s) return s
      }
  }
  function createSopItem(folderId: string, title: string): SopItem {
    let target: Folder | undefined
    for (const col of data.value.collections) {
      target = col.folders.find(f=>f.id===folderId)
      if (target) break
    }
    if (!target) throw new Error('Folder not found')
    const sop: SopItem = {
      id: uid(), title,
      mermaidSource: 'graph LR\n  A[开始] --> B[步骤]\n  B --> C[完成]',
      variables: {}, actionCards: [], sortOrder: target.sopItems.length, pinnedCardIds: []
    }
    target.sopItems.push(sop); saveData(); return sop
  }
  function updateSopItem(id: string, patch: Partial<Pick<SopItem,'title'|'mermaidSource'|'variables'|'pinnedCardIds'>>) {
    const s = findSop(id); if (s) { Object.assign(s, patch); saveData() }
  }
  function deleteSopItem(id: string) {
    for (const col of data.value.collections)
      for (const folder of col.folders) {
        const i = folder.sopItems.findIndex(s=>s.id===id)
        if (i !== -1) {
          folder.sopItems.splice(i, 1)
          if (activeSopId.value === id) activeSopId.value = null
          saveData(); return
        }
      }
  }

  // ── Action Cards ──────────────────────────────────────────────────────────
  function createCard(sopId: string, patch: Partial<ActionCard> = {}): ActionCard {
    const sop = findSop(sopId)!
    const card: ActionCard = {
      id: uid(), title: patch.title ?? '新卡片',
      language: patch.language ?? 'bash',
      code: patch.code ?? '', notes: patch.notes ?? '',
      completed: false, sortOrder: sop.actionCards.length
    }
    sop.actionCards.push(card); saveData(); return card
  }
  function updateCard(sopId: string, cardId: string, patch: Partial<ActionCard>) {
    const card = findSop(sopId)?.actionCards.find(c=>c.id===cardId)
    if (card) { Object.assign(card, patch); saveData() }
  }
  function toggleCard(sopId: string, cardId: string) {
    const card = findSop(sopId)?.actionCards.find(c=>c.id===cardId)
    if (card) {
      const wasCompleted = card.completed
      card.completed = !card.completed
      saveData()

      // Award XP on completion
      if (!wasCompleted && card.completed) {
        const gStore = useGamificationStore()
        gStore.addXp(gStore.XP_CARD_COMPLETE, '完成动作卡片')

        // Count total completed cards for achievements
        const allCards = data.value.collections.flatMap(c => c.folders.flatMap(f => f.sopItems.flatMap(s => s.actionCards)))
        const totalCompleted = allCards.filter(c => c.completed).length
        gStore.checkAchievements({ totalCardsCompleted: totalCompleted })
      }
    }
  }
  function deleteCard(sopId: string, cardId: string) {
    const sop = findSop(sopId)
    if (sop) {
      sop.actionCards = sop.actionCards.filter(c=>c.id!==cardId)
      sop.pinnedCardIds = (sop.pinnedCardIds??[]).filter(id=>id!==cardId)
      saveData()
    }
  }
  function togglePinCard(sopId: string, cardId: string) {
    const sop = findSop(sopId)
    if (!sop) return
    const pins = sop.pinnedCardIds ?? []
    if (pins.includes(cardId)) sop.pinnedCardIds = pins.filter(id=>id!==cardId)
    else sop.pinnedCardIds = [...pins, cardId]
    saveData()
  }

  function resolveCode(code: string, variables: Record<string,string>): string {
    return code.replace(/\{\{(\w+)\}\}/g, (_, k) => variables[k] ?? `{{${k}}}`)
  }

  return {
    data, activeSopId, activeSop, theme, toasts, isSaving,
    searchQuery, searchResults, completionStats, dataPath, showSettings,
    loadData, saveData, waitForSave, applyExternalData, initTheme, toggleTheme, toast, setDataPath,
    createCollection, updateCollection, deleteCollection, resetCollections,
    createFolder, renameFolder, deleteFolder,
    findSop, createSopItem, updateSopItem, deleteSopItem,
    createCard, updateCard, toggleCard, deleteCard, togglePinCard,
    resolveCode,
  }
})
