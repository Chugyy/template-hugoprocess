import React, { useState } from 'react';
import { TableViewProps } from '@/types/components';
import { useSearchEngine } from '@/hooks/useSearchEngine';
import { useTheme } from '@/hooks';
import TableToolbar from './TableToolbar';
import TableLayout from './TableLayout';
import KanbanLayout from './KanbanLayout';
import ListLayout from './ListLayout';
import SelectionModal from './SelectionModal';
import EditModal from './EditModal';
import Pagination from './Pagination';

const TableView = <T extends Record<string, any>>({
  config,
  data,
  toolbar = {},
  loading = false,
  onLayoutChange,
  onSelectionChange,
  onBatchAction,
  onDataUpdate,
  className = ''
}: TableViewProps<T>) => {
  const { theme } = useTheme();
  const [currentLayout, setCurrentLayout] = useState(config.layout);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentGroupBy, setCurrentGroupBy] = useState<string>(config.groupBy || 'status');
  const [editModal, setEditModal] = useState<{ isOpen: boolean; data: T | null }>({
    isOpen: false,
    data: null
  });
  
  const searchEngine = useSearchEngine(data, config.searchEngine);

  const handleLayoutChange = (layout: 'table' | 'kanban' | 'list') => {
    setCurrentLayout(layout);
    onLayoutChange?.(layout);
  };

  const handleSelectionChange = (newSelectedIds: Set<string>) => {
    setSelectedIds(newSelectedIds);
    onSelectionChange?.(newSelectedIds);
  };

  const handleBatchAction = (action: any, selectedIds: Set<string>) => {
    onBatchAction?.(action, selectedIds);
    setSelectedIds(new Set());
  };

  const handleRowAction = (action: string, row: T) => {
    switch (action) {
      case 'edit':
        setEditModal({ isOpen: true, data: row });
        break;
      case 'delete':
        console.log('Delete action for:', row);
        // TODO: Implement delete logic
        break;
      case 'duplicate':
        console.log('Duplicate action for:', row);
        // TODO: Implement duplicate logic
        break;
      default:
        console.log(`${action} action for:`, row);
    }
  };

  const handleEditSave = (updatedData: T) => {
    console.log('Save edited data:', updatedData);
    // TODO: Implement save logic
    setEditModal({ isOpen: false, data: null });
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.values.md,
    width: '100%'
  };

  const renderLayout = () => {
    const layoutProps = {
      config: { ...config, groupBy: currentGroupBy },
      data: searchEngine.data,
      totalCount: searchEngine.totalCount,
      loading,
      searchEngine,
      selectedIds,
      onSelectionChange: handleSelectionChange,
      onRowAction: handleRowAction,
      onDataUpdate
    };

    switch (currentLayout) {
      case 'kanban':
        return <KanbanLayout {...layoutProps} />;
      case 'list':
        return <ListLayout {...layoutProps} />;
      default:
        return <TableLayout {...layoutProps} />;
    }
  };

  return (
    <div className={className} style={containerStyle}>
      {(toolbar.search || toolbar.filters || toolbar.viewSwitcher || toolbar.export) && (
        <TableToolbar
          config={toolbar}
          currentLayout={currentLayout}
          onLayoutChange={handleLayoutChange}
          searchEngine={searchEngine}
          filters={config.filters}
          selectedCount={selectedIds.size}
          fields={config.fields}
          groupBy={currentGroupBy}
          onGroupByChange={(newGroupBy) => {
            setCurrentGroupBy(newGroupBy);
          }}
        />
      )}
      
      {renderLayout()}
      
      {(config.searchEngine.showPagination !== false) && searchEngine.totalPages > 1 && (
        <Pagination
          currentPage={searchEngine.pagination.page}
          totalPages={searchEngine.totalPages}
          pageSize={searchEngine.pagination.size}
          totalCount={searchEngine.totalCount}
          maxVisiblePages={config.searchEngine.maxVisiblePages || 5}
          onPageChange={searchEngine.goToPage}
        />
      )}

      {config.selectable && config.batchActions && selectedIds.size > 0 && (
        <SelectionModal
          selectedCount={selectedIds.size}
          actions={config.batchActions}
          onAction={(action) => handleBatchAction(action, selectedIds)}
          onCancel={() => setSelectedIds(new Set())}
        />
      )}

      {editModal.data && (
        <EditModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, data: null })}
          onSave={handleEditSave}
          data={editModal.data}
          fields={config.fields}
          title="Edit Item"
        />
      )}
    </div>
  );
};

export default TableView;