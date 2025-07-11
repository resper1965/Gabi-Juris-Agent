# 📝 Padrões de Código - GABI

## 🎯 Princípios Gerais

### Clean Code
- **Legibilidade**: Código deve ser auto-explicativo
- **Simplicidade**: Evite complexidade desnecessária
- **Consistência**: Mantenha padrões uniformes
- **Manutenibilidade**: Fácil de modificar e estender

### Performance
- **Otimização**: Código eficiente e rápido
- **Bundle Size**: Minimizar tamanho do bundle
- **Lazy Loading**: Carregamento sob demanda
- **Memoização**: Evitar re-renders desnecessários

## 📁 Estrutura de Arquivos

### Nomenclatura
```typescript
// ✅ Correto
components/
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Card.tsx
├── features/
│   ├── TaskList.tsx
│   ├── ExportModal.tsx
│   └── AuditLog.tsx
└── layout/
    ├── Header.tsx
    ├── Sidebar.tsx
    └── Footer.tsx

// ❌ Incorreto
components/
├── button.tsx
├── ButtonComponent.tsx
├── task-list.tsx
└── TaskListComponent.tsx
```

### Organização de Pastas
```
src/
├── components/     # Componentes React
├── pages/         # Páginas da aplicação
├── hooks/         # Custom hooks
├── lib/           # Utilitários e configurações
├── stores/        # Estado global (Zustand)
├── types/         # Tipos TypeScript
├── styles/        # Estilos globais
└── utils/         # Funções utilitárias
```

## 🎨 Padrões de Componentes

### Estrutura de Componente
```typescript
// 1. Imports
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

// 2. Types/Interfaces
interface ComponentProps {
  title: string
  onAction?: () => void
  className?: string
}

// 3. Componente Principal
export function Component({ title, onAction, className }: ComponentProps) {
  // 4. Hooks e Estado
  const [isLoading, setIsLoading] = useState(false)

  // 5. Handlers
  const handleClick = () => {
    setIsLoading(true)
    onAction?.()
  }

  // 6. Render
  return (
    <div className={cn('p-4', className)}>
      <h2>{title}</h2>
      <Button onClick={handleClick} loading={isLoading}>
        Ação
      </Button>
    </div>
  )
}
```

### Props e Tipagem
```typescript
// ✅ Correto - Props bem tipadas
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

// ❌ Incorreto - Props genéricas
interface ButtonProps {
  [key: string]: any
}
```

## 🎯 Padrões de Hooks

### Custom Hooks
```typescript
// ✅ Padrão correto
export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [url])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(url)
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch: fetchData }
}

// ❌ Padrão incorreto
export function useApi(url: string) {
  // Lógica misturada, sem tipagem
}
```

### Hooks de Estado
```typescript
// ✅ Zustand Store
interface TaskStore {
  tasks: Task[]
  addTask: (task: Task) => void
  removeTask: (id: string) => void
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  addTask: (task) => set((state) => ({ 
    tasks: [...state.tasks, task] 
  })),
  removeTask: (id) => set((state) => ({ 
    tasks: state.tasks.filter(task => task.id !== id) 
  }))
}))
```

## 🎨 Padrões de Estilização

### Tailwind CSS
```typescript
// ✅ Classes organizadas
const buttonClasses = cn(
  // Base
  'inline-flex items-center justify-center rounded-md font-medium',
  // Variantes
  variant === 'primary' && 'bg-primary-600 text-white hover:bg-primary-700',
  variant === 'secondary' && 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  // Estados
  loading && 'opacity-50 cursor-not-allowed',
  // Custom
  className
)

// ❌ Classes misturadas
className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
```

### CSS Customizado
```css
/* ✅ Componentes organizados */
@layer components {
  .btn {
    @apply inline-flex items-center justify-center rounded-md font-medium transition-colors;
  }
  
  .btn-primary {
    @apply btn bg-primary-600 text-white hover:bg-primary-700;
  }
}

/* ❌ CSS inline ou misturado */
```

## 🔧 Padrões de Utilitários

### Funções Utilitárias
```typescript
// ✅ Funções puras e bem tipadas
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date))
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

// ❌ Funções com efeitos colaterais
export function formatDate(date: Date) {
  // Lógica complexa, efeitos colaterais
}
```

### Validação
```typescript
// ✅ Zod Schemas
import { z } from 'zod'

export const TaskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.date().optional()
})

export type Task = z.infer<typeof TaskSchema>

// ❌ Validação manual
export interface Task {
  title: string
  description?: string
  priority: string
  dueDate?: Date
}
```

## 📊 Padrões de Performance

### Memoização
```typescript
// ✅ React.memo para componentes
export const ExpensiveComponent = React.memo(({ data }: Props) => {
  return <div>{/* Renderização complexa */}</div>
})

// ✅ useMemo para cálculos
const expensiveValue = useMemo(() => {
  return data.filter(item => item.active).map(item => item.value).reduce((a, b) => a + b, 0)
}, [data])

// ✅ useCallback para handlers
const handleClick = useCallback(() => {
  onAction(id)
}, [onAction, id])
```

### Lazy Loading
```typescript
// ✅ Componentes lazy
const TaskList = lazy(() => import('./TaskList'))
const ExportModal = lazy(() => import('./ExportModal'))

// ✅ Suspense wrapper
<Suspense fallback={<Skeleton />}>
  <TaskList />
</Suspense>
```

## 🧪 Padrões de Testes

### Estrutura de Testes
```typescript
// ✅ Teste bem estruturado
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## 📝 Documentação

### JSDoc
```typescript
/**
 * Componente de botão customizável
 * @param variant - Variante visual do botão
 * @param size - Tamanho do botão
 * @param loading - Estado de carregamento
 * @param children - Conteúdo do botão
 */
export function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading, 
  children 
}: ButtonProps) {
  // Implementação
}
```

### README de Componentes
```markdown
# Button Component

Componente de botão reutilizável com múltiplas variantes.

## Props
- `variant`: 'primary' | 'secondary' | 'outline'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `children`: ReactNode

## Exemplo
```tsx
<Button variant="primary" size="md" loading={false}>
  Clique aqui
</Button>
```
```

## 🔍 Linting e Formatação

### ESLint Config
```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "no-unused-vars": "error",
    "prefer-const": "error",
    "no-console": "warn"
  }
}
```

### Prettier Config
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

---

**Siga estes padrões para manter o código limpo, performático e fácil de manter!** 🚀 