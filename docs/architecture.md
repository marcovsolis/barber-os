# Arquitectura del Sistema — BarberOS

## Visión general

BarberOS sigue una arquitectura **multi-tenant** donde cada barbería (tenant) tiene sus propios datos aislados mediante Row Level Security (RLS) de PostgreSQL/Supabase.

```
┌─────────────────────────────────────────────────────────────┐
│                         Cliente (Browser)                    │
│           Next.js App (SSR + CSR + PWA)                     │
└───────────────────┬─────────────────────────────────────────┘
                    │ HTTPS
┌───────────────────▼─────────────────────────────────────────┐
│                    Next.js Server (Vercel)                   │
│         API Routes + Server Components + Middleware         │
└───────────┬────────────────────────┬────────────────────────┘
            │                        │
┌───────────▼──────────┐   ┌────────▼──────────────────────┐
│   Supabase           │   │   WhatsApp Business API        │
│   ─ PostgreSQL       │   │   (360dialog / Twilio)         │
│   ─ Auth             │   └───────────────────────────────┘
│   ─ Storage          │
│   ─ Realtime         │
└──────────────────────┘
```

## Modelo de datos (Multi-tenant)

Cada registro en las tablas principales tiene una columna `shop_id` que referencia a la barbería. Las políticas RLS garantizan que un usuario solo pueda ver y modificar los datos de su propia barbería.

### Diagrama de entidades

```
shops ──< barbers ──< appointments >── services
  │           │              │
  │           │         payments
  │           │
  ├──< clients >── appointments
  │
  ├──< inventory_items
  │
  └──< expenses
```

## Autenticación y roles

Usamos **Supabase Auth** con tres roles:

| Rol | Permisos |
|---|---|
| `owner` | Acceso completo a todos los datos de su barbería |
| `barber` | Solo ve sus propias citas y puede registrar pagos |
| `client` | Solo puede ver y gestionar sus propias citas (portal futuro) |

Los roles se almacenan en la tabla `profiles` y se aplican mediante RLS en cada tabla.

## Flujo de reserva por WhatsApp

```
Cliente envía mensaje
        │
        ▼
Webhook de WhatsApp (Next.js API Route)
        │
        ▼
Bot verifica intención del mensaje
        │
   ┌────┴────┐
  Agendar  Cancelar
   │          │
   ▼          ▼
Consulta    Actualiza
disponibilidad  estado cita
   │
   ▼
Crea cita en BD
   │
   ▼
Envía confirmación por WhatsApp
   │
   ▼
Programa recordatorios (24h y 1h antes)
```

## Estado global (Zustand)

Usamos Zustand para el estado del dashboard del barbero. Datos del servidor se obtienen con TanStack Query y se sincronizan con Supabase Realtime para actualizaciones en vivo.

## Variables de entorno

Consulta [`.env.example`](../.env.example) para la lista completa de variables requeridas.
