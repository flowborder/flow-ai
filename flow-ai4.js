
window.$crisp = [];
window.CRISP_WEBSITE_ID = "363388d0-4671-4c6e-b170-e680e2eaa9c3";
window.CRISP_RUNTIME_CONFIG = {
  lock_maximized: false,  // permite maximizar e depois voltar
  lock_full_view: false,   // permite abrir e fechar o overlay
  cross_origin_cookies: true,
  session_merge: false
};

//************************************************
// CAPTURA O COOKIE ARMAZENADO NO BROWSER
//************************************************

function getFrontCookie() {

  function parseCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  const userState = parseCookie('__user_state_cookie__');
  const systemEnv = parseCookie('__system_environment__');

  let combinedCookies = '';

  if (userState) {
    combinedCookies += `__user_state_cookie__=${userState}`;
  }
  if (systemEnv) {
    if (combinedCookies) combinedCookies += '; ';
    combinedCookies += `__system_environment__=${systemEnv}`;
  }

  console.log("combinedCookies=" + combinedCookies)
  return combinedCookies
}

//************************************************
//  DESCOBRIR ENTERPRISE_CODE e EMAIL com Fetch na página de SETTINGS
//
//  [⚠️ NÃO USADO MAIS] -> Substituido por MetaTags vindas do Layout padrão
//************************************************

async function fetchAndExtractUserData(cookie) {
  const url = 'https://app.flowborder.com/CustomSetting/Index';

  // ⚠️ Adicione os cookies manualmente aqui (copiados do navegador ou do document.cookie)
  //const cookie = getFrontCookie(); // ou substitua por um string literal, se necessário

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'text/html',
      'Accept-Language': 'pt-BR,pt;q=0.9',
      'Cookie': cookie, // <- usa os cookies manuais aqui
    },
    credentials: 'include', // garante envio automático de cookies do navegador (se permitido)
  });

  if (!resp.ok) {
    console.error('Erro ao fazer fetch:', resp.status);
    return;
  }

  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const firstName = doc.querySelector('#firstName')?.value.trim() || '';
  const lastName = doc.querySelector('#lastName')?.value.trim() || '';
  const fullName = `${firstName} ${lastName}`.trim();

  // Captura os inputs desabilitados da última seção (ID e email login)
  const disabledInputs = Array.from(
    doc.querySelectorAll('#divBasic .col-sm-4 input[disabled]')
  );
  const userId = disabledInputs[0]?.value.trim() || '';
  const userEmail = disabledInputs[1]?.value.trim() || '';

  const objReturn = {
    userId,
    fullName,
    userEmail
  }

  console.log(objReturn);

  return objReturn

  // Se quiser continuar seu código aqui com base nesses dados:
  // ex: iniciar Crisp, popular campos etc.
}

//************************************************
//  LÊ AS METATAGS E MONTA UM JSON
//************************************************

function extractUserDataFromMeta() {
  const getMetaValue = (name) =>
    document.querySelector(`meta[name="${name}"]`)?.getAttribute('value') || '';

  const userId = getMetaValue('FLOW_EnterpriseCode');
  const userEmail = getMetaValue('FLOW_UserEmail');
  const fullName = getMetaValue('FLOW_UserName');
  const stripeSubscriptionId = getMetaValue('FLOW_SubscriptionId');
  const catalogId = getMetaValue('FLOW_CatalogId');
  const flowToken = getMetaValue('FLOW_Token');

  // Novo: extrair e validar FLOW_Remarks
  let remarksRaw = getMetaValue('FLOW_Remarks');
  let remarks = {};
  try {
    if (remarksRaw.trim()) {
      remarks = JSON.parse(remarksRaw);
    }
  } catch (e) {
    console.warn("❌ Erro ao parsear FLOW_Remarks:", e);
    remarks = {};
  }

  const objReturn = {
    userId,
    fullName,
    userEmail,
    stripeSubscriptionId,
    catalogId,
    flowToken,
    remarks
  };

  console.log(objReturn);
  return objReturn;
}

//************************************************
//  CARREGAR CRISP
//************************************************

const CRISP_allowedUsers = ["U022764", "U022933", "U022992", "U000001", "U023094"]

async function loadCrisp() {
  console.log("[Flow] Starting CRISP.");

  let frontCookie = getFrontCookie()
  let userDataForCrisp = ""
  //if (frontCookie !== "") {
    userDataForCrisp = extractUserDataFromMeta();
    window.CRISP_TOKEN_ID = userDataForCrisp.userId;  // o UUID gerado no backend
    
  //}
  console.log(userDataForCrisp);

  (function () {
    var d = document;
    var s = d.createElement("script");
    s.src = "https://client.crisp.chat/l.js";
    s.async = 1;
    d.getElementsByTagName("head")[0].appendChild(s);
  })();

  $crisp.push(["on", "session:loaded", function (session_id) {

    $crisp.push(["set", "user:email", userDataForCrisp.userEmail]);
    $crisp.push(["set", "user:nickname", userDataForCrisp.fullName + " (" + userDataForCrisp.userId + ")"]);
    $crisp.push(["set", "session:data", ["user_id", userDataForCrisp.userId]]);

    console.log("Crisp Loaded");

     observeCrispMessages()

     // Chamada da função
    alterarEstiloDoCrisp();

    // PERSISTE A SESSÃO COM BASE NO USER ID DA SUMOOL
    // if (frontCookie !== "") {

    //   console.log("trying to push user_id to Crisp Session");
    //   $crisp.push(["set", "session:data", ["user_id", userDataForCrisp.userId]]);
    //   console.log("pushed " + userDataForCrisp.userId + "successful");


    //   //guicortei@gmail.com -> U022764
    //   //maluco@maluco.com -> U022933
    //   //flowborder@flowborder.com -> U022992
    //   //ccc@qq.com -> U000001 (login dos devs china)
      
    //   // if (!CRISP_allowedUsers.includes(userDataForCrisp.userId)) {
    //   //   console.log("Hidding Crisp, type crisp() to show Crisp");
    //   //   $crisp.push(["do", "chat:hide"]);
    //   // } else {
    //   //   HideShowDivPixInter("show")
    //   // }

    //   // ENVIA O COOKIE PARA O MAKE
    //   const payload = {
    //     user_id_sumool: userDataForCrisp.userId || "",
    //     session_id: session_id || "",
    //     cookie: frontCookie || "",
    //     user_name_sumool:  userDataForCrisp.fullName || ""
    //   };
    //   console.log(payload)

    //   fetch("https://hook.us2.make.com/2cqv7guv1oq8353nipfwtrvrfkwtzbjy", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify(payload)
    //   })
    //     .then(response => console.log("Webhook Cookie enviado com sucesso"))
    //     .catch(error => console.error("Erro ao enviar para o Webhook Cookie:", error));

    // }

  }]);

  

}

//************************************************
//  FUNÇÃO PARA RODAR NO CONSOLE E MOSTRAR O CHAT PARA QUALQUER USUÁRIO
//************************************************

function crisp() {
  $crisp.push(["do", "chat:show"]);
}

//************************************************
// Menu ABOUT US
//************************************************

function addAboutUsMenu() {
  const sidebarMenu = document.getElementById('sidebar-menu');
    
  // Verifique se a div existe
  if (sidebarMenu) {
      // Encontre o primeiro ul dentro da sidebar-menu
      const ulElement = sidebarMenu.querySelector('ul');
      
      // Verifique se o ul existe
      if (ulElement) {
          // Crie o novo elemento li
          const newLi = document.createElement('li');
          
          // Defina o conteúdo HTML do novo li
          newLi.innerHTML = `
              <a href="https://app.flowborder.com/ClientContent/custom-html/about_us.html" target="_blank" class="">
                  <i class="bi bi-check"></i><span>About Us</span>
              </a>
              <img src="/ClientContent/images/useepay_cards.jpeg" style="width: 100%">
          `;
          
          // Adicione o novo li ao final da lista
          ulElement.appendChild(newLi);
      }
  }
}

//************************************************
// target parent para links da flow no Chat, e ocultar balão [LOGIN] nas mensagens com link no Chat
//************************************************

function processCrispLinks() {
    const operatorMessages = document.querySelectorAll('div[data-from="operator"]');

    operatorMessages.forEach(operatorMessage => {
        const links = operatorMessage.querySelectorAll('a');

        links.forEach(link => {
            // Regra 1: Link que contém "app.flowborder.com"
            if (link.href.includes('//app.flowborder.com')) {
                link.target = '_self';
            }

            // Regra 2: Link com texto "Login"
            if (link.textContent.trim() === 'Login') {
                link.style.setProperty('display', 'none', 'important');
            }
        });
    });
}

function observeCrispMessages() { //<----- CHAMAR ESSA FUNÇÃO PARA CARREGAR O MANIPULADOR DE LINKS DO CHAT
    const crispChat = document.querySelector('.crisp-client');

    if (!crispChat) {
        console.warn('Crisp chat não encontrado. Tentando novamente em 500ms...');
        setTimeout(observeCrispMessages, 500);
        return;
    }

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                processCrispLinks();
            }
        });
    });

    observer.observe(crispChat, {
        childList: true,
        subtree: true
    });

    console.log('Observador do Crisp iniciado!');
} 

//************************************************
// OCULTAR/MOSTRAR BOTAO DA USEEPAY
//************************************************

function HideShowDivPixInter(acao) {
  console.log("[Useepay] Initialization: " +acao);
  try {
    //const targetSrc = "/ClientContent/images/Billing/useepay.png";
    const targetSrc = "/ClientContent/images/Billing/interPix.png";
    const images = document.querySelectorAll(`img[src="${targetSrc}"]`);

    images.forEach(img => {
      const div = img.closest("div");
      if (div) {
        if (acao === "hide") {
          div.style.display = "none";
        } else if (acao === "show") {
          div.style.display = "";
        } else {
          console.warn("Ação inválida! Use 'hide' ou 'show'.");
        }
      }
    });
  } catch (error) {
    console.error("Erro ao tentar alterar a visibilidade da div com a imagem:", error);
  }
}

//************************************************
// ADICIONAR PREÇO E QUANTIDADE NO FLOATING MENU DA PÁGINA DE PEDIDOS
//************************************************

function enableFloatingPendingPayment() {
  if (window.location.href !== "https://app.flowborder.com/CustomOrder/Pending") return;

  const container = document.getElementById("divFollowButtons");
  if (!container) {
    console.error("Elemento #divFollowButtons não encontrado.");
    return;
  }

  const cloneH5 = document.createElement("div");
  cloneH5.id = "cloned-h5";
  cloneH5.style.transform = "scale(0.9)";
  cloneH5.style.transformOrigin = "top left";
  cloneH5.style.display = "none";
  cloneH5.style.display = "inline-block";

  const cloneSpanContainer = document.createElement("div");
  cloneSpanContainer.id = "cloned-span-container";
  cloneSpanContainer.style.display = "none";
  cloneSpanContainer.style.display = "inline-block";

  container.appendChild(cloneH5);
  container.appendChild(cloneSpanContainer);

  function sincronizar(selector, target, onCloneReady) {
    const original = document.querySelector(selector);
    if (!original) {
      console.warn(`Elemento ${selector} não encontrado.`);
      return;
    }

    const update = () => {
      const clone = original.cloneNode(true);
      if (typeof onCloneReady === 'function') onCloneReady(clone);
      target.innerHTML = '';
      target.appendChild(clone);
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(original, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  }

  sincronizar(
    "#wrapper > div.content-page > div > div.page-content-wrapper > div > section > div:nth-child(3) > div:nth-child(2) > div > div:nth-child(3) > div > div > div > div.col-8.text-right.align-self-center > div > h5",
    cloneH5
  );

  sincronizar("#spSelectedOrderNum", cloneSpanContainer, (clonedSpan) => {
    clonedSpan.style.marginTop = "-14px";
  });

  const toggleDisplay = () => {
    const visivel = container.classList.contains("buttons-follow");
    const display = visivel ? "inline-block" : "none";
    cloneH5.style.display = display;
    cloneSpanContainer.style.display = display;
  };

  const classObserver = new MutationObserver(toggleDisplay);
  classObserver.observe(container, { attributes: true, attributeFilter: ["class"] });

  toggleDisplay();
}

//************************************************
// CUSTOM INVOICE
//************************************************

async function generateFlowBorderPDF() {

  const base64Logo = "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"
  // Carregar libs se necessário
  if (typeof jspdf === 'undefined') {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  if (!window.jspdf || !window.jspdf.autoTable) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const laranja = [224, 133, 64];
  const branco = [255, 255, 255];

  const today = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const dateFormatted = `${today.getFullYear()}/${pad(today.getMonth() + 1)}/${pad(today.getDate())}`;
  const dateRaw = `${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`;
  const userId = document.querySelector('meta[name="FLOW_EnterpriseCode"]')?.getAttribute('value') || 'UNKNOWN';
  const invoiceCode = `FB${userId}${dateRaw}`;

  const linhas = Array.from(document.querySelectorAll('#orderListTable tbody tr'));
  const linhasPDF = [];
  let total = 0;
  let hasChecked = false;

  for (let i = 0; i < linhas.length; i++) {
    const tr = linhas[i];
    const chk = tr.querySelector('input[name=chk_list]');
    if (chk && chk.checked) {
      hasChecked = true;
      const orderNumber = chk.getAttribute('orderno') || '';
      const saleNo = chk.getAttribute('data-saleno') || '';
      const fullOrder = `${saleNo} (${orderNumber})`;
      const dateTd = tr.querySelectorAll('td')[3];
      const dateText = dateTd?.querySelectorAll('p')?.[2]?.textContent.trim() || '';

      let j = i + 1;
      while (j < linhas.length && linhas[j].classList.contains('js-detail')) {
        const produtoTr = linhas[j];
        const nomeProduto = produtoTr.querySelector('td[colspan] a.link')?.textContent.trim();
        const priceInfoCell = produtoTr.querySelector('td[colspan="2"][style*="text-align"]');
        let amount = 0;

        if (priceInfoCell) {
          const match = priceInfoCell.innerText.match(/FlowBorder price\s*:\s*(\d+)\s*\*\s*\$?([\d.]+)/i);
          if (match) {
            const qty = parseInt(match[1], 10);
            const unitPrice = parseFloat(match[2]);
            amount = qty * unitPrice;
            total += amount;
          }
        }

        if (nomeProduto && amount > 0) {
          linhasPDF.push([
            nomeProduto,
            dateText,
            fullOrder,
            amount.toFixed(2)
          ]);
        }

        j++;
      }

      i = j - 1;
    }
  }

  // ⚠️ Verifica se há algum item selecionado
  if (!hasChecked) {
    alert("Selecione ao menos um pedido para gerar o PDF.");
    return;
  }

  // Bloco 1: ISSUER e TO
  doc.autoTable({
    startY: 10,
    tableWidth: 115,
    head: [[
      { content: 'ISSUER', styles: { fontStyle: 'bold', textColor: laranja } },
      {
        content:
`Company: Headshot America LLC
Address: 131 Continental Drive, Suite 301, New York, Delaware, 197134323,
United States of America
Phone: +55 16994398935`,
        styles: { fontStyle: 'normal', textColor: [0, 0, 0] }
      }
    ],
    [
      { content: 'TO', styles: { fontStyle: 'bold', textColor: laranja } },
      {
        content:
`Company: Azure Enterprise Limited
Address: Rm 01, 26TH Floor, Working View Comm Building,
21 Yiu Wah Street, Causeway Bay, Hong Kong
Phone: +1 505 333 4609
Email: info@azurelimited.online`,
        styles: { fontStyle: 'normal', textColor: [0, 0, 0] }
      }
    ]],
    theme: 'grid',
    styles: {
      fontSize: 9,
      halign: 'left',
      cellPadding: 4,
      fillColor: branco,
      lineWidth: 0
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 90 }
    }
  });

  // Logo ampliada 50% com proporção
  if (base64Logo) {
    doc.addImage(base64Logo, 'PNG', 150, 12, 40, 21.45);
  }

  // Bloco 2: INVOICE / DATA / TOTAL
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 2,
    head: [[
      { content: 'INVOICE NUMBER', styles: { fontStyle: 'bold', textColor: laranja } },
      { content: invoiceCode, styles: { fontStyle: 'normal', textColor: [0, 0, 0] } },
      { content: 'ISSUE DATE', styles: { fontStyle: 'bold', textColor: laranja } },
      { content: dateFormatted, styles: { fontStyle: 'normal', textColor: [0, 0, 0] } },
      { content: 'TOTAL (USD)', styles: { fontStyle: 'bold', textColor: laranja } },
      { content: total.toFixed(2), styles: { fontStyle: 'normal', textColor: [0, 0, 0] } }
    ]],
    theme: 'grid',
    styles: {
      fontSize: 9,
      halign: 'left',
      cellPadding: 3,
      fillColor: branco,
      lineWidth: 0
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25, halign: 'right' }
    }
  });

  // Bloco 3: Produtos
  doc.autoTable({
    head: [['Product Name', 'Date', 'Order Number', 'AMOUNT (USD)']],
    body: linhasPDF,
    startY: doc.lastAutoTable.finalY + 5,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: {
      fillColor: laranja,
      textColor: branco,
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0
    },
    bodyStyles: {
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'left' }
    }
  });

  // Numeração de páginas
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 20, doc.internal.pageSize.getHeight() - 10);
  }

  doc.save('FlowBorder_Orders.pdf');
}

//************************************************
// ENABLE CUSTOM INVOICE FOR SPECIFC CLIENTS
//************************************************

function substituirHrefBotaoPDF() {
  const userData = extractUserDataFromMeta();
  const userId = userData?.userId;

  const idsPermitidos = [
    'U022737',
    // adicione outros IDs aqui
  ];

  if (!userId || !idsPermitidos.includes(userId)) {
    console.warn("Usuário não autorizado para substituir o botão PDF.");
    return;
  }

  const container = document.getElementById("divFollowButtons");
  if (!container) {
    console.warn("divFollowButtons não encontrada.");
    return;
  }

  const firstLevelDiv = container.querySelector("div");
  const secondLevelDiv = firstLevelDiv?.querySelector("div");
  if (!secondLevelDiv) {
    console.warn("Estrutura esperada de divs não encontrada.");
    return;
  }

  const links = secondLevelDiv.querySelectorAll("a[href$='doExportPDF()']");
  if (links.length === 0) {
    console.warn("Nenhum link com href final 'doExportPDF()' encontrado.");
    return;
  }

  links[0].setAttribute("href", "javascript:generateFlowBorderPDF()");
}

//************************************************
//      Alterar estilo do CRISP
//************************************************

function alterarEstiloDoCrisp() {
  // ------------ ocultar "We run on Crisp"
  document.querySelectorAll('a[href^="https://crisp.chat/en/livechat/"][rel*="noreferrer"]').forEach(el => {
    el.innerHTML = '';
  });

  // ------------ ocultar botão "Conversação"
  const xpath1 = '//*[@id="crisp-chatbox"]/div/div/div[1]/div/span[1]';
  const result1 = document.evaluate(xpath1, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  const element1 = result1.singleNodeValue;
  if (element1) {
    element1.style.setProperty('display', 'none', 'important');
  }

  // ------------ ocultar "O suporte está online"
  const xpath2 = '//*[@id="crisp-chatbox"]/div/div/div[1]/div/div/span[2]/span/span[2]';
  const result2 = document.evaluate(xpath2, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  const element2 = result2.singleNodeValue;
  if (element2) {
    element2.style.setProperty('display', 'none', 'important');
  }

  // ------------ cabeçalho minimalista
  const xpath3 = '//*[@id="crisp-chatbox"]/div/div/div[1]/div/div/span[2]/span/span[1]';
  const result3 = document.evaluate(xpath3, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  const element3 = result3.singleNodeValue;
  if (element3) {
    element3.style.setProperty('display', 'none', 'important');
  }

  const xpath33 = '//*[@id="crisp-chatbox"]/div/div/div[1]/div';
  const result33 = document.evaluate(xpath33, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  const element33 = result33.singleNodeValue;
  if (element33) {
    element33.style.setProperty('height', '33px', 'important');
  }

  const xpath333 = '//*[@id="crisp-chatbox"]/div/div/div[1]/div/div';
  const result333 = document.evaluate(xpath333, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  const element333 = result333.singleNodeValue;
  if (element333) {
    element333.innerHTML = '';
  }

  // ------------ altura do chat (100vh - 150px)
  const xpath4 = '//*[@id="crisp-chatbox"]/div/div/div[2]';
  const result4 = document.evaluate(xpath4, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  const target4 = result4.singleNodeValue;
  if (target4) {
    const applyFix4 = () => {
      target4.style.setProperty('height', 'calc(100vh - 150px)', 'important');
    };

    applyFix4();

    const observer4 = new MutationObserver(() => {
      applyFix4();
    });

    observer4.observe(target4, {
      attributes: true,
      attributeFilter: ['style'],
    });
  }

  // ------------ observar mudanças na crisp-client e ocultar links inválidos
  const crispDiv = document.querySelector('.crisp-client');
  if (crispDiv) {
    const hideInvalidEmailLinks = () => {
      const invalidLinks = document.querySelectorAll('a[data-type="email_invalid"]');
      invalidLinks.forEach(link => {
        link.style.setProperty('display', 'none', 'important');
      });
    };

    const observerEmails = new MutationObserver(() => {
      hideInvalidEmailLinks();
    });

    observerEmails.observe(crispDiv, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });

    // Executa imediatamente também
    hideInvalidEmailLinks();
  }

  

  // ---- bloqueia/desbloqueia textarea esperando pela IA
  // aguardar até 120s por uma resposta
  controlarTextareaDoCrisp(120);

}

//************************************************
//    controlar Text Area do CRISP esperando resposta da IA
//************************************************

function controlarTextareaDoCrisp(segundosLimite = 10) {
  (function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
.crisp-fade-mask {
  -webkit-mask-image: linear-gradient(to right, transparent 0%, white 50%, transparent 100%);
  -webkit-mask-size: 200% 100%;
  -webkit-mask-position: 100% 0;
  -webkit-mask-repeat: no-repeat;
  animation: crisp-mask-slide 2s infinite linear;
  pointer-events: none;
}

textarea.crisp-fade-mask:disabled::placeholder {
  color: #111 !important;
  opacity: 1 !important;
}

@keyframes crisp-mask-slide {
  0%   { -webkit-mask-position: 100% 0; }
  50%  { -webkit-mask-position: 0% 0; }
  100% { -webkit-mask-position: 100% 0; }
}

.crisp-stop-icon {
  width: 27px;
  height: 27px;
  margin-right: 8px;
  border-radius: 50%;
  background-color: white;
  border: 2px solid #666;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: crisp-stop-fade 1.5s infinite ease-in-out;
  cursor: pointer !important;
  font-size: 16px;
  color: #333;
  z-index: 9999 !important;
}

.crisp-stop-icon:hover {
  background-color: #f3f3f3;
}

@keyframes crisp-stop-fade {
  0%   { opacity: 1; }
  50%  { opacity: 0.7; }
  100% { opacity: 1; }
}
`;
    document.head.appendChild(style);
  })();

  function waitForCrisp() {
    if (typeof $crisp === 'undefined') {
      setTimeout(waitForCrisp, 500);
      return;
    }

    let timeoutId = null;
    let tempoInicial = null;

    function getTextarea() {
      const xpath = '//*[@id="crisp-chatbox"]/div/div/div[2]/div/div[5]/form/textarea';
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue;
    }

    function getSendButtonWrapper() {
      const xpath = '//*[@id="crisp-chatbox"]/div/div/div[2]/div/div[5]/div';
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue;
    }

    function ensureStopIcon() {
      const wrapper = getSendButtonWrapper();
      if (!wrapper) return;

      let stopIcon = document.getElementById('crisp-stop-icon');
      if (!stopIcon) {
        stopIcon = document.createElement('div');
        stopIcon.id = 'crisp-stop-icon';
        stopIcon.className = 'crisp-stop-icon';
        stopIcon.title = 'Cancelar espera';

        stopIcon.addEventListener('click', () => {
          clearTimeout(timeoutId);
          const textarea = getTextarea();
          aplicarMascara(textarea, false);
        });

        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-circle-stop';
        icon.style.setProperty('all', 'unset', 'important');
        icon.style.setProperty('font-family', '"Font Awesome 6 Free"', 'important');
        icon.style.setProperty('font-weight', '900', 'important');
        icon.style.setProperty('display', 'inline-block', 'important');
        icon.style.setProperty('font-style', 'normal', 'important');
        icon.style.setProperty('font-size', '20px', 'important');
        icon.style.setProperty('color', '#333', 'important');
        icon.style.setProperty('cursor', 'pointer', 'important');

        stopIcon.appendChild(icon);
        wrapper.insertBefore(stopIcon, wrapper.firstChild);
      }

      stopIcon.style.setProperty('display', 'flex', 'important');
    }

    function hideStopIcon() {
      const stopIcon = document.getElementById('crisp-stop-icon');
      if (stopIcon) {
        stopIcon.style.setProperty('display', 'none', 'important');
      }
    }

    function aplicarMascara(textarea, ativar) {
      if (!textarea) return;

      if (ativar) {
        textarea.disabled = true;
        textarea.classList.add('crisp-fade-mask');

        ensureStopIcon();

        timeoutId = setTimeout(() => {
          aplicarMascara(textarea, false);
        }, segundosLimite * 1000);
      } else {
        textarea.disabled = false;
        textarea.classList.remove('crisp-fade-mask');
        hideStopIcon();
      }
    }

    $crisp.push(["on", "message:sent", function({ from }) {
      if (from !== "user") return;
      const textarea = getTextarea();
      aplicarMascara(textarea, true);
      tempoInicial = Date.now();
    }]);

    $crisp.push(["on", "message:received", function({ from }) {
      if (from !== "operator" || tempoInicial === null) return;
      const tempoResposta = Math.round((Date.now() - tempoInicial) / 1000);
      if (tempoResposta <= segundosLimite) {
        clearTimeout(timeoutId);
        const textarea = getTextarea();
        aplicarMascara(textarea, false);
        tempoInicial = null;
      }
    }]);
  }

  waitForCrisp();
}


//************************************************
//************************************************
//     🟢🟢🟢🟢🟢  BOTÃO ASSINATURA
//************************************************
//************************************************

function adicionarBotaoDropdownAssinatura() {
  console.log("[Flow] Starting subscriptions.");

  userDataForCrisp = extractUserDataFromMeta();

  const ul = document.querySelector('#page-topbar .navbar-custom .list-inline');
  if (!ul) return console.error("Elemento UL não encontrado.");

  const remarksMeta = document.querySelector('meta[name="FLOW_Remarks"]');
  let subscriptionStatus = null;
  let subId = "";
  try {
    if (remarksMeta?.getAttribute('value')) {
      const remarks = JSON.parse(remarksMeta.getAttribute('value'));
      subscriptionStatus = remarks.subscriptionStatus;
      subId = remarks.subscriptionId || "";
    }
  } catch (e) {}

  const gerenciarLink = `https://app.flowborder.com/flow-api/subscriptions/manage?subscription_id=${encodeURIComponent(subId)}`;

  const li = document.createElement('li');
  li.className = 'list-inline-item dropdown notification-list';

  li.innerHTML = `
    <a class="btn btn-falg-bg dropdown-toggle arrow-none mr-2 align-baseline" data-toggle="dropdown" aria-expanded="false" style="cursor:pointer;">
      <span>Assinatura</span>
      <i class="bi bi-chevron-down mobile-style"></i>
    </a>
    <div class="dropdown-menu dropdown-menu-right language-switch falg-dropdown-menu">
      <a class="dropdown-item" id="btn-assinar-agora" href="https://flowborder.com/planos" target="_blank">Comparar planos</a>
      <a class="dropdown-item" id="link-ativar-assinatura" style="cursor:pointer;">Ativar assinatura</a>
      <a class="dropdown-item" id="btn-gerenciar-assinatura" ${subId ? `href="${gerenciarLink}" target="_blank"` : 'style="pointer-events:none;opacity:0.5;cursor:not-allowed;"'}>Gerenciar assinaturas</a>
    </div>
  `;

  ul.insertBefore(li, ul.querySelector('li'));

  // Aplica lógica de status da assinatura
  const linkAssinar = document.getElementById('btn-assinar-agora');
  const ativar = document.getElementById('link-ativar-assinatura');
  const gerenciar = document.getElementById('btn-gerenciar-assinatura');

  if (subscriptionStatus === 'active') {
    if (linkAssinar) linkAssinar.style.display = 'none';
    if (ativar) {
      ativar.textContent = 'Assinatura ' + userDataForCrisp.remarks.plan_name;
      ativar.style.pointerEvents = 'none';
      ativar.style.opacity = '0.5';
    }
  }

  if (!subId && gerenciar) {
    gerenciar.removeAttribute('href');
    gerenciar.style.pointerEvents = 'none';
    gerenciar.style.opacity = '0.5';
    gerenciar.style.cursor = 'not-allowed';
  }

  // Modal de ativação
  if (!document.querySelector('#modal-ativar-assinatura')) {
    const modal = document.createElement('div');
    modal.id = 'modal-ativar-assinatura';
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      ">
        <div style="
          background: white;
          padding: 20px 30px;
          border-radius: 8px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 0 20px rgba(0,0,0,0.3);
          position: relative;
          font-family: Arial, sans-serif;
        ">
          <button id="fechar-modal" style="
            position: absolute;
            top: 8px;
            right: 8px;
            background: transparent;
            border: none;
            font-size: 20px;
            cursor: pointer;
          ">&times;</button>
          <div id="conteudo-modal">
            <h3 style="margin-top: 0;">Ativar Assinatura</h3>
            <input type="text" id="codigo-ativacao" placeholder="Digite seu código" style="
              width: 100%;
              padding: 10px;
              margin-bottom: 10px;
              border: 1px solid #ccc;
              border-radius: 4px;
              font-size: 16px;
            " />
            <button id="botao-enviar-codigo" style="
              width: 100%;
              background-color: #007bff;
              color: white;
              padding: 10px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
            ">Ativar</button>
            <div id="resultado-request" style="margin-top: 15px; font-size: 14px;"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Carrega o ícone do FontAwesome dinamicamente
  const faLink = document.createElement('link');
  faLink.rel = 'stylesheet';
  faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
  document.head.appendChild(faLink);

  let modalAberto = false;
  let respostaPendente = null;

  document.getElementById('link-ativar-assinatura').onclick = abrirModalAtivacao;

  function abrirModalAtivacao() {
    const modal = document.querySelector('#modal-ativar-assinatura > div');
    modal.style.display = 'flex';
    modalAberto = true;
    respostaPendente = null;

    const fechar = document.getElementById('fechar-modal');
    fechar.onclick = () => {
      modal.style.display = 'none';
      modalAberto = false;
    };

    const btnAtivar = document.getElementById('botao-enviar-codigo');
    const input = document.getElementById('codigo-ativacao');
    const resultado = document.getElementById('resultado-request');

    resultado.textContent = '';

    btnAtivar.onclick = () => {
      const codigo = input.value.trim();
      if (!codigo) {
        resultado.innerHTML = `<span style="color: red;">Por favor, insira um código.</span>`;
        return;
      }

      btnAtivar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
      btnAtivar.disabled = true;
      input.disabled = true;
      resultado.innerHTML = '';

      const token = document.querySelector('meta[name="FLOW_Token"]')?.getAttribute('value');
      const enterpriseCode = document.querySelector('meta[name="FLOW_EnterpriseCode"]')?.getAttribute('value');

      fetch(`https://app.flowborder.com/flow-api/subscriptions/activation/${enterpriseCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscriptionId: codigo })
      })
        .then(res => res.json().then(data => ({ status: res.status, data })))
        .then(({ status, data }) => {
          if (status === 200 && data.status === 'success') {
            resultado.innerHTML = `
              <div style="margin-top: 20px;">
                <h4>✅ Assinatura ativada com sucesso.</h4>
                <p>Refaça seu login para liberar os novos recursos.</p>
                <a href="https://app.flowborder.com/login/login.html" class="btn btn-success" style="margin-top: 10px;">Refazer login</a>
              </div>`;
          } else {
            throw new Error();
          }
        })
        .catch(() => {
          resultado.innerHTML = `
            <div style="color: red;">
              ❌ Falha na ativação da assinatura.<br>
              Tente novamente. Se o erro persistir, entre em contato com o suporte.
            </div>`;
        })
        .finally(() => {
          btnAtivar.innerHTML = 'Ativar';
          btnAtivar.disabled = false;
          input.disabled = false;
        });
    };
  }

  const observer = new MutationObserver(() => {
    if (!modalAberto && respostaPendente) {
      const modal = document.querySelector('#modal-ativar-assinatura > div');
      const resultado = document.getElementById('resultado-request');
      modal.style.display = 'flex';
      resultado.innerHTML = respostaPendente;
      respostaPendente = null;
      modalAberto = true;
    }
  });

  observer.observe(document.getElementById('modal-ativar-assinatura'), {
    attributes: true,
    childList: true,
    subtree: true,
  });
}

//**************
// OCULTAR PAYONER
//**************

function hidePayoneerAndSwiftInIframes() {
    // Flag para garantir que o log "[hidding PAYONEER & SWIFT]" seja exibido apenas uma vez
    let hasLogged = false;

    // Função para verificar e remover a div com os textos "PAYONEER" ou "SWIFT" dentro de um iframe
    function checkAndRemoveDivs(iframe) {
        // Exibe a mensagem inicial apenas uma vez
        if (!hasLogged) {
            console.log('[hidding PAYONEER & SWIFT]');
            hasLogged = true; // Marca que a mensagem foi exibida
        }

        // Acessa o conteúdo do iframe após o carregamento
        var iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

        // Verifica se o conteúdo do iframe foi carregado
        if (iframeDocument) {
            // Procura por todas as divs com a classe 'alert alert-primary'
            var alertDivs = iframeDocument.querySelectorAll('.alert.alert-primary');

            // Para cada div encontrada, verifica o conteúdo
            alertDivs.forEach(function(div) {
                if (div.innerHTML.includes('PAYONEER') || div.innerHTML.includes('SWIFT')) {
                    console.log('Removendo div com PAYONEER ou SWIFT dentro do iframe.');
                    div.remove();  // Remove a div
                }
            });
        }
    }

    // Função para observar a adição de novos iframes ao DOM e configurar o onload
    function observeNewIframes() {
        // Cria um MutationObserver para monitorar a adição de novos elementos ao DOM
        var observer = new MutationObserver(function(mutationsList) {
            mutationsList.forEach(function(mutation) {
                // Verifica se novos nós foram adicionados ao DOM
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        // Se o nó adicionado for um iframe
                        if (node.tagName === 'IFRAME') {
                            // Configura o evento onload para verificar e remover a div "PAYONEER" ou "SWIFT"
                            node.onload = function() {
                                checkAndRemoveDivs(node);
                            };
                            console.log('Novo iframe detectado na página.');
                        }
                    });
                }
            });
        });

        // Configura o observer para monitorar mudanças no DOM
        observer.observe(document.body, {
            childList: true, // Monitorar a adição e remoção de elementos
            subtree: true    // Incluir toda a árvore do DOM
        });
    }

    // Configura o onload para os iframes existentes no momento da execução
    var existingIframes = document.querySelectorAll('iframe');
    existingIframes.forEach(function(iframe) {
        iframe.onload = function() {
            checkAndRemoveDivs(iframe);
        };
    });

    // Inicia o observer para detectar novos iframes
    observeNewIframes();
}

//---
// custom Billing divs
//---

function customBillingDivs() {
    // Flag para garantir que o log "[hidding PAYONEER & SWIFT]" seja exibido apenas uma vez
    let hasLogged = false;

    // Função para verificar e remover as divs com os textos "PAYONEER" ou "SWIFT" e adicionar novos blocos
    function checkAndRemoveDivs(iframe) {
        // Exibe a mensagem inicial apenas uma vez
        if (!hasLogged) {
            console.log('[hidding PAYONEER & SWIFT]');
            hasLogged = true; // Marca que a mensagem foi exibida
        }

        // Acessa o conteúdo do iframe após o carregamento
        var iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

        // Verifica se o conteúdo do iframe foi carregado
        if (iframeDocument) {
            // Procura por todas as divs com a classe 'alert alert-primary'
            var alertDivs = iframeDocument.querySelectorAll('.alert.alert-primary');

            // Para cada div encontrada, verifica o conteúdo
            alertDivs.forEach(function(div) {
                if (div.innerHTML.includes('PAYONEER') || div.innerHTML.includes('SWIFT')) {
                    console.log('Removendo div com PAYONEER ou SWIFT dentro do iframe.');
                    div.remove();  // Remove a div
                }
            });

            // Remove a classe 'h-100' da div que contém "PIX"
            removeH100ClassFromPIX(iframeDocument);

            // Adiciona os 3 novos blocos de informações logo abaixo da div que contém "PIX"
            addNewDivs(iframeDocument);
        }
    }

    // Função para remover a classe 'h-100' da div que contém "PIX"
    function removeH100ClassFromPIX(iframeDocument) {
        var pixDiv = iframeDocument.querySelector('div.alert.alert-primary h5');
        if (pixDiv && pixDiv.textContent.includes("PIX")) {
            var targetDiv = pixDiv.closest('div.alert.alert-primary');
            targetDiv.classList.remove('h-100');
            targetDiv.classList.add('d-none');
        }
    }

    // Função para adicionar os 3 novos blocos de informações dentro do iframe
    function addNewDivs(iframeDocument) {
        // Encontra a div que contém o texto "PIX"
        var pixDiv = iframeDocument.querySelector('div.alert.alert-primary h5');
        
        if (pixDiv && pixDiv.textContent.includes("PIX")) {
            // A div que contém "PIX" foi encontrada, então procuramos a div pai
            var targetDiv = pixDiv.closest('div.alert.alert-primary');

            // Cria os novos blocos e adiciona logo abaixo da div que contém "PIX"
            var div1 = createStyledBlock(
                'Transferência Doméstica nos EUA <br>(ACH/Wire em USD)',
                'Para quem envia de um banco americano em dólar (USD)',
                [
                    { label: 'Receiving Bank', content: '' },
                    { label: 'ABA Routing Number', content: '091311229' },
                    { label: 'Bank Name', content: 'Choice Financial Group (Mercury uses Choice Financial Group as a banking partner)' },
                    { label: 'Bank Address', content: '4501 23rd Avenue S, Fargo, ND 58104' },
                    { label: 'Beneficiary', content: '' },
                    { label: 'Beneficiary Name', content: 'HEADSHOT AMERICA LLC' },
                    { label: 'Account Number', content: '202572442388' },
                    { label: 'Type of Account', content: 'Checking' },
                    { label: 'Beneficiary Address', content: '131 Continental Drive, STE 301 - Newark, DE 19713' }
                ]
            );

            var div2 = createStyledBlock(
                'Transferência Internacional em USD (Wire/SWIFT)',
                'Para quem envia dólares (USD) de fora dos EUA',
                [
                    { label: 'Receiving Bank', content: '' },
                    { label: 'SWIFT/BIC Code', content: 'CHFGUS44021' },
                    { label: 'ABA Routing Number', content: '091311229' },
                    { label: 'Bank Name', content: 'Choice Financial Group' },
                    { label: 'Bank Address', content: '4501 23rd Avenue S, Fargo, ND 58104, USA' },
                    { label: 'Beneficiary', content: '' },
                    { label: 'IBAN/Account Number', content: '202572442388' },
                    { label: 'Beneficiary Name', content: 'HEADSHOT AMERICA LLC' },
                    { label: 'Beneficiary Address', content: '131 Continental Drive, STE 301, Newark, DE 19713, USA' }
                ]
            );

            var div3 = createStyledBlock(
                'Transferência Internacional em Outras Moedas (EUR, GBP, CAD, etc)',
                'Para quem envia em moeda estrangeira diferente de USD',
                [
                    { label: '⚠️ <font color="red">Atenção</font>', content: 'No campo “<font color="red">Memo</font>” ou referência, obrigatoriamente coloque: <font color="red">/FFC/202572442388/HEADSHOT AMERICA LLC/131 Continental Drive, STE 301 Newark, DE 19713</font>' },
                    { label: 'Receiving Bank', content: '' },
                    { label: 'SWIFT/BIC Code', content: 'CHASUS33' },
                    { label: 'ABA Routing Number', content: '021000021' },
                    { label: 'Bank Name', content: 'JP Morgan Chase Bank, N.A. – New York' },
                    { label: 'Bank Address', content: '383 Madison Avenue, Floor 23, New York, NY 10017, USA' },
                    { label: 'Beneficiary', content: '' },
                    { label: 'IBAN/Account Number', content: '707567692' },
                    { label: 'Beneficiary Name', content: 'Choice Financial Group' },
                    { label: 'Beneficiary Address', content: '4501 23rd Ave S, Fargo, ND 58104, USA' }
                ]
            );

            // Adiciona os blocos ao targetDiv na ordem invertida
            targetDiv.insertAdjacentElement('afterend', div3);
            targetDiv.insertAdjacentElement('afterend', div2);
            targetDiv.insertAdjacentElement('afterend', div1);
        }
    }

    // Função para criar um bloco com subtítulos e conteúdo, aplicando o estilo adequado
    function createStyledBlock(title, description, items) {
        var div = document.createElement('div');
        div.classList.add('alert', 'alert-primary');
        div.setAttribute('role', 'alert');
        
        // Adiciona título e descrição
        div.innerHTML = `<div class="form-group row text-center">
                            <h5 class="col-sm-12 text-dark mb-1">${title}</h5>
                        </div>
                        <div class="form-group mb-1">
                            <p>${description}</p>
                        </div>`;

        // Adiciona as informações de cada item
        items.forEach(function(item) {
            var formGroup = document.createElement('div');
            formGroup.classList.add('form-group', 'mb-1');
            
            if (item.label === 'Receiving Bank' || item.label === 'Beneficiary') {
                // Subtítulos, em preto e sem dois pontos nem botão de copiar
                formGroup.innerHTML = `<strong style="color: black;">${item.label}</strong>
                                       <p>${item.content}</p>`;
            } else {
                // Outros campos com o botão de copiar
                formGroup.innerHTML = `<label class="form-item-label">${item.label}：</label>
                                       <span class="text-wrap">${item.content}</span>
                                       <a onclick="doTextCopyCustomFlow(this)" href="javascript:void(0)" class="ml-2" title="Copy" hgtrans="true">
                                           <i class="bi bi-files"></i>
                                       </a>`;
            }
            div.appendChild(formGroup);
        });

        return div;
    }

    // Função para observar a adição de novos iframes ao DOM e configurar o onload
    function observeNewIframes() {
        // Cria um MutationObserver para monitorar a adição de novos elementos ao DOM
        var observer = new MutationObserver(function(mutationsList) {
            mutationsList.forEach(function(mutation) {
                // Verifica se novos nós foram adicionados ao DOM
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        // Se o nó adicionado for um iframe
                        if (node.tagName === 'IFRAME') {
                            // Configura o evento onload para verificar e remover a div "PAYONEER" ou "SWIFT"
                            node.onload = function() {
                                checkAndRemoveDivs(node);
                            };
                            console.log('Novo iframe detectado na página.');
                        }
                    });
                }
            });
        });

        // Configura o observer para monitorar mudanças no DOM
        observer.observe(document.body, {
            childList: true, // Monitorar a adição e remoção de elementos
            subtree: true    // Incluir toda a árvore do DOM
        });
    }

    // Configura o onload para os iframes existentes no momento da execução
    var existingIframes = document.querySelectorAll('iframe');
    existingIframes.forEach(function(iframe) {
        iframe.onload = function() {
            checkAndRemoveDivs(iframe);
        };
    });

    // Inicia o observer para detectar novos iframes
    observeNewIframes();
}

function doTextCopyCustomFlow(button) {
    // Obtém o texto que precisa ser copiado (conteúdo do <span>)
    var text = button.previousElementSibling.textContent;

    // Cria um campo de texto temporário para copiar
    var textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);

    // Seleciona e copia o conteúdo do campo temporário
    textArea.select();
    textArea.setSelectionRange(0, 99999); // Para dispositivos móveis
    document.execCommand("copy");

    // Remove o campo temporário após a cópia
    document.body.removeChild(textArea);

    // Alerta o usuário (opcional)
    //alert("Texto copiado: " + text);
}

//*************************
// FORMATAR PIX
//*************************
async function formatarModalPix() {
    const form = document.querySelector('#InterPix-payment-form');
    if (!form) return;

    // Helper: normaliza texto (trim e case-insensitive)
    const norm = s => (s || '').trim();

    // 1) Esconde blocos cujos <label> contenham Pix Fee / Benefits / Benefícios
    form.querySelectorAll('label').forEach(label => {
        const txt = norm(label.textContent);
        if (
            txt.includes('Pix Fee') ||
            txt.includes('Benefits') ||
            txt.includes('Benefícios')
        ) {
            const parentDiv = label.closest('div');
            if (parentDiv) parentDiv.style.display = 'none';
        }
    });

    // 2) Busca o HTML e extrai brlRate do bloco currentCy == "BRL"
    let brlRate = null;
    try {
        const url = new URL('https://app.flowborder.com/CustomSetting/BankPayFileUpload');
        url.search = new URLSearchParams({ amount: '1000', otherChargeName: '' }).toString();
        const resp = await fetch(url.toString(), {
            method: 'GET',
            credentials: 'include',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const html = await resp.text();
        const m = html.match(/currentCy\s*==\s*"BRL"[\s\S]*?parseFloat\("([0-9.]+)"\)/);
        if (m) {
            brlRate = parseFloat(m[1]);
            console.log('brlRate capturado:', brlRate);
        } else {
            console.warn('Não foi possível localizar brlRate (BRL) no HTML.');
        }
    } catch (e) {
        console.error('Erro ao buscar/parsear BankPayFileUpload:', e);
    }

    if (!brlRate || !isFinite(brlRate)) return;

    // 3) Acha o <label> alvo: "Payment Amount" ou "Montante do pagamento"
    const labels = Array.from(form.querySelectorAll('label'));
    let paymentLabelEl = labels.find(l => {
        const t = norm(l.textContent);
        return t.includes('Payment Amount') || t.includes('Montante do pagamento');
    });
    if (!paymentLabelEl) return;

    // DIV original do Payment Amount
    const paymentDiv = paymentLabelEl.closest('div.form-group.form-inline') || paymentLabelEl.closest('div');
    if (!paymentDiv) return;

    const isPT = norm(paymentLabelEl.textContent).includes('Montante do pagamento');

    // 4) Duplicar logo após (se ainda não duplicou)
    if (!(paymentDiv.nextElementSibling && paymentDiv.nextElementSibling.dataset && paymentDiv.nextElementSibling.dataset.cloneBrl === '1')) {
        const cloned = document.createElement('div');
        cloned.className = 'form-group form-inline';
        cloned.dataset.cloneBrl = '1';

        // Label BRL mantendo idioma
        const label = document.createElement('label');
        label.className = 'my-1 mr-3';
        label.innerHTML = (isPT ? 'Montante do pagamento (BRL)' : 'Payment Amount (BRL)') + '&nbsp;:';
        cloned.appendChild(label);

        // Span BRL
        const spanBRL = document.createElement('span');
        spanBRL.className = 'badge badge-warning font-size-1-2';
        spanBRL.id = 'spPaymentAmountBRL-open-InterPixmodal';
        spanBRL.textContent = 'R$0.00';
        cloned.appendChild(spanBRL);

        // Hidden opcional
        const hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.id = 'endPaymentAmountBRL-open-InterPixmodal';
        cloned.appendChild(hidden);

        // Inserir logo depois da original
        paymentDiv.insertAdjacentElement('afterend', cloned);
    }

    // 5) Alterar label original para (USD), mantendo idioma e sufixo " :"
    const baseUSD = isPT ? 'Montante do pagamento (USD)' : 'Payment Amount (USD)';
    paymentLabelEl.innerHTML = baseUSD + '&nbsp;:';

    // 6) Atualizar BRL quando USD mudar
    const spanUSD = document.getElementById('spPaymentAmount-open-InterPixmodal');
    const spanBRL = document.getElementById('spPaymentAmountBRL-open-InterPixmodal');
    if (spanUSD && spanBRL) {
        const updateBRL = () => {
            const usdRaw = (spanUSD.textContent || '').trim();
            const usdVal = parseFloat(usdRaw.replace(/[^0-9.]/g, '')) || 0;
            const brlVal = usdVal / brlRate; // BRL = USD / brlRate
            spanBRL.textContent = `R$${brlVal.toFixed(2)}`;
            const hidden = document.getElementById('endPaymentAmountBRL-open-InterPixmodal');
            if (hidden) hidden.value = spanBRL.textContent;
        };
        updateBRL();
        const mo = new MutationObserver(updateBRL);
        mo.observe(spanUSD, { characterData: true, childList: true, subtree: true });
    }

    // 7) CSS para remover setinha do select
    (function removerSetaSelect() {
        const styleId = '__hide_select_arrow_paymentcurrency1__';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                #PaymentCurrency1 {
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    background-image: none !important;
                    padding-right: 10px;
                }
                #PaymentCurrency1.form-control::-ms-expand { display: none; }
            `;
            document.head.appendChild(style);
        }
    })();
}

//*********************
// PRODUTOS CONECTADOS
//*********************

function carregarProdutosMapeados2() {
  // console.log("🚀 iniciar carregarProdutosMapeados2");
  // console.log("📎 pathname:", location.pathname);

  const endsWithProduct = /\/CustomProduct\/ProductConnecton\/?$/.test(location.pathname);
  // console.log("🔎 regex /CustomProduct/ProductConnecton confere? =>", endsWithProduct);
  if (!endsWithProduct) {
    // console.warn("⛔ saindo: URL não confere.");
    return;
  }

  // console.log("📡 tentando extrair userData via extractUserDataFromMeta...");
  const userData = (typeof extractUserDataFromMeta === "function") ? extractUserDataFromMeta() : null;
  // console.log("🧩 userData:", userData);
  const RetailerCode = userData?.userId;
  const Token = userData?.flowToken;
  // console.log("👤 RetailerCode:", RetailerCode, "Token:", Token ? "[ok]" : "[faltando]");
  if (!RetailerCode || !Token) {
    // console.warn("⛔ saindo: RetailerCode/Token ausentes.");
    return;
  }

  // console.log("📦 procurando container .card-body dentro de .content-page...");
  const container = document.querySelector(".content-page .card-body");
  if (!container) {
    // console.warn("⛔ saindo: .card-body dentro de .content-page não encontrada.");
    return;
  }
  // console.log("✅ container encontrado:", container);

  const cs = window.getComputedStyle(container);
  // console.log("🎛️ estilos do container — display:", cs.display, "visibility:", cs.visibility, "opacity:", cs.opacity);

  container.innerHTML = `
    <div id="loading-spinner" style="display:flex;justify-content:center;align-items:center;min-height:300px;">
      <div class="spinner-border" role="status" style="width:3rem;height:3rem;"></div>
    </div>
  `;

  const spinner = document.getElementById("loading-spinner");
  // console.log("🌀 spinner presente?", !!spinner);

  const src = `https://app.flowborder.com/flow-api/mapeados?RetailerCode=${encodeURIComponent(RetailerCode)}&Token=${encodeURIComponent(Token)}&Mode=client`;
  // console.log("🖼️ src do iframe:", src);

  const iframe = document.createElement("iframe");
  iframe.src = src;
  iframe.style.width = "100%";
  iframe.style.border = "0";
  iframe.style.display = "none";
  iframe.setAttribute("scrolling", "no");
  iframe.setAttribute("allowtransparency", "true");

  container.appendChild(iframe);
  // console.log("📌 iframe adicionado ao DOM (display:none até load).");

  const resizeIframe = (origin) => {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        // console.log(`📏(${origin}) sem acesso ao doc do iframe`);
        return;
      }
      const body = doc.body;
      const html = doc.documentElement;
      if (!body || !html) {
        // console.log(`📏(${origin}) body/html ausentes no iframe`);
        return;
      }

      const height = Math.max(
        body.scrollHeight, html.scrollHeight,
        body.offsetHeight, html.offsetHeight,
        body.clientHeight, html.clientHeight
      );

      iframe.style.height = (height || 600) + "px";
      // console.log(`📏(${origin}) altura calculada:`, height, "→ aplicada:", iframe.style.height);

      if (!height || height < 50) {
        const ifCS = window.getComputedStyle(iframe);
        // console.warn(`⚠️(${origin}) altura muito baixa (${height}). display:`, ifCS.display);
      }
    } catch (e) {
      iframe.style.height = Math.max(window.innerHeight - 100, 600) + "px";
      // console.warn(`⚠️(${origin}) exceção ao medir iframe`, e);
    }
  };

  let loadFired = false;
  const loadTimeout = setTimeout(() => {
    if (!loadFired) {
      // console.warn("⏰ timeout: iframe.onload não disparou em 12s.");
      iframe.style.display = "block";
      resizeIframe("timeout12s");
    }
  }, 12000);

  iframe.addEventListener("load", () => {
    loadFired = true;
    clearTimeout(loadTimeout);
    // console.log("✅ iframe onload disparou.");

    iframe.style.display = "block";
    // console.log("👁️ iframe agora visível.");

    const sp = document.getElementById("loading-spinner");
    if (sp) sp.remove();

    resizeIframe("onload");

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        const ro = new ResizeObserver(() => resizeIframe("ResizeObserver"));
        ro.observe(doc.documentElement);
        ro.observe(doc.body);
      }
    } catch (e) {
      // console.warn("⚠️ erro ao registrar ResizeObserver:", e);
    }

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        const mo = new MutationObserver(() => resizeIframe("MutationObserver"));
        mo.observe(doc.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
      }
    } catch (e) {
      // console.warn("⚠️ erro ao registrar MutationObserver:", e);
    }

    const intervalId = setInterval(() => resizeIframe("interval1s"), 1000);
    const observerParent = new MutationObserver(() => {
      if (!document.body.contains(iframe)) {
        clearInterval(intervalId);
      }
    });
    observerParent.observe(document.body, { childList: true, subtree: true });
  });

  iframe.addEventListener("error", (e) => {
    clearTimeout(loadTimeout);
    // console.error("❌ erro ao carregar iframe:", e);
  });

  setTimeout(() => {
    const ifCS = window.getComputedStyle(iframe);
    // console.log("👀 estado do iframe (pré-load) — display:", ifCS.display);
    if (!document.body.contains(iframe)) {
      // console.warn("⚠️ iframe não está no DOM após append.");
    }
  }, 0);
}



//************************************************
//************************************************
//    🔴🔴🔴🔴🔴  EVENTO ON LOAD  🔴🔴🔴🔴🔴
//************************************************
//************************************************

const TEST_users = ["U022764", "U022933", "U022992", "U000001", "U023094", "U023172"]

/*
Marcelo Cruz | U022812
VX Negocios Digitais ~ U022898
*/
const PIX_TEST_users = TEST_users.concat(["U022812", "U022898"])

window.addEventListener("load", function () {

  console.log("[FlowAI] Script injected successfully.");

  try {
    if (window.self !== window.top) {
      console.log("[Flow] Detected execution within an iframe. AddOns skipped.");
    } else {

      console.log("[Flow] Starting initialization...");
      addAboutUsMenu();
      enableFloatingPendingPayment();
      carregarProdutosMapeados2();

      

      // ---- funções em teste --------
      userData = extractUserDataFromMeta();
      
      if (TEST_users.includes(userData.userId)) {
        //HideShowDivPixInter("show")
        adicionarBotaoDropdownAssinatura();
        loadCrisp();        
        //substituirHrefBotaoPDF()
      } else {
        customBillingDivs();
      }

      // ---- exibir opcao de PIX apenas para determinados usuarios
      // if (!PIX_TEST_users.includes(userData.userId)) {
      //   // ocultar botao PIX
      //   // HideShowDivPixInter("hide")
      // } else {
      //   // botão PIX não sera ocultado

      //   // ---- formatar a opcao de PIX para os usuarios (exceto o usuario da sumool)
      //   if (userData.userId !== "U000001") {
      //     formatarModalPix()
      //   }
      // }

      if (userData.userId !== "U000001") {
        formatarModalPix()
      }

      // -------------------------------

      if (userData?.remarks?.chat_bot === true) {
        loadCrisp();
      }

    }
  } catch (e) {
    console.error("[FlowAI] Error while checking iframe context. Possible cross-origin restriction.", e);
  }

  // add About Us
  
});
