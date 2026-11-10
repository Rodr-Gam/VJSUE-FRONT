
<p align="center">
  <img src="public/web-app-manifest-192x192.png" alt="Logo 1" width="150" />
</p>

# Agencia Sueña - Frontend

📌 Descripción

Este proyecto corresponde al frontend de la aplicación Agencia Sueña CRM, un sistema web desarrollado para la gestión de una agencia de viajes. Permite administrar paquetes turísticos, reservaciones, ciudades, vuelos y usuarios mediante una interfaz moderna construida en React.

El frontend consume una API REST desarrollada en Laravel.

## Stack tecnológico

* **Core:** React 19, TypeScript, Vite
* **Routing & HTTP:** React Router DOM, Axios
* **State Management:** Zustand
* **Styling & UI:** Tailwind CSS, Headless UI
* **Icons:** Heroicons, Lucide React

## Ejecutar localmente

Clonar el proyecto

```bash
  git clone https://github.com/MaryGomez19/agenciaSue.git
```

Ve al directorio del proyecto

```bash
  cd viajesfront
```

Instalar dependencias

```bash
  npm install
```
Ejecutar el proyecto

```bash
  npm run dev
```

## Configuración del entorno

Para que el proyecto funcione correctamente, necesitas configurar tus variables de entorno. 

### 1. Crear el archivo `.env`
En la raíz del proyecto (junto al `package.json`), crea un archivo llamado `.env` basado en el archivo de plantilla `.env.example`.

```env
# URL base de la API del Backend
VITE_API_URL=http://localhost:3000/api
```

## Estructura del proyecto

| Carpeta / Archivo | Descripción |
| :--- | :--- |
| **Raíz (`src/`)** | |
| 📄 `api.ts` | Configuración global de Axios para las peticiones HTTP. |
| 📄 `main.tsx` | Punto de entrada principal de la aplicación. |
| 📄 `App.tsx` | Componente raíz y configuración general del proyecto. |
| **Directorios Principales** | |
| 📂 `assets/` | Imágenes, fuentes y recursos estáticos del proyecto. |
| 📂 `components/` | Componentes reutilizables de la interfaz. |
| ├─ 📂 `publicas/` | Componentes para las vistas del frontend público. |
| └─ 📂 `privadas/` | Componentes exclusivos para el panel administrativo. |
| 📂 `layouts/` | Estructuras base y contenedores del panel de administración. |
| 📂 `pages/` | Vistas y pantallas principales de la aplicación. |
| ├─ 📂 `PublicPages/` | Vistas de acceso libre: Landing page, Login, Registro, etc. |
| ├─ 📂 `AdminPages/` | Vistas de administración (Tablas, Dashboards, Formularios). |
| ├─ 📂 `Reservas/` | Módulos y vistas específicos para la gestión de reservas. |
| └─ 📂 `Vuelos/` | Módulos y vistas específicos para la gestión de vuelos. |
| 📂 `routes/` | Configuración del enrutado y middlewares de protección de rutas. |
| 📂 `sections/` | Secciones modulares específicas que componen la Landing Page. |
| 📂 `styles/` | Archivos de configuración de estilos globales y CSS. |
| 📂 `data/` | Datos estáticos independientes, mocks para pruebas o configuraciones. |
| 📂 `types/` | Definiciones y tipados globales de TypeScript. |
## API Reference

#### POST item

```http
  POST /api/items
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `string` | **Obligatorio**. Variables que el validador del backend pide para crear el ítem. |

#### Get all items

```http
  GET /api/items
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `api_key` | `string` | **Obligatorio**. Su clave API |

#### Get item

```http
  GET /api/items/{id}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `integer` | **Obligatorio**. ID del artículo a obtener. |

#### PUT item

```http
  PUT /api/items/{id}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `integer` | **Obligatorio**. El ID del artículo que vas a modificar. |

#### DELETE item

```http
  DELETE /api/items/{id}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `integer` | **Obligatorio**. El ID del artículo que deseas eliminar. |

### 🌐 Manejo de Respuestas HTTP (Status Codes)

El frontend procesa las respuestas del servidor (Laravel) basándose en los siguientes códigos de estado:

| Código | Significado | Comportamiento del frontend |
| :--- | :--- | :--- |
| **200** | OK | Procesa la respuesta normalmente. |
| **201** | Created | Muestra mensaje de éxito, limpia formulario. |
| **401** | Unauthorized | Interceptor Axios: limpia token, redirige a `/login`. |
| **422** | Unprocessable Entity | Muestra `error.response.data.message` en la UI. |
| **500** | Internal Server Error | Captura `catch`: muestra mensaje genérico de error. |

## Modulos principales

### 📦 Gestión de Paquetes (CRUD Completo)
Módulo administrativo diseñado para el control total de la oferta turística.
* **Formulario Multi-step:** Proceso guiado en 4 pasos para la creación y edición de paquetes.
* **Multimedia:** Admite la carga de imágenes mediante interacción *Drag & Drop* (arrastrar y soltar) o clic tradicional.
* **Campos del formulario:** `Nombre`, `Descripción`, `Ciudad`, `Duración`, `Fecha de salida`, `Stock` y desglose de `Precios` (Adulto / Junior / Niño).
* **Comunicación:** Envía los datos estructurados como `multipart/form-data` al backend para procesar tanto los textos como los archivos binarios de las imágenes.

---

### 📋 Módulo de Reservaciones
Flujo dinámico y automatizado para la contratación de paquetes.
* **Automatización:** Al seleccionar un paquete dentro del formulario de reserva, la fecha de salida (`departure_date`) se auto-completa consumiendo directamente los datos del objeto del paquete seleccionado.
* **Panel de Control:** Tabla interactiva que incluye herramientas de filtrado por texto libre y por estado de la reserva.
* **Interfaz Limpia:** Implementación de colores semánticos (ej: verde para aprobado, amarillo para pendiente, rojo para cancelado) según el estado actual de cada reservación.

---

### 🏙️ Catálogo de Ciudades
Módulo base para la alimentación de destinos en el sistema.
* **Alta del recurso:** Registro ágil de ciudades solicitando únicamente `Nombre` y `País` (configurado por defecto como *México*).
* **Control de datos:** Listado generalizado de los destinos registrados que incluye un contador dinámico.
* **Modularidad:** La información de este catálogo alimenta automáticamente los selectores de destino dentro de los formularios de **CrearPaquete** y **EditarPaquete**.
---
### 🔐 Flujo de Autenticación

El proyecto utiliza **JSON Web Tokens (JWT)** para proteger las rutas y autenticar a los usuarios. El flujo funciona de la siguiente manera:

1. **Inicio de Sesión:** El usuario envía sus credenciales mediante un `POST` a `/api/login`.
2. **Almacenamiento:** Al recibir una respuesta exitosa, el Token JWT se almacena de forma segura en el `localStorage` del navegador.
3. **Peticiones HTTP (Axios):** Se utiliza un **Interceptor de Axios** que adjunta automáticamente el token en el encabezado de cada petición (`Authorization: Bearer <token>`).
4. **Control de Errores:** Si el servidor responde con un código `401 Unauthorized` (token expirado o inválido), el mismo interceptor borra el token y redirige automáticamente al usuario a la página de inicio (`/`).
5. **Protección de Rutas:** El componente `ProtectedRoute` en React verifica la existencia del token antes de permitir el renderizado de cualquier vista privada.

## Documentation
[Documentation](https://linktodocumentation)
## Authors
- [@MaryGomez19](https://github.com/MaryGomez19) 
- [@Rodr-Gam ](https://github.com/Rodr-Gam) 
