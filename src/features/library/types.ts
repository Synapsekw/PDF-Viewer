/**
 * Types for the PDF Library feature
 */

export interface LibraryPDF {
  id: string;
  name: string;
  originalName: string;
  size: number;
  addedDate: Date;
  pageCount?: number;
  blob: Blob;
  thumbnail?: string; // base64 encoded thumbnail
}

export interface LibraryPDFMetadata {
  id: string;
  name: string;
  originalName: string;
  size: number;
  addedDate: Date;
  pageCount?: number;
  thumbnail?: string;
}

export type SortOption = 'name' | 'date' | 'size';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';

export interface LibraryFilters {
  search: string;
  sortBy: SortOption;
  sortDirection: SortDirection;
}

export interface LibraryState {
  pdfs: LibraryPDFMetadata[];
  viewMode: ViewMode;
  filters: LibraryFilters;
  isLoading: boolean;
  selectedPdfs: string[];
}

// Repository interface for swapping storage implementations
export interface LibraryRepository {
  add(file: File): Promise<LibraryPDF>;
  get(id: string): Promise<LibraryPDF | null>;
  list(): Promise<LibraryPDFMetadata[]>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}
