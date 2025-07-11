# 🏢 Arquitetura Multi-Tenant - GABI

## 📋 Visão Geral

O GABI suporta arquitetura **multi-tenant** completa, permitindo múltiplas organizações (tenants) na mesma plataforma, cada uma com seus próprios dados, usuários e configurações.

## 🏗️ Arquitetura Multi-Tenant

### Tipos de Multi-Tenancy

#### 1. **Database-per-Tenant** (Recomendado para GABI)
```
Supabase/
├── gabi_tenant_1/     # Banco separado por tenant
├── gabi_tenant_2/
├── gabi_tenant_3/
└── gabi_platform/     # Banco da plataforma
```

#### 2. **Schema-per-Tenant**
```
Supabase/
└── gabi_main/
    ├── tenant_1_schema/
    ├── tenant_2_schema/
    └── platform_schema/
```

#### 3. **Row-level Security** (Atual)
```
Supabase/
└── gabi_main/
    ├── users (tenant_id)
    ├── tasks (tenant_id)
    └── documents (tenant_id)
```

## 🎯 Estrutura de Organizações

### Hierarquia de Usuários
```
Platform Admin (Super Admin)
├── Organization Admin (Tenant Admin)
│   ├── Department Manager
│   │   ├── Team Lead
│   │   └── Regular User
│   └── Legal Department
│       ├── Lawyer
│       └── Paralegal
└── Organization Admin (Outro Tenant)
    └── ...
```

### Níveis de Acesso

#### 1. **Platform Admin (Super Admin)**
- **Acesso**: Todas as organizações
- **Permissões**:
  - Criar/gerenciar organizações
  - Configurar planos e limites
  - Monitorar uso da plataforma
  - Acesso a logs globais
  - Gerenciar templates globais

#### 2. **Organization Admin (Tenant Admin)**
- **Acesso**: Apenas sua organização
- **Permissões**:
  - Gerenciar usuários da organização
  - Configurar departamentos
  - Definir políticas de segurança
  - Acesso a relatórios da organização
  - Gerenciar templates da organização

#### 3. **Department Manager**
- **Acesso**: Seu departamento
- **Permissões**:
  - Gerenciar usuários do departamento
  - Aprovar tarefas
  - Acesso a relatórios do departamento

#### 4. **Regular User**
- **Acesso**: Próprios dados + dados compartilhados
- **Permissões**:
  - Criar/editar próprias tarefas
  - Acesso a documentos atribuídos
  - Exportar próprios dados

## 🗄️ Estrutura do Banco de Dados

### Tabelas da Plataforma (Global)
```sql
-- Organizações (Tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255),
  plan_type VARCHAR(50) DEFAULT 'basic',
  max_users INTEGER DEFAULT 10,
  max_storage_gb INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Planos disponíveis
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  max_users INTEGER,
  max_storage_gb INTEGER,
  features JSONB,
  is_active BOOLEAN DEFAULT true
);

-- Configurações da plataforma
CREATE TABLE platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabelas por Tenant
```sql
-- Usuários (com tenant_id)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  department_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tarefas (com tenant_id)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documentos (com tenant_id)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Segurança e Isolamento

### Row Level Security (RLS)
```sql
-- Política para usuários
CREATE POLICY "Users can only access their organization" ON users
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

-- Política para tarefas
CREATE POLICY "Users can only access their organization tasks" ON tasks
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);

-- Política para documentos
CREATE POLICY "Users can only access their organization documents" ON documents
  FOR ALL USING (organization_id = current_setting('app.organization_id')::UUID);
```

### Middleware de Tenant
```typescript
// middleware/tenant.ts
export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.headers['x-tenant-id'] || req.subdomain
  
  if (!tenantId) {
    return res.status(401).json({ error: 'Tenant ID required' })
  }
  
  // Verificar se o tenant existe e está ativo
  const tenant = await getTenant(tenantId)
  if (!tenant || !tenant.is_active) {
    return res.status(403).json({ error: 'Invalid or inactive tenant' })
  }
  
  // Definir tenant no contexto
  req.tenant = tenant
  next()
}
```

## 🎛️ Configuração de Tenants

### Criação de Nova Organização
```typescript
// services/organization.ts
export async function createOrganization(data: CreateOrganizationData) {
  const organization = await supabase
    .from('organizations')
    .insert({
      name: data.name,
      slug: data.slug,
      domain: data.domain,
      plan_type: data.planType || 'basic',
      max_users: data.maxUsers || 10,
      max_storage_gb: data.maxStorage || 5
    })
    .select()
    .single()

  // Criar admin da organização
  await createOrganizationAdmin(organization.id, data.adminData)
  
  return organization
}
```

### Configuração por Tenant
```typescript
// types/tenant.ts
interface TenantConfig {
  // Configurações gerais
  name: string
  slug: string
  domain?: string
  logo?: string
  
  // Limites e planos
  planType: 'basic' | 'professional' | 'enterprise'
  maxUsers: number
  maxStorageGB: number
  
  // Configurações específicas
  features: {
    legalMode: boolean
    advancedExport: boolean
    customTemplates: boolean
    apiAccess: boolean
  }
  
  // Configurações de segurança
  security: {
    mfaRequired: boolean
    sessionTimeout: number
    passwordPolicy: string
  }
}
```

## 🖥️ Interfaces de Administração

### Platform Admin Dashboard
```typescript
// pages/platform-admin/Dashboard.tsx
export function PlatformAdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Visão geral da plataforma */}
      <PlatformOverview />
      
      {/* Lista de organizações */}
      <OrganizationsList />
      
      {/* Métricas globais */}
      <GlobalMetrics />
      
      {/* Configurações da plataforma */}
      <PlatformSettings />
    </div>
  )
}
```

### Organization Admin Dashboard
```typescript
// pages/org-admin/Dashboard.tsx
export function OrganizationAdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Visão geral da organização */}
      <OrganizationOverview />
      
      {/* Gerenciamento de usuários */}
      <UsersManagement />
      
      {/* Configurações da organização */}
      <OrganizationSettings />
      
      {/* Relatórios da organização */}
      <OrganizationReports />
    </div>
  )
}
```

## 📊 Monitoramento e Analytics

### Métricas por Tenant
```typescript
// services/analytics.ts
export async function getTenantMetrics(tenantId: string) {
  return {
    users: await getActiveUsers(tenantId),
    tasks: await getTaskStats(tenantId),
    storage: await getStorageUsage(tenantId),
    activity: await getActivityMetrics(tenantId)
  }
}
```

### Limites e Quotas
```typescript
// services/quotas.ts
export async function checkQuota(tenantId: string, resource: string) {
  const tenant = await getTenant(tenantId)
  const usage = await getUsage(tenantId, resource)
  
  switch (resource) {
    case 'users':
      return usage.users < tenant.max_users
    case 'storage':
      return usage.storage_gb < tenant.max_storage_gb
    default:
      return true
  }
}
```

## 🔄 Migração para Multi-Tenant

### Passo a Passo
1. **Backup dos dados atuais**
2. **Criar estrutura multi-tenant**
3. **Migrar dados existentes**
4. **Implementar isolamento**
5. **Testar funcionalidades**
6. **Deploy gradual**

### Script de Migração
```sql
-- Migrar dados existentes para tenant padrão
INSERT INTO organizations (id, name, slug, plan_type)
VALUES ('default-tenant-id', 'Organização Padrão', 'default', 'basic');

-- Atualizar tabelas existentes
UPDATE users SET organization_id = 'default-tenant-id';
UPDATE tasks SET organization_id = 'default-tenant-id';
UPDATE documents SET organization_id = 'default-tenant-id';
```

## 🎯 Benefícios da Arquitetura Multi-Tenant

### Para a Plataforma
- ✅ **Escalabilidade**: Suporte a milhares de organizações
- ✅ **Isolamento**: Dados completamente separados
- ✅ **Customização**: Configurações por organização
- ✅ **Monetização**: Planos e limites por tenant

### Para as Organizações
- ✅ **Privacidade**: Dados isolados e seguros
- ✅ **Personalização**: Configurações específicas
- ✅ **Controle**: Administração local completa
- ✅ **Flexibilidade**: Crescimento independente

## 🚀 Implementação Recomendada

### Fase 1: Estrutura Base
- Implementar tabelas multi-tenant
- Criar middleware de isolamento
- Implementar RLS

### Fase 2: Administração
- Platform Admin Dashboard
- Organization Admin Dashboard
- Sistema de planos

### Fase 3: Funcionalidades Avançadas
- Customização por tenant
- Analytics avançados
- API multi-tenant

---

**Esta arquitetura permite que o GABI seja uma plataforma verdadeiramente multi-tenant, suportando múltiplas organizações de forma segura e escalável!** 🚀 