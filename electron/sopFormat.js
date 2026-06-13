const fs   = require('fs')
const path = require('path')

// ── Sanitize filename ──────────────────────────────────────────────────────
function safeName(str) {
  if (!str) return 'untitled'
  return str
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80) || 'untitled'
}

// ── Generate unique ID ──────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

// ── Export single SOP as Markdown ─────────────────────────────────────────
function sopToMarkdown(sop) {
  const lines = []

  lines.push(`# ${sop.title || 'Untitled SOP'}`)
  lines.push('')

  // Mermaid flow diagram
  if (sop.mermaidSource && sop.mermaidSource.trim()) {
    lines.push('## 流程图')
    lines.push('')
    lines.push('```mermaid')
    // Ensure the diagram has a valid type declaration
    let mermaid = sop.mermaidSource.trim()
    if (!mermaid.match(/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|mindMap|requirementDiagram)/)) {
      mermaid = 'graph LR\n' + mermaid
    }
    lines.push(mermaid)
    lines.push('```')
    lines.push('')
  }

  // Variables
  if (sop.variables && Object.keys(sop.variables).length > 0) {
    lines.push('## 变量')
    lines.push('')
    lines.push('| 变量名 | 值 |')
    lines.push('|--------|-----|')
    for (const [k, v] of Object.entries(sop.variables)) {
      lines.push(`| \`${k}\` | \`${v || '(未设置)'}\` |`)
    }
    lines.push('')
  }

  // Action cards
  if (sop.actionCards && sop.actionCards.length > 0) {
    lines.push('## 动作卡片')
    lines.push('')

    sop.actionCards.forEach((card, idx) => {
      const status = card.completed ? '✅' : '⬜'
      lines.push(`### ${status} Step ${idx + 1}：${card.title || '未命名'}`)
      lines.push('')

      // Code block
      if (card.code && card.code.trim()) {
        const lang = card.language || ''
        lines.push('```' + lang)
        lines.push(card.code.trim())
        lines.push('```')
        lines.push('')
      }

      // Notes
      if (card.notes && card.notes.trim()) {
        lines.push(`> 💡 **注意：** ${card.notes.trim()}`)
        lines.push('')
      }
    })
  } else {
    lines.push('## 动作卡片')
    lines.push('')
    lines.push('*（暂无动作卡片）*')
    lines.push('')
  }

  return lines.join('\n')
}

// ── Export Skill Tree as Markdown ─────────────────────────────────────────
function skillTreeToMarkdown(skillTrees) {
  const lines = []
  const now = new Date().toLocaleDateString('zh-CN')

  lines.push(`# 🎯 技能树`)
  lines.push('')
  lines.push(`> 导出时间：${now}`)
  lines.push(`> 共 ${skillTrees.length} 个技能`)
  lines.push('')
  lines.push('---')
  lines.push('')

  const statusMap = { 'locked': '🔒', 'in-progress': '🎯', 'unlocked': '✅' }
  const levelMap = { '0': 'Lv.0', '1': 'Lv.1', '2': 'Lv.2', '3': 'Lv.3', '4': 'Lv.4', 'MAX': 'Lv.MAX' }

  for (const skill of skillTrees) {
    const statusIcon = statusMap[skill.status] || '🔒'
    const level = skill.progress === 100 ? 'MAX' : skill.progress >= 80 ? '4' : skill.progress >= 60 ? '3' : skill.progress >= 40 ? '2' : skill.progress > 0 ? '1' : '0'

    lines.push(`## ${statusIcon} ${skill.icon} ${skill.title} [${levelMap[level]}] (${skill.progress}%)`)
    lines.push('')

    if (skill.description) {
      lines.push(`**${skill.description}**`)
      lines.push('')
    }

    lines.push(`进度：${skill.progress}% | 状态：${skill.status === 'in-progress' ? '进行中' : skill.status === 'unlocked' ? '已解锁' : '未解锁'}`)
    lines.push('')

    // Stages
    if (skill.stages && skill.stages.length > 0) {
      for (const stage of skill.stages) {
        const stageIcon = statusMap[stage.status] || '🔒'
        lines.push(`### ${stageIcon} 阶段 ${stage.order}: ${stage.name}`)
        lines.push('')

        lines.push(`| 项目 | 内容 |`)
        lines.push(`|------|------|`)

        // Target (split by newline)
        const targets = (stage.target || '').split('\n').filter(t => t.trim())
        if (targets.length > 0) {
          lines.push(`| **目标** | ${targets.map(t => `- ${t}`).join('\n> ')} |`)
        }

        lines.push(`| **奖励** | ${stage.reward || '-'} |`)
        lines.push(`| **状态** | ${stage.status === 'completed' ? '✅ 已完成' : stage.status === 'in-progress' ? '🎯 进行中' : '🔒 未解锁'} |`)

        if (stage.completedAt) {
          lines.push(`| **完成时间** | ${new Date(stage.completedAt).toLocaleDateString('zh-CN')} |`)
        }

        lines.push('')

        // Milestones
        if (stage.milestones && stage.milestones.length > 0) {
          lines.push(`| **里程碑** | |`)
          lines.push(`|------------|--- |`)
          for (const m of stage.milestones) {
            lines.push(`| ${m.completed ? '✅' : '⬜'} ${m.title} | ${m.completedAt ? new Date(m.completedAt).toLocaleDateString('zh-CN') : '进行中'} |`)
          }
          lines.push('')
        }
      }
    }

    lines.push('---')
    lines.push('')
  }

  lines.push('')
  lines.push('*由 Quest Log 应用导出*')

  return lines.join('\n')
}

// ── Import: Parse Skill Tree from Markdown ─────────────────────────────────
function parseSkillTreeFromMarkdown(markdown) {
  const skillBlocks = markdown.split(/^##\s+/m).filter(b => b.trim())
  if (skillBlocks.length === 0) return null

  const skills = []
  const now = Date.now()

  for (const block of skillBlocks) {
    const lines = block.trim().split('\n')
    if (lines.length === 0) continue

    // Parse title line: ## 🔒 📚 公开演讲能力 [Lv.1]
    const titleLine = lines[0]
    // Match: [icon] title [level] or [icon] title
    const titleMatch = titleLine.match(/^([^\[]+?)\s*(?:\[(Lv\.\d+|Lv\.MAX)\])?\s*$/)
    if (!titleMatch) continue

    let title = titleMatch[1].trim()
    const levelStr = titleMatch[2] || ''

    // Extract emoji from title
    let icon = '📚'
    const emojiMatch = title.match(/^([☀-➿\u{1F300}-\u{1F9FF}])/u)
    if (emojiMatch) {
      icon = emojiMatch[1]
      title = title.substring(emojiMatch[0].length).trim()
    }

    // Parse progress from level
    let progress = 0
    if (levelStr === 'Lv.MAX') progress = 100
    else if (levelStr === 'Lv.4') progress = 80
    else if (levelStr === 'Lv.3') progress = 60
    else if (levelStr === 'Lv.2') progress = 40
    else if (levelStr === 'Lv.1') progress = 20

    const skill = {
      id: uid(),
      title,
      icon,
      description: '',
      status: progress > 0 ? (progress === 100 ? 'unlocked' : 'in-progress') : 'locked',
      progress,
      stages: [],
      children: [],
      createdAt: now,
      updatedAt: now
    }

    // Parse description (bold text after title)
    const descMatch = block.match(/\*\*([^*]+)\*\*/)
    if (descMatch) {
      skill.description = descMatch[1].trim()
    }

    // Parse stages (### 🔒 阶段 1: 基础训练)
    const stageBlocks = block.split(/^###\s+/m).filter(b => b.trim())
    for (const stageBlock of stageBlocks) {
      const stageLines = stageBlock.trim().split('\n')
      if (stageLines.length === 0) continue

      const stageNameLine = stageLines[0]
      // Match: [icon] 阶段 N: name
      const stageMatch = stageNameLine.match(/^[^\[]*\s+阶段\s*\d+:\s*(.+)/)
      if (!stageMatch) continue

      const stageName = stageMatch[1].trim()
      const stageIcon = stageNameLine.match(/^[^\[]*/)[0].trim() || '🔒'

      // Determine status from icon
      let stageStatus = 'locked'
      if (stageIcon.includes('✅')) stageStatus = 'completed'
      else if (stageIcon.includes('🎯')) stageStatus = 'in-progress'

      const stage = {
        id: uid(),
        name: stageName,
        order: skill.stages.length + 1,
        target: '',
        evidence: [],
        reward: '',
        status: stageStatus,
        createdAt: now,
        milestones: []
      }

      // Parse table content
      for (const line of stageLines) {
        // Target
        const targetMatch = line.match(/\*\*目标\*\*[:：]?\s*(.+?)(?=\*\*|$)/i)
        if (targetMatch) {
          stage.target = targetMatch[1].replace(/^\s*>\s*/gm, '').replace(/^-\s*/gm, '\n').trim()
          stage.target = stage.target.replace(/^[\s>]+/gm, '').trim()
        }

        // Reward
        const rewardMatch = line.match(/\*\*奖励\*\*[:：]?\s*(.+?)(?=\*\*|$)/i)
        if (rewardMatch) {
          stage.reward = rewardMatch[1].trim()
        }

        // Completed at
        const completedMatch = line.match(/\*\*完成时间\*\*[:：]?\s*(.+?)(?=\*\*|$)/i)
        if (completedMatch) {
          const date = new Date(completedMatch[1].trim())
          if (!isNaN(date.getTime())) {
            stage.completedAt = date.getTime()
          }
        }

        // Milestones: | ✅ 里程碑1 | |
        const milestoneMatch = line.match(/\|\s*([✅⬜])\s+(.+?)\s*\|/)
        if (milestoneMatch) {
          stage.milestones = stage.milestones || []
          stage.milestones.push({
            id: uid(),
            title: milestoneMatch[2].trim(),
            completed: milestoneMatch[1] === '✅',
            completedAt: milestoneMatch[1] === '✅' ? now : undefined
          })
        }
      }

      if (stageStatus === 'completed' && !stage.completedAt) {
        stage.completedAt = now
      }

      skill.stages.push(stage)
    }

    skills.push(skill)
  }

  return skills.length > 0 ? skills : null
}

// ── Import: Parse SOP from Markdown ───────────────────────────────────────
function parseSopFromMarkdown(markdown) {
  const lines = markdown.split('\n')
  const sop = {
    id: uid(),
    title: '',
    mermaidSource: '',
    variables: {},
    actionCards: [],
    sortOrder: 0
  }

  let currentSection = 'title'
  let currentCard = null
  let inCodeBlock = false
  let codeBlockLang = ''
  let codeBlockContent = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Title
    if (line.startsWith('# ') && !sop.title) {
      sop.title = line.substring(2).trim()
      continue
    }

    // Section headers
    if (line.startsWith('## ')) {
      const section = line.substring(3).trim()
      if (section === '流程图') currentSection = 'mermaid'
      else if (section === '变量') currentSection = 'variables'
      else if (section === '动作卡片') currentSection = 'cards'
      continue
    }

    // Mermaid
    if (currentSection === 'mermaid') {
      if (line.startsWith('```mermaid')) {
        inCodeBlock = true
        codeBlockContent = []
        continue
      }
      if (inCodeBlock && line === '```') {
        sop.mermaidSource = codeBlockContent.join('\n')
        inCodeBlock = false
        continue
      }
      if (inCodeBlock) {
        codeBlockContent.push(line)
      }
      continue
    }

    // Variables table
    if (currentSection === 'variables') {
      const varMatch = line.match(/^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/)
      if (varMatch) {
        sop.variables[varMatch[1]] = varMatch[2] === '(未设置)' ? '' : varMatch[2]
      }
      continue
    }

    // Action cards
    if (currentSection === 'cards') {
      // Card title: ### ✅ Step 1：收集需求文档
      const cardMatch = line.match(/^###\s*([✅⬜])\s*Step\s*\d+[：:]\s*(.+)/)
      if (cardMatch) {
        if (currentCard) {
          sop.actionCards.push(currentCard)
        }
        currentCard = {
          id: uid(),
          title: cardMatch[2].trim(),
          language: 'bash',
          code: '',
          notes: '',
          completed: cardMatch[1] === '✅',
          sortOrder: sop.actionCards.length + 1
        }
        continue
      }

      // Code block
      if (line.startsWith('```') && currentCard) {
        if (inCodeBlock) {
          currentCard.code = codeBlockContent.join('\n')
          currentCard.language = codeBlockLang || 'bash'
          inCodeBlock = false
        } else {
          inCodeBlock = true
          codeBlockLang = line.substring(3).trim()
          codeBlockContent = []
        }
        continue
      }
      if (inCodeBlock) {
        codeBlockContent.push(line)
        continue
      }

      // Notes
      if (line.startsWith('> 💡 **注意：**') && currentCard) {
        currentCard.notes = line.replace('> 💡 **注意：**', '').trim()
        continue
      }
    }
  }

  // Push last card
  if (currentCard) {
    sop.actionCards.push(currentCard)
  }

  return sop.title ? sop : null
}

// ── Export entire AppData as folder structure ──────────────────────────────
function exportToFolder(data, destDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })

  // 1. Write full manifest (for lossless re-import)
  fs.writeFileSync(
    path.join(destDir, 'manifest.json'),
    JSON.stringify(data, null, 2),
    'utf-8'
  )

  // 2. Write README index
  const indexLines = [
    '# Quest Log — 任务日志',
    '',
    `> 导出时间：${new Date().toLocaleString('zh-CN')}`,
    `> 导出目录：${destDir}`,
    '',
    '## 目录结构',
    '',
  ]

  // Skill Trees section
  const skillTrees = data.skillTrees || []
  if (skillTrees.length > 0) {
    indexLines.push('### 🎯 技能树')
    indexLines.push('')
    indexLines.push(`- [技能树总览](./skill-tree.md) — ${skillTrees.length} 个技能`)
    indexLines.push('')
  }

  // SOP Collections section
  const collections = data.collections || []
  for (const col of collections) {
    indexLines.push(`### ${col.icon || '📁'} ${col.name}`)
    indexLines.push('')
    const folders = col.folders || []
    for (const folder of folders) {
      indexLines.push(`**${folder.name}**`)
      indexLines.push('')
      const items = folder.sopItems || []
      for (const sop of items) {
        const colDir    = safeName(col.name)
        const folderDir = safeName(folder.name)
        const sopFile   = safeName(sop.title) + '.md'
        const cardCount = (sop.actionCards || []).length
        const doneCount = (sop.actionCards || []).filter(c => c.completed).length
        indexLines.push(`- [${sop.title}](./${colDir}/${folderDir}/${sopFile}) — ${doneCount}/${cardCount} 步骤完成`)
      }
      indexLines.push('')
    }
  }

  indexLines.push('---')
  indexLines.push('')
  indexLines.push('使用 `manifest.json` 可在 Quest Log 应用中完整还原所有数据。')

  fs.writeFileSync(
    path.join(destDir, 'README.md'),
    indexLines.join('\n'),
    'utf-8'
  )

  // 3. Write Skill Tree as Markdown
  if (skillTrees.length > 0) {
    fs.writeFileSync(
      path.join(destDir, 'skill-tree.md'),
      skillTreeToMarkdown(skillTrees),
      'utf-8'
    )
  }

  // 4. Write each SOP as individual .md file
  for (const col of collections) {
    for (const folder of col.folders || []) {
      const dir = path.join(destDir, safeName(col.name), safeName(folder.name))
      fs.mkdirSync(dir, { recursive: true })
      for (const sop of folder.sopItems || []) {
        const filePath = path.join(dir, safeName(sop.title) + '.md')
        fs.writeFileSync(filePath, sopToMarkdown(sop), 'utf-8')
      }
    }
  }
}

module.exports = {
  exportToFolder,
  sopToMarkdown,
  skillTreeToMarkdown,
  parseSkillTreeFromMarkdown,
  parseSopFromMarkdown,
  safeName
}