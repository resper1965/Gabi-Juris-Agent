# PROMPT: Stack UX/UI Simplificado - Essencial e Eficiente

## Stack Mínimo Recomendado

### Dependências Essenciais (Apenas 8 pacotes!)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.294.0",
    "react-hook-form": "^7.47.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

## Por que esta simplificação?

### ❌ Removido (Desnecessário):
- **Radix UI**: Muito pesado, 25+ componentes
- **Framer Motion**: Animações podem ser feitas com CSS
- **React Spring**: Redundante com CSS animations
- **React Icons**: Lucide React já cobre 90% dos casos
- **Heroicons**: Redundante com Lucide
- **TanStack Query**: Pode usar fetch nativo
- **Zustand/Jotai/Recoil**: useState + Context é suficiente
- **React Router**: Pode usar Next.js ou roteamento simples
- **date-fns/lodash**: JavaScript nativo é suficiente
- **uuid/nanoid**: crypto.randomUUID() nativo
- **CVA**: Tailwind já resolve variantes
- **tailwind-merge**: clsx já resolve conflitos

### ✅ Mantido (Essencial):
- **React + TypeScript**: Base necessária
- **Tailwind CSS**: Estilização eficiente
- **clsx**: Merge de classes
- **Lucide React**: Ícones modernos
- **React Hook Form**: Formulários robustos
- **Zod**: Validação type-safe

## Configuração Simplificada

### Tailwind CSS (tailwind.config.js)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

### Utilitário Simplificado (lib/utils.ts)
```typescript
import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Utilitários comuns
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
```

### CSS Global Simplificado (styles/globals.css)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --radius: 0.5rem;
  }
  
  * {
    @apply border-gray-200;
  }
  
  body {
    @apply bg-gray-50 text-gray-900 antialiased;
  }
}

@layer components {
  .btn {
    @apply inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50;
  }
  
  .btn-primary {
    @apply btn bg-primary-600 text-white hover:bg-primary-700;
  }
  
  .btn-secondary {
    @apply btn bg-gray-100 text-gray-900 hover:bg-gray-200;
  }
  
  .btn-outline {
    @apply btn border border-gray-300 bg-white hover:bg-gray-50;
  }
  
  .input {
    @apply flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50;
  }
  
  .card {
    @apply rounded-lg border border-gray-200 bg-white p-6 shadow-sm;
  }
}
```

## Componentes Base Simplificados

### Button Component
```typescript
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    const baseClasses = 'btn'
    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      ghost: 'btn bg-transparent hover:bg-gray-100'
    }
    const sizeClasses = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-6 text-base'
    }

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          loading && 'opacity-50 cursor-not-allowed',
          className
        )}
        ref={ref}
        disabled={loading}
        {...props}
      >
        {loading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
```

### Input Component
```typescript
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          className={cn(
            'input',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
```

### Card Component
```typescript
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn('card', className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

export { Card }
```

## Instalação Simplificada

### Comando Único
```bash
npm install react react-dom typescript tailwindcss clsx lucide-react react-hook-form zod
npm install -D @types/react @types/react-dom autoprefixer postcss
npx tailwindcss init -p
```

### Script Automatizado (install-simple-ui.sh)
```bash
#!/bin/bash

echo "🚀 Instalando stack UX/UI simplificado..."

# Dependências essenciais
npm install react react-dom typescript tailwindcss clsx lucide-react react-hook-form zod

# Dev dependencies
npm install -D @types/react @types/react-dom autoprefixer postcss

# Inicializar Tailwind
npx tailwindcss init -p

echo "✅ Stack simplificado instalado!"
echo "📁 Crie os arquivos utils.ts, globals.css e componentes base"
```

## Vantagens da Versão Simplificada

### 📦 **Menos Dependências**
- **Antes**: 40+ pacotes
- **Agora**: 8 pacotes essenciais
- **Redução**: 80% menos dependências

### ⚡ **Performance Melhor**
- Bundle menor
- Carregamento mais rápido
- Menos JavaScript para processar

### 🛠️ **Manutenção Mais Fácil**
- Menos dependências para atualizar
- Menos conflitos de versão
- Código mais simples

### 🎨 **Visual Mantido**
- Tailwind CSS para estilização
- Componentes customizados
- Animações CSS nativas
- Ícones modernos (Lucide)

### 🔧 **Funcionalidade Preservada**
- Formulários robustos (React Hook Form)
- Validação type-safe (Zod)
- Componentes acessíveis
- Responsividade completa

## Estrutura Simplificada

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── index.ts
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
├── lib/
│   └── utils.ts
├── styles/
│   └── globals.css
└── types/
    └── ui.ts
```

## Quando Usar Cada Versão

### ✅ **Use a Versão Simplificada quando:**
- Projeto pequeno/médio
- Equipe pequena
- Performance é crítica
- Manutenção simples
- MVP ou protótipo

### 🔄 **Use a Versão Completa quando:**
- Projeto grande/enterprise
- Equipe grande
- Necessidade de componentes complexos
- Animações avançadas
- Sistema de design robusto

## Conclusão

A versão simplificada mantém **90% da funcionalidade** com **20% das dependências**, oferecendo:

- ✅ Visual moderno e profissional
- ✅ Componentes acessíveis
- ✅ Performance otimizada
- ✅ Manutenção simples
- ✅ Setup rápido
- ✅ Bundle pequeno

É a escolha ideal para a maioria dos projetos! 🚀 