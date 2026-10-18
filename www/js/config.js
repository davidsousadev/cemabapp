// Configuração central do CEMAB. Atualize APP_VERSION ao gerar uma nova versão do APK
// e mantenha o mesmo valor em config.xml e package.json.
window.APP_CONFIG = {
    API_URL: "https://apicemab.vercel.app",
    APP_VERSION: "1.2.0",
    TOKEN_ENDPOINT: "/users/cadastrar",
    STUDENT_LINK_ENDPOINT: "/alunos/vincular",
    STUDENT_UNLINK_ENDPOINT: "/alunos/desvincular",
    STUDENT_LINKS_ENDPOINT: "/alunos/vinculo",
    NOTIFICATION_HISTORY_ENDPOINT: "/presencas/historico",
    APP_VERSION_ENDPOINT: "/admin/api/app-version",
    NOTIFICATION_HISTORY_LIMIT: 100,

    // Configure os contatos oficiais antes de distribuir o APK.
    SCHOOL_WHATSAPP: "559985098200", // Ex.: 5598999999999 (somente dígitos, com código do país)
    DEVELOPER_CONTACT_URL: "https://meulinkbio.vercel.app/davidsousadev" // Ex.: mailto:contato@exemplo.com ou URL profissional
};
