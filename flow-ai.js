
window.$crisp = [];
window.CRISP_WEBSITE_ID = "363388d0-4671-4c6e-b170-e680e2eaa9c3";
window.CRISP_RUNTIME_CONFIG = {
  lock_maximized       : false,  // permite maximizar e depois voltar
  lock_full_view       : false,   // permite abrir e fechar o overlay
  cross_origin_cookies : true,
  session_merge: false
};

function getFrontCookie() {
  let frontCookie = document.cookie;
  //console.log("frontCookie="+frontCookie)
  if (frontCookie === '') {
    frontCookie = "";
  }
  return frontCookie
}

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
  const lastName  = doc.querySelector('#lastName')?.value.trim()  || '';
  const fullName  = `${firstName} ${lastName}`.trim();

  // Captura os inputs desabilitados da última seção (ID e email login)
  const disabledInputs = Array.from(
    doc.querySelectorAll('#divBasic .col-sm-4 input[disabled]')
  );
  const userId    = disabledInputs[0]?.value.trim() || '';
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

(async function() {

  let frontCookie = getFrontCookie()
  let userDataForCrisp = ""
  if (frontCookie !== "") {
    userDataForCrisp = await fetchAndExtractUserData(frontCookie);
    window.CRISP_TOKEN_ID   = userDataForCrisp.userId;  // o UUID gerado no backend
    $crisp.push(["set", "user:email", userDataForCrisp.userEmail]);
    $crisp.push(["set", "user:nickname", userDataForCrisp.fullName + " ("+userDataForCrisp.userId+")"]);
  }
  console.log(userDataForCrisp);

  (function() {
    var d = document;
    var s = d.createElement("script");
    s.src = "https://client.crisp.chat/l.js";
    s.async = 1;
    d.getElementsByTagName("head")[0].appendChild(s);
  })();

  $crisp.push(["on", "session:loaded", function (session_id) {

    console.log("Crisp Loaded");

    // PERSISTE A SESSÃO COM BASE NO USER ID DA SUMOOL
    if (frontCookie !== "") {
      
      console.log("trying to push user_id to Crisp Session");
      $crisp.push(["set", "session:data", ["user_id", userDataForCrisp.userId]]);
      console.log("pushed "+userDataForCrisp.userId + "successful");

      const allowedUsers = ["U022764", "U022933"]
      if (!allowedUsers.includes(userDataForCrisp.userId)) {
        console.log("Hidding Crisp, type crisp() to show Crisp");
        $crisp.push(["do", "chat:hide"]);
      } 

      // ENVIA O COOKIE PARA O MAKE
      const payload = {
        user_id_sumool: userDataForCrisp.userId || "",
        session_id: session_id || "",
        cookie: frontCookie || ""
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

})();

function crisp() {
  $crisp.push(["do", "chat:show"]);
}

window.addEventListener("load", function () {
  console.log("FlowAI Init: version 1.01")
});
