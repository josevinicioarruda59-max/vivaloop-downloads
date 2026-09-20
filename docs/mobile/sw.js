self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("push",event=>{
  let data={};try{data=event.data?.json()||{};}catch{}
  event.waitUntil(self.registration.showNotification(String(data.title||"VivaLoop").slice(0,120),{
    body:String(data.body||"Há uma atualização da sua live.").slice(0,600),
    icon:"icon.svg",badge:"icon.svg",
  }));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const url=new URL("./",self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({type:"window"}).then(clients=>{
    const client=clients.find(c=>c.url.startsWith(self.registration.scope));
    return client?client.focus():self.clients.openWindow(url);
  }));
});
