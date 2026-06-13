<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="store.showAchievementModal && store.newAchievement" class="modal-backdrop" @click.self="store.closeAchievementModal()">
        <div class="modal-content">
          <div class="badge-container" :class="`rarity-${store.newAchievement.rarity}`">
            <span class="badge-icon">{{ store.newAchievement.icon }}</span>
          </div>
          <div class="label">新成就解锁！</div>
          <div class="title">{{ store.newAchievement.title }}</div>
          <div class="description">{{ store.newAchievement.description }}</div>
          <div class="rarity-tag" :class="`rarity-${store.newAchievement.rarity}`">
            {{ getRarityText(store.newAchievement.rarity) }}
          </div>
          <button class="close-btn" @click="store.closeAchievementModal()">太棒了！</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useGamificationStore } from '@/stores/gamification'
import type { AchievementRarity } from '@/types'

const store = useGamificationStore()

function getRarityText(rarity: AchievementRarity): string {
  const map: Record<AchievementRarity, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return map[rarity] || '普通'
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-elevated, #1a1a2e);
  border: 2px solid var(--primary);
  border-radius: 20px;
  padding: 40px 50px;
  text-align: center;
  box-shadow: 0 0 60px var(--primary-glow);
  animation: pop-in 400ms cubic-bezier(0, 0, 0.2, 1);
  max-width: 360px;
}

.badge-container {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 50px;
  animation: badge-glow 1s ease infinite;
}

.badge-container.rarity-common {
  background: linear-gradient(135deg, #64748b, #475569);
  box-shadow: 0 0 20px rgba(100, 116, 139, 0.5);
}

.badge-container.rarity-rare {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
}

.badge-container.rarity-epic {
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
}

.badge-container.rarity-legendary {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  box-shadow: 0 0 30px rgba(251, 191, 36, 0.6);
  animation: badge-glow 0.5s ease infinite;
}

@keyframes badge-glow {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.label {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.description {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.rarity-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 24px;
}

.rarity-tag.rarity-common {
  background: rgba(100, 116, 139, 0.2);
  color: #94a3b8;
}

.rarity-tag.rarity-rare {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.rarity-tag.rarity-epic {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.rarity-tag.rarity-legendary {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.close-btn {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px 40px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
}

.close-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px var(--primary-glow);
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-enter-active {
  animation: fade-in 200ms ease;
}

.modal-leave-active {
  animation: fade-in 200ms ease reverse;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>