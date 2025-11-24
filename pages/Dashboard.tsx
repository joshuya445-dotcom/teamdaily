import React, { useEffect, useState } from 'react';
import { api } from '../services/mockBackend';
import { UserRole, DashboardStats, User, DailyReport } from '../types';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CheckCircle, Clock, AlertTriangle, Activity, Calendar as CalendarIcon, Trophy, TrendingUp, Sparkles } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const currentUser = api.auth.getCurrentUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Advanced Filter States
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || '');
  const [viewMode, setViewMode] = useState<'calendar' | 'line'>('calendar');
  const [userReports, setUserReports] = useState<DailyReport[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  useEffect(() => {
    const fetchData = async () => {
      const dashboardStats = await api.dashboard.getStats();
      const users = await api.dashboard.getAllUsers();
      setStats(dashboardStats);
      setAllUsers(users);
      if (!selectedUserId && currentUser) setSelectedUserId(currentUser.id);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
        const loadUserReports = async () => {
             const reports = await api.daily.getAll();
             const filtered = reports.filter(r => r.userId === selectedUserId);
             setUserReports(filtered);
        };
        loadUserReports();
    }
  }, [selectedUserId]);

  if (loading) return <div>加载中...</div>;

  const ActivityCard = ({ title, value, sub, icon: Icon, color }: any) => {
      const colorMap: Record<string, string> = {
          indigo: "bg-indigo-50 text-indigo-600",
          green: "bg-emerald-50 text-emerald-600",
          yellow: "bg-amber-50 text-amber-600",
          red: "bg-rose-50 text-rose-600"
      };
      const iconBg = colorMap[color] || colorMap.indigo;

      return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
          <div>
             <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">{title}</p>
             <div className="text-2xl font-bold text-gray-900">{value}</div>
             <div className="text-[10px] text-gray-400 mt-1">{sub}</div>
          </div>
          <div className={`p-3 rounded-xl ${iconBg}`}>
             <Icon className="h-5 w-5" />
          </div>
        </div>
      );
  };

  // --- CALENDAR HEATMAP LOGIC ---
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay(); // 0 = Sun

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month);
    const days = [];
    
    // Empty slots
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    }
    
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const report = userReports.find(r => r.date === dateStr);
        
        let bgClass = "bg-gray-100/50"; 
        let textClass = "text-gray-300 scale-90";
        
        if (report) {
            textClass = "text-white font-medium scale-100 shadow-sm";
            if (report.taskCount >= 8) bgClass = "bg-indigo-600";
            else if (report.taskCount >= 4) bgClass = "bg-indigo-400";
            else bgClass = "bg-indigo-300";
        }

        days.push(
            <div key={d} className="aspect-square relative group">
                <div 
                    className={`w-full h-full rounded-md flex items-center justify-center text-[10px] cursor-default transition-all duration-200 ${bgClass} ${textClass}`}
                >
                    {d}
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 transition-opacity">
                    {report ? `${report.date}: ${report.taskCount} 项工作` : `${dateStr}: 未提交`}
                </div>
            </div>
        );
    }
    return days;
  };

  // --- AREA CHART DATA ---
  const getChartData = () => {
     const daysInMonth = getDaysInMonth(year, month);
     const data = [];
     for(let d=1; d<=daysInMonth; d++) {
         const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
         const report = userReports.find(r => r.date === dateStr);
         data.push({
             day: d,
             workload: report ? report.taskCount : 0
         });
     }
     return data;
  };

  const selectedUserObj = allUsers.find(u => u.id === selectedUserId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
               <Sparkles className="w-6 h-6 text-indigo-600" />
               工作台
            </h1>
            <p className="text-sm text-gray-500 mt-1">Hello, {currentUser?.name || '朋友'}！今天准备做点什么？</p>
        </div>
        
        <Button onClick={() => navigate('/submit')} className="bg-gray-900 hover:bg-gray-800 text-white border-0 shadow-lg shadow-gray-200">
             <Activity className="w-4 h-4 mr-2" />
             写日报
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <ActivityCard 
          title="今日提交" 
          value={`${stats?.submittedCount} / ${stats?.totalMembers}`} 
          sub="Real-time" 
          icon={CheckCircle} 
          color="indigo" 
        />
        <ActivityCard 
          title="本周提交率" 
          value={`${stats?.weeklySubmissionRate}%`} 
          sub="Activity" 
          icon={Activity} 
          color="green" 
        />
        <ActivityCard 
          title="待提交" 
          value={stats ? stats.totalMembers - stats.submittedCount : 0} 
          sub="Pending" 
          icon={Clock} 
          color="yellow" 
        />
        <ActivityCard 
          title="风险预警" 
          value={stats?.recentActivity.filter(r => r.problems.length > 5).length || 0} 
          sub="Issues" 
          icon={AlertTriangle} 
          color="red" 
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Visual Widget */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        {viewMode === 'calendar' ? <CalendarIcon className="w-4 h-4 text-indigo-500" /> : <TrendingUp className="w-4 h-4 text-indigo-500" />}
                        {viewMode === 'calendar' ? '产出热力图' : '工作量趋势'}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">展示每日工作强度分布</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                    <select 
                        className="text-xs bg-gray-50 border-transparent rounded-lg py-1.5 px-2 font-medium text-gray-600 focus:ring-0 cursor-pointer hover:bg-gray-100 transition-colors"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                    >
                        {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    
                    <select 
                        className="text-xs bg-gray-50 border-transparent rounded-lg py-1.5 px-2 font-medium text-gray-600 focus:ring-0 cursor-pointer hover:bg-gray-100 transition-colors"
                        value={month} 
                        onChange={(e) => setMonth(Number(e.target.value))}
                    >
                        {Array.from({length: 12}).map((_, i) => (
                            <option key={i} value={i}>{i+1}月</option>
                        ))}
                    </select>

                    <div className="bg-gray-100 p-0.5 rounded-lg flex">
                        <button 
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            onClick={() => setViewMode('calendar')}
                        >
                            <CalendarIcon className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'line' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            onClick={() => setViewMode('line')}
                        >
                            <TrendingUp className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
             </div>

             <div className="min-h-[280px] w-full flex items-center justify-center">
                {viewMode === 'calendar' ? (
                    <div className="w-full max-w-lg">
                        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-bold text-gray-300 uppercase">
                            <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {renderCalendar()}
                        </div>
                    </div>
                ) : (
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={getChartData()} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorWork" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="day" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#cbd5e1', fontSize: 10}} 
                                    dy={10}
                                    interval={2}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#cbd5e1', fontSize: 10}} 
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                                    itemStyle={{ color: '#818cf8' }}
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                                    labelFormatter={(val) => `${month+1}月${val}日`}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="workload" 
                                    stroke="#6366f1" 
                                    strokeWidth={2} 
                                    fillOpacity={1} 
                                    fill="url(#colorWork)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
             </div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
              {/* Achievements */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-gray-900 flex items-center">
                          <Trophy className="w-4 h-4 mr-2 text-amber-500" />
                          成就徽章
                      </h3>
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {selectedUserObj?.achievements.length || 0}
                      </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                      {selectedUserObj?.achievements && selectedUserObj.achievements.length > 0 ? (
                          selectedUserObj.achievements.map(ach => (
                              <div key={ach.id} className="group relative flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-colors cursor-help">
                                  <span className="text-2xl mb-1">{ach.icon}</span>
                                  <span className="text-[10px] text-gray-600 line-clamp-1">{ach.name}</span>
                                  
                                  {/* Tooltip */}
                                  <div className="absolute bottom-full mb-1 hidden group-hover:block w-max max-w-[120px] bg-gray-900 text-white text-[10px] p-2 rounded z-20 shadow-xl">
                                      {ach.description}
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="col-span-3 py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                             <span className="text-2xl grayscale opacity-30">🏆</span>
                             <p className="text-[10px] text-gray-400 mt-2">暂无成就，继续努力！</p>
                          </div>
                      )}
                  </div>
              </div>

              {/* Recent Feed */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-gray-900 mb-4">最新动态</h3>
                  <div className="space-y-4">
                      {stats?.recentActivity.slice(0, 3).map((report) => (
                        <div key={report.id} className="flex items-start space-x-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                            <div className="flex-shrink-0">
                                <span className="inline-flex h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 items-center justify-center text-xs font-bold text-white shadow-sm">
                                    {report.userAvatar}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <p className="text-sm font-semibold text-gray-900">{report.userName}</p>
                                    <span className="text-[10px] text-gray-400">{new Date(report.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                    {report.todayWork.split('\n')[0].replace(/\[\d+%\]\s*/, '')}
                                </p>
                            </div>
                        </div>
                      ))}
                      <button onClick={() => navigate('/reports')} className="w-full mt-2 py-2 text-xs font-medium text-gray-500 hover:text-indigo-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                          查看全部日报
                      </button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};