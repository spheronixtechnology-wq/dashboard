
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Task, TaskSubmission, User, TaskStatus, UserRole, TaskType, ProjectCategory } from '../../types';
import { 
  Rocket, 
  Upload, 
  File, 
  CheckCircle, 
  Cloud, 
  Smartphone, 
  Globe, 
  Database, 
  Clock, 
  X,
  ExternalLink,
  FileText,
  Code2,
  Eye,
  AlertCircle
} from 'lucide-react';

export const StudentProjects: React.FC<{ user: User }> = ({ user }) => {
  const [projects, setProjects] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, TaskSubmission>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  // Submission State
  const [selectedProject, setSelectedProject] = useState<Task | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const allTasks = await api.getTasks(user.id, UserRole.STUDENT);
      const projectTasks = allTasks.filter(t => t.type === TaskType.PROJECT);
      
      const subMap: Record<string, TaskSubmission> = {};
      for (const t of projectTasks) {
        const sub = await api.getStudentTaskSubmission(t.id, user.id);
        if (sub) subMap[t.id] = sub;
      }
      
      setProjects(projectTasks);
      setSubmissions(subMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const handleSubmit = async () => {
    if (!selectedProject || !file) return;
    setSubmittingId(selectedProject.id);

    try {
      await api.submitTaskFile(selectedProject.id, file);
      await fetchData();
      setSelectedProject(null);
      setFile(null);
      alert("Project submitted successfully!");
    } catch (e) {
      console.error(e);
      alert("Submission failed. Please try again.");
    } finally {
      setSubmittingId(null);
    }
  };

  const categories = [
    { id: 'ALL', label: 'All Projects', icon: Rocket },
    { id: ProjectCategory.WEB_DEV, label: 'Web Development', icon: Globe },
    { id: ProjectCategory.CLOUD, label: 'Cloud Services', icon: Cloud },
    { id: ProjectCategory.APP_DEV, label: 'App Development', icon: Smartphone },
    { id: ProjectCategory.DATA_SCIENCE, label: 'Data Science', icon: Database },
  ];

  const filteredProjects = activeTab === 'ALL' 
    ? projects 
    : projects.filter(p => p.projectCategory === activeTab);

  if (loading) return <div className="text-gray-400 animate-pulse p-8">Loading projects...</div>;

  const currentSubmission = selectedProject ? submissions[selectedProject.id] : null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Capstone Projects</h1>
          <p className="text-gray-400">Apply your skills in real-world scenarios. Complete projects to earn certifications.</p>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`flex items-center whitespace-nowrap px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
              activeTab === cat.id
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500/50 shadow-lg shadow-blue-500/20'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <cat.icon className={`w-4 h-4 mr-2 ${activeTab === cat.id ? 'text-white' : 'text-gray-500'}`} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
             <Rocket className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p>No projects available in this category yet.</p>
          </div>
        ) : filteredProjects.map(project => {
          const submission = submissions[project.id];
          const isSubmitted = !!submission;
          const isGraded = submission?.status === TaskStatus.GRADED;

          return (
            <div key={project.id} className="glass-panel rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group flex flex-col h-full relative">
               {/* Category Badge */}
               <div className="absolute top-4 right-4 z-10">
                  <span className="bg-black/60 backdrop-blur text-[10px] font-bold text-gray-300 px-2 py-1 rounded border border-white/10 uppercase tracking-wide">
                    {project.projectCategory?.replace('_', ' ') || 'General'}
                  </span>
               </div>

               {/* Banner Placeholder */}
               <div className={`h-32 w-full bg-gradient-to-br ${
                   project.projectCategory === ProjectCategory.WEB_DEV ? 'from-cyan-900 to-blue-900' :
                   project.projectCategory === ProjectCategory.APP_DEV ? 'from-purple-900 to-pink-900' :
                   project.projectCategory === ProjectCategory.CLOUD ? 'from-orange-900 to-red-900' :
                   'from-gray-800 to-slate-900'
               } relative overflow-hidden`}>
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                   <div className="absolute bottom-4 left-4">
                      {project.projectCategory === ProjectCategory.WEB_DEV && <Globe className="w-8 h-8 text-white opacity-80" />}
                      {project.projectCategory === ProjectCategory.APP_DEV && <Smartphone className="w-8 h-8 text-white opacity-80" />}
                      {project.projectCategory === ProjectCategory.CLOUD && <Cloud className="w-8 h-8 text-white opacity-80" />}
                      {project.projectCategory === ProjectCategory.DATA_SCIENCE && <Database className="w-8 h-8 text-white opacity-80" />}
                   </div>
               </div>

               <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{project.title}</h3>
                  <p className="text-sm text-gray-400 line-clamp-3 mb-6 flex-1">{project.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                     <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        {new Date(project.deadline).toLocaleDateString()}
                     </div>
                     
                     <div className="flex items-center gap-2">
                        {isGraded ? (
                           <button 
                             onClick={() => setSelectedProject(project)}
                             className="text-xs font-bold text-green-400 flex items-center bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 hover:bg-green-500/20 transition-colors"
                           >
                             <CheckCircle className="w-3 h-3 mr-1.5" /> Score: {submission.grade}
                           </button>
                        ) : isSubmitted ? (
                           <button 
                             onClick={() => setSelectedProject(project)}
                             className="text-xs font-bold text-blue-400 flex items-center bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                           >
                             <Eye className="w-3 h-3 mr-1.5" /> View Submission
                           </button>
                        ) : (
                           <button 
                             onClick={() => setSelectedProject(project)}
                             className="text-xs font-medium bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-cyan-500/20"
                           >
                             Start Project
                           </button>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          );
        })}
      </div>

      {/* Submission Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="glass-panel rounded-2xl max-w-2xl w-full p-0 shadow-2xl border border-white/20 relative flex flex-col max-h-[90vh]">
             {/* Header - Fixed at top */}
             <div className="p-5 border-b border-white/10 bg-white/5 flex justify-between items-center shrink-0">
               <div>
                 <h2 className="text-xl font-bold text-white mb-1">Project Submission</h2>
                 <p className="text-sm text-gray-400">{selectedProject.title}</p>
               </div>
               <button onClick={() => { setSelectedProject(null); setFile(null); }} className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
                  <X className="w-5 h-5" />
               </button>
             </div>

             {/* Scrollable Content */}
             <div className="p-6 overflow-y-auto custom-scrollbar">
               
               {/* Requirements Section */}
               <div className="mb-6 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                 <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2 flex items-center">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Requirements
                 </h4>
                 <div className="max-h-32 overflow-y-auto custom-scrollbar pr-2 mb-3">
                     <p className="text-blue-100/80 text-sm leading-relaxed whitespace-pre-line">{selectedProject.description}</p>
                 </div>
                 <div className="text-xs text-blue-300/60 pt-3 border-t border-blue-500/20 flex gap-4">
                    <span className="flex items-center"><FileText className="w-3 h-3 mr-1.5" /> Project Report (PDF)</span>
                    <span className="flex items-center"><Code2 className="w-3 h-3 mr-1.5" /> Source Code (Zip)</span>
                 </div>
               </div>

               {/* Current Status / Feedback if exists */}
               {currentSubmission && (
                 <div className={`mb-6 p-4 rounded-xl border ${currentSubmission.status === TaskStatus.GRADED ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${currentSubmission.status === TaskStatus.GRADED ? 'text-green-300' : 'text-yellow-300'}`}>
                       Submission Status: {currentSubmission.status}
                    </h4>
                    
                    <div className="flex items-center gap-3 mb-2">
                       <div className="p-2 bg-black/20 rounded-lg">
                          <File className="w-4 h-4 text-gray-400" />
                       </div>
                       <div>
                          <p className="text-sm text-white font-medium">{currentSubmission.fileUrl}</p>
                          <p className="text-xs text-gray-500">Submitted on {new Date(currentSubmission.submittedAt).toLocaleDateString()} at {new Date(currentSubmission.submittedAt).toLocaleTimeString()}</p>
                       </div>
                    </div>

                    {currentSubmission.grade && (
                       <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-sm font-bold text-gray-300">Grade</span>
                             <span className="text-lg font-bold text-green-400">{currentSubmission.grade}/100</span>
                          </div>
                          {currentSubmission.feedback && (
                             <p className="text-sm text-gray-400 italic">"{currentSubmission.feedback}"</p>
                          )}
                       </div>
                    )}
                 </div>
               )}

               {/* Upload Section (Hidden if Graded) */}
               {(!currentSubmission || currentSubmission.status !== TaskStatus.GRADED) && (
                   <div className="mb-2">
                     <label className="block text-sm font-medium text-gray-300 mb-2">
                        {currentSubmission ? 'Update Submission' : 'Upload Project Assets'}
                     </label>
                     <div className="border-2 border-dashed border-white/10 bg-white/5 rounded-xl p-8 text-center hover:bg-white/10 hover:border-blue-500/50 transition-all group cursor-pointer relative">
                       <input 
                         type="file" 
                         id="project-upload" 
                         className="hidden" 
                         onChange={(e) => setFile(e.target.files?.[0] || null)}
                       />
                       <label htmlFor="project-upload" className="cursor-pointer flex flex-col items-center w-full h-full justify-center">
                         {file ? (
                           <>
                             <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-3 text-blue-400">
                               <File className="w-6 h-6" />
                             </div>
                             <span className="text-sm text-white font-medium break-all">{file.name}</span>
                             <span className="text-xs text-blue-400 mt-1">Click to replace</span>
                           </>
                         ) : (
                           <>
                             <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 text-gray-400 group-hover:scale-110 transition-transform">
                               <Upload className="w-6 h-6 group-hover:text-blue-400 transition-colors" />
                             </div>
                             <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                {currentSubmission ? 'Upload New Version' : 'Upload Report & Code (.zip)'}
                             </span>
                             <span className="text-xs text-gray-500 mt-1">Include both PDF report and source code</span>
                           </>
                         )}
                       </label>
                     </div>
                     {currentSubmission && !file && (
                        <p className="text-xs text-yellow-500/80 mt-2 flex items-center">
                           <AlertCircle className="w-3 h-3 mr-1.5" />
                           Uploading a new file will replace your previous submission.
                        </p>
                     )}
                   </div>
               )}
             </div>

             {/* Footer Buttons - Fixed at bottom */}
             <div className="p-5 border-t border-white/10 bg-white/5 flex justify-end gap-3 shrink-0">
                 <button 
                   onClick={() => { setSelectedProject(null); setFile(null); }}
                   className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
                 >
                   {currentSubmission && !file ? 'Close' : 'Cancel'}
                 </button>
                 
                 {(!currentSubmission || currentSubmission.status !== TaskStatus.GRADED) && (
                     <button 
                       onClick={handleSubmit}
                       disabled={!file || !!submittingId}
                       className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 text-sm transition-all"
                     >
                       {submittingId ? 'Uploading...' : (currentSubmission ? 'Update Submission' : 'Submit Work')}
                     </button>
                 )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
