
import React, { useRef, useState, useEffect } from 'react';
import { Highlight, HighlightType } from '../types';
import { formatTime } from '../utils';

interface AudioPlayerProps {
  src: string;
  duration: number;
  audioRef: React.RefObject<HTMLAudioElement>;
  onTimeUpdate: (time: number) => void;
  currentTime: number;
  highlights: Highlight[];
  onSeek: (time: number) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  src, 
  duration, 
  audioRef, 
  onTimeUpdate, 
  currentTime, 
  highlights,
  onSeek 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const speedOptions = [1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSpeedChange = (rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSpeedMenu(false);
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      onSeek(percentage * duration);
    }
  };

  const getTypeColor = (type: HighlightType) => {
    switch (type) {
      case 'VIEWPOINT': return 'bg-blue-500';
      case 'DATA': return 'bg-emerald-500';
      case 'QUOTE': return 'bg-amber-500';
      default: return 'bg-slate-300';
    }
  };

  return (
    <div className="w-full select-none">
      <audio 
        ref={audioRef}
        src={src}
        onTimeUpdate={(e) => onTimeUpdate((e.target as HTMLAudioElement).currentTime)}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      
      {/* 播放器核心控制区 */}
      <div className="flex items-center gap-4 mb-4">
        <button 
          onClick={togglePlay}
          className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-200"
        >
          <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-xl ${!isPlaying && 'ml-1'}`}></i>
        </button>
        
        <div className="flex-grow">
          <div className="flex justify-between items-end mb-1">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-800 tracking-tight">{formatTime(currentTime)}</span>
              <span className="text-xs text-slate-400 font-medium">/ {formatTime(duration)}</span>
            </div>
            
            {/* 倍速选择按钮 */}
            <div className="relative">
              <button 
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="text-[11px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
              >
                {playbackRate.toFixed(2)}x
                <i className={`fas fa-chevron-${showSpeedMenu ? 'down' : 'up'} text-[8px]`}></i>
              </button>
              
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-100 py-2 w-24 z-50 animate-in fade-in slide-in-from-bottom-2">
                  {speedOptions.map(rate => (
                    <button
                      key={rate}
                      onClick={() => handleSpeedChange(rate)}
                      className={`w-full text-left px-4 py-1.5 text-xs hover:bg-indigo-50 transition-colors ${playbackRate === rate ? 'text-indigo-600 font-bold' : 'text-slate-600'}`}
                    >
                      {rate.toFixed(2)}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* 进度条 */}
          <div 
            ref={progressBarRef}
            onClick={handleProgressBarClick}
            className="relative h-2.5 w-full bg-slate-100 rounded-full cursor-pointer group"
          >
            <div 
              className="absolute h-full bg-indigo-500 rounded-full transition-all duration-100 ease-linear pointer-events-none"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform"></div>
            </div>
            
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
              {highlights.map(h => (
                <div 
                  key={h.id}
                  className={`absolute top-0 bottom-0 w-1 ${getTypeColor(h.type)} opacity-80`}
                  style={{ left: `${(h.timestamp / duration) * 100}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-1">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">观点</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">数据</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">金句</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
