# TaskFlow — Bloc de Notas y Tareas

Aplicación web para gestionar tareas y notas personales, con autenticación de usuarios y datos aislados por cuenta en la nube.

🔗 **Demo en producción:** https://proyecto-m4-andy-ochoa.vercel.app/
📄 **Documentación de uso de IA:** https://drive.google.com/file/d/1Kcvpkw-m6sOTqTCQKpw05FYJxI7Z0oCo/view?usp=sharing

---

## Índice

- [Descripción de la app](#descripción-de-la-app)
- [Cómo funciona (arquitectura)](#cómo-funciona-arquitectura)
- [Tecnologías usadas](#tecnologías-usadas)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación y ejecución local](#instalación-y-ejecución-local)
- [Scripts disponibles](#scripts-disponibles)
- [Cómo ejecutar y entender los tests](#cómo-ejecutar-y-entender-los-tests)
- [Por qué AWS SES no está desplegado en producción](#por-qué-aws-ses-no-está-desplegado-en-la-app-en-producción)
- [Estado del proyecto](#estado-del-proyecto)

---

## Descripción de la app

TaskFlow es una aplicación de productividad tipo mobile-first que combina dos módulos:

- **Tareas**: creación, edición y eliminación de tareas con prioridad, categoría, fecha de vencimiento y subtareas. Incluye filtros por estado, prioridad y categoría, además de una vista de estadísticas con métricas de productividad.
- **Notas**: bloc de notas con colores, etiquetas y opción de fijar notas importantes.

Cada usuario tiene su propia cuenta y solo puede ver y modificar su propia información — no hay datos compartidos entre cuentas.

### Funcionalidades principales

- Registro e inicio de sesión con correo/contraseña, con verificación de correo obligatoria antes de poder usar la app.
- Inicio de sesión con Google.
- CRUD completo de tareas y notas, sincronizado contra la base de datos en la nube.
- Exportar/importar un respaldo de los datos en formato JSON.
- Restablecer los datos a un set de demostración.
- Enviar un resumen del estado de las tareas por correo (vía Gmail).
- Modo claro/oscuro.
- Cierre de sesión.

---

## Cómo funciona (arquitectura)

- **Autenticación:** Firebase Authentication gestiona el registro, login, verificación de correo y login con Google. El hook `useAuth` escucha los cambios de sesión con `onAuthStateChanged`, y `App.tsx` decide qué pantalla mostrar (login, verificación pendiente, o la app) según ese estado.
- **Base de datos:** Cloud Firestore almacena las tareas y notas en dos colecciones (`tasks` y `notes`). Cada documento incluye un campo `userId`, y todas las consultas usan `where('userId', '==', uid)` para traer únicamente los datos del usuario logueado. Las reglas de seguridad de Firestore refuerzan esto también del lado del servidor, así que aunque el frontend fuera manipulado, nadie puede leer o escribir datos de otro usuario.
- **Estado de la app:** los hooks `useTasks` y `useNotes` gestionan el estado local, cargan los datos del usuario al iniciar sesión, y sincronizan cada acción (crear, editar, eliminar) directamente contra Firestore mediante operaciones CRUD por documento (`upsertTask`, `patchTask`, `removeTask` y sus equivalentes para notas).
- **Envío de correo:**
  - La verificación de cuenta usa `sendEmailVerification` de Firebase Auth.
  - El resumen de tareas se envía abriendo el compositor web de Gmail con el asunto y cuerpo ya redactados.
  - El correo de confirmación vía AWS SES está implementado como una Cloud Function independiente (ver la sección correspondiente más abajo).
- **Pruebas:** el proyecto usa Vitest y React Testing Library, con mocks de los servicios externos (Firestore y AWS SES) para que las pruebas no dependan de red real.

---

## Tecnologías usadas

### Frontend

| Tecnología | Uso en el proyecto |
|---|---|
| **React 18 + TypeScript** | Librería de UI y tipado estático en todo el código |
| **Vite** | Bundler, servidor de desarrollo y build de producción |
| **react-router-dom** | Enrutamiento de las pantallas de login/registro |
| **CSS puro (por módulo)** | Estilos organizados por carpeta (`pages.css`, `tasks.css`, `auth.css`, `routes.css`, etc.), sin framework de CSS |

### Backend / servicios en la nube

| Tecnología | Uso en el proyecto |
|---|---|
| **Firebase Authentication** | Registro, login, verificación de correo, login con Google |
| **Cloud Firestore** | Base de datos NoSQL en la nube; colecciones `tasks` y `notes` filtradas por `userId` |
| **Firebase Cloud Functions** | Backend serverless que resguarda las credenciales de AWS y llama a SES de forma segura |
| **Google Secret Manager** | Almacenamiento cifrado de las credenciales de AWS usadas por la Cloud Function |
| **AWS SES (Simple Email Service)** | Envío del correo de confirmación de registro |
| **AWS IAM** | Usuario con permisos limitados (solo SES) usado por la Cloud Function |

### Testing

| Tecnología | Uso en el proyecto |
|---|---|
| **Vitest** | Ejecutor de pruebas, integrado nativamente con Vite |
| **React Testing Library** | Renderizado y pruebas de componentes/hooks simulando interacción real del usuario |
| **@testing-library/user-event** | Simulación de clics y escritura como lo haría una persona |
| **@testing-library/jest-dom** | Matchers adicionales (`toBeInTheDocument`, `toBeDisabled`, etc.) |

### Infraestructura y despliegue

| Tecnología | Uso en el proyecto |
|---|---|
| **Vercel** | Hosting y despliegue continuo del frontend, conectado al repositorio de GitHub |
| **GitHub** | Control de versiones y disparador de los despliegues automáticos en Vercel |

---

## Estructura del proyecto

```
PIM4/
├── src/
│   ├── components/common/    # Header, BottomNav, Modal, íconos compartidos
│   ├── features/
│   │   ├── tasks/             # TaskModal, TaskItem, TaskFilterBar
│   │   └── notes/              # NoteModal y componentes de notas
│   ├── hooks/                  # useAuth, useTasks, useNotes, useTheme
│   ├── pages/                  # login, register, VerifyEmailPage, StatsPage, TasksPage, NotesPage
│   ├── routes/                 # AppRouter, PrivateRoutes
│   ├── services/                # firebase.ts, authService.ts, storageService.ts
│   ├── types/                    # Tipos compartidos (Task, Note, etc.)
│   ├── utils/                     # dateUtils.ts, helpers.ts
│   └── App.tsx
├── tests/                          # Pruebas unitarias y de componentes (Vitest)
├── functions/                       # Cloud Function para AWS SES
│   └── src/
│       ├── index.ts                 # sendConfirmationEmail
│       └── tests/                    # Pruebas con mock del SDK de AWS
├── test-ses-local.mjs                 # Script de prueba directa contra AWS SES
├── vite.config.ts
└── package.json
```

---

## Instalación y ejecución local

```bash
# 1. Clonar el repositorio
git clone https://github.com/andy202ochoa/ProyectoM4-AndyOchoa.git
cd ProyectoM4-AndyOchoa

# 2. Instalar dependencias del frontend
npm install

# 3. Configurar las variables de entorno
# Crea un archivo .env en la raíz con tus credenciales de Firebase:
#   VITE_FIREBASE_API_KEY=
#   VITE_FIREBASE_AUTH_DOMAIN=
#   VITE_FIREBASE_PROJECT_ID=
#   VITE_FIREBASE_STORAGE_BUCKET=
#   VITE_FIREBASE_MESSAGING_SENDER_ID=
#   VITE_FIREBASE_APP_ID=
#   VITE_FIREBASE_MEASUREMENT_ID=

# 4. Ejecutar en modo desarrollo
npm run dev
```

### Instalación de las Cloud Functions (opcional, requiere plan Blaze)

```bash
cd functions
npm install
npm install @aws-sdk/client-ses

# Configurar credenciales de AWS de forma segura (Secret Manager)
firebase functions:secrets:set AWS_ACCESS_KEY_ID
firebase functions:secrets:set AWS_SECRET_ACCESS_KEY

# Desplegar
firebase deploy --only functions
```

### Prueba local de AWS SES (sin necesidad de Firebase Functions)

```bash
npm install @aws-sdk/client-ses dotenv
# Crear un archivo .env.ses en la raíz con:
#   AWS_ACCESS_KEY_ID=
#   AWS_SECRET_ACCESS_KEY=
#   SES_VERIFIED_EMAIL=

node test-ses-local.mjs destinatario@ejemplo.com
```

---

## Scripts disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta el servidor de desarrollo de Vite |
| `npm run build` | Genera el build de producción en `dist/` |
| `npm run test` | Corre las pruebas en modo watch (se re-ejecutan al guardar cambios) |
| `npm run test:run` | Corre todas las pruebas una sola vez y termina |
| `node test-ses-local.mjs <correo>` | Envía un correo de prueba real vía AWS SES, sin pasar por Firebase |

---

## Cómo ejecutar y entender los tests

El proyecto usa **Vitest**, que funciona igual que Jest pero corre de forma nativa sobre Vite (sin configuración adicional de transpilado). Todas las pruebas viven en la carpeta `tests/` en la raíz, y comparten la configuración de `src/tests/setup.ts` (definida en `vite.config.ts`).

```bash
npm run test        # modo watch: ideal mientras se está desarrollando
npm run test:run    # una sola pasada: ideal para verificar antes de un commit
```

### Qué cubre cada archivo

| Archivo | Qué prueba |
|---|---|
| `tests/dateUtils.test.ts` | Las funciones puras de manejo de fechas (`isOverdue`, `formatDueDate`, `formatRelativeTime`, etc.), fijando la fecha del sistema con `vi.setSystemTime` para que los resultados sean siempre deterministas. |
| `tests/helpers.test.ts` | `generateId` (unicidad de los ids generados) y la integridad de los objetos de configuración (`PRIORITY_CONFIG`, `CATEGORY_CONFIG`, etc.). |
| `tests/usetask.test.ts` | El hook `useTasks`: carga inicial, `addTask`, `deleteTask`, `toggleTaskStatus` y el cálculo de conteos. **Simula (`vi.mock`) `StorageService`** para no hacer llamadas reales a Firestore. |
| `tests/TaskModal.test.tsx` | El componente `TaskModal`: renderizado condicional, validación del formulario, envío de datos, edición de una tarea existente, y manejo de subtareas — todo simulando clics y escritura reales con `@testing-library/user-event`. |
| `functions/src/tests/sendConfirmationEmail.test.ts` | La lógica de la Cloud Function de AWS SES, **simulando el SDK `@aws-sdk/client-ses`**, para verificar que el comando se arma correctamente y que los errores se propagan bien, sin depender de una llamada de red real. |

### Cómo funcionan los mocks (para extender las pruebas)

Cuando una función depende de un servicio externo (Firestore, AWS SES), la prueba reemplaza ese servicio con `vi.mock(...)` antes de importar el código que se va a probar:

```typescript
vi.mock('../src/services', () => ({
  StorageService: {
    getTasks: vi.fn(() => Promise.resolve([])),
    upsertTask: vi.fn(() => Promise.resolve()),
    // ...
  },
}));
```

Así, cuando el hook o la función real llaman a `StorageService.getTasks(...)`, en realidad están llamando a esta versión simulada — la prueba controla exactamente qué devuelve, y puede verificar con qué argumentos fue invocada (`expect(StorageService.upsertTask).toHaveBeenCalledWith(...)`), sin tocar la base de datos real ni gastar cuota de ningún servicio.

---

## Por qué AWS SES no está desplegado en la app en producción

El requisito de enviar un correo de confirmación mediante AWS SES **está implementado a nivel de código**, pero no se encuentra activo en la versión desplegada en Vercel. La razón es la siguiente:

Por seguridad, las credenciales de AWS (Access Key / Secret Key) **no pueden colocarse en el código del frontend**, ya que cualquier persona podría extraerlas desde las herramientas de desarrollador del navegador y usarlas de forma indebida. La arquitectura correcta requiere un backend intermedio que las resguarde: en este proyecto, ese backend es una **Cloud Function de Firebase** (`functions/src/index.ts`), que recibe la petición del frontend, y es la única que llama a la API de AWS SES usando las credenciales, las cuales se almacenan cifradas mediante **Google Secret Manager**.

El problema es que **desplegar Cloud Functions con acceso a Secret Manager y llamadas de red hacia servicios externos exige que el proyecto de Firebase esté en el plan Blaze (pago por uso)**. Al intentar activar dicho plan se presentó un error recurrente de Google Cloud Billing (código `OR_BACR2_59`) al configurar la cuenta de facturación, que impidió completar la actualización del plan pese a varios intentos con distintos navegadores y verificaciones. Este es un error documentado y reportado por otros usuarios en distintos países, relacionado con la verificación del método de pago del lado de Google, y no con un error de configuración del proyecto.

**Evidencia de que la integración funciona correctamente**, a pesar de no estar desplegada:

- `functions/src/index.ts` — código completo de la Cloud Function que conecta con AWS SES.
- `functions/src/tests/sendConfirmationEmail.test.ts` — pruebas unitarias que simulan (mock) el SDK de AWS SES y verifican que la lógica de armado y envío del correo es correcta.
- `test-ses-local.mjs` — script independiente que **sí envía un correo real** a través de AWS SES usando las mismas credenciales de IAM, ejecutado directamente desde Node.js sin pasar por Firebase Functions. Esto demuestra que la cuenta de AWS, las credenciales y la lógica de envío funcionan de extremo a extremo; lo único pendiente es la activación de la facturación de Firebase para conectar ese envío directamente con el flujo de registro de la app en producción.

---

## Estado del proyecto

**Completado:**
- Autenticación completa (registro, login, Google, verificación de correo).
- CRUD de tareas y notas con aislamiento por usuario en Firestore.
- Exportar/importar/restablecer datos.
- Envío de resumen de tareas por correo (Gmail).
- Suite de pruebas unitarias y de componentes con mocks.

**Pendiente / conocido:**
- Despliegue de la Cloud Function de AWS SES en producción (bloqueado por el error de facturación de Google descrito arriba).
- El tema visual se guarda por dispositivo, no viaja entre distintos navegadores del mismo usuario.

---

## Documentación adicional

- Documentación del uso de IA en el desarrollo de este proyecto: https://drive.google.com/file/d/1Kcvpkw-m6sOTqTCQKpw05FYJxI7Z0oCo/view?usp=sharing