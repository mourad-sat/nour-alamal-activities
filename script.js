const menu=document.getElementById('menu');
const nav=document.getElementById('navlinks');
menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
const yearEl=document.getElementById('year');if(yearEl)yearEl.textContent=new Date().getFullYear();

const SUPABASE_URL='https://eabplnfgisdnlylwqrkb.supabase.co';
const SUPABASE_KEY='sb_publishable_Z7p9pwNVhzehV_ebSTMGCA_S0szQ4yF';
const headers={apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`};
const labels={education:'تربية',training:'تكوين',digital:'رقمنة',community:'مجتمعي'};
const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
let activities=[];

function activityDate(a){return a.activity_date?new Date(a.activity_date+'T12:00:00').toLocaleDateString('ar-MA'):'نشاط مستمر'}
function renderActivities(filter='all'){
  const grid=document.getElementById('activityGrid');if(!grid)return;
  const list=filter==='all'?activities:activities.filter(x=>x.category===filter);
  if(!list.length){grid.innerHTML='<div class="loading">لا توجد أنشطة في هذا التصنيف حالياً.</div>';return}
  grid.innerHTML=list.map(x=>`<article class="activity-card">${x.image_url?`<img src="${esc(x.image_url)}" alt="${esc(x.title)}" loading="lazy">`:''}<div class="activity-body"><div class="activity-meta"><span class="activity-type">${labels[x.category]||'نشاط'}</span><span>${activityDate(x)}</span></div><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p></div></article>`).join('');
}

async function loadActivities(){
  const grid=document.getElementById('activityGrid');if(!grid)return;
  try{
    const res=await fetch(`${SUPABASE_URL}/rest/v1/activities?select=id,title,description,category,activity_date,image_url,sort_order&published=eq.true&order=sort_order.asc,created_at.desc`,{headers});
    if(!res.ok)throw new Error('activities');
    activities=await res.json();
    renderActivities();
    const note=document.querySelector('#activities .head p');if(note)note.textContent='أنشطة الجمعية المنشورة والمحدّثة مباشرة من لوحة الإدارة.';
  }catch(e){
    console.error(e);
    fetch('data/activities.json').then(r=>r.json()).then(rows=>{activities=rows.map(x=>({title:x.title,description:x.description,category:x.category,activity_date:null,image_url:x.image}));renderActivities()}).catch(()=>{grid.innerHTML='<div class="loading">تعذر تحميل الأنشطة.</div>'});
  }
}

document.getElementById('filters')?.addEventListener('click',e=>{const b=e.target.closest('button[data-filter]');if(!b)return;document.querySelectorAll('#filters button').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderActivities(b.dataset.filter)});

async function loadPrograms(){
  const box=document.querySelector('#programs .programs');if(!box)return;
  try{
    const res=await fetch(`${SUPABASE_URL}/rest/v1/programs?select=id,title,label,description,icon,highlights,image_url,featured,sort_order&published=eq.true&order=sort_order.asc,created_at.asc`,{headers});
    if(!res.ok)throw new Error('programs');
    const programs=await res.json();
    if(!programs.length){box.innerHTML='<div class="loading">لا توجد برامج منشورة حالياً.</div>';return}
    box.innerHTML=programs.map(p=>`<article class="program ${p.featured?'featured':''}">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.title)}" loading="lazy" style="width:100%;height:160px;object-fit:cover;border-radius:16px;margin-bottom:14px">`:''}<span class="icon">${esc(p.icon||'✨')}</span><small>${esc(p.label||'برنامج')}</small><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>${Array.isArray(p.highlights)&&p.highlights.length?`<ul>${p.highlights.map(h=>`<li>${esc(h)}</li>`).join('')}</ul>`:''}</article>`).join('');
    const note=document.querySelector('#programs .head p');if(note)note.textContent='برامج الجمعية الحالية، ويمكن تحديثها وترتيبها مباشرة من لوحة الإدارة.';
  }catch(e){console.error(e)}
}

const counters=document.querySelectorAll('[data-count]');
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;const el=entry.target,target=Number(el.dataset.count);let n=0;const t=setInterval(()=>{n++;el.textContent=Math.min(n,target);if(n>=target)clearInterval(t)},70);observer.unobserve(el)}),{threshold:.6});
counters.forEach(x=>observer.observe(x));

const contactForm=document.getElementById('contactForm');
contactForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  const note=document.getElementById('formNote');
  const button=contactForm.querySelector('button[type="submit"]');
  const data=new FormData(contactForm);
  const payload={name:String(data.get('name')||'').trim(),email:String(data.get('email')||'').trim(),subject:String(data.get('subject')||'').trim(),message:String(data.get('message')||'').trim()};
  if(note)note.textContent='جارٍ إرسال الرسالة...';if(button)button.disabled=true;
  try{
    const res=await fetch(`${SUPABASE_URL}/rest/v1/contact_messages`,{method:'POST',headers:{...headers,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload)});
    if(!res.ok)throw new Error('send');
    contactForm.reset();if(note)note.textContent='تم إرسال رسالتك بنجاح. شكراً لتواصلك مع جمعية نور الأمل.';
  }catch(err){if(note)note.textContent='تعذر إرسال الرسالة حالياً. يرجى المحاولة مرة أخرى.'}
  finally{if(button)button.disabled=false}
});

async function loadPosts(){
  const box=document.querySelector('.news');if(!box)return;
  try{
    const res=await fetch(`${SUPABASE_URL}/rest/v1/posts?select=id,title,excerpt,image_url,category,published_at&published=eq.true&order=published_at.desc`,{headers});if(!res.ok)throw new Error('posts');
    const posts=await res.json();
    if(!posts.length){box.innerHTML='<article><small>لا توجد منشورات</small><h3>سيتم نشر المستجدات هنا</h3><p>يمكن للمدير إضافة أول منشور من لوحة الإدارة.</p></article>';return}
    box.innerHTML=posts.map(p=>`<article>${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.title)}" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:14px;margin-bottom:12px">`:''}<small>${new Date(p.published_at).toLocaleDateString('ar-MA')}</small><h3>${esc(p.title)}</h3><p>${esc(p.excerpt||'')}</p></article>`).join('');
  }catch(e){console.error(e)}
}

async function loadGallery(){
  const box=document.querySelector('#gallery .gallery');if(!box)return;
  try{
    const res=await fetch(`${SUPABASE_URL}/rest/v1/gallery_items?select=id,title,image_url,sort_order&published=eq.true&order=sort_order.asc,created_at.desc`,{headers});if(!res.ok)throw new Error('gallery');
    const items=await res.json();if(!items.length)return;
    box.innerHTML=items.map((g,i)=>`<figure class="${i===0?'big':''}"><img src="${esc(g.image_url)}" alt="${esc(g.title||'صورة من أنشطة الجمعية')}" loading="lazy"><figcaption>${esc(g.title||'من أنشطة جمعية نور الأمل')}</figcaption></figure>`).join('');
    const note=document.querySelector('#gallery .head p');if(note)note.textContent='صور حقيقية من أنشطة وبرامج الجمعية.';
  }catch(e){console.error(e)}
}

function applyBranding(map){
  if(map.logo_url){
    document.querySelectorAll('.brand').forEach(brand=>{
      const box=brand.querySelector('.logo');if(!box)return;
      const inFooter=!!brand.closest('footer');
      box.innerHTML=`<img src="${esc(map.logo_url)}" alt="شعار جمعية نور الأمل" style="width:100%;height:100%;object-fit:contain">`;
      box.style.width=inFooter?'220px':'150px';
      box.style.height=inFooter?'142px':'96px';
      box.style.background='transparent';
      box.style.boxShadow='none';
      box.style.borderRadius='0';
      box.style.flex='0 0 auto';
      const oldText=box.nextElementSibling;if(oldText)oldText.style.display='none';
    });
    const navWrap=document.querySelector('.header .nav');if(navWrap)navWrap.style.minHeight='104px';
  }
  const badge=document.querySelector('.hero .pill');if(badge&&map.hero_badge)badge.textContent=map.hero_badge;
  const title=document.querySelector('.hero h1');if(title&&map.hero_title)title.textContent=map.hero_title;
  const text=document.querySelector('.hero-grid > div > p');if(text&&map.hero_text)text.textContent=map.hero_text;
  const image=document.querySelector('.hero-card > img');if(image&&map.hero_image_url)image.src=map.hero_image_url;
}

function applyRegistration(map){
  const section=document.getElementById('registration');if(!section)return;
  const open=map.registration_open!=='false';
  const badge=section.querySelector('.registration-badge');
  const year=section.querySelector('.registration-year');
  const title=section.querySelector('.registration-copy > h2');
  const hookTitle=section.querySelector('.registration-hook strong');
  const hookText=section.querySelector('.registration-hook span');
  const description=section.querySelector('.registration-hook + p');
  const registerBtn=section.querySelector('.register-btn');
  const phoneBtns=section.querySelectorAll('.phone-btn');
  const note=section.querySelector('.registration-note');
  const benefits=section.querySelector('.registration-benefits ul');
  const heroRegister=document.querySelector('.hero .actions .primary');

  if(badge)badge.textContent=open?'📢 التسجيل مفتوح':'⏸️ التسجيل مغلق حالياً';
  if(year&&map.registration_year)year.textContent='الموسم الدراسي '+map.registration_year;
  if(title&&map.registration_title)title.textContent=map.registration_title;
  if(hookTitle&&map.registration_hook_title)hookTitle.textContent=map.registration_hook_title;
  if(hookText&&map.registration_hook_text)hookText.textContent=map.registration_hook_text;
  if(description&&map.registration_description)description.textContent=map.registration_description;
  if(note&&map.registration_note)note.innerHTML='🌱 '+esc(map.registration_note);

  if(registerBtn){
    registerBtn.style.display=open?'inline-flex':'none';
    if(map.registration_link)registerBtn.href=map.registration_link;
  }
  if(heroRegister){heroRegister.textContent=open?`التسجيل مفتوح ${map.registration_year||''}`.trim():'التسجيل مغلق حالياً';heroRegister.href='#registration'}

  const phones=[map.registration_phone_1,map.registration_phone_2];
  phoneBtns.forEach((btn,i)=>{
    const p=phones[i]||'';
    btn.style.display=p?'inline-flex':'none';
    if(p){btn.textContent='☎️ '+p;btn.href='tel:'+p.replace(/[^+\d]/g,'')}
  });

  if(benefits&&map.registration_benefits){
    const icons=['📚','🛠️','🧭','💡','🤝','🌱','🎯','🚀'];
    const rows=map.registration_benefits.split(/\n+/).map(x=>x.trim()).filter(Boolean).map(x=>{const parts=x.split('|');return {title:(parts.shift()||'').trim(),text:parts.join('|').trim()}});
    benefits.innerHTML=rows.map((b,i)=>`<li><span>${icons[i%icons.length]}</span><div><b>${esc(b.title)}</b><small>${esc(b.text)}</small></div></li>`).join('');
  }

  section.dataset.registrationOpen=String(open);
}

async function loadSettings(){
  try{
    const res=await fetch(`${SUPABASE_URL}/rest/v1/site_settings?select=key,value`,{headers});if(!res.ok)throw new Error('settings');
    const rows=await res.json();const map=Object.fromEntries(rows.map(x=>[x.key,x.value]));const items=document.querySelectorAll('#contact .contact-items > div small');
    if(items[0]&&map.address)items[0].textContent=map.address;if(items[1]&&map.email)items[1].textContent=map.email;if(items[2]&&map.phone)items[2].textContent=map.phone;
    const p=document.querySelector('#contact .contact-grid > div > p');if(p&&(map.address||map.email||map.phone))p.textContent='يسعدنا استقبال استفساراتكم ومقترحات التعاون والمشاركة في البرامج.';
    applyBranding(map);
    applyRegistration(map);
  }catch(e){console.error(e)}
}

Promise.all([loadPrograms(),loadActivities(),loadPosts(),loadGallery(),loadSettings()]);