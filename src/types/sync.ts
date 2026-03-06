export interface SyncError {
  context: "lists" | "items" | "deletions" | "auth";
  message: string;
  originalError?: any;
}

export interface SyncResult {
  success: boolean;
  timestamp: Date;
  processedCount: {
    lists: number;
    items: number;
    deletions: number;
  };
  errors: SyncError[];
}

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export interface SyncState {
  status: SyncStatus;
  lastResult: SyncResult | null;
  isOnline: boolean;
}
