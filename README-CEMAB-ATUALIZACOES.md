# CEMAB App — aceite de termos, créditos e atualização por APK

## Versão desta compilação

A versão de desenvolvimento definida nesta entrega é `1.1.0`. Os arquivos `config.xml`, `package.json` e `www/js/config.js` foram alinhados a esse número. O plugin `cordova-plugin-app-version` lê a versão do pacote nativo instalado; `APP_VERSION` é fallback para testes web ou se o plugin ainda não estiver disponível.

## Aviso de atualização

1. No painel administrativo (`/admin`), abra **Versão do aplicativo**.
2. Informe a versão mais nova, o link público para baixar o APK e, opcionalmente, a mensagem de atualização.
3. Salve. O app consulta a configuração ao abrir e quando volta para primeiro plano.
4. O banner só aparece quando `versão disponível > versão instalada` e existe um link `http://` ou `https://`.

Para uma futura compilação, aumente a versão no `config.xml`, `package.json` e `www/js/config.js`, gere o APK e publique o arquivo em um endereço acessível ao responsável. Depois registre essa versão e o endereço no painel. Como a Google Play não será usada, a distribuição e a hospedagem do APK ficam sob responsabilidade da escola.

**Limitação importante:** uma instalação anterior que não possui o código do banner não consegue mostrá-lo retroativamente. Os usuários dessas instalações precisam instalar manualmente esta primeira versão com o verificador; as versões subsequentes poderão avisá-los pelo banner.

## Termos de Uso — inserção manual

No arquivo `www/index.html`, localize:

```html
<div id="termsModalContent" class="terms-modal-content">
```

Substitua o conteúdo interno pelo texto oficial dos Termos de Uso/Privacidade aprovado pela escola. Há um comentário marcador no local. O link **Termos de Uso** abre o modal no formulário de vínculo e na área **Créditos**. Se os termos forem alterados depois da distribuição e você precisar exigir novo aceite dos usuários, altere a chave `cemab_terms_accepted_v1` em `www/js/aluno.js` (por exemplo, para `cemab_terms_accepted_v2`).

O formulário exige que o responsável marque **Li e aceito os Termos de Uso**. Sem a marcação, não faz a requisição de vínculo/login. O aceite confirmado é armazenado localmente, e sessões antigas que não têm esse aceite ficam bloqueadas até que o responsável passe pelo aceite.

## Créditos e contatos

Edite `www/js/config.js`:

- `SCHOOL_WHATSAPP`: WhatsApp da escola em formato internacional, somente números, por exemplo `5598999999999`;
- `DEVELOPER_CONTACT_URL`: `mailto:email@dominio.com` ou URL profissional do desenvolvedor.

Os contatos não foram inventados nem preenchidos com números fictícios; enquanto vazios, o WhatsApp aparece como pendente de disponibilização e o contato do desenvolvedor fica oculto. A tela mostra os créditos de desenvolvimento de David Sousa da Silva.

## Plugin de versão nativa

O plugin `cordova-plugin-app-version` está listado no `config.xml`, `package.json` e `package-lock.json`. Se o ambiente Cordova não tiver baixado/restaurado o plugin, execute na pasta do projeto:

```bash
cordova plugin add cordova-plugin-app-version@0.1.14
cordova prepare android
```

No app Android, o código tenta usar a versão nativa detectada pelo plugin. Em `cordova-browser`, é usado `APP_VERSION` como fallback.

## Notificações

O app conserva o recebimento de notificações FCM, o armazenamento de histórico e a navegação de detalhes. O endpoint de passagem não manda mais notificação positiva. O histórico remoto reúne somente notificações de falta e avisos administrativos.
