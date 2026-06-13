<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="store.showLevelUpModal" class="modal-backdrop" @click.self="store.closeLevelUpModal()">
        <div class="modal-content">
          <div class="confetti">🎉</div>
          <div class="title">升级了！</div>
          <div class="level-display">
            <span class="old-level">Lv.{{ store.level - 1 }}</span>
            <span class="arrow">→</span>
            <span class="new-level">Lv.{{ store.newLevel }}</span>
          </div>
          <div class="reward" v-if="getLevelReward(store.newLevel)">
            <span class="reward-label">解锁新功能：</span>
            <span class="reward-text">{{ getLevelReward(store.newLevel) }}</span>
          </div>
          <button class="close-btn" @click="store.closeLevelUpModal()">太棒了！</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useGamificationStore } from '@/stores/gamification'

const store = useGamificationStore()

function getLevelReward(level: number): string {
  const rewards: Record<number, string> = {
    2: '自定义主题颜色',
    3: '成就徽章展示',
    4: '每日挑战',
    5: '隐藏成就'
  }
  return rewards[level] || ''
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
  border: 2px solid #fbbf24;
  border-radius: 20px;
  padding: 40px 50px;
  text-align: center;
  box-shadow: 0 0 60px rgba(251, 191, 36, 0.3);
  animation: pop-in 400ms cubic-bezier(0, 0, 0.2, 1);
}

.confetti {
  font-size: 60px;
  margin-bottom: 16px;
  animation: bounce 600ms ease infinite;
}

.title {
  font-size: 28px;
  font-weight: 800;
  color: #fbbf24;
  margin-bottom: 20px;
  text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
}

.level-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 20px;
}

.old-level {
  color: var(--text-muted);
}

.arrow {
  color: var(--text-muted);
}

.new-level {
  color: #22c55e;
  text-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
}

.reward {
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid #6366f1;
  border-radius: 10px;
  padding: 12px 20px;
  margin-bottom: 24px;
  font-size: 14px;
}

.reward-label {
  color: var(--text-muted);
}

.reward-text {
  color: #818cf8;
  font-weight: 600;
}

.close-btn {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
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
  box-shadow: 0 0 30px rgba(99, 102, 241, 0.5);
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

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
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