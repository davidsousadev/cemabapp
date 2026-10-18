// Navegação por telas sem framework. Bloqueia as áreas internas enquanto não há vínculo.
(function () {
    function iniciarNavegacao() {
        document.querySelectorAll('[data-page]').forEach(function (botao) {
            botao.addEventListener('click', function () { navegarPara(botao.getAttribute('data-page')); });
        });
        document.querySelectorAll('[data-go-page]').forEach(function (botao) {
            botao.addEventListener('click', function () { navegarPara(botao.getAttribute('data-go-page')); });
        });
        const linked = window.CemabAuth && window.CemabAuth.isLinked();
        navegarPara(linked ? 'inicio' : 'aluno');
    }

    function navegarPara(pagina) {
        const linked = window.CemabAuth ? window.CemabAuth.isLinked() : false;
        if (!linked && pagina !== 'aluno' && pagina !== 'creditos') pagina = 'aluno';
        document.querySelectorAll('[data-screen]').forEach(function (tela) {
            tela.classList.toggle('active', tela.getAttribute('data-screen') === pagina);
        });
        document.querySelectorAll('[data-page]').forEach(function (botao) {
            const page = botao.getAttribute('data-page');
            const ativo = page === pagina || (pagina === 'detalhe' && page === 'notificacoes');
            botao.classList.toggle('active', ativo);
            if (ativo) botao.setAttribute('aria-current', 'page');
            else botao.removeAttribute('aria-current');
        });
        const nav = document.getElementById('bottomNavigation');
        if (nav) nav.hidden = false;
        document.querySelectorAll('[data-requires-link]').forEach(function (botao) {
            botao.hidden = !linked;
        });
        window.CEMAB_CURRENT_SCREEN = pagina;
        window.scrollTo(0, 0);
    }

    window.iniciarNavegacao = iniciarNavegacao;
    window.navegarPara = navegarPara;
    document.addEventListener('DOMContentLoaded', iniciarNavegacao);
})();
