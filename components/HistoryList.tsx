
import React, { useState, useEffect, useMemo } from 'react';
import { PodcastNoteSession } from '../types';
import { getHistory, formatTime } from '../utils';

interface HistoryListProps {
  onClose: () => void;
  onSelect: (session: PodcastNoteSession) => void;
  onDelete: (id: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ onClose, onSelect, onDelete }) => {
  const [history, setHistory] = useState<PodcastNoteSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return history;
    const term = searchTerm.toLowerCase();
    return history.filter(item => 
      item.title.toLowerCase().includes(term) || 
      item.transcript.toLowerCase().includes(term) ||
      item.notes.some(n => n.text.toLowerCase().includes(term) || n.selectedText.toLowerCase().includes(term))
    );
  }, [history, searchTerm]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这条记录及其笔记吗？')) {
      onDelete(id);
      setHistory(getHistory());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500 border border-white/20">
        {/* Header with Search */}
        <div className="px-8 py-6 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">我的知识库</h3>
            <button onClick={onClose} className="w-10 h-10 rounded-2xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input 
              type="text"
              placeholder="搜索标题、文字稿或笔记内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-slate-50/30">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-search text-slate-300 text-3xl"></i>
              </div>
              <p className="text-slate-400 font-bold">没有找到相关的笔记记录</p>
              <p className="text-slate-300 text-sm mt-1">换个关键词试试，或开始一期新的播客</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div 
                key={item.id}
                onClick={() => onSelect(item)}
                className="group p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer transition-all relative overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-black text-slate-800 text-lg leading-tight pr-12 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                    <button 
                      onClick={(e) => handleDelete(e, item.id)}
                      className="w-8 h-8 rounded-xl text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"
                    >
                      <i className="fas fa-trash-can text-sm"></i>
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <i className="far fa-clock mr-1.5"></i>
                      {formatTime(item.duration)}
                    </span>
                    <span className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <i className="far fa-calendar-alt mr-1.5"></i>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-black tracking-widest">
                      <i className="far fa-sticky-note mr-1.5"></i>
                      {item.notes.length} 笔记
                    </span>
                  </div>
                </div>
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 translate-x-4 group-hover:translate-x-0 transition-all">
                   <i className="fas fa-podcast text-6xl text-indigo-600"></i>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryList;
