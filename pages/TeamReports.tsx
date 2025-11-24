import React, { useEffect, useState } from 'react';
import { api } from '../services/mockBackend';
import { DailyReport, Group } from '../types';
import { Calendar, Search, Filter, Download, ThumbsUp, Heart } from 'lucide-react';
import { Button } from '../components/Button';

export const TeamReports: React.FC = () => {
  const currentUser = api.auth.getCurrentUser();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      const data = await api.daily.list(date);
      const groupsData = await api.settings.getGroups();
      setReports(data);
      setGroups(groupsData);
    };
    loadData();
  }, [date]);

  const handleLike = async (reportId: string) => {
      if (!currentUser) return;
      await api.daily.toggleLike(reportId, currentUser.id);
      // Refresh local state optimistically or re-fetch
      const updatedReports = reports.map(r => {
          if (r.id === reportId) {
              const hasLiked = r.likes.includes(currentUser.id);
              return {
                  ...r,
                  likes: hasLiked ? r.likes.filter(id => id !== currentUser.id) : [...r.likes, currentUser.id]
              };
          }
          return r;
      });
      setReports(updatedReports);
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = (r.userName?.toLowerCase() || '').includes(search.toLowerCase()) ||
                          r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesGroup = selectedGroup === 'all' || r.groupId === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const exportCSV = () => {
    const headers = ['日期', '成员', '今日工作', '遇到问题', '明日计划', '状态', '标签', '点赞数'];
    const rows = filteredReports.map(r => [
      r.date, 
      r.userName || r.userId, 
      `"${r.todayWork.replace(/"/g, '""')}"`, 
      `"${r.problems.replace(/"/g, '""')}"`, 
      `"${r.tomorrowPlan.replace(/"/g, '""')}"`, 
      r.status,
      `"${r.tags.join(',')}"`,
      r.likes.length
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `team_daily_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">团队日报墙</h1>
        <div className="flex items-center gap-2">
            <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            <Button variant="outline" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-2" />
                导出 CSV
            </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
                type="text" 
                placeholder="搜索成员或标签..." 
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
        
        <select 
            className="border border-gray-300 rounded-md text-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
        >
            <option value="all">所有小组</option>
            {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
            ))}
        </select>

        <div className="flex items-center text-sm text-gray-500 whitespace-nowrap">
            <Filter className="w-4 h-4 mr-2" />
            共 {filteredReports.length} 份日报
        </div>
      </div>

      <div className="grid gap-6">
        {filteredReports.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
                <p className="text-gray-500">今日暂无数据，可能是大家都去团建了？</p>
            </div>
        ) : (
            filteredReports.map(report => (
                <div key={report.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {report.userAvatar}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-gray-900">{report.userName}</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-gray-200 text-xs text-gray-600 font-medium">
                                        {groups.find(g => g.id === report.groupId)?.name || '未分组'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-gray-400">{new Date(report.createdAt).toLocaleTimeString()}</span>
                                    <span className="text-xs bg-indigo-50 text-indigo-700 px-1.5 rounded border border-indigo-100">
                                        状态: {report.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                                {report.tags.map(tag => (
                                    <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                            <button 
                                onClick={() => handleLike(report.id)}
                                className={`flex items-center gap-1 text-sm font-medium transition-colors ${report.likes.includes(currentUser?.id || '') ? 'text-pink-600' : 'text-gray-400 hover:text-pink-500'}`}
                            >
                                <Heart className={`w-5 h-5 ${report.likes.includes(currentUser?.id || '') ? 'fill-current' : ''}`} />
                                {report.likes.length > 0 && report.likes.length}
                            </button>
                        </div>
                    </div>
                    <div className="p-6 grid md:grid-cols-3 gap-6">
                        <div className="col-span-1">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                今日产出
                            </h4>
                            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{report.todayWork}</p>
                        </div>
                        <div className="col-span-1">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                                遇到的坑
                            </h4>
                            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{report.problems || '无'}</p>
                        </div>
                        <div className="col-span-1">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                明日计划
                            </h4>
                            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{report.tomorrowPlan}</p>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};
