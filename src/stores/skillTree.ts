import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SkillNode, Stage, Evidence, SkillStatus, StageStatus, Milestone } from '@/types'
import { useGamificationStore } from './gamification'
import { useSopStore } from './sop'

function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36) }

// CRITICAL: strip Vue Proxy before any IPC call
function toRaw<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// 默认种子数据
function createDefaultSkillTree(): SkillNode[] {
  const now = Date.now()
  return [
    {
      id: uid(),
      title: '公开演讲能力',
      icon: '🎤',
      description: '掌握演讲技巧，提升公众表达力与影响力',
      status: 'in-progress',
      progress: 35,
      stages: [
        {
          id: uid(),
          name: '基础训练',
          order: 1,
          target: '完成10次不同主题的3分钟即兴演讲\n整理演讲框架笔记不少于5篇',
          evidence: [],
          reward: '专业演讲培训课程',
          status: 'completed',
          completedAt: now - 86400000 * 5,
          createdAt: now - 86400000 * 15
        },
        {
          id: uid(),
          name: '实战提升',
          order: 2,
          target: '完成3次部门内部分享\n获得至少10条有效反馈',
          evidence: [],
          reward: '行业会议演讲机会',
          status: 'in-progress',
          createdAt: now - 86400000 * 8
        },
        {
          id: uid(),
          name: '专业认证',
          order: 3,
          target: '完成 Toastmasters 认证\n在大型会议进行主题演讲',
          evidence: [],
          reward: '个人品牌影响力提升',
          status: 'locked',
          createdAt: now
        }
      ],
      children: [],
      createdAt: now - 86400000 * 20,
      updatedAt: now
    },
    {
      id: uid(),
      title: '专业技术输出',
      icon: '💻',
      description: '建立个人技术品牌，输出高质量技术内容',
      status: 'in-progress',
      progress: 50,
      stages: [
        {
          id: uid(),
          name: '知识积累',
          order: 1,
          target: '阅读12本专业技术书籍\n完成每本书的核心笔记',
          evidence: [],
          reward: '技术书籍套装',
          status: 'completed',
          completedAt: now - 86400000 * 10,
          createdAt: now - 86400000 * 30
        },
        {
          id: uid(),
          name: '内容创作',
          order: 2,
          target: '发布8篇高质量技术博客\n单篇文章阅读量超过1000',
          evidence: [],
          reward: '技术大会分享机会',
          status: 'in-progress',
          createdAt: now - 86400000 * 5
        },
        {
          id: uid(),
          name: '影响力建设',
          order: 3,
          target: '建立个人技术专栏\n粉丝数突破5000',
          evidence: [],
          reward: '技术顾问资格',
          status: 'locked',
          createdAt: now
        }
      ],
      children: [],
      createdAt: now - 86400000 * 35,
      updatedAt: now
    },
    {
      id: uid(),
      title: '项目管理能力',
      icon: '📊',
      description: '掌握现代项目管理方法论，成功交付项目',
      status: 'in-progress',
      progress: 25,
      stages: [
        {
          id: uid(),
          name: '方法论学习',
          order: 1,
          target: '系统学习 PMP/ACP 知识体系\n完成敏捷管理认证',
          evidence: [],
          reward: 'PMP 认证考试费用',
          status: 'completed',
          completedAt: now - 86400000 * 3,
          createdAt: now - 86400000 * 20
        },
        {
          id: uid(),
          name: '项目实践',
          order: 2,
          target: '主导完成2个中型项目\n项目交付满意度超过90%',
          evidence: [],
          reward: '项目管理工具套装',
          status: 'in-progress',
          createdAt: now - 86400000 * 7
        },
        {
          id: uid(),
          name: '团队领导',
          order: 3,
          target: '带领10人以上团队完成项目\n形成可复制的项目方法论',
          evidence: [],
          reward: '晋升管理层机会',
          status: 'locked',
          createdAt: now
        }
      ],
      children: [],
      createdAt: now - 86400000 * 25,
      updatedAt: now
    },
    {
      id: uid(),
      title: '财务规划能力',
      icon: '💰',
      description: '建立健康的财务观念与投资体系',
      status: 'in-progress',
      progress: 0,
      stages: [
        {
          id: uid(),
          name: '预算管理',
          order: 1,
          target: '完成3个月的预算记录\n建立个人预算管理体系',
          evidence: [],
          reward: '理财规划工具',
          status: 'in-progress',
          createdAt: now - 86400000 * 10
        },
        {
          id: uid(),
          name: '投资入门',
          order: 2,
          target: '完成投资模拟组合\n实现年化收益10%以上',
          evidence: [],
          reward: '实盘投资启动资金',
          status: 'locked',
          createdAt: now
        },
        {
          id: uid(),
          name: '资产配置',
          order: 3,
          target: '完成多元化资产配置\n建立被动收入渠道',
          evidence: [],
          reward: '财务自由里程碑',
          status: 'locked',
          createdAt: now
        }
      ],
      children: [],
      createdAt: now - 86400000 * 30,
      updatedAt: now
    },
    {
      id: uid(),
      title: '身心健康管理',
      icon: '🧘',
      description: '保持身体健康与心理平衡，实现可持续发展',
      status: 'in-progress',
      progress: 45,
      stages: [
        {
          id: uid(),
          name: '体能建设',
          order: 1,
          target: '连续100天每天运动30分钟\n体脂率下降至标准范围',
          evidence: [],
          reward: '专业运动装备',
          status: 'completed',
          completedAt: now - 86400000 * 8,
          createdAt: now - 86400000 * 50
        },
        {
          id: uid(),
          name: '耐力挑战',
          order: 2,
          target: '完成半程马拉松（21公里）\n攀岩高度超过20米',
          evidence: [],
          reward: '户外探险之旅',
          status: 'in-progress',
          createdAt: now - 86400000 * 12
        },
        {
          id: uid(),
          name: '极限突破',
          order: 3,
          target: '完成全程马拉松\n完成百公里徒步',
          evidence: [],
          reward: '完成人生挑战清单',
          status: 'locked',
          createdAt: now
        }
      ],
      children: [],
      createdAt: now - 86400000 * 55,
      updatedAt: now
    }
  ]
}

export const useSkillTreeStore = defineStore('skillTree', () => {
  const skillTrees = ref<SkillNode[]>([])
  const activeSkillId = ref<string | null>(null)
  const expandedSkillIds = ref<Set<string>>(new Set())
  const activeStageId = ref<string | null>(null)
  // 刷新键，用于强制触发响应式更新
  const refreshKey = ref(0)
  // 保存键，用于追踪是否需要保存
  const saveKey = ref(0)
  // UI设置 - 折叠完成开关（true = 已展开的技能会折叠）
  const autoCollapseCompleted = ref(false)

  // 计算属性
  const activeSkill = computed(() => {
    if (!activeSkillId.value) return null
    return findSkillById(activeSkillId.value)
  })

  const activeStage = computed(() => {
    if (!activeStageId.value) return null
    for (const skill of skillTrees.value) {
      const stage = findStageInSkill(skill, activeStageId.value)
      if (stage) return stage
    }
    return null
  })

  const inProgressSkills = computed(() => {
    return skillTrees.value.filter(s => s.status === 'in-progress')
  })

  const completedStagesCount = computed(() => {
    let count = 0
    for (const skill of skillTrees.value) {
      count += skill.stages.filter(s => s.status === 'completed').length
    }
    return count
  })

  // 工具函数
  function findSkillById(id: string): SkillNode | null {
    for (const skill of skillTrees.value) {
      if (skill.id === id) return skill
      const found = findSkillInChildren(skill, id)
      if (found) return found
    }
    return null
  }

  function findSkillInChildren(parent: SkillNode, id: string): SkillNode | null {
    for (const child of parent.children) {
      if (child.id === id) return child
      const found = findSkillInChildren(child, id)
      if (found) return found
    }
    return null
  }

  function findStageInSkill(skill: SkillNode, stageId: string): Stage | null {
    for (const stage of skill.stages) {
      if (stage.id === stageId) return stage
    }
    for (const child of skill.children) {
      const found = findStageInSkill(child, stageId)
      if (found) return found
    }
    return null
  }

  function findStageOwner(stageId: string): { skill: SkillNode; stage: Stage } | null {
    for (const skill of skillTrees.value) {
      const stage = findStageInSkill(skill, stageId)
      if (stage) return { skill, stage }
      for (const child of skill.children) {
        const found = findStageInSkill(child, stageId)
        if (found) return { skill: child, stage: found }
      }
    }
    return null
  }

  // 技能CRUD
  function createSkill(title: string, icon = '📚', description = ''): SkillNode {
    const now = Date.now()
    const skill: SkillNode = {
      id: uid(),
      title,
      icon,
      description,
      status: 'locked',
      progress: 0,
      stages: [],
      children: [],
      createdAt: now,
      updatedAt: now
    }
    skillTrees.value.push(skill)
    saveData()
    return skill
  }

  function updateSkill(id: string, patch: Partial<Pick<SkillNode, 'title' | 'icon' | 'description' | 'status' | 'progress'>>) {
    const skill = findSkillById(id)
    if (skill) {
      Object.assign(skill, patch, { updatedAt: Date.now() })
      saveData()
    }
  }

  function deleteSkill(id: string) {
    skillTrees.value = skillTrees.value.filter(s => s.id !== id)
    if (activeSkillId.value === id) activeSkillId.value = null
    saveData()
  }

  // 阶段管理
  function addStage(skillId: string, name: string, target: string, reward: string, achievementId?: string): Stage | null {
    const skill = findSkillById(skillId)
    if (!skill) return null

    const now = Date.now()
    const stage: Stage = {
      id: uid(),
      name,
      order: skill.stages.length + 1,
      target,
      evidence: [],
      reward,
      achievementId,
      status: skill.stages.length === 0 ? 'in-progress' : 'locked',
      createdAt: now,
      milestones: []
    }
    skill.stages.push(stage)
    skill.updatedAt = now

    // 更新技能状态
    updateSkillStatus(skill)
    saveData()
    return stage
  }

  function updateStage(skillId: string, stageId: string, patch: Partial<Pick<Stage, 'name' | 'target' | 'reward' | 'status' | 'sopId' | 'achievementId'>>) {
    const owner = findStageOwner(stageId)
    if (owner) {
      Object.assign(owner.stage, patch)
      saveData()
    }
  }

  function deleteStage(skillId: string, stageId: string) {
    const skill = findSkillById(skillId)
    if (skill) {
      skill.stages = skill.stages.filter(s => s.id !== stageId)
      // 重新排序
      skill.stages.forEach((s, i) => { s.order = i + 1 })
      updateSkillStatus(skill)
      saveData()
    }
  }

  // 里程碑管理
  function addMilestone(stageId: string, title: string): Milestone | null {
    const owner = findStageOwner(stageId)
    if (!owner) return null

    const milestone: Milestone = {
      id: uid(),
      title,
      completed: false
    }
    if (!owner.stage.milestones) {
      owner.stage.milestones = []
    }
    owner.stage.milestones.push(milestone)
    saveData()
    return milestone
  }

  function addMilestoneWithCompleted(stageId: string, title: string, completed: boolean): Milestone | null {
    const owner = findStageOwner(stageId)
    if (!owner) return null

    const milestone: Milestone = {
      id: uid(),
      title,
      completed
    }
    if (!owner.stage.milestones) {
      owner.stage.milestones = []
    }
    owner.stage.milestones.push(milestone)
    saveData()
    return milestone
  }

  function updateMilestone(stageId: string, milestoneId: string, patch: Partial<Pick<Milestone, 'title' | 'completed'>>) {
    const owner = findStageOwner(stageId)
    if (!owner || !owner.stage.milestones) return

    const milestone = owner.stage.milestones.find(m => m.id === milestoneId)
    if (milestone) {
      Object.assign(milestone, patch)
      if (patch.completed) {
        milestone.completedAt = Date.now()
      }
      saveData()
    }
  }

  function deleteMilestone(stageId: string, milestoneId: string) {
    const owner = findStageOwner(stageId)
    if (!owner || !owner.stage.milestones) return

    owner.stage.milestones = owner.stage.milestones.filter(m => m.id !== milestoneId)
    saveData()
  }

  function toggleMilestone(stageId: string, milestoneId: string) {
    const owner = findStageOwner(stageId)
    if (!owner || !owner.stage.milestones) return

    const milestone = owner.stage.milestones.find(m => m.id === milestoneId)
    if (!milestone) return

    // 已完成的阶段不能通过点击里程碑回退
    if (owner.stage.status === 'completed') return

    const newCompleted = !milestone.completed

    // 使用索引直接更新，确保响应式追踪
    const milestoneIndex = owner.stage.milestones.findIndex(m => m.id === milestoneId)
    if (milestoneIndex !== -1) {
      owner.stage.milestones[milestoneIndex] = {
        ...milestone,
        completed: newCompleted,
        completedAt: newCompleted ? Date.now() : undefined
      }
    }

    // 根据里程碑完成情况自动更新阶段状态
    updateStageStatusFromMilestones(owner.skill, owner.stage)

    // 强制触发响应式更新
    refreshKey.value++
    skillTrees.value = [...skillTrees.value]
  }

  // 根据里程碑完成情况更新阶段状态
  function updateStageStatusFromMilestones(skill: SkillNode, stage: Stage) {
    const milestones = stage.milestones || []

    // 如果没有里程碑，保持原状态
    if (milestones.length === 0) return

    const completedCount = milestones.filter(m => m.completed).length

    // 不再自动完成阶段 - 用户需要手动完成阶段
    // 即使所有里程碑完成，也只更新进行中状态
    if (completedCount > 0) {
      // 有里程碑完成，阶段变为进行中
      stage.status = 'in-progress'
      // 如果之前已完成但现在部分完成，需要清除完成状态
      if (stage.completedAt && completedCount < milestones.length) {
        stage.completedAt = undefined
      }
    } else {
      // 没有里程碑完成，保持锁定状态（如果是新阶段应该是进行中）
      if (stage.status === 'in-progress' && milestones.length > 0) {
        // 保持进行中
      }
    }

    // 更新技能状态和进度
    updateSkillStatus(skill)
    calculateSkillProgress(skill.id)
  }

  // 阶段完成
  function completeStage(stageId: string, evidence: Evidence[] = [], sopId?: string) {
    const owner = findStageOwner(stageId)
    if (!owner) return

    const { skill, stage } = owner
    stage.evidence = evidence
    if (sopId) stage.sopId = sopId
    stage.status = 'completed'
    stage.completedAt = Date.now()
    skill.updatedAt = Date.now()

    // 解锁下一阶段
    unlockNextStage(skill, stage.order)

    // 更新技能状态和进度
    updateSkillStatus(skill)
    calculateSkillProgress(skill.id)

    // Award XP for stage completion
    const gStore = useGamificationStore()
    gStore.addXp(gStore.XP_STAGE_COMPLETE, '完成阶段')

    // 如果有关联的成就，自动解锁
    if (stage.achievementId) {
      gStore.unlockAchievement(stage.achievementId)
    }

    // Count total completed stages and skills
    let totalStagesCompleted = 0
    let totalSkillsCompleted = 0
    let skillsUnlocked = 0
    for (const s of skillTrees.value) {
      if (s.stages.every(st => st.status === 'completed')) totalSkillsCompleted++
      totalStagesCompleted += s.stages.filter(st => st.status === 'completed').length
      if (s.status === 'unlocked') skillsUnlocked++
    }
    gStore.checkAchievements({
      totalStagesCompleted,
      totalSkillsCompleted,
      skillCount: skillTrees.value.length,
      skillsUnlocked
    })

    // 强制触发响应式更新
    refreshKey.value++
    skillTrees.value = [...skillTrees.value]
  }

  function unlockNextStage(skill: SkillNode, completedOrder: number) {
    const nextStage = skill.stages.find(s => s.order === completedOrder + 1)
    if (nextStage && nextStage.status === 'locked') {
      nextStage.status = 'in-progress'
    }
  }

  function updateSkillStatus(skill: SkillNode) {
    if (skill.stages.length === 0) {
      skill.status = 'locked'
      return
    }

    const allCompleted = skill.stages.every(s => s.status === 'completed')
    const anyInProgress = skill.stages.some(s => s.status === 'in-progress')

    if (allCompleted) {
      skill.status = 'unlocked'
    } else if (anyInProgress) {
      skill.status = 'in-progress'
    } else {
      skill.status = 'locked'
    }
  }

  function calculateSkillProgress(skillId: string): number {
    const skill = findSkillById(skillId)
    if (!skill || skill.stages.length === 0) return 0

    const completedCount = skill.stages.filter(s => s.status === 'completed').length
    const progress = Math.round((completedCount / skill.stages.length) * 100)
    skill.progress = progress
    return progress
  }

  // 证明材料
  function addEvidence(stageId: string, evidence: Evidence) {
    const owner = findStageOwner(stageId)
    if (owner) {
      owner.stage.evidence.push(evidence)
      saveData()
    }
  }

  function removeEvidence(stageId: string, evidenceId: string) {
    const owner = findStageOwner(stageId)
    if (owner) {
      owner.stage.evidence = owner.stage.evidence.filter(e => e.id !== evidenceId)
      saveData()
    }
  }

  // 展开/折叠
  function toggleExpand(skillId: string) {
    if (expandedSkillIds.value.has(skillId)) {
      expandedSkillIds.value.delete(skillId)
    } else {
      expandedSkillIds.value.add(skillId)
    }
  }

  function expandSkill(skillId: string) {
    expandedSkillIds.value.add(skillId)
  }

  function collapseSkill(skillId: string) {
    expandedSkillIds.value.delete(skillId)
  }

  function isExpanded(skillId: string): boolean {
    return expandedSkillIds.value.has(skillId)
  }

  // 激活状态
  function setActiveSkill(skillId: string | null) {
    activeSkillId.value = skillId
    if (skillId) {
      expandSkill(skillId)
    }
  }

  function setActiveStage(stageId: string | null) {
    activeStageId.value = stageId
  }

  // 数据加载/保存
  function loadSkillTrees(data: SkillNode[]) {
    skillTrees.value = data || createDefaultSkillTree()
  }

  function getSkillTreesData(): SkillNode[] {
    return toRaw(skillTrees.value)
  }

  function resetToDefault() {
    skillTrees.value = createDefaultSkillTree()
    saveData()
  }

  // 导入技能树（从 Markdown 解析）
  function importSkillTreesFromMarkdown(markdown: string): { success: boolean; count: number; error?: string } {
    try {
      // 简单 Markdown 解析 - 解析 ## 技能标题格式
      // 格式: ## [图标] 技能名 [等级] (进度%) 或 ## 技能名
      const skillBlocks = markdown.split(/^##\s*/m).filter(b => b.trim())

      if (skillBlocks.length === 0) {
        return { success: false, count: 0, error: '未找到技能数据' }
      }

      const importedSkills: SkillNode[] = []
      const now = Date.now()

      for (const block of skillBlocks) {
        const lines = block.trim().split('\n')
        if (lines.length === 0) continue

        // 解析技能标题行
        const titleLine = lines[0]
        // 匹配格式: [图标] 技能名 [等级] (进度%) 或 [图标] 技能名
        const skillMatch = titleLine.match(/^([^\[]+?)\s*(?:\[(Lv\.\d+|Lv\.MAX)\])?\s*\(?(\d+)%?\)?\)?/)
        if (!skillMatch) continue

        let title = skillMatch[1].trim()
        const progress = skillMatch[3] ? parseInt(skillMatch[3]) : 0

        // 提取图标（标题开头第一个字符如果是emoji）
        let icon = '📚'
        // 简单的 emoji 检测 - 常见的 emoji 范围
        const emojiMatch = title.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}])/u)
        if (emojiMatch) {
          icon = emojiMatch[1]
          title = title.substring(emojiMatch[0].length).trim()
        }

        const skill: SkillNode = {
          id: uid(),
          title,
          icon,
          description: '',
          status: progress > 0 ? (progress === 100 ? 'unlocked' : 'in-progress') : 'locked',
          progress,
          stages: [],
          children: [],
          createdAt: now,
          updatedAt: now
        }

        // 解析描述
        const descMatch = block.match(/\*\*([^*]+)\*\*/)
        if (descMatch) {
          skill.description = descMatch[1].trim()
        }

        // 解析阶段
        const stageBlocks = block.split(/^###\s*阶段\s*\d+:/m).filter(b => b.trim())
        for (const stageBlock of stageBlocks) {
          const stageLines = stageBlock.trim().split('\n')
          if (stageLines.length === 0) continue

          // 解析阶段名称（格式：阶段 N: 阶段名 [状态]）
          // 提取冒号后面的部分并去除状态 emoji
          const stageNamePart = stageLines[0].replace(/^[^:]+:\s*/, '').trim()
          // 去除末尾的状态 emoji 和文字
          const stageName = stageNamePart.replace(/[\s🎯✅⬜]+$/, '').trim() || stageNamePart.split(/\s{2,}/)[0].trim()

          // 解析状态
          let stageStatus: 'locked' | 'in-progress' | 'completed' = 'locked'
          if (stageLines[0].includes('✅') || stageLines[0].includes('已完成')) {
            stageStatus = 'completed'
          } else if (stageLines[0].includes('🎯') || stageLines[0].includes('进行中')) {
            stageStatus = 'in-progress'
          }

          // 解析目标
          let target = ''
          const targetMatch = block.match(/\*\*目标\*\*[:：]?\s*([\s\S]*?)(?=\*\*奖励\*\*|\*\*状态\*\*|$)/i)
          if (targetMatch) {
            target = targetMatch[1].replace(/^[\s>]+/gm, '').replace(/^-+\s*/gm, '\n').trim()
          }

          // 解析奖励
          let reward = ''
          const rewardMatch = block.match(/\*\*奖励\*\*[:：]?\s*(.+?)(?=\*\*状态\*\*|$)/i)
          if (rewardMatch) {
            reward = rewardMatch[1].trim()
          }

          const stage: Stage = {
            id: uid(),
            name: stageName,
            order: skill.stages.length + 1,
            target,
            evidence: [],
            reward,
            status: stageStatus,
            createdAt: now,
            milestones: []
          }

          if (stageStatus === 'completed') {
            stage.completedAt = now
          }

          skill.stages.push(stage)
        }

        importedSkills.push(skill)
      }

      if (importedSkills.length === 0) {
        return { success: false, count: 0, error: '未能解析出有效的技能数据' }
      }

      // 询问用户是追加还是替换
      skillTrees.value = importedSkills
      saveData()

      return { success: true, count: importedSkills.length }
    } catch (e) {
      return { success: false, count: 0, error: String(e) }
    }
  }

  // 持久化保存
  async function saveData() {
    saveKey.value++ // 触发保存
    const data = toRaw(skillTrees.value)
    try {
      if (window.electronAPI) {
        // 重要：先等待 SOP store 的保存完成，避免数据被覆盖
        const sopStore = useSopStore()
        await sopStore.waitForSave()
        // 获取当前完整数据，合并技能树后保存
        const fullData = await window.electronAPI.loadData()
        fullData.skillTrees = data
        fullData.lastModified = Date.now()
        // 保存展开状态
        fullData.expandedSkillIds = Array.from(expandedSkillIds.value)
        fullData.autoCollapseCompleted = autoCollapseCompleted.value
        await window.electronAPI.saveData(fullData)
      } else {
        // Web 环境：使用 localStorage
        const raw = localStorage.getItem('questlog-data')
        let appData: any = raw ? JSON.parse(raw) : {}
        appData.skillTrees = data
        appData.lastModified = Date.now()
        appData.expandedSkillIds = Array.from(expandedSkillIds.value)
        appData.autoCollapseCompleted = autoCollapseCompleted.value
        localStorage.setItem('questlog-data', JSON.stringify(appData))
      }
    } catch (e) {
      console.error('saveData error:', e)
    }
  }

  // 持久化加载
  async function loadData() {
    try {
      if (window.electronAPI) {
        const fullData = await window.electronAPI.loadData()
        if (fullData.skillTrees && fullData.skillTrees.length > 0) {
          skillTrees.value = fullData.skillTrees
          // 恢复展开状态
          if (fullData.expandedSkillIds && Array.isArray(fullData.expandedSkillIds)) {
            expandedSkillIds.value = new Set(fullData.expandedSkillIds)
          }
          // 恢复折叠设置
          if (typeof fullData.autoCollapseCompleted === 'boolean') {
            autoCollapseCompleted.value = fullData.autoCollapseCompleted
          }
        } else {
          skillTrees.value = createDefaultSkillTree()
        }
      } else {
        // Web 环境：使用 localStorage
        const raw = localStorage.getItem('questlog-data')
        if (raw) {
          const appData = JSON.parse(raw)
          if (appData.skillTrees && appData.skillTrees.length > 0) {
            skillTrees.value = appData.skillTrees
            // 恢复展开状态
            if (appData.expandedSkillIds && Array.isArray(appData.expandedSkillIds)) {
              expandedSkillIds.value = new Set(appData.expandedSkillIds)
            }
            // 恢复折叠设置
            if (typeof appData.autoCollapseCompleted === 'boolean') {
              autoCollapseCompleted.value = appData.autoCollapseCompleted
            }
            return
          }
        }
        skillTrees.value = createDefaultSkillTree()
      }
    } catch (e) {
      console.error('loadData error:', e)
      skillTrees.value = createDefaultSkillTree()
    }
  }

  return {
    // State
    skillTrees,
    activeSkillId,
    expandedSkillIds,
    activeStageId,
    refreshKey,
    autoCollapseCompleted,

    // Computed
    activeSkill,
    activeStage,
    inProgressSkills,
    completedStagesCount,

    // Skill CRUD
    createSkill,
    updateSkill,
    deleteSkill,

    // Stage管理
    addStage,
    updateStage,
    deleteStage,
    completeStage,

    // 里程碑管理
    addMilestone,
    addMilestoneWithCompleted,
    updateMilestone,
    deleteMilestone,
    toggleMilestone,

    // 证明材料
    addEvidence,
    removeEvidence,

    // 进度
    calculateSkillProgress,

    // 展开/折叠
    toggleExpand,
    expandSkill,
    collapseSkill,
    isExpanded,

    // 激活状态
    setActiveSkill,
    setActiveStage,

    // 数据
    loadSkillTrees,
    getSkillTreesData,
    resetToDefault,
    saveData,
    loadData,
    importSkillTreesFromMarkdown,
  }
})