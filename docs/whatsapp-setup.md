# Configuración de WhatsApp Business API

BarberOS usa la API oficial de WhatsApp Business a través de **360dialog** (recomendado) o **Twilio**.

---

## Opción A: 360dialog (Recomendada para PYMEs)

### Por qué 360dialog

- Precio más accesible: desde ~$5 USD/mes por número
- Aprobación rápida (24–48 horas)
- Soporte en español disponible

### Pasos

1. Crea una cuenta en [app.360dialog.com](https://app.360dialog.com)
2. Registra tu número de WhatsApp Business
3. Espera aprobación de Meta (24–48h)
4. Obtén tu `API Key` y `Phone Number ID` desde el dashboard
5. Configura el webhook apuntando a tu app:
   ```
   https://tu-dominio.com/api/whatsapp/webhook
   ```
6. Agrega las variables a tu `.env.local`:
   ```env
   WHATSAPP_API_KEY=tu-api-key
   WHATSAPP_PHONE_NUMBER_ID=tu-phone-id
   WHATSAPP_WEBHOOK_SECRET=un-secreto-aleatorio
   ```

---

## Opción B: Twilio

1. Crea una cuenta en [twilio.com](https://twilio.com)
2. Activa WhatsApp Business en tu cuenta
3. Obtén `Account SID`, `Auth Token` y el número de WhatsApp
4. Configura el webhook en Twilio apuntando a `/api/whatsapp/webhook`

---

## Mensajes que envía BarberOS

| Evento | Mensaje |
|---|---|
| Cita creada | "✅ Tu cita en *{barbería}* fue confirmada para el {fecha} a las {hora} con {barbero}." |
| Recordatorio 24h | "⏰ Recuerda tu cita mañana a las {hora} en *{barbería}*. ¿Necesitas cancelar? Responde CANCELAR." |
| Recordatorio 1h | "✂️ Tu cita en *{barbería}* es en 1 hora. ¡Te esperamos!" |
| Cita cancelada | "❌ Tu cita del {fecha} fue cancelada. Para reagendar escríbenos o visita: {link}" |
| Recibo | "🧾 Tu recibo de *{barbería}*: {servicios} — Total: ${monto}. ¡Gracias por tu visita!" |

---

## Modo desarrollo (sin cuenta real)

Para desarrollar localmente sin una cuenta de WhatsApp Business, puedes simular los mensajes entrantes haciendo `POST` al endpoint del webhook:

```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "5491123456789",
            "text": { "body": "Quiero agendar" },
            "type": "text"
          }]
        }
      }]
    }]
  }'
```
