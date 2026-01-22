
import React, { useState } from 'react';

interface NoteEditorProps {
  selectedText: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ selectedText, onSave, onCancel }) => {
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">添加笔记</h3>
          
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">选中的片段</label>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-600 italic border-l-4 border-l-amber-400">
              "{selectedText}"
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">笔记内容</label>
            <textarea 
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="在这里输入你的思考或核心摘要..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-slate-700"
            />
          </div>

          <div className="flex space-x-3">
            <button 
              onClick={onCancel}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button 
              onClick={() => onSave(note)}
              disabled={!note.trim()}
              className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg active:scale-95"
            >
              保存笔记
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
