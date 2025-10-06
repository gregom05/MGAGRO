# Backend MG AGRO - Despliegue en Vercel

## 📋 Configuración de Variables de Entorno

Antes de desplegar en Vercel, necesitas configurar estas variables de entorno en tu proyecto:

### Variables requeridas:
```
SUPABASE_URL=https://tiphhoesizdrxxfjblfr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpcGhob2VzaXpkcnh4ZmpibGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTI5NTIsImV4cCI6MjA3NTI2ODk1Mn0.jaAFNPT13RZKTlePCATz6Rpopzq3djVrsah2zC6FWgE
SUPABASE_DB_URL=postgresql://postgres:Admin2020@db.tiphhoesizdrxxfjblfr.supabase.co:5432/postgres
PORT=3000
JWT_SECRET=tu_secreto_jwt
NODE_ENV=production
```

## 🚀 Pasos para desplegar en Vercel

1. **En Vercel Dashboard:**
   - Ve a tu proyecto backend
   - Settings → Environment Variables
   - Agrega TODAS las variables de arriba

2. **Root Directory:**
   - Configura: `backend MG`

3. **Build Settings:**
   - Build Command: `npm run build`
   - Output Directory: `dist` (déjalo vacío si no funciona)

4. **Deploy:**
   - Haz push a tu repo
   - Vercel desplegará automáticamente

## 📝 Notas importantes

- El backend usa funciones serverless en Vercel
- La base de datos está en Supabase (PostgreSQL)
- El puerto se asigna automáticamente en producción
- Asegúrate de que tu frontend apunte a la URL correcta del backend

## 🔗 Endpoints

Una vez desplegado, tu API estará disponible en:
- `/` - Información de la API
- `/api/auth` - Autenticación
- `/api/empleados` - Gestión de empleados
- `/api/actividades` - Gestión de actividades
- `/api/articulos` - Gestión de artículos
- `/api/movimientos` - Gestión de movimientos
