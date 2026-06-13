<template>
  <div class="mobile-achievements" :class="{ 'safe-area-bottom': hasSafeArea }">
    <!-- Header -->
    <header class="mobile-header">
      <div class="header-title">
        <span class="title-icon">🏆</span>
        <span class="title-text">成就展览</span>
      </div>
    </header>

    <!-- Content -->
    <main class="mobile-content">
      <!-- User Stats Card -->
      <div class="stats-card">
        <div class="avatar-section">
          <div class="avatar-glow" :class="{ 'avatar-glow--active': hasAchievements }">
            <div class="avatar">{{ userAvatar }}</div>
          </div>
          <div class="level-info">
            <span class="level-number">Lv.{{ currentLevel }}</span>
            <span class="level-title">{{ levelTitle }}</span>
          </div>
        </div>

        <div class="total-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${totalProgress}%` }"></div>
          </div>
          <span class="progress-label">总进度 {{ totalProgress }}%</span>
        </div>

        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-value">{{ completedCount }}</span>
            <span class="stat-label">已完成</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ inProgressCount }}</span>
            <span class="stat-label">进行中</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ totalSkills }}</span>
            <span class="stat-label">技能数</span>
          </div>
        </div>
      </div>

      <!-- Achievements Grid -->
      <div class="section">
        <h2 class="section-title">🎖️ 成就展览</h2>

        <div v-if="allCompletedStages.length > 0" class="achievements-grid">
          <div
            v-for="item in allCompletedStages"
            :key="item.stageId"
            class="achievement-badge"
            :style="{ '--badge-color': getSkillColor(item.skillId) }"
          >
            <span class="badge-icon">{{ item.icon }}</span>
            <div class="badge-tooltip">
              <div class="tooltip-title">{{ item.stageName }}</div>
              <div class="tooltip-skill">{{ item.skillTitle }}</div>
              <div class="tooltip-date">{{ formatDate(item.completedAt) }}</div>
            </div>
          </div>
        </div>

        <div v-else class="empty-achievements">
          <div class="empty-icon">🎯</div>
          <span>还没有成就</span>
          <span class="hint">完成阶段任务解锁</span>
        </div>
      </div>

      <!-- In Progress Skills -->
      <div class="section">
        <h2 class="section-title">🌲 进行中的技能</h2>

        <div v-if="inProgressSkills.length > 0" class="skills-list">
          <div
            v-for="skill in inProgressSkills"
            :key="skill.id"
            class="skill-card"
            @click="handleSkillClick(skill.id)"
          >
            <div class="skill-icon">{{ skill.icon }}</div>
            <div class="skill-info">
              <div class="skill-header">
                <span class="skill-name">{{ skill.title }}</span>
                <span class="skill-level">Lv.{{ getSkillLevel(skill) }}</span>
              </div>
              <div class="skill-progress-bar">
                <div class="progress-fill" :style="{ width: `${skill.progress}%` }"></div>
              </div>
              <span class="skill-stages">
                {{ skill.stages.filter(s => s.status === 'completed').length }}/{{ skill.stages.length }} 阶段
              </span>
            </div>
          </div>
        </div>

        <div v-else class="empty-skills">
          <span>暂无进行中的技能</span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSkillTreeStore } from '@/stores/skillTree'

const emit = defineEmits<{
  (e: 'open-skill', skillId: string): void
}>()

const skillStore = useSkillTreeStore()

const userAvatar = '😊'
const hasSafeArea = ref(false)

const allCompletedStages = computed(() => {
  const completed = []
  for (const skill of skillStore.skillTrees) {
    for (const stage of skill.stages) {
      if (stage.status === 'completed') {
        completed.push({
          stageId: stage.id,
          skillId: skill.id,
          skillTitle: skill.title,
          stageName: stage.name,
          icon: skill.icon,
          completedAt: stage.completedAt
        })
      }
    }
  }
  return completed.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
})

const completedCount = computed(() => allCompletedStages.value.length)

const inProgressCount = computed(() => {
  let count = 0
  for (const skill of skillStore.skillTrees) {
    count += skill.stages.filter(s => s.status === 'in-progress').length
  }
  return count
})

const totalStages = computed(() => {
  let total = 0
  for (const skill of skillStore.skillTrees) {
    total += skill.stages.length
  }
  return total
})

const totalProgress = computed(() => {
  if (totalStages.value === 0) return 0
  return Math.round((completedCount.value / totalStages.value) * 100)
})

const inProgressSkills = computed(() => skillStore.skillTrees.filter(s => s.status === 'in-progress'))

const currentLevel = computed(() => {
  const count = completedCount.value
  if (count >= 10) return 5
  if (count >= 6) return 4
  if (count >= 3) return 3
  if (count >= 1) return 2
  return 1
})

const levelTitle = computed(() => {
  const titles = ['', '新手', '入门', '进阶', '高手', '大师']
  return titles[currentLevel.value] || '新手'
})

const hasAchievements = computed(() => completedCount.value > 0)

const totalSkills = computed(() => skillStore.skillTrees.length)

function getSkillLevel(skill: any): string {
  if (skill.progress === 100) return 'MAX'
  if (skill.progress >= 80) return '4'
  if (skill.progress >= 60) return '3'
  if (skill.progress >= 40) return '2'
  if (skill.progress > 0) return '1'
  return '0'
}

function getSkillColor(skillId: string): string {
  const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
  const index = skillId.charCodeAt(0) % colors.length
  return colors[index]
}

function formatDate(timestamp?: number): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function handleSkillClick(skillId: string) {
  emit('open-skill', skillId)
}

onMounted(() => {
  hasSafeArea.value = CSS.supports('padding-bottom', 'env(safe-area-inset-bottom)')
})
</script>

<style scoped>
.mobile-achievements {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-void);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Header */
.mobile-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-base);
  border-bottom: 1px solid var(--border-sub);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 24px;
}

.title-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

/* Content */
.mobile-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 20px;
}

/* Stats Card */
.stats-card {
  background: var(--bg-raised);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.avatar-glow {
  padding: 4px;
  border-radius: 50%;
  background: var(--bg-panel);
}

.avatar-glow--active {
  background: linear-gradient(135deg, var(--primary), var(--success));
  box-shadow: 0 0 20px var(--primary-glow);
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg-raised);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.level-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.level-number {
  font-size: 28px;
  font-weight: 800;
  color: var(--primary);
  text-shadow: 0 0 12px var(--primary-glow);
}

.level-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--warning);
  background: var(--warning-glow);
  padding: 2px 10px;
  border-radius: 10px;
  width: fit-content;
}

.total-progress {
  margin-bottom: 16px;
}

.progress-bar {
  height: 8px;
  background: var(--bg-panel);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--success));
  border-radius: 4px;
}

.progress-label {
  font-size: 11px;
  color: var(--text-muted);
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: var(--border-sub);
}

/* Section */
.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
}

/* Achievements Grid */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.achievement-badge {
  aspect-ratio: 1;
  border-radius: 12px;
  background: var(--bg-raised);
  border: 2px solid var(--badge-color, var(--success));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  position: relative;
  box-shadow: 0 0 12px var(--badge-color, var(--success-glow));
}

.achievement-badge:active {
  transform: scale(0.95);
}

.badge-tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  background: var(--bg-elevated);
  border: 1px solid var(--border-def);
  border-radius: 8px;
  padding: 8px 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 200ms ease;
  z-index: 10;
}

.achievement-badge:active .badge-tooltip {
  opacity: 1;
  visibility: visible;
}

.tooltip-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.tooltip-skill {
  font-size: 10px;
  color: var(--text-secondary);
}

.tooltip-date {
  font-size: 9px;
  color: var(--text-muted);
}

.empty-achievements {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.hint {
  font-size: 11px;
  opacity: 0.6;
  margin-top: 4px;
}

/* Skills List */
.skills-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skill-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--bg-raised);
  border-radius: 12px;
  border: 1px solid var(--border-sub);
  cursor: pointer;
  transition: all 150ms ease;
}

.skill-card:active {
  transform: scale(0.98);
  border-color: var(--primary);
}

.skill-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.skill-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skill-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.skill-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.skill-level {
  font-size: 10px;
  color: var(--primary);
  background: var(--primary-glow);
  padding: 2px 6px;
  border-radius: 6px;
}

.skill-progress-bar {
  height: 4px;
  background: var(--bg-panel);
  border-radius: 2px;
  overflow: hidden;
}

.skill-progress-bar .progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 2px;
}

.skill-stages {
  font-size: 11px;
  color: var(--text-muted);
}

.empty-skills {
  padding: 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}
</style>