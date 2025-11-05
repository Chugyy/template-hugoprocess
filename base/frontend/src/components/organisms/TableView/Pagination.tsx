import React from 'react';
import { useTheme } from '@/hooks';
import Button from '@/components/atoms/Button';
import Text from '@/components/atoms/Text';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  maxVisiblePages?: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  maxVisiblePages = 5,
  onPageChange
}) => {
  const { theme } = useTheme();

  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.values.md,
    backgroundColor: theme.colors.background.paper,
    borderTop: `1px solid ${theme.colors.divider}`
  };

  const paginationStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.values.xs
  };

  const pageButtonStyle = (page: number): React.CSSProperties => ({
    minWidth: '32px',
    height: '32px',
    padding: '4px 8px',
    border: `1px solid ${theme.colors.divider}`,
    borderRadius: '4px',
    background: page === currentPage 
      ? theme.colors.primary.main 
      : theme.colors.background.paper,
    color: page === currentPage 
      ? theme.colors.primary.contrastText 
      : theme.colors.text.primary,
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: page === currentPage ? '600' : '400',
    transition: 'all 0.2s'
  });

  return (
    <div style={containerStyle}>
      <Text variant="body2" style={{ color: theme.colors.text.secondary }}>
        Showing {startItem} to {endItem} of {totalCount} results
      </Text>
      
      <div style={paginationStyle}>
        <Button
          variant="tertiary"
          size="small"
          icon="chevron-left"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        
        {visiblePages[0] > 1 && (
          <>
            <button
              style={pageButtonStyle(1)}
              onClick={() => onPageChange(1)}
            >
              1
            </button>
            {visiblePages[0] > 2 && (
              <Text variant="body2" style={{ padding: '0 4px' }}>...</Text>
            )}
          </>
        )}
        
        {visiblePages.map(page => (
          <button
            key={page}
            style={pageButtonStyle(page)}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        
        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <Text variant="body2" style={{ padding: '0 4px' }}>...</Text>
            )}
            <button
              style={pageButtonStyle(totalPages)}
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}
        
        <Button
          variant="tertiary"
          size="small"
          icon="chevron-right"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Pagination;