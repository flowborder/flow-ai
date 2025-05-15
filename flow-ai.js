window.$crisp = [];
window.CRISP_WEBSITE_ID = "363388d0-4671-4c6e-b170-e680e2eaa9c3";
window.CRISP_RUNTIME_CONFIG = {
  lock_maximized       : false,  // permite maximizar e depois voltar
  lock_full_view       : true,   // permite abrir e fechar o overlay
  cross_origin_cookies : true
};

(function() {
  var d = document;
  var s = d.createElement("script");
  s.src = "https://client.crisp.chat/l.js";
  s.async = 1;
  d.getElementsByTagName("head")[0].appendChild(s);
})();

window.addEventListener("load", function () {

  console.log("FlowAI Init: version 1.0")

  setTimeout(function () {
    let frontCookie = document.cookie;
    if (frontCookie == '') {
      frontCookie = '--empty--';
    }

    $crisp.push(["set", "session:data", ["frontCookie", frontCookie]]);
  }, 3000);
});
