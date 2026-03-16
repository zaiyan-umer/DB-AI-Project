/**
 * src/main.tsx
 *
 * Wraps the app in ThemeProvider so every component can use useTheme().
 * ThemeProvider applies the correct class to <html> on first render,
 * so there is no flash of unstyled content.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { Toaster } from 'sonner'
import { ThemeProvider } from './contexts/ThemeContext'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000,
        },
    },
})

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <App />
                <Toaster position="top-center" richColors />
            </QueryClientProvider>
        </ThemeProvider>
    </StrictMode>,
)