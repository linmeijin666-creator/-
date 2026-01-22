
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
  const progressBarRef = useRef<HTMLDivElement>(null);

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
      case 'DATA': return 'bg-green-500';
      case 'QUOTE': return 'bg-amber-500';
      default: return 'bg-slate-300';
    }
  };

  return (
    <div className="w-full">
      <audio 
        ref={audioRef}
        src={src}
        onTimeUpdate={(e) => onTimeUpdate((e.target as HTMLAudioElement).currentTime)}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={togglePlay}
          className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-95 shadow-md"
        >
          <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} ${!isPlaying && 'ml-1'}`}></i>
        </button>
        <div className="text-right">
          <span className="text-sm font-bold text-slate-800">{formatTime(currentTime)}</span>
          <span className="text-sm text-slate-400"> / {formatTime(duration)}</span>
        </div>
      </div>

      <div 
        ref={progressBarRef}
        onClick={handleProgressBarClick}
        className="relative h-6 w-full bg-slate-100 rounded-lg cursor-pointer overflow-hidden group shadow-inner"
      >
        {/* Progress Fill */}
        <div 
          className="absolute h-full bg-indigo-200 transition-all duration-100 ease-linear pointer-events-none"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
        
        {/* Highlight Markers */}
        <div className="absolute inset-0 pointer-events-none">
          {highlights.map(h => (
            <div 
              key={h.id}
              className={`absolute top-0 bottom-0 w-1 ${getTypeColor(h.type)} opacity-60`}
              style={{ left: `${(h.timestamp / duration) * 100}%` }}
              title={`${h.type}: ${h.content.substring(0, 30)}...`}
            />
          ))}
        </div>

        {/* Hover Effect Bar */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="mt-2 flex justify-between">
        <div className="flex space-x-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1.5"></div>
            <span className="text-[10px] text-slate-500 font-medium">观点</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
            <span className="text-[10px] text-slate-500 font-medium">数据</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-amber-500 rounded-full mr-1.5"></div>
            <span className="text-[10px] text-slate-500 font-medium">金句</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
