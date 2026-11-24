# Food Store — Trabajo Práctico Integrador

**Alumna:** Ocete Rocio Milagros  
**Comisión:** 11  
**Materia:** Programación IV

## Descripción

Food Store es una aplicación web de gestión y venta de productos. Permite consultar el catálogo, administrar categorías y productos, realizar pedidos y gestionar las operaciones desde un panel de administración.

El proyecto está desarrollado con un backend en FastAPI y un frontend en React con TypeScript, conectado a una base de datos **SQLite**, que permite almacenar y gestionar la información de usuarios, categorías, productos y pedidos.

## Requisitos

- Python 3.11–3.13.
- Node.js 20.19 o superior.
- pnpm.
- SQLite (incluido en Python).

## Configuración de la base de datos

El proyecto utiliza SQLite como sistema de gestión de base de datos. La aplicación crea o utiliza automáticamente el archivo `foodstore.db` para almacenar la información.

No es necesario instalar ni configurar un servidor de base de datos adicional.

## Backend

### Instalación y configuración

Desde la raíz del proyecto, ejecutar:

```powershell
cd backend

Copy-Item .env.example .env

py -m venv .venv

.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

### Variables de entorno

El archivo `backend/.env.example` contiene las variables de configuración del backend.

La aplicación utiliza SQLite por defecto y crea o utiliza el archivo `foodstore.db` para almacenar los datos.

No es necesario instalar un servidor de base de datos adicional para ejecutar la configuración actual.

### Inicialización de datos

Para cargar los datos iniciales de la aplicación, ejecutar:

```bash
py -m app.db.seed
```

Este comando carga el usuario administrador, las categorías y los productos iniciales.

### Ejecución

Para iniciar el servidor:

```bash
uvicorn app.main:app --reload
```

La API estará disponible en:

- API: http://localhost:8000
- Documentación Swagger: http://localhost:8000/docs

## Frontend

### Instalación y configuración

Desde la raíz del proyecto, ejecutar:

```bash
cd frontend

Copy-Item .env.example .env

pnpm install
```

### Variables de entorno

El archivo `frontend/.env.example` contiene la configuración necesaria para conectar el frontend con el backend.

La variable `VITE_API_URL` debe apuntar a la dirección de la API. Para el entorno local:

VITE_API_URL=http://localhost:8000/api/v1

### Compilación y ejecución

Para comprobar la compilación:

```bash
pnpm build
```

Para iniciar el servidor de desarrollo:

```bash
pnpm dev
```

La aplicación estará disponible en la dirección local indicada por Vite, normalmente:

http://localhost:5173

## Usuario administrador

El usuario administrador se crea automáticamente al ejecutar el seed del backend:

```bash
python -m app.db.seed
```

**Credenciales de acceso:**

- Usuario: `admin`
- Contraseña: `Admin1234!`


## Repositorio de GitHub

URL del repositorio público:

[https://github.com/rocio-ocete/FoodStore_TPI_P4.git]

## Video de demostración

Video público de demostración del funcionamiento de la aplicación:

[https://drive.google.com/drive/folders/1hXaW_ROj0_DOfAYumrXw8iGUuhJU8LJt?usp=sharing]
