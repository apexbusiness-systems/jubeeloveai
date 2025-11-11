export interface SavedDrawing {
  id: string;
  character: string;
  type: 'letter' | 'number';
  imageData: string;
  timestamp: number;
  dateString: string;
}

export const saveDrawing = (character: string, type: 'letter' | 'number', imageData: string): SavedDrawing => {
  const drawing: SavedDrawing = {
    id: `${type}-${character}-${Date.now()}`,
    character,
    type,
    imageData,
    timestamp: Date.now(),
    dateString: new Date().toLocaleDateString(),
  };

  const savedDrawings = getSavedDrawings();
  savedDrawings.push(drawing);
  localStorage.setItem('jubee-drawings', JSON.stringify(savedDrawings));
  
  return drawing;
};

export const getSavedDrawings = (): SavedDrawing[] => {
  const stored = localStorage.getItem('jubee-drawings');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const deleteDrawing = (id: string): void => {
  const drawings = getSavedDrawings();
  const filtered = drawings.filter(d => d.id !== id);
  localStorage.setItem('jubee-drawings', JSON.stringify(filtered));
};

export const clearAllDrawings = (): void => {
  localStorage.removeItem('jubee-drawings');
};
