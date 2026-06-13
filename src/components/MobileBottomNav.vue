<template>
  <nav class="bottom-nav" :class="{ 'bottom-nav--hidden': isHidden }">
    <button
      class="nav-item"
      :class="{ 'nav-item--active': currentView === 'skillTree' }"
      @click="$emit('navigate', 'skillTree')"
    >
      <span class="nav-icon">🌲</span>
      <span class="nav-label">技能树</span>
    </button>

    <button
      class="nav-item"
      :class="{ 'nav-item--active': currentView === 'sopManager' }"
      @click="$emit('navigate', 'sopManager')"
    >
      <span class="nav-icon">📋</span>
      <span class="nav-label">SOP</span>
    </button>

    <button
      class="nav-item nav-item--center"
      @click="$emit('quick-action')"
    >
      <span class="nav-icon nav-icon--large">➕</span>
    </button>

    <button
      class="nav-item"
      :class="{ 'nav-item--active': currentView === 'achievements' }"
      @click="$emit('navigate', 'achievements')"
    >
      <span class="nav-icon">🏆</span>
      <span class="nav-label">成就</span>
    </button>

    <button
      class="nav-item"
      :class="{ 'nav-item--active': currentView === 'settings' }"
      @click="$emit('navigate', 'settings')"
    >
      <span class="nav-icon">⚙️</span>
      <span class="nav-label">设置</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  currentView: string
}>()

defineEmits<{
  (e: 'navigate', view: string): void
  (e: 'quick-action'): void
}>()

const isHidden = ref(false)
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: var(--bg-base);
  border-top: 1px solid var(--border-sub);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 8px;
  padding-bottom: env(safe-area-inset-bottom, 0);
  z-index: 1000;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
}

.bottom-nav--hidden {
  transform: translateY(100%);
  transition: transform 300ms ease;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 150ms ease;
  min-width: 56px;
  border-radius: 12px;
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-icon {
  font-size: 22px;
  transition: transform 200ms ease;
}

.nav-label {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 500;
}

.nav-item--active .nav-icon {
  transform: scale(1.1);
}

.nav-item--active .nav-label {
  color: var(--primary);
}

.nav-item--center {
  position: relative;
  top: -20px;
}

.nav-icon--large {
  width: 48px;
  height: 48px;
  background: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  box-shadow: 0 4px 16px var(--primary-glow);
}

.nav-item--center:active .nav-icon--large {
  transform: scale(0.95);
}

/* Active indicator */
.nav-item--active::after {
  content: '';
  position: absolute;
  top: 2px;
  width: 4px;
  height: 4px;
  background: var(--primary);
  border-radius: 50%;
}

/* Swipe to hide */
.bottom-nav {
  transition: transform 300ms ease;
}
</style>