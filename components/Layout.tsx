
import React from 'react';
import { User, UserRole } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  CheckSquare, 
  FileText, 
  LogOut, 
  LayoutDashboard, 
  GraduationCap,
  Sparkles,
  BarChart3,
  Brain,
  MessageSquare,
  Rocket,
  FlaskConical,
  Code
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isStudent = user.role === UserRole.STUDENT;
  const prefix = isStudent ? '/student' : '/instructor';

  const menuItems = isStudent
    ? [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Tasks', path: '/tasks', icon: CheckSquare },
        { label: 'Projects', path: '/projects', icon: Rocket },
        { label: 'R&D', path: '/research', icon: FlaskConical },
        { label: 'Exams', path: '/exams', icon: FileText },
        { label: 'Mock Exams', path: '/mock-exams', icon: Brain },
        { label: 'Interviews', path: '/mock-interviews', icon: MessageSquare },
        { label: 'Performance', path: '/performance', icon: BarChart3 },
        { label: 'Playground', path: '/playground', icon: Code },
      ]
    : [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Topics', path: '/topics', icon: BookOpen },
        { label: 'Tasks', path: '/tasks', icon: CheckSquare },
        { label: 'Projects', path: '/projects', icon: Rocket },
        { label: 'R&D Reviews', path: '/research', icon: FlaskConical },
        { label: 'Exams', path: '/exams', icon: FileText },
      ];

  return (
    <div className="min-h-screen flex text-gray-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Glass Sidebar */}
      <aside className="w-64 glass-panel border-r-0 fixed h-full z-20 hidden md:flex flex-col transition-all duration-300">
        <div className="h-20 flex items-center px-6 border-b border-white/5 bg-gradient-to-r from-transparent to-white/[0.02]">
          <div className="bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg p-2 shadow-lg shadow-cyan-500/20 mr-3">
             <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Spheronix</span>
            <p className="text-[10px] text-gray-400 tracking-wider uppercase">Training Tracks</p>
          </div>
        </div>

        <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const active = location.pathname.startsWith(prefix + item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(prefix + item.path)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden ${
                  active
                    ? 'text-white bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {active && (
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-[0_0_10px_cyan]"></div>
                )}
                <item.icon className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${active ? 'text-cyan-400 drop-shadow-md' : 'text-gray-500 group-hover:text-gray-300'}`} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center mb-4 px-2 p-2 rounded-lg bg-white/5 border border-white/5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-sm shadow-inner ring-2 ring-white/10">
              {user.name.charAt(0)}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-200 truncate">{user.name}</p>
              <p className="text-[10px] text-cyan-400 capitalize flex items-center gap-1">
                <Sparkles className="w-2 h-2" /> {user.role.toLowerCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-red-500/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed w-full glass-panel z-30 px-4 h-16 flex items-center justify-between border-b border-white/10">
         <div className="flex items-center">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded p-1.5 mr-2">
               <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-100">Spheronix</span>
         </div>
         <button onClick={onLogout} className="text-xs text-red-400 font-medium border border-red-500/30 px-3 py-1 rounded-full bg-red-500/10">Logout</button>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-6 mt-16 md:mt-0 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
           <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse"></div>
           <div className="absolute bottom-[10%] right-[-5%] w-80 h-80 bg-cyan-600/10 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto animate-fade-in-up">
          {children}
        </div>
      </main>
      
      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
