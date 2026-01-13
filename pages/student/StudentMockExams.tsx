
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Exam, ExamSubmission, User, ExamType, ExamCategory, MockExam } from '../../types';
import { Clock, CheckCircle, PlayCircle, Eye, X, Check, Brain } from 'lucide-react';
import { CodeEditor } from '../../components/CodeEditor';

export const StudentMockExams: React.FC<{ user: User }> = ({ user }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [instructorMockExams, setInstructorMockExams] = useState<MockExam[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, ExamSubmission>>({});
  
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [viewingResultExam, setViewingResultExam] = useState<Exam | null>(null);

  const fetchExams = async () => {
    // Fetch Online Mock Exams
    const data = await api.getExams(ExamCategory.MOCK_EXAM);
    const results = await api.getExamResults(user.id);
    const subMap: Record<string, ExamSubmission> = {};
    results.forEach(r => subMap[r.examId] = r);
    setExams(data);
    setSubmissions(subMap);

    // Fetch Instructor Recorded Mock Exams
    try {
        const recordedMocks = await api.getMockExams();
        setInstructorMockExams(recordedMocks);
    } catch (e) {
        console.error("Failed to fetch recorded mock exams", e);
    }
  };

  useEffect(() => {
    fetchExams();
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
  }, [activeExam]);

  const startExam = (exam: Exam) => {
    setActiveExam(exam);
    setTimeLeft(exam.durationMinutes * 60);
    const initialAnswers: Record<string, string> = {};
    exam.questions.forEach(q => {
        if (q.type === ExamType.CODING) {
            initialAnswers[q.id] = q.codeLanguage === 'javascript' 
              ? `// Practice solution for: ${q.text.substring(0, 30)}...`
              : `// Write your ${q.codeLanguage} code here...`;
        }
    });
    setAnswers(initialAnswers);
  };

  const submitExam = async () => {
    if (!activeExam) return;
    try {
      const submission = await api.submitExam({
        examId: activeExam.id,
        studentId: user.id,
        answers: answers,
      });
      await fetchExams();
      const examToCheck = activeExam;
      setActiveExam(null);
      // Auto open results for mocks usually
      setViewingResultExam(examToCheck);
    } catch (e) {
      alert('Error submitting mock exam');
    }
  };

  const openResults = (exam: Exam) => {
    setViewingResultExam(exam);
  };

  // Active Exam View (Reused logic)
  if (activeExam) {
    const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
      <div className="max-w-5xl mx-auto">
        <div className="sticky top-4 glass-panel p-4 rounded-2xl flex justify-between items-center mb-8 shadow-2xl z-20 border border-purple-500/20 bg-[#0f172a]">
          <div>
            <h2 className="font-bold text-xl text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                {activeExam.title}
            </h2>
            <p className="text-xs text-gray-400">Practice Mode • {activeExam.questions.length} Questions</p>
          </div>
          <div className={`text-xl font-mono font-bold px-4 py-2 rounded-xl border ${timeLeft < 60 ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : 'bg-purple-500/10 text-purple-400 border-purple-500/30'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="space-y-12 pb-24">
          {activeExam.questions.map((q, idx) => (
            <div key={q.id} className="glass-panel p-8 rounded-2xl border border-white/5">
              <div className="flex justify-between mb-4">
                <span className="font-bold text-gray-300 text-lg">Question {idx + 1}</span>
                <span className="text-sm bg-white/5 px-2 py-1 rounded text-gray-400 border border-white/5">{q.maxMarks} marks</span>
              </div>
              <p className="text-lg text-gray-200 font-medium mb-8 leading-relaxed">{q.text}</p>
              
              {q.type === ExamType.MCQ && q.options && (
                <div className="space-y-3">
                  {q.options.map((opt) => (
                    <label key={opt} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                      answers[q.id] === opt 
                        ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                        : 'bg-black/20 border-white/5 hover:bg-white/5'
                    }`}>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 ${answers[q.id] === opt ? 'border-purple-400' : 'border-gray-500'}`}>
                         {answers[q.id] === opt && <div className="w-2.5 h-2.5 rounded-full bg-purple-400"></div>}
                      </div>
                      <input type="radio" name={q.id} className="hidden" checked={answers[q.id] === opt} onChange={() => setAnswers({...answers, [q.id]: opt})} />
                      <span className={`text-base ${answers[q.id] === opt ? 'text-white' : 'text-gray-400'}`}>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
               {q.type === ExamType.DESCRIPTIVE && (
                <textarea rows={6} className="glass-input w-full p-4 rounded-xl resize-none text-gray-200" placeholder="Type answer..." value={answers[q.id] || ''} onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})} />
              )}
               {q.type === ExamType.CODING && (
                <div className="mt-4">
                    <CodeEditor language={q.codeLanguage || 'text'} value={answers[q.id] || ''} onChange={(val) => setAnswers({...answers, [q.id]: val})} allowRun={true} />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 p-4 glass-panel border-t border-white/10 md:pl-72 z-30 flex justify-end">
           <button onClick={submitExam} className="px-10 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 shadow-lg shadow-purple-500/20 transition-all">Finish Practice</button>
        </div>
      </div>
    );
  }

  // Result View (Simplified for Mock)
  if (viewingResultExam) {
    const submission = submissions[viewingResultExam.id];
    return (
      <div className="max-w-4xl mx-auto">
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Practice Results</h2>
            <button onClick={() => setViewingResultExam(null)} className="px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">Back</button>
         </div>
         <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-lg mb-8 flex justify-between items-center bg-gradient-to-br from-purple-500/10 to-transparent">
            <div>
               <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Score</p>
               <p className="text-5xl font-bold text-white">{submission?.score || 0} <span className="text-2xl text-gray-500">/ {viewingResultExam.questions.reduce((a,b)=>a+b.maxMarks,0)}</span></p>
            </div>
         </div>
         {/* Simplified question review for brevity - identical logic to StudentExams */}
         <div className="space-y-4">
            {viewingResultExam.questions.map((q, idx) => (
                <div key={q.id} className="glass-panel p-6 rounded-xl border border-white/5">
                    <div className="flex justify-between mb-2">
                        <span className="font-bold text-gray-300">Q{idx+1}: {q.text}</span>
                        <span className="text-xs text-gray-500">{q.maxMarks} marks</span>
                    </div>
                    {q.type === ExamType.MCQ && (
                        <div className="text-sm text-gray-400">
                             Correct: <span className="text-green-400 font-bold">{q.correctAnswer}</span> <br/>
                             Your Answer: <span className={`${submission?.answers[q.id] === q.correctAnswer ? 'text-green-400' : 'text-red-400'}`}>{submission?.answers[q.id]}</span>
                        </div>
                    )}
                </div>
            ))}
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
            <Brain className="w-8 h-8 text-purple-400" />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-white">Mock Exams</h1>
            <p className="text-gray-400">Practice your skills with self-paced quizzes.</p>
        </div>
      </div>
      
      <div className="grid gap-6">
        {/* Section 1: Online Self-Paced Mocks */}
        <div>
            <h2 className="text-xl font-bold text-gray-300 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                Online Practice
            </h2>
            <div className="grid gap-4">
                {exams.length === 0 ? <div className="text-gray-500 italic p-4 glass-panel border-dashed border-white/10 rounded-xl">No online mock exams available.</div> : exams.map(exam => {
                const submission = submissions[exam.id];
                return (
                    <div key={exam.id} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-purple-500/30 transition-all group border-purple-500/10">
                    <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">{exam.title}</h3>
                        <p className="text-gray-400 text-sm mb-3">{exam.description}</p>
                        <div className="flex items-center text-xs text-gray-500 gap-4">
                        <span className="bg-black/20 px-2 py-1 rounded">{exam.durationMinutes} mins</span>
                        <span className="bg-black/20 px-2 py-1 rounded">{exam.questions.length} Questions</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {submission ? (
                        <div className="flex items-center gap-4">
                            <span className="text-xl font-bold text-purple-400">{submission.score} pts</span>
                            <button onClick={() => openResults(exam)} className="glass-card px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/5">Review</button>
                        </div>
                        ) : (
                        <button onClick={() => startExam(exam)} className="px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 shadow-lg shadow-purple-500/20 font-semibold flex items-center">
                            <PlayCircle className="w-5 h-5 mr-2" /> Start Practice
                        </button>
                        )}
                    </div>
                    </div>
                );
                })}
            </div>
        </div>

        {/* Section 2: Instructor Recorded Mocks */}
        <div className="mt-8 pt-8 border-t border-white/10">
            <h2 className="text-xl font-bold text-gray-300 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-teal-400" />
                Instructor Evaluated Mocks
            </h2>
            <div className="grid gap-4">
                {instructorMockExams.length === 0 ? (
                    <div className="text-gray-500 italic p-4 glass-panel border-dashed border-white/10 rounded-xl">No instructor evaluations recorded yet.</div>
                ) : (
                    instructorMockExams.map(mock => (
                        <div key={mock.id} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-teal-500">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">{mock.title}</h3>
                                <p className="text-gray-400 text-xs mb-2">{new Date(mock.date).toLocaleDateString()}</p>
                                {mock.feedback && (
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5 mt-2">
                                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Feedback</p>
                                        <p className="text-sm text-gray-300 italic">"{mock.feedback}"</p>
                                    </div>
                                )}
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-3xl font-bold text-teal-400">{mock.score}</div>
                                <div className="text-xs text-gray-500 uppercase font-bold">/ {mock.totalMarks} Marks</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
