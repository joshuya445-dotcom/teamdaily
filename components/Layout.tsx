import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/mockBackend';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  PenTool, 
  FileText, 
  LogOut, 
  Users, 
  Settings,
  Flame,
  Sparkles
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = api.auth.getCurrentUser();
  const [teamName, setTeamName] = useState("TeamDaily");

  useEffect(() => {
    api.settings.get().then(s => setTeamName(s.teamName));
  }, [location.pathname]); // Refresh on nav change in case settings updated

  const handleLogout = () => {
    api.auth.logout();
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const isActive = location.pathname === to;
    return (
      <button
        onClick={() => navigate(to)}
        className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg mb-1 transition-all duration-200 group ${
          isActive 
            ? 'bg-indigo-50 text-indigo-700' 
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-20 hidden md:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="truncate">TeamDaily</span>
          </h1>
          <div className="mt-2 text-xs text-gray-400 px-1 truncate">
             {teamName}
          </div>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="mb-8">
            <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">工作台</p>
            <NavItem to="/" icon={LayoutDashboard} label="仪表盘" />
            <NavItem to="/submit" icon={PenTool} label="写日报" />
             <NavItem to="/reports" icon={FileText} label="团队日报墙" />
             {user?.role === UserRole.ADMIN && (
               <NavItem to="/summary" icon={Users} label="AI 智能总结" />
            )}
          </div>
          
          <div>
            <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">配置</p>
            <NavItem to="/settings" icon={Settings} label="团队设置" />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <p className="text-sm font-bold text-gray-900">{user?.name}</p>
              <div className="flex items-center mt-1 bg-white px-2 py-0.5 rounded-full border border-gray-200 w-fit shadow-sm">
                 <Flame className="w-3 h-3 text-orange-500 mr-1" fill="currentColor" />
                 <p className="text-[10px] text-gray-600 font-medium">{user?.streak || 0} 天连续</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-500 rounded-lg hover:bg-white hover:text-red-600 hover:shadow-sm border border-transparent hover:border-gray-200 transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};