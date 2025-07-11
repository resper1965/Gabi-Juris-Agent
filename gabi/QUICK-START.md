# ⚡ Guia de Início Rápido - GABI no EasyPanel

## 🎯 Deploy em 5 Passos

### 1. Preparar VPS
```bash
# Conectar na VPS
ssh root@seu-ip-da-vps

# Executar script de setup
curl -s https://easypanel.io/install.sh | bash
```

### 2. Configurar Supabase
1. Criar projeto em [supabase.com](https://supabase.com)
2. Executar SQL: `gabi/gateway/supabase-schema.sql`
3. Criar bucket: `gabi-documents`
4. Anotar credenciais

### 3. Configurar Variáveis
```bash
# Editar arquivo .env
cp env.example .env
nano .env

# Configurar:
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
JWT_SECRET=seu-jwt-secret-64-caracteres
ALLOWED_ORIGINS=https://seu-dominio.com
```

### 4. Deploy Automático
```bash
# Executar deploy
chmod +x deploy.sh
./deploy.sh
```

### 5. Configurar Domínio
1. Configurar DNS: `A @ IP_DA_VPS`
2. Configurar subdomínio: `A api IP_DA_VPS`
3. Aguardar propagação DNS
4. SSL automático via EasyPanel

## ✅ Verificação

```bash
# Verificar containers
docker ps

# Testar endpoints
curl https://seu-dominio.com/health
curl https://api.seu-dominio.com/health

# Ver logs
docker-compose logs -f
```

## 🎉 Pronto!

- **Frontend**: https://seu-dominio.com
- **API**: https://api.seu-dominio.com
- **Admin**: https://seu-dominio.com/admin

## 📞 Suporte

- **Documentação completa**: `DEPLOY-EASYPANEL.md`
- **Configuração EasyPanel**: `easypanel-config.json`
- **Scripts**: `scripts/setup-easypanel.sh` 