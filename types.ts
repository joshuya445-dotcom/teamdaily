export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export interface Achievement {
  id: string;
  name: string; // e.g., "高产似母猪", "全勤达人"
  icon: string; // emoji
  description: string;
  unlockedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  groupId?: string; // 所属小组 ID
  streak: number; // 连续打卡天数
  lastSubmitDate?: string;
  achievements: Achievement[]; // 已获得的成就
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
}

export interface DailyReport {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string; // Initials
  groupId?: string; // Snapshot of group at time of submit
  date: string; // YYYY-MM-DD
  status: string; // 今日状态: "开心", "焦虑", etc.
  todayWork: string;
  taskCount: number; // Calculated number of items completed
  problems: string;
  tomorrowPlan: string;
  tags: string[];
  likes: string[]; // List of userIds who liked this
  createdAt: string;
}

export interface TeamSummary {
  id: string;
  date: string;
  summaryAI: string;
  riskAI: string;
  recommendationsAI: string;
  keywords: string[];
  createdAt: string;
}

export interface AchievementRule {
  dailyTaskThreshold: number; // e.g., 8 tasks for daily high performance
  weeklyHighPerfDays: number; // e.g., 4 days > threshold
  monthlyHighPerfDays: number; // e.g., 20 days > threshold
}

export interface TeamSettings {
  teamName: string;
  workDays: number[]; // 0=Sun, 1=Mon... 6=Sat. e.g., [1,2,3,4,5]
  achievementRules: AchievementRule;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface DashboardStats {
  submittedCount: number;
  totalMembers: number;
  weeklySubmissionRate: number;
  recentActivity: DailyReport[];
}
