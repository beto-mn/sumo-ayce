# Data Model — Menu Database Schema

**Feature**: 016 — Menu Database Schema & Migration  
**Date**: 2026-06-20

---

## Estado ANTES (migraciones 0000–0007)

```mermaid
erDiagram
    branches {
        uuid id PK
        varchar name
        text address
        decimal lat
        decimal lng
        varchar whatsapp_reservaciones
        varchar manager_phone
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    customers {
        uuid id PK
        varchar name
        varchar phone "UNIQUE"
        boolean whatsapp_opt_in
        integer points_balance
        timestamp deleted_at
    }

    rewards {
        uuid id PK
        varchar name
        text description
        integer points_cost
        boolean is_active
    }

    reservations {
        uuid id PK
        uuid branch_id FK
        varchar contact_name
        varchar contact_phone
        integer party_size
        date reservation_date
        time reservation_time
        reservation_status status
        varchar folio "UNIQUE"
        timestamp deleted_at
    }

    loyalty_transactions {
        uuid id PK
        uuid customer_id FK
        uuid branch_id FK
        integer points_delta
        loyalty_transaction_type transaction_type
        varchar ticket_id
        uuid created_by FK
        uuid voided_by FK
        timestamp deleted_at
    }

    staff_users {
        uuid id PK
        varchar name
        varchar email "UNIQUE"
        staff_role role
        uuid branch_id FK
        varchar password_hash
        boolean is_active
    }

    redemptions {
        uuid id PK
        uuid customer_id FK
        uuid reward_id FK
        uuid branch_id FK
        varchar ticket_id "UNIQUE"
        uuid created_by FK
        uuid used_by FK
        redemption_status status
    }

    staff_sessions {
        uuid id PK
        uuid staff_user_id FK
        varchar token "UNIQUE"
        timestamp expires_at
        text ip_address
    }

    branches ||--o{ reservations : "tiene"
    branches ||--o{ loyalty_transactions : "registra"
    branches ||--o{ staff_users : "pertenece"
    branches ||--o{ redemptions : "sucede en"

    customers ||--o{ loyalty_transactions : "acumula"
    customers ||--o{ redemptions : "canjea"

    rewards ||--o{ redemptions : "es canjeado como"

    staff_users ||--o{ loyalty_transactions : "crea_por"
    staff_users ||--o{ loyalty_transactions : "void_por"
    staff_users ||--o{ redemptions : "created_by"
    staff_users ||--o{ redemptions : "used_by"
    staff_users ||--o{ staff_sessions : "tiene"
```

---

## Estado DESPUÉS (migración 0008 — feature 016)

> Las tablas nuevas están marcadas con `[NEW]` en el comentario.

```mermaid
erDiagram
    branches {
        uuid id PK
        varchar name
        text address
        decimal lat
        decimal lng
        varchar whatsapp_reservaciones
        varchar manager_phone
        boolean is_active
    }

    customers {
        uuid id PK
        varchar name
        varchar phone "UNIQUE"
        boolean whatsapp_opt_in
        integer points_balance
        timestamp deleted_at
    }

    rewards {
        uuid id PK
        varchar name
        integer points_cost
        boolean is_active
    }

    reservations {
        uuid id PK
        uuid branch_id FK
        varchar contact_name
        integer party_size
        date reservation_date
        time reservation_time
        reservation_status status
        varchar folio "UNIQUE"
    }

    loyalty_transactions {
        uuid id PK
        uuid customer_id FK
        uuid branch_id FK
        integer points_delta
        loyalty_transaction_type transaction_type
        uuid created_by FK
    }

    staff_users {
        uuid id PK
        varchar email "UNIQUE"
        staff_role role
        uuid branch_id FK
        boolean is_active
    }

    redemptions {
        uuid id PK
        uuid customer_id FK
        uuid reward_id FK
        uuid branch_id FK
        uuid created_by FK
        redemption_status status
    }

    staff_sessions {
        uuid id PK
        uuid staff_user_id FK
        varchar token "UNIQUE"
        timestamp expires_at
    }

    menu_categories {
        uuid id PK "NEW"
        menu_category_key key "UNIQUE NEW"
        varchar name_es "NEW"
        varchar name_en "NEW"
        integer display_order "NEW"
        boolean is_active "NEW"
        text file_name "NULL NEW"
    }

    menu_items {
        uuid id PK "NEW"
        uuid category_id FK "NEW"
        varchar name_es "NEW"
        varchar name_en "NEW"
        menu_location_type location_type "NEW"
        decimal price "NULL NEW"
        boolean included_in_ayce "NEW"
        text image_url "NULL NEW"
        text file_name "NULL NEW"
        varchar badge "NULL NEW"
        boolean featured "NEW"
        drink_group drink_group "NULL NEW"
        boolean requires_sauce "NEW"
        boolean is_active "NEW"
        integer display_order "NEW"
    }

    sauces {
        uuid id PK "NEW"
        varchar name_es "NEW"
        varchar name_en "NEW"
        boolean is_active "NEW"
        integer display_order "NEW"
    }

    branches ||--o{ reservations : "tiene"
    branches ||--o{ loyalty_transactions : "registra"
    branches ||--o{ staff_users : "pertenece"
    branches ||--o{ redemptions : "sucede en"

    customers ||--o{ loyalty_transactions : "acumula"
    customers ||--o{ redemptions : "canjea"

    rewards ||--o{ redemptions : "es canjeado como"

    staff_users ||--o{ loyalty_transactions : "created_by"
    staff_users ||--o{ redemptions : "created_by"
    staff_users ||--o{ staff_sessions : "tiene"

    menu_categories ||--o{ menu_items : "agrupa"
```

---

## Enums

### Antes (0000–0007)

| Enum | Valores |
|------|---------|
| `reservation_status` | pending, confirmed, rejected, cancelled, escalated, cancelled_auto |
| `loyalty_transaction_type` | earn, redeem |
| `redemption_status` | pending, used, expired |
| `staff_role` | staff, admin, owner |

### Agregados por feature 016 (0008)

| Enum | Valores |
|------|---------|
| `menu_location_type` | ayce, express, both |
| `menu_category_key` | entradas, burgers, sandwich, burritos, hotdogs, frio, caliente, dulce, postres, alitas, salsas, extras, bebidas |
| `drink_group` | jumbo_cocktails, cantaritos_sumo_cups, non_alcoholic, sodas, coffee_digestifs, beers_spirits |

---

## Migración 0008 — Resumen de cambios

| Objeto | Tipo | Acción |
|--------|------|--------|
| `menu_location_type` | ENUM | CREATE |
| `menu_category_key` | ENUM | CREATE |
| `drink_group` | ENUM | CREATE |
| `menu_categories` | TABLE | CREATE |
| `menu_items` | TABLE | CREATE |
| `sauces` | TABLE | CREATE |
| `menu_categories_key_idx` | UNIQUE INDEX | CREATE |
| `menu_categories_order_idx` | INDEX | CREATE |
| `menu_items_featured_active_idx` | INDEX (partial) | CREATE |
| `menu_items_category_order_idx` | INDEX | CREATE |
| `menu_items_location_type_idx` | INDEX | CREATE |
| `sauces_order_idx` | INDEX | CREATE |
