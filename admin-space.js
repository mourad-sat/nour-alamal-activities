(function(){
  const space=document.body.dataset.adminSpace;
  if(!space)return;
  const roleLabels={super_admin:'مدير عام',treasurer:'أمين المال',reports_manager:'مسؤول التقارير',content_manager:'مسؤول المحتوى'};
  const websiteRoles=new Set(['super_admin','content_manager']);
  let profile=null;

  function addStyles(){if(document.getElementById('adminSpaceStyles'))return;const s=document.createElement('style');s.id='adminSpaceStyles';s.textContent=`
    .space-nav{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.space-nav a{font-size:11px;padding:7px 10px;border-radius:10px;background:#e8f2f0;color:#174943;text-decoration:none;font-weight:800}.space-nav a.current{background:#0f766e;color:white}.workspace-role{display:inline-flex;margin-top:7px;padding:5px 10px;border-radius:999px;background:#eaf5f3;color:#0f766e;font-size:10px;font-weight:800}
    .web-dash-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:15px 0}.web-dash-card{border:1px solid #dce8e6;border-radius:16px;background:#fff;padding:15px}.web-dash-card span{font-size:10px;color:#718682;display:block}.web-dash-card b{font-size:23px;color:#0f766e;display:block;margin-top:5px}.web-quick{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.web-quick button{text-align:right;min-height:92px;padding:14px}.web-quick button strong{display:block;margin-bottom:4px}.web-quick button small{font-weight:400;opacity:.82}.workspace-denied{max-width:720px;margin:35px auto;text-align:center}
    @media(max-width:900px){.web-dash-grid{grid-template-columns:repeat(2,1fr)}.web-quick{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){.web-dash-grid,.web-quick{grid-template-columns:1fr}}
  `;document.head.appendChild(s)}

  function updateChrome(){
    document.title=(space==='association'?'تدبير الجمعية':'تدبير الموقع')+' | جمعية نور الأمل';
    const strong=document.querySelector('.topbar strong');if(strong)strong.textContent=space==='association'?'تدبير جمعية نور الأمل':'تدبير الموقع الإلكتروني';
    const head=document.querySelector('.admin-head>div');if(head){const badge=head.querySelector('.badge');const h1=head.querySelector('h1');const p=head.querySelector('p');if(badge)badge.textContent=space==='association'?'الإدارة الداخلية':'إدارة الواجهة العامة';if(h1)h1.textContent=space==='association'?'تدبير الجمعية':'تدبير الموقع الإلكتروني';if(p)p.textContent=space==='association'?'البرامج والبطاقات والتقارير والمهام والمالية والحكامة في مساحة داخلية واحدة.':'المنشورات والبرامج والصور والتسجيل والرسائل وهوية الموقع في مساحة مخصصة للنشر.';if(profile&&!head.querySelector('.workspace-role')){const chip=document.createElement('span');chip.className='workspace-role';chip.textContent=`الصلاحية: ${roleLabels[profile.role]||profile.role}`;head.appendChild(chip)}}
    const top=document.querySelector('.topbar .wrap');if(top&&!top.querySelector('.space-nav')){const nav=document.createElement('nav');nav.className='space-nav';nav.innerHTML=`<a href="admin.html">بوابة الإدارة</a><a href="association-admin.html" class="${space==='association'?'current':''}">تدبير الجمعية</a>${profile&&websiteRoles.has(profile.role)?`<a href="website-admin.html" class="${space==='website'?'current':''}">تدبير الموقع</a>`:''}`;const logout=document.getElementById('logoutBtn');top.insertBefore(nav,logout||null)}
  }

  function buildWebsiteDashboard(){
    if(space!=='website'||document.getElementById('websiteDashboardPanel'))return;
    const tabs=document.getElementById('tabs'),adminView=document.getElementById('adminView');if(!tabs||!adminView)return;
    const tab=document.createElement('button');tab.dataset.tab='website-dashboard';tab.textContent='الرئيسية';tabs.prepend(tab);
    const panel=document.createElement('section');panel.id='websiteDashboardPanel';panel.className='tab-panel hidden';panel.dataset.panel='website-dashboard';panel.innerHTML=`<div class="content-stack"><section class="panel"><div class="list-head"><div><span class="badge">الموقع الإلكتروني</span><h2>لوحة تدبير الموقع</h2><p>ملخص سريع للمحتوى والرسائل والعناصر المنشورة.</p></div><button id="webDashRefresh" type="button" class="secondary">تحديث</button></div><div id="webDashStats" class="web-dash-grid"><div class="web-dash-card"><span>المنشورات</span><b>—</b></div></div></section><section class="panel"><h2>إجراءات سريعة</h2><div class="web-quick"><button type="button" data-web-go="posts"><strong>منشور جديد</strong><small>كتابة خبر أو إعلان للموقع</small></button><button type="button" data-web-go="content"><strong>البرامج والأنشطة</strong><small>تحديث ما يظهر للزوار</small></button><button type="button" data-web-go="gallery"><strong>معرض الصور</strong><small>إضافة أو ترتيب الصور</small></button><button type="button" data-web-go="branding"><strong>الهوية والواجهة</strong><small>الشعار وصورة الواجهة الرئيسية</small></button></div></section><section class="panel"><div class="list-head"><div><h2>آخر الرسائل</h2><p>الرسائل الجديدة الواردة من نموذج التواصل.</p></div><button type="button" class="secondary" data-web-go="messages">فتح الرسائل</button></div><div id="webDashMessages"><p>جارٍ التحميل...</p></div></section></div>`;adminView.prepend(panel);
    panel.addEventListener('click',e=>{const b=e.target.closest('[data-web-go]');if(!b)return;document.querySelector(`#tabs [data-tab="${b.dataset.webGo}"]`)?.click()});
    document.getElementById('webDashRefresh')?.addEventListener('click',loadWebsiteDashboard);
  }

  async function loadWebsiteDashboard(){
    if(space!=='website')return;const stats=document.getElementById('webDashStats'),messages=document.getElementById('webDashMessages');if(!stats)return;
    const [p,pr,a,g,m]=await Promise.all([
      client.from('posts').select('id,published',{count:'exact'}),client.from('programs').select('id,published',{count:'exact'}),client.from('activities').select('id,published',{count:'exact'}),client.from('gallery_items').select('id,published',{count:'exact'}),client.from('contact_messages').select('id,name,subject,status,created_at').order('created_at',{ascending:false}).limit(5)
    ]);
    const rows=[['المنشورات',p.count||0],['البرامج',pr.count||0],['الأنشطة',a.count||0],['صور المعرض',g.count||0],['الرسائل الجديدة',(m.data||[]).filter(x=>x.status==='new').length]];
    stats.innerHTML=rows.map(([l,n])=>`<div class="web-dash-card"><span>${l}</span><b>${n}</b></div>`).join('');
    if(messages)messages.innerHTML=(m.data||[]).length?(m.data||[]).map(x=>`<article class="post-item"><div class="post-top"><div><h3>${escapeHtml(x.subject||'بدون موضوع')}</h3><small>${escapeHtml(x.name||'')} · ${new Date(x.created_at).toLocaleString('ar-MA')}</small></div><span class="status ${x.status==='new'?'published':'draft'}">${x.status==='new'?'جديدة':'مقروءة'}</span></div></article>`).join(''):'<div class="empty">لا توجد رسائل حديثة.</div>';
  }

  function selectDefault(){setTimeout(()=>{const name=space==='website'?'website-dashboard':'dashboard';const b=document.querySelector(`#tabs [data-tab="${name}"]`);if(b)b.click();else document.querySelector('#tabs button[data-tab]')?.click()},80)}

  async function init(){
    addStyles();profile=await window.getCurrentAdminProfile?.();if(!profile)return;
    if(space==='website'&&!websiteRoles.has(profile.role)){location.replace('admin.html?denied=website');return}
    updateChrome();if(space==='website'){buildWebsiteDashboard();await loadWebsiteDashboard()}selectDefault();
  }
  window.addEventListener('admin-auth-ready',init);window.addEventListener('admin-modules-ready',()=>{updateChrome();selectDefault();if(space==='website')loadWebsiteDashboard()});
  init();
})();