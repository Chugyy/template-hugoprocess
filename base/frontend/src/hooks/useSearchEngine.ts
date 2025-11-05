import { useState, useMemo, useCallback } from 'react';
import { SearchEngineState, SearchEngineConfig } from '@/types/components';

export interface UseSearchEngineReturn<T> {
  query: string;
  filters: Record<string, any>;
  sort: { field: string; direction: 'asc' | 'desc' } | null;
  pagination: { page: number; size: number };
  selection: Set<string>;
  data: T[];
  totalData: T[];
  totalCount: number;
  totalPages: number;
  hasSelection: boolean;
  isAllSelected: boolean;
  search: (query: string) => void;
  filter: (key: string, value: any) => void;
  clearFilter: (key: string) => void;
  clearAllFilters: () => void;
  sort: (field: string, direction?: 'asc' | 'desc') => void;
  clearSort: () => void;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  select: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
}

export function useSearchEngine<T extends Record<string, any>>(
  data: T[],
  config: SearchEngineConfig
) {
  const [state, setState] = useState<SearchEngineState<T>>({
    query: '',
    filters: {},
    sort: config.defaultSort || null,
    pagination: { page: 1, size: config.pageSize || 10 },
    selection: new Set(),
    processedData: []
  });

  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (state.query.trim()) {
      const query = state.query.toLowerCase().trim();
      result = result.filter(item =>
        config.searchableFields.some(field => {
          const value = item[field];
          return value?.toString().toLowerCase().includes(query);
        })
      );
    }

    // Filters
    Object.entries(state.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          result = result.filter(item => value.includes(item[key]));
        } else {
          result = result.filter(item => item[key] === value);
        }
      }
    });

    // Sort
    if (state.sort) {
      result.sort((a, b) => {
        const aValue = a[state.sort!.field];
        const bValue = b[state.sort!.field];
        
        if (aValue === bValue) return 0;
        
        const comparison = aValue > bValue ? 1 : -1;
        return state.sort!.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, state.query, state.filters, state.sort, config.searchableFields]);

  const paginatedData = useMemo(() => {
    const start = (state.pagination.page - 1) * state.pagination.size;
    const end = start + state.pagination.size;
    return processedData.slice(start, end);
  }, [processedData, state.pagination]);

  const search = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      query,
      pagination: { ...prev.pagination, page: 1 }
    }));
  }, []);

  const filter = useCallback((key: string, value: any) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
      pagination: { ...prev.pagination, page: 1 }
    }));
  }, []);

  const clearFilter = useCallback((key: string) => {
    setState(prev => {
      const newFilters = { ...prev.filters };
      delete newFilters[key];
      return {
        ...prev,
        filters: newFilters,
        pagination: { ...prev.pagination, page: 1 }
      };
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {},
      pagination: { ...prev.pagination, page: 1 }
    }));
  }, []);

  const sort = useCallback((field: string, direction?: 'asc' | 'desc') => {
    setState(prev => {
      const newDirection = direction || 
        (prev.sort?.field === field && prev.sort.direction === 'asc' ? 'desc' : 'asc');
      
      return {
        ...prev,
        sort: { field, direction: newDirection }
      };
    });
  }, []);

  const clearSort = useCallback(() => {
    setState(prev => ({ ...prev, sort: null }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page }
    }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setState(prev => ({
      ...prev,
      pagination: { page: 1, size }
    }));
  }, []);

  const select = useCallback((id: string) => {
    setState(prev => {
      const newSelection = new Set(prev.selection);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { ...prev, selection: newSelection };
    });
  }, []);

  const selectAll = useCallback(() => {
    setState(prev => {
      const allIds = new Set(processedData.map((item, index) => item.id || index.toString()));
      return { ...prev, selection: allIds };
    });
  }, [processedData]);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selection: new Set() }));
  }, []);

  const totalPages = Math.ceil(processedData.length / state.pagination.size);
  const hasSelection = state.selection.size > 0;
  const isAllSelected = state.selection.size === processedData.length && processedData.length > 0;

  return {
    // State
    query: state.query,
    filters: state.filters,
    sort: state.sort,
    pagination: state.pagination,
    selection: state.selection,
    
    // Computed data
    data: paginatedData,
    totalData: processedData,
    totalCount: processedData.length,
    totalPages,
    hasSelection,
    isAllSelected,
    
    // Actions
    search,
    filter,
    clearFilter,
    clearAllFilters,
    sort,
    clearSort,
    goToPage,
    setPageSize,
    select,
    selectAll,
    clearSelection
  };
}