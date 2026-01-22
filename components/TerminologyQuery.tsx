
import React, { useState } from 'react';
import { queryTerminology } from '../services/geminiService';
import { TermQueryResponse } from '../types';

const TerminologyQuery: React.FC = () => {
  const [term, setTerm] = useState('');
  const [result, setResult] = useState<TermQueryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuery = async () => {
    if (!term) return;
    setIsLoading(true);
    try {
      const res = await queryTerminology(term);
      setResult(res);
    } catch (e) {
      alert('查询失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="border-b border-slate-50 bg-slate-50/50 px-6 py-4">
        <h3 className="font-bold text-slate-700 flex items-center">
          <i className="fas fa-search text-indigo-500 mr-2"></i>
          专有名词百科
        </h3>
      </div>
      <div className="p-6">
        <div className="flex space-x-2 mb-4">
          <input 
            type="text"
            placeholder="输入想查询的名词..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            className="flex-grow px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
          />
          <button 
            onClick={handleQuery}
            disabled={isLoading || !term}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : '查询'}
          </button>
        </div>

        {result && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-4 bg-slate-50 rounded-xl mb-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">名词定义</h4>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {result.definition}
              </p>
            </div>
            
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">推荐学习资源</h4>
            <div className="space-y-2">
              {result.links.map((link, i) => (
                <a 
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-2 rounded-lg border border-slate-100 text-xs text-indigo-600 font-medium hover:bg-indigo-50 hover:border-indigo-100 transition-all truncate"
                >
                  <i className="fas fa-external-link-alt mr-2 text-slate-300"></i>
                  {link.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminologyQuery;
