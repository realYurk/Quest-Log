<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="achievement-modal" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-icon">🎯</div>
          <h2 class="modal-title">{{ isViewMode ? '阶段附件' : '阶段达成确认' }}</h2>
          <button class="btn-close" @click="emit('close')" aria-label="关闭">✕</button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <!-- 技能和阶段信息 -->
          <div class="stage-info">
            <div class="info-row">
              <span class="info-label">技能</span>
              <span class="info-value">{{ skillTitle }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">阶段</span>
              <span class="info-value highlight">{{ stage?.name }}</span>
            </div>
            <div class="info-row target">
              <span class="info-label">目标</span>
              <span class="info-value">{{ stage?.target }}</span>
            </div>
          </div>

          <!-- 证明材料 -->
          <div class="section">
            <label class="section-label">📋 证明材料</label>
            <div class="evidence-upload">
              <div class="evidence-list" v-if="evidence.length > 0">
                <div
                  v-for="(item, index) in evidence"
                  :key="item.id"
                  class="evidence-item"
                  :class="{ 'evidence-item--previewable': item.type === 'image' }"
                  @click="previewEvidence(item)"
                >
                  <span class="evidence-icon">{{ getEvidenceIcon(item.type) }}</span>
                  <span class="evidence-name" :title="item.name">{{ item.name }}</span>
                  <button v-if="!isViewMode" class="btn-remove" @click.stop="removeEvidence(index)">✕</button>
                </div>
              </div>

              <div v-if="!isViewMode" class="upload-area" @click="triggerFileInput">
                <input
                  ref="fileInputRef"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.md"
                  @change="handleFileSelect"
                  style="display: none"
                />
                <div class="upload-hint">
                  <span class="upload-icon">📎</span>
                  <span>点击或拖拽上传文件</span>
                  <span class="upload-formats">支持：图片、PDF、文档</span>
                </div>
              </div>
              <div v-else-if="evidence.length === 0" class="no-evidence">
                <span class="no-evidence-text">暂无附件</span>
              </div>
            </div>
          </div>

          <!-- 图片预览弹窗 -->
          <Teleport to="body">
            <div v-if="previewingItem" class="preview-modal" @click.self="previewingItem = null">
              <button class="preview-close" @click="previewingItem = null">✕</button>
              <img v-if="previewingItem.type === 'image'" :src="previewingItem.url" :alt="previewingItem.name" class="preview-image" />
              <iframe v-else-if="previewingItem.type === 'document'" :src="previewingItem.url" class="preview-document" />
              <a v-else :href="previewingItem.url" :download="previewingItem.name" class="preview-link">下载查看：{{ previewingItem.name }}</a>
            </div>
          </Teleport>

          <!-- SOP关联 -->
          <div v-if="!isViewMode" class="section">
            <label class="section-label">📚 SOP记录（可选）</label>
            <div class="sop-selector">
              <select v-model="selectedSopId" class="sop-select">
                <option value="">选择关联的SOP...</option>
                <option v-for="sop in allSops" :key="sop.id" :value="sop.id">
                  {{ sop.path }} / {{ sop.title }}
                </option>
              </select>
            </div>
          </div>

          <!-- 奖励展示 -->
          <div class="reward-section" v-if="linkedAchievement">
            <div class="reward-badge">
              <span class="reward-icon">🏅</span>
              <span class="reward-label">关联成就奖励</span>
            </div>
            <div class="achievement-reward">
              <span class="achievement-reward-icon">{{ linkedAchievement.icon }}</span>
              <div class="achievement-reward-info">
                <span class="achievement-reward-title">{{ linkedAchievement.title }}</span>
                <span class="achievement-reward-desc">{{ linkedAchievement.description }}</span>
              </div>
              <span class="achievement-reward-rarity" :class="'rarity-' + linkedAchievement.rarity">{{ linkedAchievement.rarity }}</span>
            </div>
          </div>
          <div class="reward-section" v-else-if="stage?.reward">
            <div class="reward-badge">
              <span class="reward-icon">🎁</span>
              <span class="reward-label">解锁奖励</span>
            </div>
            <p class="reward-text">{{ stage?.reward }}</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button v-if="isViewMode" class="btn-ghost" @click="emit('close')">关闭</button>
          <template v-else>
            <button class="btn-ghost" @click="emit('close')">取消</button>
            <button
              class="btn-achievement"
              @click="handleConfirm"
            >
              ✨ 确认达成并领取奖励
            </button>
          </template>
        </div>

        <!-- 成就动画 -->
        <Transition name="achievement">
          <div v-if="showAchievement" class="achievement-overlay">
            <div class="confetti">
              <span v-for="i in 20" :key="i" class="confetti-piece" :style="getConfettiStyle(i)">🎉</span>
            </div>
            <div class="achievement-text">🎉 成就解锁！</div>
          </div>
        </Transition>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Stage, Evidence, EvidenceType, Achievement } from '@/types'
import { useSopStore } from '@/stores/sop'
import { useGamificationStore } from '@/stores/gamification'

const props = defineProps<{
  stage: Stage | null
  skillTitle: string
  initialPreviewItem?: Evidence | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', evidence: Evidence[], sopId?: string): void
  (e: 'open-sop', sopId?: string): void
}>()

const sopStore = useSopStore()
const gamificationStore = useGamificationStore()
const fileInputRef = ref<HTMLInputElement | null>(null)
const evidence = ref<Evidence[]>([...((props.stage?.evidence as Evidence[]) || [])])
const selectedSopId = ref('')
const showAchievement = ref(false)
const previewingItem = ref<Evidence | null>(null)

// 关联的成就（如果有的话）
const linkedAchievement = computed<Achievement | null>(() => {
  if (!props.stage?.achievementId) return null
  const allAchievements = gamificationStore.allAchievements
  return allAchievements.find(a => a.id === props.stage!.achievementId) || null
})

// 查看模式：已完成阶段只允许查看附件，不允许上传
const isViewMode = computed(() => props.stage?.status === 'completed')

// 获取所有SOP列表
const allSops = computed(() => {
  const sops: { id: string; title: string; path: string }[] = []
  for (const col of sopStore.data.collections) {
    for (const folder of col.folders) {
      for (const sop of folder.sopItems) {
        sops.push({
          id: sop.id,
          title: sop.title,
          path: `${col.name} / ${folder.name}`
        })
      }
    }
  }
  return sops
})

function getEvidenceIcon(type: EvidenceType): string {
  switch (type) {
    case 'image': return '🖼️'
    case 'video': return '🎬'
    case 'document': return '📄'
    case 'link': return '🔗'
    default: return '📎'
  }
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return

  for (const file of Array.from(input.files)) {
    // Determine file type
    let type: EvidenceType = 'document'
    if (file.type.startsWith('image/')) {
      type = 'image'
    } else if (file.type.includes('pdf')) {
      type = 'document'
    } else if (file.type.includes('video')) {
      type = 'video'
    }

    // Convert to base64 for persistent storage
    const reader = new FileReader()
    reader.onload = () => {
      evidence.value.push({
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        type,
        url: reader.result as string, // base64 data URL
        name: file.name,
        size: file.size,
        uploadedAt: Date.now()
      })
    }
    reader.readAsDataURL(file)
  }

  input.value = ''
}

function removeEvidence(index: number) {
  evidence.value.splice(index, 1)
}

function previewEvidence(item: Evidence) {
  previewingItem.value = item
}

function getConfettiStyle(index: number) {
  const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']
  const color = colors[index % colors.length]
  const left = Math.random() * 100
  const delay = Math.random() * 0.5
  const duration = 0.8 + Math.random() * 0.5
  return {
    left: `${left}%`,
    backgroundColor: color,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

async function handleConfirm() {
  const sopId = selectedSopId.value || undefined
  emit('confirm', evidence.value, sopId)
  // 父组件处理完成后会调用 closeAchievementModal 关闭此弹窗
  // 等待一小段时间让父组件处理完成再关闭
  await new Promise(resolve => setTimeout(resolve, 100))
}

onMounted(() => {
  // 如果阶段已有SOP关联，自动选择
  if (props.stage?.sopId) {
    selectedSopId.value = props.stage.sopId
  }
  // 如果传入了初始预览项，自动打开预览
  if (props.initialPreviewItem) {
    previewingItem.value = props.initialPreviewItem
  }
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fade-in 200ms ease;
}

.achievement-modal {
  position: relative;
  background: var(--bg-elevated);
  border-radius: 20px;
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  animation: scale-in 300ms cubic-bezier(0, 0, 0.2, 1);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-sub);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), transparent);
}

.header-icon {
  font-size: 24px;
}

.modal-title {
  flex: 1;
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
  gap: 24px;
  overflow-y: auto;
  max-height: calc(90vh - 200px);
}

/* 阶段信息 */
.stage-info {
  background: var(--bg-panel);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.info-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  min-width: 50px;
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
}

.info-value.highlight {
  color: var(--primary);
  font-weight: 600;
}

.info-row.target .info-value {
  color: var(--text-secondary);
  font-size: 13px;
}

/* 证明材料 */
.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.evidence-upload {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.evidence-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.evidence-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--bg-panel);
  border-radius: 6px;
  border: 1px solid var(--border-def);
  cursor: pointer;
  transition: all 150ms ease;
}

.evidence-item:hover {
  border-color: var(--primary);
  background: var(--primary-glow);
}

.evidence-item--previewable:hover {
  border-color: var(--success);
  background: var(--success-glow);
}

.evidence-icon {
  font-size: 14px;
}

.evidence-name {
  font-size: 12px;
  color: var(--text-primary);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-remove {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: var(--danger);
  color: white;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 150ms ease;
}

.btn-remove:hover {
  opacity: 1;
}

.upload-area {
  border: 2px dashed var(--border-def);
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 150ms ease;
}

.upload-area:hover {
  border-color: var(--primary);
  background: var(--primary-glow);
}

.upload-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.upload-icon {
  font-size: 24px;
}

.upload-formats {
  font-size: 11px;
  color: var(--text-muted);
}

.no-evidence {
  padding: 16px;
  text-align: center;
}

.no-evidence-text {
  font-size: 13px;
  color: var(--text-muted);
}

/* SOP选项 */
.sop-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-panel);
  border-radius: 8px;
  cursor: pointer;
  transition: all 150ms ease;
}

.checkbox-option:hover {
  background: var(--bg-hover);
}

.checkbox-option input[type="checkbox"] {
  accent-color: var(--primary);
  width: 16px;
  height: 16px;
}

.checkbox-label {
  font-size: 13px;
  color: var(--text-primary);
}

.sop-selector {
  margin-top: 10px;
}

.sop-select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-def);
  background: var(--bg-panel);
  color: var(--text-primary);
  font-size: 13px;
}

/* 奖励 */
.reward-section {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 12px;
  padding: 16px;
}

.reward-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.reward-icon {
  font-size: 16px;
}

.reward-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--warning);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.reward-text {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0;
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

.btn-achievement {
  padding: 12px 20px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, var(--success), #16a34a);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease;
  box-shadow: 0 4px 15px var(--success-glow);
}

.btn-achievement:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--success-glow);
}

.btn-achievement:active {
  transform: scale(0.97);
}

/* 成就动画 */
.achievement-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.confetti {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  animation: confetti-fall 1s ease-out forwards;
}

.achievement-text {
  font-size: 32px;
  font-weight: 700;
  color: var(--success);
  text-shadow: 0 0 30px var(--success-glow);
  animation: text-pop 0.5s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-300px) rotate(720deg);
    opacity: 0;
  }
}

@keyframes text-pop {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.achievement-enter-active {
  animation: achievement-in 0.3s ease-out;
}

.achievement-leave-active {
  animation: achievement-in 0.2s ease-in reverse;
}

@keyframes achievement-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 预览弹窗 */
.preview-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fade-in 200ms ease;
}

.preview-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 150ms ease;
}

.preview-close:hover {
  background: var(--danger);
  color: white;
}

.preview-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.preview-document {
  width: 80vw;
  height: 90vh;
  border: none;
  border-radius: 12px;
  background: white;
}

.preview-link {
  padding: 20px 40px;
  background: var(--primary);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  transition: all 150ms ease;
}

.preview-link:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 30px var(--primary-glow);
}

/* 关联成就奖励样式 */
.achievement-reward {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05));
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 10px;
}

.achievement-reward-icon {
  font-size: 28px;
}

.achievement-reward-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.achievement-reward-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.achievement-reward-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.achievement-reward-rarity {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
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
</style>