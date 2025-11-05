/**
 * Centralized z-index management
 *
 * This file defines all z-index values used across the application.
 * Use these constants instead of hardcoded values to ensure consistency.
 *
 * Layer hierarchy (from bottom to top):
 * - BASE: Default page content
 * - SIDEBAR: Side panels and sheets
 * - MODAL: Dialogs and modals
 * - DROPDOWN: Select dropdowns, popovers, context menus
 * - TOOLTIP: Tooltips
 * - TOAST: Toast notifications
 */

export const Z_INDEX = {
  // Base layer
  BASE: 0,

  // Sidebars & Sheets
  SIDEBAR: 50,
  SIDEBAR_STEP: 1,  // Increment per nesting level

  // Modals & Overlays
  MODAL_BACKDROP: 100,
  MODAL: 100,

  // Interactive elements (always above modals)
  DROPDOWN: 150,
  POPOVER: 150,
  CONTEXT_MENU: 150,

  // Notifications
  TOOLTIP: 200,
  TOAST: 300,
} as const

/**
 * Calculate z-index for nested sidebars/sheets
 * @param base - Base z-index layer (e.g., Z_INDEX.SIDEBAR)
 * @param depth - Nesting depth (0 for first level, 1 for second, etc.)
 * @returns Computed z-index value
 *
 * @example
 * // First sidebar (contact)
 * getNestedZIndex(Z_INDEX.SIDEBAR, 0) // 50
 *
 * // Second sidebar (exchange, nested in contact)
 * getNestedZIndex(Z_INDEX.SIDEBAR, 1) // 51
 */
export function getNestedZIndex(base: number, depth: number): number {
  return base + (depth * Z_INDEX.SIDEBAR_STEP)
}

/**
 * Type-safe z-index keys
 */
export type ZIndexKey = keyof typeof Z_INDEX
