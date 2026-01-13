import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Exam, ExamSubmission, User, ExamType, ExamCategory } from '../../types';
import { MessageSquare, PlayCircle, Mic, CheckCircle2, User as UserIcon } from 'lucide-react';
import { CodeEditor } from '../../components/CodeEditor';

export const StudentMockInterviews: React.FC<{ user: User }> = ({ user }) => {
  const [interviews, setInterviews] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, ExamSubmission>>({});
  const [activeSession, setActiveSession] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // To simulate interview progress
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const fetchInterviews = async () => {
    const data = await api.getExams(ExamCategory.MOCK_INTERVIEW);
    const results = await api.getExamResults(user.id);
    const subMap: Record<string, ExamSubmission> = {};
    results.forEach(r => subMap[r.examId] = r);
    setInterviews(data);
    setSubmissions(subMap);
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const startSession = (exam: Exam) => {
    setActiveSession(exam);
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  const submitSession = async () => {
    if (!activeSession) return;
    await api.submitExam({
        examId: activeSession.id,
        studentId: user.id,
        answers: answers
    });
    await fetchInterviews();
    setActiveSession(null);
  };

  const handleNext = () => {
    if (activeSession && currentQuestionIndex < activeSession.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
    } else {
        submitSession();
    }
  };

  if (activeSession) {
    const question = activeSession.questions[currentQuestionIndex];
    const isLast = currentQuestionIndex === activeSession.questions.length - 1;

    return (
       <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col">
          <div className="glass-panel p-6 rounded-2xl mb-6 flex justify-between items-center border border-pink-500/20">
             <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Mic className="w-5 h-5 text-pink-400" />
                    Interview Session
                </h2>
                <p className="text-xs text-gray-400">{activeSession.title}</p>
             </div>
             <div className="text-sm font-mono text-pink-300 bg-pink-500/10 px-3 py-1 rounded-lg border border-pink-500/20">
                Question {currentQuestionIndex + 1} of {activeSession.questions.length}
             </div>
          </div>

          <div className="flex-1 glass-panel p-8 rounded-2xl border border-white/10 overflow-y-auto flex flex-col">
             <div className="flex gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center border border-white/10 shrink-0">
                    <UserIcon className="w-6 h-6 text-gray-300" />
                </div>
                <div className="bg-white/5 p-6 rounded-2xl rounded-tl-none border border-white/5 text-gray-200 text-lg leading-relaxed flex-1">
                    {question.text}
                </div>
             </div>

             <div className="flex-1 flex flex-col">
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Your Response</label>
                {question.type === ExamType.CODING ? (
                    <div className="flex-1 min-h-[400px]">
                        <CodeEditor 
                            language={question.codeLanguage || 'javascript'}
                            value={answers[question.id] || ''}
                            onChange={(val) => setAnswers({...answers, [question.id]: val})}
                            allowRun={true}
                            height="100%"
                        />
                    </div>
                ) : (
                    <textarea 
                        className="glass-input w-full flex-1 p-4 rounded-xl resize-none text-gray-200 text-lg"
                        placeholder="Type your answer here..."
                        value={answers[question.id] || ''}
                        onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})}
                    />
                )}
             </div>
          </div>

          <div className="mt-6 flex justify-end">
             <button onClick={handleNext} className="px-8 py-3 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-500 shadow-lg shadow-pink-500/20 transition-all">
                {isLast ? 'Complete Interview' : 'Next Question'}
             </button>
          </div>
       </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-pink-500/20 rounded-xl border border-pink-500/30">
            <MessageSquare className="w-8 h-8 text-pink-400" />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-white">Mock Interviews</h1>
            <p className="text-gray-400">Simulate technical interviews with interactive coding & behavioral questions.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {interviews.length === 0 ? <div className="text-gray-500 italic">No interviews available.</div> : interviews.map(exam => {
            const submission = submissions[exam.id];
            return (
                <div key={exam.id} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-pink-500/30 transition-all group border-pink-500/10">
                    <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-pink-300 transition-colors">{exam.title}</h3>
                        <p className="text-gray-400 text-sm mb-3">{exam.description}</p>
                        <div className="flex items-center text-xs text-gray-500 gap-4">
                        <span className="bg-black/20 px-2 py-1 rounded">{exam.durationMinutes} mins</span>
                        <span className="bg-black/20 px-2 py-1 rounded">{exam.questions.length} Questions</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {submission ? (
                            <div className="px-5 py-2 bg-green-500/10 text-green-400 rounded-xl border border-green-500/20 flex items-center font-medium">
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Completed
                            </div>
                        ) : (
                            <button onClick={() => startSession(exam)} className="px-8 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-500 shadow-lg shadow-pink-500/20 font-semibold flex items-center">
                                <Mic className="w-5 h-5 mr-2" /> Start Interview
                            </button>
                        )}
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  );
};
