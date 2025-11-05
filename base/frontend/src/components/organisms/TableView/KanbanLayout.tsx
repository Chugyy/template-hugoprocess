import React, { useMemo, useState } from 'react';
import { TableViewConfig } from '@/types/components';
import { UseSearchEngineReturn } from '@/hooks/useSearchEngine';
import { useTheme } from '@/hooks';
import Text from '@/components/atoms/Text';
import Tag from '@/components/atoms/Tag';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent, 
  DragOverlay, 
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface KanbanLayoutProps<T = any> {
  config: TableViewConfig<T>;
  data: T[];
  totalCount: number;
  loading: boolean;
  searchEngine: UseSearchEngineReturn<T>;
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onRowAction?: (action: string, row: T) => void;
  onDataUpdate?: (updatedData: T[]) => void;
}

interface SortableCardProps<T> {
  item: T;
  config: TableViewConfig<T>;
  selectedIds: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onRowAction?: (action: string, row: T) => void;
  theme: any;
}

interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({ id, children, style }) => {
  const { setNodeRef } = useDroppable({ id });
  
  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
};

const SortableCard = <T extends Record<string, any>>({ 
  item, 
  config, 
  selectedIds, 
  onSelectionChange, 
  onRowAction, 
  theme 
}: SortableCardProps<T>) => {
  const itemId = item.id || String(item);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: itemId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const isSelected = selectedIds.has(itemId);
  const primaryField = config.fields.find(f => f.type === 'text') || config.fields[0];
  const secondaryField = config.fields.find(f => f.key !== primaryField.key && f.type === 'text');
  const tagField = config.fields.find(f => f.type === 'tag');
  const groupBy = config.groupBy || 'status';

  const handleSelectItem = (itemId: string) => {
    if (!onSelectionChange) return;
    const newSelection = new Set(selectedIds);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    onSelectionChange(newSelection);
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.colors.background.paper,
    border: `1px solid ${theme.colors.divider}`,
    borderRadius: `${theme.components.borderRadius.medium}px`,
    padding: `${theme.components.gaps.standard}px`,
    cursor: 'grab',
    transition: 'all 0.2s ease',
    boxShadow: theme.shadows.elevation['1'],
    minHeight: '120px',
    maxHeight: '120px',
    width: '100%',
    maxWidth: '280px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    ...style
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        ...cardStyle,
        backgroundColor: isSelected ? theme.colors.action.selected || theme.colors.primary.light : cardStyle.backgroundColor
      }}
      onMouseEnter={(e) => {
        if (!isSelected && !isDragging) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = theme.shadows.elevation['4'];
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected && !isDragging) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = theme.shadows.elevation['1'];
        }
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: `${theme.components.gaps.tight}px`,
        marginBottom: `${theme.components.gaps.standard}px` 
      }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => handleSelectItem(itemId)}
          style={{ cursor: 'pointer', marginTop: '2px' }}
          onClick={(e) => e.stopPropagation()}
        />
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ 
            fontWeight: 500, 
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '0.875rem',
            lineHeight: '1.25rem'
          }}>
            {item[primaryField.key]}
          </div>
        </div>
      </div>
      
      {secondaryField && (
        <div style={{ marginBottom: `${theme.components.gaps.standard}px`, paddingLeft: '20px', flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <div style={{ 
            color: theme.colors.text.secondary, 
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
            fontSize: '0.75rem',
            lineHeight: '1rem'
          }}>
            {item[secondaryField.key]}
          </div>
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
        paddingLeft: '20px'
      }}>
        {tagField && tagField.key !== groupBy && (
          <Tag
            label={item[tagField.key]}
            variant="status"
            color={item[tagField.key] === 'Active' ? 'success' : 'primary'}
            size="small"
          />
        )}
        
        <div style={{ display: 'flex', gap: `${theme.components.gaps.tight}px` }}>
          {config.actions?.slice(0, 2).map(action => (
            <Button
              key={action.key}
              variant="tertiary"
              size="small"
              icon={action.icon}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(item);
              }}
            />
          ))}
          <Button
            variant="primary"
            size="small"
            icon="edit"
            onClick={(e) => {
              e.stopPropagation();
              onRowAction?.('edit', item);
            }}
          />
          <Button
            variant="danger"
            size="small"
            icon="trash"
            onClick={(e) => {
              e.stopPropagation();
              onRowAction?.('delete', item);
            }}
          />
          <Button
            variant="tertiary"
            size="small"
            icon="copy"
            onClick={(e) => {
              e.stopPropagation();
              onRowAction?.('duplicate', item);
            }}
          />
        </div>
      </div>
    </div>
  );
};

const KanbanLayout = <T extends Record<string, any>>({
  config,
  data,
  loading,
  selectedIds = new Set(),
  onSelectionChange,
  onRowAction,
  onDataUpdate
}: KanbanLayoutProps<T>) => {
  const { theme } = useTheme();
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const groupBy = config.groupBy || 'status';
  
  // Configuration des couleurs par colonne (éditable dans le code)
  const columnColors: Record<string, string> = {
    'Active': '#10b981',      // Vert success
    'Inactive': '#ef4444',    // Rouge error  
    'Admin': '#dc004e',       // Rouge secondary
    'User': '#2563eb',        // Bleu primary
    'Moderator': '#d97706',   // Orange warning
    'Pending': '#f59e0b',     // Jaune warning
    'Completed': '#059669',   // Vert success dark
    'In Progress': '#0ea5e9', // Bleu info
    'Draft': '#6b7280',       // Gris
    'Published': '#10b981',   // Vert
    'Archived': '#9ca3af'     // Gris clair
  };
  
  // Définir l'ordre des colonnes de manière fixe
  const columnOrder = useMemo(() => {
    const groupField = config.fields.find(f => f.key === groupBy);
    if (groupField?.type === 'dropdown' && groupField.options) {
      return groupField.options.map(opt => opt.value);
    }
    // Ordre par défaut basé sur les couleurs configurées
    return Object.keys(columnColors);
  }, [groupBy, config.fields, columnColors]);
  
  const groupedData = useMemo(() => {
    const groups: Record<string, T[]> = {};
    
    // Initialiser toutes les colonnes même vides
    columnOrder.forEach(column => {
      groups[column] = [];
    });
    
    // Utiliser les données paginées du searchEngine
    const filteredData = data;
    
    filteredData.forEach((item: T) => {
      const groupValue = item[groupBy] || 'Ungrouped';
      if (!groups[groupValue]) {
        groups[groupValue] = [];
      }
      groups[groupValue].push(item);
    });
    
    return groups;
  }, [data, groupBy, columnOrder]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = () => {
    // Géré dans handleDragEnd pour éviter les boucles infinies
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Rechercher l'item actif dans toutes les données (pas seulement les données paginées)
    const activeItem = data.find(item => (item.id || String(item)) === activeId);
    if (!activeItem) return;

    const activeGroup = activeItem[groupBy] || 'Ungrouped';
    
    // Déterminer le groupe de destination
    let overGroup: string;
    const overItem = data.find(item => (item.id || String(item)) === overId);
    
    if (overItem) {
      // Si on survole une carte, prendre son groupe
      overGroup = overItem[groupBy] || 'Ungrouped';
    } else if (columnOrder.includes(overId)) {
      // Si on survole une colonne (utiliser columnOrder au lieu de groupedData)
      overGroup = overId;
    } else {
      return;
    }

    // Si on ne change pas de groupe et qu'on ne réordonne pas, ignorer
    if (activeGroup === overGroup && (!overItem || active.id === over.id)) {
      return;
    }

    // Créer les données mises à jour
    let updatedData = [...data];

    // Si on change de groupe
    if (activeGroup !== overGroup) {
      updatedData = updatedData.map(item => 
        (item.id || String(item)) === activeId 
          ? { ...item, [groupBy]: overGroup }
          : item
      );
    }
    // Si on réordonne dans le même groupe  
    else if (overItem && active.id !== over.id) {
      const groupItems = updatedData.filter(item => (item[groupBy] || 'Ungrouped') === activeGroup);
      const activeIndex = groupItems.findIndex(item => (item.id || String(item)) === activeId);
      const overIndex = groupItems.findIndex(item => (item.id || String(item)) === overId);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        const reorderedItems = arrayMove(groupItems, activeIndex, overIndex);
        const otherItems = updatedData.filter(item => (item[groupBy] || 'Ungrouped') !== activeGroup);
        updatedData = [...otherItems, ...reorderedItems];
      }
    }

    // Notifier la mise à jour
    onDataUpdate?.(updatedData);
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: `${theme.layout.container.gap}px`,
    overflowX: 'auto',
    padding: `${theme.components.gaps.standard}px`,
    minHeight: '400px'
  };

  const columnStyle: React.CSSProperties = {
    flex: '0 0 300px',
    width: '300px',
    backgroundColor: theme.colors.background.default,
    borderRadius: `${theme.components.borderRadius.large}px`,
    padding: `${theme.components.gaps.standard}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.components.gaps.standard}px`,
    overflow: 'hidden'
  };

  const activeItem = activeId ? data.find(item => (item.id || String(item)) === activeId) : null;


  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: `${theme.layout.container.padding * 2}px`,
        backgroundColor: theme.colors.background.paper,
        borderRadius: `${theme.components.borderRadius.large}px`,
        border: `1px solid ${theme.colors.divider}`
      }}>
        <Icon name="spinner" size={24} />
        <Text variant="body2" style={{ marginLeft: `${theme.components.gaps.standard}px` }}>
          Loading...
        </Text>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: `${theme.layout.container.padding * 2}px`,
        backgroundColor: theme.colors.background.paper,
        borderRadius: `${theme.components.borderRadius.large}px`,
        border: `1px solid ${theme.colors.divider}`,
        textAlign: 'center'
      }}>
        <div style={{ color: theme.colors.text.disabled, marginBottom: `${theme.layout.container.gap}px` }}>
          <Icon name="columns" size={48} />
        </div>
        <Text variant="h3" style={{ marginBottom: `${theme.components.gaps.standard}px` }}>
          No data found
        </Text>
        <Text variant="body2" style={{ color: theme.colors.text.secondary }}>
          Add some data to see it organized in kanban columns
        </Text>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div style={containerStyle}>
        {columnOrder.map((groupName) => {
          const items = groupedData[groupName] || [];
          return (
          <DroppableColumn
            key={groupName}
            id={groupName}
            style={{
              ...columnStyle,
              minHeight: '200px',
              backgroundColor: `${columnColors[groupName] || theme.colors.primary.main}10`,
              border: `1px solid ${columnColors[groupName] || theme.colors.primary.main}20`
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: `${theme.components.gaps.standard}px`,
              padding: `${theme.components.gaps.standard}px`,
              backgroundColor: `${columnColors[groupName] || theme.colors.primary.main}20`,
              borderRadius: `${theme.components.borderRadius.medium}px`
            }}>
              <Text variant="body2" style={{ fontWeight: 600, margin: 0 }}>
                {groupName}
              </Text>
              <div style={{
                backgroundColor: columnColors[groupName] || theme.colors.primary.main,
                color: '#ffffff',
                borderRadius: `${theme.components.borderRadius.pill}px`,
                padding: '2px 8px',
                fontSize: '0.75rem',
                fontWeight: 500
              }}>
                {items.length}
              </div>
            </div>
            
            <SortableContext 
              items={items.map(item => item.id || String(item))}
              strategy={verticalListSortingStrategy}
            >
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: `${theme.components.gaps.loose}px`,
                  flex: 1,
                  minHeight: '100px',
                  padding: `${theme.components.gaps.tight}px`
                }}
                data-droppable-id={groupName}
              >
                {items.map(item => (
                  <SortableCard
                    key={item.id || String(item)}
                    item={item}
                    config={config}
                    selectedIds={selectedIds}
                    onSelectionChange={onSelectionChange}
                    onRowAction={onRowAction}
                    theme={theme}
                  />
                ))}
                {items.length === 0 && (
                  <div 
                    style={{
                      padding: `${theme.components.gaps.loose}px`,
                      textAlign: 'center',
                      color: theme.colors.text.disabled,
                      fontSize: '0.875rem',
                      minHeight: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px dashed ${theme.colors.divider}`,
                      borderRadius: `${theme.components.borderRadius.medium}px`
                    }}
                    data-empty-column={groupName}
                  >
                    Drop items here
                  </div>
                )}
              </div>
            </SortableContext>
          </DroppableColumn>
          );
        })}
        </div>
        
        <DragOverlay>
        {activeItem && (
          <SortableCard
            item={activeItem}
            config={config}
            selectedIds={selectedIds}
            onSelectionChange={onSelectionChange}
            onRowAction={onRowAction}
            theme={theme}
          />
        )}
        </DragOverlay>
      </DndContext>
    </>
  );
};

export default KanbanLayout;