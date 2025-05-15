window.$crisp = [];
window.CRISP_WEBSITE_ID = "363388d0-4671-4c6e-b170-e680e2eaa9c3";
window.CRISP_RUNTIME_CONFIG = {
  lock_maximized       : false,  // permite maximizar e depois voltar
  lock_full_view       : false,   // permite abrir e fechar o overlay
  cross_origin_cookies : true,
  session_merge: true
};

function getFrontCookie() {
  let frontCookie = document.cookie;
  console.log("frontCookie="+frontCookie)
  if (frontCookie === '') {
    frontCookie = "__system_environment__=https://app.flowborder.com; __user_state_cookie__=huss22dL9qOeWHptx3rL7vYxYMSZ2tBSk2ypdjvK+daDjYqLu/+Syv7Ylk2GiOVqczRLooLEMwb5UllOtkwLkxsDmJ2dODETGue7BHeeN13vRRa+6Vu6KhZ+3qjoyx6hhOzmv1e1bi5AhZe5Hy0EGiag28kurHsTZdOkrpLR2J6uGmFQQp4i7i9BnKcefPQR3HlY4V/UyRqvE6fLFhKdXDYEe98vkAMgY/OjtgtzO1SR11LIqNHkmiH3BBzWQMJf0hiBVYeFsHWCpZ/rOuDL1q+/SQOruRVtdYDliZL1oWnvYYsXBFH6GXGcATeF1OUkKWtUDTBseF2KzLipw2RMLOyzwhqFZBvIuj9H+QWUO0vzAqOP7qSey4/eazxGNwHsxI7cCJSkCaR+bbRSQSIbssSIijiF+6tP60eDxv2I+8YXyA9hFmz9EFoE7RnZyqk4TmwLttJfOIOLqyHBueswxTpG0GGy2QsRtZIDLt+JHh05J7mgpYEc+AjoX10aO9qPNAhLCfmWOZYM4MHJiIySJlOI3WOJCGqkDsEX9g==";
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

  console.log({
    userId,
    fullName,
    userEmail
  });

  // Se quiser continuar seu código aqui com base nesses dados:
  // ex: iniciar Crisp, popular campos etc.
}

userDataForCrisp = fetchAndExtractUserData(getFrontCookie());
console.log(userDataForCrisp)

window.CRISP_TOKEN_ID   = userDataForCrisp.userId;  // o UUID gerado no backend

$crisp.push(["set", "user:email", userDataForCrisp.userEmail]);
$crisp.push(["set", "user:nickname", userDataForCrisp.fullName + " ("+userDataForCrisp.userId+")"]);

(function() {
  var d = document;
  var s = d.createElement("script");
  s.src = "https://client.crisp.chat/l.js";
  s.async = 1;
  d.getElementsByTagName("head")[0].appendChild(s);
})();


$crisp.push(["on", "session:loaded", function () {

  console.log("Crisp Loaded");

  $crisp.push(["do", "chat:hide"]);
  console.log("Crisp is Hidden, type crisp() to show Crisp");
  
  let frontCookie = document.cookie;
  console.log("frontCookie="+frontCookie)
  if (frontCookie === '') {
    frontCookie = "__system_environment__=https://app.flowborder.com; __user_state_cookie__=huss22dL9qOeWHptx3rL7vYxYMSZ2tBSk2ypdjvK+daDjYqLu/+Syv7Ylk2GiOVqczRLooLEMwb5UllOtkwLkxsDmJ2dODETGue7BHeeN13vRRa+6Vu6KhZ+3qjoyx6hhOzmv1e1bi5AhZe5Hy0EGiag28kurHsTZdOkrpLR2J6uGmFQQp4i7i9BnKcefPQR3HlY4V/UyRqvE6fLFhKdXDYEe98vkAMgY/OjtgtzO1SR11LIqNHkmiH3BBzWQMJf0hiBVYeFsHWCpZ/rOuDL1q+/SQOruRVtdYDliZL1oWnvYYsXBFH6GXGcATeF1OUkKWtUDTBseF2KzLipw2RMLOyzwhqFZBvIuj9H+QWUO0vzAqOP7qSey4/eazxGNwHsxI7cCJSkCaR+bbRSQSIbssSIijiF+6tP60eDxv2I+8YXyA9hFmz9EFoE7RnZyqk4TmwLttJfOIOLqyHBueswxTpG0GGy2QsRtZIDLt+JHh05J7mgpYEc+AjoX10aO9qPNAhLCfmWOZYM4MHJiIySJlOI3WOJCGqkDsEX9g==";
  }

  console.log("trying to push user_id to Crisp Session");
  $crisp.push(["set", "session:data", ["user_id", userDataForCrisp.userId]]);
  console.log("pushed: "+userDataForCrisp.userId);

}]);

function crisp() {
  $crisp.push(["do", "chat:show"]);
}

window.addEventListener("load", function () {

  console.log("FlowAI Init: version 1.0")
  
});
