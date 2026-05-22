# Guía de Contribución — BarberOS

¡Gracias por tu interés en contribuir a BarberOS! Este documento explica cómo participar en el proyecto.

---

## Código de conducta

Este proyecto adopta un ambiente de respeto y colaboración. Sé amable, constructivo y paciente con todos los colaboradores, sin importar su nivel de experiencia.

---

## ¿Cómo puedo contribuir?

### Reportar bugs

1. Revisa que el bug no haya sido reportado ya en [Issues](https://github.com/marcovsolis/barber-os/issues)
2. Abre un nuevo Issue con la etiqueta `bug`
3. Incluye: descripción clara, pasos para reproducirlo, comportamiento esperado vs. real, capturas de pantalla si aplica

### Solicitar nuevas funcionalidades

1. Abre un Issue con la etiqueta `enhancement`
2. Describe el caso de uso: ¿qué problema resuelve? ¿a quién beneficia?
3. Si tienes una propuesta de implementación, inclúyela

### Contribuir código

1. **Fork** el repositorio y clónalo localmente
2. Crea una nueva rama desde `main`:
   ```bash
   git checkout -b feature/nombre-de-la-funcionalidad
   # o para bugs:
   git checkout -b fix/descripcion-del-bug
   ```
3. Desarrolla tu cambio siguiendo las convenciones del proyecto
4. Haz commits con mensajes claros (seguimos [Conventional Commits](https://www.conventionalcommits.org)):
   ```
   feat: agrega módulo de fidelización por puntos
   fix: corrige error al cancelar cita con recordatorio activo
   docs: actualiza guía de configuración de WhatsApp
   refactor: extrae lógica de pago a hook usePayments
   ```
5. Asegúrate de que el proyecto compila sin errores: `npm run type-check`
6. Abre un **Pull Request** hacia `main` describiendo los cambios

---

## Convenciones de código

### TypeScript

- Usa TypeScript estricto (`strict: true` en tsconfig)
- Define tipos explícitos para props de componentes y retornos de funciones
- Evita `any` — usa `unknown` si el tipo es realmente desconocido

### Nomenclatura

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes React | PascalCase | `AppointmentCard.tsx` |
| Hooks | camelCase con prefijo `use` | `useAppointments.ts` |
| Utilidades | camelCase | `formatCurrency.ts` |
| Variables y funciones | camelCase | `getAppointmentsByBarber` |
| Constantes globales | UPPER_SNAKE_CASE | `MAX_APPOINTMENTS_PER_DAY` |
| Tipos e interfaces | PascalCase | `AppointmentStatus` |

### Estructura de carpetas

- Un componente por archivo
- Agrupa por dominio (appointments, payments, inventory) no por tipo
- Los archivos de página van en `src/app/`, los componentes reutilizables en `src/components/`

### Idioma del código

- Código, comentarios y nombres de variables/funciones: **inglés**
- Mensajes visibles al usuario (UI): **español** (con soporte i18n planeado)
- Documentación (README, CONTRIBUTING, docs/): **español**

---

## Configuración del entorno de desarrollo

```bash
# Instala dependencias
npm install

# Copia variables de entorno
cp .env.example .env.local

# Inicia Supabase local (requiere Docker)
supabase start

# Aplica migraciones
supabase db push

# Inicia el servidor
npm run dev
```

---

## ¿Tienes dudas?

Abre un [Discussion](https://github.com/marcovsolis/barber-os/discussions) en GitHub o contacta al equipo principal a través de los Issues.

¡Gracias por hacer BarberOS mejor para todos! ✂️
