
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Task, TaskSubmission, User, UserRole, TaskStatus, TaskType } from '../../types';
import { Plus, ChevronRight, Check, User as UserIcon } from 'lucide-react';

export const InstructorTasks: React.FC<{ user: User }> = ({ user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [gradingSub, setGradingSub] = useState<TaskSubmission | null>(null);
  
  // Creation Form
  const [isCreating, setIsCreating] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', deadline: '' });

  // Grade Form
  const [grade, setGrade] = useState(0);
  const [feedback, setFeedback] = useState('');

  const fetchTasks = async () => {
    const data = await api.getTasks(user.id, UserRole.INSTRUCTOR);
    // Filter only Assignments
    setTasks(data.filter(t => t.type === TaskType.ASSIGNMENT));
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createTask({
      ...newTask,
      type: TaskType.ASSIGNMENT,
      assignedTo: 'ALL',
      createdBy: user.id,
      isPublished: true // Default to true
    });
    setIsCreating(false);
    setNewTask({ title: '', description: '', deadline: '' });
    fetchTasks();
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (sub: TaskSubmission) => {
    try {
      setDownloadingId(sub.id);
      const filename = sub.originalFileName || sub.fileUrl;
      await api.downloadSubmission(sub.id, filename);
    } catch (e) {
      console.error(e);
      alert("Failed to download file. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleTaskClick = async (task: Task) => {
    setSelectedTask(task);
    const subs = await api.getTaskSubmissions(task.id);
    setSubmissions(subs);
    setGradingSub(null);
  };

  const handleGradeSubmit = async () => {
    if (!gradingSub) return;
    try {
      await api.gradeTask(gradingSub.id, grade, feedback);
      // Refresh local state
      const updatedSubs = await api.getTaskSubmissions(selectedTask!.id);
      setSubmissions(updatedSubs);
      setGradingSub(null);
      alert("Grade saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save grade.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* List / Create Column */}
      <div className="lg:col-span-1 glass-panel rounded-xl border border-white/10 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="font-bold text-gray-200">Tasks</h2>
          <button onClick={() => setIsCreating(true)} className="text-teal-400 hover:bg-teal-500/20 p-1.5 rounded-lg transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-3 space-y-2 custom-scrollbar">
          {isCreating && (
             <form onSubmit={handleCreate} className="p-4 bg-teal-500/10 rounded-xl border border-teal-500/20 space-y-3 mb-2 animate-in slide-in-from-top-2">
               <input 
                 placeholder="Title" 
                 className="glass-input w-full p-2 text-sm rounded-lg"
                 value={newTask.title}
                 onChange={e => setNewTask({...newTask, title: e.target.value})}
                 required
               />
               <textarea 
                 placeholder="Instructions" 
                 className="glass-input w-full p-2 text-sm rounded-lg"
                 value={newTask.description}
                 onChange={e => setNewTask({...newTask, description: e.target.value})}
                 required
               />
               <div className="flex gap-2">
                 <input 
                   type="datetime-local" 
                   className="glass-input w-full p-2 text-sm rounded-lg"
                   value={newTask.deadline}
                   onChange={e => setNewTask({...newTask, deadline: e.target.value})}
                   required
                 />
               </div>
               <div className="flex justify-end gap-2">
                 <button type="button" onClick={() => setIsCreating(false)} className="text-xs text-gray-400 hover:text-white">Cancel</button>
                 <button type="submit" className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-500">Create</button>
               </div>
             </form>
          )}

          {tasks.map(task => (
            <div 
              key={task.id} 
              onClick={() => handleTaskClick(task)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                selectedTask?.id === task.id ? 'bg-teal-500/10 border-teal-500/30 shadow-[0_0_10px_rgba(45,212,191,0.1)]' : 'hover:bg-white/5 border-transparent'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                 <h3 className={`font-semibold text-sm line-clamp-1 ${selectedTask?.id === task.id ? 'text-teal-300' : 'text-gray-300'}`}>{task.title}</h3>
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">{task.description}</p>
            </div>
          ))}
          
          {tasks.length === 0 && !isCreating && (
             <p className="text-center text-gray-500 text-xs py-4">No tasks found.</p>
          )}
        </div>
      </div>

      {/* Detail / Grading Column */}
      <div className="lg:col-span-2 glass-panel rounded-xl border border-white/10 flex flex-col overflow-hidden">
        {selectedTask ? (
          <>
            <div className="p-6 border-b border-white/10 bg-white/[0.02]">
               <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">{selectedTask.title}</h2>
               </div>
               <p className="text-gray-400 mt-2">{selectedTask.description}</p>
               <div className="flex gap-4 mt-4 text-sm text-gray-500">
                 <span className="bg-white/5 px-2 py-1 rounded">Due: {new Date(selectedTask.deadline).toLocaleString()}</span>
                 <span className="bg-teal-500/10 text-teal-300 px-3 py-1 rounded border border-teal-500/20">
                    Completed by: <span className="font-bold text-white ml-1">{submissions.length} Students</span>
                 </span>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <h3 className="font-bold text-gray-300 mb-4 uppercase text-sm tracking-wider flex items-center">
                 <UserIcon className="w-4 h-4 mr-2" /> Students who completed this task
              </h3>
              
              {submissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                   <p className="text-gray-500 italic">No submissions received yet.</p>
                   <p className="text-xs text-gray-600 mt-1">Students will appear here once they submit.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map(sub => (
                    <div key={sub.id} className="border border-white/10 bg-white/[0.02] rounded-xl p-5 hover:border-white/20 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                           <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                               {sub.studentName?.charAt(0) || 'S'}
                             </div>
                             <div>
                                <p className="font-bold text-gray-200">{sub.studentName}</p>
                                <p className="text-[10px] text-gray-500">Submitted: {new Date(sub.submittedAt).toLocaleString()}</p>
                             </div>
                           </div>
                           
                           <button 
                             onClick={() => handleDownload(sub)}
                             disabled={downloadingId === sub.id}
                             className="text-teal-400 text-sm hover:text-teal-300 mt-3 block flex items-center gap-2 ml-10 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                             <span className="bg-teal-500/10 px-2 py-1 rounded border border-teal-500/20 text-xs flex items-center gap-2">
                                {downloadingId === sub.id ? (
                                  <div className="w-3 h-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Check className="w-3 h-3" /> 
                                )}
                                {downloadingId === sub.id ? 'Downloading...' : `Download: ${sub.originalFileName || sub.fileUrl}`}
                             </span>
                           </button>
                        </div>
                        <div className="text-right">
                           {sub.status === TaskStatus.GRADED ? (
                             <span className="bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                               Grade: {sub.grade}/100
                             </span>
                           ) : (
                             <button 
                               onClick={() => { setGradingSub(sub); setGrade(0); setFeedback(''); }}
                               className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
                             >
                               Grade Now
                             </button>
                           )}
                        </div>
                      </div>

                      {/* Grading Interface inline */}
                      {gradingSub?.id === sub.id && (
                        <div className="mt-4 ml-10 bg-black/20 p-4 rounded-xl border border-white/10 animate-in fade-in zoom-in-95 duration-200">
                          <h4 className="font-bold text-sm text-gray-300 mb-3">Enter Grade & Feedback</h4>
                          <div className="flex gap-4 mb-3">
                            <div className="w-24">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Score (0-100)</label>
                              <input 
                                type="number" 
                                min="0" max="100"
                                value={grade}
                                onChange={e => setGrade(Number(e.target.value))}
                                className="glass-input w-full p-2 rounded-lg text-center font-bold"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Feedback</label>
                              <input 
                                type="text"
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                className="glass-input w-full p-2 rounded-lg"
                                placeholder="Excellent work..."
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                             <button onClick={() => setGradingSub(null)} className="text-xs text-gray-400 hover:text-white transition-colors">Cancel</button>
                             <button onClick={handleGradeSubmit} className="text-xs bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-500 shadow-lg shadow-green-500/20">
                               <Check className="w-3 h-3 mr-1" /> Save Grade
                             </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Show feedback if graded */}
                      {sub.status === TaskStatus.GRADED && (
                        <div className="mt-3 ml-10 text-sm text-gray-400 bg-white/5 p-3 rounded-lg border border-white/5 italic">
                          <span className="font-semibold text-gray-300 not-italic">Feedback:</span> {sub.feedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
            <div className="p-6 rounded-full bg-white/5 mb-4">
               <ChevronRight className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-gray-500">Select a task to view completed students</p>
          </div>
        )}
      </div>
    </div>
  );
};
