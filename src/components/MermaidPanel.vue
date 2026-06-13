<template>
  <div style="margin:14px 16px 6px;border:1px solid var(--border-def);border-radius:8px;overflow:hidden;background:var(--bg-raised);">

    <!-- Toolbar -->
    <div style="display:flex;align-items:center;gap:8px;padding:7px 12px;border-bottom:1px solid var(--border-sub);background:var(--bg-panel);">
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#6366f1" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
      <span style="font-size:11px;color:var(--text-mut);font-weight:500;flex:1;">流程图</span>

      <!-- Edit mode toggle -->
      <button
        class="btn-icon"
        style="width:24px;height:24px;font-size:12px;"
        :style="isEditing ? 'background:#6366f120;color:#818cf8;' : ''"
        @click="toggleEdit"
        :title="isEditing ? '取消编辑' : '编辑流程图'"
      >
        ✏️
      </button>

      <!-- Direction (only show when not editing) -->
      <div v-if="!isEditing" style="display:flex;background:var(--bg-raised);border-radius:5px;padding:2px;gap:1px;border:1px solid var(--border-sub);">
        <button v-for="d in ['LR','TD']" :key="d"
          style="padding:2px 8px;border-radius:4px;border:none;font-size:10px;cursor:pointer;transition:all .15s;"
          :style="dir===d ? 'background:#6366f120;color:#818cf8;' : 'background:transparent;color:var(--text-mut);'"
          @click="setDir(d)">{{ d }}</button>
      </div>

      <!-- Zoom (only show when not editing) -->
      <div v-if="!isEditing" style="display:flex;align-items:center;gap:2px;">
        <button class="btn-icon" style="width:22px;height:22px;font-size:14px;" @click="zoom(-0.15)">−</button>
        <span style="font-size:10px;color:var(--text-mut);width:38px;text-align:center;font-family:monospace;">{{ Math.round(scale*100) }}%</span>
        <button class="btn-icon" style="width:22px;height:22px;font-size:14px;" @click="zoom(0.15)">+</button>
        <button class="btn-icon" style="width:22px;height:22px;font-size:11px;" @click="reset" title="重置视图">⊙</button>
      </div>
    </div>

    <!-- Edit mode: Mermaid source editor -->
    <div v-if="isEditing" style="padding:12px;">
      <div style="margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:11px;color:var(--text-mut);">编辑 Mermaid 代码</span>
        <div style="display:flex;gap:6px;">
          <button
            style="padding:4px 12px;border-radius:5px;border:1px solid var(--border-def);background:transparent;color:var(--text-sec);font-size:11px;cursor:pointer;"
            @click="cancelEdit"
          >取消</button>
          <button
            style="padding:4px 12px;border-radius:5px;border:none;background:#6366f1;color:#fff;font-size:11px;cursor:pointer;"
            @click="saveEdit"
          >保存</button>
        </div>
      </div>
      <textarea
        v-model="editSource"
        style="width:100%;min-height:160px;background:var(--bg-raised);border:1px solid var(--border-def);border-radius:6px;color:var(--text-pri);font-family:'JetBrains Mono','Fira Code',monospace;font-size:12px;padding:10px 12px;outline:none;resize:vertical;line-height:1.6;"
        placeholder="graph LR
    A[开始] --> B[步骤1]
    B --> C[步骤2]
    C --> D[结束]"
        spellcheck="false"
      />
      <div style="margin-top:6px;font-size:10px;color:var(--text-muted);">
        💡 支持 graph LR/TD, flowchart LR/TD 等语法
      </div>
    </div>

    <!-- View mode: Diagram container -->
    <div
      v-else
      ref="container"
      style="overflow:hidden;cursor:grab;position:relative;"
      :style="`height:${height}px`"
      @wheel.prevent="onWheel"
      @mousedown="startPan"
    >
      <div v-if="isLoading" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
        <div style="width:20px;height:20px;border:2px solid #6366f130;border-top-color:#6366f1;border-radius:50%;animation:spin .7s linear infinite;" />
      </div>
      <div v-else-if="error" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;">
        <pre style="font-size:11px;color:#ef4444;background:var(--bg-panel);padding:10px;border-radius:6px;max-width:100%;overflow:auto;">{{ error }}</pre>
      </div>
      <div
        v-else
        style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;"
        :style="`transform:translate(${px}px,${py}px) scale(${scale});transform-origin:center;${panning?'':'transition:transform .12s ease'}`"
        class="mermaid-wrap"
        v-html="svg"
        @click="handleNodeClick"
      />
    </div>

    <!-- Resize handle -->
    <div
      style="height:5px;background:var(--bg-panel);cursor:ns-resize;border-top:1px solid var(--border-sub);transition:background .15s;"
      @mouseenter="e=>(e.currentTarget as HTMLElement).style.background='#6366f130'"
      @mouseleave="e=>(e.currentTarget as HTMLElement).style.background='var(--bg-panel)'"
      @mousedown="startResize"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSopStore } from '@/stores/sop'
import { useMermaid } from '@/composables/useMermaid'

const props = defineProps<{
  source: string
}>()

const emit = defineEmits<{
  (e: 'update:source', value: string): void
  (e: 'nodeClick', id: string): void
}>()

const store = useSopStore()

const dir   = ref<'LR'|'TD'>('LR')
const scale = ref(0.95)
const px    = ref(0)
const py    = ref(0)
const panning = ref(false)
const height  = ref(340)
const isEditing = ref(false)
const editSource = ref('')

const src = computed(() => {
  if (!props.source) return ''
  return props.source.replace(/^(graph|flowchart)\s+(LR|RL|TB|BT|TD)/m, `$1 ${dir.value}`)
})

const theme = computed(() => store.theme)
const { svgHtml: svg, error, isLoading, handleClick: mClick } = useMermaid(src, theme, id => emit('nodeClick', id))

function setDir(d: string) { dir.value = d as 'LR'|'TD'; reset() }
function zoom(d: number)   { scale.value = Math.max(0.25, Math.min(4, scale.value + d)) }
function reset()            { scale.value = 0.95; px.value = 0; py.value = 0 }

function toggleEdit() {
  if (isEditing.value) {
    // Already editing, just toggle off
    isEditing.value = false
  } else {
    // Enter edit mode with current source
    editSource.value = props.source || 'graph LR\n    A[开始] --> B[结束]'
    isEditing.value = true
  }
}

function cancelEdit() {
  isEditing.value = false
  editSource.value = ''
}

function saveEdit() {
  emit('update:source', editSource.value)
  isEditing.value = false
  store.toast('流程图已更新')
}

function onWheel(e: WheelEvent) {
  if (e.ctrlKey || e.metaKey) zoom(e.deltaY < 0 ? 0.1 : -0.1)
  else { px.value -= e.deltaX * 0.5; py.value -= e.deltaY * 0.5 }
}

function startPan(e: MouseEvent) {
  if ((e.target as Element).closest('[data-node-id],[class*="label"]')) return
  panning.value = true
  const sx = e.clientX - px.value, sy = e.clientY - py.value
  const onMove = (ev: MouseEvent) => { px.value = ev.clientX - sx; py.value = ev.clientY - sy }
  const onUp   = () => { panning.value = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function startResize(e: MouseEvent) {
  const sy = e.clientY, sh = height.value
  const onMove = (ev: MouseEvent) => { height.value = Math.max(160, Math.min(700, sh + ev.clientY - sy)) }
  const onUp   = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function handleNodeClick(e: MouseEvent) { mClick(e) }

watch(() => props.source, reset)
</script>

<style>
@keyframes spin { to { transform: rotate(360deg); } }
.mermaid-wrap svg { max-width:100%; height:auto; }
</style>