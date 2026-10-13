// Ponto de entrada do CEMAB. Serviços técnicos funcionam em segundo plano.
(function () {
    let corePromise = null;
    let devicePromise = null;
    window.CEMAB_BOOT_AT = Date.now();

    function inicializarNucleo() {
        if (!corePromise) {
            corePromise = (async function () {
                try { await CemabNotificationStore.init(); } catch (error) { console.warn('Armazenamento local não inicializado.', error); }
                if (window.CemabNotifications) await CemabNotifications.init();
                if (window.CemabAuth && CemabAuth.processPendingUnlinks) {
                    try { await CemabAuth.processPendingUnlinks(window.CemabApi ? CemabApi.getTokenLocal() : ''); }
                    catch (error) { console.warn('A fila de desvinculação será sincronizada depois.', error); }
                }
                if (window.CemabAuth && CemabAuth.isLinked()) {
                    await CemabNotifications.syncHistory();
                    await CemabNotifications.refresh();
                }
            })();
        }
        return corePromise;
    }

    function inicializarDispositivo() {
        if (!devicePromise) {
            devicePromise = (async function () {
                await inicializarNucleo();
                if (!window.cordova || typeof iniciarFirebase !== 'function') return;
                iniciarFirebase();
                const permitido = await verificarNotificacoes();
                if (!permitido) {
                    console.info('Notificações não autorizadas neste momento; a interface continua disponível.');
                    return;
                }
                const token = await obterToken();
                if (window.CemabAuth && CemabAuth.processPendingUnlinks) {
                    try { await CemabAuth.processPendingUnlinks(token || (window.CemabApi ? CemabApi.getTokenLocal() : '')); }
                    catch (error) { console.warn('A fila de desvinculação será sincronizada depois.', error); }
                }
                if (token && window.CemabAuth && CemabAuth.isLinked()) {
                    await CemabAuth.sincronizarVinculoServidor();
                    await CemabNotifications.syncHistory();
                    await CemabNotifications.refresh();
                }
            })();
        }
        return devicePromise;
    }

    document.addEventListener('DOMContentLoaded', function () { inicializarNucleo(); });
    document.addEventListener('deviceready', function () { inicializarDispositivo(); }, false);
    document.addEventListener('resume', async function () {
        if (window.CemabAuth && CemabAuth.processPendingUnlinks) {
            try { await CemabAuth.processPendingUnlinks(window.CemabApi ? CemabApi.getTokenLocal() : ''); }
            catch (error) { console.warn('A fila de desvinculação será sincronizada depois.', error); }
        }
        if (window.CemabAuth && CemabAuth.isLinked() && window.CemabNotifications) {
            await CemabNotifications.syncHistory();
            await CemabNotifications.refresh();
        }
    }, false);
    document.addEventListener('online', async function () {
        if (window.CemabAuth && CemabAuth.processPendingUnlinks) {
            try { await CemabAuth.processPendingUnlinks(window.CemabApi ? CemabApi.getTokenLocal() : ''); }
            catch (error) { console.warn('A fila de desvinculação será sincronizada depois.', error); }
        }
    }, false);
})();
