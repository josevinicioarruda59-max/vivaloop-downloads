(() => {
  const API="https://gbtugrphydobkpzujizm.supabase.co/functions/v1/vivaloop-push";
  const $=id=>document.getElementById(id), status=$("status");
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
  const standalone=()=>matchMedia("(display-mode: standalone)").matches || navigator.standalone===true;
  const support=()=>("serviceWorker" in navigator && "PushManager" in window && "Notification" in window);
  $("installHelp").hidden=!ios || standalone();
  function pairFrom(value) {
    try {
      const url=new URL(value,location.href);
      if(url.origin!==location.origin || url.pathname!==location.pathname)return "";
      const pair=new URLSearchParams(url.hash.slice(1)).get("p")||"";
      return /^[a-f0-9]{64}$/.test(pair)?pair:"";
    }catch{return "";}
  }
  const incoming=pairFrom(location.href);
  if(incoming) { try{localStorage.setItem("vivaloop-push-link",location.href);}catch{} }
  try { $("pairLink").value=incoming?location.href:localStorage.getItem("vivaloop-push-link")||""; }catch{}
  let registration;
  const ready=support()?navigator.serviceWorker.register("sw.js").then(()=>navigator.serviceWorker.ready).then(r=>{
    registration=r; return r.pushManager.getSubscription();
  }).then(s=>{if(s)$("disable").hidden=false;return registration;}).catch(()=>null):Promise.resolve(null);
  if(!support()) status.textContent=ios&&!standalone()?"Adicione esta página à Tela de Início e abra pelo ícone."
    :"Este navegador não oferece notificações Web Push. Use um navegador compatível no celular.";
  const decode=value=>Uint8Array.from(atob(value.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-value.length%4)%4)),c=>c.charCodeAt(0));
  $("activateForm").addEventListener("submit",async event=>{
    event.preventDefault();
    const pairSecret=pairFrom($("pairLink").value.trim());
    const email=$("email").value.trim().toLowerCase(), licenseKey=$("licenseKey").value.trim().toUpperCase();
    if(!pairSecret){status.textContent="Cole um link válido gerado na aba Logs do VivaLoop.";return;}
    if(!/^VL-[A-F0-9]{64}$/.test(licenseKey)){status.textContent="Confira a chave completa da sua licença.";return;}
    if(ios&&!standalone()){status.textContent="No iPhone/iPad, abra primeiro pelo ícone adicionado à Tela de Início.";return;}
    if(!support()){status.textContent="Este navegador não suporta notificações.";return;}
    $("activate").disabled=true;
    try{
      // Must be invoked directly in the user's click/submit gesture on Safari.
      const permission=Notification.permission==="granted"?"granted":await Notification.requestPermission();
      if(permission!=="granted")throw Error("Permita as notificações nas configurações deste navegador e tente novamente.");
      const r=await ready;
      if(!r)throw Error("Não foi possível preparar as notificações. Reabra a página e tente novamente.");
      status.textContent="Conectando este celular…";
      const configResponse=await fetch(API+"/config",{cache:"no-store",signal:AbortSignal.timeout(15000)});
      const config=await configResponse.json();
      if(!configResponse.ok||!config.ok)throw Error("Serviço indisponível. Tente novamente.");
      const subscription=await r.pushManager.getSubscription() || await r.pushManager.subscribe({
        userVisibleOnly:true,applicationServerKey:decode(config.publicKey),
      });
      $("disable").hidden=false;
      const response=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"subscribe",pairSecret,email,licenseKey,subscription:subscription.toJSON()}),
        signal:AbortSignal.timeout(20000)});
      const result=await response.json();
      if(!response.ok||!result.ok)throw Error(result.error||"Não foi possível vincular o celular.");
      status.textContent="✅ Celular vinculado! No computador, abra Logs e clique em Testar push para conferir a entrega.";
      try{localStorage.removeItem("vivaloop-push-link");}catch{}
      $("pairLink").value="";history.replaceState(null,"",location.pathname);
    }catch(error){status.textContent="⚠️ "+(error.name==="AbortError"||error.name==="TimeoutError"?"A conexão demorou. Confira a internet e tente novamente.":error.message);}
    finally{$("licenseKey").value="";$("activate").disabled=false;}
  });
  $("disable").addEventListener("click",async()=>{
    try{
      const r=await ready, subscription=await r?.pushManager.getSubscription();
      if(subscription && !await subscription.unsubscribe())throw Error();
      $("disable").hidden=true;status.textContent="Notificações desativadas neste celular.";
    }catch{status.textContent="Não foi possível desativar. Use as configurações de notificações do navegador.";}
  });
})();
