# Absendo 

**Absendo** is a tool designed to simplify the process of filling out absence forms for students of the BBZW (Berufsbildungszentrum Wirtschaft, Informatik und Technik). By integrating directly with your school calendar, Absendo automates the task of generating absence forms, saving students time and effort.

## 🌐 Live Demo

Experience Absendo live: [https://absendo.app](https://absendo.app)

## 🚀 Technologies

*   **Frontend:**
    *   [TypeScript](https://www.typescriptlang.org/)
    *   [React](https://react.dev/)
    *   [Vite](https://vitejs.dev/) (Build Tool)
    *   [Tailwind CSS](https://tailwindcss.com/) (Styling), [DaisyUI](https://daisyui.com/) (Component Library)
    *   [Supabase](https://supabase.com/) (Authentication, Database)
*   **Deployment:**
    *   [Vercel](https://vercel.com/)

## 📦 Project Structure

This repository contains the **frontend** of the Absendo application, built with React and Vite. The backend is maintained in a separate repository:

👉 [Absendo Backend Repository](https://github.com/jwirzz/absendo-backend)

## 🛠️ Installation & Local Setup

To get a local copy of Absendo up and running for development, follow these steps:

### Prerequisites

*   Node.js (LTS version recommended)
*   npm (comes with Node.js)
*   [Supabase CLI](https://supabase.com/docs/guides/cli)
*   Docker Desktop (must be running while Supabase runs)

### 1. Clone the repository

```bash
git clone git@github.com:jwirzz/absendo.git
cd absendo-react
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the local Supabase environment

Make sure Docker Desktop is running before executing this command. This command starts the local Supabase database and provides you with the necessary API keys.

```bash
supabase start
```

After the command completes, you will see output similar to this:

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
         MCP URL: http://127.0.0.1:54321/mcp
    Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
     Mailpit URL: http://127.0.0.1:54324
 Publishable key: sb_publishable_ACJWlzQHlZj...
      Secret key: sb_secret_N7UND0UgjKTVK...
   S3 Access Key: 625729a08b95bf...
   S3 Secret Key: 850181e4652dd023b7a98c...
       S3 Region: local
```

### 4. Configure Environment Variables

Create a `.env` file in the root of the project. Copy the **API URL** and **anon key** from the `supabase start` output into this file.

```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-publishable-key-from-previous-step
```

### 5. Run the Development Server

```bash
npm run dev
```

This will start the React development server, usually at `http://localhost:5173`.

### Stopping the Supabase Environment

When you are finished with your development session, you can stop the local Supabase services.

```bash
supabase stop
```

## 👋 Contributing

We welcome contributions to Absendo! If you have suggestions for improvements, bug reports, or want to contribute code, please feel free to:

1.  Open an issue to discuss your proposed changes or report a bug.
2.  Fork the repository and create a pull request with your contributions.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Thanks

Special thanks to everyone who shared their SLUZ URL for testing purposes — your help made this tool possible.
Thanks also to [dDreistein](https://github.com/dDreistein) for designing the favicon.