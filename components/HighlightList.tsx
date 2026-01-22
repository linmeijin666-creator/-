
import React from 'react';
import { Highlight, HighlightType } from '../types';
import { formatTime } from '../utils';

interface HighlightListProps {
  highlights: Highlight[];
  onSeek: (time: number) => void;
  activeTime: number;
}

const HighlightList: React.FC<HighlightListProps> = ({ highlights, onSeek, activeTime }) => {
  const getTypeConfig = (type: HighlightType) => {
    switch (type) {
      case 'VIEWPOINT': return { color: 'blue', icon: 'fa-lightbulb', label: '核心观点' };
      case 'DATA': return { color: 'emerald', icon: 'fa-chart-simple', label: '关键数据' };
      case 'QUOTE': return { color: 'amber', icon: 'fa-quote-left', label: '精彩金句' };
    }
  };

  return (
    <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
        <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
          <i className="fas fa-sparkles text-sm"></i>
        </div>
        <h3 className="font-black text-slate-800 tracking-tight">AI 智能摘要</h3>
      </div>
      <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
        {highlights.length === 0 ? (
          <p className="text-center py-10 text-slate-400 text-sm font-medium italic">正在提取精华内容...</p>
        ) : (
          highlights.map(h => {
            const config = getTypeConfig(h.type);
            const isActive = Math.abs(activeTime - h.timestamp) < 3;
            
            return (
              <div 
                key={h.id}
                onClick={() => onSeek(h.timestamp)}
                className={`group p-5 rounded-2xl cursor-pointer border-2 transition-all duration-300 ${
                  isActive 
                    ? `bg-${config.color}-50 border-${config.color}-200 shadow-lg shadow-${config.color}-100/50 scale-[1.02]` 
                    : `bg-white border-slate-50 hover:border-${config.color}-100 hover:bg-slate-50/50`
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-${config.color}-100 text-${config.color}-700 flex items-center gap-2`}>
                    <i className={`fas ${config.icon}`}></i>
                    {config.label}
                  </span>
                  <span className={`text-[10px] font-black font-mono transition-colors ${isActive ? `text-${config.color}-600` : 'text-slate-300'}`}>
                    {formatTime(h.timestamp)}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed transition-colors font-medium ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                  {h.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HighlightList;
