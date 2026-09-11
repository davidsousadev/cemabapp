// ============================================================
// INICIALIZAÇÃO DO FRAMEWORK7
// ============================================================
var app = new Framework7({
    el: '#app',
    name: 'App Escolar Pais',
    theme: 'auto',
    view: {
        pushState: false
    }
});

// ============================================================
// APLICAÇÃO PRONTA
// ============================================================
document.addEventListener('deviceready', onDeviceReady, false);

async function onDeviceReady() {
    console.log('✅ Dispositivo pronto! Cordova ' + cordova.platformId + '@' + cordova.version);

    // ✅ NAVEGAÇÃO E ABAS JÁ FUNCIONAM AUTOMATICAMENTE pelo Framework7!
    // Não precisa mais de iniciarNavegacao() nem navegarPara()!

    // ============================================================
    // 🔐 VERIFICAR SE USUÁRIO JÁ ESTÁ CADASTRADO/LOGADO
    // ============================================================
    const usuarioLogado = localStorage.getItem('usuario_logado');

    if (usuarioLogado) {
        // ✅ JÁ TEM CADASTRO → INICIA FCM
        console.log('✅ Usuário cadastrado → iniciando FCM...');
        await iniciarFCM();
    } else {
        // ⏳ NOVO USUÁRIO
        console.log('⏳ Novo usuário → aguardando cadastro...');
        document.getElementById('notificationStatus').textContent = '🔐 Faça seu cadastro para receber avisos.';
        document.getElementById('tokenStatus').textContent = '⏳ Aguardando cadastro...';
        document.getElementById('serverStatus').textContent = '⏳ Sem conexão com servidor.';
    }
}

// ============================================================
// 📤 INICIAR FCM — SOMENTE APÓS CADASTRO
// ============================================================
async function iniciarFCM() {
    const firebaseOk = iniciarFirebase();
    if (!firebaseOk) return;

    const permitido = await verificarNotificacoes();
    if (!permitido) {
        document.getElementById('tokenStatus').textContent = '⚠️ Ative as notificações para continuar.';
        return;
    }

    await obterToken();
}