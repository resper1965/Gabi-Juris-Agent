import MagicChatMCPClient from '../src/magic-chat-client.js';

// Exemplo completo de integração com Magic Chat da 21st.dev
async function exemploCompletoMagicChat() {
  console.log('🎯 EXEMPLO COMPLETO - MAGIC CHAT 21ST.DEV\n');
  
  const client = new MagicChatMCPClient();
  
  try {
    await client.connect();
    console.log('✅ Conectado ao Magic Chat MCP\n');
    
    // ===== 1. GERENCIAMENTO DE CONVERSAS =====
    console.log('💬 1. GERENCIAMENTO DE CONVERSAS');
    console.log('-'.repeat(40));
    
    // Criar nova conversa
    const novaConversa = await client.createConversation('usuario-123', {
      title: 'Suporte Técnico',
      category: 'support',
      priority: 'high'
    });
    console.log('📝 Nova conversa criada:', novaConversa.content[0].text);
    
    // Listar conversas do usuário
    const conversas = await client.listConversations('usuario-123');
    console.log('📋 Conversas do usuário:', conversas.content[0].text);
    
    // ===== 2. CONSULTAS AO CHAT =====
    console.log('\n🤖 2. CONSULTAS AO CHAT');
    console.log('-'.repeat(40));
    
    // Primeira consulta
    const resposta1 = await client.query(
      'Como posso configurar um agente personalizado no Magic Chat?',
      'usuario-123',
      'conv-001'
    );
    console.log('💭 Resposta 1:', resposta1.content[0].text);
    
    // Segunda consulta (continuação da conversa)
    const resposta2 = await client.query(
      'Quais são os modelos de IA disponíveis?',
      'usuario-123',
      'conv-001'
    );
    console.log('💭 Resposta 2:', resposta2.content[0].text);
    
    // ===== 3. GERENCIAMENTO DE AGENTES =====
    console.log('\n👨‍💼 3. GERENCIAMENTO DE AGENTES');
    console.log('-'.repeat(40));
    
    // Criar agente de suporte
    const agenteSuporte = await client.createAgent({
      name: 'Agente de Suporte Técnico',
      description: 'Especialista em resolver problemas técnicos',
      model: 'gpt-4',
      temperature: 0.3,
      systemPrompt: 'Você é um agente de suporte técnico especializado em ajudar usuários com problemas.',
      capabilities: ['troubleshooting', 'documentation', 'escalation']
    });
    console.log('🤖 Agente de suporte criado:', agenteSuporte.content[0].text);
    
    // Criar agente de vendas
    const agenteVendas = await client.createAgent({
      name: 'Agente de Vendas',
      description: 'Especialista em vendas e prospecção',
      model: 'gpt-4',
      temperature: 0.7,
      systemPrompt: 'Você é um agente de vendas focado em entender as necessidades do cliente e apresentar soluções.',
      capabilities: ['lead_qualification', 'product_demo', 'pricing']
    });
    console.log('💰 Agente de vendas criado:', agenteVendas.content[0].text);
    
    // Listar todos os agentes
    const agentes = await client.listAgents();
    console.log('📋 Lista de agentes:', agentes.content[0].text);
    
    // ===== 4. BASE DE CONHECIMENTO =====
    console.log('\n📚 4. BASE DE CONHECIMENTO');
    console.log('-'.repeat(40));
    
    // Upload de documentação
    const docUpload = await client.uploadKnowledge(
      `# Guia do Magic Chat

## Introdução
O Magic Chat é uma plataforma de IA conversacional desenvolvida pela 21st.dev.

## Funcionalidades
- Agentes personalizados
- Base de conhecimento
- Analytics avançados
- Integração via API
- Webhooks em tempo real

## Configuração
1. Crie uma conta na 21st.dev
2. Configure seu projeto
3. Crie seus primeiros agentes
4. Faça upload da sua base de conhecimento

## API
A API do Magic Chat permite integração completa com suas aplicações.`,
      'markdown'
    );
    console.log('📄 Documentação enviada:', docUpload.content[0].text);
    
    // Upload de FAQ
    const faqUpload = await client.uploadKnowledge(
      `P: Como funciona o Magic Chat?
R: O Magic Chat é uma plataforma que permite criar agentes de IA conversacionais personalizados.

P: Quais modelos de IA são suportados?
R: Suportamos GPT-4, Claude, e outros modelos avançados.

P: Como integrar com minha aplicação?
R: Use nossa API REST ou SDKs disponíveis para Node.js, Python e outras linguagens.`,
      'faq'
    );
    console.log('❓ FAQ enviado:', faqUpload.content[0].text);
    
    // Buscar conhecimento
    const busca = await client.searchKnowledge('integração API');
    console.log('🔍 Resultado da busca:', busca.content[0].text);
    
    // Listar conhecimento
    const conhecimento = await client.listKnowledge();
    console.log('📚 Base de conhecimento:', conhecimento.content[0].text);
    
    // ===== 5. WEBHOOKS =====
    console.log('\n🔗 5. WEBHOOKS');
    console.log('-'.repeat(40));
    
    // Criar webhook para notificações
    const webhook = await client.createWebhook({
      name: 'Notificações de Conversa',
      url: 'https://minha-app.com/webhook/magic-chat',
      events: ['conversation.created', 'message.received', 'agent.assigned'],
      secret: 'webhook-secret-123'
    });
    console.log('🔗 Webhook criado:', webhook.content[0].text);
    
    // Listar webhooks
    const webhooks = await client.listWebhooks();
    console.log('📋 Webhooks ativos:', webhooks.content[0].text);
    
    // ===== 6. ANALYTICS =====
    console.log('\n📊 6. ANALYTICS');
    console.log('-'.repeat(40));
    
    // Analytics de conversas
    const analyticsConversas = await client.getConversationAnalytics('30d');
    console.log('📈 Analytics de conversas:', analyticsConversas.content[0].text);
    
    // Analytics de mensagens
    const analyticsMensagens = await client.getMessageAnalytics('7d');
    console.log('💬 Analytics de mensagens:', analyticsMensagens.content[0].text);
    
    // Analytics de performance
    const analyticsPerformance = await client.getPerformanceAnalytics('14d', [
      'response_time',
      'accuracy',
      'user_satisfaction',
      'resolution_rate'
    ]);
    console.log('⚡ Analytics de performance:', analyticsPerformance.content[0].text);
    
    // ===== 7. DEPLOYMENTS =====
    console.log('\n🚀 7. DEPLOYMENTS');
    console.log('-'.repeat(40));
    
    // Fazer deployment do agente
    const deployment = await client.deployAgent({
      agentId: 'agente-suporte-001',
      environment: 'production',
      version: '1.0.0',
      config: {
        autoScale: true,
        maxConcurrentConversations: 100,
        fallbackAgent: 'agente-fallback'
      }
    });
    console.log('🚀 Deployment iniciado:', deployment.content[0].text);
    
    // Verificar status do deployment
    const statusDeployment = await client.getDeploymentStatus('deploy-001');
    console.log('📊 Status do deployment:', statusDeployment.content[0].text);
    
    // Listar deployments
    const deployments = await client.listDeployments();
    console.log('📋 Lista de deployments:', deployments.content[0].text);
    
    // ===== 8. CONFIGURAÇÕES =====
    console.log('\n⚙️ 8. CONFIGURAÇÕES');
    console.log('-'.repeat(40));
    
    // Definir configurações
    await client.setConfig('max_response_time', '30');
    await client.setConfig('default_language', 'pt-BR');
    await client.setConfig('auto_escalation', 'true');
    
    // Listar configurações
    const configs = await client.listConfigs();
    console.log('⚙️ Configurações:', configs.content[0].text);
    
    // ===== 9. CENÁRIO REAL =====
    console.log('\n🎭 9. CENÁRIO REAL - SUPORTE AO CLIENTE');
    console.log('-'.repeat(40));
    
    // Simular conversa de suporte
    const suporte1 = await client.query(
      'Olá, estou tendo problemas para integrar o Magic Chat na minha aplicação React',
      'cliente-456',
      'suporte-001'
    );
    console.log('👤 Cliente:', 'Olá, estou tendo problemas para integrar o Magic Chat na minha aplicação React');
    console.log('🤖 Agente:', suporte1.content[0].text);
    
    const suporte2 = await client.query(
      'Já tentei usar o SDK do Node.js, mas não consegui fazer funcionar',
      'cliente-456',
      'suporte-001'
    );
    console.log('👤 Cliente:', 'Já tentei usar o SDK do Node.js, mas não consegui fazer funcionar');
    console.log('🤖 Agente:', suporte2.content[0].text);
    
    const suporte3 = await client.query(
      'Perfeito! Vou tentar isso. Obrigado pela ajuda!',
      'cliente-456',
      'suporte-001'
    );
    console.log('👤 Cliente:', 'Perfeito! Vou tentar isso. Obrigado pela ajuda!');
    console.log('🤖 Agente:', suporte3.content[0].text);
    
    console.log('\n✅ Exemplo completo executado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no exemplo:', error);
  }
}

// Exemplo focado em um caso de uso específico
async function exemploCasosDeUso() {
  console.log('🎯 CASOS DE USO - MAGIC CHAT\n');
  
  const client = new MagicChatMCPClient();
  
  try {
    await client.connect();
    
    // Caso de uso 1: E-commerce
    console.log('🛒 CASO DE USO: E-COMMERCE');
    console.log('-'.repeat(30));
    
    const agenteEcommerce = await client.createAgent({
      name: 'Assistente de Vendas E-commerce',
      description: 'Ajuda clientes com produtos, preços e pedidos',
      model: 'gpt-4',
      temperature: 0.5,
      systemPrompt: 'Você é um assistente de vendas especializado em e-commerce. Ajude os clientes a encontrar produtos, comparar preços e finalizar compras.'
    });
    
    const consultaEcommerce = await client.query(
      'Estou procurando um smartphone com boa câmera e bateria duradoura',
      'cliente-ecommerce',
      'vendas-001'
    );
    console.log('📱 Consulta e-commerce:', consultaEcommerce.content[0].text);
    
    // Caso de uso 2: Suporte Técnico
    console.log('\n🔧 CASO DE USO: SUPORTE TÉCNICO');
    console.log('-'.repeat(30));
    
    const agenteSuporte = await client.createAgent({
      name: 'Suporte Técnico Especializado',
      description: 'Resolve problemas técnicos complexos',
      model: 'gpt-4',
      temperature: 0.2,
      systemPrompt: 'Você é um técnico especializado. Sempre peça informações detalhadas antes de dar soluções.'
    });
    
    const consultaSuporte = await client.query(
      'Meu servidor está apresentando erro 500, o que pode ser?',
      'cliente-suporte',
      'tecnico-001'
    );
    console.log('🖥️ Consulta suporte:', consultaSuporte.content[0].text);
    
    // Caso de uso 3: Educação
    console.log('\n📚 CASO DE USO: EDUCAÇÃO');
    console.log('-'.repeat(30));
    
    const agenteEducacao = await client.createAgent({
      name: 'Tutor Virtual',
      description: 'Ajuda estudantes com dúvidas acadêmicas',
      model: 'gpt-4',
      temperature: 0.6,
      systemPrompt: 'Você é um tutor virtual paciente e didático. Explique conceitos de forma clara e use exemplos práticos.'
    });
    
    const consultaEducacao = await client.query(
      'Pode me explicar o que é inteligência artificial de forma simples?',
      'estudante-001',
      'aula-001'
    );
    console.log('🎓 Consulta educação:', consultaEducacao.content[0].text);
    
  } catch (error) {
    console.error('❌ Erro nos casos de uso:', error);
  }
}

// Executar exemplos se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Escolha um exemplo:');
  console.log('1. Exemplo completo');
  console.log('2. Casos de uso');
  
  const choice = process.argv[2] || '1';
  
  if (choice === '1') {
    await exemploCompletoMagicChat();
  } else if (choice === '2') {
    await exemploCasosDeUso();
  } else {
    console.log('Opção inválida. Executando exemplo completo...');
    await exemploCompletoMagicChat();
  }
}

export { exemploCompletoMagicChat, exemploCasosDeUso }; 