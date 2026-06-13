<template>
  <div class="sop-manager-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-left">
        <h1 class="view-title">📋 SOP 管理</h1>
        <span class="view-subtitle">{{ store.data.collections.length }} 个 Collection</span>
      </div>
      <div class="header-actions">
        <button class="btn-quick-create" @click="showQuickCreate = true">
          ⚡ 快速创建
        </button>
        <button class="btn-header" @click="showNewCollection = true">
          ➕ 新建Collection
        </button>
        <button
          v-if="activeCollectionId"
          class="btn-header"
          @click="showNewFolder = true"
        >
          📁 新建文件夹
        </button>
        <button
          v-if="activeFolderId"
          class="btn-header"
          @click="showNewSop = true"
        >
          📝 新建SOP
        </button>
      </div>
    </div>

    <!-- Hierarchy hint banner -->
    <div v-if="hierarchyHint" class="hierarchy-hint">
      <span class="hint-icon">💡</span>
      <span class="hint-text">{{ hierarchyHint }}</span>
      <button v-if="hierarchyHintAction" class="hint-action" @click="hierarchyHintAction.fn">
        {{ hierarchyHintAction.label }}
      </button>
    </div>

    <!-- Body -->
    <div class="view-body">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <!-- 搜索框 -->
        <div class="search-box">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="搜索 SOP..."
          />
        </div>

        <!-- 导航树 -->
        <nav class="nav-tree">
          <template v-for="col in store.data.collections" :key="col.id">
            <div
              class="nav-collection"
              :class="{ 'nav-collection--active': activeCollectionId === col.id }"
              @click="toggleCollection(col.id)"
            >
              <!-- Collection 图标 - 可点击编辑 -->
              <span
                class="nav-icon nav-icon--editable"
                @click.stop="startEditCollectionIcon(col)"
                :title="'点击修改图标: ' + col.icon"
              >{{ col.icon }}</span>
              <!-- Collection 名称 - 可编辑 -->
              <input
                v-if="editingCollectionId === col.id"
                v-model="editingCollectionName"
                class="nav-name-input"
                @blur="saveCollectionName(col.id)"
                @keydown.enter="saveCollectionName(col.id)"
                @keydown.esc="cancelEditCollection"
                @click.stop
                autofocus
              />
              <span v-else class="nav-name" @dblclick.stop="startEditCollection(col)">{{ col.name }}</span>
              <div class="nav-actions">
                <button class="btn-nav-action" @click.stop="startEditCollection(col)" title="重命名">✏️</button>
                <button
                  class="btn-delete-collection"
                  @click.stop="deleteCollection(col.id, col.name)"
                  title="删除Collection"
                >🗑️</button>
                <svg class="nav-arrow" :class="{ 'nav-arrow--open': expandedCollections.has(col.id) }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </div>

            <Transition name="folder-expand">
              <div v-if="expandedCollections.has(col.id)" class="nav-folders">
                <template v-for="folder in col.folders" :key="folder.id">
                  <div
                    class="nav-folder"
                    :class="{ 'nav-folder--active': activeFolderId === folder.id }"
                    @click="toggleFolder(folder.id)"
                  >
                    <svg
                      :style="`transform:rotate(${expandedFolders.has(folder.id)?90:0}deg);transition:transform .15s;flex-shrink:0;color:var(--text-mut)`"
                      width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
                      style="flex-shrink:0;color:var(--text-mut)"
                    ><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                    <span class="nav-folder-icon" @click.stop="selectFolder(folder.id)">📁</span>
                    <!-- 文件夹名称 - 可编辑 -->
                    <input
                      v-if="editingFolderId === folder.id"
                      v-model="editingFolderName"
                      class="nav-name-input"
                      @blur="saveFolderName(col.id, folder.id)"
                      @keydown.enter="saveFolderName(col.id, folder.id)"
                      @keydown.esc="cancelEditFolder"
                      @click.stop
                      autofocus
                    />
                    <span v-else class="nav-name" @click.stop="selectFolder(folder.id)" @dblclick.stop="startEditFolder(folder)">{{ folder.name }}</span>
                    <div class="nav-actions">
                      <button class="btn-nav-action" @click.stop="startEditFolder(folder)" title="重命名">✏️</button>
                      <button
                        class="btn-delete-folder"
                        @click.stop="deleteFolder(col.id, folder.id)"
                        title="删除文件夹"
                      >🗑️</button>
                    </div>
                  </div>

                  <div v-if="expandedFolders.has(folder.id)" class="nav-sops">
                    <div
                      v-for="sop in folder.sopItems"
                      :key="sop.id"
                      class="nav-sop"
                      :class="{ 'nav-sop--active': store.activeSopId === sop.id }"
                    >
                      <span class="nav-sop-icon" @click="selectSop(sop.id)">📋</span>
                      <!-- SOP 名称 - 可编辑 -->
                      <input
                        v-if="editingSopId === sop.id"
                        v-model="editingSopName"
                        class="nav-name-input"
                        @blur="saveSopName(sop.id)"
                        @keydown.enter="saveSopName(sop.id)"
                        @keydown.esc="cancelEditSop"
                        @click.stop
                        autofocus
                      />
                      <span v-else class="nav-name" @click="selectSop(sop.id)" @dblclick.stop="startEditSop(sop)">{{ sop.title }}</span>
                      <div class="nav-actions">
                        <button class="btn-nav-action" @click.stop="startEditSop(sop)" title="重命名">✏️</button>
                        <button
                          class="btn-delete-sop"
                          @click.stop="deleteSop(sop.id)"
                          title="删除SOP"
                        >🗑️</button>
                      </div>
                    </div>
                    <div v-if="folder.sopItems.length === 0" class="nav-empty-inline">
                      暂无SOP
                    </div>
                  </div>
                </template>
              </div>
            </Transition>
          </template>

          <!-- 空状态 -->
          <div v-if="store.data.collections.length === 0" class="nav-empty">
            <span>还没有 SOP</span>
            <button class="btn-link" @click="showNewCollection = true">新建Collection</button>
          </div>
        </nav>
      </aside>

      <!-- 主工作区 -->
      <main class="workspace">
        <!-- 空状态 -->
        <div v-if="!store.activeSop" class="workspace-empty">
          <div class="empty-icon">📋</div>
          <h3 class="empty-title">选择一个 SOP</h3>
          <p class="empty-desc">从左侧选择或创建一个新的 SOP</p>
        </div>

        <!-- SOP内容 -->
        <div v-else class="workspace-content">
          <!-- 顶部栏 -->
          <div class="workspace-header">
            <div class="sop-info">
              <h1 class="sop-title">{{ store.activeSop.title }}</h1>
              <div v-if="store.completionStats" class="sop-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: `${store.completionStats.pct}%` }"></div>
                </div>
                <span class="progress-text">{{ store.completionStats.done }}/{{ store.completionStats.total }} 已完成</span>
              </div>
            </div>
            <div class="sop-actions">
              <button class="btn-icon" @click="resetProgress" title="重置进度">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
              <button class="btn-secondary" @click="openMermaidEdit">
                📊 编辑流程图
              </button>
              <button class="btn-primary" @click="openAddCard">
                ➕ 新增卡片
              </button>
            </div>
          </div>

          <!-- Mermaid图 -->
          <div class="mermaid-panel">
            <MermaidPanel
              :source="store.activeSop.mermaidSource"
              @update:source="updateMermaidSource"
            />
          </div>

          <!-- 变量栏 -->
          <VariablesBar
            v-if="Object.keys(store.activeSop.variables).length"
            :variables="store.activeSop.variables"
            :sop-id="store.activeSop.id"
          />

          <!-- 动作卡片 -->
          <div class="cards-section">
            <div class="cards-header">
              <span class="cards-label">📋 动作步骤</span>
              <div class="cards-header-right">
                <span class="cards-count">{{ filteredCards.length }} {{ hideCompleted ? '可见' : '总' }}步骤</span>
                <button
                  class="btn-hide-completed"
                  :class="{ 'btn-hide-completed--active': hideCompleted }"
                  @click="hideCompleted = !hideCompleted"
                  :title="hideCompleted ? '显示已完成的步骤' : '隐藏已完成的步骤'"
                >
                  {{ hideCompleted ? '👁️ 显示完成' : '🙈 隐藏完成' }}
                </button>
              </div>
            </div>
            <div class="cards-list">
              <div
                v-for="(card, index) in filteredCards"
                :key="card.id"
                class="action-step-item"
                :class="{ 'action-step-item--completed': card.completed }"
                @click="toggleCardComplete(card.id)"
              >
                <div class="step-connector">
                  <div class="step-number">{{ index + 1 }}</div>
                  <div v-if="index < filteredCards.length - 1" class="step-line"></div>
                </div>
                <div class="step-content">
                  <div class="step-header">
                    <span class="step-title">{{ card.title }}</span>
                    <div class="step-actions" @click.stop>
                      <button class="step-btn" @click="toggleCardComplete(card.id)" :title="card.completed ? '标记未完成' : '标记完成'">
                        {{ card.completed ? '✅' : '⬜' }}
                      </button>
                      <button class="step-btn" @click="copyCode(card.code)" :title="'复制代码'">
                        📋
                      </button>
                      <button class="step-btn" @click="editCard(card)" title="编辑">✏️</button>
                      <button class="step-btn" @click="deleteCard(card.id)" title="删除">🗑️</button>
                    </div>
                  </div>
                  <div class="step-meta">
                    <span class="step-lang">{{ card.language }}</span>
                    <span v-if="card.completed" class="step-status step-status--done">已完成</span>
                    <span v-else class="step-status step-status--pending">待完成</span>
                  </div>
                  <!-- 代码块优先显示 -->
                  <div v-if="card.code" class="step-code">
                    <div class="code-header">
                      <span class="code-lang-badge">{{ card.language }}</span>
                      <button class="code-copy-btn" @click="copyCode(card.code)" title="复制代码">📋 复制</button>
                    </div>
                    <pre class="code-block" v-html="highlightCode(card.code, card.language)"></pre>
                  </div>
                  <!-- 备注提示在代码下方 -->
                  <div v-if="card.notes" class="step-notes">{{ card.notes }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 新建Collection Modal -->
    <NewCollectionModal v-if="showNewCollection" @close="handleNewCollectionClose" />

    <!-- 新建文件夹 Modal -->
    <Teleport to="body">
      <div v-if="showNewFolder" class="modal-backdrop" style="z-index:1100;" @click.self="showNewFolder = false">
        <div class="modal-box animate-scale-in" style="max-width:400px;">
          <div class="modal-header">
            <span style="font-size:20px;">📁</span>
            <span style="font-size:14px;font-weight:600;">新建文件夹</span>
            <div style="flex:1"/>
            <button class="btn-icon" @click="showNewFolder = false">✕</button>
          </div>
          <div style="padding:16px 18px;">
            <input
              v-model="newFolderName"
              class="sop-input"
              placeholder="文件夹名称"
              @keydown.enter="createFolder"
              @keydown.esc="showNewFolder = false"
            />
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showNewFolder = false">取消</button>
            <button class="btn-primary" :disabled="!newFolderName.trim()" @click="createFolder">创建</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 新建SOP Modal -->
    <Teleport to="body">
      <div v-if="showNewSop" class="modal-backdrop" style="z-index:1100;" @click.self="showNewSop = false">
        <div class="modal-box animate-scale-in" style="max-width:400px;">
          <div class="modal-header">
            <span style="font-size:20px;">📝</span>
            <span style="font-size:14px;font-weight:600;">新建 SOP</span>
            <div style="flex:1"/>
            <button class="btn-icon" @click="showNewSop = false">✕</button>
          </div>
          <div style="padding:16px 18px;">
            <input
              v-model="newSopTitle"
              class="sop-input"
              placeholder="SOP 标题"
              @keydown.enter="createSop"
              @keydown.esc="showNewSop = false"
            />
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showNewSop = false">取消</button>
            <button class="btn-primary" :disabled="!newSopTitle.trim()" @click="createSop">创建</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 快速创建 Modal -->
    <Teleport to="body">
      <div v-if="showQuickCreate" class="modal-backdrop" style="z-index:1100;" @click.self="showQuickCreate = false">
        <div class="modal-box animate-scale-in" style="max-width:480px;">
          <div class="modal-header">
            <span style="font-size:20px;">⚡</span>
            <span style="font-size:14px;font-weight:600;">快速创建 SOP</span>
            <div style="flex:1"/>
            <button class="btn-icon" @click="showQuickCreate = false">✕</button>
          </div>
          <div style="padding:16px 18px; display:flex; flex-direction:column; gap:12px;">
            <div>
              <label class="field-label">Collection 名称</label>
              <input
                v-model="quickCreate.collection"
                class="sop-input"
                placeholder="例如：工作流程"
              />
            </div>
            <div>
              <label class="field-label">文件夹 名称</label>
              <input
                v-model="quickCreate.folder"
                class="sop-input"
                placeholder="例如：项目A"
              />
            </div>
            <div>
              <label class="field-label">SOP 标题</label>
              <input
                v-model="quickCreate.sop"
                class="sop-input"
                placeholder="例如：每日站会流程"
                @keydown.enter="doQuickCreate"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showQuickCreate = false">取消</button>
            <button class="btn-primary" :disabled="!quickCreate.collection.trim() || !quickCreate.folder.trim() || !quickCreate.sop.trim()" @click="doQuickCreate">
              ⚡ 一键创建
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 编辑卡片 Modal -->
    <EditCardModal
      v-if="showAddCard"
      :card="editCardData"
      :sop-id="currentSopId"
      @close="closeCardModal"
    />

    <!-- 独立编辑流程图 Modal (更大的编辑区域) -->
    <Teleport to="body">
      <div v-if="showMermaidEdit" class="modal-backdrop" style="z-index:1100;" @click.self="showMermaidEdit = false">
        <div class="modal-box animate-scale-in" style="max-width:800px;">
          <div class="modal-header">
            <span style="font-size:20px;">📊</span>
            <span style="font-size:14px;font-weight:600;">编辑 SOP 流程图</span>
            <div style="flex:1"/>
            <button class="btn-icon" @click="showMermaidEdit = false">✕</button>
          </div>
          <div style="padding:16px 18px; display:flex; flex-direction:column; gap:12px;">
            <div style="font-size:12px;color:var(--text-muted);">
              💡 支持 graph LR/TD, flowchart LR/TD 等 Mermaid 语法
            </div>
            <textarea
              v-model="mermaidEditSource"
              class="sop-textarea"
              style="min-height:300px;"
              placeholder="graph LR
    A[开始] --> B[步骤1]
    B --> C[步骤2]
    C --> D[结束]"
              spellcheck="false"
            />
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showMermaidEdit = false">取消</button>
            <button class="btn-primary" @click="saveMermaidEdit">保存流程图</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Collection 图标选择 Modal -->
    <Teleport to="body">
      <div v-if="showIconPicker" class="modal-backdrop" style="z-index:1100;" @click.self="showIconPicker = false">
        <div class="modal-box animate-scale-in" style="max-width:400px;">
          <div class="modal-header">
            <span style="font-size:20px;">{{ editingIconValue }}</span>
            <span style="font-size:14px;font-weight:600;">选择图标</span>
            <div style="flex:1"/>
            <button class="btn-icon" @click="showIconPicker = false">✕</button>
          </div>
          <div style="padding:16px 18px; display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">
              <button
                v-for="g in EMOJI_GROUPS" :key="g.label"
                style="padding:2px 8px;border-radius:4px;border:1px solid var(--border-def);font-size:10px;cursor:pointer;transition:all .15s;"
                :style="activeIconGroup===g.label
                  ? 'background:#6366f120;border-color:#6366f1;color:#818cf8'
                  : 'background:var(--bg-raised);color:var(--text-mut)'"
                @click="activeIconGroup=g.label"
              >{{ g.label }}</button>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;max-height:200px;overflow-y:auto;padding:4px;">
              <button
                v-for="e in currentIconGroupEmojis" :key="e"
                style="width:40px;height:40px;border-radius:8px;border:2px solid var(--border-def);background:var(--bg-raised);font-size:20px;cursor:pointer;transition:all .15s;flex-shrink:0;"
                :style="editingIconValue===e ? 'border-color:#6366f1;background:var(--bg-active);transform:scale(1.15)' : ''"
                @click="editingIconValue = e"
              >{{ e }}</button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showIconPicker = false">取消</button>
            <button class="btn-primary" @click="saveCollectionIcon">保存图标</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useSopStore } from '@/stores/sop'
import type { ActionCard as AC } from '@/types'
import MermaidPanel from '@/components/MermaidPanel.vue'
import VariablesBar from '@/components/VariablesBar.vue'
import NewCollectionModal from '@/components/modals/NewCollectionModal.vue'
import EditCardModal from '@/components/modals/EditCardModal.vue'
import { EMOJI_GROUPS } from '@/composables/useEmojis'
import hljs from 'highlight.js'

const emit = defineEmits<{
  (e: 'open-skill', skillId: string | null): void
}>()

const store = useSopStore()

const searchQuery = ref('')
const showNewCollection = ref(false)
const showNewFolder = ref(false)
const showNewSop = ref(false)
const showQuickCreate = ref(false)
const showAddCard = ref(false)
const showMermaidEdit = ref(false)
const hideCompleted = ref(false)
const editCardData = ref<AC | null>(null)
const currentSopId = ref('')
const mermaidEditSource = ref('')

// 重命名状态
const editingCollectionId = ref<string | null>(null)
const editingCollectionName = ref('')
const editingFolderId = ref<string | null>(null)
const editingFolderName = ref('')
const editingSopId = ref<string | null>(null)
const editingSopName = ref('')

// Collection 图标编辑
const showIconPicker = ref(false)
const editingIconCollection = ref<any>(null)
const editingIconValue = ref('')
const activeIconGroup = ref('项目管理')

const currentIconGroupEmojis = computed(
  () => EMOJI_GROUPS.find(g => g.label === activeIconGroup.value)?.emojis ?? []
)

const filteredCards = computed(() => {
  if (!store.activeSop) return []
  const cards = store.activeSop.actionCards
  if (hideCompleted.value) {
    return cards.filter(c => !c.completed)
  }
  return cards
})

const newFolderName = ref('')
const newSopTitle = ref('')
const quickCreate = reactive({
  collection: '',
  folder: '',
  sop: ''
})

const expandedCollections = reactive(new Set<string>())
const expandedFolders = reactive(new Set<string>())
const activeCollectionId = ref('')
const activeFolderId = ref('')

// Watch for collections changes (e.g., after reset to defaults) to re-select
watch(() => store.data.collections.length, (newLen) => {
  if (newLen > 0 && !activeCollectionId.value) {
    const firstCol = store.data.collections[0]
    expandedCollections.add(firstCol.id)
    activeCollectionId.value = firstCol.id
    if (firstCol.folders.length > 0) {
      selectFolder(firstCol.folders[0].id)
    }
  }
})

// Hierarchy hint: shown when user hasn't created the full hierarchy yet
const hierarchyHint = computed(() => {
  if (store.data.collections.length === 0) {
    return 'SOP 需归类管理：请先新建一个 Collection'
  }
  if (activeCollectionId.value && !activeFolderId.value) {
    return '在 Collection 中新建文件夹后，才能创建 SOP'
  }
  return null
})

const hierarchyHintAction = computed(() => {
  if (store.data.collections.length === 0) {
    return { label: '➕ 新建Collection', fn: () => { showNewCollection.value = true } }
  }
  if (activeCollectionId.value && !activeFolderId.value) {
    return { label: '📁 新建文件夹', fn: () => { showNewFolder.value = true } }
  }
  return null
})

function toggleCollection(colId: string) {
  if (expandedCollections.has(colId)) {
    expandedCollections.delete(colId)
  } else {
    expandedCollections.add(colId)
  }
  activeCollectionId.value = colId
}

function selectFolder(folderId: string) {
  activeFolderId.value = folderId
  expandedFolders.add(folderId)
}

function toggleFolder(folderId: string) {
  if (expandedFolders.has(folderId)) {
    expandedFolders.delete(folderId)
  } else {
    expandedFolders.add(folderId)
  }
}

function selectSop(sopId: string) {
  store.activeSopId = sopId
}

function handleNewCollectionClose() {
  showNewCollection.value = false
  if (store.data.collections.length > 0) {
    const lastCol = store.data.collections[store.data.collections.length - 1]
    expandedCollections.add(lastCol.id)
    activeCollectionId.value = lastCol.id
    if (lastCol.folders.length > 0) {
      const firstFolder = lastCol.folders[0]
      expandedFolders.add(firstFolder.id)
      activeFolderId.value = firstFolder.id
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

function createFolder() {
  if (!newFolderName.value.trim() || !activeCollectionId.value) return
  const col = store.data.collections.find(c => c.id === activeCollectionId.value)
  if (!col) return

  const folder = store.createFolder(activeCollectionId.value, newFolderName.value.trim())
  if (!folder) return // 去重失败

  store.toast(`已创建文件夹: ${newFolderName.value}`)
  expandedFolders.add(folder.id)
  activeFolderId.value = folder.id

  newFolderName.value = ''
  showNewFolder.value = false
}

function createSop() {
  if (!newSopTitle.value.trim() || !activeFolderId.value) return

  const folder = store.data.collections
    .flatMap(c => c.folders)
    .find(f => f.id === activeFolderId.value)
  if (!folder) return

  store.createSopItem(activeFolderId.value, newSopTitle.value.trim())
  store.toast(`已创建 SOP: ${newSopTitle.value}`)

  if (folder.sopItems.length > 0) {
    const newSop = folder.sopItems[folder.sopItems.length - 1]
    selectSop(newSop.id)
  }

  newSopTitle.value = ''
  showNewSop.value = false
}

function doQuickCreate() {
  if (!quickCreate.collection.trim() || !quickCreate.folder.trim() || !quickCreate.sop.trim()) return

  store.createCollection(quickCreate.collection.trim())
  const colId = store.data.collections[store.data.collections.length - 1].id

  store.createFolder(colId, quickCreate.folder.trim())
  const col = store.data.collections.find(c => c.id === colId)
  const folder = col?.folders[col?.folders.length - 1]
  const folderId = folder?.id

  if (folderId) {
    store.createSopItem(folderId, quickCreate.sop.trim())

    expandedCollections.add(colId)
    expandedFolders.add(folderId)
    activeCollectionId.value = colId
    activeFolderId.value = folderId

    const folder = col?.folders.find(f => f.id === folderId)
    const sop = folder?.sopItems[folder?.sopItems?.length - 1]
    const sopId = sop?.id

    if (sopId) {
      selectSop(sopId)
    }

    store.toast(`已创建：${quickCreate.collection} > ${quickCreate.folder} > ${quickCreate.sop}`)
  }

  quickCreate.collection = ''
  quickCreate.folder = ''
  quickCreate.sop = ''
  showQuickCreate.value = false
}

function deleteFolder(colId: string, folderId: string) {
  if (!confirm('确定删除此文件夹吗？')) return
  store.deleteFolder(colId, folderId)
  if (activeFolderId.value === folderId) {
    activeFolderId.value = ''
  }
  store.toast('文件夹已删除')
}

// Collection 删除
function deleteCollection(colId: string, colName: string) {
  if (!confirm(`确定删除 Collection "${colName}" 及其所有内容吗？`)) return
  store.deleteCollection(colId)
  if (activeCollectionId.value === colId) {
    activeCollectionId.value = ''
  }
  store.toast('Collection 已删除')
}

// Collection 重命名
function startEditCollection(col: any) {
  editingCollectionId.value = col.id
  editingCollectionName.value = col.name
}

// Collection 图标编辑
function startEditCollectionIcon(col: any) {
  editingIconCollection.value = col
  editingIconValue.value = col.icon
  showIconPicker.value = true
}

function saveCollectionIcon() {
  if (editingIconCollection.value && editingIconValue.value) {
    store.updateCollection(editingIconCollection.value.id, { icon: editingIconValue.value })
    store.toast('图标已更新')
  }
  showIconPicker.value = false
  editingIconCollection.value = null
}

function saveCollectionName(colId: string) {
  if (editingCollectionName.value.trim()) {
    store.updateCollection(colId, { name: editingCollectionName.value.trim() })
    store.toast('已重命名')
  }
  cancelEditCollection()
}

function cancelEditCollection() {
  editingCollectionId.value = null
  editingCollectionName.value = ''
}

// Folder 重命名
function startEditFolder(folder: any) {
  editingFolderId.value = folder.id
  editingFolderName.value = folder.name
}

function saveFolderName(colId: string, folderId: string) {
  if (editingFolderName.value.trim()) {
    store.renameFolder(colId, folderId, editingFolderName.value.trim())
    store.toast('已重命名')
  }
  cancelEditFolder()
}

function cancelEditFolder() {
  editingFolderId.value = null
  editingFolderName.value = ''
}

// SOP 重命名
function startEditSop(sop: any) {
  editingSopId.value = sop.id
  editingSopName.value = sop.title
}

function saveSopName(sopId: string) {
  if (editingSopName.value.trim()) {
    store.updateSopItem(sopId, { title: editingSopName.value.trim() })
    store.toast('SOP 已重命名')
  }
  cancelEditSop()
}

function cancelEditSop() {
  editingSopId.value = null
  editingSopName.value = ''
}

function deleteSop(sopId: string) {
  if (!confirm('确定删除此 SOP 吗？')) return
  store.deleteSopItem(sopId)
  store.toast('SOP 已删除')
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

function openMermaidEdit() {
  if (!store.activeSop) return
  mermaidEditSource.value = store.activeSop.mermaidSource || ''
  showMermaidEdit.value = true
}

function saveMermaidEdit() {
  if (!store.activeSop) return
  store.updateSopItem(store.activeSop.id, { mermaidSource: mermaidEditSource.value })
  store.toast('流程图已保存')
  showMermaidEdit.value = false
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code)
    store.toast('代码已复制到剪贴板', 'success')
  } catch {
    store.toast('复制失败，请重试', 'error')
  }
}

function highlightCode(code: string, language: string): string {
  if (!code) return ''
  try {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(code, { language, ignoreIllegals: true }).value
    }
    return hljs.highlightAuto(code).value
  } catch {
    return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}

onMounted(() => {
  if (store.data.collections.length > 0) {
    const firstCol = store.data.collections[0]
    expandedCollections.add(firstCol.id)
    activeCollectionId.value = firstCol.id

    if (firstCol.folders.length > 0) {
      const firstFolder = firstCol.folders[0]
      expandedFolders.add(firstFolder.id)
      selectFolder(firstFolder.id)
      if (firstFolder.sopItems.length > 0) {
        selectSop(firstFolder.sopItems[0].id)
      }
    }
  }
})
</script>

<style scoped>
.sop-manager-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-void);
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--bg-base);
  border-bottom: 1px solid var(--border-sub);
  flex-shrink: 0;
}

.hierarchy-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 24px;
  background: linear-gradient(90deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.03) 100%);
  border-bottom: 1px solid rgba(99,102,241,0.15);
  font-size: 13px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.hint-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.hint-text {
  flex: 1;
  color: var(--text-secondary);
}

.hint-action {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid var(--primary);
  background: rgba(99,102,241,0.1);
  color: var(--primary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
  white-space: nowrap;
}

.hint-action:hover {
  background: rgba(99,102,241,0.2);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.view-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.view-subtitle {
  font-size: 13px;
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-header {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid var(--border-def);
  background: var(--bg-panel);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-header:hover {
  border-color: var(--primary);
  background: var(--bg-hover);
}

.btn-quick-create {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: var(--primary);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-quick-create:hover {
  background: var(--primary-hover);
}

.btn-primary {
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  background: var(--primary);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-def);
  background: var(--bg-panel);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-secondary:hover {
  border-color: var(--primary);
  background: var(--bg-hover);
}

.btn-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border-def);
  background: var(--bg-panel);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease;
}

.btn-icon:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.view-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: 260px;
  min-width: 220px;
  background: linear-gradient(180deg, var(--bg-base) 0%, var(--bg-raised) 100%);
  border-right: 1px solid var(--border-sub);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-box {
  padding: 16px;
  position: relative;
  border-bottom: 1px solid var(--border-sub);
  flex-shrink: 0;
}

.search-icon {
  position: absolute;
  left: 28px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border-radius: 8px;
  border: 1px solid var(--border-def);
  background: var(--bg-panel);
  color: var(--text-primary);
  font-size: 13px;
  box-sizing: border-box;
  transition: all 150ms ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
}

.nav-tree {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.nav-collection {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 150ms ease;
  margin-bottom: 4px;
  border: 1px solid transparent;
}

.nav-collection:hover {
  background: var(--bg-hover);
  transform: translateX(4px);
  border-color: var(--border-sub);
}

.nav-collection--active {
  background: var(--primary-glow);
  border: 1px solid var(--primary);
  box-shadow: 0 0 12px var(--primary-glow);
}

.nav-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.nav-icon--editable {
  cursor: pointer;
  transition: transform 150ms ease;
  padding: 2px;
  border-radius: 4px;
}

.nav-icon--editable:hover {
  transform: scale(1.3);
  background: var(--bg-hover);
}

.nav-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-arrow {
  color: var(--text-muted);
  transition: transform 200ms ease;
}

.nav-arrow--open {
  transform: rotate(90deg);
}

.nav-folders {
  padding-left: 16px;
}

.nav-folder {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 150ms ease;
  margin-bottom: 2px;
  border: 1px solid transparent;
}

.nav-folder:hover {
  background: var(--bg-hover);
  transform: translateX(4px);
}

.nav-folder--active {
  background: var(--bg-panel);
  border: 1px solid var(--primary);
  box-shadow: 0 0 8px var(--primary-glow);
}

.nav-sops {
  padding-left: 12px;
}

.nav-sop {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;
  font-size: 12px;
  color: var(--text-secondary);
}

.nav-sop:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-sop--active {
  background: var(--primary-glow);
  color: var(--primary);
}

.nav-folder-icon {
  font-size: 12px;
  margin-right: 4px;
}

/* 可编辑名称输入框 */
.nav-name-input {
  flex: 1;
  min-width: 0;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--primary);
  background: var(--bg-panel);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  outline: none;
}

.nav-name-input:focus {
  box-shadow: 0 0 0 2px var(--primary-glow);
}

/* 操作按钮容器 */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  opacity: 0;
  transition: opacity 150ms ease;
  padding-left: 8px;
}

.nav-collection:hover .nav-actions,
.nav-folder:hover .nav-actions,
.nav-sop:hover .nav-actions {
  opacity: 1;
}

.btn-nav-action {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease;
  color: var(--text-muted);
}

.btn-nav-action:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-sop-icon {
  font-size: 12px;
  margin-right: 4px;
}

.btn-delete-folder,
.btn-delete-sop,
.btn-delete-collection {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  opacity: 0;
  transition: all 150ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.nav-folder:hover .btn-delete-folder,
.nav-sop:hover .btn-delete-sop,
.nav-collection:hover .btn-delete-collection {
  opacity: 0.6;
  color: var(--danger);
}

.btn-delete-folder:hover,
.btn-delete-sop:hover,
.btn-delete-collection:hover {
  opacity: 1 !important;
  background: var(--danger);
  color: white;
}

.nav-empty-inline {
  padding: 8px 10px;
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}

.nav-empty {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  font-size: 12px;
  text-decoration: underline;
}

/* 工作区 */
.workspace {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  background: var(--bg-void);
}

.workspace-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  background: var(--bg-raised);
  border-radius: 16px;
  border: 2px dashed var(--border-def);
}

.empty-icon {
  font-size: 64px;
  opacity: 0.5;
  margin-bottom: 16px;
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
  margin: 0;
}

.workspace-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-sub);
}

.sop-info {
  flex: 1;
}

.sop-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.sop-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  width: 200px;
  height: 8px;
  background: var(--bg-panel);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--success);
  border-radius: 4px;
  transition: width 500ms ease;
}

.progress-text {
  font-size: 14px;
  color: var(--text-muted);
}

.sop-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mermaid-panel {
  margin-bottom: 24px;
  border-radius: 14px;
  overflow: hidden;
  background: var(--bg-raised);
  border: 1px solid var(--border-def);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.cards-section {
  margin-top: 24px;
}

.cards-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-sub);
}

.cards-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-hide-completed {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-def);
  background: var(--bg-panel);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-hide-completed:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.btn-hide-completed--active {
  border-color: var(--success);
  background: var(--success-glow);
  color: var(--success);
}

.btn-hide-completed--active:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.cards-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.cards-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  background: var(--primary-glow);
  padding: 4px 12px;
  border-radius: 12px;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.action-step-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--bg-raised);
  border-radius: 12px;
  border: 1px solid var(--border-def);
  transition: all 200ms ease;
  cursor: pointer;
}

.action-step-item:hover {
  border-color: var(--primary);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-step-item:active {
  transform: translateX(2px) scale(0.99);
}

.action-step-item--completed {
  opacity: 0.7;
  border-color: var(--success);
}

.action-step-item--completed .step-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.step-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.action-step-item--completed .step-number {
  background: var(--success);
}

.step-line {
  width: 2px;
  flex: 1;
  min-height: 40px;
  background: var(--border-def);
  border-radius: 1px;
}

.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.step-actions {
  display: flex;
  gap: 6px;
}

.step-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: var(--bg-panel);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 150ms ease;
}

.step-btn:hover {
  background: var(--bg-hover);
}

.step-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.step-lang {
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  background: var(--bg-panel);
  color: var(--text-muted);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid var(--border-sub);
}

.step-status {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
}

.step-status--done {
  background: var(--success-glow);
  color: var(--success);
}

.step-status--pending {
  background: var(--warning-glow);
  color: var(--warning);
}

.step-notes {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  padding: 8px 12px;
  background: var(--bg-panel);
  border-radius: 6px;
  border-left: 3px solid var(--primary);
}

.step-code {
  margin-top: 8px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-void);
  border: 1px solid var(--border-def);
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-sub);
}

.code-lang-badge {
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--primary);
  background: var(--primary-glow);
  padding: 2px 8px;
  border-radius: 4px;
}

.code-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 4px;
  border: 1px solid var(--border-def);
  background: var(--bg-raised);
  color: var(--text-secondary);
  font-size: 10px;
  cursor: pointer;
  transition: all 150ms ease;
}

.code-copy-btn:hover {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.code-block {
  margin: 0;
  padding: 12px 14px;
  font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Hack', Consolas, 'Courier New', monospace;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre;
  word-break: normal;
  overflow-x: auto;
  font-variant-ligatures: contextual;
  font-feature-settings: 'liga' 1, 'calt' 1;
}

.code-block code {
  font-family: inherit;
}

/* 过渡动画 */
.folder-expand-enter-active {
  animation: folder-expand-in 250ms cubic-bezier(0.22, 1, 0.36, 1);
}

.folder-expand-leave-active {
  animation: folder-expand-in 200ms cubic-bezier(0.4, 0, 1, 1) reverse;
}

@keyframes folder-expand-in {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}
</style>

<style>
/* ── highlight.js GitHub Dark theme ── */
.hljs { background: var(--bg-void); color: #adbac7; }
.hljs-doctag, .hljs-keyword, .hljs-meta .hljs-keyword,
.hljs-template-tag, .hljs-template-variable, .hljs-type,
.hljs-variable.language_ { color: #f47067; }
.hljs-title, .hljs-title.class_, .hljs-title.class_.inherited__,
.hljs-title.function_ { color: #dcbdfb; }
.hljs-attr, .hljs-attribute, .hljs-literal, .hljs-meta,
.hljs-number, .hljs-operator, .hljs-selector-attr,
.hljs-selector-class, .hljs-selector-id, .hljs-variable { color: #6cb6ff; }
.hljs-meta .hljs-string, .hljs-regexp, .hljs-string { color: #96d0ff; }
.hljs-built_in, .hljs-symbol, .hljs-string, .hljs-variable,
.hljs-template-variable, .hljs-link, .hljs-selector-attr,
.hljs-selector-pseudo { color: #96d0ff; }
.hljs-comment, .hljs-code, .hljs-formula { color: #768590; }
.hljs-name, .hljs-quote, .hljs-selector-tag,
.hljs-selector-id { color: #8ddb8c; }
.hljs-subst { color: #adbac7; }
.hljs-section { color: #6cb6ff; font-weight: bold; }
.hljs-keyword, .hljs-meta .hljs-keyword, .hljs-template-keyword { color: #f47067; }
.hljs-template-tag, .hljs-variable.language_ { color: #dcbdfb; }
.hljs-type, .hljs-class .hljs-title { color: #e0c5a9; }
.hljs-tag, .hljs-name, .hljs-attribute { color: #6cb6ff; }
.hljs-regexp, .hljs-attr { color: #96d0ff; }
.hljs-title.class_, .hljs-title.class_.inherited__ { color: #e0c5a9; }
.hljs-emphasis { font-style: italic; }
.hljs-strong { font-weight: bold; }
.hljs-addition { color: #96d0ff; background: #1c2e26; }
.hljs-deletion { color: #f47067; background: #3a1c1c; }
</style>