// Estado de acesso e vínculo aluno-dispositivo.
(function () {
    const STORAGE_KEY = 'cemab_aluno_vinculado';
    const TOKEN_KEY = 'cemab_fcm_token';
    const PENDING_UNLINK_KEY = 'cemab_desvinculos_pendentes_v1';
    let pendingUnlinkPromise = null;

    function byId(id) { return document.getElementById(id); }
    function mostrarMensagem(id, texto, tipo) {
        const node = byId(id);
        if (!node) return;
        node.textContent = texto || '';
        node.className = 'form-message' + (tipo ? ' ' + tipo : '');
    }
    function lerVinculo() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const value = JSON.parse(raw);
            return value && value.matricula && value.nome_completo ? value : null;
        } catch (_) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
    }

    function normalizarMatriculaLocal(value) {
        return String(value || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    }

    function lerDesvinculosPendentes() {
        try {
            const items = JSON.parse(localStorage.getItem(PENDING_UNLINK_KEY) || '[]');
            return Array.isArray(items) ? items : [];
        } catch (_) { return []; }
    }

    function salvarDesvinculosPendentes(items) {
        if (items.length) localStorage.setItem(PENDING_UNLINK_KEY, JSON.stringify(items));
        else localStorage.removeItem(PENDING_UNLINK_KEY);
    }

    function registrarDesvinculoPendente(aluno, token) {
        const matricula = String(aluno && aluno.matricula || '');
        if (!matricula) return;
        const items = lerDesvinculosPendentes();
        const chave = normalizarMatriculaLocal(matricula);
        const existente = items.find(function (item) {
            return normalizarMatriculaLocal(item.matricula) === chave;
        });
        const pendencia = { matricula: matricula, token: String(token || ''), criado_em: new Date().toISOString() };
        if (existente) Object.assign(existente, pendencia);
        else items.push(pendencia);
        salvarDesvinculosPendentes(items);
    }

    function removerDesvinculoPendenteDaMatricula(matricula) {
        const chave = normalizarMatriculaLocal(matricula);
        salvarDesvinculosPendentes(lerDesvinculosPendentes().filter(function (item) {
            return normalizarMatriculaLocal(item.matricula) !== chave;
        }));
    }

    async function processarDesvinculosPendentes(tokenAtual) {
        if (pendingUnlinkPromise) return pendingUnlinkPromise;
        pendingUnlinkPromise = (async function () {
            if (!window.CemabApi || !APP_CONFIG.STUDENT_UNLINK_ENDPOINT) return false;
            const pendencias = lerDesvinculosPendentes();
            if (!pendencias.length) return true;
            const tokenVigente = tokenAtual || localStorage.getItem(TOKEN_KEY) || '';
            const restantes = [];
            for (const pendencia of pendencias) {
                const tokens = Array.from(new Set([pendencia.token, tokenVigente].filter(Boolean)));
                if (!tokens.length) {
                    restantes.push(pendencia);
                    continue;
                }
                let removido = true;
                for (const token of tokens) {
                    try {
                        await CemabApi.postJson(APP_CONFIG.STUDENT_UNLINK_ENDPOINT, {
                            matricula: pendencia.matricula,
                            token: token
                        });
                    } catch (error) {
                        removido = false;
                        console.warn('O encerramento de um vínculo pendente será tentado novamente.', error);
                    }
                }
                if (!removido) restantes.push(pendencia);
            }
            salvarDesvinculosPendentes(restantes);
            return restantes.length === 0;
        })().finally(function () { pendingUnlinkPromise = null; });
        return pendingUnlinkPromise;
    }
    function formatarMatricula(value) {
        const text = String(value || '').trim();
        const digits = text.replace(/\D/g, '');
        if (digits.length === 8) return digits.slice(0, 2) + '.' + digits.slice(2, 5) + '.' + digits.slice(5);
        return text || digits;
    }
    function renderizarVinculo() {
        const aluno = lerVinculo();
        if (byId('studentFormPanel')) byId('studentFormPanel').hidden = !!aluno;
        if (byId('studentLinkedPanel')) byId('studentLinkedPanel').hidden = !aluno;
        if (byId('studentHelpNote')) byId('studentHelpNote').hidden = !!aluno;
        if (byId('studentPageTitle')) byId('studentPageTitle').textContent = aluno ? 'Aluno vinculado' : 'Acesse sua área';
        if (byId('studentPageDescription')) byId('studentPageDescription').textContent = aluno
            ? 'Confira o aluno associado a este dispositivo ou encerre o vínculo abaixo.'
            : 'Para proteger as informações escolares, confirme os dados do aluno para continuar.';
        if (aluno) {
            byId('linkedStudentName').textContent = aluno.nome_completo;
            byId('linkedStudentEnrollment').textContent = formatarMatricula(aluno.matricula);
            const firstName = String(aluno.nome_completo).trim().split(/\s+/)[0];
            if (byId('homeGreeting')) byId('homeGreeting').textContent = 'Olá, família de ' + firstName + '!';
            if (byId('homeDescription')) byId('homeDescription').textContent = 'Acompanhe por aqui as notificações escolares de ' + aluno.nome_completo + '.';
            if (byId('homeStudentSummary')) byId('homeStudentSummary').textContent = aluno.nome_completo + ' · Matrícula ' + formatarMatricula(aluno.matricula);
        } else {
            if (byId('homeGreeting')) byId('homeGreeting').textContent = 'Bem-vindo ao CEMAB.';
            if (byId('homeDescription')) byId('homeDescription').textContent = 'Acompanhe os avisos da escola e receba informações sobre a presença do aluno.';
        }
        const nav = byId('bottomNavigation');
        if (nav) nav.hidden = !aluno;
        return aluno;
    }

    function aplicarEstadoAcesso(destino) {
        const aluno = renderizarVinculo();
        if (typeof navegarPara === 'function') navegarPara(aluno ? (destino || 'inicio') : 'aluno');
    }

    async function sincronizarVinculoServidor() {
        const aluno = lerVinculo();
        const token = localStorage.getItem(TOKEN_KEY) || '';
        if (!aluno || !token || !window.CemabApi) return false;
        try {
            await CemabApi.postJson(APP_CONFIG.STUDENT_LINK_ENDPOINT, {
                matricula: aluno.matricula,
                nome_completo: aluno.nome_completo,
                token: token
            });
            return true;
        } catch (error) {
            // Não expõe erro técnico à família nem apaga a sessão local por falha temporária.
            console.warn('Não foi possível reconciliar o vínculo com o servidor agora.', error);
            return false;
        }
    }

    async function vincular(event) {
        event.preventDefault();
        const matricula = byId('studentEnrollment').value.trim();
        const nome = byId('studentFullName').value.trim().replace(/\s+/g, ' ');
        const button = byId('studentSubmitButton');
        const token = localStorage.getItem(TOKEN_KEY) || '';

        if (!matricula || !nome) {
            mostrarMensagem('studentFormMessage', 'Preencha a matrícula e o nome completo.', 'error');
            return;
        }
        if (nome.split(' ').filter(Boolean).length < 2) {
            mostrarMensagem('studentFormMessage', 'Informe o nome completo do aluno.', 'error');
            return;
        }
        if (!token) {
            mostrarMensagem('studentFormMessage', 'Para vincular e receber notificações, abra o CEMAB no celular com as notificações habilitadas.', 'error');
            return;
        }
        if (!window.CemabApi || !APP_CONFIG.STUDENT_LINK_ENDPOINT) {
            mostrarMensagem('studentFormMessage', 'Não foi possível iniciar a validação. Tente novamente mais tarde.', 'error');
            return;
        }

        button.disabled = true;
        button.textContent = 'Conferindo dados…';
        mostrarMensagem('studentFormMessage', 'Validando os dados com a escola. Aguarde.');
        try {
            const data = await CemabApi.postJson(APP_CONFIG.STUDENT_LINK_ENDPOINT, {
                matricula: matricula,
                nome_completo: nome,
                token: token
            });
            if (!data || data.success !== true || data.vinculo_ativo !== true || !data.aluno) {
                throw new Error('A escola não confirmou o vínculo. Confira os dados e tente novamente.');
            }
            const aluno = {
                id: data.aluno.id,
                matricula: String(data.aluno.matricula || matricula).trim(),
                nome_completo: String(data.aluno.nome_completo || nome).trim(),
                vinculado_em: new Date().toISOString()
            };
            removerDesvinculoPendenteDaMatricula(aluno.matricula);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(aluno));
            byId('studentLinkForm').reset();
            mostrarMensagem('studentFormMessage', '', '');
            mostrarMensagem('unlinkMessage', '', '');
            aplicarEstadoAcesso('inicio');
            if (window.CemabNotifications) {
                await CemabNotifications.syncHistory();
                await CemabNotifications.refresh();
            }
        } catch (error) {
            const mensagem = error.status === 404
                ? 'Não foi possível localizar um aluno com esses dados. Confira a matrícula e o nome com a secretaria.'
                : (error.status === 409 ? 'O dispositivo ainda não está pronto para receber notificações. Feche e abra o aplicativo e tente novamente.' : (error.message || 'Não foi possível validar agora. Tente novamente.'));
            mostrarMensagem('studentFormMessage', mensagem, 'error');
            console.error('Falha ao vincular aluno:', error);
        } finally {
            button.disabled = false;
            button.innerHTML = 'Confirmar e continuar <span>→</span>';
        }
    }

    async function desvincular() {
        const aluno = lerVinculo();
        if (!aluno) return;
        const confirmar = window.confirm('Deseja sair e remover o vínculo deste aluno deste dispositivo? O histórico local de notificações também será apagado.');
        if (!confirmar) return;
        const token = localStorage.getItem(TOKEN_KEY) || '';
        const button = byId('unlinkStudentButton');
        button.disabled = true;
        button.textContent = 'Encerrando vínculo…';
        let removidoNoServidor = false;
        try {
            if (token && window.CemabApi) {
                try {
                    await CemabApi.postJson(APP_CONFIG.STUDENT_UNLINK_ENDPOINT, { matricula: aluno.matricula, token: token });
                    removidoNoServidor = true;
                } catch (error) {
                    // O usuário deve conseguir sair mesmo offline. A remoção remota fica em fila.
                    registrarDesvinculoPendente(aluno, token);
                    console.warn('Desvinculação será sincronizada quando houver conexão.', error);
                }
            } else {
                registrarDesvinculoPendente(aluno, token);
            }

            localStorage.removeItem(STORAGE_KEY);
            if (window.CemabNotificationStore && window.CemabNotificationStore.clear) {
                try { await CemabNotificationStore.clear(); }
                catch (clearError) { console.warn('Não foi possível limpar o histórico local neste momento.', clearError); }
            }
            aplicarEstadoAcesso('aluno');
            mostrarMensagem('studentFormMessage', removidoNoServidor
                ? 'Você saiu e o vínculo foi removido deste dispositivo.'
                : 'Você saiu deste dispositivo. A remoção no servidor será sincronizada quando houver conexão.', 'success');
        } catch (error) {
            // Falhas de armazenamento são registradas; mantém a interface utilizável.
            console.error('Falha ao concluir o encerramento local do vínculo:', error);
            mostrarMensagem('unlinkMessage', 'Você saiu, mas alguns dados locais não puderam ser limpos.', 'error');
        } finally {
            button.disabled = false;
            button.textContent = 'Sair e desvincular aluno';
        }
    }

    function inicializar() {
        byId('studentLinkForm').addEventListener('submit', vincular);
        byId('unlinkStudentButton').addEventListener('click', desvincular);
        const aluno = renderizarVinculo();
        aplicarEstadoAcesso(aluno ? 'inicio' : 'aluno');
    }

    window.CemabAuth = {
        isLinked: function () { return !!lerVinculo(); },
        getStudent: lerVinculo,
        applyState: aplicarEstadoAcesso,
        sync: sincronizarVinculoServidor,
        sincronizarVinculoServidor: sincronizarVinculoServidor,
        unlink: desvincular,
        processPendingUnlinks: processarDesvinculosPendentes
    };

    document.addEventListener('DOMContentLoaded', inicializar);
})();
