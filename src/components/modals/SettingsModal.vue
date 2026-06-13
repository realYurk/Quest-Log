<template>
  <Teleport to="body">
    <div
      style="position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.6);"
      @mousedown.self="$emit('close')"
    >
      <div
        class="animate-scale-in"
        style="background:var(--bg-panel);border:1px solid var(--border-def);border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.6);width:100%;max-width:520px;display:flex;flex-direction:column;max-height:90vh;overflow:hidden;"
      >
        <!-- Header -->
        <div style="display:flex;align-items:center;gap:8px;padding:14px 18px;border-bottom:1px solid var(--border-sub);flex-shrink:0;">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#6366f1" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <span style="font-size:13px;font-weight:600;color:var(--text-pri);">设置</span>
          <div style="flex:1"/>
          <button @click="$emit('close')" style="background:none;border:none;color:var(--text-mut);cursor:pointer;font-size:16px;line-height:1;padding:2px 5px;">✕</button>
        </div>

        <div style="overflow-y:auto;flex:1;">

          <!-- Theme -->
          <div class="srow">
            <div><div class="stitle">外观主题</div><div class="sdesc">深色 / 浅色模式</div></div>
            <div style="display:flex;gap:6px;">
              <button v-for="t in [{v:'dark',l:'🌙 深色'},{v:'light',l:'☀️ 浅色'}]" :key="t.v"
                style="padding:5px 12px;border-radius:6px;border:1px solid var(--border-def);font-size:12px;cursor:pointer;transition:all .15s;"
                :style="store.theme===t.v ? 'background:#6366f120;border-color:#6366f1;color:#818cf8' : 'background:var(--bg-raised);color:var(--text-sec)'"
                @click="store.theme!==t.v && store.toggleTheme()"
              >{{ t.l }}</button>
            </div>
          </div>

          <!-- Data location -->
          <div class="srow">
            <div style="flex:1;min-width:0;">
              <div class="stitle">数据文件位置</div>
              <!-- Use localDataPath for immediate UI update -->
              <div style="font-size:11px;font-family:monospace;color:var(--text-sec);margin-top:3px;word-break:break-all;">
                {{ localDataPath || store.dataPath || '~/.questlog/data.json' }}
              </div>
            </div>
            <div style="display:flex;gap:5px;flex-shrink:0;margin-left:12px;">
              <button
                style="padding:5px 10px;border-radius:6px;border:1px solid var(--border-def);background:var(--bg-raised);color:var(--text-sec);font-size:11px;cursor:pointer;white-space:nowrap;"
                :style="changingDir ? 'opacity:.5' : ''"
                @mouseenter="e=>!changingDir && ((e.currentTarget as HTMLElement).style.background='var(--bg-hover)')"
                @mouseleave="e=>(e.currentTarget as HTMLElement).style.background='var(--bg-raised)'"
                @click="showDirPicker=true"
                :disabled="changingDir"
              >{{ changingDir ? '更改中…' : '📂 更改位置' }}</button>
              <button
                style="padding:5px 10px;border-radius:6px;border:1px solid var(--border-def);background:var(--bg-raised);color:var(--text-sec);font-size:11px;cursor:pointer;white-space:nowrap;"
                @mouseenter="e=>(e.currentTarget as HTMLElement).style.background='var(--bg-hover)'"
                @mouseleave="e=>(e.currentTarget as HTMLElement).style.background='var(--bg-raised)'"
                @click="openDir"
              >打开</button>
            </div>
          </div>

          <!-- Export all -->
          <div class="srow">
            <div>
              <div class="stitle">导出全部数据</div>
              <div class="sdesc">选择文件夹，导出 Markdown 结构 + manifest.json</div>
            </div>
            <button
              style="padding:5px 12px;border-radius:6px;border:1px solid var(--border-def);background:var(--bg-raised);color:var(--text-sec);font-size:11px;cursor:pointer;white-space:nowrap;"
              :style="exporting ? 'opacity:.5' : ''"
              @mouseenter="e=>!exporting && ((e.currentTarget as HTMLElement).style.background='var(--bg-hover)')"
              @mouseleave="e=>(e.currentTarget as HTMLElement).style.background='var(--bg-raised)'"
              @click="showExportPicker=true"
              :disabled="exporting"
            >{{ exporting ? '导出中…' : '⬇ 导出' }}</button>
          </div>

          <!-- Export Skill Tree as Markdown -->
          <div class="srow">
            <div>
              <div class="stitle">导出技能图谱</div>
              <div class="sdesc">将技能图谱导出为 Markdown 格式文档</div>
            </div>
            <button
              style="padding:5px 12px;border-radius:6px;border:1px solid var(--success);background:var(--success-glow);color:var(--success);font-size:11px;cursor:pointer;white-space:nowrap;"
              :style="exportingSkillTree ? 'opacity:.5' : ''"
              @mouseenter="e=>!exportingSkillTree && ((e.currentTarget as HTMLElement).style.background='rgba(34,197,94,0.2)')"
              @mouseleave="e=>(e.currentTarget as HTMLElement).style.background='var(--success-glow)'"
              @click="showExportSkillTreePicker=true"
              :disabled="exportingSkillTree"
            >{{ exportingSkillTree ? '导出中…' : '📋 导出 MD' }}</button>
          </div>

          <!-- Import -->
          <div class="srow">
            <div>
              <div class="stitle">导入数据</div>
              <div class="sdesc">从备份 JSON 文件导入（覆盖当前全部数据）</div>
            </div>
            <button
              style="padding:5px 12px;border-radius:6px;border:1px solid var(--border-def);background:var(--bg-raised);color:var(--text-sec);font-size:11px;cursor:pointer;white-space:nowrap;"
              @mouseenter="e=>(e.currentTarget as HTMLElement).style.background='var(--bg-hover)'"
              @mouseleave="e=>(e.currentTarget as HTMLElement).style.background='var(--bg-raised)'"
              @click="showImportPicker=true"
            >⬆ 导入</button>
          </div>

          <!-- Reset to default examples -->
          <div class="srow">
            <div>
              <div class="stitle">重置示例数据</div>
              <div class="sdesc">恢复新的默认技能树和 SOP 示例（会覆盖当前数据）</div>
            </div>
            <button
              style="padding:5px 12px;border-radius:6px;border:1px solid var(--warning);background:var(--warning-glow);color:var(--warning);font-size:11px;cursor:pointer;white-space:nowrap;"
              @mouseenter="e=>(e.currentTarget as HTMLElement).style.background='rgba(245,158,11,0.2)'"
              @mouseleave="e=>(e.currentTarget as HTMLElement).style.background='var(--warning-glow)'"
              @click="resetToDefaults"
            >🔄 重置</button>
          </div>

          <!-- Clear all data -->
          <div class="srow" style="border-bottom:none;">
            <div>
              <div class="stitle" style="color:var(--danger);">🗑️ 清空所有数据</div>
              <div class="sdesc">一键清除等级、经验、成就、技能树和所有 SOP 数据</div>
            </div>
            <button
              style="padding:5px 12px;border-radius:6px;border:1px solid var(--danger);background:rgba(239,68,68,0.1);color:var(--danger);font-size:11px;cursor:pointer;white-space:nowrap;"
              @mouseenter="e=>(e.currentTarget as HTMLElement).style.background='rgba(239,68,68,0.2)'"
              @mouseleave="e=>(e.currentTarget as HTMLElement).style.background='rgba(239,68,68,0.1)'"
              @click="openClearConfirm"
            >⚠️ 清空</button>
          </div>

          <!-- Export structure info -->
          <div style="margin:4px 18px;padding:10px 12px;background:var(--bg-raised);border:1px solid var(--border-sub);border-radius:6px;">
            <div style="font-size:11px;font-weight:600;color:var(--text-sec);margin-bottom:6px;">导出目录结构（项目介绍文档）</div>
            <pre style="margin:0;font-size:10px;color:var(--text-mut);font-family:monospace;line-height:1.9;">你选择的目录/
└── quest-log-export/
    ├── manifest.json    ← 完整数据（用于重新导入还原）
    ├── README.md        ← 项目介绍与 SOP 索引（含导出时间/目录）
    └── Personal_Walkthrough/
        └── Auth_Module/
            └── JWT登录.md  ← 含流程图 + 所有 Step 代码</pre>
          </div>

          <!-- Stats -->
          <div class="srow" style="border-bottom:none;">
            <div class="stitle">数据统计</div>
            <div style="font-size:12px;color:var(--text-sec);text-align:right;line-height:2.2;">
              <div>Collections <b style="color:var(--text-pri);">{{ store.data.collections.length }}</b></div>
              <div>SOP 总数 <b style="color:var(--text-pri);">{{ totalSops }}</b></div>
              <div>卡片总数 <b style="color:var(--text-pri);">{{ totalCards }}</b></div>
            </div>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:8px;padding:12px 18px;border-top:1px solid var(--border-sub);flex-shrink:0;">
          <span style="font-size:11px;color:var(--text-mut);">Quest Log v1.0.0</span>
          <div style="flex:1"/>
          <button
            style="padding:6px 20px;border-radius:6px;background:#6366f1;color:#fff;border:1px solid #6366f1;font-size:12px;font-weight:500;cursor:pointer;"
            @click="$emit('close')"
          >关闭</button>
        </div>
      </div>
    </div>

    <!-- File pickers -->
    <FilePickerModal  v-if="showDirPicker"    title="选择新的数据存储目录"   @confirm="changeDataDir" @cancel="showDirPicker=false" />
    <FilePickerModal  v-if="showExportPicker" title="选择导出到哪个文件夹"   @confirm="doExport"     @cancel="showExportPicker=false" />
    <FilePickerModal  v-if="showExportSkillTreePicker" title="选择导出技能树到哪个文件夹" @confirm="doExportSkillTree" @cancel="showExportSkillTreePicker=false" />
    <ImportFilePicker v-if="showImportPicker"                                @confirm="doImport"     @cancel="showImportPicker=false" />

    <!-- Clear all data confirmation -->
    <Teleport to="body">
      <div v-if="showClearConfirm" class="modal-backdrop" style="z-index:1200;" @click.self="showClearConfirm = false">
        <div class="modal-box animate-scale-in" style="max-width:420px;">
          <div class="modal-header">
            <span style="font-size:20px;">⚠️</span>
            <span style="font-size:14px;font-weight:600;">确认清空所有数据</span>
            <div style="flex:1"/>
            <button class="btn-icon" @click="showClearConfirm = false">✕</button>
          </div>
          <div style="padding:16px 18px;display:flex;flex-direction:column;gap:14px;">
            <div style="font-size:13px;color:var(--danger);background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:10px 12px;line-height:1.6;">
              ⚠️ 此操作将永久删除所有数据：<br/>
              · 等级、经验值、成就<br/>
              · 技能树与所有阶段<br/>
              · 所有 SOP、Collection、文件夹<br/>
              此操作 <b>不可撤销</b>，请谨慎操作！
            </div>

            <div>
              <div class="field-label" style="margin-bottom:6px;">请复制下方随机字符到输入框确认：</div>
              <div style="display:flex;gap:8px;align-items:center;">
                <code style="flex:1;font-family:monospace;font-size:16px;font-weight:700;color:var(--danger);background:var(--bg-raised);padding:8px 12px;border-radius:6px;border:1px solid var(--border-def);letter-spacing:2px;user-select=all;">{{ clearConfirmCode }}</code>
                <button
                  class="btn-icon"
                  style="width:36px;height:36px;border-radius:6px;"
                  title="复制"
                  @click="copyClearCode"
                >📋</button>
              </div>
              <div v-if="clearCopied" style="font-size:11px;color:var(--success);margin-top:4px;">✓ 已复制</div>
            </div>

            <div>
              <div class="field-label" style="margin-bottom:6px;">粘贴随机字符确认：</div>
              <input
                v-model="clearConfirmInput"
                class="sop-input"
                :placeholder="'粘贴上方字符'"
                style="font-family:monospace;letter-spacing:1px;"
                @keydown.enter="doClearAllData"
              />
              <div v-if="clearConfirmInput && clearConfirmInput !== clearConfirmCode" style="font-size:11px;color:var(--danger);margin-top:4px;">❌ 字符不匹配，请重新输入</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showClearConfirm = false">取消</button>
            <button
              class="btn-danger"
              :disabled="clearConfirmInput !== clearConfirmCode"
              @click="doClearAllData"
            >🗑️ 确认清空</button>
          </div>
        </div>
      </div>
    </Teleport>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSopStore } from '@/stores/sop'
import { useSkillTreeStore } from '@/stores/skillTree'
import { useGamificationStore } from '@/stores/gamification'
import FilePickerModal  from '@/components/modals/FilePickerModal.vue'
import ImportFilePicker from '@/components/modals/ImportFilePicker.vue'

const emit  = defineEmits<{ close: [] }>()
const store = useSopStore()
const skillStore = useSkillTreeStore()
const gamStore = useGamificationStore()

const showDirPicker    = ref(false)
const showExportPicker = ref(false)
const showImportPicker = ref(false)
const showExportSkillTreePicker = ref(false)
const exporting        = ref(false)
const exportingSkillTree = ref(false)
const changingDir      = ref(false)

// Clear all data
const showClearConfirm = ref(false)
const clearConfirmCode = ref('')
const clearConfirmInput = ref('')
const clearCopied = ref(false)

function generateClearCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

async function copyClearCode() {
  try {
    await navigator.clipboard.writeText(clearConfirmCode.value)
    clearCopied.value = true
    setTimeout(() => { clearCopied.value = false }, 2000)
  } catch {
    // fallback: select the text
  }
}

function doClearAllData() {
  if (clearConfirmInput.value !== clearConfirmCode.value) return

  // Clear SOP data - reset to empty collections
  store.data.collections = []
  store.activeSopId = null

  // Clear skill trees
  skillStore.skillTrees = []

  // Clear gamification profile (level, XP, achievements)
  gamStore.profile.level = 1
  gamStore.profile.totalXp = 0
  gamStore.profile.dailyXp = 0
  gamStore.profile.achievements = []
  gamStore.profile.streakDays = 1
  gamStore.profile.lastActiveDate = new Date().toISOString().split('T')[0]

  // Save
  store.saveData()
  skillStore.saveData()

  showClearConfirm.value = false
  clearConfirmInput.value = ''
  clearConfirmCode.value = ''
  store.toast('✓ 所有数据已清空')
  emit('close')
}

// Open clear confirm dialog
function openClearConfirm() {
  clearConfirmCode.value = generateClearCode()
  clearConfirmInput.value = ''
  clearCopied.value = false
  showClearConfirm.value = true
}

// Override the click handler to use the new function
function handleClearClick() {
  openClearConfirm()
}

// Local copy for immediate UI feedback (don't wait for store reactivity)
const localDataPath = ref('')

const totalSops  = computed(() => store.data.collections.reduce((n,c)=>n+c.folders.reduce((m,f)=>m+f.sopItems.length,0),0))
const totalCards = computed(() => store.data.collections.reduce((n,c)=>n+c.folders.reduce((m,f)=>m+f.sopItems.reduce((k,s)=>k+s.actionCards.length,0),0),0))

function openDir() { window.electronAPI?.openDataDir() }

async function changeDataDir(dir: string) {
  showDirPicker.value = false
  if (!window.electronAPI || !dir) return
  changingDir.value = true
  try {
    const result = await window.electronAPI.setDataDir(dir, JSON.parse(JSON.stringify(store.data)))
    if (result && result.ok) {
      // Update local display immediately
      localDataPath.value = result.path || dir
      // Also update store
      store.setDataPath(result.path || dir)
      store.toast(`✓ 数据目录已更改为: ${dir}`)
    } else {
      store.toast('❌ 更改失败: ' + (result?.msg || '未知错误'), 'error')
    }
  } catch (e) {
    store.toast('❌ 更改失败: ' + String(e), 'error')
  } finally {
    changingDir.value = false
  }
}

async function doExport(dir: string) {
  showExportPicker.value = false
  if (!window.electronAPI || !dir) return
  exporting.value = true
  store.toast('正在导出，请稍候…', 'info')
  try {
    const result = await window.electronAPI.exportData(JSON.parse(JSON.stringify(store.data)), dir)
    if (result && result.status === 'ok') {
      store.toast(`✓ 导出成功！已保存到: ${result.path}`)
      emit('close')
    } else {
      store.toast('❌ 导出失败: ' + (result?.message || '未知错误'), 'error')
    }
  } catch (e) {
    store.toast('❌ 导出出错: ' + String(e), 'error')
  } finally {
    exporting.value = false
  }
}

async function doImport(filePath: string) {
  showImportPicker.value = false
  if (!window.electronAPI || !filePath) return
  store.toast('正在导入…', 'info')
  try {
    const result = await window.electronAPI.importData(filePath)

    // Empty result
    if (!result) {
      store.toast('❌ 导入失败，文件格式有误', 'error')
      return
    }

    // Type guard for error result
    if ('type' in result && result.type === 'error') {
      store.toast('❌ 导入失败：' + (result.message || '未知错误'), 'error')
      return
    }

    // Type guard for skillTree import
    if ('type' in result && result.type === 'skillTree') {
      skillStore.loadSkillTrees(result.data)
      store.toast(`✓ 技能树导入成功！共 ${result.data.length} 个技能`)
      emit('close')
      return
    }

    // Type guard for SOP import
    if ('type' in result && result.type === 'sop') {
      store.toast(`✓ SOP「${result.data.title}」解析成功`)
      emit('close')
      return
    }

    // Full manifest.json import (LifeAppData)
    if ('collections' in result || 'skillTrees' in result) {
      store.data = result
      await store.saveData()
      store.toast('✓ 数据导入成功！')
      emit('close')
      return
    }

    store.toast('❌ 导入失败，文件格式有误', 'error')
  } catch (e) {
    store.toast('❌ 导入出错: ' + String(e), 'error')
  }
}

// 重置为默认示例数据
function resetToDefaults() {
  if (!confirm('确定要重置为新的示例数据吗？这将覆盖当前的技能树和 SOP 数据。')) return
  try {
    // 重置技能树
    skillStore.resetToDefault()
    // 重置 SOP 数据
    store.resetCollections()
    store.toast('✓ 已重置为新的默认示例数据！')
    emit('close')
  } catch (e) {
    store.toast('❌ 重置失败: ' + String(e), 'error')
  }
}

// 导出技能树为 Markdown
function generateSkillTreeMarkdown(): string {
  const skills = skillStore.skillTrees
  const now = new Date().toLocaleDateString('zh-CN')

  let md = `# 🎯 技能图谱 📋

> 导出时间：${now}
> 共 ${skills.length} 个技能，${skillStore.completedStagesCount} 个阶段已完成

---

`

  for (const skill of skills) {
    const statusIcon = skill.status === 'unlocked' ? '✅' : skill.status === 'in-progress' ? '🎯' : '🔒'
    const levelMap: Record<string, string> = { '0': 'Lv.0', '1': 'Lv.1', '2': 'Lv.2', '3': 'Lv.3', '4': 'Lv.4', 'MAX': 'Lv.MAX' }
    const level = skill.progress === 100 ? 'MAX' : skill.progress >= 80 ? '4' : skill.progress >= 60 ? '3' : skill.progress >= 40 ? '2' : skill.progress > 0 ? '1' : '0'

    md += `## ${statusIcon} ${skill.icon} ${skill.title} ${levelMap[level]}

**${skill.description}**

进度：${skill.progress}% | 状态：${skill.status === 'in-progress' ? '进行中' : skill.status === 'unlocked' ? '已解锁' : '未解锁'}

### 阶段详情

`

    for (const stage of skill.stages) {
      const stageIcon = stage.status === 'completed' ? '✅' : stage.status === 'in-progress' ? '🎯' : '🔒'
      const targets = stage.target.split('\n').filter(t => t.trim())

      md += `#### ${stageIcon} 阶段 ${stage.order}: ${stage.name}

| 项目 | 内容 |
|------|------|
| **目标** | ${targets.map(t => `- ${t}`).join('\n> ')} |
| **奖励** | ${stage.reward} |
| **状态** | ${stage.status === 'completed' ? '✅ 已完成' : stage.status === 'in-progress' ? '🎯 进行中' : '🔒 未解锁'} |
`

      if (stage.completedAt) {
        md += `| **完成时间** | ${new Date(stage.completedAt).toLocaleDateString('zh-CN')} |`
      }

      if (stage.milestones && stage.milestones.length > 0) {
        md += `
| **里程碑** | |
|------------|--- |
`
        for (const m of stage.milestones) {
          md += `| ${m.completed ? '✅' : '⬜'} ${m.title} | ${m.completedAt ? new Date(m.completedAt).toLocaleDateString('zh-CN') : '进行中'} |
`
        }
      }

      md += `
`
    }

    md += `---

`
  }

  md += `

---

*由 Quest Log 应用导出*
`

  return md
}

async function doExportSkillTree(dir: string) {
  showExportSkillTreePicker.value = false
  if (!window.electronAPI || !dir) return
  exportingSkillTree.value = true
  store.toast('正在导出技能树…', 'info')
  try {
    const markdown = generateSkillTreeMarkdown()
    const fileName = `skill-tree-${Date.now()}.md`

    // 创建一个临时的 SopItem 用于导出 Markdown
    const exportSop = {
      id: 'export',
      title: '技能图谱导出',
      mermaidSource: markdown,
      variables: {},
      actionCards: [],
      sortOrder: 0,
      linkedStageId: undefined
    }

    const savePath = await window.electronAPI.fsJoin(dir, fileName)
    const result = await window.electronAPI.exportSop(exportSop, savePath)
    if (result && result.status === 'ok') {
      store.toast(`✓ 技能树已导出为 Markdown！`)
    } else {
      store.toast('❌ 导出失败，请重试', 'error')
    }
  } catch (e) {
    store.toast('❌ 导出出错: ' + String(e), 'error')
  } finally {
    exportingSkillTree.value = false
  }
}
</script>

<style scoped>
.srow  { display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 18px;border-bottom:1px solid var(--border-sub); }
.stitle { font-size:13px;color:var(--text-pri);font-weight:500; }
.sdesc  { font-size:11px;color:var(--text-mut);margin-top:2px; }

.btn-icon {
  width:32px;height:32px;border-radius:8px;border:1px solid var(--border-def);
  background:var(--bg-raised);color:var(--text-muted);cursor:pointer;
  display:flex;align-items:center;justify-content:center;transition:all .15s;font-size:13px;
}
.btn-icon:hover { background:var(--bg-hover);color:var(--text-pri); }

.btn-ghost {
  padding:8px 16px;border-radius:8px;border:1px solid var(--border-def);
  background:transparent;color:var(--text-sec);font-size:13px;cursor:pointer;transition:all .15s;
}
.btn-ghost:hover { background:var(--bg-hover); }

.btn-danger {
  padding:8px 16px;border-radius:8px;border:1px solid var(--danger);
  background:rgba(239,68,68,0.15);color:var(--danger);font-size:13px;font-weight:500;
  cursor:pointer;transition:all .15s;
}
.btn-danger:hover:not(:disabled) { background:rgba(239,68,68,0.25); }
.btn-danger:disabled { opacity:0.4;cursor:not-allowed; }

.sop-input {
  width:100%;padding:8px 12px;border-radius:8px;border:1px solid var(--border-def);
  background:var(--bg-panel);color:var(--text-pri);font-size:13px;box-sizing:border-box;outline:none;
  transition:all .15s;
}
.sop-input:focus { border-color:var(--primary);box-shadow:0 0 0 2px var(--primary-glow); }

.field-label { font-size:12px;color:var(--text-sec);font-weight:500; }

.modal-backdrop {
  position:fixed;inset:0;z-index:1100;display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,.6);padding:24px;
}
.modal-box {
  background:var(--bg-panel);border:1px solid var(--border-def);border-radius:12px;
  box-shadow:0 20px 60px rgba(0,0,0,.6);width:100%;display:flex;flex-direction:column;
}
.modal-header {
  display:flex;align-items:center;gap:8px;padding:14px 18px;border-bottom:1px solid var(--border-sub);
}
.modal-footer {
  display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:12px 18px;
  border-top:1px solid var(--border-sub);
}
</style>
