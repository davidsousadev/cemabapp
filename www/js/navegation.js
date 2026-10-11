// Navegação simples, compatível com Cordova e sem framework adicional.
function iniciarNavegacao() {
    document.querySelectorAll('[data-page]').forEach(function (botao) {
        botao.addEventListener('click', function () {
            navegarPara(botao.getAttribute('data-page'));
        });
    });
    document.querySelectorAll('[data-go-page]').forEach(function (botao) {
        botao.addEventListener('click', function () {
            navegarPara(botao.getAttribute('data-go-page'));
        });
    });
    navegarPara('inicio');
}
function navegarPara(pagina) {
    document.querySelectorAll('[data-screen]').forEach(function (tela) {
        tela.classList.toggle('active', tela.getAttribute('data-screen') === pagina);
    });
    document.querySelectorAll('[data-page]').forEach(function (botao) {
        var ativo = botao.getAttribute('data-page') === pagina;
        botao.classList.toggle('active', ativo);
        if (ativo) botao.setAttribute('aria-current', 'page');
        else botao.removeAttribute('aria-current');
    });
}
document.addEventListener('DOMContentLoaded', iniciarNavegacao);
