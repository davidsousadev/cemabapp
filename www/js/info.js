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
        const versionLabel = byId('appVersionLabel');
        const versionNotes = byId('appVersionNotes');
        const version = (window.APP_CONFIG && APP_CONFIG.APP_VERSION) || '1.2.4';
        if (versionLabel) versionLabel.textContent = 'Versão ' + version;
    const versionNotesList = byId('versionNotesList');
    const versionModalLabel = byId('versionModalLabel');
    const appVersion = (window.APP_CONFIG && APP_CONFIG.APP_VERSION) || '1.2.4';
    if (versionModalLabel) versionModalLabel.textContent = 'Versão ' + appVersion;
    const cn = byId('creditsVersionNumber');
    if (cn) cn.textContent = appVersion;
    const versionHistory = [
        { version: '1.2.4', notes: [
            'Créditos corrigidos para Timon - MA.',
            'Ícone regenerado em alta resolução (ldpi..xxxhdpi + 512/1024).',
            'Timeout nas requisições HTTP e CSP adicionado.',
            'Suporte visual a múltiplos alunos vinculados (lista na tela inicial).',
            'Notas de versão organizadas por release.'
        ] },
        { version: '1.2.2', notes: [
            'Ajuste de créditos (Timon - MA).',
            'Melhoria da qualidade do ícone.'
        ] },
        { version: '1.2.1', notes: [
            'Alinhamento de versão em config.xml, package.json e config.js.',
            'Melhorias de segurança (.gitignore, remoção de segredos do índice).',
            'Testes automatizados (smoke) e CSP.'
        ] },
        { version: '1.2.0', notes: [
            'Persistência de notificações (SQLite/localStorage).',
            'Verificador de atualização por APK.',
            'Modal de Termos de Uso.'
        ] }
    ];
    if (versionNotesList) {
        versionNotesList.replaceChildren();
        versionHistory.forEach(function (release) {
            const heading = document.createElement('li');
            heading.className = 'version-release-heading';
            const strong = document.createElement('strong');
            strong.textContent = 'Versão ' + release.version;
            heading.appendChild(strong);
            versionNotesList.appendChild(heading);
            release.notes.forEach(function (note) {
                const li = document.createElement('li');
                li.textContent = note;
                versionNotesList.appendChild(li);
            });
        });
    }
    const openVersion = byId('openVersionModal');
    const versionModal = byId('versionModal');
    function abrirVersao() { if (versionModal) { versionModal.hidden = false; document.body.classList.add('modal-open'); } }
    function fecharVersao() { if (versionModal) { versionModal.hidden = true; document.body.classList.remove('modal-open'); } }
    if (openVersion) openVersion.addEventListener('click', abrirVersao);
    const closeV = byId('closeVersionModal');
    if (closeV) closeV.addEventListener('click', fecharVersao);
    const closeVF = byId('closeVersionFooter');
    if (closeVF) closeVF.addEventListener('click', fecharVersao);
    if (versionModal) versionModal.addEventListener('click', function (e) { if (e.target === versionModal) fecharVersao(); });


        if (versionNotes) versionNotes.textContent = 'Notas: créditos (Timon - MA), ícone em alta resolução, timeout HTTP, CSP, suporte visual a múltiplos alunos, notas por versão.';
    });
})();
