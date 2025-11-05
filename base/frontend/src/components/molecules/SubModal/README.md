# SubModal

Composant modal réutilisable pour afficher du contenu organisé en catégories sous un élément déclencheur.

## Fonctionnalités

- **Positionnement flexible** : bottom-start, bottom-end, bottom-center
- **Système de catégories** : Onglets pour organiser le contenu
- **Footer optionnel** : Pour actions globales (Clear All, Reset, etc.)
- **Débordement des dropdowns** : Les Select sortent de la modal pour une meilleure UX
- **Fermeture automatique** : Clic à l'extérieur
- **Design tokens** : Cohérent avec le design system
- **Responsif** : Largeur configurable
- **Z-index optimisé** : Gestion automatique des couches d'affichage

## Utilisation

### Simple (sans catégories)
```tsx
<SubModal
  trigger={<Button>Open Modal</Button>}
  title="Simple Modal"
>
  <div>Contenu simple</div>
</SubModal>
```

### Avec catégories et footer
```tsx
const categories = [
  {
    key: 'general',
    label: 'General',
    children: <div>Contenu General</div>
  },
  {
    key: 'advanced',
    label: 'Advanced', 
    children: <div>Contenu Advanced</div>
  }
];

<SubModal
  trigger={<Button icon="settings">Settings</Button>}
  title="Settings"
  categories={categories}
  footer={
    <Button variant="tertiary" fullWidth>
      Reset to Defaults
    </Button>
  }
  width="400px"
  placement="bottom-center"
/>
```

## Cas d'usage suggérés

- **Filtres** : Organisation des filtres par catégories (General, Dates, Status)
- **Notifications** : Affichage des notifications avec onglets (All, Unread, Important)
- **Paramètres** : Configuration avec sections (Account, Privacy, Notifications)
- **Actions en lot** : Menu d'actions avec catégories (Edit, Export, Delete)
- **Sélection complexe** : Multi-select avec groupes d'options

## Props

| Prop | Type | Description |
|------|------|-------------|
| `trigger` | ReactNode | Élément déclencheur |
| `title?` | string | Titre de la modal |
| `categories?` | SubModalCategory[] | Onglets avec contenu |
| `children?` | ReactNode | Contenu simple (si pas de catégories) |
| `footer?` | ReactNode | Contenu du footer (boutons, texte) |
| `placement?` | string | Position relative au trigger |
| `width?` | string | Largeur de la modal |
| `onClose?` | () => void | Callback de fermeture |

## Interface SubModalCategory

```tsx
interface SubModalCategory {
  key: string;       // Identifiant unique
  label: string;     // Texte de l'onglet
  children: ReactNode; // Contenu de la catégorie
}
```