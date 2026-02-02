# Vayper - Invoice Management System

A complete invoice, quote, and receipt management system with modern frontend and backend.

## Project Structure

```
vayper/
├── frontend/          # React + TypeScript frontend
├── backend/           # NestJS backend API
└── package.json       # Monorepo scripts
```

## Getting Started

### Install Dependencies
```bash
npm run install:all
```

### Development

**Run Frontend:**
```bash
npm run frontend
```
Frontend will run on: http://localhost:8080

**Run Backend:**
```bash
npm run backend
```
Backend will run on: http://localhost:8081
API Docs (Swagger): http://localhost:8081/api

### Build

**Build Frontend:**
```bash
npm run build:frontend
```

**Build Backend:**
```bash
npm run build:backend
```

## Features

- 🔐 User Authentication with JWT
- 👤 User Profile Management
- 📄 Invoice Management
- 💳 Quote Management
- 🧾 Receipt Management
- 📊 Dashboard
- ⚙️ Super Admin Settings
- ☁️ Cloudinary Image Upload

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- TailwindCSS
- Shadcn/ui

### Backend
- NestJS
- MongoDB + Mongoose
- JWT Authentication
- Cloudinary
- Swagger/OpenAPI

## Environment Variables

### Backend (.env)
```
PORT=8081
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## License

Private
