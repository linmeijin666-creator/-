
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Highlight, UserNote } from '../types';

interface TranscriptProps {
  text: string;
  notes: UserNote[];
  onAction: (action: 'copy' | 'highlight' | 'note', text: string, range: Range) => void;
  onSeek: (time: number) => void;
  activeTime: number;
}

const Transcript: React.FC<TranscriptProps> = ({ 
  text, 
  notes,
  onAction,
  onSeek,
  activeTime
}) => {
  const [menuPos, setMenuPos] = useState<{ x: number, y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [currentRange, setCurrentRange] = useState<Range | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理文本清理和渲染
  const renderCleanText = (rawText: string) => {
    // 将 **text** 替换为 <strong>text</strong>
    return rawText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-900">$1</strong>');
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setMenuPos(null);
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectedText(text);
      setCurrentRange(range);
      setMenuPos({
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY - 10
      });
    }
  };

  useEffect(() => {
    const hideMenu = () => setMenuPos(null);
    document.addEventListener('mousedown', (e) => {
        if (!(e.target as HTMLElement).closest('.action-menu')) hideMenu();
    });
    return () => document.removeEventListener('mousedown', hideMenu);
  }, []);

  const paragraphs = text.split('\n').filter(p => p.trim() !== '');

  return (
    <div 
      className="p-10 max-h-[800px] overflow-y-auto bg-white relative selection:bg-indigo-100 selection:text-indigo-900"
      onMouseUp={handleMouseUp}
      ref={containerRef}
    >
      {/* 浮动操作菜单 */}
      {menuPos && (
        <div 
          className="action-menu fixed z-50 transform -translate-x-1/2 -translate-y-full flex items-center bg-slate-900 text-white rounded-xl shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-200"
          style={{ left: menuPos.x, top: menuPos.y }}
        >
          <button 
            onClick={() => { onAction('copy', selectedText, currentRange!); setMenuPos(null); }}
            className="px-3 py-1.5 hover:bg-white/10 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors border-r border-white/10"
          >
            <i className="fas fa-copy"></i> 复制
          </button>
          <button 
            onClick={() => { onAction('highlight', selectedText, currentRange!); setMenuPos(null); }}
            className="px-3 py-1.5 hover:bg-white/10 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors border-r border-white/10 text-amber-400"
          >
            <i className="fas fa-highlighter"></i> 划线
          </button>
          <button 
            onClick={() => { onAction('note', selectedText, currentRange!); setMenuPos(null); }}
            className="px-3 py-1.5 hover:bg-white/10 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors text-indigo-400"
          >
            <i className="fas fa-pen-nib"></i> 写想法
          </button>
        </div>
      )}

      <div className="mb-12 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start gap-4">
        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-500 shrink-0">
          <i className="fas fa-wand-magic-sparkles"></i>
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800 mb-1">精修转录本</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            我们已移除多余的格式符号。现在您可以直接划选文字，使用划线或写想法功能，笔记将自动关联至当前播放进度。
          </p>
        </div>
      </div>

      <div className="space-y-10">
        {paragraphs.map((para, idx) => (
          <p 
            key={idx} 
            className="text-slate-700 leading-loose text-lg font-medium transition-all duration-500"
            dangerouslySetInnerHTML={{ __html: renderCleanText(para) }}
          />
        ))}
      </div>
      
      <div className="h-20"></div>
    </div>
  );
};

export default Transcript;
