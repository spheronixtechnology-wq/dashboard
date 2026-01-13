
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { User } from '../../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Target, 
  AlertCircle, 
  Lightbulb, 
  CheckCircle2,
  BrainCircuit,
  Code2,
  MessageSquare,
  Calculator
} from 'lucide-react';

export const StudentPerformance: React.FC<{ user: User }> = ({ user }) => {
  const [data, setData] = useState<{
    average: number;
    subjects: { id: string; label: string; score: number; color: string; }[];
    weakest: { label: string; score: number } | null;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPerformance = async () => {
        try {
            const perf = await api.getStudentPerformance(user.id);
            setData(perf);
        } catch (e) {
            console.error("Failed to load performance", e);
        } finally {
            setLoading(false);
        }
    };
    loadPerformance();
  }, [user.id]);

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading analytics...</div>;
  if (!data || data.subjects.length === 0) return <div className="p-8 text-center text-gray-500">No exam data available yet. Complete some exams to see your analytics.</div>;

  const { average, subjects, weakest } = data;
  const strongest = subjects.reduce((prev, curr) => prev.score > curr.score ? prev : curr, subjects[0]);
  
  // Icon mapping
  const getIcon = (id: string) => {
      if (id === 'coding') return Code2;
      if (id === 'aptitude') return Calculator;
      if (id === 'reasoning') return BrainCircuit;
      return MessageSquare;
  };

  const examDistribution = [
    { label: 'MCQ', value: 45, color: '#8b5cf6' },       // Purple
    { label: 'Coding', value: 35, color: '#ec4899' },    // Pink
    { label: 'Descriptive', value: 20, color: '#06b6d4' } // Cyan
  ];

  // Generate Conic Gradient for Pie Chart
  let currentAngle = 0;
  const pieGradient = examDistribution.map(item => {
    const start = currentAngle;
    const end = currentAngle + item.value;
    currentAngle = end;
    return `${item.color} ${start}% ${end}%`;
  }).join(', ');

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-bold text-white mb-2">Performance Analytics</h1>
        <p className="text-gray-400">Deep dive into your learning metrics and areas for improvement.</p>
      </header>

      {/* Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Overall Score */}
         <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-16 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-4">
               <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Overall Proficiency</p>
                  <h2 className="text-5xl font-bold text-white mt-2">{average}%</h2>
               </div>
               <div className={`p-3 rounded-xl ${average >= 75 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {average >= 75 ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
               </div>
            </div>
            <div className="w-full bg-black/20 rounded-full h-2 mb-2">
               <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${average}%` }}></div>
            </div>
            <p className="text-xs text-gray-500">Based on all completed tasks and exams.</p>
         </div>

         {/* Strongest Subject */}
         <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-16 bg-green-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/20 text-green-400 rounded-lg">
                   <Award className="w-6 h-6" />
                </div>
                <h3 className="text-gray-200 font-bold">Top Strength</h3>
             </div>
             <p className="text-2xl font-bold text-white mb-1">{strongest.label}</p>
             <p className="text-sm text-green-400 font-medium mb-4">Score: {strongest.score}%</p>
             <div className="text-xs text-gray-400 bg-white/5 p-3 rounded-lg border border-white/5">
                Great job! You are excelling in {strongest.label}.
             </div>
         </div>

         {/* Focus Area */}
         <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden border-red-500/20">
             <div className="absolute top-0 right-0 p-16 bg-red-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
                   <Target className="w-6 h-6" />
                </div>
                <h3 className="text-gray-200 font-bold">Weakness Identified</h3>
             </div>
             {weakest && (
                 <>
                    <p className="text-2xl font-bold text-white mb-1">{weakest.label}</p>
                    <p className="text-sm text-red-400 font-medium mb-4">Score: {weakest.score}%</p>
                    <div className="text-xs text-gray-400 bg-white/5 p-3 rounded-lg border border-white/5">
                        Your {weakest.label} score is low ({weakest.score}%). Recommended: Practice descriptive writing tasks or related exercises.
                    </div>
                 </>
             )}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Subject Performance Bar Graph */}
         <div className="lg:col-span-2 glass-panel p-8 rounded-2xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
               <BrainCircuit className="w-5 h-5 mr-3 text-cyan-400" />
               Subject Wise Performance
            </h3>
            
            <div className="space-y-6">
               {subjects.map(sub => {
                  const Icon = getIcon(sub.id);
                  return (
                    <div key={sub.id} className="relative">
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-200">{sub.label}</span>
                            </div>
                            <span className="font-mono text-sm font-bold text-gray-300">{sub.score}%</span>
                        </div>
                        <div className="w-full h-4 bg-black/20 rounded-full overflow-hidden">
                            <div 
                                className="h-full rounded-full transition-all duration-1000 relative group"
                                style={{ width: `${sub.score}%`, backgroundColor: sub.color }}
                            >
                                <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/20"></div>
                            </div>
                        </div>
                    </div>
                  );
               })}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <h4 className="text-sm font-bold text-gray-300 mb-2 flex items-center">
                     <AlertCircle className="w-4 h-4 mr-2 text-yellow-400" />
                     Overall Analysis
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed italic">
                     "Avg Score: {average}%. {average > 70 ? 'You are performing well consistently.' : 'Consider reviewing lecture materials to boost your foundation.'}"
                  </p>
               </div>
               <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <h4 className="text-sm font-bold text-gray-300 mb-2 flex items-center">
                     <Lightbulb className="w-4 h-4 mr-2 text-purple-400" />
                     AI Suggestion
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed italic">
                     {weakest ? `"Focus on '${weakest.label}' by taking 2 mock tests this week to improve your score by ~15%."` : `"You're doing great! Try advanced problems to challenge yourself."`}
                  </p>
               </div>
            </div>
         </div>

         {/* Exam Composition Pie Chart */}
         <div className="lg:col-span-1 glass-panel p-8 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative">
            <h3 className="text-xl font-bold text-white mb-8 self-start w-full flex items-center">
               <Target className="w-5 h-5 mr-3 text-purple-400" />
               Topic Distribution
            </h3>
            
            {/* CSS Conic Gradient Pie Chart */}
            <div className="relative w-48 h-48 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-transform hover:scale-105 duration-300"
                 style={{ background: `conic-gradient(${pieGradient})` }}>
               <div className="absolute inset-0 m-[15%] bg-[#1e293b] rounded-full flex items-center justify-center flex-col shadow-inner">
                  <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Total</span>
                  <span className="text-white text-2xl font-bold">100%</span>
               </div>
            </div>

            <div className="mt-8 w-full space-y-3">
               {examDistribution.map(item => (
                  <div key={item.label} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}></div>
                        <span className="text-sm text-gray-300">{item.label}</span>
                     </div>
                     <span className="text-sm font-mono font-bold text-gray-400">{item.value}%</span>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* Action Plan */}
      <div className="glass-panel p-8 rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-900/10 to-blue-900/10">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
               <h2 className="text-2xl font-bold text-white">Recommended Action Plan</h2>
               <p className="text-sm text-gray-400">Personalized tasks to improve your <span className="text-red-400 font-bold">{weakest?.label || 'General'}</span> score.</p>
            </div>
            <button className="mt-4 md:mt-0 px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg border border-white/10 transition-all">
               View All Recommendations
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/20 p-5 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer group">
               <div className="flex justify-between items-start mb-2">
                  <span className="bg-cyan-500/20 text-cyan-300 text-[10px] px-2 py-0.5 rounded uppercase font-bold">Practice</span>
                  <CheckCircle2 className="w-4 h-4 text-gray-600 group-hover:text-cyan-400" />
               </div>
               <h4 className="text-gray-200 font-bold mb-1 group-hover:text-cyan-300">Daily Quiz</h4>
               <p className="text-xs text-gray-500">10 Questions • 5 Mins</p>
            </div>
            
            <div className="bg-black/20 p-5 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer group">
               <div className="flex justify-between items-start mb-2">
                  <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded uppercase font-bold">Reading</span>
                  <CheckCircle2 className="w-4 h-4 text-gray-600 group-hover:text-purple-400" />
               </div>
               <h4 className="text-gray-200 font-bold mb-1 group-hover:text-purple-300">Docs Review</h4>
               <p className="text-xs text-gray-500">Read & Summarize • 15 Mins</p>
            </div>

            <div className="bg-black/20 p-5 rounded-xl border border-white/5 hover:border-green-500/30 transition-all cursor-pointer group">
               <div className="flex justify-between items-start mb-2">
                  <span className="bg-green-500/20 text-green-300 text-[10px] px-2 py-0.5 rounded uppercase font-bold">Mock Test</span>
                  <CheckCircle2 className="w-4 h-4 text-gray-600 group-hover:text-green-400" />
               </div>
               <h4 className="text-gray-200 font-bold mb-1 group-hover:text-green-300">Subject Drill</h4>
               <p className="text-xs text-gray-500">20 MCQ Questions • 20 Mins</p>
            </div>
         </div>
      </div>
    </div>
  );
};
