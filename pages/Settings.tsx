import React, { useEffect, useState } from 'react';
import { api } from '../services/mockBackend';
import { TeamSettings, Group } from '../types';
import { Button } from '../components/Button';
import { Trash2, Plus, Mail } from 'lucide-react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<TeamSettings | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [inviteData, setInviteData] = useState({ name: '', email: '', groupId: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const s = await api.settings.get();
      const g = await api.settings.getGroups();
      setSettings(s);
      setGroups(g);
      if (g.length > 0) setInviteData(prev => ({ ...prev, groupId: g[0].id }));
    };
    load();
  }, []);

  const handleSaveSettings = async () => {
    if (!settings) return;
    setLoading(true);
    await api.settings.update(settings);
    await api.settings.updateGroups(groups);
    setLoading(false);
    alert('配置已保存');
    window.location.reload(); // Refresh to update Sidebar team name
  };

  const handleInvite = async () => {
    if (!inviteData.email || !inviteData.name) return;
    try {
        await api.settings.inviteUser(inviteData.name, inviteData.email, inviteData.groupId);
        alert(`已邀请 ${inviteData.name} 加入团队！`);
        setInviteData({ name: '', email: '', groupId: groups[0]?.id || '' });
    } catch (e: any) {
        alert(e.message);
    }
  };

  const handleAddGroup = () => {
    const name = prompt("请输入新小组名称:");
    if (name) {
        setGroups([...groups, { id: Math.random().toString(36).substr(2, 9), name }]);
    }
  };

  const handleDeleteGroup = (id: string) => {
      if (confirm('确认删除该小组吗？')) {
          setGroups(groups.filter(g => g.id !== id));
      }
  };

  const toggleWorkDay = (day: number) => {
      if (!settings) return;
      const days = settings.workDays.includes(day) 
         ? settings.workDays.filter(d => d !== day)
         : [...settings.workDays, day];
      setSettings({ ...settings, workDays: days });
  };

  if (!settings) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">团队配置</h1>

      {/* General Settings */}
      <section className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">基本信息</h2>
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700">团队名称</label>
                  <input 
                    type="text" 
                    value={settings.teamName}
                    onChange={(e) => setSettings({...settings, teamName: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
              </div>
          </div>
      </section>

      {/* Work Schedule */}
      <section className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">工作日设置 (用于计算打卡连续性)</h2>
          <div className="flex gap-4 flex-wrap">
              {['日', '一', '二', '三', '四', '五', '六'].map((day, idx) => (
                  <label key={idx} className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.workDays.includes(idx)}
                        onChange={() => toggleWorkDay(idx)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">周{day}</span>
                  </label>
              ))}
          </div>
      </section>

      {/* Group Management */}
      <section className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">小组管理</h2>
            <Button variant="secondary" onClick={handleAddGroup} className="text-xs">
                <Plus className="w-3 h-3 mr-1" /> 添加小组
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
              {groups.map(g => (
                  <div key={g.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-100">
                      <input 
                        type="text" 
                        value={g.name}
                        onChange={(e) => setGroups(groups.map(grp => grp.id === g.id ? {...grp, name: e.target.value} : grp))}
                        className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0"
                      />
                      <button onClick={() => handleDeleteGroup(g.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
              ))}
          </div>
      </section>

      {/* Achievements Rules */}
      <section className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">成就规则设置</h2>
          <div className="grid gap-6 md:grid-cols-3">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">单日高产阈值 (项)</label>
                  <input 
                    type="number" 
                    value={settings.achievementRules.dailyTaskThreshold}
                    onChange={(e) => setSettings({...settings, achievementRules: {...settings.achievementRules, dailyTaskThreshold: Number(e.target.value)}})}
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">单日完成任务数超过此值获得勋章</p>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">周度高产天数</label>
                  <input 
                    type="number" 
                    value={settings.achievementRules.weeklyHighPerfDays}
                    onChange={(e) => setSettings({...settings, achievementRules: {...settings.achievementRules, weeklyHighPerfDays: Number(e.target.value)}})}
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 sm:text-sm"
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">月度高产天数</label>
                  <input 
                    type="number" 
                    value={settings.achievementRules.monthlyHighPerfDays}
                    onChange={(e) => setSettings({...settings, achievementRules: {...settings.achievementRules, monthlyHighPerfDays: Number(e.target.value)}})}
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 sm:text-sm"
                  />
              </div>
          </div>
      </section>

      {/* Invite Member */}
      <section className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-indigo-500" />
              邀请成员
          </h2>
          <div className="grid gap-4 sm:grid-cols-3 items-end">
              <div>
                  <label className="block text-sm font-medium text-gray-700">姓名</label>
                  <input 
                    type="text" 
                    value={inviteData.name}
                    onChange={(e) => setInviteData({...inviteData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 sm:text-sm"
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700">邮箱</label>
                  <input 
                    type="email" 
                    value={inviteData.email}
                    onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 sm:text-sm"
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700">分配小组</label>
                  <select 
                     value={inviteData.groupId}
                     onChange={(e) => setInviteData({...inviteData, groupId: e.target.value})}
                     className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 sm:text-sm"
                  >
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
              </div>
          </div>
          <div className="mt-4">
              <Button onClick={handleInvite} variant="outline" className="w-full sm:w-auto">发送邀请</Button>
          </div>
      </section>

      <div className="pt-4 flex justify-end">
          <Button onClick={handleSaveSettings} isLoading={loading} className="w-full sm:w-auto text-lg px-8">
              保存所有配置
          </Button>
      </div>
    </div>
  );
};
