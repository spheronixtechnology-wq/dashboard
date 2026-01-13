
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Topic, User, Task, TaskSubmission, UserRole, TaskStatus, TaskType, AttendanceRecord, ResearchSubmission, ResearchStatus } from '../../types';
import { Calendar, FileText, Download, CheckSquare, Clock, ArrowRight, Bookmark, UserCheck, History, Sparkles, BarChart3, AlertCircle, TrendingUp, Target, Microscope, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StudentDashboard: React.FC<{ user: User; sessionStartTime: string | null }> = ({ user, sessionStartTime }) => {
  const navigate = useNavigate();
  const [latestTopic, setLatestTopic] = useState<Topic | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, TaskSubmission>>({});
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [researchSubmissions, setResearchSubmissions] = useState<ResearchSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Coding Practice State
  const [practiceLang, setPracticeLang] = useState('javascript');
  const [practiceCode, setPracticeCode] = useState(`// Welcome to the Coding Playground
// Write, run, and practice your code here!

function hello() {
  console.log("Hello, World!");
}

hello();`);

  // Mock Performance Data (In a real app, this would come from an aggregation API)
  const performanceData = [
    { label: 'Coding', score: 88, color: 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' },
    { label: 'Aptitude', score: 65, color: 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]' },
    { label: 'Reasoning', score: 72, color: 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]' },
    { label: 'Comm.', score: 45, color: 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' },
  ];

  // Identify Weakness
  const lowest = performanceData.reduce((prev, curr) => prev.score < curr.score ? prev : curr);
  const average = Math.round(performanceData.reduce((acc, curr) => acc + curr.score, 0) / performanceData.length);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Topics
        const topics = await api.getTopics(true);
        if (topics.length > 0) {
          setLatestTopic(topics[0]);
        }

        // Fetch Tasks
        const allTasks = await api.getTasks(user.id, UserRole.STUDENT);
        const sortedTasks = allTasks.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
        setRecentTasks(sortedTasks.slice(0, 4));

        // Fetch Submissions
        const subMap: Record<string, TaskSubmission> = {};
        for (const t of sortedTasks.slice(0, 4)) {
          const sub = await api.getStudentTaskSubmission(t.id, user.id);
          if (sub) subMap[t.id] = sub;
        }
        setSubmissions(subMap);

        // Fetch Attendance
        const history = await api.getAttendanceHistory(user.id);
        setAttendanceHistory(history);

        // Fetch Research
        const research = await api.getResearch();
        setResearchSubmissions(research);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setPracticeLang(lang);
    if (lang === 'javascript') {
      setPracticeCode('// JavaScript Playground\nconsole.log("Hello from JS!");');
    } else if (lang === 'python') {
      setPracticeCode('# Python Playground\nprint("Hello from Python!")');
    } else if (lang === 'java') {
      setPracticeCode('// Java Playground\nSystem.out.println("Hello from Java!");');
    } else if (lang === 'cpp') {
      setPracticeCode('// C++ Playground\ncout << "Hello from C++" << endl;');
    } else {
      setPracticeCode('// Write your code here...');
    }
  };

  // Coding Practice Handler (Auto-save or run)
  const handleCodeRun = async (code: string, output: string) => {
      try {
          await api.submitTask({
              taskId: 'PLAYGROUND',
              studentId: user.id,
              studentName: user.name,
              fileUrl: 'playground',
              code: code,
              language: practiceLang,
              output: output
          });
          console.log("Practice code saved");
      } catch (e) {
          console.error("Failed to save practice code", e);
      }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading dashboard...</div>;

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 drop-shadow-sm">
            Hello, {user.name}
          </h1>
          <p className="text-gray-400 mt-2 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-cyan-400" />
            Here is your daily overview.
          </p>
        </div>
        {sessionStartTime && (
          <div className="glass-card px-4 py-2 rounded-xl flex items-center border border-teal-500/20 bg-teal-500/5">
             <div className="w-2 h-2 rounded-full bg-teal-400 mr-3 animate-pulse shadow-[0_0_8px_#2dd4bf]"></div>
             <span className="text-teal-300 text-sm font-medium font-mono">
               Online: {new Date(sessionStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
             </span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Topics + Tasks (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Today's Topic */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-semibold text-gray-200 flex items-center">
                <Calendar className="w-5 h-5 mr-3 text-cyan-400" />
                Today's Topic
              </h2>
            </div>

            {latestTopic ? (
              <div className="glass-panel rounded-2xl overflow-hidden group hover:border-white/20 transition-all duration-300">
                <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">{latestTopic.title}</h3>
                      <p className="text-sm text-gray-400 mt-1 flex items-center">
                        Published {new Date(latestTopic.publishDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs px-3 py-1 rounded-full font-medium shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                      Latest
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="prose prose-invert max-w-none whitespace-pre-line text-gray-300">
                    {latestTopic.content}
                  </div>

                  {latestTopic.attachments && latestTopic.attachments.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-purple-400" />
                        Resources
                      </h4>
                      <div className="flex gap-3">
                        {latestTopic.attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center p-3 bg-black/20 rounded-xl border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all cursor-pointer group/file">
                            <div className="w-10 h-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center mr-3 group-hover/file:bg-red-500/30">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-200 group-hover/file:text-white transition-colors">{file}</p>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                            <Download className="w-4 h-4 text-gray-600 ml-4 group-hover/file:text-cyan-400 transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-xl p-8 text-center text-gray-500 border-dashed border-white/10">
                No topics published yet.
              </div>
            )}
          </section>

          {/* Assignments List */}
          <section className="space-y-4">
             <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-semibold text-gray-200 flex items-center">
                <CheckSquare className="w-5 h-5 mr-3 text-cyan-400" />
                Tasks & Projects
              </h2>
              <button 
                onClick={() => navigate('/student/tasks')}
                className="text-sm text-cyan-400 font-medium hover:text-cyan-300 flex items-center transition-colors px-3 py-1 rounded-lg hover:bg-cyan-500/10"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentTasks.length > 0 ? (
                recentTasks.map(task => {
                  const sub = submissions[task.id];
                  const isSubmitted = !!sub;
                  const isGraded = sub?.status === TaskStatus.GRADED;
                  // Removed isOverdue logic to show pending always
                  const isProject = task.type === TaskType.PROJECT;

                  return (
                    <div 
                      key={task.id} 
                      onClick={() => navigate('/student/tasks')}
                      className={`glass-card p-5 rounded-xl transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/5 ${
                         isProject ? 'border-l-4 border-l-purple-500' : 'border-gray-200'
                      }`}
                    >
                       <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-200 group-hover:text-cyan-300 transition-colors line-clamp-1 flex-1">{task.title}</h3>
                          {isProject && (
                             <span className="ml-2 bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded border border-purple-500/30 font-bold uppercase tracking-wide">Project</span>
                          )}
                       </div>
                       <p className="text-xs text-gray-400 mb-4 line-clamp-2">{task.description}</p>
                       
                       <div className="flex justify-between items-center">
                         <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider border ${
                            isGraded ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                            isSubmitted ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                            'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                         }`}>
                           {isGraded ? 'Graded' : isSubmitted ? 'Submitted' : 'Pending'}
                         </span>
                         <span className="text-xs text-gray-500 flex items-center bg-black/20 px-2 py-1 rounded">
                           <Clock className="w-3 h-3 mr-1" />
                           {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                         </span>
                       </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full glass-card p-8 rounded-xl border-dashed border-white/10 text-center text-gray-500 text-sm">
                  No active assignments.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Analytics & Attendance (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
           
           {/* Performance Analytics Section */}
           <section>
              <h2 className="text-xl font-semibold text-gray-200 flex items-center mb-4 px-1">
                 <BarChart3 className="w-5 h-5 mr-3 text-cyan-400" />
                 Performance
              </h2>
              <div className="glass-panel p-6 rounded-2xl border border-white/10">
                 {/* Graph Area */}
                 <div className="flex items-end justify-between h-40 gap-3 mb-6 px-1">
                    {performanceData.map((item) => (
                       <div key={item.label} className="flex flex-col items-center flex-1 group cursor-default">
                          <div className="relative w-full flex justify-center items-end h-full bg-white/[0.02] rounded-t-lg">
                             <div 
                               className={`w-full max-w-[24px] rounded-t-sm transition-all duration-1000 ${item.color} opacity-80 group-hover:opacity-100 relative`}
                               style={{ height: `${item.score}%` }}
                             >
                                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
                                  {item.score}%
                                </span>
                             </div>
                          </div>
                          <span className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-wider">{item.label}</span>
                       </div>
                    ))}
                 </div>
                 
                 {/* Insights Area */}
                 <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] rounded-xl p-4 border border-white/5">
                    <div className="flex items-start gap-3 mb-3">
                       <div className="p-2 bg-red-500/10 rounded-lg text-red-400 border border-red-500/20">
                          <AlertCircle className="w-4 h-4" />
                       </div>
                       <div>
                          <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide">Weakness Identified</h4>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                             Your <span className="text-red-300 font-semibold">{lowest.label}</span> score is low ({lowest.score}%). 
                             Recommended: {lowest.label === 'Comm.' ? 'Practice descriptive writing tasks.' : `Review ${lowest.label.toLowerCase()} algorithms.`}
                          </p>
                       </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                       <div className="flex items-center gap-2">
                          <Target className="w-3 h-3 text-gray-500" />
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Avg. Score</span>
                       </div>
                       <span className={`text-sm font-bold flex items-center ${average >= 75 ? 'text-green-400' : 'text-yellow-400'}`}>
                          <TrendingUp className="w-3 h-3 mr-1.5" />
                          {average}%
                       </span>
                    </div>
                 </div>
              </div>
           </section>

           {/* Attendance Section */}
           <section>
             <h2 className="text-xl font-semibold text-gray-200 flex items-center mb-4 px-1">
                <History className="w-5 h-5 mr-3 text-cyan-400" />
                Attendance Log
             </h2>
             <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                   <span className="text-sm font-bold text-gray-200">Recent Activity</span>
                   <UserCheck className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="divide-y divide-white/5">
                   {sessionStartTime && (
                     <div className="p-3 flex justify-between items-center bg-teal-500/10">
                        <div>
                           <p className="text-xs font-bold text-teal-300">Today (Current)</p>
                           <p className="text-[10px] text-teal-500/80">Active Session</p>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-mono text-gray-300">{new Date(sessionStartTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                        </div>
                     </div>
                   )}
                   {attendanceHistory.map(record => (
                     <div key={record.id} className="p-3 flex justify-between items-center hover:bg-white/5 transition-colors">
                        <div>
                           <p className="text-xs font-bold text-gray-300">{new Date(record.date).toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'})}</p>
                           <p className={`text-[10px] font-bold ${record.status === 'PRESENT' ? 'text-green-400' : 'text-yellow-500'}`}>
                             {record.status} ({record.totalActiveMinutes || 0}m)
                           </p>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-mono text-gray-400 flex items-center justify-end">
                              <span className="text-green-500/70 mr-1 text-[10px]">IN</span>
                              {new Date(record.loginTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                           </p>
                           {record.logoutTime ? (
                             <p className="text-xs font-mono text-gray-400 flex items-center justify-end">
                                <span className="text-red-500/70 mr-1 text-[10px]">OUT</span>
                                {new Date(record.logoutTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                             </p>
                           ) : (
                             <p className="text-[10px] text-gray-600">No logout recorded</p>
                           )}
                        </div>
                     </div>
                   ))}
                   {attendanceHistory.length === 0 && !sessionStartTime && (
                      <div className="p-4 text-center text-xs text-gray-500">No history available</div>
                   )}
                </div>
             </div>
           </section>
        </div>
      </div>
    </div>
  );
};
