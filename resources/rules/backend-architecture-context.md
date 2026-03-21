# Backend Architecture Context

**Stack** : FastAPI + PostgreSQL (asyncpg) + Pydantic 2.x

---

## Architecture en Couches (bottom-up)

```
┌─────────────────────────────────────────┐
│         COUCHE API (Endpoints)          │  ← Routes FastAPI + Pydantic models
│  - Validation inputs/outputs            │
│  - Délègue à Jobs ou fonctions pures    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         COUCHE JOBS (Business Logic)    │  ← Orchestration logique métier
│  - Workflows avec fonctions pures       │
│  - Combine CRUD + Utils + Services      │
└─────────────────────────────────────────┘
                  ↓
┌────────────────┬────────────────────────┐
│ FONCTIONS PURES                         │
├────────────────┼────────────────────────┤
│ CRUD (DB)      │ Services (Externes)    │  ← Fonctions atomiques réutilisables
│ - create_X()   │ - send_email()         │
│ - get_X()      │ - upload_photo()       │
│ - update_X()   │ - call_stripe()        │
│ - delete_X()   │                        │
├────────────────┤                        │
│ Utils (Logic)  │                        │
│ - validate_X() │                        │
│ - format_X()   │                        │
│ - hash_X()     │                        │
└────────────────┴────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         DATABASE (PostgreSQL)           │  ← Schema + Models + Relations
└─────────────────────────────────────────┘
```

---

## Définitions

### CRUD (Database Layer)
**Rôle** : Opérations atomiques sur la base de données

**Exemples** :
- `create_user_crud(email, password_hash, name)` → INSERT user
- `get_user_by_id_crud(user_id)` → SELECT user WHERE id
- `update_property_crud(property_id, **fields)` → UPDATE property
- `delete_order_crud(order_id)` → DELETE order

**Caractéristiques** :
- Une fonction = une requête SQL
- Retourne dict Python (pas de logique métier)
- Gère uniquement la persistence

---

### Services (External Layer)
**Rôle** : Interactions avec APIs tierces ou libraries externes

**Exemples** :
- `send_email_service(to, subject, body)` → Appel SMTP/SendGrid
- `upload_photo_service(file_data, bucket)` → Appel S3/Cloudinary
- `charge_payment_service(amount, card_token)` → Appel Stripe
- `geocode_address_service(address)` → Appel Google Maps API

**Caractéristiques** :
- Client/wrapper autour d'API externe
- Gère authentification/retry/erreurs externes
- Pas de logique métier (juste appel)

---

### Utils (Pure Logic)
**Rôle** : Fonctions utilitaires réutilisables (validation, transformation, calcul)

**Exemples** :
- `validate_email(email)` → Regex validation
- `hash_password(password)` → bcrypt
- `format_phone(phone)` → Normalize format
- `calculate_discount(price, percentage)` → Math

**Caractéristiques** :
- Pures (input → output, pas d'effet de bord)
- Réutilisables partout
- Pas d'accès DB ou API

---

### Jobs (Business Logic)
**Rôle** : Orchestration de fonctions pures pour créer workflows métier complets

**Exemples** :
```python
async def create_user_job(dto: UserCreateDTO) -> UserResponse:
    """
    Workflow: Créer utilisateur avec email de bienvenue

    Steps:
    1. Valider email (Utils)
    2. Hasher password (Utils)
    3. Créer en DB (CRUD)
    4. Envoyer email bienvenue (Service)
    """
    # 1. Validation
    if not validate_email(dto.email):
        raise ValueError("Email invalide")

    # 2. Hash password
    hashed = hash_password(dto.password)

    # 3. Create in DB
    user = await create_user_crud(dto.email, hashed, dto.name)

    # 4. Send welcome email
    await send_email_service(user['email'], "Welcome!", "...")

    return UserResponse(**user)
```

**Caractéristiques** :
- Combine plusieurs fonctions pures
- Contient conditions/validations métier
- Gère transactions si multi-CRUD
- Retourne DTO Pydantic

---

## Règle de Décision : Job vs CRUD vs Service

### Utiliser **Job** si :
- ✅ Logique métier complexe (validation + transformation + orchestration)
- ✅ Combine plusieurs fonctions pures (CRUD + Utils + Services)
- ✅ Workflow avec conditions/branches
- ✅ Transaction multi-étapes

**Exemples** :
- `create_order_with_payment_job` → Valider stock + créer commande + charger paiement + envoyer confirmation
- `update_property_with_notification_job` → Valider data + update DB + notifier propriétaire

---

### Utiliser **CRUD direct** si :
- ✅ Opération DB simple et atomique
- ✅ Aucune logique métier (juste lecture/écriture)
- ✅ Pas de validation complexe (Pydantic suffit)

**Exemples** :
- `GET /api/users/{id}` → `get_user_by_id_crud`
- `GET /api/properties?status=active` → `list_properties_crud`
- `DELETE /api/orders/{id}` → `delete_order_crud`

---

### Utiliser **Service direct** si :
- ✅ Appel externe simple (upload, email, SMS)
- ✅ Aucune orchestration nécessaire
- ✅ Action indépendante

**Exemples** :
- `POST /api/files/upload` → `upload_file_service`
- `POST /api/notifications/sms` → `send_sms_service`

---

## Conventions de Nommage

### Fonctions Python (snake_case)

**Jobs** : `{action}_{resource}_job`
- `create_user_job`
- `update_property_job`
- `cancel_order_job`

**CRUD** : `{action}_{resource}_crud`
- `create_user_crud`
- `get_property_by_id_crud`
- `list_orders_crud`

**Services** : `{action}_{service}`
- `send_email_service`
- `upload_photo_service`
- `charge_payment_service`

**Utils** : `{verb}_{object}`
- `validate_email`
- `hash_password`
- `format_phone`

### Schémas Pydantic (snake_case → camelCase)

**⚠️ RÈGLE CRITIQUE : Python snake_case, JSON camelCase**

**Code Python** : TOUJOURS `snake_case` (PEP-8)
```python
class UserResponse(BaseModel):
    first_name: str      # ✅ Python: snake_case
    last_name: str
    created_at: datetime
```

**JSON API** : TOUJOURS `camelCase` (convention JavaScript/TypeScript)
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

**Configuration avec Pydantic v2** :
```python
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

class BaseSchema(BaseModel):
    """Base pour tous les schémas Pydantic avec conversion camelCase"""
    model_config = ConfigDict(
        alias_generator=to_camel,        # Python → JSON conversion
        populate_by_name=True,           # Accepte snake_case ET camelCase en input
        from_attributes=True,            # Permet .model_validate(orm_obj)
    )

class UserResponse(BaseSchema):  # ✅ Hérite de BaseSchema
    first_name: str
    last_name: str
```

**IMPORTANT** :
- ✅ Code Python : `first_name` (snake_case)
- ✅ JSON Response : `firstName` (camelCase)
- ✅ Frontend TypeScript : `firstName` (camelCase natif)
- ❌ Ne JAMAIS écrire `firstName` en Python (anti-PEP-8)

**Disponible dans** : `app/api/models/common.py` → `BaseSchema`

---

## Exemples Pratiques

| Endpoint | Function | Type | Raison |
|----------|----------|------|--------|
| POST /api/users | create_user_job | Job | Validation + hash + create + email |
| GET /api/users/{id} | get_user_by_id_crud | CRUD | Simple lecture DB |
| PUT /api/users/{id} | update_user_job | Job | Validation + update + notification |
| DELETE /api/users/{id} | delete_user_crud | CRUD | Simple delete DB |
| POST /api/orders | create_order_with_payment_job | Job | Valider stock + créer + payer + notifier |
| GET /api/orders | list_orders_crud | CRUD | Simple liste avec filtres |
| POST /api/files/upload | upload_file_service | Service | Appel direct S3/Cloudinary |

---

## Points Clés

1. **Jobs = orchestration** (combine fonctions pures)
2. **CRUD = persistence** (une fonction = une requête SQL)
3. **Services = external** (APIs tierces)
4. **Utils = logic** (fonctions pures réutilisables)

5. **Endpoints API délèguent toujours** à Job OU fonction pure (jamais de logique inline)

6. **Fonctions pures sont réutilisables** entre différents Jobs
