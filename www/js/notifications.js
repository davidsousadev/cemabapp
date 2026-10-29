// Histórico, avisos em primeiro plano e abertura dos detalhes de uma notificação.
(function () {
    let toastEventoId = null;
    let uiInitialized = false;

    function el(id) { return document.getElementById(id); }
    function safeText(value, fallback) { return value === undefined || value === null || String(value).trim() === '' ? (fallback || '') : String(value); }

    function formatarMatricula(value) {
        const original = String(value || '').trim();
        const digits = original.replace(/\D/g, '');
        if (digits.length === 8) return digits.slice(0, 2) + '.' + digits.slice(2, 5) + '.' + digits.slice(5);
        return original || 'Não informado';
    }

    function payloadData(payload) {
        if (!payload || typeof payload !== 'object') return {};
        return payload.data && typeof payload.data === 'object' ? payload.data : payload;
    }

    function formatarDataHora(value) {
        if (!value) return 'Horário não informado';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return String(value);
        return parsed.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function horaAproximada(item) {
        const dados = item.dados || {};
        if (dados.hora_aproximada) return String(dados.hora_aproximada);
        if (!item.data_hora) return 'Não informado';
        const date = new Date(item.data_hora);
        return Number.isNaN(date.getTime()) ? String(item.data_hora) : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    async function atualizarIndicadores() {
        try {
            const items = await CemabNotificationStore.list();
            const unread = items.filter(function (item) { return !item.lida; }).length;
            const badge = el('unreadBadge');
            if (badge) {
                badge.hidden = unread < 1;
                badge.textContent = unread > 99 ? '99+' : String(unread);
            }
            const label = el('notificationCountLabel');
            if (label) label.textContent = items.length ? (items.length + (items.length === 1 ? ' notificação no histórico' : ' notificações no histórico')) : 'Seu histórico';
            const summary = el('homeNotificationSummary');
            if (summary) summary.textContent = items.length ? (unread ? unread + (unread === 1 ? ' aviso não lido' : ' avisos não lidos') : 'Você está em dia com os avisos.') : 'As atualizações da escola aparecerão aqui.';
            const latestCard = el('homeLatestCard');
            if (latestCard) {
                latestCard.hidden = items.length === 0;
                if (items.length) {
                    const latest = items[0];
                    el('homeLatestTitle').textContent = latest.titulo;
                    el('homeLatestBody').textContent = latest.mensagem;
                    el('homeLatestDate').textContent = formatarDataHora(latest.recebida_em);
                    el('homeLatestButton').onclick = function () { abrirDetalhe(latest.evento_id); };
                }
            }
        } catch (error) {
            console.warn('Não foi possível atualizar os indicadores de notificações.', error);
        }
    }

    async function renderizarLista() {
        const list = el('notificationList');
        const empty = el('notificationEmptyState');
        if (!list || !empty) return;
        list.replaceChildren();
        let items = [];
        try { items = await CemabNotificationStore.list(); } catch (error) { console.warn(error); }
        empty.hidden = items.length > 0;
        list.hidden = items.length === 0;

        items.forEach(function (item) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'notification-item' + (item.lida ? '' : ' is-unread');
            button.addEventListener('click', function () { abrirDetalhe(item.evento_id); });

            const mark = document.createElement('span');
            mark.className = 'notification-item-icon';
            mark.setAttribute('aria-hidden', 'true');
            mark.textContent = item.tipo === 'falta' ? '!' : '🔔';

            const content = document.createElement('span');
            content.className = 'notification-item-copy';
            const title = document.createElement('strong');
            title.textContent = item.titulo;
            const body = document.createElement('span');
            body.textContent = item.mensagem;
            const meta = document.createElement('small');
            meta.textContent = (item.nome_completo ? item.nome_completo + ' · ' : '') + formatarDataHora(item.recebida_em);
            content.append(title, body, meta);

            const arrow = document.createElement('span');
            arrow.className = 'feature-arrow';
            arrow.textContent = '›';
            arrow.setAttribute('aria-hidden', 'true');
            button.append(mark, content, arrow);
            list.appendChild(button);
        });
        await atualizarIndicadores();
    }

    async function abrirDetalhe(eventoId) {
        const item = await CemabNotificationStore.get(eventoId);
        if (!item) return;
        await CemabNotificationStore.markRead(eventoId);
        el('detailTitle').textContent = item.titulo;
        el('detailMessage').textContent = item.mensagem;
        el('detailReceivedAt').textContent = 'Recebida em ' + formatarDataHora(item.recebida_em);
        el('detailStudentName').textContent = safeText(item.nome_completo, 'Não informado');
        el('detailEnrollment').textContent = formatarMatricula(item.matricula);
        el('detailAccessTime').textContent = (item.dados && item.dados.data_referencia) ? new Date(String(item.dados.data_referencia) + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não se aplica';
        if (typeof navegarPara === 'function') navegarPara('detalhe');
        await renderizarLista();
    }

    function mostrarToast(item) {
        const toast = el('appToast');
        if (!toast) return;
        toastEventoId = item.evento_id;
        el('toastTitle').textContent = item.titulo;
        el('toastMessage').textContent = item.mensagem;
        toast.hidden = false;
        toast.classList.remove('toast-visible');
        // Força reflow para permitir animação quando chega outro push.
        void toast.offsetWidth;
        toast.classList.add('toast-visible');
        clearTimeout(mostrarToast.timer);
        mostrarToast.timer = setTimeout(function () {
            toast.classList.remove('toast-visible');
            setTimeout(function () { toast.hidden = true; }, 220);
        }, 8000);
    }

    function abriuPorToque(payload, options) {
        const data = payloadData(payload);
        if (!payload || typeof payload !== 'object') return false;
        if (
            payload.tap === 'background' || payload.tap === 'foreground' ||
            payload.opened_from_notification === true || payload.notification_opened === true ||
            payload.wasTapped === true || payload.was_tapped === true
        ) return true;

        // cordova-plugin-firebase-messaging 8.0.1 entrega o clique via Intent
        // e encaminha os extras ao callback onBackgroundMessage. Esse payload
        // possui google.message_id/sent_time, mas não o objeto gcm criado quando
        // o evento foi recebido originalmente pelo serviço Firebase.
        const hasIntentId = !!(payload['google.message_id'] || payload['google.sent_time']);
        const isLaunchIntent = hasIntentId && !payload.gcm && data.open_notification === '1' && !!data.evento_id;
        if (isLaunchIntent) return true;

        // Fallback para plugins/versões que entregam somente os dados em cold start.
        // Não aplica a mensagens normais recebidas em foreground ou background.
        const opts = options || {};
        return !opts.background && !opts.foreground && data.open_notification === '1' &&
            Date.now() - (window.CEMAB_BOOT_AT || Date.now()) < 8000;
    }

    async function processarPush(payload, options) {
        if (!window.CemabNotificationStore) return null;
        try {
            const item = await CemabNotificationStore.save(payload);
            await renderizarLista();
            const opts = options || {};
            const isTap = opts.openedFromTap === true || abriuPorToque(payload, opts);
            if (isTap && window.CemabAuth && window.CemabAuth.isLinked()) {
                await abrirDetalhe(item.evento_id);
                if (window.cordova && cordova.plugins && cordova.plugins.firebase && cordova.plugins.firebase.messaging && cordova.plugins.firebase.messaging.clearNotifications) {
                    cordova.plugins.firebase.messaging.clearNotifications().catch(function () { });
                }
            } else if (opts.foreground === true && window.CemabAuth && window.CemabAuth.isLinked()) {
                mostrarToast(item);
            }
            return item;
        } catch (error) {
            console.error('Não foi possível salvar a notificação recebida.', error);
            return null;
        }
    }

    async function sincronizarHistorico() {
        if (!window.CemabAuth || !window.CemabAuth.isLinked() || !window.CemabApi) return;
        const token = CemabApi.getTokenLocal();
        if (!token) return;
        const note = el('notificationSyncMessage');
        if (note) note.textContent = '';
        try {
            const endpoint = APP_CONFIG.NOTIFICATION_HISTORY_ENDPOINT + '?limite=' + encodeURIComponent(APP_CONFIG.NOTIFICATION_HISTORY_LIMIT || 100);
            const data = await CemabApi.request(endpoint, { headers: { 'Accept': 'application/json', 'X-FCM-Token': token } });
            const incoming = Array.isArray(data.notificacoes) ? data.notificacoes : [];
            for (const remote of incoming) {
                await CemabNotificationStore.save({ data: Object.assign({ tipo: 'aviso' }, remote) });
            }
            await renderizarLista();
        } catch (error) {
            console.warn('Histórico remoto temporariamente indisponível; mantendo histórico local.', error);
            if (note && window.navigator && navigator.onLine) note.textContent = 'Não foi possível atualizar agora. Seu histórico salvo no dispositivo continua disponível.';
        }
    }

    async function inicializar() {
        if (uiInitialized) return;
        uiInitialized = true;
        try { await CemabNotificationStore.init(); } catch (_) { }
        await renderizarLista();
        const refresh = el('refreshNotificationsButton');
        if (refresh) refresh.addEventListener('click', async function () {
            refresh.disabled = true;
            refresh.textContent = 'Atualizando…';
            await sincronizarHistorico();
            await renderizarLista();
            refresh.disabled = false;
            refresh.textContent = 'Atualizar';
        });
        const markAll = el('markAllReadButton');
        if (markAll) markAll.addEventListener('click', async function () {
            markAll.disabled = true;
            markAll.textContent = 'Marcando…';
            try {
                const items = await CemabNotificationStore.list();
                for (const item of items) {
                    if (!item.lida) await CemabNotificationStore.markRead(item.evento_id);
                }
                await renderizarLista();
                await atualizarIndicadores();
            } finally {
                markAll.disabled = false;
                markAll.textContent = 'Marcar todas como lidas';
            }
        });
        const toastOpen = el('toastOpenButton');
        if (toastOpen) toastOpen.addEventListener('click', function () { if (toastEventoId) abrirDetalhe(toastEventoId); el('appToast').hidden = true; });
        const toastClose = el('toastCloseButton');
        if (toastClose) toastClose.addEventListener('click', function () { el('appToast').hidden = true; });
    }

    window.CemabNotifications = {
        init: inicializar,
        handlePush: processarPush,
        refresh: renderizarLista,
        syncHistory: sincronizarHistorico,
        open: abrirDetalhe,
        updateIndicators: atualizarIndicadores
    };

    document.addEventListener('DOMContentLoaded', inicializar);
})();
