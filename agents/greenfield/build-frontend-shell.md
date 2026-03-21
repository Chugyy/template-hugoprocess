---
name: build-frontend-shell
description: >
  Génère le shell frontend : layout, navigation, pages, providers, routing.
  Assemble les composants et services produits par les agents entity-frontend.
allowed-tools: Read, Write, Edit, Glob, Grep
model: sonnet
---

# Build Frontend Shell

## Objectif

Générer la structure globale du frontend : layout, sidebar, navigation, pages, providers. Cet agent assemble les composants et services déjà produits par les agents `build-entity-frontend`.

## Arguments attendus

- `frontend_arch_path` : Chemin vers frontend-architecture.md
- `frontend_path` : Chemin vers le frontend (ex: `dev/frontend`)

## Process

### 1. Lire les inputs

1. `{frontend_arch_path}` — Layout global, pages, navigation, rôles
2. Lister `{frontend_path}/src/services/*/` — Entités déjà codées
3. Lister `{frontend_path}/src/components/*/` — Composants déjà créés
4. Lister `{frontend_path}/src/components/ui/` — Composants shadcn disponibles
5. Si des composants layout sont marqués **Référence** dans l'architecture → lire le code source dans `.claude/resources/templates/projects/{project}/` pour s'en inspirer (ex: AppShell, Sidebar, Header depuis `dashboard-crm`)

### 2. Générer Layout (`app/layout.tsx`)

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/lib/providers';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '{App Name}',
  description: '{description}',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Header />
              <main className="flex-1 overflow-auto p-6">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
```

### 3. Générer composants Layout

**Sidebar** (`components/layout/sidebar.tsx`) :
- Navigation items depuis frontend-architecture (layout global section)
- Conditional display par rôle si mentionné
- Utiliser composant `ui/sidebar.tsx` comme base

**Header** (`components/layout/header.tsx`) :
- Logo, titre
- User menu (avatar + dropdown)
- Utiliser `ui/dropdown-menu.tsx`, `ui/avatar.tsx`

### 4. Générer Pages

Pour chaque page dans frontend-architecture :

**Page liste** (`app/{entities}/page.tsx`) :
```tsx
import { use{Entities} } from '@/hooks/use-{entity}';
// Importer composants de l'entité

export default function {Entities}Page() {
  const { data, isLoading, error } = use{Entities}();

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState />;
  if (!data?.data.length) return <EmptyState />;

  return (
    <div>
      <h1>{Entities}</h1>
      {/* Utiliser les composants entity */}
    </div>
  );
}
```

**Page détail** (`app/{entities}/[id]/page.tsx`) :
```tsx
import { use{Entity} } from '@/hooks/use-{entity}';

export default function {Entity}DetailPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = use{Entity}(Number(params.id));
  ...
}
```

### 5. Générer Providers (`lib/providers.tsx`)

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 6. Générer page d'accueil (`app/page.tsx`)

Dashboard ou redirect vers la page principale.

## Output

- `{frontend_path}/src/app/layout.tsx`
- `{frontend_path}/src/app/page.tsx`
- `{frontend_path}/src/app/{entities}/page.tsx` (par entité)
- `{frontend_path}/src/app/{entities}/[id]/page.tsx` (si page détail)
- `{frontend_path}/src/components/layout/sidebar.tsx`
- `{frontend_path}/src/components/layout/header.tsx`
- `{frontend_path}/src/lib/providers.tsx`

### 7. Générer Middleware (`middleware.ts`)

Créer `{frontend_path}/src/middleware.ts` pour protéger les routes authentifiées :

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|login|register|verify-email|forgot-password|reset-password).*)'],
};
```

**Règle critique** : Le matcher DOIT exclure `api` pour ne pas intercepter les appels au backend proxy.

## Règles strictes

- NE PAS modifier les fichiers services/hooks/composants des entités (déjà générés)
- NE PAS modifier les composants `ui/*.tsx`
- Importer les composants et hooks existants, ne pas les recréer
- Utiliser `'use client'` uniquement quand nécessaire (hooks, state, events)
- Server Components par défaut (Next.js App Router)
- **Suspense boundary** : Tout composant utilisant `useSearchParams()` DOIT être wrappé dans `<Suspense>` (exigence Next.js App Router). Créer un inner component client si nécessaire.
- **Middleware** : Toujours générer `middleware.ts` avec exclusion de `/api`, `/login`, `/register` et des routes publiques.
