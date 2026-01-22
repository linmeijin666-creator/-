
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
      case 'DATA': return { color: 'green', icon: 'fa-chart-bar', label: '关键数据' };
      case 'QUOTE': return { color: 'amber', icon: 'fa-quote-left', label: '金句' };
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="border-b border-slate-50 bg-slate-50/50 px-6 py-4">
        <h3 className="font-bold text-slate-700 flex items-center">
          <i className="fas fa-magic text-purple-500 mr-2"></i>
          AI 精彩片段
        </h3>
      </div>
      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {highlights.map(h => {
          const config = getTypeConfig(h.type);
          const isActive = Math.abs(activeTime - h.timestamp) < 5;
          
          return (
            <div 
              key={h.id}
              onClick={() => onSeek(h.timestamp)}
              className={`p-3 rounded-xl cursor-pointer border-2 transition-all ${
                isActive 
                  ? `bg-${config.color}-50 border-${config.color}-200 shadow-sm` 
                  : `bg-white border-transparent hover:bg-slate-50`
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-${config.color}-100 text-${config.color}-700 flex items-center`}>
                  <i className={`fas ${config.icon} mr-1`}></i>
                  {config.label}
                </span>
                <span className="text-xs font-mono text-slate-400">{formatTime(h.timestamp)}</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">
                {h.content}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HighlightList;
