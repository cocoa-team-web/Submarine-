import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.0";
const supabase=createClient("https://xsziqfquzjbhhyjljiri.supabase.co","sb_publishable_1BaVIdvGj797tDCVzIb7TQ_eTa5ZAOs");
let currentUser=null,cat="Все";
const fallback=[
{name:"Nebula Runner",category:"Игры",icon:"✦",developer:"Orbit Studio",rating:4.9,description:"Динамичный аркадный раннер с неоновыми мирами.",platform:["Android"],version:"1.2",downloads:12400},
{name:"Pixel Forge",category:"Инструменты",icon:"▧",developer:"Cocoa Team",rating:4.8,description:"Создавай пиксельную графику и собирай спрайты.",platform:["Windows"],version:"2.0",downloads:8100},
{name:"Wave Player",category:"Мультимедиа",icon:"♫",developer:"Sound Lab",rating:4.7,description:"Музыкальный плеер с плейлистами и эквалайзером.",platform:["Android"],version:"1.4",downloads:6700}
];
let apps=[];
const cards=document.querySelector("#cards");
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function draw(){
 const q=(document.querySelector("#search")?.value||"").toLowerCase();
 const list=apps.filter(a=>(cat==="Все"||a.category===cat)&&[a.name,a.description,a.developer].join(" ").toLowerCase().includes(q));
 cards.innerHTML=list.map(a=>`<article class="app-card"><div class="app-top"><div class="app-icon">{escapeHtml(a.icon||"⬡")}</div><div><h3>{escapeHtml(a.name)}</h3><small>{escapeHtml(a.developer||"Submarine developer")}</small></div><span class="rating">★ {Number(a.rating||0).toFixed(1)}</span></div><p>{escapeHtml(a.description||a.tagline||"")}</p><div class="tags">{(a.platform||[]).map(t=>`<span class="tag">{escapeHtml(t)}</span>`).join("")}<span class="tag">{escapeHtml(a.category)}</span></div><div class="card-foot"><span>{Number(a.downloads||0).toLocaleString("ru-RU")} загрузок</span><button class="download" data-id="{a.id||""}" data-url="{escapeHtml(a.external_url||"")}" data-path="{escapeHtml(a.file_path||"")}">Скачать ↓</button></div></article>`).join("")||'<p class="muted">Приложений пока нет. Попробуй другой запрос.</p>';
 cards.querySelectorAll(".download").forEach(b=>b.onclick=async()=>{
   if(b.dataset.url){window.open(b.dataset.url,"_blank","noopener");return;}
   if(b.dataset.path){const {data,error}=await supabase.storage.from("submarine-files").createSignedUrl(b.dataset.path,90);if(error)alert(error.message);else window.open(data.signedUrl,"_blank","noopener");}
   else alert("Файл ещё не добавлен.");
 });
}
async function loadApps(){
 const {data,error}=await supabase.from("apps").select("*").eq("status","published").order("created_at",{ascending:false});
 if(error){console.warn(error);apps=fallback;}else apps=data||[];
 draw();
}
async function updateAuth(){
 const {data}=await supabase.auth.getSession();currentUser=data.session?.user||null;
 document.querySelector("#authBtn").textContent=currentUser?"Выйти":"Войти";
 document.querySelector("#userBadge").textContent=(currentUser?.email||"G")[0].toUpperCase();
}
document.querySelector("#authBtn").onclick=async()=>{
 if(currentUser){await supabase.auth.signOut();await updateAuth();return;}
 const email=prompt("Email для входа или регистрации:");if(!email)return;
 const password=prompt("Пароль (минимум 6 символов):");if(!password)return;
 let r=await supabase.auth.signInWithPassword({email,password});
 if(r.error){const s=await supabase.auth.signUp({email,password});if(s.error)alert(s.error.message);else alert("Аккаунт создан. Подтверди email, если включено подтверждение.");}
 await updateAuth();
};
document.querySelector("#search").addEventListener("input",draw);
document.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{document.querySelectorAll(".chip").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");cat=b.dataset.cat;draw();});
const modal=document.querySelector("#modal");
["submitBtn","submitBtn2"].forEach(id=>document.getElementById(id).onclick=()=>{if(!currentUser){alert("Сначала войди в аккаунт.");return;}modal.classList.remove("hidden");});
document.querySelector("#close").onclick=()=>modal.classList.add("hidden");
document.querySelector("#send").onclick=async()=>{
 if(!currentUser) return;
 const fields=modal.querySelectorAll("input,select,textarea"),name=fields[0].value.trim(),external_url=fields[1].value.trim(),category=fields[2].value,description=fields[3].value.trim();
 if(!name||!external_url||!description){alert("Заполни название, ссылку и описание.");return;}
 const {error}=await supabase.from("submissions").insert({user_id:currentUser.id,name,external_url,category,description});
 if(error)alert(error.message);else{document.querySelector("#notice").textContent="Заявка отправлена на проверку.";fields.forEach(f=>f.value="");}
};
supabase.auth.onAuthStateChange(()=>updateAuth());
await updateAuth();await loadApps();
