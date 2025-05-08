# Expense Tracker

## UMKC Capstone project
expense tracking application built with React, TypeScript, and Supabase.
## Team Members 
1- Azim Khamis
2- Zhen Xiao
3- Tony Nguyen
4- Alaa Abdulameer

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [VS Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/) (optional)

## Local Setup Instructions

1. **Extract the Files**
   - Extract all files to a directory on your computer

2. **Open in VS Code**
   - Open VS Code
   - Go to File > Open Folder
   - Select the extracted project directory

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Set Up Environment Variables**
   - Rename `.env.example` to `.env`
   - Update the Supabase credentials in `.env`:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
expense-tracker/
├── public/              # Static assets
├── src/                 # Source code
│   ├── components/      # React components
│   ├── contexts/        # React contexts
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities and configurations
│   ├── pages/          # Page components
│   ├── services/       # External services
│   └── App.tsx         # Root component
├── .env.example        # Example environment variables
├── index.html          # HTML entry point
├── package.json        # Project dependencies
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── README.md           # Project documentation
```

## Features

- 👤 User authentication and profile management
- 💰 Expense tracking with categories
- 📸 Receipt scanning with OCR
- 🏦 Account management
- 📊 Expense analytics and reports
- 🌓 Dark mode support
- 📑 Export to PDF and Excel

## Troubleshooting

### Common Issues

1. **Node.js Version**
   - Ensure you have Node.js v18 or higher installed
   - Check version: `node --version`

2. **Dependencies Installation**
   - If you encounter errors during installation:
     ```bash
     npm cache clean --force
     rm -rf node_modules
     npm install
     ```

3. **Environment Variables**
   - Make sure `.env` file exists and contains correct Supabase credentials
   - Restart development server after changing environment variables

4. **Port Already in Use**
   - If port 5173 is already in use:
     - Stop other development servers
     - Or modify the port in `vite.config.ts`

### Support

For issues and feature requests, please create an issue in the repository.

## License

This project is licensed under the MIT License.
