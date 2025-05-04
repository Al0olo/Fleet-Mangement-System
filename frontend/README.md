# Fleet Management System - Frontend

This is the frontend web application for the Fleet Management System. It is built with React, TypeScript, Redux Toolkit, and Vite.

## Features

- Dashboard with key fleet metrics
- Vehicle management
- Real-time tracking
- Maintenance records and scheduling
- Analytics and reporting
- Simulation controls

## Prerequisites

- Node.js v16+ 
- npm v8+

## Installation

1. Clone the repository:
```
git clone <repository-url>
```

2. Navigate to the frontend directory:
```
cd Fleet-Mangement-System/frontend
```

3. Install dependencies:
```
npm install
```

## Configuration

The application is configured to connect to the API Gateway by default. The API Gateway should be running on `http://localhost:8080`.

All API requests from the frontend are proxied through the `/api` path to the API Gateway.

## Development

To start the development server:

```
npm run dev
```

This will start the app in development mode at `http://localhost:5000`.

## Building for Production

To build the application for production:

```
npm run build
```

The built files will be located in the `dist` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable components
│   ├── pages/              # Page components
│   ├── redux/
│   │   ├── slices/         # Redux Toolkit slices
│   │   └── store.ts        # Redux store configuration
│   ├── services/           # API services
│   ├── App.tsx             # Main application component
│   └── main.tsx            # Application entry point
├── index.html              # HTML template
├── package.json            # Package configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

## Communication with Backend

The frontend communicates with the backend exclusively through the API Gateway, which routes requests to the appropriate microservices. This approach provides:

1. **Simplified Frontend Configuration**: The frontend only needs to know about one endpoint (the API Gateway).
2. **Centralized Authentication**: Authentication and authorization are handled by the API Gateway.
3. **Load Balancing and Resilience**: The API Gateway can handle load balancing and implement resilience patterns.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Lint the codebase

## Browser Support

The application is designed to work in all modern browsers (Chrome, Firefox, Safari, Edge). 