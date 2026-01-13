import React, { useState } from 'react';
import { User } from '../../types';
import { Code, PlayCircle, Terminal, RotateCcw, Save } from 'lucide-react';
import { CodeEditor } from '../../components/CodeEditor';
import { api } from '../../services/api';

export const StudentPlayground: React.FC<{ user: User }> = ({ user }) => {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(`// Welcome to the Coding Playground
// Write, run, and practice your code here!

function hello() {
  console.log("Hello, World!");
}

hello();`);
  const [output, setOutput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setLanguage(lang);
    if (lang === 'javascript') {
      setCode('// JavaScript Playground\nconsole.log("Hello from JS!");');
    } else if (lang === 'python') {
      setCode('# Python Playground\nprint("Hello from Python!")');
    } else if (lang === 'java') {
      setCode('// Java Playground\nSystem.out.println("Hello from Java!");');
    } else if (lang === 'cpp') {
      setCode('// C++ Playground\ncout << "Hello from C++" << endl;');
    } else {
      setCode('// Write your code here...');
    }
  };

  const handleRunComplete = (sourceCode: string, result: string) => {
    setOutput(result);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.submitTask({
        taskId: 'PLAYGROUND_SAVE',
        studentId: user.id,
        studentName: user.name,
        fileUrl: 'playground_snippet',
        code: code,
        language: language,
        output: output
      });
      alert("Code saved to your profile!");
    } catch (e) {
      console.error("Failed to save", e);
      alert("Failed to save code. (Backend might not be supporting playground saves yet)");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Code className="w-8 h-8 text-cyan-400" />
            Coding Playground
          </h1>
          <p className="text-gray-400 mt-1">Experiment with code in a safe environment.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            className="bg-black/30 text-sm text-gray-300 border border-white/10 rounded-xl px-4 py-2.5 focus:border-cyan-500 outline-none transition-all"
            value={language}
            onChange={handleLanguageChange}
          >
             <option value="javascript">JavaScript</option>
             <option value="python">Python</option>
             <option value="java">Java</option>
             <option value="cpp">C++</option>
          </select>
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all font-medium"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Snippet'}
          </button>
        </div>
      </div>

      <div className="flex-1 glass-panel p-1 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
         <CodeEditor 
            language={language}
            value={code}
            onChange={setCode}
            allowRun={true}
            onRunComplete={handleRunComplete}
            height="100%"
         />
      </div>
    </div>
  );
};
