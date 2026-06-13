<template>
  <div class="mobile-skill-tree" :class="{ 'safe-area-bottom': hasSafeArea }">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <div class="header-title">
        <span class="title-icon">🌲</span>
        <span class="title-text">🎯 技能图谱</span>
      </div>
      <div class="header-stats">
        <span class="stat-badge">{{ inProgressCount }} 进行中</span>
      </div>
    </header>

    <!-- Skill Tree Content -->
    <main class="mobile-content" ref="contentRef">
      <!-- Empty State -->
      <div v-if="store.skillTrees.length === 0" class="empty-state">
        <div class="empty-icon">🌲</div>
        <h2 class="empty-title">还没有技能树</h2>
        <p class="empty-desc">点击下方按钮开始构建你的技能图谱</p>
        <button class="btn-add-first" @click="showNewSkillModal = true">
          ➕ 添加第一个技能
        </button>
      </div>

      <!-- Skill Cards -->
      <div v-else class="skill-cards">
        <div
          v-for="skill in store.skillTrees"
          :key="skill.id"
          class="skill-card-mobile"
          :class="{ 'skill-card-mobile--expanded': isExpanded(skill.id) }"
          @click="handleSkillClick(skill)"
        >
          <div class="card-header">
            <span class="card-icon">{{ skill.icon }}</span>
            <div class="card-info">
              <h3 class="card-title">{{ skill.title }}</h3>
              <span class="card-level">Lv.{{ getSkillLevel(skill) }}</span>
            </div>
            <span class="card-progress">{{ skill.progress }}%</span>
          </div>

          <!-- Progress bar -->
          <div class="card-progress-bar">
            <div class="progress-fill" :style="{ width: `${skill.progress}%` }"></div>
          </div>

          <!-- Expanded stages -->
          <Transition name="stages-expand">
            <div v-if="isExpanded(skill.id)" class="card-stages">
              <div
                v-for="stage in skill.stages"
                :key="stage.id"
                class="stage-item"
                :class="{
                  'stage-item--completed': stage.status === 'completed',
                  'stage-item--in-progress': stage.status === 'in-progress',
                  'stage-item--locked': stage.status === 'locked'
                }"
                @click.stop="handleStageClick(stage)"
              >
                <div class="stage-status">
                  <span v-if="stage.status === 'completed'">✅</span>
                  <span v-else-if="stage.status === 'in-progress'">⏳</span>
                  <span v-else>🔒</span>
                </div>
                <div class="stage-info">
                  <span class="stage-name">{{ stage.name }}</span>
                  <span class="stage-target">{{ stage.target }}</span>
                </div>
              </div>

              <!-- Add stage button -->
              <button class="btn-add-stage" @click.stop="openAddStage(skill)">
                ➕ 添加阶段
              </button>
            </div>
          </Transition>

          <!-- Card actions -->
          <div class="card-actions" v-if="isExpanded(skill.id)">
            <button class="action-btn" @click.stop="openEditSkill(skill)">✏️</button>
            <button class="action-btn action-btn--danger" @click.stop="confirmDeleteSkill(skill)">🗑️</button>
          </div>
        </div>
      </div>

      <!-- Floating Add Button -->
      <button class="fab" @click="showNewSkillModal = true">
        <span>➕</span>
      </button>
    </main>

    <!-- Modals -->
    <NewSkillModal
      v-if="showNewSkillModal"
      :skill="editingSkill"
      @close="closeNewSkillModal"
      @save="saveSkill"
    />

    <AddStageModal
      v-if="showAddStageModal"
      :skill="stageOwnerSkill"
      :stage="editingStage"
      @close="closeAddStageModal"
      @save="saveStage"
    />

    <AchievementModal
      v-if="showAchievementModal"
      :stage="activeStageData"
      :skill-title="activeSkillTitle"
      @close="showAchievementModal = false"
      @confirm="handleAchievementConfirm"
      @open-sop="openSopEditor"
    />

    <SopManagerView
      v-if="showSopManagerModal"
      class="fullscreen-modal"
      @close="showSopManagerModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, onMounted } from 'vue'
import { useSkillTreeStore } from '@/stores/skillTree'
import type { SkillNode, Stage, Evidence } from '@/types'
import NewSkillModal from '@/components/modals/NewSkillModal.vue'
import AddStageModal from '@/components/modals/AddStageModal.vue'
import AchievementModal from '@/components/modals/AchievementModal.vue'
import SopManagerView from '@/components/SopManagerView.vue'

const emit = defineEmits<{
  (e: 'open-skill', skillId: string | null): void
}>()

const store = useSkillTreeStore()

const contentRef = ref<HTMLElement | null>(null)
const hasSafeArea = ref(false)

// Modal states
const showNewSkillModal = ref(false)
const showAddStageModal = ref(false)
const showAchievementModal = ref(false)
const showSopManagerModal = ref(false)

// Edit states
const editingSkill = ref<SkillNode | null>(null)
const editingStage = ref<Stage | null>(null)
const stageOwnerSkill = ref<SkillNode | null>(null)
const activeStageData = ref<Stage | null>(null)
const activeSkillTitle = ref('')

// Computed
const inProgressCount = computed(() => {
  let count = 0
  for (const skill of store.skillTrees) {
    count += skill.stages.filter(s => s.status === 'in-progress').length
  }
  return count
})

// Methods
function isExpanded(skillId: string): boolean {
  return store.isExpanded(skillId)
}

function getSkillLevel(skill: SkillNode): string {
  if (skill.progress === 100) return 'MAX'
  if (skill.progress >= 80) return '4'
  if (skill.progress >= 60) return '3'
  if (skill.progress >= 40) return '2'
  if (skill.progress > 0) return '1'
  return '0'
}

function handleSkillClick(skill: SkillNode) {
  store.setActiveSkill(skill.id)
  if (skill.stages.length > 0) {
    store.toggleExpand(skill.id)
  }
}

function handleStageClick(stage: Stage) {
  if (stage.status === 'locked') return

  activeStageData.value = stage

  for (const skill of store.skillTrees) {
    if (skill.stages.find(s => s.id === stage.id)) {
      activeSkillTitle.value = skill.title
      break
    }
  }

  if (stage.status === 'in-progress') {
    showAchievementModal.value = true
  }
}

function openAddStage(skill: SkillNode) {
  stageOwnerSkill.value = markRaw(skill)
  editingStage.value = null
  showAddStageModal.value = true
}

function openEditSkill(skill: SkillNode) {
  editingSkill.value = markRaw(skill)
  showNewSkillModal.value = true
}

function closeNewSkillModal() {
  showNewSkillModal.value = false
  editingSkill.value = null
}

function closeAddStageModal() {
  showAddStageModal.value = false
  editingStage.value = null
  stageOwnerSkill.value = null
}

function saveSkill(data: { title: string; icon: string; description: string }) {
  if (editingSkill.value) {
    store.updateSkill(editingSkill.value.id, data)
  } else {
    store.createSkill(data.title, data.icon, data.description)
  }
  closeNewSkillModal()
}

function saveStage(data: { name: string; target: string; reward: string; achievementId?: string }) {
  if (editingStage.value && stageOwnerSkill.value) {
    store.updateStage(stageOwnerSkill.value.id, editingStage.value.id, data)
  } else if (stageOwnerSkill.value) {
    const newStage = store.addStage(stageOwnerSkill.value.id, data.name, data.target, data.reward)
    if (data.achievementId && newStage) {
      store.updateStage(stageOwnerSkill.value.id, newStage.id, { achievementId: data.achievementId })
    }
  }
  closeAddStageModal()
}

function confirmDeleteSkill(skill: SkillNode) {
  if (confirm(`确定删除技能"${skill.title}"吗？此操作不可撤销。`)) {
    store.deleteSkill(skill.id)
  }
}

function handleAchievementConfirm(evidence: Evidence[], sopId?: string) {
  if (activeStageData.value) {
    store.completeStage(activeStageData.value.id, evidence, sopId)
  }
  showAchievementModal.value = false
  activeStageData.value = null
}

function openSopEditor(sopId?: string) {
  showSopManagerModal.value = true
}

// Expose for parent
defineExpose({
  openNewSkillModal: () => { showNewSkillModal.value = true }
})

onMounted(() => {
  // Detect safe area for iOS
  hasSafeArea.value = CSS.supports('padding-bottom', 'env(safe-area-inset-bottom)')
})
</script>

<style scoped>
.mobile-skill-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-void);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Mobile Header */
.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--bg-base);
  border-bottom: 1px solid var(--border-sub);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
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

.header-stats {
  display: flex;
  gap: 8px;
}

.stat-badge {
  font-size: 12px;
  padding: 4px 10px;
  background: var(--primary-glow);
  color: var(--primary);
  border-radius: 12px;
  font-weight: 600;
}

/* Content */
.mobile-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 100px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0 0 24px;
}

.btn-add-first {
  padding: 12px 24px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

/* Skill Cards */
.skill-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skill-card-mobile {
  background: var(--bg-raised);
  border: 1px solid var(--border-def);
  border-radius: 16px;
  padding: 16px;
  transition: all 200ms ease;
}

.skill-card-mobile:active {
  transform: scale(0.98);
}

.skill-card-mobile--expanded {
  border-color: var(--primary);
  box-shadow: 0 0 16px var(--primary-glow);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.card-level {
  font-size: 11px;
  color: var(--primary);
  background: var(--primary-glow);
  padding: 2px 8px;
  border-radius: 8px;
  width: fit-content;
}

.card-progress {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary);
}

.card-progress-bar {
  height: 6px;
  background: var(--bg-panel);
  border-radius: 3px;
  margin-top: 12px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--success));
  border-radius: 3px;
  transition: width 300ms ease;
}

/* Stages */
.card-stages {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-sub);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stage-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-panel);
  border-radius: 10px;
  border: 1px solid var(--border-sub);
  transition: all 150ms ease;
}

.stage-item:active {
  transform: scale(0.98);
}

.stage-item--completed {
  border-color: var(--success);
  opacity: 0.7;
}

.stage-item--in-progress {
  border-color: var(--warning);
  background: var(--warning-glow);
}

.stage-item--locked {
  opacity: 0.5;
}

.stage-status {
  font-size: 18px;
  flex-shrink: 0;
}

.stage-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stage-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.stage-target {
  font-size: 11px;
  color: var(--text-muted);
}

.btn-add-stage {
  padding: 10px;
  border: 2px dashed var(--border-def);
  background: transparent;
  border-radius: 10px;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-add-stage:active {
  border-color: var(--primary);
  color: var(--primary);
}

/* Card Actions */
.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-sub);
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border-def);
  background: var(--bg-panel);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn--danger:active {
  background: var(--danger);
}

/* FAB */
.fab {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  border: none;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 20px var(--primary-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: all 150ms ease;
}

.fab:active {
  transform: scale(0.95);
}

/* Fullscreen Modal */
.fullscreen-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: var(--bg-void);
}

/* Transitions */
.stages-expand-enter-active {
  animation: expand-in 250ms cubic-bezier(0.22, 1, 0.36, 1);
}

.stages-expand-leave-active {
  animation: expand-in 200ms cubic-bezier(0.4, 0, 1, 1) reverse;
}

@keyframes expand-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>