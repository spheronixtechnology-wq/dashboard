
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { User, AttendanceRecord } from '../../types';
import { Users, BookOpen, CheckSquare, PlusCircle, History, Clock, ArrowRight, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const InstructorDashboard: React.FC<{ user: User; sessionStartTime: string | null }> = ({ user, sessionStartTime }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ topics: 0, tasks: 0, projects: 0, submissions: 0 });
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
       const dashboardStats = await api.getInstructorStats();
       setStats(dashboardStats);

       const history = await api.getAttendanceHistory(user.id);
       setAttendanceHistory(history);
    };
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Card = ({ title, value, icon: Icon, gradient, link }: any) => (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all group cursor-pointer relative overflow-hidden" onClick={() => navigate(link)}>
      <div className={`absolute top-0 right-0 p-20 rounded-full blur-[60px] opacity-20 bg-gradient-to-br ${gradient} -mr-10 -mt-10 transition-opacity group-hover:opacity-30`}></div>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-4xl font-bold text-white">{value}</span>
      </div>
      <h3 className="text-gray-400 font-medium mb-4 relative z-10">{title}</h3>
      <div className="flex items-center text-sm font-semibold text-gray-300 group-hover:text-white transition-colors relative z-10">
        Manage <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Instructor Dashboard</h1>
          <p className="text-gray-400 mt-2">Manage your course content and student progress.</p>
        </div>
        {sessionStartTime && (
          <div className="glass-card px-4 py-2 rounded-xl text-sm flex items-center border border-white/10">
             <Clock className="w-4 h-4 text-cyan-400 mr-2" />
             <span className="text-gray-300">
               Login Time: <span className="font-mono font-bold text-white">{new Date(sessionStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
             </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Stats (3/4 width) */}
        <div className="lg:col-span-3 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card 
              title="Active Topics" 
              value={stats.topics} 
              icon={BookOpen} 
              gradient="from-blue-500 to-indigo-600"
              link="/instructor/topics" 
            />
            <Card 
              title="Active Tasks" 
              value={stats.tasks} 
              icon={CheckSquare} 
              gradient="from-teal-400 to-emerald-600"
              link="/instructor/tasks" 
            />
            <Card 
              title="Active Projects" 
              value={stats.projects} 
              icon={Rocket} 
              gradient="from-purple-500 to-pink-600"
              link="/instructor/projects" 
            />
            <Card 
              title="Pending Reviews" 
              value={stats.submissions} 
              icon={Users} 
              gradient="from-orange-400 to-red-600"
              link="/instructor/tasks" 
            />
          </div>

          <div className="glass-panel rounded-2xl border border-white/10 p-8 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
               <button onClick={() => navigate('/instructor/topics')} className="flex items-center px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-gray-200 font-medium transition-colors hover:border-blue-500/30">
                  <PlusCircle className="w-5 h-5 mr-3 text-blue-400" />
                  New Topic
               </button>
               <button onClick={() => navigate('/instructor/tasks')} className="flex items-center px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-gray-200 font-medium transition-colors hover:border-teal-500/30">
                  <PlusCircle className="w-5 h-5 mr-3 text-teal-400" />
                  New Task
               </button>
               <button onClick={() => navigate('/instructor/projects')} className="flex items-center px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-gray-200 font-medium transition-colors hover:border-pink-500/30">
                  <PlusCircle className="w-5 h-5 mr-3 text-pink-400" />
                  New Project
               </button>
               <button onClick={() => navigate('/instructor/exams')} className="flex items-center px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-gray-200 font-medium transition-colors hover:border-purple-500/30">
                  <PlusCircle className="w-5 h-5 mr-3 text-purple-400" />
                  New Exam
               </button>
            </div>
          </div>
        </div>

        {/* Attendance Widget (1/4 width) */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-2xl border border-white/10 shadow-lg overflow-hidden h-full">
            <div className="p-4 bg-white/5 border-b border-white/10">
              <h2 className="text-sm font-bold text-gray-200 flex items-center">
                 <History className="w-4 h-4 mr-2 text-cyan-400" /> My Attendance
              </h2>
            </div>
            <div className="p-0">
               <ul className="divide-y divide-white/5">
                 {sessionStartTime && (
                   <li className="p-4 bg-cyan-500/10">
                     <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-cyan-300">Today</span>
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">Active</span>
                     </div>
                     <div className="mt-2 text-xs text-cyan-200/70 font-mono">
                        In: {new Date(sessionStartTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                     </div>
                   </li>
                 )}
                 {attendanceHistory.length === 0 ? (
                    <li className="p-4 text-center text-xs text-gray-500">Not yet updated</li>
                 ) : (
                    attendanceHistory.map(att => (
                    <li key={att.id} className="p-4 hover:bg-white/5 transition-colors">
                        <div className="flex justify-between">
                            <span className="text-xs font-bold text-gray-300">{new Date(att.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                            <span className="text-[10px] text-gray-500">8h 30m</span>
                        </div>
                        <div className="mt-2 flex justify-between text-[10px] text-gray-500 font-mono">
                            <span>In: {new Date(att.loginTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            <span>Out: {att.logoutTime ? new Date(att.logoutTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}</span>
                        </div>
                    </li>
                    ))
                 )}
               </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
