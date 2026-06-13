<template>
  <div class="app-layout" :class="responsiveClasses">
    <!-- Achievement Sidebar (desktop only) -->
    <AchievementSidebar
      v-if="!isMobile"
      class="layout-sidebar"
      @open-skill="handleOpenSkill"
    />

    <!-- Main content -->
    <div class="layout-main">
      <component
        :is="currentViewComponent"
        ref="mainViewRef"
        @open-skill="handleOpenSkill"
      />
    </div>

    <!-- Mobile Bottom Navigation -->
    <MobileBottomNav
      v-if="isMobile"
      :current-view="currentView"
      @navigate="handleNavigate"
      @quick-action="handleQuickAction"
    />

    <!-- Settings Modal -->
    <SettingsModal v-if="store.showSettings" @close="store.showSettings = false" />

    <!-- Toast Stack -->
    <ToastStack />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import { useSopStore } from '@/stores/sop'
import { useSkillTreeStore } from '@/stores/skillTree'
import { useResponsive } from '@/composables/useResponsive'
import AchievementSidebar from '@/components/AchievementSidebar.vue'
import MobileBottomNav from '@/components/MobileBottomNav.vue'
import ToastStack from '@/components/ToastStack.vue'
import SettingsModal from '@/components/modals/SettingsModal.vue'
import SkillTreeView from '@/components/SkillTree/SkillTreeView.vue'
import SopManagerView from '@/components/SopManagerView.vue'

const store = useSopStore()
const skillStore = useSkillTreeStore()
const responsive = useResponsive()

// View state
const currentView = ref<'skillTree' | 'sopManager' | 'achievements' | 'settings'>('skillTree')
const mainViewRef = ref<InstanceType<typeof SkillTreeView> | null>(null)

// Computed
const isMobile = computed(() => responsive.isMobile.value)

const currentViewComponent = computed(() => {
  if (currentView.value === 'sopManager') {
    return SopManagerView
  }
  return SkillTreeView
})

const responsiveClasses = computed(() => ({
  'app-layout--mobile': isMobile.value,
  'app-layout--desktop': !isMobile.value,
  'app-layout--touch': responsive.touchMode.value
}))

// Navigation handlers
function handleNavigate(view: string) {
  if (view === 'achievements') {
    // On mobile, show achievements as overlay or switch view
    currentView.value = 'skillTree' // Go back to skill tree
    // Could trigger achievement sidebar on mobile
    return
  }
  if (view === 'settings') {
    store.showSettings = true
    return
  }
  currentView.value = view as any
}

function handleOpenSkill(skillId: string | null) {
  if (skillId) {
    currentView.value = 'skillTree'
    skillStore.setActiveSkill(skillId)
  } else if (isMobile.value) {
    // On mobile, open new skill modal
    currentView.value = 'skillTree'
    mainViewRef.value?.showNewSkillModal?.()
  }
}

function handleQuickAction() {
  // Open new skill modal
  currentView.value = 'skillTree'
  setTimeout(() => {
    mainViewRef.value?.showNewSkillModal?.()
  }, 100)
}
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-void);
  color: var(--text-primary);
}

.app-layout--desktop {
  flex-direction: row;
}

.app-layout--mobile {
  flex-direction: column;
}

.layout-sidebar {
  flex-shrink: 0;
}

.layout-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Mobile-specific adjustments */
.app-layout--mobile .layout-main {
  padding-bottom: 70px; /* Space for bottom nav */
}
</style>