// ==================== 技能树模块 ====================

export type SkillStatus = 'locked' | 'in-progress' | 'unlocked'
export type StageStatus = 'locked' | 'in-progress' | 'completed'
export type EvidenceType = 'image' | 'video' | 'document' | 'link'

export interface Evidence {
  id: string
  type: EvidenceType
  url: string
  name: string
  size?: number
  thumbnail?: string
  uploadedAt: number
}

export interface Milestone {
  id: string
  title: string
  completed: boolean
  completedAt?: number
}

export interface Stage {
  id: string
  name: string
  order: number
  target: string
  evidence: Evidence[]
  sopId?: string
  reward: string
  achievementId?: string  // 关联的成就ID（可选）
  status: StageStatus
  completedAt?: number
  createdAt: number
  milestones?: Milestone[]
}

export interface SkillNode {
  id: string
  title: string
  icon: string
  description: string
  status: SkillStatus
  progress: number
  stages: Stage[]
  children: SkillNode[]
  parentId?: string
  position?: { x: number; y: number }
  createdAt: number
  updatedAt: number
}

// ==================== SOP模块 ====================

export interface ActionCard {
  id: string; title: string; language: string
  code: string; notes: string; completed: boolean; sortOrder: number; pinned?: boolean
}
export interface SopItem {
  id: string; title: string; mermaidSource: string
  variables: Record<string, string>; actionCards: ActionCard[]
  sortOrder: number; pinnedCardIds?: string[]
  linkedStageId?: string
}
export interface Folder   { id: string; name: string; sortOrder: number; sopItems: SopItem[] }
export interface Collection { id: string; name: string; icon: string; color: string; sortOrder: number; folders: Folder[] }

// ==================== 游戏化模块 ====================

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  rarity: AchievementRarity
  unlockedAt?: number
}

export interface DailyChallenge {
  id: string
  title: string
  description: string
  difficulty: ChallengeDifficulty
  xpReward: number
  completed: boolean
  completedAt?: number
  stageId?: string
  skillId?: string
}

export interface PlayerProfile {
  level: number
  totalXp: number
  dailyXp: number
  createdAt: number
  lastActiveDate: string  // YYYY-MM-DD
  streakDays: number
  achievements: Achievement[]
  dailyChallenges: DailyChallenge[]
  lastChallengeDate: string  // YYYY-MM-DD
  sopLinkCount: number  // 累计绑定SOP到技能阶段的数量
}

// ==================== 应用数据 ====================

export interface AppSettings {
  theme: 'dark' | 'light'
  skillTreeLayout: 'horizontal' | 'vertical'
  showWelcome: boolean
  autoBackup: boolean
}

export interface LifeAppData {
  version: string
  skillTrees: SkillNode[]
  collections: Collection[]
  settings: AppSettings
  lastModified: number
  profile?: PlayerProfile
  expandedSkillIds?: string[]
  autoCollapseCompleted?: boolean
}

// 向后兼容
export interface AppData  { collections: Collection[] }
export interface Toast    { id: string; message: string; type: 'success'|'error'|'info' | 'achievement' }
export interface ExportResult { status: 'ok'|'cancelled'|'error'; path?: string; message?: string }
export interface FsEntry  { name: string; isDir: boolean; path: string }
export interface DialogResult { filePath?: string; filePaths?: string[] }
export interface DialogOptions { title?: string; defaultPath?: string; filters?: { name: string; extensions: string[] }[]; properties?: string[] }

// 导入结果类型
export type ImportResult = LifeAppData | { type: 'error'; message: string } | { type: 'skillTree'; data: SkillNode[] } | { type: 'sop'; data: SopItem } | null

export interface ElectronAPI {
  loadData:    () => Promise<LifeAppData>
  saveData:    (d: LifeAppData) => Promise<boolean>
  getDataPath: () => Promise<string>
  openDataDir: () => Promise<void>
  setDataDir:  (dir: string, data: LifeAppData) => Promise<{ ok: boolean; path?: string; msg?: string } | null>
  exportData:  (data: LifeAppData, destDir: string) => Promise<ExportResult>
  exportSop:   (sop: SopItem, savePath: string) => Promise<ExportResult>
  exportMarkdown: (content: string, savePath: string) => Promise<ExportResult>
  importData:  (filePath: string) => Promise<ImportResult>
  fsReaddir:   (p: string) => Promise<FsEntry[]>
  fsRoots:     () => Promise<FsEntry[]>
  fsHomedir:   () => Promise<string>
  fsPathsep:   () => Promise<string>
  fsJoin:      (...parts: string[]) => Promise<string>
  fsReadFile:  (p: string) => Promise<string | null>
  showSaveDialog: (opts: DialogOptions) => Promise<DialogResult | null>
  showOpenDialog: (opts: DialogOptions) => Promise<DialogResult | null>
  minimize:    () => Promise<void>
  maximize:    () => Promise<void>
  close:       () => Promise<void>
  onExternalChange:             (cb: (data: LifeAppData) => void) => void
  removeExternalChangeListener: () => void
}
declare global { interface Window { electronAPI?: ElectronAPI } }
