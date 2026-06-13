<template>
  <div
    class="skill-card"
    :class="[
      `skill-card--${skill.status}`,
      { 'skill-card--expanded': isExpanded },
      { 'skill-card--leveling': isLevelingUp }
    ]"
    @click="handleClick"
    @contextmenu.prevent="showContextMenu"
    role="button"
    :aria-label="`技能：${skill.title}，Lv.${level}，${statusText}`"
    :tabindex="0"
    @keydown.enter="handleClick"
  >
    <!-- 升级闪光效果 -->
    <div v-if="isLevelingUp" class="level-up-flash"></div>

    <!-- 连接线 -->
    <div v-if="hasChildren" class="skill-card__connector"></div>

    <!-- 主内容 -->
    <div class="skill-card__header">
      <span class="skill-card__icon">{{ skill.icon }}</span>
      <div class="skill-card__info">
        <h3 class="skill-card__title">{{ skill.title }}</h3>
        <span class="skill-card__level" :class="{ 'level-up': isLevelingUp }">
          Lv.{{ level }}
          <span v-if="level !== 'MAX' && skill.progress > 0" class="level-progress-hint">
            {{ skill.progress }}%
          </span>
        </span>
      </div>
    </div>

    <p class="skill-card__desc" :title="skill.description">{{ skill.description }}</p>

    <!-- 进度条 -->
    <div class="skill-card__progress-wrap">
      <div
        class="skill-card__progress-fill"
        :style="{ width: `${skill.progress}%` }"
      ></div>
    </div>

    <!-- 标签 -->
    <div class="skill-card__tags">
      <div class="tag tag--stages">
        📋 {{ skill.stages.length }}个阶段
      </div>
      <div v-if="inProgressStages > 0" class="tag tag--active">
        🎯 {{ inProgressStages }}进行中
      </div>
      <div v-if="nextLevelHint" class="tag tag--hint">
        {{ nextLevelHint }}
      </div>
    </div>

    <!-- 展开指示器 -->
    <div v-if="hasChildren || skill.stages.length > 0" class="skill-card__expand-indicator">
      <svg
        class="expand-icon"
        :class="{ 'expand-icon--rotated': isExpanded }"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M6 9l6 6 6-6"/>
      </svg>
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
import { computed, reactive, ref, watch } from 'vue'
import type { SkillNode } from '@/types'
import ContextMenu from '@/components/ContextMenu.vue'

const props = defineProps<{
  skill: SkillNode
  isExpanded: boolean
}>()

const emit = defineEmits<{
  (e: 'click', skill: SkillNode): void
  (e: 'toggle-expand', skillId: string): void
  (e: 'edit', skill: SkillNode): void
  (e: 'delete', skill: SkillNode): void
}>()

const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0
})

const isLevelingUp = ref(false)
const previousLevel = ref('')

const level = computed(() => {
  if (props.skill.progress === 100) return 'MAX'
  if (props.skill.progress >= 80) return '4'
  if (props.skill.progress >= 60) return '3'
  if (props.skill.progress >= 40) return '2'
  if (props.skill.progress > 0) return '1'
  return '0'
})

const nextLevelHint = computed(() => {
  const prog = props.skill.progress
  if (prog === 100) return '已达满级'
  if (prog >= 80) return '即将升到Lv.MAX'
  if (prog >= 60) return '再完成2阶段升Lv.4'
  if (prog >= 40) return '再完成2阶段升Lv.3'
  if (prog > 0) return '再完成2阶段升Lv.2'
  return '开始第一个阶段'
})

const hasChildren = computed(() => props.skill.children.length > 0)

const inProgressStages = computed(() => {
  return props.skill.stages.filter(s => s.status === 'in-progress').length
})

const statusText = computed(() => {
  switch (props.skill.status) {
    case 'unlocked': return '已解锁'
    case 'in-progress': return '进行中'
    case 'locked': return '未解锁'
    default: return ''
  }
})

const contextMenuItems = computed(() => [
  { label: '✏️ 编辑技能', action: () => emit('edit', props.skill) },
  { label: '➕ 添加阶段', action: () => emit('click', props.skill) },
  { divider: true },
  { label: '🗑️ 删除技能', action: () => emit('delete', props.skill), danger: true }
])

// Watch for level up
watch(level, (newLevel, oldLevel) => {
  if (newLevel !== oldLevel && oldLevel !== '0') {
    isLevelingUp.value = true
    setTimeout(() => {
      isLevelingUp.value = false
    }, 800)
  }
  previousLevel.value = oldLevel
})

function handleClick() {
  emit('click', props.skill)
  if (hasChildren.value || props.skill.stages.length > 0) {
    emit('toggle-expand', props.skill.id)
  }
}

function showContextMenu(e: MouseEvent) {
  contextMenu.x = e.clientX
  contextMenu.y = e.clientY
  contextMenu.visible = true
}

function closeContextMenu() {
  contextMenu.visible = false
}
</script>

<style scoped>
.skill-card {
  position: relative;
  background: var(--bg-raised);
  border-radius: 12px;
  padding: 16px;
  width: 220px;
  text-align: left;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skill-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}

.skill-card:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--primary-glow);
}

/* 状态变体 */
.skill-card--locked {
  filter: grayscale(0.6) brightness(0.8);
  border-style: dashed;
  border-color: var(--locked);
  opacity: 0.85;
}

.skill-card--locked:hover {
  filter: grayscale(0.3) brightness(0.9);
}

.skill-card--in-progress {
  border-color: var(--primary);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 0 20px var(--primary-glow);
  animation: pulse-border 2s ease-in-out infinite;
}

.skill-card--in-progress:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35), 0 0 30px var(--primary-glow);
}

.skill-card--unlocked {
  border-color: var(--success);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 0 20px var(--success-glow);
}

.skill-card--unlocked:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35), 0 0 30px var(--success-glow);
}

/* 展开状态 */
.skill-card--expanded {
  background: var(--bg-elevated);
}

/* 升级动画 */
.skill-card--leveling {
  animation: level-up-glow 800ms ease-out;
}

.level-up-flash {
  position: absolute;
  inset: -4px;
  border-radius: 14px;
  background: linear-gradient(45deg, var(--warning), #fbbf24, var(--warning));
  opacity: 0;
  animation: flash-border 800ms ease-out;
  z-index: -1;
}

@keyframes level-up-glow {
  0% { transform: scale(1); }
  20% { transform: scale(1.05); }
  40% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

@keyframes flash-border {
  0% { opacity: 0; transform: scale(0.8); }
  20% { opacity: 0.8; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.2); }
}

/* 连接线 */
.skill-card__connector {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 20px;
  background: var(--border-def);
}

.skill-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.skill-card__icon {
  font-size: 28px;
  line-height: 1;
}

.skill-card__info {
  flex: 1;
  min-width: 0;
}

.skill-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-card__level {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
  transition: all 300ms ease;
}

.skill-card__level.level-up {
  animation: level-number-pop 800ms ease-out;
  color: var(--warning);
  font-weight: 700;
  text-shadow: 0 0 10px var(--warning-glow);
}

@keyframes level-number-pop {
  0% { transform: scale(1); }
  30% { transform: scale(1.5); }
  100% { transform: scale(1); }
}

.level-progress-hint {
  font-size: 9px;
  color: var(--text-muted);
  margin-left: 4px;
}

.skill-card__desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
  /* 自适应行数，不再固定行数限制 */
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  /* 允许最多显示3行，hover时显示全部 */
  white-space: normal;
  word-break: break-word;
  max-height: 3.6em; /* 约3行 */
  transition: max-height 200ms ease;
}

.skill-card:hover .skill-card__desc {
  max-height: none;
}

/* 进度条 */
.skill-card__progress-wrap {
  height: 6px;
  background: var(--bg-panel);
  border-radius: 3px;
  overflow: hidden;
}

.skill-card__progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 500ms cubic-bezier(0, 0, 0.2, 1);
  background: var(--primary);
}

.skill-card--unlocked .skill-card__progress-fill {
  background: var(--success);
}

.skill-card--locked .skill-card__progress-fill {
  background: var(--locked);
}

/* 标签 */
.skill-card__tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tag {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
  font-weight: 500;
}

.tag--stages {
  background: var(--bg-panel);
  color: var(--text-secondary);
}

.tag--active {
  background: rgba(99, 102, 241, 0.15);
  color: var(--primary);
}

.tag--hint {
  background: rgba(245, 158, 11, 0.15);
  color: var(--warning);
  font-size: 10px;
}

/* 展开指示器 */
.skill-card__expand-indicator {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 20px;
  background: var(--bg-base);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.expand-icon {
  color: var(--text-muted);
  transition: transform 200ms ease;
}

.expand-icon--rotated {
  transform: rotate(180deg);
}

/* 脉冲动画 */
@keyframes pulse-border {
  0%, 100% {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 0 20px var(--primary-glow);
  }
  50% {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 0 30px var(--primary-glow);
  }
}
</style>