import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PlayerProfile, Achievement, DailyChallenge, AchievementRarity, ChallengeDifficulty } from '@/types'

function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36) }

// ── Level thresholds ─────────────────────────────────────────────────────
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500]

function getLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

function getXpForNextLevel(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  return LEVEL_THRESHOLDS[level]
}

function getXpProgress(level: number, totalXp: number): number {
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  if (level >= LEVEL_THRESHOLDS.length) return 100
  return Math.round(((totalXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
}

// ── Achievement definitions ──────────────────────────────────────────────
const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedAt'>[] = [
  // ── 卡片成就 ──────────────────────────────────────────────────────────────
  { id: 'first_card', title: '初次探险', description: '完成第一个动作卡片', icon: '🔰', rarity: 'common' },
  { id: 'cards_5', title: '崭露头角', description: '完成 5 个动作卡片', icon: '🐣', rarity: 'common' },
  { id: 'cards_10', title: '小试牛刀', description: '完成 10 个动作卡片', icon: '🐥', rarity: 'common' },
  { id: 'cards_25', title: '渐入佳境', description: '完成 25 个动作卡片', icon: '🦅', rarity: 'rare' },
  { id: 'cards_50', title: '日积月累', description: '完成 50 个动作卡片', icon: '🦚', rarity: 'rare' },
  { id: 'cards_100', title: '熟能生巧', description: '完成 100 个动作卡片', icon: '🐓', rarity: 'epic' },
  { id: 'cards_250', title: '动作专家', description: '完成 250 个动作卡片', icon: '🦅', rarity: 'epic' },
  { id: 'cards_500', title: '动作大师', description: '完成 500 个动作卡片', icon: '🐔', rarity: 'legendary' },
  { id: 'cards_1000', title: '传奇执行者', description: '完成 1000 个动作卡片', icon: '🏆', rarity: 'legendary' },

  // ── 阶段成就 ──────────────────────────────────────────────────────────────
  { id: 'first_stage', title: '阶段突破', description: '完成第一个阶段', icon: '🎖️', rarity: 'common' },
  { id: 'stages_3', title: '三阶连跳', description: '完成 3 个阶段', icon: '🧗', rarity: 'rare' },
  { id: 'stages_10', title: '阶段猎手', description: '完成 10 个阶段', icon: '⚔️', rarity: 'rare' },
  { id: 'stages_25', title: '阶段征服者', description: '完成 25 个阶段', icon: '🗡️', rarity: 'epic' },
  { id: 'stages_50', title: '阶段王者', description: '完成 50 个阶段', icon: '👑', rarity: 'legendary' },

  // ── 技能成就 ──────────────────────────────────────────────────────────────
  { id: 'first_skill', title: '技能觉醒', description: '解锁第一个技能', icon: '⭐', rarity: 'epic' },
  { id: 'skill_unlocked', title: '技能解锁', description: '将一个技能推进到已解锁状态', icon: '🔓', rarity: 'epic' },
  { id: 'skills_3', title: '三星技能师', description: '拥有 3 个技能', icon: '🌟', rarity: 'common' },
  { id: 'skills_5', title: '技能收藏家', description: '拥有 5 个技能', icon: '🏅', rarity: 'rare' },
  { id: 'skills_10', title: '收藏大师', description: '拥有 10 个技能', icon: '🏆', rarity: 'epic' },
  { id: 'skills_20', title: '技能王者', description: '拥有 20 个技能', icon: '👑', rarity: 'legendary' },

  // ── SOP 成就 ──────────────────────────────────────────────────────────────
  { id: 'first_sop', title: '首战告捷', description: '完成第一个 SOP', icon: '🏅', rarity: 'rare' },
  { id: 'sops_3', title: ' SOP 三连', description: '完成 3 个 SOP', icon: '📋', rarity: 'rare' },
  { id: 'sops_10', title: ' SOP 高手', description: '完成 10 个 SOP', icon: '📑', rarity: 'epic' },

  // ── SOP 绑定成就（仅与技能阶段绑定SOP相关，与其他条件无关）────────────
  { id: 'sop_link_1', title: '小试牛刀·初阶', description: '将 SOP 绑定到技能阶段', icon: '📝', rarity: 'common' },
  { id: 'sop_link_2', title: '小试牛刀·二阶', description: '绑定 SOP 到 2 个技能阶段', icon: '📋', rarity: 'common' },
  { id: 'sop_link_3', title: '小试牛刀·三阶', description: '绑定 SOP 到 3 个技能阶段', icon: '📒', rarity: 'rare' },
  { id: 'sop_link_5', title: '小试牛刀·五阶', description: '绑定 SOP 到 5 个技能阶段', icon: '📚', rarity: 'rare' },
  { id: 'sop_link_10', title: '小试牛刀·大成', description: '绑定 SOP 到 10 个技能阶段', icon: '📖', rarity: 'epic' },

  // ── 连续成就 ──────────────────────────────────────────────────────────────
  { id: 'streak_3', title: '三日之约', description: '连续活跃 3 天', icon: '💪', rarity: 'rare' },
  { id: 'streak_7', title: '一周坚持', description: '连续活跃 7 天', icon: '🔥', rarity: 'epic' },
  { id: 'streak_14', title: '两周坚持', description: '连续活跃 14 天', icon: '⚡', rarity: 'epic' },
  { id: 'streak_30', title: '月度挑战', description: '连续活跃 30 天', icon: '🌟', rarity: 'legendary' },
  { id: 'streak_60', title: '双月度坚持', description: '连续活跃 60 天', icon: '🌙', rarity: 'legendary' },
  { id: 'streak_100', title: '百日战士', description: '连续活跃 100 天', icon: '☀️', rarity: 'legendary' },

  // ── Collection 成就 ──────────────────────────────────────────────────────
  { id: 'first_collection', title: '收藏初建', description: '创建第一个 Collection', icon: '📦', rarity: 'common' },
  { id: 'collections_3', title: '收藏三分', description: '拥有 3 个 Collection', icon: '📭', rarity: 'rare' },

  // ── 特殊成就 ──────────────────────────────────────────────────────────────
  { id: 'perfect_run', title: '完美主义', description: '一个 SOP 所有卡片一次都不跳过', icon: '💎', rarity: 'rare' },
  { id: 'early_bird', title: '早起鸟', description: '早上 8 点前完成第一个任务', icon: '🌅', rarity: 'epic' },
  { id: 'night_owl', title: '夜猫子', description: '晚上 12 点后完成第一个任务', icon: '🌙', rarity: 'epic' },
  { id: 'speed_runner', title: '闪电侠', description: '一天内完成 10 个卡片', icon: '⚡', rarity: 'epic' },
  { id: 'comeback_kid', title: '卷土重来', description: '重新激活一个已锁定的技能', icon: '♻️', rarity: 'rare' },
]

// ── Create default profile ───────────────────────────────────────────────
function createDefaultProfile(): PlayerProfile {
  const now = Date.now()
  const today = new Date().toISOString().split('T')[0]
  return {
    level: 1,
    totalXp: 0,
    dailyXp: 0,
    createdAt: now,
    lastActiveDate: today,
    streakDays: 1,
    achievements: [],
    dailyChallenges: [],
    lastChallengeDate: '',
    sopLinkCount: 0
  }
}

// ── Generate daily challenges from in-progress stages ─────────────────────
function generateDailyChallenges(inProgressStages: { skillTitle: string; stageName: string; stageId: string; skillId: string }[]): DailyChallenge[] {
  if (inProgressStages.length === 0) {
    // Fallback if no in-progress stages
    return [{
      id: uid(),
      title: '开始你的第一个技能',
      description: '创建新技能并开始训练',
      difficulty: 'easy',
      xpReward: 20,
      completed: false
    }]
  }

  // Shuffle and pick random stages
  const shuffled = [...inProgressStages].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, Math.min(3, shuffled.length))

  return selected.map(stage => ({
    id: uid(),
    title: stage.stageName,
    description: `推进技能「${stage.skillTitle}」的阶段`,
    difficulty: 'medium',
    xpReward: 35,
    completed: false,
    // Store reference to the stage for completion checking
    stageId: stage.stageId,
    skillId: stage.skillId
  }))
}

// ── Get today string ─────────────────────────────────────────────────────
function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export const useGamificationStore = defineStore('gamification', () => {
  const profile = ref<PlayerProfile>(createDefaultProfile())
  const showLevelUpModal = ref(false)
  const showAchievementModal = ref(false)
  const newAchievement = ref<Achievement | null>(null)
  const newLevel = ref(1)
  const toasts = ref<{ id: string; message: string; type: string }[]>([])

  // ── Computed ─────────────────────────────────────────────────────────────
  const level = computed(() => getLevel(profile.value.totalXp))
  const xpForNextLevel = computed(() => getXpForNextLevel(level.value))
  const xpProgress = computed(() => getXpProgress(level.value, profile.value.totalXp))
  const xpInCurrentLevel = computed(() => profile.value.totalXp - (LEVEL_THRESHOLDS[level.value - 1] || 0))

  const unlockedAchievements = computed(() => profile.value.achievements.filter(a => !!a.unlockedAt))
  const lockedAchievements = computed(() => {
    const unlockedIds = new Set(profile.value.achievements.filter(a => a.unlockedAt).map(a => a.id))
    return ACHIEVEMENT_DEFINITIONS.filter(d => !unlockedIds.has(d.id)).map(d => ({ ...d, unlockedAt: undefined }))
  })
  const allAchievements = computed(() => [...unlockedAchievements.value, ...lockedAchievements.value])

  const completedChallenges = computed(() => profile.value.dailyChallenges.filter(c => c.completed))
  const todayChallenges = computed(() => profile.value.dailyChallenges)

  // ── XP operations ────────────────────────────────────────────────────────
  function addXp(amount: number, reason: string = '') {
    profile.value.totalXp += amount
    profile.value.dailyXp += amount

    const newLvl = getLevel(profile.value.totalXp)
    if (newLvl > level.value) {
      newLevel.value = newLvl
      showLevelUpModal.value = true
      profile.value.level = newLvl
    }

    if (reason) {
      toast(`+${amount} XP: ${reason}`, 'success')
    }
  }

  // ── Achievement operations ────────────────────────────────────────────────
  function checkAndUnlockAchievement(achievementId: string, opts?: { skipModal?: boolean }) {
    const skipModal = opts?.skipModal ?? false
    const existing = profile.value.achievements.find(a => a.id === achievementId)

    // 已弹窗展示过的，直接跳过（不弹窗也不更新任何状态）
    if (existing?.shownAt) {
      return false
    }

    // 已解锁但未弹窗展示过的（仅设置 shownAt，不重复弹窗）
    if (existing?.unlockedAt) {
      existing.shownAt = Date.now()
      return false
    }

    const def = ACHIEVEMENT_DEFINITIONS.find(d => d.id === achievementId)
    if (!def) return false

    const achievement: Achievement = {
      ...def,
      unlockedAt: Date.now(),
      shownAt: Date.now()
    }

    profile.value.achievements.push(achievement)
    newAchievement.value = achievement
    if (!skipModal) {
      showAchievementModal.value = true
      toast(`🏅 成就解锁: ${def.title}`, 'achievement')
    }

    return true
  }

  // 手动解锁指定成就（用于阶段奖励关联）
  function unlockAchievement(achievementId: string) {
    checkAndUnlockAchievement(achievementId)
  }

  function checkAchievements(stats: {
    totalCardsCompleted?: number
    totalSopsCompleted?: number
    totalStagesCompleted?: number
    totalSkillsCompleted?: number
    skillCount?: number
    collectionCount?: number
    streakDays?: number
    skillsUnlocked?: number
    sopLinkCount?: number
  }, opts?: { skipModal?: boolean }) {
    const skipModal = opts?.skipModal ?? false
    const cards = stats.totalCardsCompleted ?? 0
    const sops = stats.totalSopsCompleted ?? 0
    const stages = stats.totalStagesCompleted ?? 0
    const skills = stats.totalSkillsCompleted ?? 0
    const count = stats.skillCount ?? 0
    const collections = stats.collectionCount ?? 0
    const streak = stats.streakDays ?? 0
    const unlocked = stats.skillsUnlocked ?? 0
    const sopLinks = stats.sopLinkCount ?? 0

    // 卡片成就
    if (cards >= 1) checkAndUnlockAchievement('first_card', { skipModal })
    if (cards >= 5) checkAndUnlockAchievement('cards_5', { skipModal })
    if (cards >= 10) checkAndUnlockAchievement('cards_10', { skipModal })
    if (cards >= 25) checkAndUnlockAchievement('cards_25', { skipModal })
    if (cards >= 50) checkAndUnlockAchievement('cards_50', { skipModal })
    if (cards >= 100) checkAndUnlockAchievement('cards_100', { skipModal })
    if (cards >= 250) checkAndUnlockAchievement('cards_250', { skipModal })
    if (cards >= 500) checkAndUnlockAchievement('cards_500', { skipModal })
    if (cards >= 1000) checkAndUnlockAchievement('cards_1000', { skipModal })

    // 阶段成就
    if (stages >= 1) checkAndUnlockAchievement('first_stage', { skipModal })
    if (stages >= 3) checkAndUnlockAchievement('stages_3', { skipModal })
    if (stages >= 10) checkAndUnlockAchievement('stages_10', { skipModal })
    if (stages >= 25) checkAndUnlockAchievement('stages_25', { skipModal })
    if (stages >= 50) checkAndUnlockAchievement('stages_50', { skipModal })

    // 技能成就
    if (skills >= 1) checkAndUnlockAchievement('first_skill', { skipModal })
    if (unlocked >= 1) checkAndUnlockAchievement('skill_unlocked', { skipModal })
    if (count >= 3) checkAndUnlockAchievement('skills_3', { skipModal })
    if (count >= 5) checkAndUnlockAchievement('skills_5', { skipModal })
    if (count >= 10) checkAndUnlockAchievement('skills_10', { skipModal })
    if (count >= 20) checkAndUnlockAchievement('skills_20', { skipModal })

    // SOP 成就
    if (sops >= 1) checkAndUnlockAchievement('first_sop', { skipModal })
    if (sops >= 3) checkAndUnlockAchievement('sops_3', { skipModal })
    if (sops >= 10) checkAndUnlockAchievement('sops_10', { skipModal })

    // SOP 绑定成就（仅与绑定SOP到技能阶段的数量相关）
    if (sopLinks >= 1) checkAndUnlockAchievement('sop_link_1', { skipModal })
    if (sopLinks >= 2) checkAndUnlockAchievement('sop_link_2', { skipModal })
    if (sopLinks >= 3) checkAndUnlockAchievement('sop_link_3', { skipModal })
    if (sopLinks >= 5) checkAndUnlockAchievement('sop_link_5', { skipModal })
    if (sopLinks >= 10) checkAndUnlockAchievement('sop_link_10', { skipModal })

    // 连续成就
    if (streak >= 3) checkAndUnlockAchievement('streak_3', { skipModal })
    if (streak >= 7) checkAndUnlockAchievement('streak_7', { skipModal })
    if (streak >= 14) checkAndUnlockAchievement('streak_14', { skipModal })
    if (streak >= 30) checkAndUnlockAchievement('streak_30', { skipModal })
    if (streak >= 60) checkAndUnlockAchievement('streak_60', { skipModal })
    if (streak >= 100) checkAndUnlockAchievement('streak_100', { skipModal })

    // Collection 成就
    if (collections >= 1) checkAndUnlockAchievement('first_collection', { skipModal })
    if (collections >= 3) checkAndUnlockAchievement('collections_3', { skipModal })

    // 时间类成就
    const hour = new Date().getHours()
    if (hour < 8) checkAndUnlockAchievement('early_bird', { skipModal })
    if (hour >= 0 && hour < 5) checkAndUnlockAchievement('night_owl', { skipModal })

    // 闪电侠：一天内完成10个卡片（通过单次调用 cards >= 10 配合「今天」判断）
    if (cards >= 10) checkAndUnlockAchievement('speed_runner', { skipModal })
  }

  // ── Daily challenges operations ────────────────────────────────────────────
  function checkDailyChallenges(inProgressStages: { skillTitle: string; stageName: string; stageId: string; skillId: string }[] = []) {
    const today = getToday()
    if (profile.value.lastChallengeDate !== today) {
      profile.value.dailyChallenges = generateDailyChallenges(inProgressStages)
      profile.value.lastChallengeDate = today
    }
  }

  function completeChallenge(challengeId: string) {
    const challenge = profile.value.dailyChallenges.find(c => c.id === challengeId)
    if (challenge && !challenge.completed) {
      challenge.completed = true
      challenge.completedAt = Date.now()
      addXp(challenge.xpReward, challenge.title)
      return true
    }
    return false
  }

  // ── Streak tracking ──────────────────────────────────────────────────────
  function updateStreak() {
    const today = getToday()
    const lastActive = profile.value.lastActiveDate

    if (lastActive === today) return // Already active today

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (lastActive === yesterdayStr) {
      // Continue streak
      profile.value.streakDays += 1
    } else {
      // Reset streak
      profile.value.streakDays = 1
    }

    profile.value.lastActiveDate = today
    profile.value.dailyXp = 0 // Reset daily XP

    // Check streak achievements
    checkAchievements({ streakDays: profile.value.streakDays })
  }

  // ── Toast ────────────────────────────────────────────────────────────────
  function toast(message: string, type: string = 'success') {
    const id = uid()
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 3000)
  }

  // ── Modal controls ──────────────────────────────────────────────────────
  function closeLevelUpModal() {
    showLevelUpModal.value = false
  }

  function closeAchievementModal() {
    showAchievementModal.value = false
    newAchievement.value = null
  }

  // ── Data operations ──────────────────────────────────────────────────────
  function loadProfile(savedProfile: PlayerProfile | undefined, inProgressStages?: { skillTitle: string; stageName: string; stageId: string; skillId: string }[], skillTreesData?: { id: string; stages: { status: string }[]; status: string }[]) {
    if (savedProfile) {
      profile.value = savedProfile
    }
    // 向后兼容：确保 sopLinkCount 字段存在
    if (profile.value.sopLinkCount === undefined) {
      profile.value.sopLinkCount = 0
    }
    checkDailyChallenges(inProgressStages || [])
    updateStreak()
    // 重新计算所有成就状态（基于当前技能树进度）
    if (skillTreesData) {
      recalculateAchievements(skillTreesData)
    }
  }

  // 根据当前技能树进度重新计算所有成就解锁状态
  function recalculateAchievements(skillTreesData: { id: string; stages: { status: string }[]; status: string }[]) {
    let totalStagesCompleted = 0
    let totalSkillsCompleted = 0

    for (const skill of skillTreesData) {
      const completedStages = skill.stages.filter(s => s.status === 'completed').length
      totalStagesCompleted += completedStages

      if (skill.stages.every(s => s.status === 'completed')) {
        totalSkillsCompleted++
      }
    }

    const skillCount = skillTreesData.length
    const streakDays = profile.value.streakDays
    const skillsUnlocked = skillTreesData.filter(s => s.status === 'unlocked').length

    checkAchievements({
      totalStagesCompleted,
      totalSkillsCompleted,
      skillCount,
      streakDays,
      skillsUnlocked
    }, { skipModal: true })
  }

  function getProfile(): PlayerProfile {
    return JSON.parse(JSON.stringify(profile.value))
  }

  // ── SOP 绑定计数 ────────────────────────────────────────────────────────
  function incrementSopLinkCount() {
    profile.value.sopLinkCount++
    checkAchievements({ sopLinkCount: profile.value.sopLinkCount })
  }

  // ── XP reward constants ──────────────────────────────────────────────────
  const XP_CARD_COMPLETE = 10
  const XP_SOP_COMPLETE = 50
  const XP_MILESTONE_COMPLETE = 25
  const XP_STAGE_COMPLETE = 100
  const XP_SKILL_COMPLETE = 200
  const XP_CREATE_SKILL = 15
  const XP_CREATE_SOP = 15

  return {
    // State
    profile,
    showLevelUpModal,
    showAchievementModal,
    newAchievement,
    newLevel,
    toasts,

    // Computed
    level,
    xpForNextLevel,
    xpProgress,
    xpInCurrentLevel,
    unlockedAchievements,
    lockedAchievements,
    allAchievements,
    completedChallenges,
    todayChallenges,

    // XP operations
    addXp,

    // Achievement operations
    checkAndUnlockAchievement,
    unlockAchievement,
    checkAchievements,

    // Challenge operations
    completeChallenge,
    checkDailyChallenges,

    // Streak
    updateStreak,

    // Modal
    closeLevelUpModal,
    closeAchievementModal,

    // Data
    loadProfile,
    getProfile,
    recalculateAchievements,
    incrementSopLinkCount,

    // Constants
    XP_CARD_COMPLETE,
    XP_SOP_COMPLETE,
    XP_MILESTONE_COMPLETE,
    XP_STAGE_COMPLETE,
    XP_SKILL_COMPLETE,
    XP_CREATE_SKILL,
    XP_CREATE_SOP,
  }
})