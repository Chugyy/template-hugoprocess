import { Theme } from '@/types';

export const getTableStyles = (theme: Theme) => ({
  table: {
    display: 'grid',
    width: '100%',
    backgroundColor: theme.colors.background.paper,
    borderRadius: '8px',
    overflow: 'hidden',
    border: `1px solid ${theme.colors.divider}`
  },
  
  cell: {
    padding: theme.spacing.values.sm,
    overflow: 'hidden',
    minWidth: 0,
    display: 'flex',
    alignItems: 'center'
  },
  
  header: {
    fontWeight: 600,
    backgroundColor: theme.colors.action.hover,
    borderBottom: `1px solid ${theme.colors.divider}`
  },
  
  cellContent: {
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  
  actionsCellContent: {
    width: '100%',
    overflow: 'visible',
    textOverflow: 'clip',
    whiteSpace: 'nowrap'
  },
  
  input: {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 'inherit',
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.text.primary,
    padding: '2px 4px',
    borderRadius: '2px',
    transition: 'background-color 0.2s'
  },
  
  inputFocus: {
    backgroundColor: theme.colors.action.hover,
    borderRadius: '4px'
  },
  
  select: {
    width: '100%',
    padding: '4px 8px',
    border: `1px solid ${theme.colors.divider}`,
    borderRadius: '4px',
    backgroundColor: theme.colors.background.paper,
    fontSize: '0.875rem',
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.text.primary
  },
  
  emptyState: {
    padding: theme.spacing.values.xl,
    textAlign: 'center' as const,
    backgroundColor: theme.colors.background.paper,
    borderRadius: '8px',
    border: `1px solid ${theme.colors.divider}`,
    color: theme.colors.text.secondary
  },
  
  row: {
    borderBottom: `1px solid ${theme.colors.divider}`
  },
  
  lastRow: {
    borderBottom: 'none'
  }
});