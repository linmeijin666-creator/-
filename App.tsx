
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
      
      setLoadingStep('正在获取音频并由 Gemini 进行 AI 转录 (这可能需要 30-60 秒)...');
      // Transcribe is part of performRealTranscription now
      
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

  const handleSaveNote = (noteText: string) => {
    if (!session || !selectedRange) return;
    
    const newNote: UserNote = {
      id: `note-${Date.now()}`,
      text: noteText,
      selectedText: selectedRange.text,
      timestamp: selectedRange.timestamp,
      createdAt: new Date().toISOString(),
    };

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
      content += `> [${formatTime(n.timestamp)}] ${n.selectedText}\n\n${n.text}\n\n`;
    });
    
    content += `## 完整文字稿\n\n${session.transcript}`;
    
    const fileName = `${session.title}_笔记_${new Date().toISOString().split('T')[0]}.${format}`;
    downloadText(fileName, content);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="relative mb-10">
          <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <i className="fas fa-podcast text-indigo-600 text-2xl animate-pulse"></i>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-4">{loadingStep}</h2>
        <div className="max-w-md w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center space-x-3 text-slate-400 text-sm">
              <i className="fas fa-spinner fa-spin text-indigo-500"></i>
              <span>正在处理大型音频数据，这取决于您的网络和 Gemini 负载...</span>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
              <i className="fas fa-podcast text-white"></i>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              小宇宙智能笔记
            </h1>
          </div>
          <button 
            onClick={() => setShowHistory(true)}
            className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center space-x-1 font-medium bg-slate-100 px-3 py-1.5 rounded-lg"
          >
            <i className="fas fa-history"></i>
            <span className="text-sm">历史记录</span>
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {!session ? (
          <div className="max-w-3xl mx-auto mt-20 text-center">
            <h2 className="text-4xl font-black text-slate-800 mb-6 tracking-tight">听播客，从未如此高效</h2>
            <p className="text-slate-600 mb-12 text-xl leading-relaxed">
              粘贴小宇宙链接，AI 深度转录音频，自动提取观点、数据与金句。
              <br/><span className="text-indigo-500 font-semibold text-base mt-2 inline-block italic">基于 Gemini 3.0 的真·音频转文字技术</span>
            </p>
            <div className="bg-white p-3 rounded-3xl shadow-2xl border border-slate-100 flex flex-col sm:flex-row gap-3 transition-all hover:shadow-indigo-100/50">
              <input 
                type="text"
                placeholder="在此粘贴小宇宙节目链接 (URL)..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                className="flex-grow px-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-indigo-100 outline-none text-slate-700 text-lg"
              />
              <button 
                onClick={handleGenerate}
                disabled={!url}
                className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95 whitespace-nowrap text-lg"
              >
                开始生成
              </button>
            </div>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-slate-500">
               <div className="flex flex-col items-center p-4">
                 <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3"><i className="fas fa-waveform"></i></div>
                 <p className="text-sm font-medium">真实音频提取</p>
               </div>
               <div className="flex flex-col items-center p-4">
                 <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-3"><i className="fas fa-brain"></i></div>
                 <p className="text-sm font-medium">Gemini 3.0 全文转录</p>
               </div>
               <div className="flex flex-col items-center p-4">
                 <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-3"><i className="fas fa-highlighter"></i></div>
                 <p className="text-sm font-medium">智能观点提取</p>
               </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-20">
                <h2 className="text-xl font-bold text-slate-800 mb-5 line-clamp-2 leading-tight">{session.title}</h2>
                <AudioPlayer 
                  audioRef={audioRef}
                  src={session.audioUrl}
                  duration={session.duration}
                  onTimeUpdate={setCurrentTime}
                  currentTime={currentTime}
                  highlights={session.highlights}
                  onSeek={handleSeek}
                />
                <div className="flex gap-3 mt-8">
                  <button 
                    onClick={() => handleExport('md')}
                    className="flex-1 text-xs font-bold py-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                  >
                    <i className="fas fa-file-export mr-2"></i>
                    导出笔记
                  </button>
                  <button 
                    onClick={() => setSession(null)}
                    className="px-5 text-xs font-bold py-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <i className="fas fa-redo"></i>
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

            {/* Right Column */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="border-b border-slate-100 bg-white px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"><i className="fas fa-quote-right text-xs"></i></div>
                    <h3 className="font-bold text-slate-800">转录文本</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Transcription</span>
                  </div>
                </div>
                <Transcript 
                  text={session.transcript} 
                  highlights={session.highlights}
                  onTextSelect={(text, ts) => setSelectedRange({ text, timestamp: ts })}
                  onSeek={handleSeek}
                  activeTime={currentTime}
                />
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="border-b border-slate-100 bg-white px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center"><i className="fas fa-pen text-xs"></i></div>
                    <h3 className="font-bold text-slate-800">我的笔记 ({session.notes.length})</h3>
                  </div>
                </div>
                <div className="p-8 space-y-8 max-h-[600px] overflow-y-auto bg-slate-50/10">
                  {session.notes.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-edit text-slate-200 text-2xl"></i>
                      </div>
                      <p className="text-slate-400 font-medium">暂时没有笔记。选中上方文字即可开始记录。</p>
                    </div>
                  ) : (
                    session.notes.map(note => (
                      <div key={note.id} className="group relative animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <button 
                            onClick={() => handleSeek(note.timestamp)}
                            className="text-xs font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-all flex items-center"
                          >
                            <i className="fas fa-play-circle mr-2 text-sm"></i>
                            {formatTime(note.timestamp)}
                          </button>
                          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                            {new Date(note.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="pl-5 border-l-2 border-indigo-200 mb-4 italic text-slate-500 text-base leading-relaxed">
                          “{note.selectedText}”
                        </div>
                        <div className="text-slate-800 text-base leading-relaxed bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                          {note.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

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
      
      <footer className="py-12 text-center border-t border-slate-100 bg-white mt-auto">
          <p className="text-slate-400 text-sm font-medium flex items-center justify-center">
             基于 <span className="mx-1.5 px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-black uppercase">Gemini 3.0</span> 的真·智能播客笔记
          </p>
      </footer>
    </div>
  );
};

export default App;
