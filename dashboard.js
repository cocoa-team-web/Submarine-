import {createClient} from "https://esm.sh/@supabase/supabase-js@2.119.0";
const sb=createClient("https://xsziqfquzjbhhyjljiri.supabase.co","sb_publishable_1BaVIdvGj797tDCVzIb7TQ_eTa5ZAOs");
let me=null,profile=null;
const root=document.querySelector("#viewContent");
const toast=(m)=>{const t=document.querySelector("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2500)};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function shell(title,content){document.querySelector("#viewTitle").textContent=title;root.innerHTML=content;}
async function requireAdmin(){
 const {data,error}=await sb.auth.getUser();me=data.user;
 if(!me){shell("Вход администратора",`<div class="panel"><h3>Требуется авторизация</h3><p class="muted">Войди с аккаунта, которому владелец назначил роль admin или owner.</p><input id="email" placeholder="Email" class="field"><input id="password" type="password" placeholder="Пароль" class="field"><button class="primary" id="login">Войти</button><p class="muted">Публичная регистрация доступна в магазине. Админские права нельзя получить через регистрацию.</p></div>`);document.querySelector("#login").onclick=async()=>{const r=await sb.auth.signInWithPassword({email:document.querySelector("#email").value,password:document.querySelector("#password").value});if(r.error)toast(r.error.message);else location.reload();};return false;}
 const p=await sb.from("profiles").select("role,status,display_name").eq("id",me.id).single();profile=p.data;
 if(p.error||!profile||!["owner","admin"].includes(profile.role)||profile.status!=="active"){shell("Доступ запрещён",`<div class="panel"><h3>У аккаунта нет прав администратора</h3><p class="muted">Роль: {esc(profile?.role||"не назначена")}. Попроси владельца назначить права в Supabase.</p><button class="mini-btn" id="logout">Выйти</button></div>`);document.querySelector("#logout").onclick=()=>sb.auth.signOut().then(()=>location.reload());return false;}
 document.querySelector(".side-bottom b").textContent=profile.display_name||me.email;document.querySelector(".side-bottom small").textContent=profile.role==="owner"?"Владелец":"Администратор";
 return true;
}
function table(headers,rows){return `<table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")||`<tr><td colspan="${headers.length}">Нет данных</td></tr>`}</tbody></table>`;}
async function overview(){
 const [a,u,s]=await Promise.all([sb.from("apps").select("id",{count:"exact",head:true}),sb.from("profiles").select("id",{count:"exact",head:true}),sb.from("submissions").select("id",{count:"exact",head:true}).eq("status","pending")]);
 const {data:recent}=await sb.from("submissions").select("id,name,category,created_at").eq("status","pending").order("created_at",{ascending:false}).limit(5);
 shell("Обзор",`<div class="stats"><div class="stat"><small>Приложения</small><strong>${a.count??"—"}</strong></div><div class="stat"><small>Пользователи</small><strong>${u.count??"—"}</strong></div><div class="stat"><small>Заявки ожидают</small><strong>${s.count??"—"}</strong></div><div class="stat"><small>Текущая роль</small><strong style="font-size:19px">${esc(profile.role)}</strong></div></div><div class="panel"><div class="panel-head"><h3>Последние заявки</h3></div>${table(["ПРОЕКТ","КАТЕГОРИЯ","ДАТА"],(recent||[]).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.category)}</td><td>${new Date(x.created_at).toLocaleString("ru-RU")}</td></tr>`))}</div>`);
}
async function submissions(){
 const {data,error}=await sb.from("submissions").select("*").order("created_at",{ascending:false});
 if(error){toast(error.message);return;}
 shell("Заявки",`<div class="panel"><h3>Очередь модерации</h3>${table(["ПРОЕКТ","АВТОР","КАТЕГОРИЯ","СТАТУС","ДЕЙСТВИЯ"],(data||[]).map(x=>`<tr><td>${esc(x.name)}<small class="muted"><br>${esc(x.description.slice(0,100))}</small></td><td>${esc(x.user_id.slice(0,8))}</td><td>${esc(x.category)}</td><td><span class="status wait">${x.status}</span></td><td><button class="mini-btn" data-approve="${x.id}">Одобрить</button><button class="mini-btn" data-reject="${x.id}">Отклонить</button></td></tr>`))}</div>`);
 root.querySelectorAll("[data-approve]").forEach(b=>b.onclick=async()=>{
 const x=data.find(v=>v.id===b.dataset.approve);const slug=x.name.toLowerCase().replace(/[^a-z0-9а-яё]+/gi,"-").replace(/^-|-$/g,"")+"-"+x.id.slice(0,6);
 const ins=await sb.from("apps").insert({slug,name:x.name,description:x.description,category:x.category,platform:x.platform||[],external_url:x.external_url,file_path:x.file_path,developer_id:x.user_id,status:"published"});
 if(ins.error){toast(ins.error.message);return;}
 const upd=await sb.from("submissions").update({status:"approved",moderator_id:me.id,reviewed_at:new Date().toISOString()}).eq("id",x.id);
 if(upd.error)toast(upd.error.message);else{await audit("submission.approved","submission",x.id,{name:x.name});toast("Опубликовано");submissions();}
 });
 root.querySelectorAll("[data-reject]").forEach(b=>b.onclick=async()=>{const note=prompt("Причина отклонения:");if(note===null)return;const r=await sb.from("submissions").update({status:"rejected",moderator_id:me.id,moderator_note:note,reviewed_at:new Date().toISOString()}).eq("id",b.dataset.reject);if(r.error)toast(r.error.message);else{await audit("submission.rejected","submission",b.dataset.reject,{note});toast("Заявка отклонена");submissions();}});
}
async function projects(){
 const {data,error}=await sb.from("apps").select("*").order("created_at",{ascending:false});if(error){toast(error.message);return;}
 shell("Приложения",`<div class="panel"><h3>Управление каталогом</h3>${table(["НАЗВАНИЕ","КАТЕГОРИЯ","СТАТУС","ЗАГРУЗКИ","ДЕЙСТВИЯ"],(data||[]).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.category)}</td><td>${esc(x.status)}</td><td>${x.downloads}</td><td><button class="mini-btn" data-hide="${x.id}">Скрыть</button><button class="mini-btn" data-publish="${x.id}">Опубликовать</button><button class="mini-btn" data-block="${x.id}">Блок</button></td></tr>`))}</div>`);
 for(const [attr,status] of [["hide","hidden"],["publish","published"],["block","blocked"]])root.querySelectorAll(`[data-${attr}]`).forEach(b=>b.onclick=async()=>{const r=await sb.from("apps").update({status}).eq("id",b.dataset[attr]);if(r.error)toast(r.error.message);else{await audit("app."+status,"app",b.dataset[attr]);toast("Статус обновлён");projects();}});
}
async function users(){
 const {data,error}=await sb.from("profiles").select("id,username,display_name,role,status,created_at").order("created_at",{ascending:false});if(error){toast(error.message);return;}
 shell("Пользователи",`<div class="panel"><h3>Аккаунты</h3>${table(["ПОЛЬЗОВАТЕЛЬ","РОЛЬ","СТАТУС","ДЕЙСТВИЯ"],(data||[]).map(x=>`<tr><td>${esc(x.display_name||x.username||x.id.slice(0,8))}</td><td>${esc(x.role)}</td><td>${esc(x.status)}</td><td><button class="mini-btn" data-mute="${x.id}">Mute</button><button class="mini-btn" data-ban="${x.id}">Ban</button><button class="mini-btn" data-unban="${x.id}">Снять</button></td></tr>`))}</div>`);
 root.querySelectorAll("[data-mute]").forEach(b=>b.onclick=()=>moderateUser(b.dataset.mute,"muted","mute"));
 root.querySelectorAll("[data-ban]").forEach(b=>b.onclick=()=>moderateUser(b.dataset.ban,"banned","ban"));
 root.querySelectorAll("[data-unban]").forEach(b=>b.onclick=()=>moderateUser(b.dataset.unban,"active","unban"));
}
async function moderateUser(id,status,action){if(id===me.id){toast("Нельзя ограничить собственный аккаунт");return;}const reason=prompt("Причина:");if(reason===null)return;const r=await sb.from("profiles").update({status,ban_reason:status==="active"?null:reason}).eq("id",id);if(r.error)toast(r.error.message);else{await sb.from("moderation_actions").insert({target_type:"user",target_id:id,action,reason,actor_id:me.id});await audit("user."+action,"user",id,{reason});toast("Ограничение обновлено");users();}}
async function logs(){const {data,error}=await sb.from("audit_logs").select("*").order("created_at",{ascending:false}).limit(100);if(error){toast(error.message);return;}shell("Журнал действий",`<div class="panel"><h3>Последние 100 событий</h3>${table(["ДЕЙСТВИЕ","ТИП","ID","ДАТА"],(data||[]).map(x=>`<tr><td>${esc(x.action)}</td><td>${esc(x.entity_type)}</td><td>${esc(x.entity_id)}</td><td>${new Date(x.created_at).toLocaleString("ru-RU")}</td></tr>`))}</div>`);}
async function audit(action,type,id,details={}){await sb.from("audit_logs").insert({actor_id:me.id,action,entity_type:type,entity_id:String(id),details});}
const handlers={overview,apps:projects,requests:submissions,users,moderation:users,logs};
document.querySelectorAll(".side").forEach(a=>a.onclick=()=>{document.querySelectorAll(".side").forEach(x=>x.classList.toggle("active",x===a));(handlers[a.dataset.view]||overview)();});
if(await requireAdmin())await overview();
