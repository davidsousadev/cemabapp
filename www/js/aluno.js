// Gerencia o vínculo local do aluno. Só salva após confirmação da API.
(function () {
    const STORAGE_KEY = 'cemab_aluno_vinculado';

    function byId(id) { return document.getElementById(id); }
    function mensagem(texto, tipo) {
        const el = byId('studentFormMessage');
        el.textContent = texto || '';
        el.className = 'form-message' + (tipo ? ' ' + tipo : '');
    }
    function lerVinculo() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const value = JSON.parse(raw);
            return value && value.matricula && value.nome_completo ? value : null;
        } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
    }
    function renderizarVinculo() {
        const aluno = lerVinculo();
        byId('studentFormPanel').hidden = !!aluno;
        byId('studentLinkedPanel').hidden = !aluno;
        byId('studentPageTitle').textContent = aluno ? 'Aluno vinculado' : 'Vincular aluno';
        byId('studentPageDescription').textContent = aluno
            ? 'Confira o aluno associado a este dispositivo.'
            : 'Informe os dados conforme o cadastro da escola para associar o aluno a este dispositivo.';
        if (aluno) {
            byId('linkedStudentName').textContent = aluno.nome_completo;
            byId('linkedStudentEnrollment').textContent = aluno.matricula;
        }
    }
    function normalizarResposta(data, matricula, nome) {
        // Aceita retorno {aluno:{...}} ou diretamente {matricula,nome_completo}.
        const a = data && data.aluno ? data.aluno : data;
        return {
            matricula: String((a && (a.matricula || a.registration)) || matricula).trim(),
            nome_completo: String((a && (a.nome_completo || a.nome || a.nome_aluno || a.full_name)) || nome).trim(),
            vinculado_em: new Date().toISOString()
        };
    }
    async function vincular(event) {
        event.preventDefault();
        const matricula = byId('studentEnrollment').value.trim();
        const nome = byId('studentFullName').value.trim().replace(/\s+/g, ' ');
        const button = byId('studentSubmitButton');

        if (!matricula || !nome) {
            mensagem('Preencha a matrícula e o nome completo.', 'error');
            return;
        }
        if (nome.split(' ').filter(Boolean).length < 2) {
            mensagem('Informe o nome completo do aluno.', 'error');
            return;
        }
        if (!APP_CONFIG.API_URL || !APP_CONFIG.STUDENT_LINK_ENDPOINT) {
            mensagem('A configuração do endpoint de validação ainda não foi definida.', 'error');
            return;
        }

        button.disabled = true;
        button.textContent = 'Verificando dados...';
        mensagem('Consultando o cadastro escolar. Aguarde.');

        try {
            const response = await fetch(APP_CONFIG.API_URL + APP_CONFIG.STUDENT_LINK_ENDPOINT, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ matricula: matricula, nome_completo: nome })
            });
            let data = {};
            try { data = await response.json(); } catch (_) {}
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Não foi possível confirmar os dados informados. Verifique a matrícula e o nome completo com a escola.');
                }
                throw new Error(data.detail || data.mensagem || 'Não foi possível validar os dados informados.');
            }
            if (data.valido === false || data.success === false || data.valid === false) {
                throw new Error(data.detail || data.mensagem || 'Matrícula e nome não correspondem a um aluno cadastrado.');
            }
            const aluno = normalizarResposta(data, matricula, nome);
            if (!aluno.matricula || !aluno.nome_completo) throw new Error('A API não retornou dados suficientes para confirmar o vínculo.');
            localStorage.setItem(STORAGE_KEY, JSON.stringify(aluno));
            byId('studentLinkForm').reset();
            renderizarVinculo();
            byId('unlinkMessage').textContent = '';
        } catch (error) {
            mensagem(error.message || 'Falha de comunicação. Verifique sua conexão e tente novamente.', 'error');
            console.error('Falha ao vincular aluno:', error);
        } finally {
            button.disabled = false;
            button.innerHTML = 'Verificar e vincular <span>→</span>';
        }
    }
    function desvincular() {
        const confirmar = window.confirm('Deseja remover deste celular os dados do aluno vinculado?');
        if (!confirmar) return;
        localStorage.removeItem(STORAGE_KEY);
        renderizarVinculo();
        mensagem('Vínculo removido deste dispositivo.', 'success');
        byId('studentEnrollment').focus();
    }
    document.addEventListener('DOMContentLoaded', function () {
        byId('studentLinkForm').addEventListener('submit', vincular);
        byId('unlinkStudentButton').addEventListener('click', desvincular);
        renderizarVinculo();
    });
})();
