<template>
  <div class="skill-tree-view">
    <!-- 顶部工具栏 -->
    <div class="skill-tree-view__toolbar">
      <div class="toolbar-left">
        <h1 class="toolbar-title">🌲 技能图谱</h1>
        <span class="toolbar-subtitle">{{ store.inProgressSkills.length }}个技能进行中</span>
      </div>
      <div class="toolbar-right">
        <button
          class="btn-toolbar btn-toolbar--secondary"
          :class="{ 'btn-toolbar--active': allCollapsed }"
          @click="toggleExpandAll"
          :title="allCollapsed ? '展开全部技能' : '收起全部技能'"
        >
          <span class="btn-icon">{{ allCollapsed ? '🔽' : '🔼' }}</span>
          <span>{{ allCollapsed ? '展开全部' : '收起全部' }}</span>
        </button>
        <div class="toolbar-divider"></div>
        <label class="toggle-switch" title="隐藏已完成阶段">
          <input type="checkbox" v-model="hideCompletedStages" />
          <span class="toggle-slider"></span>
          <span class="toggle-label">隐藏已完成</span>
        </label>
        <div class="toolbar-divider"></div>
        <button class="btn-toolbar btn-toolbar--secondary" @click="handleExport" title="导出技能树">
          <span class="btn-icon">📤</span>
          <span>导出</span>
        </button>
        <button class="btn-toolbar btn-toolbar--secondary" @click="handleImport" title="导入技能树">
          <span class="btn-icon">📥</span>
          <span>导入</span>
        </button>
        <button class="btn-toolbar btn-toolbar--primary" @click="showNewSkillModal = true" title="新建技能">
          <span class="btn-icon">✨</span>
          <span>新建技能</span>
        </button>
      </div>
    </div>

    <!-- 技能树画布 -->
    <div
      class="skill-tree-view__canvas"
      ref="canvasRef"
      :class="{ 'is-panning': isPanning }"
      @mousedown="startPan"
      @mousemove="doPan"
      @mouseup="endPan"
      @mouseleave="endPan"
    >
      <!-- SVG连接线层 -->
      <svg v-if="store.skillTrees.length > 0" class="skill-tree-view__svg">
        <defs>
          <marker id="arrow-primary" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="var(--primary)" opacity="0.6"/>
          </marker>
          <marker id="arrow-success" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="var(--success)" opacity="0.6"/>
          </marker>
          <marker id="arrow-locked" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="var(--locked)" opacity="0.4"/>
          </marker>
        </defs>

        <!-- 技能之间的连接线 -->
        <g v-for="(link, idx) in skillConnections" :key="'skill-link-' + idx">
          <path
            :d="link.path"
            :stroke="link.color"
            stroke-width="2"
            fill="none"
            :stroke-dasharray="link.dashed ? '6,4' : 'none'"
            :opacity="link.opacity"
            :marker-end="link.marker"
            class="connection-line"
          />
        </g>
      </svg>

      <!-- 空状态 -->
      <div v-if="store.skillTrees.length === 0" class="skill-tree-view__empty">
        <div class="empty-icon">🌲</div>
        <h2 class="empty-title">还没有技能树</h2>
        <p class="empty-desc">点击下方按钮开始构建你的技能图谱</p>
        <button class="btn-primary" @click="showNewSkillModal = true">
          ➕ 添加第一个技能
        </button>
      </div>

      <!-- 技能列表 -->
      <div v-else class="skill-tree-view__tree">
        <div
          v-for="skill in store.skillTrees"
          :key="skill.id + '-' + store.refreshKey"
          class="skill-tree-view__skill-group"
        >
          <!-- 技能卡片 - 用于连接线计算 -->
          <div :ref="el => setSkillRef(skill.id, el as HTMLElement)" class="skill-card-anchor">
            <SkillCard
              :skill="skill"
              :is-expanded="store.isExpanded(skill.id)"
              @click="handleSkillClick"
              @toggle-expand="handleSkillToggle"
              @edit="openEditSkill"
              @delete="confirmDeleteSkill"
            />
          </div>

          <!-- 展开的阶段列表 -->
          <Transition name="stages-expand">
            <div v-if="store.isExpanded(skill.id)" class="skill-tree-view__stages">
              <div
                v-for="stage in (hideCompletedStages ? skill.stages.filter(s => s.status !== 'completed') : skill.stages)"
                :key="stage.id + '-' + store.refreshKey"
                class="skill-tree-view__stage-item"
              >
                <StageCard
                  :stage="stage"
                  :skill-title="skill.title"
                  @click="handleStageClick"
                  @edit="openEditStage"
                  @delete="confirmDeleteStage"
                  @preview-evidence="handlePreviewEvidence"
                />
              </div>

              <!-- 添加阶段按钮 -->
              <button
                class="btn-add-stage"
                @click="openAddStage(skill)"
              >
                <span>➕</span>
                <span>添加阶段</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- 底部统计栏 -->
    <div class="skill-tree-view__footer">
      <div class="footer-left">
        <!-- 占位，保持布局 -->
      </div>
      <div class="footer-center">
        <div class="footer-stat">
          <span class="stat-value">{{ store.skillTrees.length }}</span>
          <span class="stat-label">总技能</span>
        </div>
        <div class="footer-divider"></div>
        <div class="footer-stat">
          <span class="stat-value">{{ store.completedStagesCount }}</span>
          <span class="stat-label">已完成</span>
        </div>
        <div class="footer-divider"></div>
        <div class="footer-stat">
          <span class="stat-value">{{ totalInProgress }}</span>
          <span class="stat-label">进行中</span>
        </div>
      </div>
      <div class="footer-right">
        <!-- 占位，保持布局 -->
      </div>
    </div>

    <!-- 新建/编辑技能Modal -->
    <NewSkillModal
      v-if="showNewSkillModal"
      :skill="editingSkill"
      @close="closeNewSkillModal"
      @save="saveSkill"
    />

    <!-- 添加/编辑阶段Modal -->
    <AddStageModal
      v-if="showAddStageModal"
      :skill="stageOwnerSkill"
      :stage="editingStage"
      @close="closeAddStageModal"
      @save="saveStage"
    />

    <!-- 达成Modal -->
    <AchievementModal
      v-if="showAchievementModal"
      :stage="activeStageData"
      :skill-title="activeSkillTitle"
      :initial-preview-item="initialPreviewItem"
      @close="closeAchievementModal"
      @confirm="handleAchievementConfirm"
      @open-sop="openSopEditor"
    />

    <!-- 完成闪烁效果 -->
    <Transition name="flash">
      <div v-if="showCompletionFlash" class="completion-flash"></div>
    </Transition>

    <!-- 任务手册 Modal -->
    <SopManagerModal
      v-if="showSopManagerModal"
      :linked-sop-id="linkingSopId"
      @close="showSopManagerModal = false"
      @select="handleSopSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, onMounted, nextTick, watch } from 'vue'
import { useSkillTreeStore } from '@/stores/skillTree'
import { useGamificationStore } from '@/stores/gamification'
import type { SkillNode, Stage, Evidence } from '@/types'
import SkillCard from './SkillCard.vue'
import StageCard from './StageCard.vue'
import NewSkillModal from '@/components/modals/NewSkillModal.vue'
import AddStageModal from '@/components/modals/AddStageModal.vue'
import AchievementModal from '@/components/modals/AchievementModal.vue'
import SopManagerModal from '@/components/modals/SopManagerModal.vue'

const store = useSkillTreeStore()
const gamificationStore = useGamificationStore()

const canvasRef = ref<HTMLElement | null>(null)
const skillRefs = ref<Map<string, HTMLElement>>(new Map())
const connectionsUpdateKey = ref(0)

// Pan/drag state
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const scrollStart = ref({ x: 0, y: 0 })
const scrollLeft = ref(0)
const scrollTop = ref(0)

// 隐藏已完成阶段开关
const hideCompletedStages = ref(false)

// 全部展开/收起状态
const allCollapsed = computed(() => {
  if (store.skillTrees.length === 0) return true
  return store.skillTrees.some(skill => !store.isExpanded(skill.id))
})

function toggleExpandAll() {
  if (allCollapsed.value) {
    // 展开全部
    store.skillTrees.forEach(skill => {
      if (skill.stages.length > 0) {
        store.expandSkill(skill.id)
      }
    })
  } else {
    // 收起全部
    store.skillTrees.forEach(skill => {
      store.collapseSkill(skill.id)
    })
  }
}

async function updateConnections() {
  // Wait for Vue to finish rendering DOM updates
  await nextTick()
  await nextTick()
  // Then wait for next animation frame to ensure layout is complete
  await new Promise(resolve => requestAnimationFrame(resolve))
  connectionsUpdateKey.value++
}

// Pan/drag handlers
function startPan(e: MouseEvent) {
  if (e.button !== 0) return // Only left mouse button
  const canvas = canvasRef.value
  if (!canvas) return
  isPanning.value = true
  panStart.value = { x: e.clientX, y: e.clientY }
  scrollStart.value = { x: canvas.scrollLeft, y: canvas.scrollTop }
  scrollLeft.value = canvas.scrollLeft
  scrollTop.value = canvas.scrollTop
  canvas.style.cursor = 'grabbing'
}

function doPan(e: MouseEvent) {
  if (!isPanning.value) return
  const canvas = canvasRef.value
  if (!canvas) return
  const dx = e.clientX - panStart.value.x
  const dy = e.clientY - panStart.value.y
  canvas.scrollLeft = scrollStart.value.x - dx
  canvas.scrollTop = scrollStart.value.y - dy
}

function endPan() {
  if (!isPanning.value) return
  isPanning.value = false
  if (canvasRef.value) {
    canvasRef.value.style.cursor = ''
  }
}

// Modal状态
const showNewSkillModal = ref(false)
const showAddStageModal = ref(false)
const showAchievementModal = ref(false)
const showSopManagerModal = ref(false)
const showCompletionFlash = ref(false)

// 编辑状态
const editingSkill = ref<SkillNode | null>(null)
const editingStage = ref<Stage | null>(null)
const stageOwnerSkill = ref<SkillNode | null>(null)
const activeStageData = ref<Stage | null>(null)
const activeSkillTitle = ref('')
const linkingSopId = ref<string | undefined>(undefined)
const initialPreviewItem = ref<Evidence | null>(null)

// 暴露方法给父组件
defineExpose({
  showNewSkillModal: () => { showNewSkillModal.value = true }
})

// 计算属性
const totalInProgress = computed(() => {
  let count = 0
  for (const skill of store.skillTrees) {
    count += skill.stages.filter(s => s.status === 'in-progress').length
  }
  return count
})

// 连接线计算
interface Connection {
  path: string
  color: string
  opacity: number
  dashed: boolean
  marker: string
}

function setSkillRef(id: string, el: HTMLElement | null) {
  if (el) skillRefs.value.set(id, el)
  else skillRefs.value.delete(id)
}

const skillConnections = computed<Connection[]>(() => {
  // Access update key to create dependency
  void connectionsUpdateKey.value
  const connections: Connection[] = []
  const skills = store.skillTrees

  for (let i = 0; i < skills.length - 1; i++) {
    const fromSkill = skills[i]
    const toSkill = skills[i + 1]

    const fromEl = skillRefs.value.get(fromSkill.id)
    const toEl = skillRefs.value.get(toSkill.id)

    if (fromEl && toEl) {
      const fromRect = fromEl.getBoundingClientRect()
      const toRect = toEl.getBoundingClientRect()
      const canvasRect = canvasRef.value?.getBoundingClientRect()

      if (canvasRect) {
        const x1 = fromRect.left + fromRect.width / 2 - canvasRect.left
        const y1 = fromRect.bottom - canvasRect.top
        const x2 = toRect.left + toRect.width / 2 - canvasRect.left
        const y2 = toRect.top - canvasRect.top

        // Bezier曲线
        const midY = (y1 + y2) / 2
        const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`

        // 根据技能状态确定颜色
        let color = 'var(--primary)'
        let opacity = 0.5
        let dashed = false
        let marker = 'url(#arrow-primary)'

        if (fromSkill.status === 'unlocked' && toSkill.status === 'unlocked') {
          color = 'var(--success)'
          marker = 'url(#arrow-success)'
          opacity = 0.6
        } else if (fromSkill.status === 'locked' || toSkill.status === 'locked') {
          color = 'var(--locked)'
          marker = 'url(#arrow-locked)'
          opacity = 0.3
          dashed = true
        }

        connections.push({ path, color, opacity, dashed, marker })
      }
    }
  }

  return connections
})

// Watch for changes that require connection recalculation
watch(() => store.refreshKey, () => updateConnections())
watch(() => store.expandedSkillIds, () => updateConnections(), { deep: true })
watch(() => store.skillTrees.length, () => updateConnections())
// Also watch skillTrees directly to catch stage/status changes
watch(() => store.skillTrees, () => updateConnections(), { deep: true })

// 当技能树变化时，重新刷新每日挑战
watch(() => store.skillTrees, () => {
  const inProgressStages: { skillTitle: string; stageName: string; stageId: string; skillId: string }[] = []
  for (const skill of store.skillTrees) {
    for (const stage of skill.stages) {
      if (stage.status === 'in-progress') {
        inProgressStages.push({
          skillTitle: skill.title,
          stageName: stage.name,
          stageId: stage.id,
          skillId: skill.id
        })
      }
    }
  }
  gamificationStore.checkDailyChallenges(inProgressStages)
}, { deep: true })

onMounted(() => {
  updateConnections()
})

// 处理技能卡片点击
function handleSkillClick(skill: SkillNode) {
  store.setActiveSkill(skill.id)
  if (skill.stages.length > 0) {
    // 直接切换展开状态，不依赖于 setActiveSkill 中的 expandSkill
    if (store.isExpanded(skill.id)) {
      store.collapseSkill(skill.id)
    } else {
      store.expandSkill(skill.id)
    }
  }
}

// 处理展开/收起指示器点击
function handleSkillToggle(skillId: string) {
  if (store.isExpanded(skillId)) {
    store.collapseSkill(skillId)
  } else {
    store.expandSkill(skillId)
  }
}

// 处理阶段卡片点击
function handleStageClick(stage: Stage) {
  if (stage.status === 'locked') return

  activeStageData.value = stage

  // 找到所属技能
  for (const skill of store.skillTrees) {
    if (skill.stages.find(s => s.id === stage.id)) {
      activeSkillTitle.value = skill.title
      break
    }
  }

  if (stage.status === 'in-progress') {
    showAchievementModal.value = true
  } else if (stage.status === 'completed') {
    // 已完成阶段：允许查看附件
    showAchievementModal.value = true
  }
}

// 处理阶段卡片附件点击 - 直接打开预览
function handlePreviewEvidence(stage: Stage) {
  if (stage.status === 'locked') return
  if (stage.evidence.length === 0) return

  activeStageData.value = stage

  // 找到所属技能
  for (const skill of store.skillTrees) {
    if (skill.stages.find(s => s.id === stage.id)) {
      activeSkillTitle.value = skill.title
      break
    }
  }

  // 设置初始预览项为第一个附件
  initialPreviewItem.value = stage.evidence[0]
  showAchievementModal.value = true
}

// 新建技能
function openAddStage(skill: SkillNode) {
  stageOwnerSkill.value = markRaw(skill)
  editingStage.value = null
  showAddStageModal.value = true
}

// 编辑技能
function openEditSkill(skill: SkillNode) {
  editingSkill.value = markRaw(skill)
  showNewSkillModal.value = true
}

// 编辑阶段
function openEditStage(stage: Stage) {
  // 找到所属技能
  for (const skill of store.skillTrees) {
    if (skill.stages.find(s => s.id === stage.id)) {
      stageOwnerSkill.value = markRaw(skill)
      break
    }
  }
  editingStage.value = markRaw(stage)
  showAddStageModal.value = true
}

// 关闭新建技能Modal
function closeNewSkillModal() {
  showNewSkillModal.value = false
  editingSkill.value = null
}

// 关闭添加阶段Modal
function closeAddStageModal() {
  showAddStageModal.value = false
  editingStage.value = null
  stageOwnerSkill.value = null
}

// 关闭成就Modal
function closeAchievementModal() {
  showAchievementModal.value = false
  initialPreviewItem.value = null
}

// 保存技能
function saveSkill(data: { title: string; icon: string; description: string }) {
  if (editingSkill.value) {
    store.updateSkill(editingSkill.value.id, data)
  } else {
    store.createSkill(data.title, data.icon, data.description)
  }
  closeNewSkillModal()
}

// 保存阶段
function saveStage(data: { name: string; target: string; reward: string; achievementId?: string; milestones?: { title: string; completed?: boolean }[] }) {
  if (editingStage.value && stageOwnerSkill.value) {
    // 如果编辑的是已完成的阶段，重置状态为进行中
    const wasCompleted = editingStage.value.status === 'completed'
    if (wasCompleted) {
      editingStage.value.completedAt = undefined
    }
    store.updateStage(stageOwnerSkill.value.id, editingStage.value.id, {
      name: data.name,
      target: data.target,
      reward: data.reward,
      achievementId: data.achievementId,
      status: wasCompleted ? 'in-progress' : editingStage.value.status
    })
    // 更新里程碑 - 保留原始完成状态
    if (data.milestones !== undefined) {
      const stage = editingStage.value
      const oldMilestones = stage.milestones || []
      // 删除旧的里程碑
      if (stage.milestones) {
        for (const m of stage.milestones) {
          store.deleteMilestone(stage.id, m.id)
        }
      }
      // 添加新的里程碑，保留原始完成状态
      for (const m of data.milestones) {
        const oldMilestone = oldMilestones.find(om => om.title === m.title)
        const completed = oldMilestone?.completed || false
        store.addMilestoneWithCompleted(stage.id, m.title, completed)
      }
    }
  } else if (stageOwnerSkill.value) {
    const newStage = store.addStage(stageOwnerSkill.value.id, data.name, data.target, data.reward)
    // 添加里程碑
    if (data.milestones && newStage) {
      for (const m of data.milestones) {
        store.addMilestone(newStage.id, m.title)
      }
    }
    // 设置关联成就
    if (data.achievementId && newStage) {
      store.updateStage(stageOwnerSkill.value.id, newStage.id, { achievementId: data.achievementId })
    }
  }
  closeAddStageModal()
}

// 删除确认
function confirmDeleteSkill(skill: SkillNode) {
  if (confirm(`确定删除技能"${skill.title}"吗？此操作不可撤销。`)) {
    store.deleteSkill(skill.id)
  }
}

function confirmDeleteStage(stage: Stage) {
  if (confirm(`确定删除阶段"${stage.name}"吗？此操作不可撤销。`)) {
    if (stageOwnerSkill.value) {
      store.deleteStage(stageOwnerSkill.value.id, stage.id)
    }
  }
}

// 达成确认
function handleAchievementConfirm(evidence: Evidence[], sopId?: string) {
  if (activeStageData.value) {
    store.completeStage(activeStageData.value.id, evidence, sopId)
  }
  showAchievementModal.value = false
  activeStageData.value = null
  initialPreviewItem.value = null

  // 触发完成闪烁效果
  showCompletionFlash.value = true
  setTimeout(() => {
    showCompletionFlash.value = false
  }, 400)

  // 刷新连接线（阶段状态变化后）
  updateConnections()
}

// 任务手册
function showSopManager() {
  linkingSopId.value = undefined
  showSopManagerModal.value = true
}

function openSopEditor(sopId?: string) {
  linkingSopId.value = sopId
  showSopManagerModal.value = true
}

function handleSopSelect(sopId: string) {
  if (activeStageData.value) {
    // 检查该阶段之前是否已经有SOP关联，只有新绑定才增加计数
    const hadSopLink = !!activeStageData.value.sopId
    store.updateStage(
      store.skillTrees.find(s => s.stages.find(st => st.id === activeStageData.value!.id))?.id || '',
      activeStageData.value.id,
      { sopId }
    )
    // 如果之前没有SOP关联，则增加绑定计数
    if (!hadSopLink) {
      gamificationStore.incrementSopLinkCount()
    }
  }
  showSopManagerModal.value = false
}

// 导出技能树为 Markdown
function generateSkillTreeMarkdown(): string {
  const skills = store.skillTrees
  const now = new Date().toLocaleDateString('zh-CN')

  let md = `# 🎯 技能图谱

> 导出时间：${now}
> 共 ${skills.length} 个技能，${store.completedStagesCount} 个阶段已完成

---

`

  for (const skill of skills) {
    const statusIcon = skill.status === 'unlocked' ? '✅' : skill.status === 'in-progress' ? '🎯' : '🔒'
    const levelMap: Record<string, string> = { '0': 'Lv.0', '1': 'Lv.1', '2': 'Lv.2', '3': 'Lv.3', '4': 'Lv.4', 'MAX': 'Lv.MAX' }
    const level = skill.progress === 100 ? 'MAX' : skill.progress >= 80 ? '4' : skill.progress >= 60 ? '3' : skill.progress >= 40 ? '2' : skill.progress > 0 ? '1' : '0'

    md += `## ${statusIcon} ${skill.icon} ${skill.title} [${levelMap[level]}] (${skill.progress}%)

**${skill.description}**

进度：${skill.progress}% | 状态：${skill.status === 'in-progress' ? '进行中' : skill.status === 'unlocked' ? '已解锁' : '未解锁'}

### 阶段详情

`

    for (const stage of skill.stages) {
      const stageIcon = stage.status === 'completed' ? '✅' : stage.status === 'in-progress' ? '🎯' : '🔒'
      const stageStatusText = stage.status === 'completed' ? '已完成' : stage.status === 'in-progress' ? '进行中' : '未解锁'
      const targets = stage.target.split('\n').filter(t => t.trim())

      md += `### 阶段 ${stage.order}: ${stage.name} ${stageIcon} ${stageStatusText}

- **目标**:
${targets.map(t => `  - ${t}`).join('\n')}
- **奖励**: ${stage.reward}
`

      if (stage.completedAt) {
        md += `- **完成时间**: ${new Date(stage.completedAt).toLocaleDateString('zh-CN')}\n`
      }

      if (stage.milestones && stage.milestones.length > 0) {
        md += `- **里程碑**:\n`
        for (const m of stage.milestones) {
          md += `  - ${m.completed ? '✅' : '⬜'} ${m.title}\n`
        }
      }

      md += `\n`
    }

    md += `---

`
  }

  md += `

*由 Quest Log 应用导出*
`

  return md
}

// 导出技能树
async function handleExport() {
  if (!window.electronAPI) {
    alert('导出功能仅在桌面端可用')
    return
  }
  try {
    const markdown = generateSkillTreeMarkdown()
    const fileName = `skill-tree-${Date.now()}.md`

    const result = await window.electronAPI.showSaveDialog({
      title: '导出技能树',
      defaultPath: fileName,
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })

    if (result && result.filePath) {
      await window.electronAPI.exportMarkdown(markdown, result.filePath)
      alert('✓ 技能树已导出！')
    }
  } catch (e) {
    alert('导出失败: ' + String(e))
  }
}

// 导入技能树
async function handleImport() {
  if (!window.electronAPI) {
    alert('导入功能仅在桌面端可用')
    return
  }
  try {
    const result = await window.electronAPI.showOpenDialog({
      title: '导入技能树',
      filters: [{ name: 'Markdown', extensions: ['md'] }],
      properties: ['openFile']
    })

    if (result && result.filePaths && result.filePaths.length > 0) {
      const filePath = result.filePaths[0]
      const content = await window.electronAPI.fsReadFile(filePath)

      if (!content) {
        alert('无法读取文件内容')
        return
      }

      if (confirm('导入将替换当前所有技能树数据，是否继续？')) {
        const importResult = store.importSkillTreesFromMarkdown(content)
        if (importResult.success) {
          alert(`✓ 成功导入 ${importResult.count} 个技能！`)
        } else {
          alert('导入失败: ' + importResult.error)
        }
      }
    }
  } catch (e) {
    alert('导入失败: ' + String(e))
  }
}
</script>

<style scoped>
.skill-tree-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-void);
}

/* 工具栏 */
.skill-tree-view__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--bg-base);
  border-bottom: 1px solid var(--border-sub);
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.toolbar-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.toolbar-subtitle {
  font-size: 13px;
  color: var(--text-muted);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-toolbar {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-def);
  background: var(--bg-raised);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-toolbar:hover {
  background: var(--bg-hover);
  border-color: var(--primary);
  color: var(--text-primary);
}

.btn-toolbar:active {
  transform: scale(0.97);
}

.btn-toolbar--primary {
  background: linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%);
  color: white;
  border: 1px solid var(--primary);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
  font-weight: 600;
}

.btn-toolbar--primary:hover {
  background: linear-gradient(135deg, var(--primary-hover) 0%, #4338ca 100%);
  border-color: var(--primary-hover);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.5);
  transform: translateY(-1px);
}

.btn-toolbar--secondary {
  background: var(--bg-raised);
  color: var(--text-secondary);
  border: 1px solid var(--border-def);
}

.btn-toolbar--secondary:hover {
  background: var(--bg-hover);
  border-color: var(--primary);
  color: var(--text-primary);
}

.btn-toolbar--active {
  background: var(--primary-glow) !important;
  border-color: var(--primary) !important;
  color: var(--primary) !important;
}

.btn-toolbar--icon {
  padding: 5px 8px;
  font-size: 12px;
}

.btn-icon {
  font-size: 13px;
}

.toolbar-divider {
  width: 1px;
  height: 18px;
  background: var(--border-def);
  margin: 0 3px;
}

/* 切换开关样式 */
.toggle-switch {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--bg-raised);
  border: 1px solid var(--border-def);
  transition: all 150ms ease;
  user-select: none;
}

.toggle-switch:hover {
  border-color: var(--primary);
  background: var(--bg-hover);
}

.toggle-switch input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 28px;
  height: 16px;
  background: var(--bg-panel);
  border-radius: 8px;
  transition: all 200ms ease;
  border: 1px solid var(--border-def);
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 10px;
  height: 10px;
  background: var(--text-muted);
  border-radius: 50%;
  transition: all 200ms ease;
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--primary);
  border-color: var(--primary);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(12px);
  background: white;
}

.toggle-label {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 画布 */
.skill-tree-view__canvas {
  flex: 1;
  overflow: auto;
  padding: 40px 24px 80px;
  position: relative;
  cursor: grab;
  user-select: none;
}

.skill-tree-view__canvas.is-panning {
  cursor: grabbing;
}

/* 滚动条样式 - 始终可见 */
.skill-tree-view__canvas::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.skill-tree-view__canvas::-webkit-scrollbar-track {
  background: var(--bg-panel);
  border-radius: 5px;
  position: relative;
}

.skill-tree-view__canvas::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 5px;
  border: 2px solid var(--bg-panel);
}

.skill-tree-view__canvas::-webkit-scrollbar-thumb:hover {
  background: var(--primary);
}

.skill-tree-view__canvas::-webkit-scrollbar-corner {
  background: var(--bg-panel);
  border-radius: 5px;
}

/* SVG连接线层 */
.skill-tree-view__svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.connection-line {
  transition: opacity 300ms ease;
}

/* 空状态 */
.skill-tree-view__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0 0 24px;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: var(--primary);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: scale(0.97);
}

/* 技能树 */
.skill-tree-view__tree {
  display: flex;
  gap: 40px;
  align-items: flex-start;
  flex-wrap: nowrap;
  overflow-x: visible;
  overflow-y: visible;
  min-height: 100%;
  padding-bottom: 60px;
}

.skill-tree-view__skill-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

/* 连接线锚点 - 不影响布局 */
.skill-card-anchor {
  position: relative;
}

/* 阶段列表 */
.skill-tree-view__stages {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 20px;
  min-width: 280px;
}

.skill-tree-view__stage-item {
  animation: stage-appear 300ms ease-out;
}

/* 添加阶段按钮 */
.btn-add-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 8px;
  border: 2px dashed var(--border-def);
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 150ms ease;
  opacity: 0.7;
}

.btn-add-stage:hover {
  border-color: var(--primary);
  color: var(--primary);
  opacity: 1;
  background: var(--primary-glow);
}

/* 底部统计栏 */
.skill-tree-view__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  background: var(--bg-base);
  border-top: 1px solid var(--border-sub);
  flex-shrink: 0;
}

.footer-left,
.footer-right {
  width: 140px;
}

.footer-center {
  display: flex;
  align-items: center;
  gap: 24px;
}

.footer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--border-def);
  background: var(--bg-raised);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.footer-btn:hover {
  background: var(--bg-hover);
  border-color: var(--primary);
  color: var(--text-primary);
}

.footer-btn--primary {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.footer-btn--primary:hover {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
  color: white;
}

.footer-btn-icon {
  font-size: 13px;
}

.footer-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.footer-divider {
  width: 1px;
  height: 32px;
  background: var(--border-def);
}

/* 过渡动画 */
.stages-expand-enter-active {
  animation: stages-expand-in 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

.stages-expand-leave-active {
  animation: stages-expand-in 200ms cubic-bezier(0.4, 0, 1, 1) reverse;
}

@keyframes stage-appear {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes stages-expand-in {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 完成闪烁效果 */
.completion-flash {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle, var(--success-glow) 0%, transparent 70%);
  pointer-events: none;
  z-index: 9999;
  animation: flash-pulse 400ms ease-out forwards;
}

@keyframes flash-pulse {
  0% { opacity: 0; transform: scale(0.8); }
  50% { opacity: 0.6; }
  100% { opacity: 0; transform: scale(1.5); }
}

.flash-enter-active {
  animation: flash-in 200ms ease-out;
}

.flash-leave-active {
  animation: flash-in 200ms ease-in reverse;
}

@keyframes flash-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>