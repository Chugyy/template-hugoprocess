export const DESIGN_TOKENS = {
  // Hauteurs standardisées pour TOUS les composants interactifs
  heights: {
    small: 32,
    medium: 40,    // Standard universel
    large: 48
  },
  
  // Paddings cohérents selon la taille
  paddings: {
    small: { vertical: 6, horizontal: 12 },
    medium: { vertical: 10, horizontal: 16 },  // Standard universel  
    large: { vertical: 12, horizontal: 24 }
  },
  
  // Gaps standardisés partout
  gaps: {
    tight: 4,     // Tags internes uniquement
    standard: 8,  // Standard universel
    loose: 12     // Groupes de composants
  },
  
  // Border-radius cohérents
  borderRadius: {
    small: 4,     // Select options, petits éléments
    medium: 6,    // Standard universel (Input, Button, Dropdown)
    large: 8,     // Modals, cards
    pill: 12      // Tags uniquement
  },
  
  // Espacement des icônes parfait
  iconSpacing: {
    offset: 12,   // Distance du bord
    size: 16      // Taille standard dans composants
  },
  
  // Espacement des containers standardisé
  containers: {
    padding: 16,  // Standard universel pour toolbars, modals, etc.
    gap: 16       // Gap standard entre sections
  },

  // NOUVEAU : Variants par défaut pour éviter la duplication
  variants: {
    // Tailles de composants interactifs cohérentes
    componentSizes: {
      small: { height: 32, padding: { vertical: 6, horizontal: 12 }, fontSize: '0.875rem' },
      medium: { height: 40, padding: { vertical: 10, horizontal: 16 }, fontSize: '1rem' },
      large: { height: 48, padding: { vertical: 12, horizontal: 24 }, fontSize: '1.125rem' }
    },
    
    // États d'interaction standardisés
    interactionStates: {
      default: { transition: 'all 0.2s ease' },
      hover: { transition: 'all 0.2s ease' },
      focus: { transition: 'all 0.2s ease' },
      disabled: { opacity: 0.6, cursor: 'not-allowed' as const }
    }
  }
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;