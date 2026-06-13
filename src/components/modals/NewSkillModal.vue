<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-box" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="modal-header">
          <h2 class="modal-title">{{ isEditing ? '编辑技能' : '新建技能' }}</h2>
          <button class="btn-close" @click="emit('close')" aria-label="关闭">✕</button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <!-- 图标选择 -->
          <div class="field">
            <label class="field-label">图标</label>
            <div class="icon-picker">
              <div class="icon-preview">{{ form.icon || '📚' }}</div>
              <div class="icon-grid">
                <button
                  v-for="icon in iconOptions"
                  :key="icon"
                  class="icon-option"
                  :class="{ 'icon-option--selected': form.icon === icon }"
                  @click="form.icon = icon"
                >
                  {{ icon }}
                </button>
              </div>
            </div>
          </div>

          <!-- 名称 -->
          <div class="field">
            <label class="field-label">技能名称 *</label>
            <input
              v-model="form.title"
              type="text"
              class="sop-input"
              placeholder="例如：PPT表达能力"
              maxlength="50"
            />
          </div>

          <!-- 描述 -->
          <div class="field">
            <label class="field-label">描述</label>
            <textarea
              v-model="form.description"
              class="sop-input"
              placeholder="描述这个技能的目标和意义..."
              rows="3"
              maxlength="200"
            ></textarea>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn-ghost" @click="emit('close')">取消</button>
          <button
            class="btn-primary"
            :disabled="!form.title.trim()"
            @click="handleSave"
          >
            {{ isEditing ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import type { SkillNode } from '@/types'

const props = defineProps<{
  skill?: SkillNode | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: { title: string; icon: string; description: string }): void
}>()

const iconOptions = [
  '📚', '🎤', '💪', '🧠', '💰', '🎨', '💼', '🚀',
  '📊', '🔧', '🌱', '⏰', '🎯', '✨', '🔥', '💡',
  '🌟', '🎪', '📱', '💻', '🎮', '📷', '🎵', '🏃'
]

const form = reactive({
  title: props.skill?.title || '',
  icon: props.skill?.icon || '📚',
  description: props.skill?.description || ''
})

const isEditing = computed(() => !!props.skill)

function handleSave() {
  if (!form.title.trim()) return
  emit('save', {
    title: form.title.trim(),
    icon: form.icon,
    description: form.description.trim()
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
  position: relative;
  background: var(--bg-elevated);
  border-radius: 16px;
  width: 90%;
  max-width: 440px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  animation: scale-in 250ms cubic-bezier(0, 0, 0.2, 1);
  z-index: 1;
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
  position: relative;
  z-index: 1;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
  position: relative;
  z-index: 2;
  pointer-events: auto;
}

.sop-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
  z-index: 3;
}

.sop-input::placeholder {
  color: var(--text-muted);
}

textarea.sop-input {
  resize: vertical;
  min-height: 80px;
}

/* 图标选择器 */
.icon-picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.icon-preview {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: var(--bg-panel);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
}

.icon-option {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid transparent;
  background: var(--bg-panel);
  font-size: 18px;
  cursor: pointer;
  transition: all 150ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-option:hover {
  border-color: var(--primary);
  background: var(--bg-hover);
}

.icon-option--selected {
  border-color: var(--primary);
  background: var(--primary-glow);
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