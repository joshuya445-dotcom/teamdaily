import { User, DailyReport, TeamSummary, UserRole, AuthResponse, DashboardStats, TeamSettings, Group, Achievement } from "../types";

// --- ID GENERATOR ---
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- STORAGE KEYS ---
const USERS_KEY = 'teamdaily_users';
const REPORTS_KEY = 'teamdaily_reports';
const SUMMARY_KEY = 'teamdaily_summaries';
const SESSION_KEY = 'teamdaily_session';
const SETTINGS_KEY = 'teamdaily_settings';
const GROUPS_KEY = 'teamdaily_groups';

// --- DEFAULT SETTINGS ---
const defaultSettings: TeamSettings = {
  teamName: "我的超强团队",
  workDays: [1, 2, 3, 4, 5], // Mon-Fri
  achievementRules: {
    dailyTaskThreshold: 8,
    weeklyHighPerfDays: 4,
    monthlyHighPerfDays: 20,
  }
};

const defaultGroups: Group[] = [
  { id: 'g1', name: '开发组' },
  { id: 'g2', name: '设计组' },
  { id: 'g3', name: '市场组' },
];

const seedUsers: User[] = [
  { id: 'admin1', name: '管理员老王', email: 'admin@team.com', password: 'password', role: UserRole.ADMIN, streak: 5, achievements: [], groupId: 'g1', createdAt: new Date().toISOString() },
  { id: 'user1', name: '李开发', email: 'john@team.com', password: 'password', role: UserRole.USER, streak: 12, achievements: [], groupId: 'g1', createdAt: new Date().toISOString() },
  { id: 'user2', name: '张设计', email: 'sarah@team.com', password: 'password', role: UserRole.USER, streak: 3, achievements: [], groupId: 'g2', createdAt: new Date().toISOString() },
];

// --- INITIALIZATION ---
const initializeDB = () => {
  if (!localStorage.getItem(USERS_KEY)) localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
  if (!localStorage.getItem(REPORTS_KEY)) localStorage.setItem(REPORTS_KEY, JSON.stringify([]));
  if (!localStorage.getItem(SETTINGS_KEY)) localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
  if (!localStorage.getItem(GROUPS_KEY)) localStorage.setItem(GROUPS_KEY, JSON.stringify(defaultGroups));
};

initializeDB();

// --- HELPERS ---
const getUsers = (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
const setUsers = (users: User[]) => localStorage.setItem(USERS_KEY, JSON.stringify(users));
const getReports = (): DailyReport[] => JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
const setReports = (reports: DailyReport[]) => localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
const getSummaries = (): TeamSummary[] => JSON.parse(localStorage.getItem(SUMMARY_KEY) || '[]');
const getSettings = (): TeamSettings => JSON.parse(localStorage.getItem(SETTINGS_KEY) || JSON.stringify(defaultSettings));
const getGroups = (): Group[] => JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]');

// --- BUSINESS LOGIC HELPER: STREAKS & ACHIEVEMENTS ---
const updateStreakAndAchievements = (user: User, report: DailyReport, settings: TeamSettings): User => {
  const today = new Date(report.date);
  const updatedUser = { ...user };
  
  // 1. Calculate Streak
  const lastSubmit = user.lastSubmitDate ? new Date(user.lastSubmitDate) : null;
  let isConsecutive = false;

  if (lastSubmit) {
    const oneDay = 24 * 60 * 60 * 1000;
    // Walk back from today to find the previous working day
    let checkDate = new Date(today.getTime() - oneDay);
    while (true) {
      const dayOfWeek = checkDate.getDay();
      if (settings.workDays.includes(dayOfWeek)) {
        // Found the previous working day. Does it match lastSubmit?
        if (checkDate.toISOString().split('T')[0] === user.lastSubmitDate) {
          isConsecutive = true;
        }
        break; 
      }
      // If we go back more than 14 days, assume break
      if ((today.getTime() - checkDate.getTime()) > 14 * oneDay) break;
      checkDate = new Date(checkDate.getTime() - oneDay);
    }
  } else {
    isConsecutive = false; // First ever post
  }

  // If submitting same day, don't double count
  if (user.lastSubmitDate !== report.date) {
    if (isConsecutive) {
        updatedUser.streak += 1;
    } else {
        updatedUser.streak = 1; 
    }
    updatedUser.lastSubmitDate = report.date;
  }

  // 2. Check Daily Achievement
  if (report.taskCount >= settings.achievementRules.dailyTaskThreshold) {
    const hasBadge = updatedUser.achievements.find(a => a.id === 'daily_hero');
    if (!hasBadge) {
        updatedUser.achievements.push({
            id: 'daily_hero',
            name: '卷王之王',
            icon: '🚀',
            description: `单日完成超过 ${settings.achievementRules.dailyTaskThreshold} 项工作`,
            unlockedAt: new Date().toISOString()
        });
    }
  }

  // 3. Streak Milestones
  if (updatedUser.streak >= 5 && !updatedUser.achievements.find(a => a.id === 'streak_5')) {
      updatedUser.achievements.push({ id: 'streak_5', name: '本周全勤', icon: '🔥', description: '连续打卡 5 天', unlockedAt: new Date().toISOString() });
  }
  if (updatedUser.streak >= 20 && !updatedUser.achievements.find(a => a.id === 'streak_20')) {
      updatedUser.achievements.push({ id: 'streak_20', name: '月度模范', icon: '🏆', description: '连续打卡 20 天', unlockedAt: new Date().toISOString() });
  }

  return updatedUser;
};


// --- API ---

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      await new Promise(r => setTimeout(r, 600));
      const users = getUsers();
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) throw new Error("邮箱或密码错误");
      const token = `mock-jwt-${user.id}`;
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token }));
      return { user, token };
    },
    register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
        await new Promise(r => setTimeout(r, 800));
        const users = getUsers();
        if (users.find(u => u.email === email)) throw new Error("该邮箱已被注册");
        
        const newUser: User = {
            id: generateId(),
            name,
            email,
            password,
            role: UserRole.USER,
            streak: 0,
            achievements: [],
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        setUsers(users);
        
        const token = `mock-jwt-${newUser.id}`;
        localStorage.setItem(SESSION_KEY, JSON.stringify({ user: newUser, token }));
        return { user: newUser, token };
    },
    logout: () => localStorage.removeItem(SESSION_KEY),
    getCurrentUser: (): User | null => {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
          const s = JSON.parse(session);
          const dbUser = getUsers().find(u => u.id === s.user.id);
          return dbUser || s.user;
      }
      return null;
    }
  },

  settings: {
    get: async () => {
        return getSettings();
    },
    update: async (newSettings: TeamSettings) => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
        return newSettings;
    },
    getGroups: async () => getGroups(),
    updateGroups: async (groups: Group[]) => {
        localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
        return groups;
    },
    inviteUser: async (name: string, email: string, groupId: string) => {
        const users = getUsers();
        if (users.find(u => u.email === email)) throw new Error("该邮箱已存在");
        const newUser: User = {
            id: generateId(),
            name,
            email,
            password: 'password', // Default password
            role: UserRole.USER,
            groupId,
            streak: 0,
            achievements: [],
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        setUsers(users);
        return newUser;
    }
  },
  
  daily: {
    create: async (data: Omit<DailyReport, 'id' | 'createdAt' | 'userName' | 'userAvatar' | 'likes' | 'taskCount' | 'groupId'>) => {
      await new Promise(r => setTimeout(r, 600));
      const users = getUsers();
      let user = users.find(u => u.id === data.userId);
      if (!user) throw new Error("User not found");

      // Calculate task count (simple: split by newline or bullet points)
      const lines = data.todayWork.split('\n').filter(l => l.trim().length > 0);
      const taskCount = lines.length;
      
      const newReport: DailyReport = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        userName: user.name,
        userAvatar: user.name.substring(0, 2),
        groupId: user.groupId,
        likes: [],
        taskCount,
        ...data
      };
      
      const reports = getReports();
      reports.push(newReport);
      setReports(reports);

      const settings = getSettings();
      const updatedUser = updateStreakAndAchievements(user, newReport, settings);
      
      const userIndex = users.findIndex(u => u.id === user?.id);
      users[userIndex] = updatedUser;
      setUsers(users);

      return newReport;
    },

    toggleLike: async (reportId: string, userId: string) => {
        const reports = getReports();
        const report = reports.find(r => r.id === reportId);
        if (report) {
            if (report.likes.includes(userId)) {
                report.likes = report.likes.filter(id => id !== userId);
            } else {
                report.likes.push(userId);
            }
            setReports(reports);
        }
        return report;
    },
    
    list: async (date?: string, userId?: string): Promise<DailyReport[]> => {
      let reports = getReports();
      if (date) reports = reports.filter(r => r.date === date);
      if (userId) reports = reports.filter(r => r.userId === userId);
      const users = getUsers();
      
      return reports.map(r => ({
        ...r,
        userName: r.userName || users.find(u => u.id === r.userId)?.name,
        userAvatar: (r.userName || users.find(u => u.id === r.userId)?.name || 'U').substring(0,2)
      })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    getAll: async (): Promise<DailyReport[]> => {
        return getReports();
    }
  },

  summary: {
    create: async (data: Omit<TeamSummary, 'id' | 'createdAt'>) => {
      const summaries = getSummaries();
      const filtered = summaries.filter(s => s.date !== data.date);
      const newSummary: TeamSummary = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        ...data
      };
      filtered.push(newSummary);
      localStorage.setItem(SUMMARY_KEY, JSON.stringify(filtered));
      return newSummary;
    },
    get: async (date: string): Promise<TeamSummary | null> => {
      const summaries = getSummaries();
      return summaries.find(s => s.date === date) || null;
    }
  },

  dashboard: {
    getStats: async (): Promise<DashboardStats> => {
      const users = getUsers();
      const reports = getReports();
      const today = new Date().toISOString().split('T')[0];
      const submittedToday = reports.filter(r => r.date === today);
      
      return {
        submittedCount: submittedToday.length,
        totalMembers: users.filter(u => u.role === UserRole.USER).length,
        weeklySubmissionRate: 85,
        recentActivity: reports.slice(-5)
      };
    },
    getAllUsers: async () => getUsers()
  }
};