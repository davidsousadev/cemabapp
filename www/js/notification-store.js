// Persistência de notificações: SQLite no dispositivo Cordova e localStorage como fallback.
(function () {
    const LOCAL_KEY = 'cemab_notification_history_v1';
    const MAX_LOCAL_ITEMS = 300;
    let db = null;
    let mode = 'localStorage';
    let initPromise = null;

    function localRead() {
        try {
            const value = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
            return Array.isArray(value) ? value : [];
        } catch (_) { return []; }
    }
    function localWrite(items) {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(items.slice(0, MAX_LOCAL_ITEMS)));
    }
    function sql(sqlText, params) {
        return new Promise(function (resolve, reject) {
            if (!db) return reject(new Error('SQLite indisponível'));
            db.transaction(function (tx) {
                tx.executeSql(sqlText, params || [], function (_tx, result) { resolve(result); }, function (_tx, error) { reject(error); return false; });
            }, reject);
        });
    }
    async function init() {
        if (initPromise) return initPromise;
        initPromise = (async function () {
            // O plugin SQLite está configurado no projeto Cordova. O navegador usa fallback.
            if (window.sqlitePlugin && window.cordova && window.cordova.platformId !== 'browser') {
                try {
                    db = window.sqlitePlugin.openDatabase({ name: 'cemab_notifications.db', location: 'default' });
                    await sql('CREATE TABLE IF NOT EXISTS notificacoes (' +
                        'evento_id TEXT PRIMARY KEY, tipo TEXT NOT NULL, titulo TEXT NOT NULL, mensagem TEXT NOT NULL,' +
                        'matricula TEXT, nome_completo TEXT, data_hora TEXT, recebida_em TEXT NOT NULL,' +
                        'lida INTEGER NOT NULL DEFAULT 0, dados_json TEXT)');
                    mode = 'sqlite';
                } catch (error) {
                    console.warn('SQLite indisponível; usando armazenamento local alternativo.', error);
                    db = null;
                    mode = 'localStorage';
                }
            } else {
                mode = 'localStorage';
            }
            return mode;
        })();
        return initPromise;
    }

    function normalizar(payload) {
        const source = payload || {};
        const data = source.data && typeof source.data === 'object' ? source.data : source;
        const notification = source.notification || source.gcm && source.gcm.notification || {};
        const eventoId = data.evento_id || data.id_evento || data.id_mensagem || source.evento_id || source.message_id || source['google.message_id'];
        const id = String(eventoId || ('local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9)));
        const titulo = String(data.titulo || data.title || source.title || notification.title || 'Aviso da escola');
        const mensagem = String(data.mensagem || data.body || data.message || source.body || notification.body || 'Você recebeu uma nova notificação da escola.');
        const dataHora = String(data.data_hora || data.dataHora || data.horario || data.hora_aproximada || '');
        const dados = Object.assign({}, data);
        return {
            evento_id: id,
            tipo: String(data.tipo || 'aviso'),
            titulo: titulo,
            mensagem: mensagem,
            matricula: String(data.matricula || ''),
            nome_completo: String(data.nome_completo || data.nome_aluno || data.nome || ''),
            data_hora: dataHora,
            recebida_em: String(data.recebida_em || new Date().toISOString()),
            lida: false,
            dados: dados
        };
    }

    function rowToItem(row) {
        let data = {};
        try { data = JSON.parse(row.dados_json || '{}'); } catch (_) {}
        return {
            evento_id: row.evento_id, tipo: row.tipo, titulo: row.titulo, mensagem: row.mensagem,
            matricula: row.matricula || '', nome_completo: row.nome_completo || '', data_hora: row.data_hora || '',
            recebida_em: row.recebida_em, lida: Number(row.lida) === 1, dados: data
        };
    }

    async function save(payload) {
        await init();
        const item = normalizar(payload);
        if (mode === 'sqlite') {
            await sql('INSERT OR IGNORE INTO notificacoes (evento_id,tipo,titulo,mensagem,matricula,nome_completo,data_hora,recebida_em,lida,dados_json) VALUES (?,?,?,?,?,?,?,?,?,?)', [
                item.evento_id, item.tipo, item.titulo, item.mensagem, item.matricula, item.nome_completo,
                item.data_hora, item.recebida_em, 0, JSON.stringify(item.dados)
            ]);
            const result = await sql('SELECT * FROM notificacoes WHERE evento_id = ? LIMIT 1', [item.evento_id]);
            return result.rows.length ? rowToItem(result.rows.item(0)) : item;
        }
        const items = localRead();
        const existing = items.find(function (x) { return x.evento_id === item.evento_id; });
        if (existing) return existing;
        items.unshift(item);
        localWrite(items);
        return item;
    }

    async function list() {
        await init();
        if (mode === 'sqlite') {
            const result = await sql('SELECT * FROM notificacoes ORDER BY recebida_em DESC LIMIT ?', [MAX_LOCAL_ITEMS]);
            const items = [];
            for (let i = 0; i < result.rows.length; i++) items.push(rowToItem(result.rows.item(i)));
            return items;
        }
        return localRead().sort(function (a, b) { return String(b.recebida_em).localeCompare(String(a.recebida_em)); });
    }

    async function get(eventoId) {
        const items = await list();
        return items.find(function (item) { return item.evento_id === String(eventoId); }) || null;
    }

    async function markRead(eventoId) {
        await init();
        if (mode === 'sqlite') {
            await sql('UPDATE notificacoes SET lida = 1 WHERE evento_id = ?', [String(eventoId)]);
            return;
        }
        const items = localRead();
        const item = items.find(function (x) { return x.evento_id === String(eventoId); });
        if (item) { item.lida = true; localWrite(items); }
    }

    async function unreadCount() {
        const items = await list();
        return items.filter(function (item) { return !item.lida; }).length;
    }

    async function clear() {
        await init();
        if (mode === 'sqlite') { await sql('DELETE FROM notificacoes'); return; }
        localStorage.removeItem(LOCAL_KEY);
    }

    window.CemabNotificationStore = { init: init, save: save, list: list, get: get, markRead: markRead, unreadCount: unreadCount, clear: clear, getMode: function () { return mode; } };
})();
