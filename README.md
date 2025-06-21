# QR Smart Monorepo

This is a unified fullstack monorepo for a QR Code SaaS application. It includes:

- `apps/api-server` – Express.js backend with Mongoose and integrated M-Pesa/Flutterwave support
- `apps/admin-dashboard` – Vite + React.js dashboard for managing QR campaigns, users, and payments
- `packages/ui` – Shared UI components (React)
- `packages/utils` – Utility functions
- `packages/config` – Shared configuration and environment handling

## Getting Started

```bash
npm install
npm run dev
```

## Structure

```plaintext
apps/
  admin-dashboard/
  api-server/
packages/
  ui/
  utils/
  config/
```

Built with ❤️ using [Turborepo](https://turbo.build/).
