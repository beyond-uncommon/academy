export type UserRole = 'learner' | 'admin'

export type CourseType = 'crash_course' | 'specialization'

export type LessonType = 'video' | 'text' | 'interactive' | 'project'

export type SubmissionStatus = 'pending' | 'reviewed' | 'approved'

export type SkillNodeStatus = 'locked' | 'in_progress' | 'completed'

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type AssessmentType = 'lesson' | 'module' | 'course' | 'standalone'

export type Rank = 'beginner' | 'explorer' | 'practitioner' | 'designer' | 'master'

// ─── Database types ───────────────────────────────────────────────────────────

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  role: UserRole
  gender: string | null
  age: number | null
  innovation_hub: string | null
  onboarding_completed: boolean
  skill_level: 'beginner' | 'intermediate' | 'advanced' | null
  recommended_path: string | null
  learning_goals: string[] | null
  created_at: string
}

export interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  type: CourseType
  phase: number | null
  thumbnail_url: string | null
  is_published: boolean
  created_at: string
}

export interface Module {
  id: string
  course_id: string
  title: string
  order_index: number
  skill_node_id: string | null
  xp_available: number
  created_at: string
}

export interface Lesson {
  id: string
  module_id: string
  title: string
  order_index: number
  type: LessonType
  content: Record<string, unknown> | null
  xp_reward: number
  duration_minutes: number | null
  is_published: boolean
  created_at: string
}

export interface Quiz {
  id: string
  lesson_id: string | null
  module_id: string | null
  course_id: string | null
  title: string
  type: AssessmentType
  xp_base: number
  xp_bonus_80: number
  xp_bonus_100: number
  time_limit_minutes: number | null
  passing_score_pct: number
  max_attempts: number
  instructions: string | null
  is_published: boolean
  created_at: string
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question: string
  options: Array<{ text: string; is_correct: boolean }>
  explanation: string | null
  order_index: number
}

export interface QuizAttempt {
  id: string
  user_id: string
  quiz_id: string
  score_pct: number | null
  xp_earned: number | null
  started_at: string | null
  completed_at: string | null
  time_spent_seconds: number | null
  answers: Record<string, number> | null
  passed: boolean | null
  attempt_number: number
}

export interface AssessmentStatus {
  attempt_count: number
  best_score: number
  has_passed: boolean
  last_attempt_id: string | null
}

export interface CanRetakeResult {
  can_retake: boolean
  attempts_used: number
  max_attempts: number
  has_passed: boolean
}

export interface UserProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  completed_at: string | null
  xp_earned: number
}

export interface UserXP {
  id: string
  user_id: string
  total_xp: number
  weekly_xp: number
  rank: Rank
  updated_at: string
}

export interface Badge {
  id: string
  name: string
  description: string | null
  icon_url: string | null
  rarity: BadgeRarity
  xp_bonus: number
}

export interface UserBadge {
  user_id: string
  badge_id: string
  earned_at: string
  badge?: Badge
}

export interface UserStreak {
  user_id: string
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
  updated_at: string
}

export interface SkillTreeNode {
  id: string
  label: string
  module_id: string | null
  prerequisite_node_id: string | null
  position_x: number | null
  position_y: number | null
}

export interface UserSkillTree {
  user_id: string
  node_id: string
  status: SkillNodeStatus
  progress_pct: number
  updated_at: string
  node?: SkillTreeNode
}

export interface ProjectSubmission {
  id: string
  user_id: string
  lesson_id: string | null
  submission_url: string | null
  notes: string | null
  score: number | null
  xp_earned: number
  status: SubmissionStatus
  submitted_at: string
}

// ─── UI / App types ───────────────────────────────────────────────────────────

export interface DashboardData {
  profile: Profile
  xp: UserXP
  streak: UserStreak
  badges: UserBadge[]
  skillTree: UserSkillTree[]
  recentLessons: Lesson[]
}

export const RANK_THRESHOLDS: Record<Rank, number> = {
  beginner: 0,
  explorer: 500,
  practitioner: 2000,
  designer: 5000,
  master: 10000,
}

export const RANK_LABELS: Record<Rank, string> = {
  beginner: '🌱 Beginner',
  explorer: '🔭 Explorer',
  practitioner: '⚡ Practitioner',
  designer: '🎨 Designer',
  master: '🏆 Master',
}
