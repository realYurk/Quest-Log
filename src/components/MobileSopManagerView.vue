<template>
  <div class="mobile-sop" :class="{ 'safe-area-bottom': hasSafeArea }">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <div class="header-title">
        <span class="title-icon">📋</span>
        <span class="title-text">SOP 管理</span>
      </div>
      <div class="header-actions">
        <button class="btn-icon-text" @click="showQuickCreate = true">
          ⚡ 快速创建
        </button>
      </div>
    </header>

    <!-- Content -->
    <main class="mobile-content">
      <!-- Collections List -->
      <div class="collections-list">
        <div
          v-for="col in store.data.collections"
          :key="col.id"
          class="collection-item"
        >
          <div
            class="collection-header"
            :class="{ 'collection-header--expanded': expandedCollections.has(col.id) }"
            @click="toggleCollection(col.id)"
          >
            <span class="collection-icon">{{ col.icon }}</span>
            <span class="collection-name">{{ col.name }}</span>
            <span class="collection-count">{{ col.folders.length }}</span>
            <span class="expand-icon">{{ expandedCollections.has(col.id) ? '▼' : '▶' }}</span>
          </div>

          <!-- Folders -->
          <Transition name="expand">
            <div v-if="expandedCollections.has(col.id)" class="folders-list">
              <template v-for="folder in col.folders" :key="folder.id">
                <div
                  class="folder-item"
                  :class="{ 'folder-item--active': activeFolderId === folder.id }"
                  @click="selectFolder(folder.id)"
                >
                  <span class="folder-icon">📁</span>
                  <span class="folder-name">{{ folder.name }}</span>
                  <span class="folder-count">{{ folder.sopItems.length }}</span>
                </div>

                <!-- SOPs - show only for active folder -->
                <template v-if="activeFolderId === folder.id">
                  <div class="sops-list">
                    <div
                      v-for="sop in folder.sopItems"
                      :key="sop.id"
                      class="sop-item"
                      :class="{ 'sop-item--active': store.activeSopId === sop.id }"
                      @click="selectSop(sop.id)"
                    >
                      <span class="sop-icon">📋</span>
                      <span class="sop-title">{{ sop.title }}</span>
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </Transition>
        </div>

        <!-- Empty State -->
        <div v-if="store.data.collections.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <h3 class="empty-title">还没有 SOP</h3>
          <p class="empty-desc">点击下方按钮创建第一个 SOP</p>
          <button class="btn-primary" @click="showNewCollection = true">
            ➕ 新建 Collection
          </button>
        </div>
      </div>

      <!-- SOP Detail -->
      <div v-if="store.activeSop" class="sop-detail">
        <div class="detail-header">
          <h2 class="detail-title">{{ store.activeSop.title }}</h2>
          <div class="detail-actions">
            <button class="btn-secondary" @click="showMermaidEdit = true">
              📊 编辑流程图
            </button>
            <button class="btn-icon-small" @click="resetProgress" title="重置进度">
              🔄
            </button>
          </div>
        </div>

        <!-- Progress -->
        <div v-if="store.completionStats" class="detail-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${store.completionStats.pct}%` }"></div>
          </div>
          <span class="progress-text">{{ store.completionStats.done }}/{{ store.completionStats.total }} 已完成</span>
        </div>

        <!-- Mermaid Panel -->
        <div class="detail-mermaid">
          <MermaidPanel
            :source="store.activeSop.mermaidSource"
            @update:source="updateMermaidSource"
          />
        </div>

        <!-- Cards -->
        <div class="detail-cards">
          <div class="cards-header">
            <span class="cards-label">📋 动作步骤</span>
            <button class="btn-add-card" @click="openAddCard">
              ➕ 新增卡片
            </button>
          </div>

          <div class="cards-list">
            <div
              v-for="(card, index) in store.activeSop.actionCards"
              :key="card.id"
              class="card-item"
              :class="{ 'card-item--completed': card.completed }"
            >
              <div class="card-number">{{ index + 1 }}</div>
              <div class="card-content">
                <div class="card-header-row">
                  <span class="card-title">{{ card.title }}</span>
                  <div class="card-actions">
                    <button class="btn-card-action" @click="toggleCardComplete(card.id)">
                      {{ card.completed ? '✅' : '⬜' }}
                    </button>
                    <button class="btn-card-action" @click="editCard(card)">✏️</button>
                    <button class="btn-card-action" @click="deleteCard(card.id)">🗑️</button>
                  </div>
                </div>
                <div class="card-meta">
                  <span class="card-lang">{{ card.language }}</span>
                  <span class="card-status" :class="card.completed ? 'status-done' : 'status-pending'">
                    {{ card.completed ? '已完成' : '待完成' }}
                  </span>
                </div>
                <div v-if="card.notes" class="card-notes">{{ card.notes }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modals -->
    <NewCollectionModal v-if="showNewCollection" @close="handleNewCollectionClose" />

    <EditCardModal
      v-if="showAddCard"
      :card="editCardData"
      :sop-id="currentSopId"
      @close="closeCardModal"
    />

    <!-- Mermaid Edit Modal -->
    <Teleport to="body">
      <div v-if="showMermaidEdit" class="modal-backdrop" @click.self="showMermaidEdit = false">
        <div class="modal-box">
          <div class="modal-header">
            <span>📊</span>
            <span style="font-weight:600;">编辑流程图</span>
            <div style="flex:1"/>
            <button @click="showMermaidEdit = false">✕</button>
          </div>
          <div class="modal-body">
            <textarea
              v-model="mermaidEditSource"
              class="sop-textarea"
              style="min-height:200px;"
              placeholder="graph LR&#10;    A[开始] --> B[结束]"
            />
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showMermaidEdit = false">取消</button>
            <button class="btn-primary" @click="saveMermaidEdit">保存</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useSopStore } from '@/stores/sop'
import type { ActionCard } from '@/types'
import MermaidPanel from '@/components/MermaidPanel.vue'
import NewCollectionModal from '@/components/modals/NewCollectionModal.vue'
import EditCardModal from '@/components/modals/EditCardModal.vue'

const emit = defineEmits<{
  (e: 'open-skill', skillId: string | null): void
}>()

const store = useSopStore()

const showNewCollection = ref(false)
const showQuickCreate = ref(false)
const showAddCard = ref(false)
const showMermaidEdit = ref(false)
const editCardData = ref<ActionCard | null>(null)
const currentSopId = ref('')
const mermaidEditSource = ref('')
const hasSafeArea = ref(false)

const expandedCollections = reactive(new Set<string>())
const activeFolderId = ref('')

function toggleCollection(colId: string) {
  if (expandedCollections.has(colId)) {
    expandedCollections.delete(colId)
  } else {
    expandedCollections.add(colId)
  }
}

function selectFolder(folderId: string) {
  activeFolderId.value = folderId
}

function selectSop(sopId: string) {
  store.activeSopId = sopId
}

function handleNewCollectionClose() {
  showNewCollection.value = false
  if (store.data.collections.length > 0) {
    const lastCol = store.data.collections[store.data.collections.length - 1]
    expandedCollections.add(lastCol.id)
    if (lastCol.folders.length > 0) {
      activeFolderId.value = lastCol.folders[0].id
    }
  }
}

function toggleCardComplete(cardId: string) {
  if (store.activeSop) {
    store.toggleCard(store.activeSop.id, cardId)
  }
}

function editCard(card: any) {
  currentSopId.value = store.activeSopId || ''
  editCardData.value = card
  showAddCard.value = true
}

function deleteCard(cardId: string) {
  if (!confirm('确定删除此卡片吗？')) return
  if (store.activeSop) {
    store.deleteCard(store.activeSop.id, cardId)
  }
}

function openAddCard() {
  const sid = store.activeSopId
  if (!sid) return
  currentSopId.value = sid
  editCardData.value = null
  showAddCard.value = true
}

function closeCardModal() {
  showAddCard.value = false
  editCardData.value = null
}

function resetProgress() {
  if (!store.activeSop) return
  if (!confirm('重置所有卡片的完成状态？')) return
  for (const c of store.activeSop.actionCards) {
    if (c.completed) store.toggleCard(store.activeSop.id, c.id)
  }
}

function updateMermaidSource(source: string) {
  if (!store.activeSop) return
  store.updateSopItem(store.activeSop.id, { mermaidSource: source })
}

function saveMermaidEdit() {
  if (!store.activeSop) return
  store.updateSopItem(store.activeSop.id, { mermaidSource: mermaidEditSource.value })
  store.toast('流程图已保存')
  showMermaidEdit.value = false
}

onMounted(() => {
  hasSafeArea.value = CSS.supports('padding-bottom', 'env(safe-area-inset-bottom)')
  if (store.data.collections.length > 0) {
    const firstCol = store.data.collections[0]
    expandedCollections.add(firstCol.id)
    if (firstCol.folders.length > 0) {
      selectFolder(firstCol.folders[0].id)
      if (firstCol.folders[0].sopItems.length > 0) {
        selectSop(firstCol.folders[0].sopItems[0].id)
      }
    }
  }
})
</script>

<style scoped>
.mobile-sop {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-void);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Header */
.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--bg-base);
  border-bottom: 1px solid var(--border-sub);
  flex-shrink: 0;
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

.btn-icon-text {
  padding: 6px 12px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}

/* Content */
.mobile-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 20px;
}

/* Collections List */
.collections-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.collection-item {
  background: var(--bg-raised);
  border-radius: 12px;
  overflow: hidden;
}

.collection-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 150ms ease;
}

.collection-header:active {
  background: var(--bg-hover);
}

.collection-icon {
  font-size: 20px;
}

.collection-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.collection-count {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-panel);
  padding: 2px 8px;
  border-radius: 8px;
}

.expand-icon {
  font-size: 10px;
  color: var(--text-muted);
}

.folders-list {
  padding: 0 16px 12px;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 150ms ease;
}

.folder-item:active {
  background: var(--bg-hover);
}

.folder-item--active {
  background: var(--primary-glow);
  border: 1px solid var(--primary);
}

.folder-icon {
  font-size: 14px;
}

.folder-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
}

.folder-count {
  font-size: 11px;
  color: var(--text-muted);
}

.sops-list {
  padding-left: 24px;
  margin-top: 4px;
}

.sop-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 150ms ease;
}

.sop-item:active {
  background: var(--bg-hover);
}

.sop-item--active {
  background: var(--primary-glow);
}

.sop-icon {
  font-size: 12px;
}

.sop-title {
  font-size: 12px;
  color: var(--text-primary);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0 0 20px;
}

.btn-primary {
  padding: 12px 24px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

/* SOP Detail */
.sop-detail {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-sub);
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.detail-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.btn-secondary {
  padding: 6px 12px;
  background: var(--bg-panel);
  border: 1px solid var(--border-def);
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}

.btn-icon-small {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border-def);
  background: var(--bg-panel);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

/* Progress */
.detail-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-panel);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--success);
  border-radius: 4px;
  transition: width 300ms ease;
}

.progress-text {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}

/* Mermaid */
.detail-mermaid {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}

/* Cards */
.detail-cards {
  margin-top: 16px;
}

.cards-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.cards-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-add-card {
  padding: 6px 12px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: var(--bg-raised);
  border-radius: 12px;
  border: 1px solid var(--border-def);
}

.card-item--completed {
  opacity: 0.7;
  border-color: var(--success);
}

.card-number {
  width: 28px;
  height: 28px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.card-item--completed .card-number {
  background: var(--success);
}

.card-content {
  flex: 1;
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-actions {
  display: flex;
  gap: 4px;
}

.btn-card-action {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: var(--bg-panel);
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}

.card-lang {
  font-size: 10px;
  background: var(--bg-panel);
  color: var(--text-muted);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.card-status {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-done {
  background: var(--success-glow);
  color: var(--success);
}

.status-pending {
  background: var(--warning-glow);
  color: var(--warning);
}

.card-notes {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 8px;
  background: var(--bg-panel);
  border-radius: 6px;
  border-left: 3px solid var(--primary);
}

/* Modal styles */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-box {
  background: var(--bg-panel);
  border: 1px solid var(--border-def);
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-sub);
}

.modal-body {
  padding: 16px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-sub);
}

.btn-ghost {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--border-def);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
}

.btn-primary {
  padding: 8px 16px;
  background: var(--primary);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
}

/* Transitions */
.expand-enter-active {
  animation: expand-in 250ms ease;
}

.expand-leave-active {
  animation: expand-in 200ms ease reverse;
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