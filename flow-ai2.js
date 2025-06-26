
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

  const userId = getMetaValue('CRISP_EnterpriseCode');
  const userEmail = getMetaValue('CRISP_UserEmail');
  const fullName = getMetaValue('CRISP_UserName');
  const stripeSubscriptionId = getMetaValue('STRIPE_SubscriptionID');
  const flowToken = getMetaValue('FLOWTOKEN');

  const objReturn = {
    userId,
    fullName,
    userEmail,
    stripeSubscriptionId,
    flowToken
  };

  console.log(objReturn);
  return objReturn;
}

//************************************************
//  CARREGAR CRISP
//************************************************

const CRISP_allowedUsers = ["U022764", "U022933", "U022992", "U000001", "U023094"]

async function loadCrisp() {

  let frontCookie = getFrontCookie()
  let userDataForCrisp = ""
  //if (frontCookie !== "") {
    userDataForCrisp = extractUserDataFromMeta();
    window.CRISP_TOKEN_ID = userDataForCrisp.userId;  // o UUID gerado no backend
    $crisp.push(["set", "user:email", userDataForCrisp.userEmail]);
    $crisp.push(["set", "user:nickname", userDataForCrisp.fullName + " (" + userDataForCrisp.userId + ")"]);
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

    console.log("Crisp Loaded");

     observeCrispMessages()

    // PERSISTE A SESSÃO COM BASE NO USER ID DA SUMOOL
    if (frontCookie !== "") {

      console.log("trying to push user_id to Crisp Session");
      $crisp.push(["set", "session:data", ["user_id", userDataForCrisp.userId]]);
      console.log("pushed " + userDataForCrisp.userId + "successful");


      //guicortei@gmail.com -> U022764
      //maluco@maluco.com -> U022933
      //flowborder@flowborder.com -> U022992
      //ccc@qq.com -> U000001 (login dos devs china)
      
      if (!CRISP_allowedUsers.includes(userDataForCrisp.userId)) {
        console.log("Hidding Crisp, type crisp() to show Crisp");
        $crisp.push(["do", "chat:hide"]);
      } else {
        HideShowDivUseePay("show")
      }

      // ENVIA O COOKIE PARA O MAKE
      const payload = {
        user_id_sumool: userDataForCrisp.userId || "",
        session_id: session_id || "",
        cookie: frontCookie || "",
        user_name_sumool:  userDataForCrisp.fullName || ""
      };
      console.log(payload)

      fetch("https://hook.us2.make.com/2cqv7guv1oq8353nipfwtrvrfkwtzbjy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then(response => console.log("Webhook Cookie enviado com sucesso"))
        .catch(error => console.error("Erro ao enviar para o Webhook Cookie:", error));

    }

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

function HideShowDivUseePay(acao) {
  try {
    const targetSrc = "/ClientContent/images/Billing/useepay.png";
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
//************************************************
//    🔴🔴🔴🔴🔴  EVENTO ON LOAD  🔴🔴🔴🔴🔴
//************************************************
//************************************************

window.addEventListener("load", function () {

  console.log("[FlowAI] Script injected successfully.");

  try {
    if (window.self !== window.top) {
      console.log("[FlowAI] Detected execution within an iframe. Initialization skipped.");
    } else {

      HideShowDivUseePay("hide")
      addAboutUsMenu();
      enableFloatingPendingPayment();
      
      console.log("[FlowAI] Starting initialization...");
      loadCrisp();
      console.log("[FlowAI] Initialization completed successfully.");
    }
  } catch (e) {
    console.error("[FlowAI] Error while checking iframe context. Possible cross-origin restriction.", e);
  }

  // add About Us
  
});
