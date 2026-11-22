# TaskFlow — Gestor de Tareas y Notas

Aplicación web SPA para gestionar tareas y notas personales, con autenticación de usuarios, datos aislados por cuenta en Cloud Firestore y envío del resumen de tareas por email con **AWS SES** a través de **Vercel Functions**.

🔗 **Producción:** https://proyecto-m4-andy-ochoa.vercel.app/
📂 **Repositorio:** https://github.com/andy202ochoa/ProyectoM4-AndyOchoa
📄 **Documentación ampliada del uso de IA:** https://drive.google.com/file/d/1Kcvpkw-m6sOTqTCQKpw05FYJxI7Z0oCo/view?usp=sharing

---

## Índice

- [Descripción del proyecto](#descripción-del-proyecto)
- [Tecnologías](#tecnologías)
- [Arquitectura y decisiones](#arquitectura-y-decisiones)
- [Flujo de envío de emails (AWS SES)](#flujo-de-envío-de-emails-aws-ses)
- [Seguridad](#seguridad)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación y ejecución local](#instalación-y-ejecución-local)
- [Variables de entorno](#variables-de-entorno)
- [Deploy en Vercel](#deploy-en-vercel)
- [Testing](#testing)
- [Uso de IA en el desarrollo](#uso-de-ia-en-el-desarrollo)
- [Estado del proyecto](#estado-del-proyecto)

---

## Descripción del proyecto

TaskFlow es una aplicación de productividad **mobile-first** con dos módulos:

- **Tareas:** crear, editar, eliminar y marcar como completadas, con prioridad, categoría, fecha de vencimiento y subtareas. Incluye filtros y una vista de **estadísticas** con métricas de productividad.
- **Notas:** bloc de notas con colores, etiquetas y opción de fijar notas.

Cada usuario tiene su propia cuenta y **solo puede ver y modificar su propia información**.

### Funcionalidades

- Registro e inicio de sesión con email y contraseña, y con **Google**.
- Verificación de correo obligatoria antes de usar la app.
- Rutas privadas: sin sesión no se puede acceder a las tareas.
- Mensajes de error claros para cada caso de autenticación (credenciales incorrectas, correo ya registrado, sin conexión, etc.).
- CRUD completo de tareas y notas persistido en Cloud Firestore, filtrado por `userId`.
- **Envío por email (AWS SES) de un resumen del estado de todas las tareas** mediante un botón.
- Exportar e importar un respaldo en JSON y restablecer datos de demostración.
- Modo claro / oscuro.

---

## Tecnologías

| Área | Tecnología | Uso |
|---|---|---|
| Frontend | **React 19 + TypeScript** | UI y tipado estático |
| | **Vite** | Servidor de desarrollo y build |
| | **react-router-dom** | Navegación SPA y rutas privadas |
| | **CSS por módulo** | Estilos mobile-first con Flexbox/Grid, sin framework |
| BaaS | **Firebase Authentication** | Registro, login, Google, verificación de correo |
| | **Cloud Firestore** | Base de datos de tareas y notas por usuario |
| Serverless | **Vercel Functions** (`api/`) | Backend que guarda las credenciales de AWS y envía los emails |
| Email | **AWS SES** + **AWS IAM** | Envío del resumen de tareas, con un usuario IAM limitado a SES |
| Testing | **Vitest** + **React Testing Library** | Tests unitarios y de componentes con mocks |
| Deploy | **Vercel** + **GitHub** | Despliegue continuo en cada `git push` a `main` |

---

## Arquitectura y decisiones

El código está organizado **por capas**, cada una con una responsabilidad clara:

| Capa | Responsabilidad |
|---|---|
| `pages/` | Vistas completas (Login, Register, Tasks, Notes, Stats, VerifyEmail). Describen *qué* se muestra. |
| `components/` y `features/` | Componentes de UI reutilizables y componentes por dominio (`tasks`, `notes`). |
| `hooks/` | Estado y lógica de negocio: `useAuth`, `useTasks`, `useNotes`, `useTheme`. |
| `services/` | Integraciones externas: Firebase (`firebase.ts`, `authService.ts`, `storageService.ts`) y la llamada a la función de email (`emailService.ts`). |
| `routes/` | `AppRouter` y `PrivateRoutes` (protección de rutas). |
| `types/` | Interfaces compartidas (`Task`, `Note`, etc.). |
| `utils/` | Funciones puras: fechas, configuración, armado del resumen (`taskSummary.ts`) y mensajes de error (`authErrors.ts`). |
| `api/` | **Vercel Functions** (backend serverless). |

### Decisiones principales

1. **Sesión con el patrón Observer.** `useAuth` se suscribe a `onAuthStateChanged` y expone `user` y `loading`. Mientras `loading` es `true` se muestra "Cargando…", así se evitan redirecciones prematuras al recargar la página.
2. **Rutas protegidas.** `App.tsx` decide qué mostrar según el estado: login/registro, pantalla de verificación pendiente o la app. Cualquier URL privada sin sesión redirige a `/login`.
3. **Lógica fuera de los componentes.** El CRUD vive en `useTasks` / `useNotes` y en `StorageService`, no en los componentes. Eso hace el código más fácil de testear con mocks.
4. **Actualización inmediata de la UI.** Cada operación CRUD actualiza el estado local y se persiste en Firestore por documento (`upsertTask`, `patchTask`, `removeTask`). La interfaz cambia sin recargar y los errores se muestran al usuario.
5. **Funciones puras para la lógica testeable.** El resumen del email (`buildTaskSummary`) y la traducción de errores (`getAuthErrorMessage`, `validateAuthForm`) no dependen de React ni de servicios externos.
6. **Errores de Firebase traducidos.** Los códigos internos (`auth/invalid-credential`, `auth/email-already-in-use`…) se convierten en mensajes en español en `utils/authErrors.ts`. Firebase tiene activada la *protección contra la enumeración de correos*: un correo inexistente y una contraseña incorrecta devuelven el mismo código. Por eso ambos casos muestran "Correo o contraseña incorrectos." y nadie puede averiguar qué correos están registrados.
7. **Verificación de cuenta con Firebase, resumen con AWS SES.** La verificación usa `sendEmailVerification` de Firebase Auth: funciona para cualquier correo y no depende del modo sandbox de SES. AWS SES se usa para lo que pide la consigna: el email con el resumen de tareas.
8. **De Firebase Cloud Functions a Vercel Functions.** La primera versión del envío con SES era una Cloud Function de Firebase (carpeta `functions/`). Desplegarla exige el plan Blaze de Firebase, que no se pudo activar por un error de facturación de Google (`OR_BACR2_59`). Se migró a **Vercel Functions**, que son gratuitas en el plan Hobby y se despliegan junto con el frontend. La carpeta `functions/` se conserva como referencia histórica y **no se usa en producción**.
9. **Función serverless sin `firebase-admin`.** Al desplegar en Vercel, `firebase-admin` fallaba al cargar por una dependencia interna (`jose`) incompatible con el entorno de la función. Como la función solo necesita validar la sesión del usuario, se usa la API REST oficial de Firebase Auth (`accounts:lookup`), sin dependencias extra.

---

## Flujo de envío de emails (AWS SES)

```
[Usuario] → botón "Enviar Resumen por Correo" (StatsPage)
      │
      ▼
[Frontend] buildTaskSummary(tasks)  → arma asunto + texto con el estado de TODAS las tareas
      │      sendTaskSummaryEmail()  → POST /api/send-summary
      │                                 Authorization: Bearer <token de sesión de Firebase>
      ▼
[Vercel Function] api/send-summary.ts
      │  1. Valida método, variables de entorno y el cuerpo { subject, text }
      │  2. Valida el token con Firebase (accounts:lookup) → obtiene el correo REAL del usuario
      │  3. Exige que el correo esté verificado
      │  4. Envía el email con AWS SES (SendEmailCommand) SOLO a ese correo
      ▼
[AWS SES] → bandeja de entrada del usuario
```

**Qué incluye el resumen:** índice de productividad (% completado), tareas pendientes, en progreso, completadas y vencidas, desglose por categoría y prioridad, y la lista de tareas con su estado (máximo 50).

**Estados en la UI:** el botón muestra "Enviando…" y se desactiva mientras se envía. Al terminar aparece un mensaje de éxito ("Resumen enviado a …") o de error.

**Respuestas de la función:**

| Código | Significado |
|---|---|
| `200` | Email enviado |
| `400` | Resumen inválido (vacío o demasiado largo) |
| `401` | Falta el token o la sesión es inválida |
| `403` | El correo del usuario no está verificado |
| `405` | Método distinto de `POST` |
| `500` | Faltan variables de entorno en el servidor |
| `502` | AWS SES rechazó el envío (el motivo viene en `detail`) |

> ⚠️ **AWS SES en modo sandbox.** La cuenta de SES está en modo sandbox, así que **solo puede enviar a direcciones verificadas** en la consola de SES (sección *Identidades*). Para probar el resumen, la cuenta de TaskFlow debe usar un correo verificado en SES. Para enviar a cualquier usuario habría que solicitar el *acceso de producción* a AWS, lo que requiere un dominio propio verificado.

### Respuestas frecuentes

- **¿Por qué no se llama a AWS SES directamente desde el navegador?** Porque haría falta poner las credenciales de AWS en el código del frontend, y cualquiera podría extraerlas desde las herramientas del navegador. La función serverless es la única que las conoce.
- **¿Por qué el destinatario no lo envía el frontend?** Para que nadie pueda usar la función para mandar correos a terceros. El destinatario sale del token validado por Firebase.

---

## Seguridad

- **Credenciales fuera del código.** Firebase usa variables `VITE_*` (configuración pública del cliente). AWS usa variables **sin** `VITE_`, que solo existen en el servidor de Vercel.
- **`.env` excluido.** `.env`, `.env.local`, `.env.ses` y `.vercel` están en `.gitignore`. En el repositorio solo está `.env.example`, sin valores reales.
- **IAM con mínimo privilegio.** El usuario IAM `pim4-ses-sender` solo tiene permisos de SES.
- **Reglas de Firestore.** Cada documento guarda su `userId`. Las reglas de seguridad (configuradas en la consola de Firebase) solo permiten leer y escribir documentos cuyo `userId` coincide con el usuario autenticado:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{docId} {
      allow read, update, delete: if request.auth != null
                                  && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null
                    && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

  Se probó que un usuario no puede ver las tareas de otro: cada consulta usa `where('userId', '==', uid)` y las reglas rechazan cualquier acceso ajeno, aunque el frontend fuera manipulado.

---

## Estructura del proyecto

```
PIM4/
├── api/                         # Vercel Functions (backend serverless)
│   ├── send-summary.ts          # Envía el resumen de tareas con AWS SES
│   └── _lib/
│       └── firebaseUser.ts      # Valida el token de Firebase (el "_" evita que sea un endpoint)
├── src/
│   ├── components/common/       # Header, BottomNav, Modal, íconos compartidos
│   ├── features/
│   │   ├── tasks/               # TaskModal, TaskItem, TaskFilterBar
│   │   └── notes/               # NoteModal, NoteCard
│   ├── hooks/                   # useAuth, useTasks, useNotes, useTheme
│   ├── pages/                   # login, register, VerifyEmailPage, TasksPage, NotesPage, StatsPage
│   ├── routes/                  # AppRouter, PrivateRoutes
│   ├── services/                # firebase, authService, storageService, emailService
│   ├── types/                   # Task, Note y tipos compartidos
│   ├── utils/                   # dateUtils, helpers, taskSummary, authErrors
│   └── App.tsx
├── tests/                       # Tests unitarios y de componentes (Vitest)
├── functions/                   # (Histórico) Cloud Function de Firebase; no se usa en producción
├── test-ses-local.mjs           # Script para probar AWS SES desde la terminal
├── vercel.json                  # Reescrituras de la SPA (sin afectar /api)
├── .env.example                 # Plantilla de variables sin valores reales
└── package.json
```

---

## Instalación y ejecución local

**Requisitos:** Node.js 24, una cuenta de Firebase y (para el email) una cuenta de AWS con SES.

```bash
# 1. Clonar el repositorio
git clone https://github.com/andy202ochoa/ProyectoM4-AndyOchoa.git
cd ProyectoM4-AndyOchoa

# 2. Instalar dependencias
npm install

# 3. Crear el archivo .env a partir de la plantilla y completar los valores
cp .env.example .env

# 4a. Solo frontend (sin envío de email)
npm run dev

# 4b. Frontend + funciones de /api (para probar el email con SES)
npx vercel link            # vincular con el proyecto de Vercel
npx vercel env pull .env.local
npx vercel dev             # http://localhost:3000
```

> `npm run dev` levanta solo Vite: la ruta `/api/send-summary` no existe ahí. Para probar el envío del email en local se necesita **Vercel CLI** (`npx vercel dev`).

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite |
| `npm run build` | Build de producción en `dist/` |
| `npm run test` | Tests en modo watch |
| `npm run test:run` | Todos los tests una sola vez |
| `npx vercel dev` | Frontend + Vercel Functions en local |
| `node test-ses-local.mjs <correo>` | Envía un correo de prueba real con AWS SES (usa `.env.ses`) |

---

## Variables de entorno

| Variable | Dónde se usa | Descripción |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Frontend y `api/` | API key pública de Firebase (la función la usa para validar el token) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Frontend | Dominio de autenticación de Firebase |
| `VITE_FIREBASE_PROJECT_ID` | Frontend | ID del proyecto de Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Frontend | Bucket de Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Frontend | Sender ID de Firebase |
| `VITE_FIREBASE_APP_ID` | Frontend | App ID de Firebase |
| `VITE_FIREBASE_MEASUREMENT_ID` | Frontend | Measurement ID de Firebase |
| `SES_ACCESS_KEY_ID` | Solo `api/` | Access key del usuario IAM con permisos de SES |
| `SES_SECRET_ACCESS_KEY` | Solo `api/` | Secret key del usuario IAM |
| `SES_REGION` | Solo `api/` | Región de SES (`us-east-2`) |
| `SES_FROM_EMAIL` | Solo `api/` | Remitente verificado en SES |

**Por qué `SES_*` y no `AWS_*`:** Vercel reserva los nombres `AWS_*` para uso interno, así que las credenciales usan el prefijo `SES_`.

**Regla clave:** solo las variables con prefijo `VITE_` llegan al navegador. Las credenciales de AWS **nunca** llevan `VITE_`.

---

## Deploy en Vercel

1. Importar el repositorio de GitHub en Vercel (Framework: **Vite**).
2. En **Settings → Environment Variables**, agregar todas las variables de la tabla anterior.
3. Cada `git push` a `main` genera un deploy automático. Las funciones de `api/` se despliegan junto con el frontend.
4. `vercel.json` redirige las rutas de la SPA (`/tasks`, `/notes`, `/login`…) a la app, sin afectar `/api/*` ni los archivos estáticos.
5. `package.json` fija `"engines": { "node": "24.x" }` para usar la misma versión de Node en local y en Vercel.

**Verificación en producción:** registro → verificación de correo → login → crear, editar, completar y eliminar tareas → **Estadísticas → Enviar Resumen por Correo** → cerrar sesión.

---

## Testing

```bash
npm run test:run
```

Todos los servicios externos (Firestore, Firebase Auth, `fetch` hacia la función y el SDK de AWS) están **mockeados**: los tests no hacen llamadas reales. Cada test sigue la estructura *preparar → ejecutar → verificar*.

| Archivo | Qué prueba |
|---|---|
| `tests/TaskModal.test.tsx` | Componente `TaskModal`: renderizado, validación del formulario, creación y edición, prioridad y subtareas, simulando clics y escritura con `user-event`. |
| `tests/usetask.test.ts` | Hook `useTasks`: carga inicial, crear, eliminar, cambiar estado y conteos, con `StorageService` mockeado. |
| `tests/taskSummary.test.ts` | Armado del resumen del email: porcentajes, estados, tareas vencidas, **caso sin tareas** y límite de tareas. |
| `tests/emailService.test.ts` | Llamada a `/api/send-summary` con el token, y **manejo del error** cuando SES rechaza el envío (`fetch` mockeado). |
| `tests/authErrors.test.ts` | Traducción de errores de Firebase, validación de formularios y **casos límite** (código desconocido, error sin código). |
| `tests/dateUtils.test.ts` | Funciones de fechas, con la fecha del sistema fijada (`vi.setSystemTime`). |
| `tests/helpers.test.ts` | `generateId` y los objetos de configuración. |
| `tests/Sendconfirmationemail.test.ts` | Armado del comando de SES con el SDK `@aws-sdk/client-ses` mockeado. |

Ejemplo de mock de un servicio externo:

```typescript
vi.mock('../src/services', () => ({
  StorageService: {
    getTasks: vi.fn(() => Promise.resolve([])),
    upsertTask: vi.fn(() => Promise.resolve()),
  },
}));
```

---

## Uso de IA en el desarrollo

Usé asistentes de IA (Claude y Gemini, este último dentro del editor Antigravity) como apoyo, **revisando y entendiendo cada cambio antes de incorporarlo**. La documentación detallada de prompts está en el [documento de uso de IA](https://drive.google.com/file/d/1Kcvpkw-m6sOTqTCQKpw05FYJxI7Z0oCo/view?usp=sharing).

### Situaciones en las que más me ayudó

| Situación | Ejemplo de prompt | Cómo influyó / qué decidí |
|---|---|---|
| **Diagnóstico de deploy** | *"El deploy dice Ready pero la URL da 404, revisa mi configuración de Vercel"* | Entendí que Vercel aplica la configuración (Root/Output Directory) en cada deploy, y que `vercel.json` debía excluir `/api` y los archivos estáticos de las reescrituras de la SPA. |
| **Errores en producción** | Pegar el log de Vercel: *"ERR_REQUIRE_ESM … jose … jwks-rsa"* | Decidí quitar `firebase-admin` y validar el token con la API REST de Firebase, lo que hizo la función más liviana. |
| **Arquitectura segura del email** | *"¿Cómo envío el email con SES sin exponer las credenciales y sin pagar el plan Blaze?"* | Migré de Firebase Cloud Functions a Vercel Functions y el destinatario sale del token validado, no del cliente. |
| **Leer la consigna** | Compartir la consigna y la guía del PI | Detecté que SES era obligatorio para el **resumen de tareas** (no para la verificación), y volví a la verificación de Firebase para no bloquear a usuarios fuera del sandbox de SES. |
| **Calidad y testing** | *"Corrige los mensajes para cada tipo de error"* / pegar la salida de `vitest` | Centralicé los mensajes en `authErrors.ts`, agregué tests de casos límite y actualicé mocks incompatibles con Vitest 5. |
| **Configuración de AWS** | Capturas de la consola de AWS paso a paso | Configuré MFA en la cuenta raíz, una alerta de presupuesto en $0 y revisé el plan de precios de SES. |

### Patrones y buenas prácticas que descubrí

- **Dar contexto real:** pegar el log completo del error, la salida de la terminal o la consigna da respuestas mucho más precisas que describir el problema con palabras.
- **Verificar en vez de suponer:** probar la URL, leer los logs de Vercel y correr los tests después de cada cambio, en lugar de dar algo por funcionando.
- **Cambios pequeños y commits frecuentes:** facilitan encontrar qué cambio rompió algo.
- **La IA no reemplaza la comprensión:** varias sugerencias tuvieron que ajustarse a mi caso, por ejemplo con el sandbox de SES o las variables reservadas de Vercel. Entender el *por qué* de cada decisión fue lo que permitió corregirlas.
- **Cuidado con los secretos:** nunca compartir claves con la IA. Basta con revisar nombres de variables y formatos.

---

## Estado del proyecto

**Completado**
- Autenticación (email/contraseña y Google), verificación de correo, rutas privadas y mensajes de error claros.
- CRUD de tareas y notas en Firestore, aislado por usuario.
- Resumen de tareas por email con **AWS SES vía Vercel Functions**, en producción.
- Tests unitarios y de componentes con mocks.
- Deploy en Vercel con variables de entorno configuradas.

**Limitaciones conocidas**
- AWS SES está en **modo sandbox**: el resumen solo llega a correos verificados en SES. Para producción real haría falta un dominio propio y solicitar el acceso de producción a AWS.
- El tema claro/oscuro se guarda por dispositivo.
