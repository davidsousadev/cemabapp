// ============================================================
// NAVEGAÇÃO
// ============================================================
function iniciarNavegacao() {
    console.log("🔄 Iniciando navegação...");

    const botoes = document.querySelectorAll('[data-page]');
    const telas = document.querySelectorAll('[data-screen]');

    console.log("Botões encontrados:", botoes.length);
    console.log("Telas encontradas:", telas.length);

    // Se não achou nada, avisa
    if (botoes.length === 0 || telas.length === 0) {
        console.warn("⚠️ Faltam atributos data-page ou data-screen no HTML!");
        return;
    }

    // Adiciona clique em CADA botão
    botoes.forEach(function (botao) {
        botao.addEventListener('click', function () {
            const pagina = botao.getAttribute('data-page');
            console.log("🖱️ Clicou em:", pagina);
            navegarPara(pagina);
        });
    });

    // ✅ Tela INICIAL — carrega a primeira tela ao abrir
    navegarPara('inicio');
}

// ============================================================
// NAVEGAR PARA UMA PÁGINA
// ============================================================
function navegarPara(pagina) {
    console.log("➡️ Navegar para:", pagina);

    const telas = document.querySelectorAll('[data-screen]');
    const botoes = document.querySelectorAll('[data-page]');

    // Alternar telas
    telas.forEach(function (tela) {
        tela.classList.toggle('active', tela.getAttribute('data-screen') === pagina);
    });

    // Alternar botões ativos
    botoes.forEach(function (botao) {
        botao.classList.toggle('active', botao.getAttribute('data-page') === pagina);
    });
}