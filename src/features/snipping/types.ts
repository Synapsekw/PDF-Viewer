export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnippingState {
  isEnabled: boolean;
  isSelecting: boolean;
  startPoint: { x: number; y: number } | null;
  currentSelection: SelectionRect | null;
  completedSelection: SelectionRect | null;
}

export interface SnippingToolConfig {
  selectionBorderColor: string;
  selectionBorderWidth: number;
  selectionFillColor: string;
  selectionFillOpacity: number;
  minSelectionSize: number;
}

export interface SnippingActions {
  enableTool: () => void;
  disableTool: () => void;
  clearSelection: () => void;
  copySelection: () => Promise<void>;
  downloadSelection: (filename?: string) => void;
}