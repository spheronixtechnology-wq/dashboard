
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Exam, ExamType, User, Question, ExamCategory, ExamSubmission, MockExam } from '../../types';
import { Plus, Trash, Code, List, FileText, Sparkles, Loader2, CheckCircle2, Circle, Eye, ArrowLeft, User as UserIcon, X, Check, XCircle, RefreshCw, PenTool } from 'lucide-react';
import { CodeEditor } from '../../components/CodeEditor';

export const InstructorExams: React.FC<{ user: User }> = ({ user }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [viewState, setViewState] = useState<'LIST' | 'CREATE' | 'RESULTS' | 'MOCK_EXAMS'>('LIST');
  const [examCategoryFilter, setExamCategoryFilter] = useState<ExamCategory>(ExamCategory.EXAM); // Default to Official Exams
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Mock Exams State (Manual)
  const [mockExams, setMockExams] = useState<MockExam[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [mockForm, setMockForm] = useState({
      studentId: '',
      title: '',
      score: 0,
      totalMarks: 100,
      feedback: ''
  });
  
  // Results View State
  const [selectedExamForResults, setSelectedExamForResults] = useState<Exam | null>(null);
  const [examSubmissions, setExamSubmissions] = useState<(ExamSubmission & { studentName?: string })[]>([]);
  const [viewingSubmission, setViewingSubmission] = useState<(ExamSubmission & { studentName?: string }) | null>(null);
  
  // AI State
  const [showAIModal, setShowAIModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState('Intermediate');

  // Manual Creation State
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Question Builder State
  const [newQText, setNewQText] = useState('');
  const [newQType, setNewQType] = useState<ExamType>(ExamType.MCQ);
  const [newQLang, setNewQLang] = useState('javascript');
  const [isPublishing, setIsPublishing] = useState(false);
  
  // MCQ Specific State
  const [mcqOptions, setMcqOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0);

  const fetchExams = async () => {
      setIsRefreshing(true);
      try {
        const data = await api.getExams();
        console.log("Fetched exams:", data); // Debug log
        setExams(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch exams:", error);
      } finally {
        setIsRefreshing(false);
      }
  };

  const fetchMockExams = async () => {
      try {
          const [mocks, studs] = await Promise.all([
              api.getMockExams(),
              api.getStudents()
          ]);
          setMockExams(mocks);
          setStudents(studs);
      } catch (e) {
          console.error("Failed to fetch mock data", e);
      }
  };

  useEffect(() => {
    if (viewState === 'LIST') {
      fetchExams();
    } else if (viewState === 'MOCK_EXAMS') {
      fetchMockExams();
    }
  }, [viewState]);

  const handleRefresh = () => {
      if (viewState === 'MOCK_EXAMS') fetchMockExams();
      else fetchExams();
  };

  const handleCreateMockExam = async () => {
      if (!mockForm.studentId || !mockForm.title) {
          alert("Please select a student and enter a title.");
          return;
      }
      try {
          await api.createMockExam(mockForm);
          setMockForm({ studentId: '', title: '', score: 0, totalMarks: 100, feedback: '' });
          fetchMockExams();
          alert("Mock exam record added!");
      } catch (e) {
          alert("Failed to add mock exam");
      }
  };

  const handleDeleteMockExam = async (id: string) => {
      if (!confirm("Delete this record?")) return;
      try {
          await api.deleteMockExamEntry(id);
          setMockExams(prev => prev.filter(m => m.id !== id));
      } catch (e) {
          alert("Failed to delete");
      }
  };

  const handleDeleteExam = async (examId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
          try {
              // Optimistic update
              const previousExams = [...exams];
              setExams(prev => prev.filter(ex => ex.id !== examId));
              
              if (viewState === 'RESULTS' && selectedExamForResults?.id === examId) {
                  setViewState('LIST');
              }
              
              await api.deleteExam(examId);
          } catch (error: any) {
              console.error("Delete failed:", error);
              // Revert optimistic update
              fetchExams();
              alert(error.message || "Failed to delete exam.");
          }
      }
  };

  const handleToggleStatus = async (exam: Exam, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = exam.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    
    // Optimistic Update
    setExams(prev => prev.map(ex => 
      ex.id === exam.id ? { ...ex, status: newStatus } : ex
    ));

    try {
      await api.updateExam(exam.id, { status: newStatus });
    } catch (error: any) {
      console.error("Status update failed:", error);
      alert("Failed to update status");
      fetchExams(); // Revert
    }
  };

  const handleMcqOptionChange = (idx: number, val: string) => {
    const newOptions = [...mcqOptions];
    newOptions[idx] = val;
    setMcqOptions(newOptions);
  };

  const addQuestion = () => {
    if (!newQText.trim()) {
        alert("Please enter the question text.");
        return;
    }
    if (newQType === ExamType.MCQ && mcqOptions.some(opt => !opt.trim())) {
        alert("Please fill in all MCQ options.");
        return;
    }

    const q: Question = {
      id: Math.random().toString(),
      type: newQType,
      text: newQText,
      maxMarks: 10,
      options: newQType === ExamType.MCQ ? [...mcqOptions] : undefined,
      correctAnswer: newQType === ExamType.MCQ ? mcqOptions[correctOptionIdx] : undefined,
      codeLanguage: newQType === ExamType.CODING ? newQLang : undefined,
    };
    
    setQuestions([...questions, q]);
    
    // Reset Builder
    setNewQText('');
    setMcqOptions(['', '', '', '']);
    setCorrectOptionIdx(0);
  };

  const handleCreate = async () => {
    // Validation
    if (!title.trim()) {
        alert("Please enter an Exam Title at the top of the form.");
        return;
    }
    if (questions.length === 0) {
        alert("Please add at least one question to the exam.");
        return;
    }

    setIsPublishing(true);
    try {
        await api.createExam({
          title,
          description: 'Instructor created exam',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 86400000).toISOString(),
          durationMinutes: 60,
          questions,
          createdBy: user.id,
          category: examCategoryFilter, // Use the selected filter as category
          status: 'PUBLISHED'
        });
        
        setViewState('LIST');
        setTitle('');
        setQuestions([]);
        alert("Exam published successfully!");
    } catch (e: any) {
        console.error("Failed to create exam:", e);
        alert(e.message || "Failed to publish exam. Please check your connection and try again.");
    } finally {
        setIsPublishing(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!aiTopic) return;
    setIsGenerating(true);
    try {
        const generated = await api.generateQuestions(aiTopic, aiCount, aiDifficulty);
        setQuestions([...questions, ...generated]);
        setShowAIModal(false);
    } catch (e: any) {
        alert(e.message || "Failed to generate questions. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleViewResults = async (exam: Exam) => {
    setSelectedExamForResults(exam);
    setViewState('RESULTS');
    setViewingSubmission(null);
    try {
        const subs = await api.getExamSubmissionsForInstructor(exam.id);
        setExamSubmissions(subs);
    } catch (e) {
        console.error(e);
        alert("Failed to load submissions.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-white">Exam Management</h1>
            <div className="flex gap-4 mt-4">
                <button 
                    onClick={() => setViewState('LIST')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewState === 'LIST' || viewState === 'CREATE' || viewState === 'RESULTS' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    Online Exams
                </button>
                <button 
                    onClick={() => setViewState('MOCK_EXAMS')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewState === 'MOCK_EXAMS' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    Mock Exams (Manual Entry)
                </button>
            </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleRefresh}
                className="p-2.5 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/5"
                title="Refresh List"
            >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            {viewState === 'LIST' && (
                <button onClick={() => setViewState('CREATE')} className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-5 py-2.5 rounded-xl hover:from-teal-400 hover:to-emerald-500 shadow-lg shadow-teal-500/20 transition-all font-medium flex items-center gap-2">
                <Plus className="w-5 h-5" /> Create Exam
                </button>
            )}
        </div>
      </div>

      {viewState === 'MOCK_EXAMS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Add New Mock Exam Form */}
              <div className="glass-panel p-6 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <PenTool className="w-5 h-5 text-purple-400" />
                      Record Mock Exam Result
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="lg:col-span-1">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Student</label>
                          <select 
                              className="glass-input w-full p-2.5 rounded-xl bg-slate-800 text-white"
                              value={mockForm.studentId}
                              onChange={e => setMockForm({...mockForm, studentId: e.target.value})}
                          >
                              <option value="">Select Student...</option>
                              {students.map(s => (
                                  <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                              ))}
                          </select>
                      </div>
                      <div className="lg:col-span-1">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Exam Title</label>
                          <input 
                              className="glass-input w-full p-2.5 rounded-xl"
                              placeholder="e.g. Mock Interview 1"
                              value={mockForm.title}
                              onChange={e => setMockForm({...mockForm, title: e.target.value})}
                          />
                      </div>
                      <div className="lg:col-span-1 flex gap-2">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Score</label>
                              <input 
                                  type="number"
                                  className="glass-input w-full p-2.5 rounded-xl"
                                  value={mockForm.score}
                                  onChange={e => setMockForm({...mockForm, score: Number(e.target.value)})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total</label>
                              <input 
                                  type="number"
                                  className="glass-input w-full p-2.5 rounded-xl"
                                  value={mockForm.totalMarks}
                                  onChange={e => setMockForm({...mockForm, totalMarks: Number(e.target.value)})}
                              />
                          </div>
                      </div>
                      <div className="lg:col-span-1 flex items-end">
                          <button 
                              onClick={handleCreateMockExam}
                              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20"
                          >
                              Add Record
                          </button>
                      </div>
                  </div>
                  <div className="mt-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Feedback / Remarks</label>
                      <textarea 
                          className="glass-input w-full p-3 rounded-xl h-20 resize-none"
                          placeholder="Optional feedback..."
                          value={mockForm.feedback}
                          onChange={e => setMockForm({...mockForm, feedback: e.target.value})}
                      />
                  </div>
              </div>

              {/* List */}
              <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
                  <table className="w-full text-left">
                      <thead className="bg-white/5 text-gray-400 text-xs uppercase font-bold">
                          <tr>
                              <th className="p-4">Date</th>
                              <th className="p-4">Student</th>
                              <th className="p-4">Title</th>
                              <th className="p-4">Score</th>
                              <th className="p-4">Feedback</th>
                              <th className="p-4 text-right">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {mockExams.length === 0 ? (
                              <tr><td colSpan={6} className="p-8 text-center text-gray-500">No records found.</td></tr>
                          ) : mockExams.map(exam => (
                              <tr key={exam.id} className="hover:bg-white/5 transition-colors">
                                  <td className="p-4 text-gray-400 text-sm">{new Date(exam.date).toLocaleDateString()}</td>
                                  <td className="p-4 font-medium text-white">{exam.student?.name || 'Unknown'}</td>
                                  <td className="p-4 text-gray-300">{exam.title}</td>
                                  <td className="p-4">
                                      <span className="text-purple-400 font-bold">{exam.score}</span>
                                      <span className="text-gray-600 text-xs"> / {exam.totalMarks}</span>
                                  </td>
                                  <td className="p-4 text-sm text-gray-400 max-w-xs truncate">{exam.feedback || '-'}</td>
                                  <td className="p-4 text-right">
                                      <button 
                                          onClick={() => handleDeleteMockExam(exam.id)}
                                          className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                                      >
                                          <Trash className="w-4 h-4" />
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {viewState === 'RESULTS' && selectedExamForResults && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button 
                    onClick={() => setViewState('LIST')}
                    className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-white">Results: {selectedExamForResults.title}</h2>
                        <p className="text-sm text-gray-400">{examSubmissions.length} Students Submitted</p>
                    </div>
                </div>
                
                <button 
                    onClick={(e) => handleDeleteExam(selectedExamForResults.id, e)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg border border-red-500/20 transition-all font-medium"
                >
                    <Trash className="w-4 h-4" /> Delete Exam
                </button>
            </div>

            <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                                <th className="p-4 font-semibold">#</th>
                                <th className="p-4 font-semibold">Student Name</th>
                                <th className="p-4 font-semibold">Submitted At</th>
                                <th className="p-4 font-semibold">Score</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {examSubmissions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                                        No submissions found for this exam yet.
                                    </td>
                                </tr>
                            ) : (
                                examSubmissions.map((sub, index) => (
                                    <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 text-gray-500 font-mono text-sm">{index + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                                    {sub.studentName?.charAt(0) || <UserIcon className="w-4 h-4" />}
                                                </div>
                                                <span className="font-bold text-gray-200">{sub.studentName || 'Unknown Student'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm">
                                            {new Date(sub.submittedAt).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className="text-lg font-bold text-cyan-400">{sub.score}</span>
                                            <span className="text-gray-600 text-xs ml-1">/ {selectedExamForResults.questions.reduce((a, b) => a + b.maxMarks, 0)}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${
                                                sub.isGraded ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                            }`}>
                                                {sub.isGraded ? 'Graded' : 'Pending Review'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button 
                                                onClick={() => setViewingSubmission(sub)}
                                                className="text-sm bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-all"
                                            >
                                                View Answers
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* Submission Detail Modal */}
      {viewingSubmission && selectedExamForResults && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto p-4 md:p-6 animate-in fade-in duration-200">
           <div className="max-w-4xl mx-auto bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl relative">
              <div className="sticky top-0 z-20 bg-[#0f172a]/95 backdrop-blur-md border-b border-white/10 p-6 flex justify-between items-center rounded-t-2xl">
                 <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Student Submission
                        {viewingSubmission.isGraded ? (
                            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded border border-green-500/30">Graded</span>
                        ) : (
                            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded border border-yellow-500/30">Pending</span>
                        )}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">Student: <span className="text-white font-semibold">{viewingSubmission.studentName}</span> • Score: <span className="text-cyan-400 font-bold">{viewingSubmission.score}</span></p>
                 </div>
                 <button onClick={() => setViewingSubmission(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="p-6 space-y-6">
                 {selectedExamForResults.questions.map((q, idx) => {
                     const studentAnswer = viewingSubmission.answers[q.id];
                     const isCorrect = q.type === ExamType.MCQ && studentAnswer === q.correctAnswer;
                     
                     return (
                        <div key={q.id} className="glass-panel p-6 rounded-xl border border-white/5 relative overflow-hidden bg-black/20">
                           {/* Indicator Strip */}
                           {q.type === ExamType.MCQ && (
                               <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}></div>
                           )}

                           <div className="flex justify-between mb-3 pl-3">
                              <h3 className="font-bold text-gray-200">Q{idx + 1}: {q.text}</h3>
                              <span className="text-xs text-gray-500">{q.maxMarks} Marks</span>
                           </div>

                           <div className="pl-3">
                               {q.type === ExamType.MCQ && (
                                   <div className="space-y-2">
                                       <div className="flex items-center gap-2 text-sm text-gray-400">
                                           <span>Student Answer:</span>
                                           <span className={`font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                               {studentAnswer || '(No Answer)'}
                                           </span>
                                           {isCorrect ? <Check className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                       </div>
                                       {!isCorrect && (
                                           <div className="flex items-center gap-2 text-sm text-gray-400">
                                               <span>Correct Answer:</span>
                                               <span className="text-green-400 font-bold">{q.correctAnswer}</span>
                                           </div>
                                       )}
                                   </div>
                               )}

                               {q.type === ExamType.DESCRIPTIVE && (
                                   <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-gray-300 italic text-sm">
                                       {studentAnswer || '(No Answer)'}
                                   </div>
                               )}

                               {q.type === ExamType.CODING && (
                                   <div className="mt-2">
                                       <div className="text-xs text-gray-500 uppercase font-bold mb-1">Code Solution</div>
                                       <CodeEditor 
                                           language={q.codeLanguage || 'text'}
                                           value={studentAnswer || '// No code submitted'}
                                           onChange={() => {}}
                                           readOnly={true}
                                           allowRun={true}
                                           height="200px"
                                       />
                                   </div>
                               )}
                           </div>
                        </div>
                     );
                 })}
              </div>
              
              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
                  <button onClick={() => setViewingSubmission(null)} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium">
                      Close Review
                  </button>
              </div>
           </div>
        </div>
      )}

      {viewState === 'CREATE' && (
        <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
           <h2 className="text-xl font-bold mb-6 text-white">New Exam Wizard</h2>
           
           <div className="mb-6">
             <label className="block text-sm font-medium text-gray-400 mb-2">Exam Title <span className="text-red-400">*</span></label>
             <input 
                className="glass-input w-full p-3 rounded-xl text-lg focus:ring-2 focus:ring-teal-500/50" 
                placeholder="e.g. Mid-Term Assessment" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                autoFocus
             />
           </div>
           
           <div className="border-t border-b border-white/10 py-6 my-6 space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="font-semibold text-gray-300">Question Builder</h3>
                 <button 
                   onClick={() => setShowAIModal(true)}
                   className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all"
                 >
                   <Sparkles className="w-4 h-4" /> Generate with AI
                 </button>
              </div>

              {/* Question Editor */}
              <div className="flex flex-col gap-4 p-6 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-16 bg-gradient-to-br from-teal-500/10 to-transparent rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
                 
                 <div className="flex gap-4 relative z-10">
                    <div className="w-1/3">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Question Type</label>
                        <select 
                            className="glass-input p-3 rounded-xl w-full bg-slate-800 text-gray-200" 
                            value={newQType} 
                            onChange={e => setNewQType(e.target.value as ExamType)}
                        >
                            <option value={ExamType.MCQ}>Multiple Choice</option>
                            <option value={ExamType.DESCRIPTIVE}>Descriptive</option>
                            <option value={ExamType.CODING}>Coding Challenge</option>
                        </select>
                    </div>
                    {newQType === ExamType.CODING && (
                      <div className="w-1/3">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Language</label>
                        <select 
                            className="glass-input p-3 rounded-xl w-full bg-slate-800 text-gray-200"
                            value={newQLang}
                            onChange={e => setNewQLang(e.target.value)}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="c">C</option>
                            <option value="cpp">C++</option>
                        </select>
                      </div>
                    )}
                 </div>
                 
                 <div className="relative z-10">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Question Text</label>
                    <textarea 
                        className="glass-input w-full p-4 rounded-xl h-24 resize-none focus:ring-2 focus:ring-teal-500/50 transition-all" 
                        placeholder="Type your question here..." 
                        value={newQText} 
                        onChange={e => setNewQText(e.target.value)}
                    />
                 </div>

                 {/* MCQ Builder */}
                 {newQType === ExamType.MCQ && (
                    <div className="mt-2 bg-black/20 p-4 rounded-xl border border-white/5">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center justify-between">
                            <span>Answer Options</span>
                            <span className="text-[10px] text-teal-400 font-normal">Select the radio button for correct answer</span>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mcqOptions.map((opt, i) => (
                                <div key={i} className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${correctOptionIdx === i ? 'bg-teal-500/10 border-teal-500/50' : 'border-white/5 hover:bg-white/5'}`}>
                                    <button 
                                        onClick={() => setCorrectOptionIdx(i)}
                                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${correctOptionIdx === i ? 'border-teal-400 text-teal-400' : 'border-gray-500 text-transparent hover:border-gray-300'}`}
                                    >
                                        <div className={`w-3 h-3 rounded-full ${correctOptionIdx === i ? 'bg-teal-400' : ''}`}></div>
                                    </button>
                                    <input 
                                        className="bg-transparent border-none outline-none text-sm text-gray-200 w-full placeholder-gray-600"
                                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                        value={opt}
                                        onChange={e => handleMcqOptionChange(i, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                 )}
                 
                 <div className="flex justify-end pt-2">
                    <button 
                        onClick={addQuestion} 
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/20 font-bold transition-all flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Add to Exam
                    </button>
                 </div>
              </div>

              {/* Added Questions List */}
              <div className="space-y-3 mt-6">
                <h3 className="font-semibold text-gray-300 mb-4">Added Questions ({questions.length})</h3>
                {questions.length === 0 && (
                    <div className="text-center p-8 border-2 border-dashed border-white/5 rounded-xl bg-white/[0.02]">
                        <p className="text-gray-500">No questions added yet.</p>
                        <p className="text-xs text-gray-600">Use the builder above or the AI generator.</p>
                    </div>
                )}
                {questions.map((q, i) => (
                  <div key={q.id} className="bg-black/20 p-5 rounded-xl flex justify-between items-start border border-white/5 hover:border-white/20 transition-all group">
                     <div className="flex items-start flex-1">
                        <span className="font-mono text-gray-500 mr-4 mt-0.5 w-6">{i+1}.</span>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold flex items-center gap-1 ${
                                    q.type === ExamType.MCQ ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' :
                                    q.type === ExamType.CODING ? 'bg-pink-500/10 text-pink-300 border-pink-500/20' :
                                    'bg-orange-500/10 text-orange-300 border-orange-500/20'
                                }`}>
                                    {q.type === ExamType.MCQ && <List className="w-3 h-3" />}
                                    {q.type === ExamType.DESCRIPTIVE && <FileText className="w-3 h-3" />}
                                    {q.type === ExamType.CODING && <Code className="w-3 h-3" />}
                                    {q.type}
                                </span>
                                {q.codeLanguage && <span className="text-[10px] text-gray-500 uppercase">{q.codeLanguage}</span>}
                            </div>
                            <p className="text-gray-200 font-medium mb-3">{q.text}</p>
                            
                            {q.type === ExamType.MCQ && (
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {q.options?.map((opt, idx) => (
                                        <div key={idx} className={`flex items-center gap-2 ${opt === q.correctAnswer ? "text-green-400 font-bold" : "text-gray-500"}`}>
                                            {opt === q.correctAnswer ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5 opacity-50" />}
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                     </div>
                     <button onClick={() => setQuestions(questions.filter(qi => qi.id !== q.id))} className="text-gray-600 hover:text-red-400 p-2 hover:bg-white/5 rounded-lg transition-colors ml-4">
                        <Trash className="w-4 h-4" />
                     </button>
                  </div>
                ))}
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button onClick={() => setViewState('LIST')} className="px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium">Cancel</button>
              <button 
                onClick={handleCreate} 
                disabled={isPublishing}
                className={`bg-teal-600 text-white px-8 py-3 rounded-xl hover:bg-teal-500 shadow-lg shadow-teal-500/20 font-bold transition-all transform hover:-translate-y-0.5 ${isPublishing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isPublishing ? 'Publishing...' : 'Publish Exam'}
              </button>
           </div>
        </div>
      )}

      {viewState === 'LIST' && (
        <div className="grid gap-4">
          {exams.length === 0 ? (
              <div className="text-center p-12 glass-panel rounded-2xl border border-dashed border-white/10">
                  <p className="text-gray-500">No exams created yet.</p>
              </div>
          ) : exams.map(exam => (
            <div key={exam.id} className="glass-panel p-6 rounded-xl border border-white/10 shadow-lg hover:border-white/20 transition-all group flex justify-between items-center">
              <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg text-white group-hover:text-teal-300 transition-colors">{exam.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                      exam.status === 'PUBLISHED' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {exam.status || 'DRAFT'}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-3 text-sm text-gray-400">
                    <span className="bg-white/5 px-2 py-1 rounded">{exam.questions.length} Questions</span>
                    <span className="bg-white/5 px-2 py-1 rounded">{exam.durationMinutes} mins</span>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => handleToggleStatus(exam, e)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      exam.status === 'PUBLISHED'
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20'
                        : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                    }`}
                  >
                    {exam.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button 
                    onClick={() => handleViewResults(exam)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg border border-blue-500/30 transition-all font-medium"
                  >
                      <Eye className="w-4 h-4" /> View Results
                  </button>
                  <button 
                    onClick={(e) => handleDeleteExam(exam.id, e)}
                    className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg border border-red-500/20 transition-all"
                    title="Delete Exam"
                  >
                      <Trash className="w-4 h-4" />
                  </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Generation Modal (Kept for optional use) */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
           <div className="glass-panel p-6 rounded-2xl w-full max-w-md border border-purple-500/30">
              <div className="flex items-center gap-2 mb-6">
                 <Sparkles className="w-5 h-5 text-purple-400" />
                 <h2 className="text-xl font-bold text-white">Generate Questions</h2>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm text-gray-400 mb-1">Topic</label>
                    <input 
                      value={aiTopic}
                      onChange={e => setAiTopic(e.target.value)}
                      className="glass-input w-full p-2 rounded-lg"
                      placeholder="e.g. React Hooks, Data Structures..."
                    />
                 </div>
                 <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm text-gray-400 mb-1">Count</label>
                        <input 
                           type="number" 
                           min="1" max="10"
                           value={aiCount}
                           onChange={e => setAiCount(Number(e.target.value))}
                           className="glass-input w-full p-2 rounded-lg"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
                        <select 
                           value={aiDifficulty}
                           onChange={e => setAiDifficulty(e.target.value)}
                           className="glass-input w-full p-2 rounded-lg bg-slate-800"
                        >
                           <option>Beginner</option>
                           <option>Intermediate</option>
                           <option>Advanced</option>
                        </select>
                    </div>
                 </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                 <button 
                   onClick={() => setShowAIModal(false)}
                   className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleGenerateQuestions}
                   disabled={isGenerating || !aiTopic}
                   className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-500 flex items-center gap-2 disabled:opacity-50"
                 >
                   {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                   {isGenerating ? 'Generating...' : 'Generate'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
