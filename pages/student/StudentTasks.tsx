
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Task, TaskSubmission, User, TaskStatus, UserRole, TaskType } from '../../types';
import { Clock, CheckCircle, AlertCircle, Upload, File, Bookmark, X } from 'lucide-react';

export const StudentTasks: React.FC<{ user: User }> = ({ user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, TaskSubmission>>({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const fetchData = async () => {
    try {
      const allTasks = await api.getTasks(user.id, UserRole.STUDENT);
      const subMap: Record<string, TaskSubmission> = {};
      
      for (const t of allTasks) {
        const sub = await api.getStudentTaskSubmission(t.id, user.id);
        if (sub) subMap[t.id] = sub;
      }
      
      setTasks(allTasks);
      setSubmissions(subMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleSubmit = async () => {
    if (!selectedTask || !file) return;
    setSubmittingId(selectedTask.id);

    try {
      await api.submitTaskFile(selectedTask.id, file);
      await fetchData(); // Refresh
      setSelectedTask(null);
      setFile(null);
      alert("Assignment submitted successfully!");
    } catch (e) {
      console.error(e);
      alert("Submission failed. Please try again.");
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) return <div className="text-gray-400 animate-pulse">Loading tasks...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-8">My Tasks & Projects</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map(task => {
          const submission = submissions[task.id];
          const isSubmitted = !!submission;
          const isGraded = submission?.status === TaskStatus.GRADED;
          // We removed isOverdue check to show Pending instead
          const isProject = task.type === TaskType.PROJECT;

          return (
            <div key={task.id} className={`glass-panel p-6 rounded-2xl flex flex-col h-full hover:border-white/20 transition-all relative group ${isProject ? 'border-purple-500/30 bg-purple-500/5' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 text-xs rounded font-bold uppercase tracking-wide border ${
                  isGraded ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                  isSubmitted ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                }`}>
                  {isGraded ? 'Graded' : isSubmitted ? 'Submitted' : 'Pending'}
                </span>
                <span className="text-xs text-gray-400 flex items-center bg-black/20 px-2 py-1 rounded">
                   <Clock className="w-3 h-3 mr-1" />
                   {new Date(task.deadline).toLocaleDateString()}
                </span>
              </div>
              
              <div className="mb-3">
                 {isProject && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-2 uppercase tracking-wide">
                       <Bookmark className="w-3 h-3 mr-1" /> Project
                    </span>
                 )}
                 <h3 className="font-bold text-xl text-gray-100 group-hover:text-cyan-400 transition-colors">{task.title}</h3>
              </div>
              <p className="text-sm text-gray-400 flex-1 mb-6 line-clamp-3 leading-relaxed">{task.description}</p>

              {isGraded && (
                <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg mb-4">
                  <div className="flex justify-between text-sm font-bold text-gray-200">
                    <span>Grade:</span>
                    <span className="text-green-400">{submission.grade}/100</span>
                  </div>
                  {submission.feedback && (
                    <p className="text-xs text-gray-400 mt-2 italic border-t border-green-500/20 pt-2">"{submission.feedback}"</p>
                  )}
                  {submission.gradedAt && (
                     <p className="text-[10px] text-gray-500 mt-1 text-right">Graded on: {new Date(submission.gradedAt).toLocaleDateString()}</p>
                  )}
                </div>
              )}

              <button
                onClick={() => setSelectedTask(task)}
                disabled={isGraded}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg ${
                  isGraded 
                    ? 'bg-gray-700/50 text-gray-500 cursor-default border border-gray-600/50'
                    : isSubmitted 
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-blue-600/30'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/20'
                }`}
              >
                {isGraded ? 'Completed' : isSubmitted ? 'View / Update Submission' : 'View Details & Submit'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Glass Modal - Fixed & Centered */}
      {selectedTask && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity" 
            onClick={() => { setSelectedTask(null); setFile(null); }}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
             
             {/* Header */}
            <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-start shrink-0">
               <div>
                 <div className="flex items-center gap-3 mb-2">
                   {selectedTask.type === TaskType.PROJECT && <span className="bg-purple-600 text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">Project</span>}
                   <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">{selectedTask.title}</h2>
                 </div>
                 <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>Due: {new Date(selectedTask.deadline).toLocaleString()}</span>
                 </div>
               </div>
               <button 
                  onClick={() => { setSelectedTask(null); setFile(null); }} 
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all border border-white/5"
               >
                  <X className="w-5 h-5" />
               </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
              <div className="mb-8 bg-gradient-to-br from-white/5 to-transparent p-6 rounded-xl border border-white/5">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <File className="w-3 h-3" /> Instructions
                </h4>
                <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap">{selectedTask.description}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-white mb-3">Upload Assignment</label>
                <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-all group cursor-pointer relative overflow-hidden ${
                    file ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/20 bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-500/30'
                }`}>
                  <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center relative z-10 w-full h-full justify-center">
                    {file ? (
                      <div className="animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400 mx-auto shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                          <CheckCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1 break-all">{file.name}</h3>
                        <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Ready to submit</p>
                        <p className="text-xs text-gray-500 mt-4 hover:text-white transition-colors">Click to replace file</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-gray-400 group-hover:scale-110 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-all duration-300">
                          <Upload className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-200 group-hover:text-white transition-colors mb-2">Click to upload your work</h3>
                        <p className="text-sm text-gray-500 group-hover:text-gray-400">PDF, DOCX, Images (Max 10MB)</p>
                      </>
                    )}
                  </label>
                </div>

                {submissions[selectedTask.id] && !file && (
                   <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                     <div className="p-2 bg-green-500/20 rounded-full text-green-400">
                        <CheckCircle className="w-4 h-4" />
                     </div>
                     <div>
                        <p className="text-xs text-green-400 font-bold uppercase">Current Submission</p>
                        <p className="text-sm text-gray-300 truncate max-w-[200px] md:max-w-md">
                            {submissions[selectedTask.id].originalFileName || submissions[selectedTask.id].fileUrl}
                        </p>
                     </div>
                   </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3 shrink-0">
                <button 
                  onClick={() => { setSelectedTask(null); setFile(null); }}
                  className="px-6 py-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={!file || !!submittingId}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 text-sm transition-all flex items-center gap-2"
                >
                  {submittingId ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Uploading...
                      </>
                  ) : (
                      <>
                        <Upload className="w-4 h-4" /> Submit Assignment
                      </>
                  )}
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};
