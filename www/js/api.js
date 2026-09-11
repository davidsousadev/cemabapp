async function enviarTokenParaAPI(token) {

    const serverStatus =
        document.getElementById('serverStatus');

    serverStatus.textContent =
        '🔄 Cadastrando dispositivo...';

    console.log(
        'Enviando token para:',
        APP_CONFIG.API_URL + APP_CONFIG.TOKEN_ENDPOINT
    );

    try {

        const response = await fetch(
            APP_CONFIG.API_URL + APP_CONFIG.TOKEN_ENDPOINT,
            {
                method: 'POST',

                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    token: token
                })
            }
        );

        let data = {};

        try {
            data = await response.json();
        }
        catch (error) {
            console.error(
                'Erro ao interpretar resposta:',
                error
            );
        }

        console.log(
            'Resposta da API:',
            response.status,
            data
        );

        if (
            response.status !== 201 &&
            response.status !== 200
        ) {
            throw new Error(
                data.detail ||
                'Erro HTTP ' + response.status
            );
        }

        if (
            data.detail === 'Token Já cadastrado'
        ) {

            serverStatus.textContent =
                '✅ Dispositivo já cadastrado.';

        }
        else {

            serverStatus.textContent =
                '✅ Dispositivo cadastrado com sucesso.';

        }

        return data;

    }
    catch (error) {

        serverStatus.textContent =
            '❌ Erro ao cadastrar dispositivo.';

        console.error(
            'Erro ao enviar token para API:',
            error
        );

        throw error;
    }
}