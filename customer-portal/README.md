# Customer Portal (Next.js)

App separada para clientes finales del negocio (slug), independiente del panel interno.

## Incluye

- Login cliente: `/:slug/login`
- Registro cliente: `/:slug/register`
- Reserva de citas: `/:slug/book`
- Historial de citas: `/:slug/appointments`
- Navbar base para crecer en nuevos modulos

## Ejecutar

1. Copia variables:
   - `cp .env.example .env.local`
2. Configura `NEXT_PUBLIC_API_BASE_URL`
3. Instala dependencias:
   - `npm install`
4. Levanta el proyecto:
   - `npm run dev`

Puerto por defecto: `3001`
