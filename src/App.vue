<template>
  <div class="app-container" :class="{ 'app-container--mobile': isMobile }">
    <TitleBar v-if="!isMobile" />

    <div class="app-main">
      <!-- 成就展示侧边栏 (仅桌面端) -->
      <AchievementSidebar
        v-if="!isMobile"
        @open-skill="handleOpenSkill"
      />

      <!-- 快捷侧边栏 (桌面端) -->
      <aside v-if="!isMobile" class="quick-sidebar">
        <button
          class="sidebar-btn"
          :class="{ 'sidebar-btn--active': currentView === 'skillTree' }"
          @click="currentView = 'skillTree'"
          title="技能树"
        >
          🌲
        </button>
        <button
          class="sidebar-btn"
          :class="{ 'sidebar-btn--active': currentView === 'sopManager' }"
          @click="navigateTo('sopManager')"
          title="任务手册"
        >
          📋
        </button>
        <div class="sidebar-divider"></div>
        <button
          class="sidebar-btn"
          @click="store.showSettings = true"
          title="设置"
        >
          ⚙️
        </button>
      </aside>

      <!-- 主内容区 -->
      <main class="app-content">
        <!-- 桌面端视图 -->
        <template v-if="!isMobile">
          <SkillTreeView
            v-if="currentView === 'skillTree'"
            ref="skillTreeViewRef"
          />
          <SopManagerView
            v-else-if="currentView === 'sopManager'"
            @open-skill="handleOpenSkill"
          />
        </template>

        <!-- 移动端视图 -->
        <template v-else>
          <!-- 技能树移动版 -->
          <MobileSkillTreeView
            v-if="currentView === 'skillTree'"
            ref="mobileSkillTreeRef"
            @open-skill="handleOpenSkill"
          />

          <!-- 任务手册移动版 -->
          <MobileSopManagerView
            v-else-if="currentView === 'sopManager'"
            @open-skill="handleOpenSkill"
          />

          <!-- 成就页面移动版 -->
          <MobileAchievementsView
            v-else-if="currentView === 'achievements'"
          />
        </template>
      </main>
    </div>

    <!-- 移动端底部导航 -->
    <MobileBottomNav
      v-if="isMobile"
      :current-view="currentView"
      @navigate="navigateTo"
      @quick-action="handleQuickAction"
    />

    <FloatingToolbar v-if="!isMobile" />
    <ToastStack />
    <SettingsModal v-if="store.showSettings" @close="store.showSettings = false" />
    <LevelUpModal />
    <AchievementUnlockModal />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSopStore } from '@/stores/sop'
import { useSkillTreeStore } from '@/stores/skillTree'
import { useGamificationStore } from '@/stores/gamification'
import { useResponsive } from '@/composables/useResponsive'
import TitleBar from '@/components/TitleBar.vue'
import AchievementSidebar from '@/components/AchievementSidebar.vue'
import FloatingToolbar from '@/components/FloatingToolbar.vue'
import ToastStack from '@/components/ToastStack.vue'
import SettingsModal from '@/components/modals/SettingsModal.vue'
import MobileBottomNav from '@/components/MobileBottomNav.vue'
import SkillTreeView from '@/components/SkillTree/SkillTreeView.vue'
import SopManagerView from '@/components/SopManagerView.vue'
import MobileSkillTreeView from '@/components/MobileSkillTreeView.vue'

// Mobile views (to be created)
import MobileSopManagerView from '@/components/MobileSopManagerView.vue'
import MobileAchievementsView from '@/components/MobileAchievementsView.vue'
import LevelUpModal from '@/components/modals/LevelUpModal.vue'
import AchievementUnlockModal from '@/components/modals/AchievementUnlockModal.vue'

const store = useSopStore()
const skillStore = useSkillTreeStore()
const gamificationStore = useGamificationStore()
const responsive = useResponsive()

const currentView = ref<'skillTree' | 'sopManager' | 'achievements' | 'settings'>('skillTree')
const skillTreeViewRef = ref<InstanceType<typeof SkillTreeView> | null>(null)
const mobileSkillTreeRef = ref<InstanceType<typeof MobileSkillTreeView> | null>(null)

const isMobile = computed(() => responsive.isMobile.value)

function navigateTo(view: string) {
  if (view === 'settings') {
    store.showSettings = true
    return
  }
  currentView.value = view as any
}

function handleOpenSkill(skillId: string | null) {
  if (skillId) {
    skillStore.setActiveSkill(skillId)
  } else {
    // 新建技能
    currentView.value = 'skillTree'
    if (isMobile.value) {
      mobileSkillTreeRef.value?.openNewSkillModal?.()
    } else {
      skillTreeViewRef.value?.showNewSkillModal()
    }
  }
}

function handleQuickAction() {
  // 打开新建技能弹窗
  currentView.value = 'skillTree'
  if (isMobile.value) {
    setTimeout(() => {
      mobileSkillTreeRef.value?.openNewSkillModal?.()
    }, 100)
  } else {
    skillTreeViewRef.value?.showNewSkillModal()
  }
}

onMounted(async () => {
  // 应用主题 - 防止深色闪烁
  store.initTheme()

  // 加载数据
  await store.loadData()

  // 加载技能树数据
  await skillStore.loadData()

  // 如果设置了自动折叠已完成技能，则应用折叠
  if (skillStore.autoCollapseCompleted) {
    for (const skill of skillStore.skillTrees) {
      const hasInProgress = skill.stages.some(s => s.status === 'in-progress')
      if (!hasInProgress && skill.stages.length > 0) {
        skillStore.collapseSkill(skill.id)
      }
    }
  }

  // 收集进行中的阶段用于每日挑战
  const inProgressStages: { skillTitle: string; stageName: string; stageId: string; skillId: string }[] = []
  for (const skill of skillStore.skillTrees) {
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

  // 加载游戏化档案（传入进行中的阶段和技能树数据）
  gamificationStore.loadProfile(store.data.profile, inProgressStages, skillStore.skillTrees)

  // 监听外部文件变化
  window.electronAPI?.onExternalChange(d => {
    store.applyExternalData(d)
    if (d.skillTrees) {
      skillStore.loadSkillTrees(d.skillTrees)
    }
    if (d.profile) {
      // 重新收集进行中的阶段
      const newInProgressStages: { skillTitle: string; stageName: string; stageId: string; skillId: string }[] = []
      for (const skill of skillStore.skillTrees) {
        for (const stage of skill.stages) {
          if (stage.status === 'in-progress') {
            newInProgressStages.push({
              skillTitle: skill.title,
              stageName: stage.name,
              stageId: stage.id,
              skillId: skill.id
            })
          }
        }
      }
      gamificationStore.loadProfile(d.profile, newInProgressStages, skillStore.skillTrees)
    }
  })
})

onUnmounted(() => {
  window.electronAPI?.removeExternalChangeListener()
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-void);
  color: var(--text-primary);
}

.app-container--mobile {
  /* Mobile handles its own padding */
}

.app-main {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* 快捷侧边栏 (桌面端) */
.quick-sidebar {
  width: 52px;
  background: var(--bg-base);
  border-right: 1px solid var(--border-sub);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 4px;
  flex-shrink: 0;
}

.sidebar-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease;
  position: relative;
}

.sidebar-btn:hover {
  background: var(--bg-hover);
  transform: scale(1.05);
}

.sidebar-btn--active {
  background: var(--primary-glow);
}

.sidebar-btn--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--primary);
  border-radius: 0 3px 3px 0;
}

.sidebar-divider {
  width: 24px;
  height: 1px;
  background: var(--border-def);
  margin: 8px 0;
}

.app-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Mobile content padding for bottom nav */
.app-container--mobile .app-content {
  padding-bottom: 70px;
}
</style>