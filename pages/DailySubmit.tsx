import React, { useState, useEffect } from 'react';
import { api } from '../services/mockBackend';
import { analyzeSingleReport } from '../services/geminiService';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { Wand2, Smile, Frown, Meh, Rocket, Coffee, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '开心', icon: Smile, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
  { value: '高效', icon: Rocket, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
  { value: '一般', icon: Meh, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { value: '疲惫', icon: Coffee, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
  { value: '焦虑', icon: Frown, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
];

interface TaskItem {
  id: string;
  content: string;
  progress: number;
}

export const DailySubmit: React.FC = () => {
  const navigate = useNavigate();
  
  // 核心表单状态
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: '1', content: '', progress: 100 }
  ]);
  const [problems, setProblems] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  
  // 状态/心情
  const [status, setStatus] = useState('开心');
  const [customStatus, setCustomStatus] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{tags: string[], feedback?: string} | null>(null);

  // 自动加载草稿
  useEffect(() => {
    const saved = localStorage.getItem('daily_draft_v2');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.tasks) setTasks(data.tasks);
      if (data.problems) setProblems(data.problems);
      if (data.tomorrowPlan) setTomorrowPlan(data.tomorrowPlan);
      if (data.status) setStatus(data.status);
      if (data.customStatus) setCustomStatus(data.customStatus);
    }
  }, []);

  // 自动保存草稿
  useEffect(() => {
    const draft = { tasks, problems, tomorrowPlan, status, customStatus };
    localStorage.setItem('daily_draft_v2', JSON.stringify(draft));
  }, [tasks, problems, tomorrowPlan, status, customStatus]);

  // --- 任务管理逻辑 ---
  const addTask = () => {
    setTasks([...tasks, { id: Math.random().toString(36).substr(2, 9), content: '', progress: 0 }]);
  };

  const removeTask = (id: string) => {
    if (tasks.length === 1) {
        setTasks([{ ...tasks[0], content: '', progress: 0 }]); // 如果只剩一个，清空而不是删除
        return;
    }
    setTasks(tasks.filter(t => t.id !== id));
  };

  const updateTask = (id: string, field: keyof TaskItem, value: any) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  // --- 格式化数据以适配后端 ---
  const getFormattedTodayWork = () => {
    return tasks
      .filter(t => t.content.trim() !== '')
      .map(t => `[${t.progress}%] ${t.content}`)
      .join('\n');
  };

  const handleSubmit = async () => {
    const formattedWork = getFormattedTodayWork();
    
    if (!formattedWork) {
      alert("请至少填写一项今日工作内容");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = api.auth.getCurrentUser();
      if (!user) throw new Error("No user");

      // AI Check
      const analysis = await analyzeSingleReport(formattedWork, problems, tomorrowPlan);
      
      if (analysis.feedback) {
         if (!confirm(`🤖 AI 建议: ${analysis.feedback}\n\n是否继续提交?`)) {
           setIsSubmitting(false);
           return;
         }
      }

      const finalStatus = customStatus.trim() || status;

      await api.daily.create({
        userId: user.id,
        date: new Date().toISOString().split('T')[0],
        todayWork: formattedWork,
        problems: problems,
        tomorrowPlan: tomorrowPlan,
        status: finalStatus,
        tags: analysis.tags
      });
      
      localStorage.removeItem('daily_draft_v2');
      navigate('/');
    } catch (e) {
      console.error(e);
      alert('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAICheck = async () => {
     const formattedWork = getFormattedTodayWork();
     if (!formattedWork) return;
     setIsSubmitting(true);
     const result = await analyzeSingleReport(formattedWork, problems, tomorrowPlan);
     setAiFeedback({ tags: result.tags, feedback: result.feedback || "内容看起来很棒！" });
     setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">填写今日日报</h1>
        <p className="text-gray-500 mt-2">记录点滴进步，保持团队同步。</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 左侧主要表单 */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. 今日状态 */}
          <section className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              1. 今日心情状态
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {STATUS_OPTIONS.map((opt) => {
                 const isSelected = status === opt.value && !customStatus;
                 return (
                  <button
                    key={opt.value}
                    onClick={() => { setStatus(opt.value); setCustomStatus(''); }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      isSelected
                      ? `${opt.bg} ${opt.border} ring-2 ring-indigo-500 ring-offset-2` 
                      : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <opt.icon className={`w-8 h-8 mb-2 ${opt.color}`} />
                    <span className={`text-xs font-medium ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                      {opt.value}
                    </span>
                  </button>
                 );
              })}
            </div>
            <div className="mt-4">
              <input 
                type="text" 
                placeholder="或者... 自定义你的今日状态（如：满血复活）" 
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          </section>

          {/* 2. 今日工作 (任务清单模式) */}
          <section className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  2. 今日产出与进度 <span className="text-red-500 ml-1">*</span>
                </h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">自动统计工时</span>
             </div>
             
             <div className="space-y-4">
               {tasks.map((task, index) => (
                 <div key={task.id} className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                    <div className="flex-shrink-0 pt-2 sm:pt-0">
                        {task.progress === 100 ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                            <Circle className="w-5 h-5 text-gray-300" />
                        )}
                    </div>
                    
                    <div className="flex-1 w-full space-y-2 sm:space-y-0">
                        <input
                           type="text"
                           placeholder={`任务 ${index + 1} 内容...`}
                           value={task.content}
                           onChange={(e) => updateTask(task.id, 'content', e.target.value)}
                           className="w-full border-none bg-transparent focus:ring-0 text-gray-900 placeholder-gray-400 text-sm font-medium p-0"
                        />
                        <div className="flex items-center gap-3">
                           <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              step="25"
                              value={task.progress}
                              onChange={(e) => updateTask(task.id, 'progress', Number(e.target.value))}
                              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                           />
                           <span className={`text-xs font-bold w-12 text-right ${task.progress === 100 ? 'text-green-600' : 'text-indigo-600'}`}>
                              {task.progress}%
                           </span>
                        </div>
                    </div>

                    <button 
                      onClick={() => removeTask(task.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                      title="删除任务"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               ))}
             </div>

             <div className="mt-4">
               <button 
                 onClick={addTask}
                 className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
               >
                 <Plus className="w-4 h-4 mr-1" />
                 添加一项工作任务
               </button>
             </div>
          </section>

          {/* 3. 问题与计划 */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-2">3. 遇到的阻碍 (可选)</h2>
                <textarea
                  rows={4}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm p-3 resize-none"
                  placeholder="如果是需要协助的问题，请务必写清楚..."
                  value={problems}
                  onChange={(e) => setProblems(e.target.value)}
                />
             </div>
             <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-2">4. 明日计划 (可选)</h2>
                <textarea
                  rows={4}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm p-3 resize-none"
                  placeholder="预告明天的重点工作..."
                  value={tomorrowPlan}
                  onChange={(e) => setTomorrowPlan(e.target.value)}
                />
             </div>
          </section>

        </div>

        {/* 右侧边栏：AI 助手与操作 */}
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center mb-4">
                    <Wand2 className="w-6 h-6 mr-2 opacity-80" />
                    <h3 className="font-bold text-lg">AI 写作助手</h3>
                </div>
                <p className="text-indigo-100 text-sm mb-6">
                    填写完成后，我可以帮您检查日报质量，提取关键词，并确认是否有遗漏的重要事项。
                </p>
                <Button 
                   onClick={handleAICheck} 
                   disabled={isSubmitting} 
                   className="w-full bg-white/10 hover:bg-white/20 border-transparent text-white"
                >
                    ✨ 检查日报质量
                </Button>
            </div>

            {aiFeedback && (
              <div className={`rounded-xl border p-4 shadow-sm ${aiFeedback.feedback?.includes("棒") ? "bg-green-50 border-green-200 text-green-800" : "bg-orange-50 border-orange-200 text-orange-800"}`}>
                 <div className="flex items-start">
                    <div className="flex-1">
                      <p className="font-bold text-sm mb-1">AI 反馈结果：</p>
                      <p className="text-sm leading-relaxed">{aiFeedback.feedback}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {aiFeedback.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/60 border border-current">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                 </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <h3 className="font-bold text-gray-900 mb-4">准备提交?</h3>
                <div className="flex flex-col gap-3">
                    <Button 
                       onClick={handleSubmit} 
                       isLoading={isSubmitting} 
                       className="w-full py-3 text-base shadow-md hover:shadow-lg transform transition-all hover:-translate-y-0.5"
                    >
                       🚀 立即发布日报
                    </Button>
                    <Button 
                       variant="outline" 
                       onClick={() => navigate('/')} 
                       className="w-full"
                    >
                       保存草稿并返回
                    </Button>
                </div>
                <p className="text-xs text-gray-400 text-center mt-4">
                    提交后，您的连续打卡天数将 +1 🔥
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};