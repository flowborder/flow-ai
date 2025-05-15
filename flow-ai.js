window.$crisp = [];
window.CRISP_WEBSITE_ID = "363388d0-4671-4c6e-b170-e680e2eaa9c3";
window.CRISP_RUNTIME_CONFIG = {
  lock_maximized       : false,  // permite maximizar e depois voltar
  lock_full_view       : false,   // permite abrir e fechar o overlay
  cross_origin_cookies : true
};

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
    frontCookie = '--empty--';
  }

  console.log("frontCookie pushed to Crisp Session");
  $crisp.push(["set", "session:data", ["frontCookie", frontCookie]]);

}]);

function crisp() {
  $crisp.push(["do", "chat:show"]);
}

window.addEventListener("load", function () {

  console.log("FlowAI Init: version 1.0")
  
});
