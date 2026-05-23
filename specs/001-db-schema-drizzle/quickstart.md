# Quickstart: Local Database Setup

**Tiempo estimado**: ~5 minutos

---

## Prerequisitos

- Docker Desktop instalado y corriendo
- Node.js 20+ y pnpm instalados
- Archivo `.env.local` creado (ver paso 1)

---

## Paso 1 — Crear `.env.local`

```bash
cp .env.example .env.local
```

Edita `.env.local` y rellena la sección de base de datos para local:

```env
# Base de datos local (Docker Compose)
DATABASE_URL=postgresql://sumo:sumo@localhost:5432/sumo_ayce
```

> **Producción**: Sustituye este valor por la connection string de Neon al desplegar.

---

## Paso 2 — Levantar PostgreSQL local

```bash
docker compose up -d
```

Verifica que el contenedor esté corriendo:

```bash
docker compose ps
# NAME          STATUS    PORTS
# sumo-db       running   0.0.0.0:5432->5432/tcp
```

---

## Paso 3 — Generar y correr las migraciones

```bash
# Genera los archivos SQL desde el schema de Drizzle
pnpm db:generate

# Aplica las migraciones a la base de datos local
pnpm db:migrate
```

Deberías ver algo como:

```
[drizzle-kit] Running 1 migration file...
[drizzle-kit] Migration "0001_init_schema.sql" applied successfully.
```

---

## Paso 4 — Verificar (opcional)

```bash
pnpm db:studio
```

Abre Drizzle Studio en el navegador para inspeccionar tablas y datos.

---

## Flujo de iteración de schema

Cuando modifiques `server/db/schema.ts`:

```bash
pnpm db:generate   # genera nuevo archivo de migración
pnpm db:migrate    # aplica el delta
```

Las migraciones son incrementales — **nunca destruyen datos existentes** a menos que escribas una migración destructiva explícita.

---

## Alternativa sin Docker

Si no tienes Docker, puedes usar una rama gratuita de Neon:

1. Crear cuenta en [neon.tech](https://neon.tech)
2. Crear proyecto → copiar connection string
3. Pegar en `DATABASE_URL` en `.env.local`
4. Correr `pnpm db:migrate` directamente contra Neon

---

## Apagar el contenedor

```bash
docker compose down       # detiene pero conserva datos
docker compose down -v    # detiene y borra volumen (reset total)
```

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `port 5432 already in use` | Cambia el puerto en `docker-compose.yml` y en `DATABASE_URL` |
| `ECONNREFUSED` en migrate | El contenedor no terminó de iniciar — espera 5s y reintenta |
| `Missing DATABASE_URL` al arrancar el servidor | El servidor valida env al inicio (Zod) — revisa `.env.local` |
| `relation does not exist` | Corriste el servidor antes de migrar — corre `pnpm db:migrate` primero |
