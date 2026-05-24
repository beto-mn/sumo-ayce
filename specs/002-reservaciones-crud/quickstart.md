# Quickstart: Reservaciones — Backend CRUD API

**Branch**: `feat/002-reservaciones-crud`

---

## Prerequisitos

- Docker Desktop corriendo (para la DB local)
- `.env.local` con `DATABASE_URL` apuntando a la instancia local o a Neon
- Dependencias instaladas: `pnpm install`

---

## 1. Levantar la base de datos local

```bash
docker compose up -d
```

Verifica que el contenedor esté up:
```bash
docker compose ps
```

---

## 2. Aplicar las migraciones

La feature agrega `postal_code` e índices a `branches`. Antes de desarrollar, corre las migraciones:

```bash
pnpm db:migrate
```

Verifica que la columna e índices existen:
```bash
pnpm db:studio   # Drizzle Studio en http://localhost:4983
```

En Drizzle Studio, busca la tabla `branches` y confirma que aparece `postal_code`.

---

## 3. Generar una nueva migración (si cambias el schema)

Si modificas `server/db/schema.ts`:

```bash
pnpm db:generate   # genera el archivo SQL en server/db/migrations/
pnpm db:migrate    # aplica la migración a la DB local
```

---

## 4. Correr el servidor de desarrollo

```bash
pnpm dev
```

El servidor queda en `http://localhost:3000`.

---

## 5. Probar los endpoints manualmente

```bash
# Listar sucursales activas
curl http://localhost:3000/api/branches

# Crear una reservación
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "branchId": "<uuid-de-sucursal>",
    "contactName": "Juan Pérez",
    "contactPhone": "8112345678",
    "partySize": 4,
    "reservationDate": "2026-07-01",
    "reservationTime": "19:30"
  }'

# Listar reservaciones
curl "http://localhost:3000/api/reservations?page=1&limit=10"

# Obtener por ID
curl http://localhost:3000/api/reservations/<uuid>

# Confirmar una reservación
curl -X PATCH http://localhost:3000/api/reservations/<uuid> \
  -H "Content-Type: application/json" \
  -d '{ "status": "confirmed" }'

# Cancelar una reservación
curl -X DELETE http://localhost:3000/api/reservations/<uuid>
```

---

## 6. Correr los tests

```bash
pnpm test                          # todos los tests
pnpm test tests/server/api/        # solo tests de la API
pnpm test --coverage               # con reporte de cobertura
```

Verifica que la cobertura de server routes sea ≥ 80% (requerimiento de constitution III).

---

## Estructura de archivos relevantes

```
server/
├── api/branches/index.get.ts
├── api/reservations/
│   ├── index.get.ts
│   ├── index.post.ts
│   ├── [id].get.ts
│   ├── [id].patch.ts
│   └── [id].delete.ts
├── db/schema.ts
├── db/migrations/0002_branches_postal_code_indexes.sql
└── utils/
    ├── error-handler.ts
    ├── response.ts          ← nuevo
    └── db.ts

types/
└── reservaciones.ts         ← nuevo

tests/server/api/
├── sucursales/index.get.test.ts
└── reservaciones/*.test.ts
```

---

## Notas importantes

- **Sin auth por ahora**: Todos los endpoints son públicos. El sistema de autenticación se implementará en un feature posterior.
- **Soft-delete**: `DELETE` no borra el registro — lo marca como `cancelled` con `deleted_at`. Para auditoría, los registros permanecen en la DB.
- **Errores de validación**: La respuesta siempre incluye `issues` con el detalle de Zod para facilitar debugging en el cliente.
