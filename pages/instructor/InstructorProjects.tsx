
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Task, TaskSubmission, User, UserRole, TaskStatus, TaskType, ProjectCategory } from '../../types';
import { Plus, ChevronRight, Check, Rocket, Globe, Cloud, Smartphone, Database, Lock } from 'lucide-react';

export const InstructorProjects: React.FC<{ user: User }> = ({ user }) => {
  const [projects, setProjects] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [gradingSub, setGradingSub] = useState<TaskSubmission | null>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({ 
    title: '', 
    description: '', 
    deadline: '', 
    projectCategory: ProjectCategory.WEB_DEV 
  });

  const [grade, setGrade] = useState(0);
  const [feedback, setFeedback] = useState('');
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

  const fetchProjects = async () => {
    const allTasks = await api.getTasks(user.id, UserRole.INSTRUCTOR);
    setProjects(allTasks.filter(t => t.type === TaskType.PROJECT));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createTask({
      title: newProject.title,
      description: newProject.description,
      deadline: newProject.deadline,
      assignedTo: 'ALL',
      createdBy: user.id,
      type: TaskType.PROJECT,
      projectCategory: newProject.projectCategory,
      isPublished: true // Default to true
    });
    setIsCreating(false);
    setNewProject({ title: '', description: '', deadline: '', projectCategory: ProjectCategory.WEB_DEV });
    fetchProjects();
  };

  const handleProjectClick = async (project: Task) => {
    setSelectedProject(project);
    const subs = await api.getTaskSubmissions(project.id);
    setSubmissions(subs);
    setGradingSub(null);
  };

  const handleGradeSubmit = async () => {
    if (!gradingSub || !selectedProject) return;
    try {
      await api.gradeTask(gradingSub.id, grade, feedback);
      const updatedSubs = await api.getTaskSubmissions(selectedProject.id);
      setSubmissions(updatedSubs);
      setGradingSub(null);
      alert("Project evaluation saved!");
    } catch (e) {
      console.error(e);
      alert("Failed to save evaluation.");
    }
  };

  const getCategoryIcon = (cat?: ProjectCategory) => {
    switch(cat) {
        case ProjectCategory.WEB_DEV: return <Globe className="w-3 h-3 mr-1" />;
        case ProjectCategory.APP_DEV: return <Smartphone className="w-3 h-3 mr-1" />;
        case ProjectCategory.CLOUD: return <Cloud className="w-3 h-3 mr-1" />;
        case ProjectCategory.DATA_SCIENCE: return <Database className="w-3 h-3 mr-1" />;
        default: return <Rocket className="w-3 h-3 mr-1" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* List / Create Column */}
      <div className="lg:col-span-1 glass-panel rounded-xl border border-white/10 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="font-bold text-gray-200">Capstone Projects</h2>
          <button onClick={() => setIsCreating(true)} className="text-purple-400 hover:bg-purple-500/20 p-1.5 rounded-lg transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-3 space-y-2 custom-scrollbar">
          {isCreating && (
             <form onSubmit={handleCreate} className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 space-y-3 mb-2 animate-in slide-in-from-top-2">
               <input 
                 placeholder="Project Title" 
                 className="glass-input w-full p-2 text-sm rounded-lg"
                 value={newProject.title}
                 onChange={e => setNewProject({...newProject, title: e.target.value})}
                 required
               />
               <textarea 
                 placeholder="Requirements & Description" 
                 className="glass-input w-full p-2 text-sm rounded-lg"
                 value={newProject.description}
                 onChange={e => setNewProject({...newProject, description: e.target.value})}
                 required
               />
               <div className="flex gap-2">
                 <select 
                   className="glass-input w-full p-2 text-sm rounded-lg bg-slate-800"
                   value={newProject.projectCategory}
                   onChange={e => setNewProject({...newProject, projectCategory: e.target.value as ProjectCategory})}
                 >
                    <option value={ProjectCategory.WEB_DEV}>Web Development</option>
                    <option value={ProjectCategory.APP_DEV}>App Development</option>
                    <option value={ProjectCategory.CLOUD}>Cloud Computing</option>
                    <option value={ProjectCategory.DATA_SCIENCE}>Data Science</option>
                    <option value={ProjectCategory.CYBER_SECURITY}>Cyber Security</option>
                 </select>
               </div>
               <input 
                   type="datetime-local" 
                   className="glass-input w-full p-2 text-sm rounded-lg"
                   value={newProject.deadline}
                   onChange={e => setNewProject({...newProject, deadline: e.target.value})}
                   required
               />
               <div className="flex justify-end gap-2">
                 <button type="button" onClick={() => setIsCreating(false)} className="text-xs text-gray-400 hover:text-white">Cancel</button>
                 <button type="submit" className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-500">Create Project</button>
               </div>
             </form>
          )}

          {projects.map(proj => (
            <div 
              key={proj.id} 
              onClick={() => handleProjectClick(proj)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                selectedProject?.id === proj.id ? 'bg-purple-500/10 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]' : 'hover:bg-white/5 border-transparent'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                 <h3 className={`font-semibold text-sm line-clamp-1 ${selectedProject?.id === proj.id ? 'text-purple-300' : 'text-gray-300'}`}>{proj.title}</h3>
                 <span className="text-[10px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded border border-white/5 flex items-center uppercase font-bold">
                    {getCategoryIcon(proj.projectCategory)} {proj.projectCategory?.replace('_', ' ')}
                 </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">{proj.description}</p>
            </div>
          ))}
          
          {projects.length === 0 && !isCreating && (
             <p className="text-center text-gray-500 text-xs py-4">No projects found.</p>
          )}
        </div>
      </div>

      {/* Detail / Grading Column */}
      <div className="lg:col-span-2 glass-panel rounded-xl border border-white/10 flex flex-col overflow-hidden">
        {selectedProject ? (
          <>
            <div className="p-6 border-b border-white/10 bg-white/[0.02] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none"></div>
               <div className="flex items-center gap-3 mb-2 relative z-10">
                  <div className="p-2 bg-purple-500/20 rounded-lg text-purple-300">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">{selectedProject.title}</h2>
               </div>
               <p className="text-gray-400 mt-2 relative z-10">{selectedProject.description}</p>
               <div className="flex gap-4 mt-4 text-sm text-gray-500 relative z-10">
                 <span className="bg-white/5 px-2 py-1 rounded">Deadline: {new Date(selectedProject.deadline).toLocaleString()}</span>
                 <span className="bg-white/5 px-2 py-1 rounded">Category: {selectedProject.projectCategory?.replace('_', ' ')}</span>
                 <span className="bg-white/5 px-2 py-1 rounded">Submissions: <span className="text-white font-bold">{submissions.length}</span></span>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <h3 className="font-bold text-gray-300 mb-4 uppercase text-sm tracking-wider">Project Submissions</h3>
              {submissions.length === 0 ? (
                <p className="text-gray-500 italic p-4 border border-white/5 rounded-lg text-center bg-white/[0.02]">No student submissions yet.</p>
              ) : (
                <div className="space-y-4">
                  {submissions.map(sub => (
                    <div key={sub.id} className="border border-white/10 bg-white/[0.02] rounded-xl p-5 hover:border-purple-500/30 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                           <p className="font-bold text-gray-200">{sub.studentName}</p>
                           <p className="text-xs text-gray-500 mt-0.5">Submitted: {new Date(sub.submittedAt).toLocaleString()}</p>
                           <div className="flex gap-2 mt-2">
                               <button 
                                   onClick={() => handleDownload(sub)}
                                   disabled={downloadingId === sub.id}
                                   className="text-purple-400 text-sm hover:text-purple-300 flex items-center gap-2 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                               >
                                   {downloadingId === sub.id ? (
                                      <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                                   ) : (
                                      <Globe className="w-3 h-3" /> 
                                   )}
                                   {downloadingId === sub.id ? 'Downloading...' : `Download Report: ${sub.originalFileName || sub.fileUrl}`}
                               </button>
                           </div>
                        </div>
                        <div className="text-right">
                           {sub.status === TaskStatus.GRADED ? (
                             <span className="bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                               Score: {sub.grade}/100
                             </span>
                           ) : (
                             <button 
                               onClick={() => { setGradingSub(sub); setGrade(0); setFeedback(''); }}
                               className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
                             >
                               Grade Project
                             </button>
                           )}
                        </div>
                      </div>

                      {/* Grading Interface inline */}
                      {gradingSub?.id === sub.id && (
                        <div className="mt-4 bg-black/20 p-4 rounded-xl border border-white/10 animate-in fade-in zoom-in-95 duration-200">
                          <h4 className="font-bold text-sm text-gray-300 mb-3">Evaluate Project</h4>
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
                              <label className="block text-xs font-medium text-gray-500 mb-1">Feedback & Comments</label>
                              <input 
                                type="text"
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                className="glass-input w-full p-2 rounded-lg"
                                placeholder="Detailed feedback on code structure, functionality..."
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                             <button onClick={() => setGradingSub(null)} className="text-xs text-gray-400 hover:text-white transition-colors">Cancel</button>
                             <button onClick={handleGradeSubmit} className="text-xs bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-500 shadow-lg shadow-green-500/20">
                               <Check className="w-3 h-3 mr-1" /> Save Evaluation
                             </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Show feedback if graded */}
                      {sub.status === TaskStatus.GRADED && (
                        <div className="mt-3 text-sm text-gray-400 bg-white/5 p-3 rounded-lg border border-white/5 italic">
                          <span className="font-semibold text-gray-300 not-italic">Evaluation:</span> {sub.feedback}
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
            <p className="text-gray-500">Select a project to view submissions</p>
          </div>
        )}
      </div>
    </div>
  );
};
