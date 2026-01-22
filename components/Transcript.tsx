
import React, { useCallback, useRef } from 'react';
import { Highlight, HighlightType } from '../types';
import { formatTime } from '../utils';

interface TranscriptProps {
  text: string;
  highlights: Highlight[];
  onTextSelect: (text: string, timestamp: number) => void;
  onSeek: (time: number) => void;
  activeTime: number;
}

const Transcript: React.FC<TranscriptProps> = ({ 
  text, 
  highlights, 
  onTextSelect, 
  onSeek,
  activeTime
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 2) {
      // For this demo, we use the current audio time as the reference
      onTextSelect(selectedText, activeTime);
    }
  }, [onTextSelect, activeTime]);

  // Simple rendering of paragraphs
  const paragraphs = text.split('\n').filter(p => p.trim() !== '');

  return (
    <div 
      className="p-8 max-h-[700px] overflow-y-auto bg-white"
      onMouseUp={handleMouseUp}
      ref={containerRef}
    >
      <div className="mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start">
        <i className="fas fa-info-circle text-indigo-400 mt-1 mr-3"></i>
        <p className="text-xs text-indigo-700 leading-relaxed">
          文字稿由 Gemini 实时从音频中转录。选中任意文字，即可记录带有当前时间戳的笔记。
        </p>
      </div>

      <div className="space-y-6">
        {paragraphs.map((para, idx) => (
          <p key={idx} className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap select-text selection:bg-indigo-100 selection:text-indigo-900">
            {para}
          </p>
        ))}
      </div>
    </div>
  );
};

export default Transcript;
