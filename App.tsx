
import React, { useState, useEffect, useRef } from 'react';
import { 
  PodcastNoteSession, 
  Highlight, 
  UserNote, 
  HighlightType 
} from './types';
import { 
  performRealTranscription, 
  analyzeTranscript, 
  queryTerminology 
} from './services/geminiService';
import { 
  formatTime, 
  saveToHistory, 
  getHistory, 
  deleteHistoryItem, 
  downloadText 
} from './utils';

// Components
import AudioPlayer from './components/AudioPlayer';
import HighlightList from './components/HighlightList';
import Transcript from './components/Transcript';
import TerminologyQuery from './components/TerminologyQuery';
import NoteEditor from './components/NoteEditor';
import HistoryList from './components/HistoryList';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [session, setSession] = useState<PodcastNoteSession | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedRange, setSelectedRange] = useState<{ text: string; timestamp: number } | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  const handleGenerate = async () => {
    if (!url.trim()) return;
    if (!url.includes('xiaoyuzhoufm.com')) {
      alert('请粘贴有效的小宇宙节目链接');
      return;
    }

    setIsLoading(true);
    setLoadingStep('正在连接小宇宙服务器...');
    
    try {
      setLoadingStep('正在提取音频真实地址...');
      const data = await performRealTranscription(url);
      
      setLoadingStep('Gemini 正在深度转录音频 (可能需要 15-30 秒)...');
      setLoadingStep('正在利用 AI 分析文字稿并提取核心精彩片段...');
      const highlights = await analyzeTranscript(data.transcript);
      
      const newSession: PodcastNoteSession = {
        id: `session-${Date.now()}`,
        title: data.title,
        url: url,
        audioUrl: data.audioUrl,
        duration: data.duration,
        transcript: data.transcript,
        highlights: highlights,
        notes: [],
        createdAt: new Date().toISOString(),
      };

      setSession(newSession);
      saveToHistory(newSession);
    } catch (error: any) {
      console.error("Transcription error:", error);
      alert(`失败原因: ${error.message || '转录过程发生未知错误，请重试'}`);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play();
    }
    setCurrentTime(time);
  };

  const handleAction = (action: 'copy' | 'highlight' | 'note', text: string, range: Range) => {
    if (!session) return;

    if (action === 'copy') {
      navigator.clipboard.writeText(text);
      // 可选：添加一个小 Toast
      return;
    }

    if (action === 'highlight') {
      const newNote: UserNote = {
        id: `highlight-${Date.now()}`,
        text: '',
        selectedText: text,
        timestamp: currentTime,
        createdAt: new Date().toISOString(),
        isOnlyHighlight: true
      };
      updateNotes(newNote);
      return;
    }

    if (action === 'note') {
      setSelectedRange({ text, timestamp: currentTime });
    }
  };

  const updateNotes = (newNote: UserNote) => {
    if (!session) return;
    const updatedSession = {
      ...session,
      notes: [newNote, ...session.notes],
    };
    setSession(updatedSession);
    
    const history = getHistory();
    const index = history.findIndex((h: any) => h.id === session.id);
    if (index !== -1) {
      history[index] = updatedSession;
      localStorage.setItem('podcast_history', JSON.stringify(history));
    }
  };

  const handleSaveNote = (noteText: string) => {
    if (!session || !selectedRange) return;
    
    const newNote: UserNote = {
      id: `note-${Date.now()}`,
      text: noteText,
      selectedText: selectedRange.text,
      timestamp: selectedRange.timestamp,
      createdAt: new Date().toISOString(),
    };

    updateNotes(newNote);
    setSelectedRange(null);
  };

  const handleExport = (format: 'txt' | 'md') => {
    if (!session) return;
    
    let content = `# ${session.title}\n\n`;
    content += `来源: ${session.url}\n`;
    content += `日期: ${new Date(session.createdAt).toLocaleDateString()}\n\n`;
    
    content += `## 精彩片段\n\n`;
    session.highlights.forEach(h => {
      content += `### [${h.type}] [${formatTime(h.timestamp)}]\n${h.content}\n\n`;
    });
    
    content += `## 我的笔记\n\n`;
    session.notes.forEach(n => {
      if (n.isOnlyHighlight) {
        content += `> [划线] [${formatTime(n.timestamp)}] ${n.selectedText}\n\n`;
      } else {
        content += `> [笔记] [${formatTime(n.timestamp)}] ${n.selectedText}\n\n${n.text}\n\n`;
      }
    });
    
    content += `## 完整文字稿\n\n${session.transcript.replace(/\*\*/g, '')}`;
    
    const fileName = `${session.title}_笔记_${new Date().toISOString().split('T')[0]}.${format}`;
    downloadText(fileName, content);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
        <div className="relative mb-12">
          <div className="w-32 h-32 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <i className="fas fa-microphone-lines text-indigo-600 text-3xl animate-pulse"></i>
          </div>
        </div>
        <h2 className="text-3xl font-black text-slate-800 text-center mb-4 tracking-tight">{loadingStep}</h2>
        <div className="max-w-md w-full bg-slate-50 p-6 rounded-3xl border border-slate-100">
           <div className="flex items-center gap-4 text-slate-500 text-sm">
              <div className="flex-shrink-0 w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
              <span className="font-medium">AI 正在处理音频流。如果是长篇播客，Gemini 正在进行深度解析，请保持专注。</span>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-xl shadow-indigo-100">
              <i className="fas fa-podcast text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                小宇宙智能笔记
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Powered by Gemini 3.0</p>
            </div>
          </div>
          <button 
            onClick={() => setShowHistory(true)}
            className="group flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 transition-all shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 active:scale-95"
          >
            <i className="fas fa-box-archive text-slate-400 group-hover:text-indigo-600 transition-colors"></i>
            <span className="text-sm font-black text-slate-600 group-hover:text-indigo-900">历史知识库</span>
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-6 py-10 w-full">
        {!session ? (
          <div className="max-w-4xl mx-auto mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-16">
              <span className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8 inline-block shadow-sm">高效能学习工具</span>
              <h2 className="text-5xl lg:text-7xl font-black text-slate-900 mb-8 tracking-tighter leading-[1] transition-all">
                把每一场播客<br/><span className="text-indigo-600">沉淀为知识</span>
              </h2>
              <p className="text-slate-500 text-xl max-w-2xl mx-auto leading-relaxed font-medium">
                AI 驱动的播客深度助手。提取核心观点、划线高亮文字、随时记录感悟，构建属于您的音频知识体系。
              </p>
            </div>

            <div className="bg-white p-5 rounded-[3.5rem] shadow-2xl shadow-indigo-100/60 border border-slate-100 flex flex-col md:flex-row gap-5 mb-20 group transition-all hover:shadow-indigo-200/50">
              <input 
                type="text"
                placeholder="在此粘贴小宇宙节目链接 (Episode URL)..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                className="flex-grow px-10 py-6 rounded-[2.5rem] bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-slate-800 text-lg font-bold placeholder:text-slate-300"
              />
              <button 
                onClick={handleGenerate}
                disabled={!url}
                className="bg-indigo-600 text-white px-14 py-6 rounded-[2.5rem] font-black hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-200 active:scale-95 whitespace-nowrap text-xl tracking-tight"
              >
                开启深度学习
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               {[
                 { icon: 'fa-microchip', title: 'Gemini 转录', desc: '精准还原音频，移除无效冗余符号。', color: 'blue' },
                 { icon: 'fa-highlighter', title: '即时划线', desc: '选中文本一键高亮，精准锚点跳转。', color: 'purple' },
                 { icon: 'fa-magnifying-glass', title: '全局检索', desc: '在历史笔记中瞬间找回关键内容。', color: 'amber' }
               ].map((feat, i) => (
                 <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group">
                    <div className={`w-14 h-14 bg-${feat.color}-50 text-${feat.color}-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                      <i className={`fas ${feat.icon} text-2xl`}></i>
                    </div>
                    <h4 className="text-xl font-black mb-3 text-slate-800">{feat.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed font-bold">{feat.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-500">
            {/* 左侧栏 */}
            <div className="lg:col-span-4 space-y-10">
              <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-28">
                <h2 className="text-2xl font-black text-slate-900 mb-8 line-clamp-2 leading-tight tracking-tighter">{session.title}</h2>
                
                <AudioPlayer 
                  audioRef={audioRef}
                  src={session.audioUrl}
                  duration={session.duration}
                  onTimeUpdate={setCurrentTime}
                  currentTime={currentTime}
                  highlights={session.highlights}
                  onSeek={handleSeek}
                />
                
                <div className="grid grid-cols-2 gap-4 mt-12">
                  <button 
                    onClick={() => handleExport('md')}
                    className="flex items-center justify-center gap-2 py-4 bg-indigo-50 text-indigo-700 font-black rounded-2xl hover:bg-indigo-600 hover:text-white transition-all text-xs tracking-widest uppercase"
                  >
                    <i className="fas fa-file-markdown"></i>
                    导出 MD
                  </button>
                  <button 
                    onClick={() => setSession(null)}
                    className="flex items-center justify-center py-4 bg-slate-50 text-slate-300 font-black rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all text-xs tracking-widest uppercase"
                  >
                    返回首页
                  </button>
                </div>
              </div>

              <HighlightList 
                highlights={session.highlights} 
                onSeek={handleSeek} 
                activeTime={currentTime}
              />

              <TerminologyQuery />
            </div>

            {/* 右侧栏 */}
            <div className="lg:col-span-8 space-y-12">
              <div className="bg-white rounded-[3.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="px-12 py-10 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-inner">
                      <i className="fas fa-book-open"></i>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tighter">沉浸式阅读转录本</h3>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Bionic Reading Experience</p>
                    </div>
                  </div>
                </div>
                <Transcript 
                  text={session.transcript} 
                  notes={session.notes}
                  onAction={handleAction}
                  onSeek={handleSeek}
                  activeTime={currentTime}
                />
              </div>

              <div className="bg-white rounded-[3.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="px-12 py-10 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-[1.25rem] flex items-center justify-center shadow-inner">
                      <i className="fas fa-pen-fancy"></i>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tighter">知识笔记 & 划线 ({session.notes.length})</h3>
                  </div>
                </div>
                <div className="p-12 space-y-12 max-h-[800px] overflow-y-auto bg-slate-50/20">
                  {session.notes.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 mx-4">
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10">
                        <i className="fas fa-edit text-slate-100 text-4xl"></i>
                      </div>
                      <p className="text-slate-400 font-black text-xl tracking-tight">在这里留下您的第一个思考</p>
                      <p className="text-slate-300 text-sm mt-3 font-bold">划选上方文字即可开启记录</p>
                    </div>
                  ) : (
                    session.notes.map(note => (
                      <div key={note.id} className="group relative animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="flex items-center justify-between mb-6">
                          <button 
                            onClick={() => handleSeek(note.timestamp)}
                            className="text-xs font-black text-indigo-600 bg-white shadow-xl shadow-indigo-500/10 border border-indigo-50 px-6 py-3 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-3 active:scale-95"
                          >
                            <i className="fas fa-play text-[10px]"></i>
                            {formatTime(note.timestamp)}
                          </button>
                          <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">
                            {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={`pl-8 border-l-[6px] ${note.isOnlyHighlight ? 'border-amber-400' : 'border-indigo-600'} mb-6 italic text-slate-600 text-xl leading-relaxed font-bold`}>
                          “{note.selectedText}”
                        </div>
                        {!note.isOnlyHighlight && (
                          <div className="text-slate-800 text-lg leading-relaxed bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 font-bold tracking-tight">
                            {note.text}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-24 text-center">
          <div className="flex items-center justify-center gap-6 mb-8 opacity-20">
            <div className="h-[2px] w-16 bg-slate-400 rounded-full"></div>
            <i className="fas fa-podcast text-slate-400 text-2xl"></i>
            <div className="h-[2px] w-16 bg-slate-400 rounded-full"></div>
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.4em] flex items-center justify-center">
             Crafted for Knowledge Seekers <span className="mx-4 text-indigo-600">●</span> 2024
          </p>
      </footer>

      {showHistory && (
        <HistoryList 
          onClose={() => setShowHistory(false)} 
          onSelect={(s) => {
            setSession(s);
            setShowHistory(false);
          }}
          onDelete={(id) => {
            deleteHistoryItem(id);
          }}
        />
      )}

      {selectedRange && (
        <NoteEditor 
          selectedText={selectedRange.text}
          onSave={handleSaveNote}
          onCancel={() => setSelectedRange(null)}
        />
      )}
    </div>
  );
};

export default App;
