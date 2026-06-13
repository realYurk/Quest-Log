<template>
  <div class="xp-badge" @click="showChallenges = !showChallenges">
    <span class="xp-icon">🌟</span>
    <span class="xp-level">Lv.{{ gStore.level }}</span>
    <span class="xp-value">{{ gStore.profile.totalXp }} XP</span>

    <!-- Mini progress bar -->
    <div class="xp-mini-bar">
      <div class="xp-mini-fill" :style="{ width: `${gStore.xpProgress}%` }"></div>
    </div>

    <!-- Today's challenges preview -->
    <div class="challenges-count">
      {{ gStore.completedChallenges.length }}/{{ gStore.todayChallenges.length }}
    </div>

    <!-- Challenges dropdown -->
    <Transition name="dropdown">
      <div v-if="showChallenges" class="challenges-dropdown" v-click-outside="() => showChallenges = false">
        <div class="dropdown-header">
          <span>📋 今日挑战</span>
          <span class="dropdown-close" @click.stop="showChallenges = false">✕</span>
        </div>
        <div class="challenges-list">
          <div
            v-for="challenge in gStore.todayChallenges"
            :key="challenge.id"
            class="challenge-item"
            :class="[`difficulty-${challenge.difficulty}`, { completed: challenge.completed }]"
            @click.stop="toggleChallenge(challenge)"
          >
            <div class="challenge-status">
              {{ challenge.completed ? '✅' : '⬜' }}
            </div>
            <div class="challenge-info">
              <div class="challenge-title">{{ challenge.title }}</div>
              <div class="challenge-desc">{{ challenge.description }}</div>
            </div>
            <div class="challenge-xp">+{{ challenge.xpReward }}</div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGamificationStore } from '@/stores/gamification'
import type { DailyChallenge } from '@/types'

const gStore = useGamificationStore()
const showChallenges = ref(false)

function toggleChallenge(challenge: DailyChallenge) {
  if (!challenge.completed) {
    gStore.completeChallenge(challenge.id)
  }
}

// Click outside directive - closes dropdown when clicking outside
const vClickOutside = {
  beforeMount(el: HTMLElement & Record<string, any>, binding: any) {
    el._clickOutsideHandler = (event: MouseEvent) => {
      if (el.contains(event.target as Node)) return
      binding.value()
    }
    document.addEventListener('click', el._clickOutsideHandler)
  },
  unmounted(el: HTMLElement & Record<string, any>) {
    document.removeEventListener('click', el._clickOutsideHandler)
  }
}
</script>

<style scoped>
.xp-badge {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--bg-panel);
  border: 1px solid var(--border-sub);
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  transition: all 200ms ease;
}

.xp-badge:hover {
  background: var(--bg-hover);
  border-color: var(--primary);
}

.xp-icon {
  font-size: 14px;
}

.xp-level {
  font-weight: 700;
  color: var(--primary);
}

.xp-value {
  color: var(--text-secondary);
  font-size: 11px;
}

.xp-mini-bar {
  width: 40px;
  height: 3px;
  background: var(--bg-hover);
  border-radius: 2px;
  overflow: hidden;
}

.xp-mini-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--success));
  border-radius: 2px;
  transition: width 300ms ease;
}

.challenges-count {
  font-size: 10px;
  color: var(--text-muted);
  padding-left: 4px;
  border-left: 1px solid var(--border-sub);
}

.challenges-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-def);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  z-index: 100;
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-sub);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.dropdown-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 150ms ease;
}

.dropdown-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.challenges-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 300px;
  overflow-y: auto;
}

.challenge-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-panel);
  border-radius: 10px;
  border: 1px solid var(--border-sub);
  cursor: pointer;
  transition: all 150ms ease;
}

.challenge-item:hover {
  background: var(--bg-hover);
}

.challenge-item.completed {
  opacity: 0.6;
}

.challenge-item.difficulty-easy {
  border-left: 3px solid #64748b;
}

.challenge-item.difficulty-medium {
  border-left: 3px solid #3b82f6;
}

.challenge-item.difficulty-hard {
  border-left: 3px solid #8b5cf6;
}

.challenge-status {
  font-size: 18px;
  flex-shrink: 0;
}

.challenge-info {
  flex: 1;
  min-width: 0;
}

.challenge-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.challenge-desc {
  font-size: 11px;
  color: var(--text-muted);
}

.challenge-xp {
  font-size: 12px;
  font-weight: 600;
  color: var(--success);
  flex-shrink: 0;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 200ms ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
</style>