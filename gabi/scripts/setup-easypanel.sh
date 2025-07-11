#!/bin/bash

# =============================================================================
# SCRIPT DE SETUP AUTOMATIZADO PARA EASYPANEL
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Verificar se está rodando como root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "Este script deve ser executado como root"
    fi
}

# Instalar dependências do sistema
install_dependencies() {
    log "Instalando dependências do sistema..."
    
    # Atualizar sistema
    apt update
    
    # Instalar dependências
    apt install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release
    
    log "Dependências instaladas ✓"
}

# Instalar Docker
install_docker() {
    log "Instalando Docker..."
    
    # Adicionar repositório Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Instalar Docker
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Adicionar usuário ao grupo docker
    usermod -aG docker $SUDO_USER
    
    # Iniciar e habilitar Docker
    systemctl start docker
    systemctl enable docker
    
    log "Docker instalado ✓"
}

# Instalar EasyPanel
install_easypanel() {
    log "Instalando EasyPanel..."
    
    # Baixar e executar script de instalação
    curl -s https://easypanel.io/install.sh | bash
    
    log "EasyPanel instalado ✓"
    log "Acesse: http://$(hostname -I | awk '{print $1}'):3000"
}

# Configurar firewall
setup_firewall() {
    log "Configurando firewall..."
    
    # Instalar UFW se não estiver instalado
    if ! command -v ufw &> /dev/null; then
        apt install -y ufw
    fi
    
    # Configurar regras
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3000/tcp  # EasyPanel
    
    # Habilitar firewall
    ufw --force enable
    
    log "Firewall configurado ✓"
}

# Criar diretórios necessários
create_directories() {
    log "Criando diretórios..."
    
    mkdir -p /opt/gabi
    mkdir -p /opt/gabi/logs
    mkdir -p /opt/gabi/backups
    mkdir -p /opt/gabi/ssl
    
    # Definir permissões
    chown -R $SUDO_USER:$SUDO_USER /opt/gabi
    
    log "Diretórios criados ✓"
}

# Configurar SSL automático
setup_ssl() {
    log "Configurando SSL automático..."
    
    # Instalar certbot
    apt install -y certbot python3-certbot-nginx
    
    log "Certbot instalado ✓"
    log "Configure SSL manualmente após configurar o domínio"
}

# Configurar backup automático
setup_backup() {
    log "Configurando backup automático..."
    
    # Criar script de backup
    cat > /opt/gabi/backup.sh << 'EOF'
#!/bin/bash

# Script de backup automático
BACKUP_DIR="/opt/gabi/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Criar backup dos containers
docker-compose -f /opt/gabi/docker-compose.yml down
tar -czf "$BACKUP_DIR/gabi_$DATE.tar.gz" /opt/gabi
docker-compose -f /opt/gabi/docker-compose.yml up -d

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -name "gabi_*.tar.gz" -mtime +7 -delete

echo "Backup criado: gabi_$DATE.tar.gz"
EOF
    
    chmod +x /opt/gabi/backup.sh
    
    # Adicionar ao crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * /opt/gabi/backup.sh") | crontab -
    
    log "Backup automático configurado ✓"
}

# Configurar monitoramento
setup_monitoring() {
    log "Configurando monitoramento..."
    
    # Criar script de monitoramento
    cat > /opt/gabi/monitor.sh << 'EOF'
#!/bin/bash

# Script de monitoramento
LOG_FILE="/opt/gabi/logs/monitor.log"

# Verificar containers
if ! docker ps | grep -q "gabi-frontend"; then
    echo "$(date): Frontend container down" >> $LOG_FILE
    docker-compose -f /opt/gabi/docker-compose.yml up -d gabi-frontend
fi

if ! docker ps | grep -q "gabi-gateway"; then
    echo "$(date): Gateway container down" >> $LOG_FILE
    docker-compose -f /opt/gabi/docker-compose.yml up -d gabi-gateway
fi

if ! docker ps | grep -q "gabi-nginx"; then
    echo "$(date): Nginx container down" >> $LOG_FILE
    docker-compose -f /opt/gabi/docker-compose.yml up -d gabi-nginx
fi

# Verificar uso de disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): Disk usage high: ${DISK_USAGE}%" >> $LOG_FILE
fi

# Verificar uso de memória
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEM_USAGE -gt 80 ]; then
    echo "$(date): Memory usage high: ${MEM_USAGE}%" >> $LOG_FILE
fi
EOF
    
    chmod +x /opt/gabi/monitor.sh
    
    # Adicionar ao crontab (a cada 5 minutos)
    (crontab -l 2>/dev/null; echo "*/5 * * * * /opt/gabi/monitor.sh") | crontab -
    
    log "Monitoramento configurado ✓"
}

# Mostrar informações finais
show_info() {
    log "=== SETUP CONCLUÍDO ==="
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Acesse o EasyPanel: http://$(hostname -I | awk '{print $1}'):3000"
    echo "2. Configure seu domínio"
    echo "3. Configure SSL"
    echo "4. Faça deploy da aplicação GABI"
    echo ""
    echo "📁 Diretórios criados:"
    echo "   /opt/gabi/          - Aplicação principal"
    echo "   /opt/gabi/logs/     - Logs do sistema"
    echo "   /opt/gabi/backups/  - Backups automáticos"
    echo "   /opt/gabi/ssl/      - Certificados SSL"
    echo ""
    echo "🔧 Scripts disponíveis:"
    echo "   /opt/gabi/backup.sh   - Backup manual"
    echo "   /opt/gabi/monitor.sh  - Monitoramento"
    echo ""
    echo "📊 Monitoramento:"
    echo "   - Backup automático: 02:00 diariamente"
    echo "   - Monitoramento: a cada 5 minutos"
    echo "   - Logs: /opt/gabi/logs/"
    echo ""
}

# Função principal
main() {
    log "Iniciando setup do EasyPanel para GABI..."
    echo ""
    
    check_root
    install_dependencies
    install_docker
    install_easypanel
    setup_firewall
    create_directories
    setup_ssl
    setup_backup
    setup_monitoring
    show_info
    
    log "Setup concluído com sucesso! 🎉"
}

# Executar função principal
main "$@" 