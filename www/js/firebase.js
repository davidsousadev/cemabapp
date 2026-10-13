// Firebase Messaging do plugin cordova-plugin-firebase-messaging 8.0.1.
// O cadastro do token acontece em segundo plano; detalhes técnicos não são exibidos na Home.
(function () {
    let firebaseStarted = false;

    function firebaseDisponivel() {
        return !!(window.cordova && cordova.plugins && cordova.plugins.firebase && cordova.plugins.firebase.messaging);
    }

    async function verificarNotificacoes() {
        if (!firebaseDisponivel()) {
            window.CEMAB_NOTIFICATIONS_ALLOWED = false;
            return false;
        }
        try {
            // forceShow=true também permite a apresentação de avisos quando o app está aberto.
            await cordova.plugins.firebase.messaging.requestPermission({ forceShow: true });
            window.CEMAB_NOTIFICATIONS_ALLOWED = true;
            return true;
        } catch (error) {
            window.CEMAB_NOTIFICATIONS_ALLOWED = false;
            console.warn('Permissão de notificações não concedida.', error);
            return false;
        }
    }

    async function obterToken() {
        if (!firebaseDisponivel()) return '';
        try {
            const token = await cordova.plugins.firebase.messaging.getToken();
            if (!token) return '';
            const tokenAnterior = window.CemabApi ? CemabApi.getTokenLocal() : (localStorage.getItem('cemab_fcm_token') || '');
            await CemabApi.enviarTokenParaAPI(token, tokenAnterior);
            console.log('Token FCM registrado/atualizado na API.');
            return token;
        } catch (error) {
            console.error('Não foi possível registrar o token FCM.', error);
            return '';
        }
    }

    function iniciarFirebase() {
        if (firebaseStarted) return firebaseDisponivel();
        if (!firebaseDisponivel()) {
            console.info('Firebase Messaging disponível apenas no aplicativo Cordova configurado.');
            return false;
        }
        firebaseStarted = true;
        const messaging = cordova.plugins.firebase.messaging;

        document.addEventListener('pause', function () { window.CEMAB_WAS_BACKGROUND = true; }, false);
        document.addEventListener('resume', function () {
            window.CEMAB_RESUMED_AFTER_BACKGROUND = true;
            setTimeout(function () { window.CEMAB_RESUMED_AFTER_BACKGROUND = false; window.CEMAB_WAS_BACKGROUND = false; }, 10000);
        }, false);

        messaging.onTokenRefresh(async function () {
            await obterToken();
            // Se o token mudou, a API migra os vínculos a partir do token anterior.
            if (window.CemabAuth && window.CemabAuth.isLinked()) {
                await window.CemabAuth.sincronizarVinculoServidor();
            }
        });

        messaging.onMessage(function (payload) {
            console.log('Mensagem FCM recebida com o aplicativo aberto.');
            if (window.CemabNotifications) window.CemabNotifications.handlePush(payload, { foreground: true });
        });

        if (typeof messaging.onBackgroundMessage === 'function') {
            messaging.onBackgroundMessage(function (payload) {
                console.log('Mensagem FCM recebida em segundo plano.');
                if (window.CemabNotifications) window.CemabNotifications.handlePush(payload, { background: true });
            });
        }
        return true;
    }

    window.firebaseDisponivel = firebaseDisponivel;
    window.verificarNotificacoes = verificarNotificacoes;
    window.obterToken = obterToken;
    window.iniciarFirebase = iniciarFirebase;
})();
