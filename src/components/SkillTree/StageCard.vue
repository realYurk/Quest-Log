<template>
  <div
    class="stage-card"
    :class="[`stage-card--${stage.status}`]"
    @click="handleClick"
    @contextmenu.prevent="showContextMenu"
    role="button"
    :aria-label="`阶段：${stage.name}，${statusText}`"
    :tabindex="0"
    @keydown.enter="handleClick"
  >
    <!-- 状态图标 -->
    <div class="stage-card__status-icon">
      <span v-if="stage.status === 'completed'" class="icon-success">✓</span>
      <span v-else-if="stage.status === 'in-progress'" class="icon-active">🎯</span>
      <span v-else class="icon-locked">🔒</span>
    </div>

    <!-- 内容 -->
    <div class="stage-card__content">
      <div class="stage-card__header">
        <span class="stage-card__order">阶段{{ stage.order }}</span>
        <span class="stage-card__name">{{ stage.name }}</span>
      </div>

      <!-- 量化目标 (支持多行) -->
      <div v-if="parsedTargets.length > 0" class="stage-card__targets">
        <div
          v-for="(target, idx) in parsedTargets"
          :key="idx"
          class="target-item"
        >
          <span class="target-bullet">•</span>
          <span class="target-text">{{ target }}</span>
        </div>
      </div>
      <p v-else class="stage-card__target">{{ stage.target }}</p>
    </div>

    <!-- 里程碑 -->
    <div v-if="stage.milestones && stage.milestones.length > 0" class="stage-card__milestones">
      <div class="milestones-header">
        <span class="milestones-title">🏆 里程碑</span>
        <span class="milestones-progress">{{ milestoneProgress }}%</span>
      </div>
      <div class="milestones-progress-bar">
        <div class="milestones-progress-fill" :style="{ width: `${milestoneProgress}%` }"></div>
      </div>
      <div class="milestones-list">
        <div
          v-for="milestone in stage.milestones"
          :key="milestone.id"
          class="milestone-item"
          :class="{
            'milestone-item--completed': milestone.completed,
            'milestone-item--disabled': stage.status === 'completed'
          }"
          @click.stop="handleMilestoneClick(milestone)"
        >
          <span class="milestone-checkbox">
            {{ milestone.completed ? '☑️' : '⬜' }}
          </span>
          <span class="milestone-title">{{ milestone.title }}</span>
        </div>
      </div>
    </div>

    <!-- 证明材料指示 -->
    <div
      v-if="stage.evidence.length > 0"
      class="stage-card__evidence"
      @click.stop="handleEvidenceClick"
      title="查看附件"
    >
      <span class="evidence-count">📎 {{ stage.evidence.length }}</span>
    </div>

    <!-- 奖励 -->
    <div class="stage-card__reward">
      <span class="reward-label">🎁</span>
      <span class="reward-text">{{ stage.reward }}</span>
    </div>

    <!-- 完成时间 -->
    <div v-if="stage.completedAt" class="stage-card__completed-time">
      {{ formatDate(stage.completedAt) }}
    </div>

    <!-- 上下文菜单 -->
    <Teleport to="body">
      <ContextMenu
        v-if="contextMenu.visible"
        :x="contextMenu.x"
        :y="contextMenu.y"
        :items="contextMenuItems"
        @close="closeContextMenu"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { Stage } from '@/types'
import { useSkillTreeStore } from '@/stores/skillTree'
import ContextMenu from '@/components/ContextMenu.vue'

const props = defineProps<{
  stage: Stage
  skillTitle?: string
}>()

const emit = defineEmits<{
  (e: 'click', stage: Stage): void
  (e: 'edit', stage: Stage): void
  (e: 'delete', stage: Stage): void
  (e: 'preview-evidence', stage: Stage): void
}>()

const store = useSkillTreeStore()

const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0
})

// 解析target为多行支持
const parsedTargets = computed(() => {
  if (!props.stage.target) return []
  // 支持多种分隔符：换行、顿号、逗号+空格
  const text = props.stage.target.trim()
  // 按换行分割
  const lines = text.split(/\n/).filter(l => l.trim())
  // 如果只有一行，尝试按顿号或逗号分割
  if (lines.length === 1) {
    const line = lines[0]
    // 尝试按中文顿号分割
    if (line.includes('、')) {
      return line.split('、').map(s => s.trim()).filter(s => s)
    }
    // 尝试按逗号分割
    if (line.includes(',')) {
      return line.split(',').map(s => s.trim()).filter(s => s)
    }
  }
  return lines.map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(l => l)
})

const completedMilestones = computed(() => {
  if (!props.stage.milestones) return 0
  return props.stage.milestones.filter(m => m.completed).length
})

const milestoneProgress = computed(() => {
  if (!props.stage.milestones || props.stage.milestones.length === 0) return 0
  const completed = props.stage.milestones.filter(m => m.completed).length
  return Math.round((completed / props.stage.milestones.length) * 100)
})

const statusText = computed(() => {
  switch (props.stage.status) {
    case 'completed': return '已完成'
    case 'in-progress': return '进行中'
    case 'locked': return '未解锁'
    default: return ''
  }
})

const contextMenuItems = computed(() => [
  { label: '✏️ 编辑阶段', action: () => emit('edit', props.stage) },
  ...(props.stage.status !== 'completed' ? [{ label: '📤 上传证明', action: () => emit('click', props.stage) }] : []),
  { divider: true },
  { label: '🗑️ 删除阶段', action: () => emit('delete', props.stage), danger: true }
])

function handleClick() {
  emit('click', props.stage)
}

function handleEvidenceClick() {
  emit('preview-evidence', props.stage)
}

function showContextMenu(e: MouseEvent) {
  contextMenu.x = e.clientX
  contextMenu.y = e.clientY
  contextMenu.visible = true
}

function closeContextMenu() {
  contextMenu.visible = false
}

function handleMilestoneClick(milestone: any) {
  if (props.stage.status === 'completed') return
  store.toggleMilestone(props.stage.id, milestone.id)
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return `${Math.floor(days / 30)}个月前`
}
</script>

<style scoped>
.stage-card {
  position: relative;
  background: var(--bg-raised);
  border-radius: 10px;
  padding: 14px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 180ms cubic-bezier(0.22, 1, 0.36, 1);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 阶段之间的连接线 */
.stage-card::before {
  content: '';
  position: absolute;
  top: -22px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 20px;
  background: var(--border-def);
}

/* 第一个阶段不需要连接线 */
.stage-card:first-of-type::before {
  display: none;
}

.stage-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.stage-card:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--primary-glow);
}

/* 状态变体 */
.stage-card--locked {
  background: var(--bg-panel);
  border-color: var(--border-def);
  opacity: 0.85;
}

.stage-card--locked:hover {
  opacity: 1;
  border-color: var(--locked);
}

.stage-card--in-progress {
  border-color: var(--warning);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 0 15px var(--warning-glow);
}

.stage-card--in-progress:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25), 0 0 25px var(--warning-glow);
}

.stage-card--completed {
  border-color: var(--success);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.08), transparent);
}

.stage-card--completed:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25), 0 0 20px var(--success-glow);
}

/* 状态图标 */
.stage-card__status-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.icon-success {
  background: var(--success);
  color: white;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.icon-active {
  background: var(--warning);
  color: white;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.icon-locked {
  background: var(--locked);
  color: white;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

/* 内容 */
.stage-card__content {
  flex: 1;
  min-width: 0;
}

.stage-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.stage-card__order {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stage-card__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

/* 量化目标 - 多行显示 */
.stage-card__targets {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
}

.target-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.target-bullet {
  color: var(--primary);
  font-weight: 700;
  flex-shrink: 0;
}

.target-text {
  flex: 1;
  word-break: break-word;
}

/* 原有的单行显示 */
.stage-card__target {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 里程碑 */
.stage-card__milestones {
  margin-top: 8px;
  padding: 10px;
  background: var(--bg-panel);
  border-radius: 8px;
  border: 1px solid var(--border-sub);
}

.milestones-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.milestones-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.milestones-progress {
  font-size: 10px;
  color: var(--primary);
  background: var(--primary-glow);
  padding: 2px 6px;
  border-radius: 4px;
}

.milestones-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.milestone-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 150ms ease;
}

.milestone-item:hover {
  background: var(--bg-hover);
}

.milestone-item--completed {
  opacity: 0.7;
}

.milestone-item--completed .milestone-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.milestone-checkbox {
  font-size: 12px;
  flex-shrink: 0;
}

.milestone-title {
  font-size: 11px;
  color: var(--text-primary);
  word-break: break-word;
}

/* 证明材料 */
.stage-card__evidence {
  display: flex;
  align-items: center;
  gap: 4px;
}

.evidence-count {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-panel);
  padding: 2px 6px;
  border-radius: 4px;
}

/* 奖励 */
.stage-card__reward {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.reward-label {
  font-size: 12px;
}

.reward-text {
  font-size: 11px;
  color: var(--warning);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 完成时间 */
.stage-card__completed-time {
  font-size: 10px;
  color: var(--success);
  text-align: right;
}
</style>