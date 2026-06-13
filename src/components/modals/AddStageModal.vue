<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-box" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="modal-header">
          <h2 class="modal-title">{{ isEditing ? '编辑阶段' : '添加阶段' }}</h2>
          <button class="btn-close" @click="emit('close')" aria-label="关闭">✕</button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <!-- 技能名（只读） -->
          <div class="field">
            <label class="field-label">所属技能</label>
            <div class="skill-badge">
              <span>{{ skill?.icon }}</span>
              <span>{{ skill?.title }}</span>
            </div>
          </div>

          <!-- 阶段名称 -->
          <div class="field">
            <label class="field-label">阶段名称 *</label>
            <input
              v-model="form.name"
              type="text"
              class="sop-input"
              placeholder="例如：基础阶段、进阶阶段"
              maxlength="50"
            />
          </div>

          <!-- 量化目标 (多行支持) -->
          <div class="field">
            <label class="field-label">量化目标 *</label>
            <textarea
              v-model="form.target"
              class="sop-input"
              placeholder="输入多个目标时用换行分隔，系统会自动识别..."
              rows="3"
              maxlength="300"
            ></textarea>
            <span class="field-hint">多个目标请用换行分隔，如：完成教程、做出Demo、通过考核</span>
          </div>

          <!-- 里程碑 -->
          <div class="field">
            <div class="field-header">
              <label class="field-label">里程碑</label>
              <button class="btn-add-milestone" @click="addMilestone" type="button">
                ➕ 添加里程碑
              </button>
            </div>
            <div v-if="form.milestones.length > 0" class="milestones-list">
              <div
                v-for="(milestone, idx) in form.milestones"
                :key="idx"
                class="milestone-item"
              >
                <input
                  v-model="milestone.title"
                  type="text"
                  class="sop-input milestone-input"
                  placeholder="里程碑描述..."
                  maxlength="100"
                />
                <button
                  class="btn-remove-milestone"
                  @click="removeMilestone(idx)"
                  type="button"
                  title="删除里程碑"
                >
                  🗑️
                </button>
              </div>
            </div>
            <span v-else class="field-hint">添加里程碑来细分阶段目标，完成所有里程碑即完成阶段</span>
          </div>

          <!-- 奖励 -->
          <div class="field">
            <label class="field-label">完成奖励 *</label>
            <input
              v-model="form.reward"
              type="text"
              class="sop-input"
              placeholder="完成后给自己的奖励..."
              maxlength="100"
            />
            <span class="field-hint">你可以关联一个成就作为奖励，或填写自定义奖励内容</span>
          </div>

          <!-- 关联成就 -->
          <div class="field">
            <div class="field-header">
              <label class="field-label">关联成就（可选）</label>
              <button class="btn-add-milestone" @click="form.achievementId = ''" type="button" v-if="form.achievementId">
                🗑️ 清除关联
              </button>
            </div>
            <div class="achievement-selector">
              <div class="achievement-options">
                <label class="checkbox-option" v-for="achievement in availableAchievements" :key="achievement.id"
                  :class="{ 'checkbox-option--selected': form.achievementId === achievement.id }"
                  @click="form.achievementId = form.achievementId === achievement.id ? '' : achievement.id">
                  <span class="achievement-icon">{{ achievement.icon }}</span>
                  <span class="achievement-title">{{ achievement.title }}</span>
                  <span class="achievement-rarity" :class="'rarity-' + achievement.rarity">{{ achievement.rarity }}</span>
                  <span v-if="form.achievementId === achievement.id" class="check-mark">✓</span>
                </label>
              </div>
              <div v-if="availableAchievements.length === 0" class="no-achievements">
                暂无可用成就，所有成就已解锁！
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn-ghost" @click="emit('close')">取消</button>
          <button
            class="btn-primary"
            :disabled="!isValid"
            @click="handleSave"
          >
            {{ isEditing ? '保存' : '添加' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import type { SkillNode, Stage, Milestone } from '@/types'
import { useGamificationStore } from '@/stores/gamification'

const props = defineProps<{
  skill: SkillNode | null
  stage?: Stage | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: {
    name: string
    target: string
    reward: string
    achievementId?: string
    milestones: { title: string }[]
  }): void
}>()

const gamificationStore = useGamificationStore()

const form = reactive({
  name: props.stage?.name || '',
  target: props.stage?.target || '',
  reward: props.stage?.reward || '',
  achievementId: props.stage?.achievementId || '',
  milestones: props.stage?.milestones?.map(m => ({ title: m.title })) || []
})

// 可用的未解锁成就列表
const availableAchievements = computed(() => {
  return gamificationStore.lockedAchievements
})

const isEditing = computed(() => !!props.stage)

const isValid = computed(() => {
  return form.name.trim() && form.target.trim() && form.reward.trim()
})

function addMilestone() {
  form.milestones.push({ title: '' })
}

function removeMilestone(idx: number) {
  form.milestones.splice(idx, 1)
}

function handleSave() {
  if (!isValid.value) return
  emit('save', {
    name: form.name.trim(),
    target: form.target.trim(),
    reward: form.reward.trim(),
    achievementId: form.achievementId.trim() || undefined,
    milestones: form.milestones.filter(m => m.title.trim()).map(m => ({ title: m.title.trim() }))
  })
}
</script>

<style scoped>
.modal-backdrop {
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

.modal-box {
  background: var(--bg-elevated);
  border-radius: 16px;
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  animation: scale-in 250ms cubic-bezier(0, 0, 0.2, 1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-sub);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.btn-close {
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

.btn-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  max-height: calc(90vh - 140px);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.skill-badge {
  padding: 8px 12px;
  background: var(--bg-panel);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-add-milestone {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px dashed var(--border-def);
  background: transparent;
  color: var(--primary);
  font-size: 11px;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-add-milestone:hover {
  background: var(--primary-glow);
  border-style: solid;
}

.sop-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-def);
  background: var(--bg-panel);
  color: var(--text-primary);
  font-size: 14px;
  transition: all 150ms ease;
  box-sizing: border-box;
}

.sop-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.sop-input::placeholder {
  color: var(--text-muted);
}

textarea.sop-input {
  resize: vertical;
  min-height: 80px;
}

.milestones-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.milestone-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.milestone-input {
  flex: 1;
  min-width: 0;
  width: 0;
}

.btn-remove-milestone {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--border-def);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 150ms ease;
  flex-shrink: 0;
}

.btn-remove-milestone:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--danger);
}

.field-hint {
  font-size: 11px;
  color: var(--text-muted);
}

.achievement-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.achievement-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
  padding: 4px;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-panel);
  border: 1px solid var(--border-def);
  border-radius: 8px;
  cursor: pointer;
  transition: all 150ms ease;
}

.checkbox-option:hover {
  border-color: var(--primary);
  background: var(--primary-glow);
}

.checkbox-option--selected {
  border-color: var(--success);
  background: var(--success-glow);
}

.achievement-icon {
  font-size: 16px;
}

.achievement-title {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
}

.achievement-rarity {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.rarity-common {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
}

.rarity-rare {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.rarity-epic {
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
}

.rarity-legendary {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.check-mark {
  color: var(--success);
  font-weight: bold;
}

.no-achievements {
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
  background: var(--bg-panel);
  border-radius: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-sub);
}

.btn-ghost {
  padding: 10px 18px;
  border-radius: 8px;
  border: 1px solid var(--border-def);
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-ghost:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-primary {
  padding: 10px 18px;
  border-radius: 8px;
  border: none;
  background: var(--primary);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.97);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>