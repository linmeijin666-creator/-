
import React, { useState, useEffect } from 'react';
import { PodcastNoteSession } from '../types';
import { getHistory, formatTime } from '../utils';

interface HistoryListProps {
  onClose: () => void;
  onSelect: (session: PodcastNoteSession) => void;
  onDelete: (id: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ onClose, onSelect, onDelete }) => {
  const [history, setHistory] = useState<PodcastNoteSession[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete(id);
    setHistory(getHistory());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-800">历史记录</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-20">
              <i className="fas fa-folder-open text-slate-200 text-6xl mb-4"></i>
              <p className="text-slate-400">暂无任何历史记录</p>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id}
                onClick={() => onSelect(item)}
                className="group p-4 bg-white border border-slate-100 rounded-xl hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 line-clamp-1 pr-10">{item.title}</h4>
                  <button 
                    onClick={(e) => handleDelete(e, item.id)}
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-1"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
                <div className="flex items-center text-xs text-slate-400 space-x-4">
                  <span className="flex items-center">
                    <i className="far fa-clock mr-1"></i>
                    {formatTime(item.duration)}
                  </span>
                  <span className="flex items-center">
                    <i className="far fa-calendar-alt mr-1"></i>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center">
                    <i className="far fa-sticky-note mr-1"></i>
                    {item.notes.length} 笔记
                  </span>
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
