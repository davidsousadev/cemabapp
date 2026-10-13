// Comunicação HTTP com a API. Não contém elementos visuais nem regras de navegação.
(function () {
    const TOKEN_STORAGE_KEY = 'cemab_fcm_token';

    async function request(path, options) {
        const response = await fetch(APP_CONFIG.API_URL + path, Object.assign({
            headers: { 'Accept': 'application/json' }
        }, options || {}));
        let data = {};
        try { data = await response.json(); } catch (_) { /* algumas rotas podem não retornar JSON */ }
        if (!response.ok) {
            const detail = data.detail || data.message || data.mensagem || ('Erro HTTP ' + response.status);
            const error = new Error(detail);
            error.status = response.status;
            error.data = data;
            throw error;
        }
        return data;
    }

    async function postJson(path, payload) {
        return request(path, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    }

    async function enviarTokenParaAPI(token, tokenAnterior) {
        const payload = { token: token };
        if (tokenAnterior && tokenAnterior !== token) payload.token_anterior = tokenAnterior;
        const data = await postJson(APP_CONFIG.TOKEN_ENDPOINT, payload);
        // Só atualiza o token local quando o servidor confirma o cadastro/atualização.
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        return data;
    }

    window.CemabApi = {
        request: request,
        postJson: postJson,
        enviarTokenParaAPI: enviarTokenParaAPI,
        getTokenLocal: function () { return localStorage.getItem(TOKEN_STORAGE_KEY) || ''; },
        getTokenStorageKey: function () { return TOKEN_STORAGE_KEY; }
    };

    // Compatibilidade com código anterior que chamava a função global.
    window.enviarTokenParaAPI = enviarTokenParaAPI;
})();
