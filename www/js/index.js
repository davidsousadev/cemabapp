// ============================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ============================================================

document.addEventListener(
    'deviceready',
    onDeviceReady,
    false
);


// ============================================================
// APLICAÇÃO PRONTA
// ============================================================

async function onDeviceReady() {

    console.log(
        'Running cordova-' +
        cordova.platformId +
        '@' +
        cordova.version
    );


    // --------------------------------------------------------
    // FIREBASE
    // --------------------------------------------------------

    const firebaseOk =
        iniciarFirebase();

    if (!firebaseOk) {
        return;
    }


    // --------------------------------------------------------
    // PERMISSÃO
    // --------------------------------------------------------

    const permitido =
        await verificarNotificacoes();

    if (!permitido) {

        document.getElementById(
            'tokenStatus'
        ).textContent =
            '⚠️ Ative as notificações para continuar.';

        return;
    }


    // --------------------------------------------------------
    // TOKEN
    // --------------------------------------------------------

    await obterToken();

}