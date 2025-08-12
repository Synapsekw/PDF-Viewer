# Environment Setup Guide

This guide will help you set up your environment variables for Spectra AI.

## Quick Setup

1. **Create a `.env` file** in the root directory of the project
2. Copy the following content and replace with your actual values:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://ajgtdraknmayclhawwlq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqZ3RkcmFrbm1heWNsaGF3d2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjMwNzcsImV4cCI6MjA3MDMzOTA3N30.l9lpihHadKs_rtXaWNpr0jQiABrKdGt7-2757mf1GD0

# Optional: Service role key (only if needed for admin operations)
# VITE_SUPABASE_SERVICE_ROLE_KEY=

# Storage Configuration
VITE_STORAGE_MODE=hybrid

# Feature Flags
VITE_ENABLE_AUTH=true
VITE_ENABLE_STORAGE=false
VITE_ENABLE_REALTIME=false
VITE_ENABLE_ANALYTICS=false

# Application Configuration
VITE_APP_NAME=Spectra AI
VITE_STORAGE_KEY=spectra-ai-auth

# Development/Production Mode
# VITE_NODE_ENV=development

# Optional: API endpoints or other services
# VITE_API_URL=
# VITE_ANALYTICS_API_KEY=
```

## Environment Variables Explained

### Required Variables

- **`VITE_SUPABASE_URL`**: Your Supabase project URL
- **`VITE_SUPABASE_ANON_KEY`**: Your Supabase anonymous/public key

### Optional Variables

- **`VITE_SUPABASE_SERVICE_ROLE_KEY`**: Service role key for admin operations (keep this secret!)
- **`VITE_STORAGE_MODE`**: Storage mode (`local`, `supabase`, or `hybrid`)
- **`VITE_ENABLE_AUTH`**: Enable authentication features
- **`VITE_ENABLE_STORAGE`**: Enable Supabase storage
- **`VITE_ENABLE_REALTIME`**: Enable realtime features
- **`VITE_ENABLE_ANALYTICS`**: Enable analytics features
- **`VITE_APP_NAME`**: Application name
- **`VITE_STORAGE_KEY`**: Local storage key for auth persistence

## Security Best Practices

1. **Never commit `.env` files** to version control
2. The `.gitignore` file is already configured to exclude:
   - `.env`
   - `.env.*`
   - `*.env`
   - Any other sensitive files

3. **Keep your keys secure**:
   - Never share your service role key
   - Rotate keys regularly
   - Use different keys for development and production

## Repository Setup

Your new repository is: `https://github.com/Synapsekw/SpectraAi.git`

To push your code:

```bash
git init
git add .
git commit -m "Initial commit with environment security"
git branch -M main
git remote add origin https://github.com/Synapsekw/SpectraAi.git
git push -u origin main
```

## Template File

An example environment file is provided at `env.example` for reference. This file contains placeholders and can be safely committed to version control.

## Troubleshooting

If you encounter issues:

1. Ensure your `.env` file is in the root directory
2. Restart your development server after creating/modifying `.env`
3. Check that all required variables are set
4. Verify your Supabase credentials are correct

## Additional Notes

- All environment variables must be prefixed with `VITE_` to be accessible in the Vite application
- The application will automatically detect and use environment variables
- Default values are provided for most optional variables
