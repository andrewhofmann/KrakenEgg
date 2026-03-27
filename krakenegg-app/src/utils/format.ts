export const formatSize = (size: number) => {
  if (size === 0) return "--";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

export const formatDate = (timestamp: number | undefined) => {
  if (timestamp === undefined) return "--";
  const date = new Date(timestamp * 1000);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() && 
                  date.getFullYear() === now.getFullYear();
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() &&
                      date.getMonth() === yesterday.getMonth() &&
                      date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;
  
  return date.toLocaleString([], { 
      year: '2-digit', 
      month: 'numeric', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
  });
};

export const getExtension = (filename: string) => {
    const parts = filename.split('.');
    return parts.length > 1 && !filename.startsWith('.') ? parts[parts.length - 1] : "";
};
