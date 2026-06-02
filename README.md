<div align="center">

# ✂️ BarberOS

**Plataforma SaaS para gestión de barberías modernas**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Status](https://img.shields.io/badge/Status-En%20desarrollo-orange)](https://github.com/marcovsolis/barber-os)

[Demo](#) · [Reportar un bug](https://github.com/marcovsolis/barber-os/issues) · [Solicitar función](https://github.com/marcovsolis/barber-os/issues)

</div>

---

## ¿Qué es BarberOS?

BarberOS es una plataforma SaaS para gestionar barberías pequeñas y medianas. Permite agendar citas, llevar el control de pagos e inventario, y comunicarse con clientes directamente por WhatsApp, todo desde un panel moderno y accesible desde cualquier dispositivo.

> **Nota:** El código fuente está disponible para revisión en este repositorio. Todos los derechos reservados — no está permitido el uso, copia ni distribución sin autorización expresa.

### ✨ Funcionalidades principales

- **📅 Agenda de citas** — Calendario visual, reservas online y recordatorios automáticos
- **💰 Control de pagos** — Registro de cobros, comisiones por barbero y exportación a Excel
- **💬 Integración WhatsApp** — Confirmaciones automáticas y recordatorios 24h/30min antes
- **📦 Inventario** — Control de stock en tiempo real con alertas de mínimos
- **👥 CRM de clientes** — Historial de visitas, gasto total y notas privadas
- **🔧 Multi-barbero** — Horarios, colores y comisiones individuales por barbero
- **🌐 Página pública de reservas** — URL personalizada para que los clientes agenden solos

---

## 🔧 Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | [Next.js 15](https://nextjs.org) + [Tailwind CSS](https://tailwindcss.com) |
| Backend / BaaS | [Supabase](https://supabase.com) (PostgreSQL + Auth + Storage) |
| Formularios | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| WhatsApp | [360dialog API](https://www.360dialog.com) |
| Iconos | [Lucide React](https://lucide.dev) |
| Lenguaje | TypeScript estricto |

---

## 📁 Estructura del proyecto

```
barber-os/
├── src/
│   ├── app/
│   │   ├── (auth)/             # Login y registro
│   │   ├── (dashboard)/        # Panel de administración
│   │   ├── admin/              # Super admin
│   │   ├── book/[shopSlug]/    # Página pública de reservas
│   │   └── api/                # API routes (cron, export, whatsapp)
│   ├── components/
│   │   ├── ui/                 # Button, Card, Badge, Tooltip…
│   │   ├── appointments/       # Citas y calendario
│   │   ├── clients/            # Gestión de clientes
│   │   ├── payments/           # Cobros y reportes
│   │   ├── inventory/          # Control de stock
│   │   ├── settings/           # Configuración de la barbería
│   │   └── layout/             # Sidebar y navegación
│   ├── lib/
│   │   ├── supabase/           # Clientes (client/server/admin)
│   │   ├── slots.ts            # Generación de horarios disponibles
│   │   └── whatsapp.ts         # Integración WhatsApp API
│   └── types/                  # Tipos TypeScript globales
└── supabase/
    └── migrations/             # Esquema completo de la base de datos
```

---

## 🗄️ Base de datos

| Tabla | Descripción |
|---|---|
| `shops` | Barberías registradas en la plataforma |
| `profiles` | Usuarios extendidos con rol y shop asociado |
| `barbers` | Barberos con horarios y configuraciones |
| `barber_schedules` | Horarios de trabajo por día de la semana |
| `barber_blocks` | Bloqueos de horario (vacaciones, descansos) |
| `clients` | Clientes con historial y notas |
| `services` | Catálogo de servicios y precios |
| `appointments` | Citas con estado, barbero y servicio |
| `payments` | Registro de cobros por cita |
| `appointment_reminders` | Recordatorios enviados por WhatsApp |
| `inventory_items` | Productos del inventario |

---

## 🌍 Hoja de ruta

- [x] Autenticación y onboarding
- [x] Módulo de citas y calendario
- [x] Módulo de pagos y comisiones
- [x] Integración WhatsApp (confirmaciones y recordatorios)
- [x] Inventario con alertas de stock
- [x] CRM de clientes
- [x] Página pública de reservas
- [x] Panel super admin
- [x] Exportación a Excel
- [ ] Bot de WhatsApp para agendar
- [ ] Reportes avanzados y analítica
- [ ] Sistema de fidelización
- [ ] Multi-sucursal
- [ ] App móvil

---

## 📄 Licencia

Copyright © 2026 BarberOS. Todos los derechos reservados.

El código fuente está disponible para revisión en este repositorio. No está permitido el uso, copia, modificación ni distribución sin autorización expresa del autor.

---

<div align="center">

Hecho con ❤️ para barberías modernas

</div>
