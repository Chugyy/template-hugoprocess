import React, { useState } from 'react';
import { useTheme } from '@/hooks';
import Icon from '@/components/atoms/Icon';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  pagination?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  className?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  loading = false,
  pagination = false,
  onSort,
  className = ''
}) => {
  const { theme } = useTheme();
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const handleSort = (key: string) => {
    const direction = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(direction);
    onSort?.(key, direction);
  };

  const paginatedData = pagination 
    ? data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : data;

  const totalPages = Math.ceil(data.length / rowsPerPage);

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: theme.colors.background.paper,
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: theme.shadows.elevation['1']
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: theme.colors.background.default,
    borderBottom: `1px solid ${theme.colors.divider}`
  };

  const cellStyle: React.CSSProperties = {
    padding: theme.spacing.values.md,
    textAlign: 'left',
    borderBottom: `1px solid ${theme.colors.divider}`
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        padding: theme.spacing.values.xl 
      }}>
        <Icon name="spinner" size={24} />
      </div>
    );
  }

  return (
    <div className={className}>
      <table style={tableStyle}>
        <thead style={headerStyle}>
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key} 
                style={{
                  ...cellStyle,
                  cursor: column.sortable ? 'pointer' : 'default',
                  fontWeight: 600
                }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.values.xs }}>
                  <Text variant="body2">{column.label}</Text>
                  {column.sortable && (
                    <Icon 
                      name={sortKey === column.key 
                        ? (sortDirection === 'asc' ? 'chevron-up' : 'chevron-down')
                        : 'chevron-up-down'
                      } 
                      size={12} 
                    />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column.key} style={cellStyle}>
                  {column.render 
                    ? column.render(row[column.key], row)
                    : <Text variant="body2">{row[column.key]}</Text>
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {pagination && totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: theme.spacing.values.md,
          borderTop: `1px solid ${theme.colors.divider}`
        }}>
          <Text variant="body2">
            Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, data.length)} of {data.length} entries
          </Text>
          <div style={{ display: 'flex', gap: theme.spacing.values.xs }}>
            <Button
              variant="tertiary"
              size="small"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="tertiary"
              size="small"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;