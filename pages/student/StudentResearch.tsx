
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, ResearchSubmission, ResearchStatus } from '../../types';
import { FlaskConical, Plus, Upload, FileText, CheckCircle, Clock, Lightbulb, X, File } from 'lucide-react';

export const StudentResearch: React.FC<{ user: User }> = ({ user }) => {
  const [submissions, setSubmissions] = useState<ResearchSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const fetchSubmissions = async () => {
    try {
      const data = await api.getResearch();
      setSubmissions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !abstract) return;

    try {
      await api.createResearch(title, abstract, file);
      setIsModalOpen(false);
      setTitle('');
      setAbstract('');
      setFile(null);
      fetchSubmissions();
    } catch (e) {
      alert("Failed to submit proposal");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
               <FlaskConical className="w-8 h-8 text-amber-400" />
               Research & Innovations
            </h1>
            <p className="text-gray-400 mt-2">Submit your innovative ideas and research topics for review.</p>
         </div>
         <button 
           onClick={() => setIsModalOpen(true)}
           className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-2.5 rounded-xl hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/20 font-bold transition-all flex items-center"
         >
            <Plus className="w-5 h-5 mr-2" />
            New Proposal
         </button>
      </div>

      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading innovations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {submissions.length === 0 ? (
             <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-20 text-yellow-500" />
                <p>No research proposals submitted yet.</p>
                <p className="text-xs text-gray-600">Click "New Proposal" to share your brilliant ideas!</p>
             </div>
           ) : submissions.map(item => (
             <div key={item.id} className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-amber-500/30 transition-all flex flex-col group relative">
                <div className="absolute top-4 right-4">
                   <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wide border ${
                      item.status === ResearchStatus.APPROVED ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                      item.status === ResearchStatus.REJECTED ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                      item.status === ResearchStatus.REVIEWED ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                      'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                   }`}>
                      {item.status}
                   </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-100 group-hover:text-amber-400 transition-colors pr-16">{item.title}</h3>
                <p className="text-xs text-gray-500 mb-4">{new Date(item.submittedAt).toLocaleDateString()}</p>
                
                <p className="text-sm text-gray-400 line-clamp-4 leading-relaxed mb-6 flex-1">
                   {item.abstract}
                </p>

                {item.fileUrl && (
                   <div className="mb-4 flex items-center gap-2 p-2 bg-black/20 rounded-lg border border-white/5">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-300 truncate flex-1">{item.fileUrl}</span>
                   </div>
                )}

                {item.instructorFeedback && (
                   <div className="mt-auto pt-4 border-t border-white/5">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">Feedback</p>
                      <p className="text-sm text-gray-300 italic">"{item.instructorFeedback}"</p>
                   </div>
                )}
             </div>
           ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
           <div className="glass-panel rounded-2xl max-w-xl w-full p-0 shadow-2xl border border-white/20 relative">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                 <h2 className="text-xl font-bold text-white">Submit New Idea</h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Project Title / Innovation Name</label>
                    <input 
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="glass-input w-full p-3 rounded-xl text-white" 
                      placeholder="e.g. AI-driven Waste Management"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Abstract / Description</label>
                    <textarea 
                      required
                      rows={6}
                      value={abstract}
                      onChange={e => setAbstract(e.target.value)}
                      className="glass-input w-full p-3 rounded-xl text-white resize-none" 
                      placeholder="Describe your innovation, methodology, and expected outcome..."
                    />
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Attach Supporting Document (Optional)</label>
                    <div className="border-2 border-dashed border-white/10 bg-white/5 rounded-xl p-6 text-center hover:bg-white/10 hover:border-amber-500/50 transition-all cursor-pointer relative">
                       <input 
                          type="file" 
                          id="rd-upload"
                          className="hidden" 
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                       />
                       <label htmlFor="rd-upload" className="cursor-pointer flex flex-col items-center w-full justify-center">
                          {file ? (
                             <>
                                <FileText className="w-8 h-8 text-amber-400 mb-2" />
                                <span className="text-sm text-white font-medium">{file.name}</span>
                             </>
                          ) : (
                             <>
                                <Upload className="w-8 h-8 text-gray-500 mb-2" />
                                <span className="text-sm text-gray-400">Click to upload PDF/DOCX</span>
                             </>
                          )}
                       </label>
                    </div>
                 </div>

                 <div className="flex justify-end pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white mr-2">Cancel</button>
                    <button type="submit" className="px-8 py-2.5 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-500 shadow-lg shadow-amber-500/20 transition-all">Submit</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
