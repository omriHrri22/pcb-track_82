import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Search, X, Filter } from 'lucide-react';
import { useState } from 'react';

export interface FilterCriteria {
  searchText: string;
  project: string;
  currentStage: string;
  arrived: string;
}

interface FilterBarProps {
  filters: FilterCriteria;
  onFiltersChange: (filters: FilterCriteria) => void;
  projects: string[];
  stages: string[];
  totalBoards: number;
  filteredBoards: number;
}

export function FilterBar({
  filters,
  onFiltersChange,
  projects,
  stages,
  totalBoards,
  filteredBoards,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleReset = () => {
    onFiltersChange({
      searchText: '',
      project: 'all',
      currentStage: 'all',
      arrived: 'all',
    });
  };

  const hasActiveFilters = 
    filters.searchText !== '' ||
    filters.project !== 'all' ||
    filters.currentStage !== 'all' ||
    filters.arrived !== 'all';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Search bar and toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by board name, part number, or revision..."
            value={filters.searchText}
            onChange={(e) => onFiltersChange({ ...filters, searchText: e.target.value })}
            className="pl-10"
          />
        </div>
        <Button
          variant={isExpanded ? 'default' : 'outline'}
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && !isExpanded && (
            <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">
              Active
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleReset} className="flex items-center gap-2">
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          {/* Project filter */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Project</Label>
            <Select
              value={filters.project}
              onValueChange={(value) => onFiltersChange({ ...filters, project: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Arrived filter */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Arrived</Label>
            <Select
              value={filters.arrived}
              onValueChange={(value) => onFiltersChange({ ...filters, arrived: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="arrived">Arrived</SelectItem>
                <SelectItem value="not-arrived">Not Arrived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Current Stage filter */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Current Stage</Label>
            <Select
              value={filters.currentStage}
              onValueChange={(value) => onFiltersChange({ ...filters, currentStage: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {stages.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Results count */}
      {hasActiveFilters && (
        <div className="text-sm text-gray-600 pt-2 border-t border-gray-200">
          Showing {filteredBoards} of {totalBoards} {totalBoards === 1 ? 'board' : 'boards'}
        </div>
      )}
    </div>
  );
}