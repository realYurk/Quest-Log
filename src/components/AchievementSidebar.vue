<template>
  <div class="game-sidebar">
    <!-- 角色状态面板 -->
    <div class="character-panel">
      <div class="avatar-wrapper">
        <div class="avatar-glow" :class="{ active: hasAchievements }">
          <div class="avatar-ring" @click="showEmojiPicker = !showEmojiPicker">
            <div class="avatar">{{ userAvatar }}</div>
          </div>
        </div>
        <!-- Emoji 选择器 -->
        <Teleport to="body">
          <div v-if="showEmojiPicker" class="emoji-picker-backdrop" @click.self="showEmojiPicker = false">
            <div class="emoji-picker">
              <div class="emoji-picker-header">
                <span>选择头像</span>
                <button class="btn-close" @click="showEmojiPicker = false">✕</button>
              </div>
              <div class="emoji-grid">
                <button
                  v-for="emoji in avatarEmojis"
                  :key="emoji"
                  class="emoji-btn"
                  :class="{ selected: userAvatar === emoji }"
                  @click="selectAvatar(emoji)"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>
          </div>
        </Teleport>
      </div>

      <div class="level-badge">
        <span class="level-number">Lv.{{ gStore.level }}</span>
        <span class="level-title">{{ levelTitle }}</span>
      </div>

      <!-- XP 进度条 -->
      <div class="xp-section">
        <div class="xp-label">
          <span>🌟 XP</span>
          <span>{{ gStore.profile.totalXp }} / {{ gStore.xpForNextLevel }}</span>
        </div>
        <div class="xp-bar">
          <div class="xp-fill" :style="{ width: `${gStore.xpProgress}%` }"></div>
        </div>
        <span class="xp-next">距离下一级还需 {{ gStore.xpForNextLevel - gStore.profile.totalXp }} XP</span>
      </div>

      <!-- 连续登录 -->
      <div class="streak-section">
        <span class="streak-icon">🔥</span>
        <span class="streak-value">{{ gStore.profile.streakDays }}天连续</span>
      </div>
    </div>

    <!-- 今日挑战 -->
    <div class="daily-challenges-section">
      <div class="section-header">
        <span class="section-title">📋 今日挑战</span>
        <span class="challenges-count">{{ gStore.completedChallenges.length }}/{{ gStore.todayChallenges.length }}</span>
      </div>
      <div class="challenges-list">
        <div
          v-for="challenge in gStore.todayChallenges"
          :key="challenge.id"
          class="challenge-item"
          :class="[`difficulty-${challenge.difficulty}`, { completed: challenge.completed }]"
          @click="completeChallenge(challenge)"
        >
          <span class="challenge-status">{{ challenge.completed ? '✅' : '⬜' }}</span>
          <div class="challenge-info">
            <span class="challenge-title">{{ challenge.title }}</span>
            <span class="challenge-desc">{{ challenge.description }}</span>
          </div>
          <span class="challenge-xp">+{{ challenge.xpReward }}</span>
        </div>
      </div>
    </div>

    <!-- 成就展览 -->
    <div class="achievements-section">
      <div class="section-header">
        <span class="section-title">🏆 成就</span>
        <span class="achievements-count">{{ unlockedCount }}/{{ totalCount }}</span>
      </div>
      <div class="achievements-grid" v-if="gStore.allAchievements.length > 0">
        <div
          v-for="achievement in gStore.allAchievements"
          :key="achievement.id"
          class="achievement-badge"
          :class="[`rarity-${achievement.rarity}`, { unlocked: !!achievement.unlockedAt }]"
          :title="`${achievement.title}\n${achievement.description}`"
        >
          <span class="badge-icon">{{ achievement.unlockedAt ? achievement.icon : '🔒' }}</span>
          <div class="badge-tooltip">
            <div class="tooltip-title">{{ achievement.title }}</div>
            <div class="tooltip-desc">{{ achievement.description }}</div>
            <div class="tooltip-rarity" :class="`rarity-${achievement.rarity}`">
              {{ getRarityText(achievement.rarity) }}
            </div>
          </div>
        </div>
      </div>
      <div class="empty-achievements" v-else>
        <span>暂无成就</span>
      </div>
    </div>

    <!-- SOP绑定成就墙 -->
    <div class="achievements-section sop-achievements-section">
      <div class="section-header">
        <span class="section-title">📝 SOP绑定成就</span>
        <span class="achievements-count sop-link-count">{{ gStore.profile.sopLinkCount }}个阶段已绑定</span>
      </div>
      <div class="achievements-grid" v-if="sopLinkedAchievements.length > 0">
        <div
          v-for="achievement in sopLinkedAchievements"
          :key="achievement.id"
          class="achievement-badge"
          :class="[`rarity-${achievement.rarity}`, { unlocked: !!achievement.unlockedAt }]"
          :title="`${achievement.title}\n${achievement.description}`"
        >
          <span class="badge-icon">{{ achievement.unlockedAt ? achievement.icon : '🔒' }}</span>
          <div class="badge-tooltip">
            <div class="tooltip-title">{{ achievement.title }}</div>
            <div class="tooltip-desc">{{ achievement.description }}</div>
            <div class="tooltip-rarity" :class="`rarity-${achievement.rarity}`">
              {{ getRarityText(achievement.rarity) }}
            </div>
          </div>
        </div>
      </div>
      <div class="empty-achievements" v-else>
        <span>暂无SOP绑定成就</span>
      </div>
    </div>

    <!-- 技能进度 -->
    <div class="skills-progress-section">
      <div class="section-header">
        <span class="section-title">📊 技能进度</span>
      </div>
      <div class="skills-list">
        <div
          v-for="skill in inProgressSkills"
          :key="skill.id"
          class="skill-item"
          @click="$emit('open-skill', skill.id)"
        >
          <span class="skill-icon">{{ skill.icon }}</span>
          <div class="skill-info">
            <span class="skill-name">{{ skill.title }}</span>
            <div class="skill-progress-bar">
              <div class="skill-progress-fill" :style="{ width: `${skill.progress}%` }"></div>
            </div>
          </div>
          <span class="skill-level">Lv.{{ getSkillLevel(skill) }}</span>
        </div>
        <div v-if="inProgressSkills.length === 0" class="empty-skills">
          暂无进行中的技能
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <button class="action-btn" @click="goToNewSkill" title="新建技能">
        <span>➕</span>
        <span class="action-label">新建技能</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSkillTreeStore } from '@/stores/skillTree'
import { useGamificationStore } from '@/stores/gamification'
import type { DailyChallenge, AchievementRarity } from '@/types'

const emit = defineEmits<{
  (e: 'open-skill', skillId: string | null): void
}>()

const skillStore = useSkillTreeStore()
const gStore = useGamificationStore()

// 用户头像
const userAvatar = ref(localStorage.getItem('questlog-avatar') || '🧙')
const showEmojiPicker = ref(false)

const avatarEmojis = [
  '🧙', '🧝', '🧚', '🦸', '🥷', '🧛', '🧜', '🧞', '🧟', '�‍♂️', '�‍♀️', '🦹', '🦹‍♀️',
  '😊', '😎', '🥳', '😇', '🤩', '😋', '🤗', '😺', '😸', '😻', '🥰', '😍', '🤓', '😐', '🙄',
  '💪', '🦁', '🐺', '🦊', '🐉', '🦄', '🐲', '🦅', '🦚', '🦙', '🐸', '🐵', '🐼', '🐨', '🐯',
  '⭐', '🌟', '💫', '✨', '🔥', '💥', '🎉', '🏆', '🥇', '🏅', '🎖️', '💎', '👑', '🎩', '🧢',
  '🌈', '☀️', '🌙', '⭐️', '🌺', '🌸', '🌻', '🍀', '🎄', '🎃', '🧨', '🎯', '🎲', '🧩', '🃏',
  '🚀', '✈️', '🚁', '🛸', '🚢', '🏠', '🏰', '🏝️', '🎡', '🎢', '🎠', '⚓', '🗿', '🧭', '🔮'
]

function selectAvatar(emoji: string) {
  userAvatar.value = emoji
  localStorage.setItem('questlog-avatar', emoji)
  showEmojiPicker.value = false
}

const levelTitle = computed(() => {
  const level = gStore.level
  const titles = ['', '冒险新手', '见习冒险者', '熟练冒险者', '精英冒险者', '大师冒险者', '传奇冒险者']
  return titles[level] || '冒险新手'
})

const hasAchievements = computed(() => gStore.unlockedAchievements.length > 0)
const unlockedCount = computed(() => gStore.unlockedAchievements.length)
const totalCount = computed(() => gStore.allAchievements.length)
const sopLinkedAchievements = computed(() => gStore.allAchievements.filter(a => a.id.startsWith('sop_link_')))

const inProgressSkills = computed(() => skillStore.skillTrees.filter(s => s.status === 'in-progress'))

function getSkillLevel(skill: any): string {
  if (skill.progress === 100) return 'MAX'
  if (skill.progress >= 80) return '4'
  if (skill.progress >= 60) return '3'
  if (skill.progress >= 40) return '2'
  if (skill.progress > 0) return '1'
  return '0'
}

function completeChallenge(challenge: DailyChallenge) {
  if (!challenge.completed) {
    gStore.completeChallenge(challenge.id)
  }
}

function getRarityText(rarity: AchievementRarity): string {
  const map: Record<AchievementRarity, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return map[rarity] || '普通'
}

function goToNewSkill() {
  emit('open-skill', '')
}
</script>

<style scoped>
.game-sidebar {
  width: 220px;
  min-width: 200px;
  background: linear-gradient(180deg, var(--bg-base) 0%, var(--bg-raised) 100%);
  border-right: 1px solid var(--border-sub);
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 12px;
  overflow-y: auto;
}

/* 角色面板 */
.character-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05));
  border-radius: 16px;
  border: 1px solid var(--border-sub);
}

.avatar-wrapper {
  position: relative;
}

.avatar-glow {
  padding: 4px;
  border-radius: 50%;
  background: var(--bg-panel);
  transition: all 300ms ease;
}

.avatar-glow.active {
  background: linear-gradient(135deg, var(--primary), var(--success));
  box-shadow: 0 0 20px var(--primary-glow), 0 0 40px var(--success-glow);
  animation: glow-pulse 3s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px var(--primary-glow), 0 0 40px var(--success-glow); }
  50% { box-shadow: 0 0 30px var(--primary-glow), 0 0 60px var(--success-glow); }
}

.avatar-ring {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  padding: 3px;
  background: var(--bg-base);
  cursor: pointer;
  transition: transform 200ms ease;
}

.avatar-ring:hover {
  transform: scale(1.1);
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--bg-raised);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
}

.level-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.level-number {
  font-size: 24px;
  font-weight: 800;
  color: var(--primary);
  text-shadow: 0 0 12px var(--primary-glow);
}

.level-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--warning);
  background: var(--warning-glow);
  padding: 2px 10px;
  border-radius: 10px;
}

/* XP 进度 */
.xp-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.xp-label {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary);
}

.xp-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-panel);
  border-radius: 4px;
  overflow: hidden;
}

.xp-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--success));
  border-radius: 4px;
  transition: width 500ms ease;
}

.xp-next {
  font-size: 9px;
  color: var(--text-muted);
  text-align: center;
}

/* 连续登录 */
.streak-section {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.streak-icon {
  font-size: 16px;
}

.streak-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--warning);
}

/* 每日挑战 */
.daily-challenges-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.challenges-count {
  font-size: 11px;
  color: var(--primary);
  background: var(--primary-glow);
  padding: 2px 8px;
  border-radius: 10px;
}

.challenges-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.challenge-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-panel);
  border-radius: 10px;
  border: 1px solid var(--border-sub);
  cursor: pointer;
  transition: all 150ms ease;
}

.challenge-item:hover {
  background: var(--bg-hover);
  transform: translateX(4px);
}

.challenge-item.completed {
  opacity: 0.6;
}

.challenge-item.difficulty-easy { border-left: 3px solid #64748b; }
.challenge-item.difficulty-medium { border-left: 3px solid #3b82f6; }
.challenge-item.difficulty-hard { border-left: 3px solid #8b5cf6; }

.challenge-status {
  font-size: 14px;
}

.challenge-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.challenge-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.challenge-desc {
  font-size: 10px;
  color: var(--text-muted);
}

.challenge-xp {
  font-size: 11px;
  font-weight: 600;
  color: var(--success);
}

/* 成就 */
.achievements-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.achievements-count {
  font-size: 11px;
  color: var(--warning);
  background: var(--warning-glow);
  padding: 2px 8px;
  border-radius: 10px;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.achievement-badge {
  aspect-ratio: 1;
  border-radius: 10px;
  background: var(--bg-panel);
  border: 2px solid var(--border-sub);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 200ms ease;
  position: relative;
}

.achievement-badge.unlocked {
  animation: badge-shine 2s ease-in-out infinite;
}

.achievement-badge.unlocked.rarity-common { border-color: #64748b; }
.achievement-badge.unlocked.rarity-rare { border-color: #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.3); }
.achievement-badge.unlocked.rarity-epic { border-color: #8b5cf6; box-shadow: 0 0 15px rgba(139, 92, 246, 0.4); }
.achievement-badge.unlocked.rarity-legendary {
  border-color: #fbbf24;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
  animation: legendary-glow 1s ease-in-out infinite;
}

@keyframes badge-shine {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes legendary-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.5); }
  50% { box-shadow: 0 0 30px rgba(251, 191, 36, 0.8); }
}

.achievement-badge:hover {
  transform: scale(1.15) rotate(5deg);
  z-index: 10;
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
  white-space: normal;
  width: 180px;
  opacity: 0;
  visibility: hidden;
  transition: all 200ms ease;
  z-index: 100;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.achievement-badge:hover .badge-tooltip {
  opacity: 1;
  visibility: visible;
}

.tooltip-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.tooltip-desc {
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.tooltip-rarity {
  font-size: 9px;
  font-weight: 600;
  margin-top: 4px;
  padding: 1px 6px;
  border-radius: 4px;
  display: inline-block;
}

.tooltip-rarity.rarity-common { background: rgba(100, 116, 139, 0.2); color: #94a3b8; }
.tooltip-rarity.rarity-rare { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.tooltip-rarity.rarity-epic { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
.tooltip-rarity.rarity-legendary { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }

.empty-achievements {
  text-align: center;
  padding: 16px;
  color: var(--text-muted);
  font-size: 12px;
}

/* 技能进度 */
.skills-progress-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skill-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--bg-panel);
  border-radius: 10px;
  border: 1px solid var(--border-sub);
  cursor: pointer;
  transition: all 150ms ease;
}

.skill-item:hover {
  background: var(--bg-hover);
  border-color: var(--primary);
  transform: translateX(4px);
}

.skill-icon {
  font-size: 20px;
}

.skill-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.skill-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-progress-bar {
  width: 100%;
  height: 4px;
  background: var(--bg-hover);
  border-radius: 2px;
  overflow: hidden;
}

.skill-progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 2px;
  transition: width 300ms ease;
}

.skill-level {
  font-size: 10px;
  font-weight: 600;
  color: var(--primary);
  background: var(--primary-glow);
  padding: 2px 6px;
  border-radius: 4px;
}

.empty-skills {
  text-align: center;
  padding: 12px;
  color: var(--text-muted);
  font-size: 11px;
}

/* 快捷操作 */
.quick-actions {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid var(--border-sub);
}

.action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border-radius: 10px;
  border: 2px dashed var(--border-def);
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  transition: all 150ms ease;
}

.action-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-glow);
}

.action-label {
  font-size: 12px;
  font-weight: 500;
}

/* Emoji 选择器 */
.emoji-picker-backdrop {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fade-in 200ms ease;
}

.emoji-picker {
  background: var(--bg-elevated);
  border-radius: 16px;
  width: 320px;
  max-height: 400px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: scale-in 250ms cubic-bezier(0, 0, 0.2, 1);
}

.emoji-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-sub);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.emoji-picker-header .btn-close {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease;
}

.emoji-picker-header .btn-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  padding: 16px;
  max-height: 320px;
  overflow-y: auto;
}

.emoji-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 2px solid transparent;
  background: var(--bg-panel);
  font-size: 20px;
  cursor: pointer;
  transition: all 150ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-btn:hover {
  background: var(--bg-hover);
  border-color: var(--primary);
  transform: scale(1.2);
}

.emoji-btn.selected {
  background: var(--primary-glow);
  border-color: var(--primary);
  box-shadow: 0 0 12px var(--primary-glow);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.9) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* SOP绑定成就墙 */
.sop-achievements-section {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(99, 102, 241, 0.03));
  border-radius: 12px;
  border: 1px solid var(--border-sub);
  padding: 12px;
}

.sop-link-count {
  background: var(--primary-glow) !important;
  color: var(--primary) !important;
}
</style>