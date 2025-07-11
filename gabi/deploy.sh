#!/bin/bash

# =============================================================================
# SCRIPT DE DEPLOY AUTOMATIZADO GABI
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Verificar se Docker está instalado
check_docker() {
    log "Verificando Docker..."
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado. Instale o Docker primeiro."
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose não está instalado. Instale o Docker Compose primeiro."
    fi
    
    log "Docker e Docker Compose encontrados ✓"
}

# Verificar variáveis de ambiente
check_env() {
    log "Verificando variáveis de ambiente..."
    
    if [ ! -f .env ]; then
        error "Arquivo .env não encontrado. Copie env.example para .env e configure."
    fi
    
    # Verificar variáveis obrigatórias
    required_vars=(
        "SUPABASE_URL"
        "SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "JWT_SECRET"
        "ALLOWED_ORIGINS"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Variável $var não está definida no arquivo .env"
        fi
    done
    
    log "Variáveis de ambiente verificadas ✓"
}

# Backup dos dados existentes
backup_data() {
    log "Criando backup dos dados existentes..."
    
    if [ -d "data" ]; then
        timestamp=$(date +%Y%m%d_%H%M%S)
        tar -czf "backup_${timestamp}.tar.gz" data/
        log "Backup criado: backup_${timestamp}.tar.gz"
    fi
}

# Parar containers existentes
stop_containers() {
    log "Parando containers existentes..."
    docker-compose down --remove-orphans || true
}

# Remover imagens antigas
cleanup_images() {
    log "Limpando imagens antigas..."
    docker image prune -f || true
}

# Build das imagens
build_images() {
    log "Construindo imagens Docker..."
    
    # Build frontend
    log "Construindo frontend..."
    docker-compose build frontend
    
    # Build gateway
    log "Construindo gateway..."
    docker-compose build gateway
    
    log "Imagens construídas com sucesso ✓"
}

# Iniciar serviços
start_services() {
    log "Iniciando serviços..."
    docker-compose up -d
    
    log "Serviços iniciados ✓"
}

# Verificar saúde dos serviços
health_check() {
    log "Verificando saúde dos serviços..."
    
    # Aguardar serviços iniciarem
    sleep 10
    
    # Verificar frontend
    if curl -f http://localhost:5173/ > /dev/null 2>&1; then
        log "Frontend está funcionando ✓"
    else
        warn "Frontend pode não estar respondendo"
    fi
    
    # Verificar gateway
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log "Gateway está funcionando ✓"
    else
        warn "Gateway pode não estar respondendo"
    fi
    
    # Verificar nginx
    if curl -f http://localhost/ > /dev/null 2>&1; then
        log "Nginx está funcionando ✓"
    else
        warn "Nginx pode não estar respondendo"
    fi
}

# Configurar SSL (se necessário)
setup_ssl() {
    log "Configurando SSL..."
    
    # Verificar se certbot está disponível
    if command -v certbot &> /dev/null; then
        log "Certbot encontrado. Configurando SSL automático..."
        # Aqui você pode adicionar comandos do certbot
    else
        warn "Certbot não encontrado. Configure SSL manualmente ou use EasyPanel."
    fi
}

# Mostrar status final
show_status() {
    log "=== STATUS DO DEPLOY ==="
    echo ""
    echo "Frontend: http://localhost:5173"
    echo "Gateway:  http://localhost:3001"
    echo "Nginx:    http://localhost"
    echo ""
    echo "Para ver logs:"
    echo "  docker-compose logs -f"
    echo ""
    echo "Para parar:"
    echo "  docker-compose down"
    echo ""
    echo "Para reiniciar:"
    echo "  docker-compose restart"
    echo ""
}

# Função principal
main() {
    log "Iniciando deploy do GABI..."
    echo ""
    
    check_docker
    check_env
    backup_data
    stop_containers
    cleanup_images
    build_images
    start_services
    health_check
    setup_ssl
    show_status
    
    log "Deploy concluído com sucesso! 🎉"
}

# Executar função principal
main "$@" 