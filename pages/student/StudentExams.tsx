
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Exam, ExamSubmission, User, ExamType, ExamCategory, UserRole } from '../../types';
import { Clock, AlertTriangle, CheckCircle, PlayCircle, Eye, X, Check } from 'lucide-react';
import { CodeEditor } from '../../components/CodeEditor';

export const StudentExams: React.FC<{ user: User }> = ({ user }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, ExamSubmission>>({});
  
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [viewingResultExam, setViewingResultExam] = useState<Exam | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<ExamSubmission | null>(null);

  // Look for this block near the top of the StudentExams component
const fetchExams = async () => {
  try {
    const data = await api.getExams(ExamCategory.EXAM, UserRole.STUDENT);
    const results = await api.getExamResults(user.id);
    const subMap: Record<string, ExamSubmission> = {};
    
    // Explicitly cast 'r' to any to avoid the '_id' does not exist error
      results.forEach((r: any) => {
        // Robustly find the exam ID
        let key = r.examId;
        
        // Handle case where examId might be an object (populated)
        if (typeof key === 'object' && key !== null) {
             key = key._id || key.id || key.toString();
        }
        
        // Fallback to submission ID if no examId found (rare)
        if (!key) key = r._id || r.id;
        
        if (key) {
            // Ensure key is a string
            subMap[String(key)] = r;
        }
      });
    
    setExams(Array.isArray(data) ? data : []);
    setSubmissions(subMap);
  } catch (error) {
    console.error("Student failed to fetch exams:", error);
  }
};

  useEffect(() => {
    fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeExam) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExam]);

const startExam = async (exam: Exam) => {
    // 1. Double-check if the user has already submitted this exam
    // We check both .id and ._id to match your fetchExams logic
    const hasSubmittedLocal = submissions[exam.id] || submissions[(exam as any)._id] || (exam as any).hasSubmitted;
    
    if (hasSubmittedLocal) {
      alert("You have already submitted this exam. Please view your results from the dashboard.");
      return;
    }

    // 1b. Server-side check (Prevent Bypass)
    try {
        const check = await api.checkExamStatus(exam.id || (exam as any)._id);
        if (check.hasSubmitted) {
            alert("You have already submitted this exam. Please refresh the page.");
            fetchExams(); // Refresh to update UI
            return;
        }
    } catch (e) {
        console.error("Failed to check exam status", e);
        // Fallback: If check fails (network), rely on local state or block?
        // Let's allow proceed if network error but log it, or block safe?
        // Blocking safe is better.
        alert("Could not verify exam status. Please try again.");
        return;
    }

    // 2. Set the active exam and timer
    setActiveExam(exam);
    setTimeLeft(exam.durationMinutes * 60);

  // 3. Initialize answers (MCQ/Descriptive start empty, Coding starts with templates)
  const initialAnswers: Record<string, string> = {};
  exam.questions.forEach(q => {
    if (q.type === ExamType.CODING) {
      initialAnswers[q.id] = q.codeLanguage === 'javascript' 
        ? `// Solution for: ${q.text.substring(0, 30)}...\n\nfunction solution() {\n  // Write your code here\n  console.log("Hello");\n}\n\nsolution();`
        : q.codeLanguage === 'python'
        ? `# Solution for: ${q.text.substring(0, 30)}...\n\ndef solution():\n    # Write your code here\n    print("Hello")\n\nsolution()`
        : `// Write your ${q.codeLanguage} code here...`;
    }
  });
  
  setAnswers(initialAnswers);
};

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inside StudentExams.tsx
const submitExam = async () => {
  if (!activeExam || isSubmitting) return;
  
  // Capture the exam being submitted before we clear activeExam
  const currentExam = activeExam;
  
  setIsSubmitting(true);
  try {
    const payload = {
        examId: activeExam.id || (activeExam as any)._id,
        studentId: user.id,
        answers: answers,
    };
    console.log("Submitting Exam Payload:", payload); // Debug Log

    const submission = await api.submitExam(payload);
    
    // 1. IMMEDIATE OPTIMISTIC UPDATE
    // Update local state immediately so we don't need to wait for fetchExams
    setSubmissions(prev => ({
      ...prev,
      [activeExam.id]: submission,
      [activeExam.id || '']: submission
    }));

    // 2. IMMEDIATE UI TRANSITION
    // Transition to results view using the direct submission response
    if (currentExam) {
      // Set submission FIRST to ensure it's ready when the view switches
      setViewingSubmission(submission);
      setViewingResultExam(currentExam);
    }
    
    // Clear active exam LAST
    setActiveExam(null);

    // 3. BACKGROUND SYNC
    // Fetch latest data in background without blocking the UI
    fetchExams().catch(err => console.error("Background fetch failed:", err));
    
  } catch (e: any) {
    console.error("Exam submission failed:", e);
    const message = e.response?.data?.message || "Error submitting";
    alert(message);

    // CRITICAL: Reset state on error so user isn't stuck
    if (message.includes("already submitted")) {
      setActiveExam(null);
      fetchExams();
    }
  } finally {
    // THIS ENSURES THE BUTTON STOPS SPINNING
    setIsSubmitting(false); 
  }
};

  const openResults = (exam: Exam) => {
    const sub = submissions[exam.id] || submissions[(exam as any)._id];
    setViewingSubmission(sub);
    setViewingResultExam(exam);
  };

  // Render: Taking Exam Interface
  if (activeExam) {
    const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
      <div className="max-w-6xl mx-auto">
        <div className="sticky top-4 glass-panel p-4 rounded-2xl flex justify-between items-center mb-8 shadow-2xl z-20 border border-cyan-500/20">
          <div>
            <h2 className="font-bold text-xl text-white">{activeExam.title}</h2>
            <p className="text-xs text-gray-400">Answer all questions before time runs out</p>
          </div>
          <div className={`text-xl font-mono font-bold px-4 py-2 rounded-xl border ${timeLeft < 300 ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="space-y-12 pb-24">
          {activeExam.questions.map((q, idx) => (
            <div key={q.id} className="glass-panel p-8 rounded-2xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-600"></div>
              
              <div className="flex justify-between mb-4">
                <span className="font-bold text-gray-300 flex items-center text-lg">
                    Question {idx + 1}
                    {q.type === ExamType.CODING && <span className="ml-3 text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30 font-bold uppercase">Coding Challenge</span>}
                </span>
                <span className="text-sm bg-white/5 px-2 py-1 rounded text-gray-400 border border-white/5">{q.maxMarks} marks</span>
              </div>
              <p className="text-lg text-gray-200 font-medium mb-8 whitespace-pre-wrap leading-relaxed">{q.text}</p>
              
              {q.type === ExamType.MCQ && q.options && (
                <div className="space-y-3">
                  {q.options.map((opt) => (
                    <label key={opt} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                      answers[q.id] === opt 
                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                        : 'bg-black/20 border-white/5 hover:bg-white/5'
                    }`}>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 transition-colors ${answers[q.id] === opt ? 'border-cyan-400' : 'border-gray-500'}`}>
                         {answers[q.id] === opt && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>}
                      </div>
                      <input
                        type="radio"
                        name={q.id}
                        className="hidden"
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswers({...answers, [q.id]: opt})}
                      />
                      <span className={`text-base ${answers[q.id] === opt ? 'text-white' : 'text-gray-400'}`}>{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === ExamType.DESCRIPTIVE && (
                <textarea
                  rows={6}
                  className="glass-input w-full p-4 rounded-xl resize-none text-gray-200"
                  placeholder="Type your answer here..."
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                />
              )}

              {q.type === ExamType.CODING && (
                <div className="mt-4">
                    <CodeEditor 
                        language={q.codeLanguage || 'text'} 
                        value={answers[q.id] || ''} 
                        onChange={(val) => setAnswers({...answers, [q.id]: val})} 
                        allowRun={true}
                    />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 p-4 glass-panel border-t border-white/10 md:pl-72 z-30">
           <div className="max-w-6xl mx-auto flex justify-end">
              <button 
                onClick={submitExam}
                disabled={isSubmitting}
                className={`px-10 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all transform ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:from-cyan-500 hover:to-blue-500 hover:-translate-y-1'}`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Exam'}
              </button>
           </div>
        </div>
      </div>
    );
  }

  // Render: View Results Interface
  if (viewingResultExam) {
    const submission = viewingSubmission || submissions[viewingResultExam.id] || submissions[(viewingResultExam as any)._id];
    
    // Robust Loading State
    if (!submission) {
        return (
            <div className="w-full min-h-screen bg-[#0d1117] flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 font-medium animate-pulse">Processing Results...</p>
                <button 
                    onClick={() => setViewingResultExam(null)}
                    className="mt-8 text-sm text-red-400 hover:text-red-300 underline"
                >
                    Cancel & Return to Dashboard
                </button>
            </div>
        );
    }

    return (
      <div className="w-full min-h-screen bg-[#0d1117]">
         <div className="w-full flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-[#0d1117]/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-4">
                   <h2 className="text-2xl font-bold text-white tracking-tight">{viewingResultExam.title}</h2>
                   <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border tracking-wider ${submission.isGraded ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                       {submission.isGraded ? 'Graded' : 'Pending Review'}
                   </span>
                </div>
                <button 
                  onClick={() => { setViewingResultExam(null); setViewingSubmission(null); fetchExams(); }}
                  className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-300 hover:text-white transition-all font-medium flex items-center"
                >
                  <X className="w-4 h-4 mr-2" /> Close
                </button>
            </div>

            <div className="flex-1 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1920px] mx-auto w-full">
                {/* Left: Score Card */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-900/20 to-transparent relative overflow-hidden shadow-2xl">
                       <div className="absolute top-0 right-0 p-4 opacity-10">
                           <CheckCircle className="w-48 h-48 text-cyan-400" />
                       </div>
                       <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-4">Performance</h3>
                       <div className="flex items-baseline mb-2">
                          <span className="text-7xl font-bold text-white tracking-tighter">{submission.score || 0}</span>
                          <span className="text-2xl text-gray-500 ml-2 font-medium">/ {viewingResultExam.questions.reduce((a,b) => a+b.maxMarks, 0)}</span>
                       </div>
                       <p className="text-gray-400 text-sm mb-8">Total Score Achieved</p>
                       
                       <div className="space-y-4">
                           <div>
                               <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
                                   <span>Accuracy</span>
                                   <span className="text-white font-bold">
                                       {Math.round((submission.score || 0) / viewingResultExam.questions.reduce((a,b) => a+b.maxMarks, 0) * 100)}%
                                   </span>
                               </div>
                               <div className="w-full bg-black/40 rounded-full h-3 border border-white/5">
                                   <div 
                                       className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full shadow-[0_0_15px_rgba(34,211,238,0.4)]" 
                                       style={{ width: `${Math.round((submission.score || 0) / viewingResultExam.questions.reduce((a,b) => a+b.maxMarks, 0) * 100)}%` }}
                                   ></div>
                               </div>
                           </div>
                       </div>
                    </div>
                </div>

                {/* Right: Questions List */}
                <div className="lg:col-span-9 space-y-6">
                    {viewingResultExam.questions.map((q, idx) => {
                      const userAnswer = submission.answers?.[q.id];
                      const isCorrect = q.type === ExamType.MCQ && userAnswer === q.correctAnswer;
                      
                      return (
                        <div key={q.id} className="glass-panel p-8 rounded-3xl border border-white/5 bg-[#161b22] relative overflow-hidden group shadow-lg">
                           {/* Status Indicator */}
                           <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                               q.type !== ExamType.MCQ ? 'bg-blue-500' :
                               isCorrect ? 'bg-green-500' : 'bg-red-500'
                           }`}></div>
                           
                           <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 pl-4">
                              <div className="flex-1">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Question {idx + 1}</span>
                                  <p className="text-xl md:text-2xl text-gray-200 font-medium leading-relaxed">{q.text}</p>
                              </div>
                              <span className="shrink-0 text-xs font-bold bg-white/5 text-gray-300 px-4 py-2 rounded-lg border border-white/5 h-fit">
                                  {q.maxMarks} Marks
                              </span>
                           </div>

                           <div className="pl-4">
                               {q.type === ExamType.MCQ && (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                    {q.options?.map(opt => (
                                       <div key={opt} className={`flex items-center p-4 rounded-xl border transition-all ${
                                         opt === q.correctAnswer ? 'bg-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 
                                         (opt === userAnswer && opt !== q.correctAnswer) ? 'bg-red-500/10 border-red-500/30' : 
                                         'bg-black/20 border-white/5 opacity-60'
                                       }`}>
                                         <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-4 shrink-0 ${
                                            opt === q.correctAnswer ? 'border-green-500 bg-green-500 text-black' :
                                            (opt === userAnswer) ? 'border-red-500 bg-red-500 text-white' :
                                            'border-gray-600'
                                         }`}>
                                             {opt === q.correctAnswer && <Check className="w-3.5 h-3.5" />}
                                             {opt === userAnswer && opt !== q.correctAnswer && <X className="w-3.5 h-3.5" />}
                                         </div>
                                         <span className={`text-base ${
                                           opt === q.correctAnswer ? 'text-green-300 font-medium' :
                                           (opt === userAnswer) ? 'text-red-300' : 'text-gray-400'
                                         }`}>
                                           {opt}
                                         </span>
                                       </div>
                                    ))}
                                 </div>
                               )}

                               {q.type === ExamType.CODING && (
                                  <div className="mt-8 bg-[#0d1117] rounded-2xl overflow-hidden border border-white/10 shadow-inner">
                                    <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex justify-between items-center">
                                         <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Solution</span>
                                         <span className="text-xs text-blue-400 flex items-center font-mono"><code className="mr-2 text-blue-500">{'</>'}</code> {q.codeLanguage}</span>
                                     </div>
                                    <div className="p-1">
                                        <CodeEditor 
                                           language={q.codeLanguage || 'text'}
                                           value={userAnswer || '// No code submitted'}
                                           onChange={() => {}}
                                           readOnly={true}
                                           height="400px"
                                        />
                                    </div>
                                  </div>
                               )}

                               {q.type === ExamType.DESCRIPTIVE && (
                                  <div className="mt-6">
                                     <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Your Answer</h4>
                                     <div className="bg-black/20 p-6 rounded-2xl text-gray-300 italic border border-white/5 whitespace-pre-wrap leading-relaxed text-lg">
                                       {userAnswer || 'No answer provided'}
                                     </div>
                                  </div>
                               )}
                           </div>
                        </div>
                      );
                    })}
                </div>
            </div>
         </div>
      </div>
    );
  }

  // Render: Dashboard View
  // Helper to check submission status
  const checkIsSubmitted = (exam: Exam) => {
      const submission = submissions[exam.id] || submissions[(exam as any)._id];
      return (exam as any).hasSubmitted || (exam as any).isSubmitted || !!submission;
  };

  const pendingExams = exams.filter(e => !checkIsSubmitted(e));
  const completedExams = exams.filter(e => checkIsSubmitted(e));

  const ExamCard = ({ exam, isCompletedList }: { exam: Exam, isCompletedList: boolean }) => {
      const submission = submissions[exam.id] || submissions[(exam as any)._id];
      const isSubmitted = checkIsSubmitted(exam);
      const score = (exam as any).score !== undefined ? (exam as any).score : (submission?.score);
      
      const now = new Date();
      const start = new Date(exam.startTime);
      const end = new Date(exam.endTime);
      
      let status = 'Upcoming';
      if (isSubmitted) {
        status = 'Completed';
      }
      else if (now > end) status = 'Closed';
      else if (now >= start && now <= end) status = 'Active';

      return (
        <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/20 transition-all group">
          <div>
            <div className="flex items-center gap-3 mb-3">
               <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">{exam.title}</h3>
               <span className={`px-2 py-1 text-xs rounded-md font-bold uppercase tracking-wide border ${
                  status === 'Active' ? 'bg-green-500/20 text-green-300 border-green-500/30 animate-pulse' :
                  status === 'Completed' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                  status === 'Pending Review' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                  status === 'Closed' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
               }`}>
                 {status}
               </span>
            </div>
            <p className="text-gray-400 text-sm mb-3">{exam.description}</p>
            <div className="flex items-center text-xs text-gray-500 gap-4">
               <span className="flex items-center bg-black/20 px-2 py-1 rounded"><Clock className="w-3 h-3 mr-1"/> {exam.durationMinutes} mins</span>
               <span className="flex items-center bg-black/20 px-2 py-1 rounded">End: {end.toLocaleDateString()} {end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {isCompletedList && (
               <div className="flex items-center gap-4">
                 <div className="text-right">
                   <p className="text-xs text-gray-500 uppercase">Score</p>
                   <p className="text-2xl font-bold text-cyan-400">
                      {score !== undefined ? score : <span className="text-gray-600 text-base">Pending</span>}
                   </p>
                 </div>
                 <button 
                    onClick={() => openResults(exam)}
                    className="glass-card border border-white/10 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500/30 px-5 py-2.5 rounded-xl text-sm font-medium flex items-center transition-all"
                 >
                    <Eye className="w-4 h-4 mr-2" />
                    View Results
                 </button>
               </div>
             )}
             
             {!isCompletedList && status === 'Active' && (
               <button 
                 onClick={() => startExam(exam)}
                 className="flex items-center px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all font-semibold transform hover:-translate-y-0.5"
               >
                 <PlayCircle className="w-5 h-5 mr-2" />
                 Start Exam
               </button>
             )}

             {!isCompletedList && status === 'Upcoming' && (
                <button disabled className="px-6 py-2 bg-white/5 text-gray-500 border border-white/5 rounded-xl cursor-not-allowed">
                   Not Started
                </button>
             )}
             
             {!isCompletedList && status === 'Closed' && (
                <div className="text-red-400 flex items-center text-sm font-medium bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
                   <AlertTriangle className="w-4 h-4 mr-2" /> Missed
                </div>
             )}
          </div>
        </div>
      );
  };

  return (
    <div className="space-y-12">
      <div>
          <h1 className="text-3xl font-bold text-white mb-6">Pending Exams</h1>
          <div className="grid gap-6">
            {pendingExams.length === 0 ? (
                <div className="glass-card p-8 text-center text-gray-500 border-dashed border-white/10 rounded-2xl">
                    No pending examinations.
                </div>
            ) : pendingExams.map(exam => (
                <ExamCard key={exam.id} exam={exam} isCompletedList={false} />
            ))}
          </div>
      </div>

      <div>
          <h1 className="text-3xl font-bold text-white mb-6">Completed Exams</h1>
          <div className="grid gap-6">
            {completedExams.length === 0 ? (
                <div className="glass-card p-8 text-center text-gray-500 border-dashed border-white/10 rounded-2xl">
                    No completed examinations yet.
                </div>
            ) : completedExams.map(exam => (
                <ExamCard key={exam.id} exam={exam} isCompletedList={true} />
            ))}
          </div>
      </div>
    </div>
  );
};
