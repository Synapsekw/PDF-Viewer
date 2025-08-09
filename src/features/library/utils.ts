/**
 * Utility functions for the PDF Library
 */

import { LibraryPDFMetadata, LibraryFilters, SortOption, SortDirection } from './types';

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return 'Today';
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else if (diffInHours < 168) { // 7 days
    return `${Math.floor(diffInHours / 24)} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Filter and sort PDFs based on criteria
 */
export function filterAndSortPDFs(
  pdfs: LibraryPDFMetadata[],
  filters: LibraryFilters
): LibraryPDFMetadata[] {
  let filtered = [...pdfs];
  
  // Apply search filter
  if (filters.search.trim()) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(pdf => 
      pdf.name.toLowerCase().includes(searchLower) ||
      pdf.originalName.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    let comparison = 0;
    
    switch (filters.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = a.addedDate.getTime() - b.addedDate.getTime();
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
    }
    
    return filters.sortDirection === 'desc' ? -comparison : comparison;
  });
  
  return filtered;
}

/**
 * Check if a file is a valid PDF
 */
export function isValidPDF(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Generate a unique filename if there's a conflict
 */
export function generateUniqueFileName(fileName: string, existingNames: string[]): string {
  const baseName = fileName.replace(/\.pdf$/i, '');
  const extension = '.pdf';
  
  if (!existingNames.includes(fileName)) {
    return fileName;
  }
  
  let counter = 1;
  let newName: string;
  
  do {
    newName = `${baseName} (${counter})${extension}`;
    counter++;
  } while (existingNames.includes(newName));
  
  return newName;
}
