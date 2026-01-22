
export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const saveToHistory = (data: any) => {
  const history = JSON.parse(localStorage.getItem('podcast_history') || '[]');
  history.unshift(data);
  localStorage.setItem('podcast_history', JSON.stringify(history.slice(0, 50))); // Keep last 50
};

export const getHistory = () => {
  return JSON.parse(localStorage.getItem('podcast_history') || '[]');
};

export const deleteHistoryItem = (id: string) => {
  const history = JSON.parse(localStorage.getItem('podcast_history') || '[]');
  const filtered = history.filter((item: any) => item.id !== id);
  localStorage.setItem('podcast_history', JSON.stringify(filtered));
};

export const downloadText = (filename: string, text: string) => {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
