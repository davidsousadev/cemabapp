// Compara a versão NATIVE instalada com a versão publicada pela API.
// O plugin cordova-plugin-app-version fornece a versão real do pacote instalado;
// APP_CONFIG.APP_VERSION é usado como fallback nos testes em navegador.
(function () {
    let checking = null;
    let deviceReady = false;

    function cmpVersion(left, right) {
        function parts(value) {
            return String(value || '0').replace(/^v/i, '').split(/[+-]/)[0].split('.').map(function (part) {
                const match = String(part).match(/^\d+/);
                return match ? Number(match[0]) : 0;
            });
        }
        const a = parts(left), b = parts(right);
        const length = Math.max(a.length, b.length);
        for (let i = 0; i < length; i++) {
            const av = a[i] || 0, bv = b[i] || 0;
            if (av > bv) return 1;
            if (av < bv) return -1;
        }
        return 0;
    }

    async function obterVersaoInstalada() {
        try {
            const plugin = window.cordova && window.cordova.getAppVersion;
            if (plugin && typeof plugin.getVersionNumber === 'function') {
                const version = await new Promise(function (resolve, reject) {
                    let settled = false;
                    function finish(value) {
                        if (!settled) { settled = true; resolve(value); }
                    }
                    function fail(error) {
                        if (!settled) { settled = true; reject(error); }
                    }
                    const result = plugin.getVersionNumber(finish, fail);
                    if (result && typeof result.then === 'function') result.then(finish, fail);
                });
                if (version && String(version).trim()) return String(version).trim();
            }
        } catch (error) {
            console.warn('Não foi possível consultar a versão nativa; usando a versão de fallback.', error);
        }
        return String((window.APP_CONFIG && APP_CONFIG.APP_VERSION) || '1.1.0');
    }

    async function verificarVersao() {
        if (checking) return checking;
        checking = (async function () {
            const banner = document.getElementById('appUpdateBanner');
            const link = document.getElementById('appUpdateLink');
            if (!banner || !link || !window.APP_CONFIG || !window.CemabApi) return;
            try {
                const installed = await obterVersaoInstalada();
                const config = await CemabApi.request(APP_CONFIG.APP_VERSION_ENDPOINT || '/admin/api/app-version', {
                    headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' }
                });
                const available = String(config.version || '').trim();
                const url = String(config.download_url || '').trim();
                if (!available || !url || !/^https?:\/\//i.test(url) || cmpVersion(available, installed) <= 0) {
                    banner.hidden = true;
                    return;
                }
                document.getElementById('appUpdateTitle').textContent = 'Atualização disponível';
                document.getElementById('appUpdateDescription').textContent = config.release_notes || 'Baixe a nova versão para manter o aplicativo atualizado.';
                document.getElementById('appUpdateVersion').textContent = available;
                link.href = url;
                link.setAttribute('aria-label', 'Baixar a versão ' + available + ' do CEMAB App');
                banner.hidden = false;
            } catch (error) {
                // A consulta não bloqueia o aplicativo se a API estiver temporariamente indisponível.
                console.info('Consulta de atualização indisponível no momento.', error);
            }
        })().finally(function () { checking = null; });
        return checking;
    }

    document.addEventListener('DOMContentLoaded', function () {
        const dismiss = document.getElementById('appUpdateDismiss');
        if (dismiss) dismiss.addEventListener('click', function () {
            const banner = document.getElementById('appUpdateBanner');
            if (banner) banner.hidden = true;
        });
        // Em Cordova nativo, espere o plugin estar pronto antes de consultar a versão instalada.
        if (!window.cordova || window.cordova.platformId === 'browser') verificarVersao();
    });

    document.addEventListener('deviceready', function () {
        deviceReady = true;
        verificarVersao();
    }, false);
    document.addEventListener('resume', function () {
        if (deviceReady || !window.cordova || window.cordova.platformId === 'browser') verificarVersao();
    }, false);
    // Em instalações/testes em que deviceready não ocorrer, o fallback impede que o código fique bloqueado.
    window.setTimeout(function () {
        if (!deviceReady) verificarVersao();
    }, 5000);
    window.CemabAppUpdate = { check: verificarVersao };
})();
