import React from 'react';
import { Search, Grid, List, SortAsc, SortDesc, Upload, Plus } from 'lucide-react';
import { ViewMode, SortOption, SortDirection, LibraryFilters } from '../types';

interface LibraryControlsProps {
  filters: LibraryFilters;
  viewMode: ViewMode;
  onFiltersChange: (filters: LibraryFilters) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onUpload: () => void;
}

export const LibraryControls: React.FC<LibraryControlsProps> = ({
  filters,
  viewMode,
  onFiltersChange,
  onViewModeChange,
  onUpload
}) => {
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'name', label: 'Name' },
    { value: 'date', label: 'Date Added' },
    { value: 'size', label: 'File Size' }
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Left side - Search and filters */}
      <div className="flex flex-1 gap-4 items-center max-w-2xl">
        {/* Search */}
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search PDFs..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:border-slate-600"
          />
        </div>
        
        {/* Sort controls */}
        <div className="flex items-center gap-2">
          <select
            value={filters.sortBy}
            onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value as SortOption })}
            className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/50"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => onFiltersChange({ 
              ...filters, 
              sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc' 
            })}
            className="p-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
            title={`Sort ${filters.sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {filters.sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* Right side - View controls and actions */}
      <div className="flex items-center gap-2">
        {/* View mode toggle */}
        <div className="flex border border-slate-700/50 rounded-lg overflow-hidden">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 transition-colors ${
              viewMode === 'grid' 
                ? 'bg-slate-600 text-slate-200' 
                : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 transition-colors ${
              viewMode === 'list' 
                ? 'bg-slate-600 text-slate-200' 
                : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
        
        {/* Upload button */}
        <button
          onClick={onUpload}
          className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add PDF
        </button>
      </div>
    </div>
  );
};
