/**
 * Drawing Storage Service
 * 
 * Manages drawing data using IndexedDB for offline-first persistence
 * with Supabase sync capabilities. Replaces direct localStorage usage.
 * 
 * @see STORAGE_STRATEGY.md for architecture decisions
 */

import { jubeeDB } from './indexedDB';
import { supabase } from '@/integrations/supabase/client';

export interface SavedDrawing {
  id: string;
  character: string;
  type: string;
  imageData: string;
  timestamp: number;
  dateString: string;
  synced?: boolean;
  userId?: string;
  childProfileId?: string;
  title?: string;
}

/**
 * Save a drawing to IndexedDB
 * @param character - Character type drawn
 * @param type - Drawing type/category
 * @param imageData - Base64 encoded image data
 * @returns The saved drawing object
 */
export const saveDrawing = async (
  character: string,
  type: string,
  imageData: string
): Promise<SavedDrawing> => {
  const now = new Date();
  const drawing: SavedDrawing = {
    id: `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    character,
    type,
    imageData,
    timestamp: Date.now(),
    dateString: now.toLocaleDateString(),
    synced: false,
    title: `${type}-${character}`,
  };

  // Get current user if authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    drawing.userId = user.id;
  }

  // Store in IndexedDB with proper schema mapping
  await jubeeDB.put('drawings', {
    id: drawing.id,
    imageData: drawing.imageData,
    title: drawing.title,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    synced: false,
  });
  
  return drawing;
};

/**
 * Get all saved drawings from IndexedDB
 * @returns Array of saved drawings, sorted by timestamp (newest first)
 */
export const getSavedDrawings = async (): Promise<SavedDrawing[]> => {
  const dbDrawings = await jubeeDB.getAll('drawings');
  
  // Convert from DB schema to SavedDrawing schema
  const drawings: SavedDrawing[] = dbDrawings.map(dbDrawing => ({
    id: dbDrawing.id,
    imageData: dbDrawing.imageData,
    character: dbDrawing.title?.split('-')[1] || 'unknown',
    type: dbDrawing.title?.split('-')[0] || 'drawing',
    timestamp: new Date(dbDrawing.createdAt).getTime(),
    dateString: new Date(dbDrawing.createdAt).toLocaleDateString(),
    synced: dbDrawing.synced,
    title: dbDrawing.title,
  }));
  
  // Sort by timestamp descending (newest first)
  return drawings.sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Delete a specific drawing
 * @param id - Drawing ID to delete
 */
export const deleteDrawing = async (id: string): Promise<void> => {
  await jubeeDB.delete('drawings', id);
  
  // Also delete from Supabase if synced
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from('drawings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
  }
};

/**
 * Clear all drawings
 */
export const clearAllDrawings = async (): Promise<void> => {
  await jubeeDB.clear('drawings');
  
  // Also clear from Supabase if authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from('drawings')
      .delete()
      .eq('user_id', user.id);
  }
};

/**
 * Get unsynced drawings
 * @returns Array of drawings that haven't been synced to Supabase
 */
export const getUnsyncedDrawings = async (): Promise<SavedDrawing[]> => {
  const dbDrawings = await jubeeDB.getUnsynced('drawings');
  
  // Convert from DB schema to SavedDrawing schema
  return dbDrawings.map(dbDrawing => ({
    id: dbDrawing.id,
    imageData: dbDrawing.imageData,
    character: dbDrawing.title?.split('-')[1] || 'unknown',
    type: dbDrawing.title?.split('-')[0] || 'drawing',
    timestamp: new Date(dbDrawing.createdAt).getTime(),
    dateString: new Date(dbDrawing.createdAt).toLocaleDateString(),
    synced: dbDrawing.synced,
    title: dbDrawing.title,
  }));
};

/**
 * Mark a drawing as synced
 * @param id - Drawing ID to mark as synced
 */
export const markDrawingAsSynced = async (id: string): Promise<void> => {
  const drawing = await jubeeDB.get('drawings', id);
  if (drawing) {
    drawing.synced = true;
    await jubeeDB.put('drawings', drawing);
  }
};
