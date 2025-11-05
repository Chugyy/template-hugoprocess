import useTheme from './useTheme';

export default function useComponentDefaults() {
  const { theme } = useTheme();

  return {
    // Container de base avec padding standardisé
    paddedContainer: (size: 'sm' | 'md' | 'lg' = 'md') => ({
      padding: theme.layout.container.padding,
      ...(size === 'lg' && { padding: theme.layout.container.padding * 1.5 }),
      ...(size === 'sm' && { padding: theme.layout.container.padding * 0.75 })
    }),

    // Flex containers standardisés
    flexContainer: (
      direction: 'row' | 'column' = 'row',
      gap: 'tight' | 'standard' | 'loose' = 'standard',
      align: 'flex-start' | 'center' | 'flex-end' = 'center'
    ) => ({
      display: 'flex' as const,
      flexDirection: direction,
      gap: theme.components.gaps[gap],
      alignItems: align
    }),

    // Input containers avec états cohérents
    inputContainer: (
      focused: boolean,
      error: boolean,
      context: 'form' | 'modal' | 'toolbar' = 'form'
    ) => ({
      display: 'flex',
      alignItems: 'center',
      border: `1px solid ${error ? theme.colors.error.main : theme.colors.divider}`,
      borderRadius: theme.components.borderRadius.medium,
      backgroundColor: theme.colors.background.paper,
      transition: theme.layout.transitions.default,
      ...(focused && {
        borderColor: theme.colors.primary.main,
        boxShadow: `0 0 0 2px ${theme.colors.primary.main}20`
      }),
      ...(context === 'modal' && {
        backgroundColor: theme.colors.background.default
      })
    }),

    // Textarea field standardisé
    textareaField: (size: 'small' | 'medium' | 'large' = 'medium', maxHeight = 120) => ({
      height: theme.components.heights[size],
      padding: `${theme.components.padding[size].vertical}px ${theme.components.padding[size].horizontal}px`,
      fontSize: size === 'small' ? '0.875rem' : size === 'large' ? '1.125rem' : '1rem',
      border: 'none',
      outline: 'none',
      backgroundColor: 'transparent',
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fontFamily,
      resize: 'none' as const,
      minHeight: theme.components.heights[size],
      maxHeight,
      width: '100%'
    }),

    // Icon buttons cohérents
    iconButton: (size: 'small' | 'medium' | 'large' = 'medium') => ({
      width: theme.components.heights[size],
      height: theme.components.heights[size],
      minWidth: theme.components.heights[size],
      flexShrink: 0
    })
  };
}