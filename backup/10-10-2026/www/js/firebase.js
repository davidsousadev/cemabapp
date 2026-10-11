// ============================================================
// FIREBASE MESSAGING
// ============================================================

function firebaseDisponivel() {

    return (
        cordova.plugins &&
        cordova.plugins.firebase &&
        cordova.plugins.firebase.messaging
    );

}


// ============================================================
// PERMISSÃO
// ============================================================

async function verificarNotificacoes() {

    const status =
        document.getElementById('notificationStatus');

    try {

        await cordova.plugins.firebase.messaging
            .requestPermission({
                forceShow: false
            });

        status.textContent =
            '✅ Notificações ativadas';

        console.log(
            'Permissão de notificações concedida.'
        );

        return true;

    }
    catch (error) {

        status.textContent =
            '❌ Notificações não autorizadas';

        console.error(
            'Erro na permissão:',
            error
        );

        return false;
    }
}


// ============================================================
// TOKEN
// ============================================================

async function obterToken() {

    const tokenStatus =
        document.getElementById('tokenStatus');

    tokenStatus.textContent =
        '🔄 Obtendo token FCM...';

    try {

        const token =
            await cordova.plugins.firebase.messaging
                .getToken();

        if (!token) {

            tokenStatus.textContent =
                '❌ Token FCM não foi recebido.';

            console.error(
                'Firebase retornou token vazio.'
            );

            return;
        }

        console.log(
            'Token FCM recebido.'
        );

        tokenStatus.textContent =
            '✅ Token FCM obtido.';

        await enviarTokenParaAPI(token);

    }
    catch (error) {

        tokenStatus.textContent =
            '❌ Erro ao obter token FCM.';

        console.error(
            'Erro ao obter token:',
            error
        );
    }
}


// ============================================================
// EVENTOS DO FIREBASE
// ============================================================

function iniciarFirebase() {

    if (!firebaseDisponivel()) {

        const status =
            document.getElementById('notificationStatus');

        status.textContent =
            '❌ Firebase Messaging não está disponível.';

        console.error(
            'Firebase Messaging não está disponível.'
        );

        return false;
    }

    console.log(
        'Firebase Messaging disponível.'
    );


    // --------------------------------------------------------
    // TOKEN ATUALIZADO
    // --------------------------------------------------------

    cordova.plugins.firebase.messaging
        .onTokenRefresh(function () {

            console.log(
                'Token FCM atualizado.'
            );

            const tokenStatus =
                document.getElementById('tokenStatus');

            tokenStatus.textContent =
                '🔄 Token atualizado.';

            obterToken();

        });


    // --------------------------------------------------------
    // MENSAGEM EM FOREGROUND
    // --------------------------------------------------------

    cordova.plugins.firebase.messaging
        .onMessage(function (data) {

            console.log(
                'Notificação recebida:',
                data
            );

            // Futuramente:
            // 1. Salvar no SQLite
            // 2. Criar push local
            // 3. Atualizar contador
            // 4. Atualizar aba de notificações

        });


    return true;
}