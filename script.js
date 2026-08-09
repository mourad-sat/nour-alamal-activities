const SUPABASE_URL='https://eabplnfgisdnlylwqrkb.supabase.co';
const SUPABASE_KEY='sb_publishable_Z7p9pwNVhzehV_ebSTMGCA_S0szQ4yF';
const headers={apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`};
const categoryLabels={education:'تربية',training:'تكوين',digital:'رقمنة',community:'مجتمعي'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
let activities=[],posts=[],programs=[],activityFilter='all',activityLimit=6;

async function api(path,{timeout=9000,...options}={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const res=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{headers:{...headers,...(options.headers||{})},...options,signal:controller.signal});
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    if(res.status===204)return null;
    const text=await res.text();return text?JSON.parse(text):null;
  }finally{clearTimeout(timer)}
}

function setStat(name,value){const el=document.querySelector(`[data-stat="${name}"]`);if(el)el.textContent=Number(value)||0}
function localDate(value){if(!value)return 'نشاط مستمر';try{return new Date(`${value}T12:00:00`).toLocaleDateString('ar-MA',{year:'numeric',month:'short',day:'numeric'})}catch{return value}}
function publishedDate(value){if(!value)return '';try{return new Date(value).toLocaleDateString('ar-MA',{year:'numeric',month:'long',day:'numeric'})}catch{return ''}}
function empty(message){return `<div class="empty-state">${esc(message)}</div>`}

function setupNavigation(){
  const menu=$('menu'),nav=$('navlinks');if(!menu||!nav)return;
  const close=()=>{nav.classList.remove('open');document.body.classList.remove('menu-open');menu.setAttribute('aria-expanded','false')};
  menu.addEventListener('click',()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);document.body.classList.toggle('menu-open',open);menu.setAttribute('aria-expanded',String(open))});
  nav.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('click',e=>{if(window.innerWidth>850||!nav.classList.contains('open'))return;if(e.target.closest('#navlinks')||e.target.closest('#menu'))return;close()});
  window.addEventListener('resize',()=>{if(window.innerWidth>850)close()},{passive:true});
  const links=[...nav.querySelectorAll('a[href^="#"]')];
  const sections=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if('IntersectionObserver'in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${entry.target.id}`))}),{rootMargin:'-35% 0px -55%',threshold:0});
    sections.forEach(s=>observer.observe(s));
  }
}

function setupChrome(){
  const header=document.querySelector('.site-header'),top=$('backToTop');
  const onScroll=()=>{const y=window.scrollY;header?.classList.toggle('scrolled',y>15);top?.classList.toggle('show',y>550)};
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  top?.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  const year=$('year');if(year)year.textContent=new Date().getFullYear();
}

function setupReveal(){
  const nodes=document.querySelectorAll('.reveal');
  if(!('IntersectionObserver'in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){nodes.forEach(n=>n.classList.add('visible'));return}
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.12});
  nodes.forEach(n=>observer.observe(n));
}

function renderPrograms(){
  const box=$('programGrid');if(!box)return;
  if(!programs.length){box.innerHTML=empty('لا توجد برامج منشورة حالياً.');setStat('programs',0);setStat('tracks',0);return}
  setStat('programs',programs.length);
  const tracks=programs.reduce((sum,p)=>sum+(Array.isArray(p.highlights)?p.highlights.length:0),0);setStat('tracks',tracks);
  box.innerHTML=programs.map(p=>`<article class="program-card ${p.featured?'featured':''}">${p.image_url?`<div class="program-card-image"><img src="${esc(p.image_url)}" alt="" loading="lazy"></div>`:''}<div class="program-card-content"><span class="program-icon" aria-hidden="true">${esc(p.icon||'✨')}</span><span class="program-label">${esc(p.label||'برنامج')}</span><h3>${esc(p.title)}</h3><p>${esc(p.description||'')}</p>${Array.isArray(p.highlights)&&p.highlights.length?`<ul class="program-highlights">${p.highlights.map(h=>`<li>${esc(h)}</li>`).join('')}</ul>`:''}</div></article>`).join('');
}

async function loadPrograms(){
  try{programs=await api('programs?select=id,title,label,description,icon,highlights,image_url,featured,sort_order&published=eq.true&order=sort_order.asc,created_at.asc')||[]}catch(err){console.error('programs',err);programs=[]}renderPrograms();
}

function filteredActivities(){return activityFilter==='all'?activities:activities.filter(a=>a.category===activityFilter)}
function renderActivities(){
  const box=$('activityGrid'),more=$('activityMore');if(!box)return;
  const all=filteredActivities(),shown=all.slice(0,activityLimit);setStat('activities',activities.length);
  if(!shown.length){box.innerHTML=empty('لا توجد أنشطة منشورة في هذا التصنيف حالياً.');more?.classList.add('hidden');return}
  box.innerHTML=shown.map(a=>`<article class="activity-card"><div class="activity-media ${a.image_url?'':'no-image'}">${a.image_url?`<img src="${esc(a.image_url)}" alt="${esc(a.title)}" loading="lazy">`:'<span aria-hidden="true">✦</span>'}</div><div class="activity-body"><div class="activity-meta"><span class="activity-type">${esc(categoryLabels[a.category]||'نشاط')}</span><span>${esc(localDate(a.activity_date))}</span></div><h3>${esc(a.title)}</h3><p>${esc(a.description||'')}</p></div></article>`).join('');
  more?.classList.toggle('hidden',shown.length>=all.length);if(more)more.textContent=`عرض المزيد (${all.length-shown.length})`;
}

async function loadActivities(){
  try{activities=await api('activities?select=id,title,description,category,activity_date,image_url,sort_order&published=eq.true&order=sort_order.asc,created_at.desc')||[]}
  catch(err){console.error('activities',err);try{const res=await fetch('data/activities.json');const rows=await res.json();activities=rows.map((x,i)=>({id:`local-${i}`,title:x.title,description:x.description,category:x.category,activity_date:null,image_url:x.image}))}catch{activities=[]}}
  renderActivities();
}

function setupActivityControls(){
  $('filters')?.addEventListener('click',e=>{const b=e.target.closest('button[data-filter]');if(!b)return;activityFilter=b.dataset.filter;activityLimit=6;document.querySelectorAll('#filters button').forEach(x=>x.classList.toggle('active',x===b));renderActivities()});
  $('activityMore')?.addEventListener('click',()=>{activityLimit+=6;renderActivities()});
}

function openNews(id){
  const post=posts.find(p=>String(p.id)===String(id)),dialog=$('newsDialog'),body=$('newsDialogBody');if(!post||!dialog||!body)return;
  body.innerHTML=`${post.image_url?`<img src="${esc(post.image_url)}" alt="${esc(post.title)}">`:''}<span class="dialog-meta">${esc(publishedDate(post.published_at))}</span><h2>${esc(post.title)}</h2><div class="dialog-content">${esc(post.content||post.excerpt||'')}</div>`;
  dialog.showModal();
}
function renderPosts(){
  const box=$('newsGrid');if(!box)return;setStat('posts',posts.length);
  if(!posts.length){box.innerHTML=empty('لا توجد مستجدات منشورة حالياً.');return}
  box.innerHTML=posts.slice(0,6).map(p=>`<article class="news-card">${p.image_url?`<div class="news-media"><img src="${esc(p.image_url)}" alt="${esc(p.title)}" loading="lazy"></div>`:''}<div class="news-body"><span class="news-date">${esc(publishedDate(p.published_at))}</span><h3>${esc(p.title)}</h3><p>${esc(p.excerpt||'')}</p>${p.content?`<button class="news-more" type="button" data-post-open="${p.id}">اقرأ المزيد ←</button>`:''}</div></article>`).join('');
}
async function loadPosts(){
  try{posts=await api('posts?select=id,title,excerpt,content,image_url,category,published_at&published=eq.true&order=published_at.desc')||[]}catch(err){console.error('posts',err);posts=[]}renderPosts();
}

function renderGallery(items){
  const box=$('galleryGrid');if(!box)return;
  if(!items.length){box.innerHTML='<div class="gallery-placeholder"><span>سيتم نشر صور الأنشطة هنا قريباً.</span></div>';return}
  box.innerHTML=items.slice(0,7).map((g,i)=>`<figure data-gallery-image="${esc(g.image_url)}" data-gallery-caption="${esc(g.title||'من أنشطة جمعية نور الأمل')}"><img src="${esc(g.image_url)}" alt="${esc(g.title||'صورة من أنشطة جمعية نور الأمل')}" loading="lazy"><figcaption>${esc(g.title||'من أنشطة جمعية نور الأمل')}</figcaption></figure>`).join('');
}
async function loadGallery(){
  let items=[];try{items=await api('gallery_items?select=id,title,image_url,sort_order&published=eq.true&order=sort_order.asc,created_at.desc')||[]}catch(err){console.error('gallery',err)}
  if(!items.length)items=activities.filter(a=>a.image_url).map(a=>({title:a.title,image_url:a.image_url}));renderGallery(items);
}

function meta(name,content,property=false){const selector=property?`meta[property="${name}"]`:`meta[name="${name}"]`;const el=document.querySelector(selector);if(el&&content)el.setAttribute('content',content)}
function applyBranding(map){
  if(map.logo_url)document.querySelectorAll('.site-logo').forEach(img=>img.src=map.logo_url);
  const badge=document.querySelector('.hero-badge');if(badge&&map.hero_badge)badge.textContent=map.hero_badge;
  const title=$('hero-title');if(title&&map.hero_title)title.textContent=map.hero_title;
  const text=document.querySelector('.hero-text');if(text&&map.hero_text)text.textContent=map.hero_text;
  const image=$('heroImage');if(image&&map.hero_image_url)image.src=map.hero_image_url;
}
function applyRegistration(map){
  const section=$('registration');if(!section)return;const open=map.registration_open!=='false';section.dataset.registrationOpen=String(open);
  const badge=section.querySelector('.registration-badge'),year=section.querySelector('.registration-year'),title=section.querySelector('.registration-copy h2'),hookTitle=section.querySelector('.registration-hook strong'),hookText=section.querySelector('.registration-hook span'),description=section.querySelector('.registration-hook+p'),registerBtn=section.querySelector('.register-btn'),note=section.querySelector('.registration-note'),benefits=section.querySelector('.registration-benefits ul'),heroRegister=document.querySelector('.hero-register');
  if(badge)badge.textContent=open?'التسجيل مفتوح':'التسجيل مغلق حالياً';if(year&&map.registration_year)year.textContent=`الموسم الدراسي ${map.registration_year}`;if(title&&map.registration_title)title.textContent=map.registration_title;if(hookTitle&&map.registration_hook_title)hookTitle.textContent=map.registration_hook_title;if(hookText&&map.registration_hook_text)hookText.textContent=map.registration_hook_text;if(description&&map.registration_description)description.textContent=map.registration_description;if(note&&map.registration_note)note.textContent=map.registration_note;
  if(registerBtn){registerBtn.classList.toggle('hidden',!open);if(map.registration_link)registerBtn.href=map.registration_link}if(heroRegister){heroRegister.textContent=open?`التسجيل مفتوح ${map.registration_year||''}`.trim():'تعرف على البرنامج';heroRegister.href='#registration'}
  const phones=[map.registration_phone_1,map.registration_phone_2];section.querySelectorAll('.phone-btn').forEach((btn,i)=>{const p=phones[i]||'';btn.classList.toggle('hidden',!p);if(p){btn.textContent=p;btn.href=`tel:${p.replace(/[^+\d]/g,'')}`}});
  if(benefits&&map.registration_benefits){const icons=['📚','🛠️','🧭','💡','🤝','🌱'];const rows=map.registration_benefits.split(/\n+/).map(x=>x.trim()).filter(Boolean).map(x=>{const [title,...rest]=x.split('|');return{title:title.trim(),text:rest.join('|').trim()}});benefits.innerHTML=rows.map((b,i)=>`<li><span>${icons[i%icons.length]}</span><div><b>${esc(b.title)}</b><small>${esc(b.text)}</small></div></li>`).join('')}
}
function applyGeneralSettings(map){
  const aboutTitle=$('aboutTitle'),aboutText=$('aboutText'),impactTitle=$('impactTitle'),impactText=$('impactText');if(aboutTitle&&map.about_title)aboutTitle.textContent=map.about_title;if(aboutText&&map.about_text)aboutText.textContent=map.about_text;if(impactTitle&&map.impact_title)impactTitle.textContent=map.impact_title;if(impactText&&map.impact_text)impactText.textContent=map.impact_text;
  ['address','email','phone'].forEach(key=>{const row=document.querySelector(`[data-contact="${key}"]`),small=row?.querySelector('small'),value=map[key]?.trim();if(row)row.classList.toggle('hidden',!value);if(small&&value)small.textContent=value});
  const social=$('socialLinks');if(social){const links=[['facebook_url','Facebook'],['instagram_url','Instagram'],['youtube_url','YouTube'],['linkedin_url','LinkedIn']].filter(([key])=>map[key]);social.innerHTML=links.map(([key,label])=>`<a href="${esc(map[key])}" target="_blank" rel="noopener noreferrer">${label}</a>`).join('')}
  if(map.seo_title){document.title=map.seo_title;meta('og:title',map.seo_title,true);meta('twitter:title',map.seo_title)}if(map.seo_description){meta('description',map.seo_description);meta('og:description',map.seo_description,true);meta('twitter:description',map.seo_description)}
}
async function loadSettings(){try{const rows=await api('site_settings?select=key,value')||[];const map=Object.fromEntries(rows.map(x=>[x.key,x.value]));applyBranding(map);applyRegistration(map);applyGeneralSettings(map)}catch(err){console.error('settings',err)}}

function setupContactForm(){
  const form=$('contactForm');if(!form)return;
  form.addEventListener('submit',async e=>{e.preventDefault();const note=$('formNote'),button=form.querySelector('button[type="submit"]'),data=new FormData(form);const payload={name:String(data.get('name')||'').trim(),email:String(data.get('email')||'').trim(),subject:String(data.get('subject')||'').trim(),message:String(data.get('message')||'').trim()};
    if(note)note.textContent='جارٍ إرسال الرسالة...';if(button)button.disabled=true;
    try{await api('contact_messages',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload)});form.reset();if(note)note.textContent='تم إرسال رسالتك بنجاح. شكراً لتواصلك معنا.'}
    catch(err){console.error('contact',err);if(note)note.textContent='تعذر إرسال الرسالة حالياً. حاول مرة أخرى بعد قليل.'}finally{if(button)button.disabled=false}
  });
}

function setupDialogs(){
  $('newsGrid')?.addEventListener('click',e=>{const b=e.target.closest('[data-post-open]');if(b)openNews(b.dataset.postOpen)});
  $('galleryGrid')?.addEventListener('click',e=>{const f=e.target.closest('[data-gallery-image]'),dialog=$('imageDialog');if(!f||!dialog)return;$('dialogImage').src=f.dataset.galleryImage;$('dialogImage').alt=f.dataset.galleryCaption||'';$('dialogCaption').textContent=f.dataset.galleryCaption||'';dialog.showModal()});
  document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('.dialog-close')?.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()})});
}

async function boot(){
  setupNavigation();setupChrome();setupReveal();setupActivityControls();setupContactForm();setupDialogs();
  await Promise.all([loadPrograms(),loadActivities(),loadPosts(),loadSettings()]);
  await loadGallery();
}
boot();