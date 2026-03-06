/**
 * DATABASE SCHEMA TYPES (MATCHING SUPABASE)
 */

export interface RemoteList {
  id?: string; // UUID from Supabase
  user_id: string;
  name: string;
  icon?: string;
  description?: string;
  created_at: string; // ISO String
  updated_at: string; // ISO String
  local_id?: number;
}

export interface RemoteItem {
  id?: string; // UUID from Supabase
  user_id: string;
  title: string;
  type: string; // Use string for DB, cast to ItemType in app
  status: string; // Use string for DB, cast to ItemStatus in app
  image?: string;
  description?: string;
  year?: number;
  rating?: number;
  progress?: number;
  total_progress?: number;
  current_season?: number;
  current_episode?: number;
  episodes_per_season?: number[];
  is_archived?: boolean;
  trailer_url?: string;
  watch_providers?: any[]; // Keep any for JSON until schema defined
  related_external_ids?: string[];
  notes?: string;
  tags?: string[];
  external_id?: string;
  source?: string;
  created_at: string;
  updated_at: string;
  list_id?: string; // UUID of the list
  local_id?: number;
}

export interface RemoteDeletedMetadata {
  id: string;
  table: string;
  user_id: string;
  deleted_at: string;
}
