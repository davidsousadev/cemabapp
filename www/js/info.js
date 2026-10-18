// Termos de Uso em modal e dados da área de créditos.
(function () {
    function byId(id) { return document.getElementById(id); }

    function abrirTermos() {
        const modal = byId('termsModal');
        if (!modal) return;
        modal.hidden = false;
        document.body.classList.add('modal-open');
        const close = byId('closeTermsModal');
        if (close) close.focus();
    }

    function fecharTermos() {
        const modal = byId('termsModal');
        if (!modal) return;
        modal.hidden = true;
        document.body.classList.remove('modal-open');
        const accept = byId('acceptTerms');
        if (accept && !accept.checked) accept.focus();
    }

    function configurarCreditos() {
        const config = window.APP_CONFIG || {};
        const phone = String(config.SCHOOL_WHATSAPP || '').replace(/\D/g, '');
        const whatsBlock = byId('schoolWhatsAppBlock');
        const whatsFallback = byId('schoolWhatsAppUnavailable');
        if (phone && phone.length >= 10) {
            byId('schoolWhatsAppLink').href = 'https://wa.me/' + phone;
            whatsBlock.hidden = false;
            whatsFallback.hidden = true;
        } else {
            whatsBlock.hidden = true;
            whatsFallback.hidden = false;
        }

        const contact = String(config.DEVELOPER_CONTACT_URL || '').trim();
        const devBlock = byId('developerContactBlock');
        const linkValido = /^(https?:\/\/|mailto:)/i.test(contact);
        if (contact && linkValido) {
            byId('developerContactLink').href = contact;
            devBlock.hidden = false;
        } else {
            devBlock.hidden = true;
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        const pairs = [
            ['openTermsFromLogin', abrirTermos],
            ['openTermsFromCredits', abrirTermos],
            ['closeTermsModal', fecharTermos],
            ['closeTermsFooter', fecharTermos]
        ];
        pairs.forEach(function (pair) {
            const node = byId(pair[0]);
            if (node) node.addEventListener('click', pair[1]);
        });
        const modal = byId('termsModal');
        if (modal) {
            modal.addEventListener('click', function (event) {
                if (event.target === modal) fecharTermos();
            });
        }
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && modal && !modal.hidden) fecharTermos();
        });
        configurarCreditos();
    });
})();
