
export const parseTimeInput = (input: string): number => {
  // Remove espaços e caracteres não numéricos
  const cleanInput = input.replace(/[^\d]/g, '');
  
  if (!cleanInput) return 0;
  
  const length = cleanInput.length;
  
  if (length <= 2) {
    // 10 → 10:00 (10 horas)
    return parseInt(cleanInput, 10);
  } else if (length === 3) {
    // 130 → 01:30 (1.5 horas)
    const hours = parseInt(cleanInput.substring(0, 1), 10);
    const minutes = parseInt(cleanInput.substring(1, 3), 10);
    return hours + (minutes / 60);
  } else if (length === 4) {
    // 1030 → 10:30 (10.5 horas)
    const hours = parseInt(cleanInput.substring(0, 2), 10);
    const minutes = parseInt(cleanInput.substring(2, 4), 10);
    return hours + (minutes / 60);
  }
  
  return 0;
};

export const formatTimeToDisplay = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const formatTimeToDecimal = (hours: number): number => {
  return Math.round(hours * 100) / 100;
};
