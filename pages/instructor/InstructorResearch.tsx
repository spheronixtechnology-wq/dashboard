
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, ResearchSubmission, ResearchStatus } from '../../types';
import { FlaskConical, Download, CheckCircle, MessageSquare, User as UserIcon, Clock, ChevronRight, X } from 'lucide-react';

export const InstructorResearch: React.FC<{ user: User }> = ({ user }) => {
  const [submissions, setSubmissions] = useState<ResearchSubmission[]>([]);
  const [selectedItem, setSelectedItem] = useState<ResearchSubmission | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getResearch();
      console.log("Research Data fetched:", data);
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching research:", e);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReview = async (status: ResearchStatus) => {
    if (!selectedItem) return;
    await api.reviewResearchSubmission(selectedItem.id, status, feedback);
    setFeedback('');
    setSelectedItem(null);
    fetchData();
  };

  const openItem = (item: ResearchSubmission) => {
    setSelectedItem(item);
    setFeedback(item.instructorFeedback || '');
  };

  const handleDownload = async (fileUrl: string) => {
      if (fileUrl.startsWith('http')) {
          window.open(fileUrl, '_blank');
      } else {
          try {
              const filename = fileUrl.split('/').pop() || 'document';
              await api.downloadResearch(selectedItem?.id || '', filename);
          } catch (e) {
              alert("Failed to download file. It might not exist on the server.");
          }
      }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
    } catch (e) {
        return 'Error';
    }
  };

  const getFileName = (url: string | undefined) => {
      if (!url) return 'Document';
      try {
          return url.split('/').pop() || 'Document';
      } catch (e) {
          return 'Document';
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
       {/* List Column */}
       <div className="lg:col-span-1 glass-panel rounded-xl border border-white/10 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/5">
             <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                <FlaskConical className="w-5 h-5" />
             </div>
             <div>
                <h2 className="font-bold text-gray-200">Innovations</h2>
                <p className="text-[10px] text-gray-400">Student Proposals</p>
             </div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-3 space-y-2 custom-scrollbar">
             {loading ? <div className="p-4 text-center text-gray-500">Loading...</div> : 
              submissions.length === 0 ? <div className="p-4 text-center text-gray-500">No submissions found.</div> :
              submissions.map(item => (
                <div 
                  key={item.id}
                  onClick={() => openItem(item)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    selectedItem?.id === item.id 
                    ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]' 
                    : 'hover:bg-white/5 border-transparent'
                  }`}
                >
                   <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-semibold text-sm line-clamp-1 ${selectedItem?.id === item.id ? 'text-amber-300' : 'text-gray-300'}`}>{item.title}</h3>
                      {item.status === ResearchStatus.PENDING && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                   </div>
                   <div className="flex items-center gap-2 text-xs text-gray-500">
                      <UserIcon className="w-3 h-3" /> {item.studentName}
                   </div>
                </div>
              ))
             }
          </div>
       </div>

       {/* Detail Column */}
       <div className="lg:col-span-2 glass-panel rounded-xl border border-white/10 flex flex-col overflow-hidden">
          {selectedItem ? (
             <div className="flex flex-col h-full">
                <div className="p-8 border-b border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent relative">
                   <div className="flex justify-between items-start mb-4">
                      <h2 className="text-2xl font-bold text-white pr-4">{selectedItem.title}</h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                          selectedItem.status === ResearchStatus.APPROVED ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                          selectedItem.status === ResearchStatus.REVIEWED ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                          'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                      }`}>
                         {selectedItem.status}
                      </span>
                   </div>
                   <div className="flex items-center gap-6 text-sm text-gray-400">
                      <span className="flex items-center gap-2"><UserIcon className="w-4 h-4 text-amber-500" /> {selectedItem.studentName}</span>
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cyan-500" /> 
                        {formatDate(selectedItem.submittedAt)}
                      </span>
                   </div>
                </div>

                <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                   <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Abstract / Description</h3>
                   <p className="text-gray-300 leading-loose text-lg whitespace-pre-line mb-8">
                      {selectedItem.abstract}
                   </p>

                   {selectedItem.fileUrl && (
                      <div className="mb-8">
                         <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Attachments</h3>
                         <button 
                            onClick={() => handleDownload(selectedItem.fileUrl!)}
                            className="flex items-center p-4 bg-black/20 rounded-xl border border-white/10 w-fit hover:bg-black/40 hover:border-amber-500/30 transition-all group"
                         >
                            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center mr-3 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                               <Download className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                               <p className="text-sm font-bold text-gray-200 group-hover:text-white line-clamp-1">{getFileName(selectedItem.fileUrl)}</p>
                               <p className="text-xs text-gray-500 group-hover:text-gray-400">Click to download</p>
                            </div>
                         </button>
                      </div>
                   )}

                   <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center">
                         <MessageSquare className="w-4 h-4 mr-2" /> Instructor Review
                      </h3>
                      <textarea 
                        className="glass-input w-full p-4 rounded-xl resize-none mb-4"
                        rows={3}
                        placeholder="Write feedback for the student..."
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                      />
                      <div className="flex gap-3">
                         <button 
                           onClick={() => handleReview(ResearchStatus.REJECTED)}
                           disabled={submitting}
                           className="flex-1 py-2 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors"
                         >
                            {submitting ? 'Processing...' : 'Reject'}
                         </button>
                         <button 
                           onClick={() => handleReview(ResearchStatus.APPROVED)}
                           disabled={submitting}
                           className="flex-1 py-2 bg-green-600/80 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors"
                         >
                            {submitting ? 'Processing...' : 'Approve Idea'}
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                <div className="p-6 rounded-full bg-white/5 mb-4">
                   <ChevronRight className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-gray-500">Select an innovation to view details</p>
             </div>
          )}
       </div>
    </div>
  );
};
