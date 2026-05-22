<div align="center">

# ✂️ BarberOS

**Plataforma open source para gestión de barberías**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Demo](#) · [Documentación](#documentación) · [Reportar un bug](https://github.com/marcovsolis/barber-os/issues) · [Solicitar función](https://github.com/marcovsolis/barber-os/issues)

</div>

---

## ¿Qué es BarberOS?

BarberOS es una plataforma SaaS **gratuita y de código abierto** para gestionar barberías pequeñas y medianas. Permite agendar citas, llevar el control de pagos e inventario, y comunicarse con clientes directamente por WhatsApp, todo desde un panel amigable y accesible desde cualquier dispositivo.

### ✨ Funcionalidades principales

- **📅 Agenda de citas** — Calendario visual, reservas online, recordatorios automáticos
- **💰 Control de pagos** — Registro de cobros, caja del día, comisiones por barbero
- **💬 Integración WhatsApp** — Bot para agendar, confirmaciones y recordatorios automáticos
- **📦 Inventario y gastos** — Control de stock, alertas de mínimos, reporte de rentabilidad

---

## 🚀 Inicio rápido

### Requisitos previos

- [Node.js](https://nodejs.org) 18 o superior
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Cuenta en [Supabase](https://supabase.com) (tier gratuito es suficiente para empezar)
- *(Opcional)* Cuenta en [360dialog](https://www.360dialog.com) para WhatsApp

### Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/marcovsolis/barber-os.git
cd barber-os

# 2. Instala las dependencias
npm install

# 3. Configura las variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase

# 4. Aplica las migraciones de la base de datos
supabase db push

# 5. Inicia el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📁 Estructura del proyecto

```
barber-os/
├── src/
│   ├── app/                    # Rutas de Next.js (App Router)
│   │   ├── (auth)/             # Páginas de login y registro
│   │   ├── (dashboard)/        # Panel de administración
│   │   └── book/[shopSlug]/    # Página pública de reserva del cliente
│   ├── components/
│   │   ├── ui/                 # Componentes base (Button, Card, Badge…)
│   │   ├── appointments/       # Componentes de citas
│   │   ├── payments/           # Componentes de pagos
│   │   ├── inventory/          # Componentes de inventario
│   │   └── layout/             # Sidebar, Header, navegación
│   ├── hooks/                  # React hooks personalizados
│   ├── lib/
│   │   ├── supabase/           # Clientes de Supabase (client/server)
│   │   └── whatsapp.ts         # Integración con WhatsApp API
│   └── types/                  # Tipos TypeScript globales
├── supabase/
│   └── migrations/             # Esquema de la base de datos
└── docs/                       # Documentación adicional
```

---

## 🗄️ Base de datos

El esquema incluye las siguientes tablas principales:

| Tabla | Descripción |
|---|---|
| `shops` | Barberías registradas en la plataforma |
| `barbers` | Barberos con sus horarios y configuraciones |
| `clients` | Clientes con historial y notas |
| `services` | Catálogo de servicios y precios |
| `appointments` | Citas con estado, barbero y servicio |
| `payments` | Registro de pagos por cita |
| `inventory_items` | Productos del inventario |
| `expenses` | Gastos operativos del negocio |

Consulta [`supabase/migrations/`](supabase/migrations/) para ver el esquema completo.

---

## 🔧 Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | [Next.js 15](https://nextjs.org) + [Tailwind CSS](https://tailwindcss.com) |
| Backend / BaaS | [Supabase](https://supabase.com) (PostgreSQL + Auth + Storage + Realtime) |
| Estado global | [Zustand](https://zustand-demo.pmnd.rs) |
| Formularios | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Fetching | [TanStack Query](https://tanstack.com/query) |
| WhatsApp | [360dialog API](https://www.360dialog.com) / [Twilio](https://twilio.com) |
| Iconos | [Lucide React](https://lucide.dev) |
| Lenguaje | TypeScript estricto |

---

## 🌍 Hoja de ruta

- [x] Scaffold inicial del proyecto
- [ ] **Fase 1 — MVP**
  - [ ] Módulo de citas y calendario
  - [ ] Módulo de pagos y caja
  - [ ] Integración WhatsApp (confirmaciones y recordatorios)
  - [ ] Inventario básico
- [ ] **Fase 2 — Consolidación**
  - [ ] CRM básico de clientes
  - [ ] Reportes y analítica
  - [ ] Bot de WhatsApp para agendar
  - [ ] Comisiones por barbero
- [ ] **Fase 3 — Crecimiento**
  - [ ] Sistema de fidelización
  - [ ] Campañas de marketing
  - [ ] Página pública con SEO
- [ ] **Fase 4 — Escalabilidad**
  - [ ] Multi-sucursal
  - [ ] API pública
  - [ ] App móvil (React Native)

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Lee la [guía de contribución](CONTRIBUTING.md) para saber cómo empezar.

En resumen:
1. Haz un fork del proyecto
2. Crea tu rama: `git checkout -b feature/nueva-funcionalidad`
3. Haz commit: `git commit -m 'feat: agrega nueva funcionalidad'`
4. Haz push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## 📚 Documentación

- [Configuración de WhatsApp](docs/whatsapp-setup.md)
- [Arquitectura del sistema](docs/architecture.md)
- [Plan completo del producto](Plan_BarberOS.md)

---

## 📄 Licencia

Distribuido bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más información.

---

<div align="center">

Hecho con ❤️ para la comunidad de barberías hispanohablantes

</div>
