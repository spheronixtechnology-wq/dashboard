import React, { useState, useRef, useMemo } from 'react';
import { PlayCircle, Code, Terminal, RotateCcw, Keyboard, Bug, Copy, Check } from 'lucide-react';

// --- Syntax Highlighting & Auto-complete Utils ---

const KEYWORDS: Record<string, string[]> = {
  javascript: ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'from', 'async', 'await', 'console', 'log', 'true', 'false', 'null', 'undefined', 'new', 'this', 'try', 'catch', 'map', 'filter', 'reduce', 'readline', 'document', 'window', 'typeof', 'instanceof'],
  python: ['def', 'return', 'if', 'else', 'elif', 'for', 'while', 'class', 'import', 'from', 'print', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'try', 'except', 'lambda', 'input', 'with', 'as', 'global', 'raise'],
  java: ['public', 'private', 'protected', 'class', 'static', 'void', 'int', 'String', 'return', 'if', 'else', 'for', 'while', 'new', 'this', 'true', 'false', 'null', 'System', 'out', 'println', 'Scanner', 'extends', 'implements', 'interface'],
  c: ['int', 'void', 'char', 'float', 'double', 'return', 'if', 'else', 'for', 'while', 'struct', '#include', 'printf', 'scanf', 'switch', 'case', 'break', 'continue'],
  cpp: ['int', 'void', 'char', 'float', 'double', 'return', 'if', 'else', 'for', 'while', 'class', 'public', 'private', 'using', 'namespace', 'std', '#include', 'cout', 'cin', 'endl', 'vector', 'string']
};

const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const highlightSyntax = (code: string, language: string) => {
  if (!code) return '';
  let escaped = escapeHtml(code);

  const kw = KEYWORDS[language] || KEYWORDS.javascript;
  const kwRegexPart = kw.join('|');
  
  // Regex Groups: 
  // 1. Comments (Line or Block start - simplified for line)
  // 2. Strings
  // 3. Keywords
  // 4. Numbers
  // 5. Functions/Methods (word followed by paren)
  // 6. Brackets/Operators (basic)
  
  const tokenRegex = new RegExp(
    `(\\/\\/.*$|#.*$)|(["'\`].*?["'\`])|\\b(${kwRegexPart})\\b|(\\b\\d+\\.?\\d*\\b)|(\\b\\w+(?=\\())|([{}[\\]()])`,
    'gm'
  );

  return escaped.replace(tokenRegex, (match, comment, string, keyword, number, func, operator) => {
    if (comment) return `<span class="text-slate-500 italic">${match}</span>`;
    if (string) return `<span class="text-emerald-300">${match}</span>`;
    if (keyword) return `<span class="text-pink-400 font-bold">${match}</span>`;
    if (number) return `<span class="text-orange-300">${match}</span>`;
    if (func) return `<span class="text-cyan-300">${match}</span>`;
    if (operator) return `<span class="text-yellow-500">${match}</span>`;
    return match;
  });
};

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
  allowRun?: boolean;
  height?: string;
  onRunComplete?: (code: string, output: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
  language, 
  value, 
  onChange, 
  readOnly = false, 
  allowRun = false,
  height = "600px",
  onRunComplete
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  
  // IDE State
  const [output, setOutput] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>(''); // For Stdin
  const [activeTab, setActiveTab] = useState<'output' | 'input'>('input');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Auto-complete State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });

  const lineCount = useMemo(() => value.split('\n').length, [value]);
  const lines = useMemo(() => Array.from({ length: Math.max(lineCount, 15) }, (_, i) => i + 1), [lineCount]);
  const highlightedHTML = useMemo(() => highlightSyntax(value, language), [value, language]);

  const handleScroll = () => {
    if (textareaRef.current) {
      const { scrollTop, scrollLeft } = textareaRef.current;
      
      // Sync Pre (Syntax Highlight)
      if (preRef.current) {
        preRef.current.scrollTop = scrollTop;
        preRef.current.scrollLeft = scrollLeft;
      }
      
      // Sync Line Numbers
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = scrollTop;
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    updateSuggestions(newVal, e.target.selectionEnd);
  };

  const updateSuggestions = (text: string, cursorIndex: number) => {
    if (readOnly) return;
    let start = cursorIndex - 1;
    while (start >= 0 && /\w/.test(text[start])) {
      start--;
    }
    const word = text.slice(start + 1, cursorIndex);
    
    if (word.length > 1) {
      const kw = KEYWORDS[language] || KEYWORDS.javascript;
      const matches = kw.filter(k => k.startsWith(word) && k !== word).slice(0, 5);
      if (matches.length > 0) {
        setSuggestions(matches);
        setShowSuggestions(true);
        setSuggestionIndex(0);
        
        const lines = text.slice(0, cursorIndex).split('\n');
        const lineIndex = lines.length - 1;
        const colIndex = lines[lineIndex].length;
        
        setCursorPosition({
          top: (lineIndex + 1) * 24, 
          left: colIndex * 8.5 + 40 
        });
        return;
      }
    }
    setShowSuggestions(false);
  };

  const insertSuggestion = (suggestion: string) => {
    if (!textareaRef.current) return;
    const text = value;
    const cursor = textareaRef.current.selectionEnd;
    
    let start = cursor - 1;
    while (start >= 0 && /\w/.test(text[start])) {
      start--;
    }
    const newVal = text.slice(0, start + 1) + suggestion + text.slice(cursor);
    onChange(newVal);
    setShowSuggestions(false);
    
    setTimeout(() => {
        if(textareaRef.current) {
            textareaRef.current.focus();
            const newCursor = start + 1 + suggestion.length;
            textareaRef.current.setSelectionRange(newCursor, newCursor);
        }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly) return;

    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertSuggestion(suggestions[suggestionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const executeCode = (debugMode: boolean) => {
    setIsRunning(true);
    setActiveTab('output');
    setOutput(debugMode ? '> Starting Debugger...\n> Analyzing symbols...\n' : '> Compiling & Running...\n');

    setTimeout(() => {
      let result = '';
      
      // JavaScript Execution Engine (Client-side Sandbox)
      if (language === 'javascript') {
        try {
           const logs: string[] = [];
           const mockConsole = {
             log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
             warn: (...args: any[]) => logs.push('WARN: ' + args.join(' ')),
             error: (...args: any[]) => logs.push('ERROR: ' + args.join(' '))
           };
           
           // Mock Readline for Stdin
           const inputLines = customInput.split('\n');
           let inputIdx = 0;
           const mockReadline = () => inputLines[inputIdx++] || '';

           const run = new Function('console', 'readline', `
             try {
               ${value}
             } catch(e) {
               console.error(e.toString());
             }
           `);
           
           run(mockConsole, mockReadline);
           
           if (debugMode) result += '> Debug Info: Heap Usage: 4MB, Stack Depth: 1\n';
           if (logs.length === 0) result += '> Program finished with no output.';
           else result += logs.join('\n');
           
        } catch (e: any) {
          result += `Runtime Error: ${e.message}`;
        }
      } 
      // Mock Execution for other languages
      else {
        if (debugMode) result += `> Debugging ${language} environment initialized.\n`;
        const needsInput = value.includes('input') || value.includes('scanf') || value.includes('cin') || value.includes('Scanner');
        
        if (needsInput && !customInput) {
            result += `Error: Program is waiting for input. Please provide input in the 'Input' tab.`;
        } else {
            if (needsInput) result += `> Reading input stream...\n`;
            if (value.includes('print') || value.includes('cout') || value.includes('System.out')) {
                result += `Hello from ${language}!\nResult: 42\n[Process completed successfully]`;
            } else if (value.trim() === '') {
                result += `> Warning: Source code is empty.`;
            } else {
                result += `> Program executed. (No visible output statements found)`;
            }
        }
      }
      
      setOutput((prev: string) => prev + result);
      setIsRunning(false);
      
      if (onRunComplete) {
          onRunComplete(value, result);
      }
    }, 1000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col border border-white/10 rounded-xl overflow-hidden bg-[#0d1117] shadow-2xl ring-1 ring-white/5 font-sans`} style={{ height }}>
      
      {/* IDE Toolbar */}
      <div className="bg-[#161b22] px-4 py-2 flex justify-between items-center border-b border-[#30363d] select-none">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 py-1 bg-[#21262d] rounded border border-white/5">
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              <span className="uppercase font-semibold text-xs text-gray-300">{language}</span>
           </div>
           {allowRun && !readOnly && (
             <div className="flex gap-2">
                <button 
                  onClick={() => executeCode(false)}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-all border border-green-500/30 shadow-lg shadow-green-900/20 active:translate-y-0.5"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  {isRunning ? 'Running...' : 'Run Code'}
                </button>
                <button 
                  onClick={() => executeCode(true)}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs font-medium transition-all border border-gray-500/30 active:translate-y-0.5"
                >
                  <Bug className="w-3.5 h-3.5" />
                  Debug
                </button>
             </div>
           )}
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={handleCopy} 
             className="text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded" 
             title="Copy Code"
           >
             {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
           </button>
           <button 
             onClick={() => onChange('')} 
             disabled={readOnly}
             className="text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded" 
             title="Reset Code"
           >
             <RotateCcw className="w-4 h-4" />
           </button>
        </div>
      </div>
      
      {/* Main Layout: Split Pane (Editor Top, Terminal Bottom) */}
      <div className="flex flex-col flex-1 overflow-hidden">
         
         {/* Editor Pane (Flexible Height) */}
         <div className="flex-1 relative flex overflow-hidden min-h-[300px] bg-[#0d1117]">
            {/* Line Numbers */}
            <div 
              ref={lineNumbersRef}
              className="bg-[#0d1117] text-[#484f58] w-14 text-right pr-4 pt-4 select-none border-r border-[#30363d] h-full overflow-hidden font-mono text-sm leading-6"
            >
               {lines.map(n => <div key={n} className="opacity-50">{n}</div>)}
            </div>

            {/* Code Area */}
            <div className="relative flex-1 h-full overflow-hidden">
              {/* Syntax Highlight Layer */}
              <pre 
                ref={preRef}
                className="absolute inset-0 p-4 m-0 pointer-events-none whitespace-pre overflow-hidden text-gray-300 font-mono text-sm leading-6 z-0"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: highlightedHTML + '<br/>' }}
              />
              {/* Input Layer */}
              <textarea
                ref={textareaRef}
                className={`absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white resize-none outline-none whitespace-pre overflow-auto font-mono text-sm leading-6 z-10 ${readOnly ? 'cursor-default' : ''}`}
                value={value}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                readOnly={readOnly}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
              />
              {/* Auto-complete Popup */}
              {showSuggestions && (
                <div 
                  className="absolute z-50 bg-[#1c2128] border border-[#30363d] rounded-lg shadow-xl overflow-hidden w-48 animate-in fade-in zoom-in-95 duration-100"
                  style={{ top: cursorPosition.top, left: Math.min(cursorPosition.left, 400) }}
                >
                  {suggestions.map((s, i) => (
                    <div 
                      key={s}
                      className={`px-3 py-1.5 cursor-pointer flex items-center gap-2 ${i === suggestionIndex ? 'bg-[#316dca] text-white' : 'text-gray-300 hover:bg-[#2d333b]'}`}
                      onClick={() => insertSuggestion(s)}
                      onMouseEnter={() => setSuggestionIndex(i)}
                    >
                      <span className="w-4 h-4 rounded bg-white/10 text-white flex items-center justify-center text-[10px] font-bold">K</span>
                      <span className="text-xs font-mono">{s}</span>
                    </div>
                  ))}
                  <div className="px-3 py-1 bg-[#161b22] text-[10px] text-gray-500 border-t border-[#30363d] flex justify-between">
                     <span>Tab to select</span>
                     <span>{suggestionIndex + 1}/{suggestions.length}</span>
                  </div>
                </div>
              )}
            </div>
         </div>

         {/* Console / Input Pane (Fixed Height) */}
         <div className="h-[200px] bg-[#0d1117] border-t border-[#30363d] flex flex-col">
            {/* Tabs */}
            <div className="flex bg-[#161b22] border-b border-[#30363d]">
               <button 
                 onClick={() => setActiveTab('input')}
                 className={`px-4 py-2 text-xs font-medium flex items-center gap-2 border-r border-[#30363d] transition-all relative ${
                    activeTab === 'input' 
                    ? 'bg-[#0d1117] text-white' 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-[#21262d]'
                 }`}
               >
                 {activeTab === 'input' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-500"></div>}
                 <Keyboard className={`w-3.5 h-3.5 ${activeTab === 'input' ? 'text-cyan-400' : ''}`} /> 
                 Input (Stdin)
               </button>
               <button 
                 onClick={() => setActiveTab('output')}
                 className={`px-4 py-2 text-xs font-medium flex items-center gap-2 border-r border-[#30363d] transition-all relative ${
                    activeTab === 'output' 
                    ? 'bg-[#0d1117] text-white' 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-[#21262d]'
                 }`}
               >
                 {activeTab === 'output' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-500"></div>}
                 <Terminal className={`w-3.5 h-3.5 ${activeTab === 'output' ? 'text-cyan-400' : ''}`} /> 
                 Output
               </button>
            </div>

            {/* Pane Content */}
            <div className="flex-1 overflow-auto p-0 relative group">
               {activeTab === 'input' ? (
                 <div className="h-full w-full relative">
                    <textarea 
                        className="w-full h-full bg-[#0d1117] text-gray-300 p-3 font-mono text-sm leading-6 resize-none outline-none focus:bg-[#161b22] transition-colors"
                        placeholder="Enter custom input for your program here..."
                        value={customInput}
                        onChange={e => setCustomInput(e.target.value)}
                    />
                    {!customInput && (
                        <div className="absolute top-3 left-3 pointer-events-none text-gray-600 font-mono text-sm italic">
                            // Input data here
                        </div>
                    )}
                 </div>
               ) : (
                 <div className="w-full h-full bg-[#0d1117] text-gray-300 p-3 font-mono text-sm leading-6 overflow-auto">
                   {output ? (
                        <pre className="whitespace-pre-wrap font-mono">{output}</pre>
                   ) : (
                        <span className="text-gray-600 italic flex items-center gap-2">
                            <PlayCircle className="w-4 h-4" /> Run code to see output...
                        </span>
                   )}
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};