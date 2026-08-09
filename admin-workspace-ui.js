(function(){
  const space=document.body.dataset.adminSpace;
  if(!space)return;
  const tabs=document.getElementById('tabs'),adminView=document.getElementById('adminView');
  if(!tabs||!adminView)return;

  const config={
    association:{
      title:'تدبير الجمعية',subtitle:'الإدارة الداخلية',icon:'🏛️',
      order:['dashboard','calendar','tasks','technical-cards','reports','governance-finance','managers'],
      labels:{dashboard:'الرئيسية',calendar:'التقويم',tasks:'المهام والمتابعة','technical-cards':'البطاقات التقنية',reports:'التقارير والإحصائيات','governance-finance':'الإدارة والمالية',managers:'المديرون والصلاحيات'},
      icons:{dashboard:'⌂',calendar:'◫',tasks:'✓','technical-cards':'▤',reports:'▥','governance-finance':'◈',managers:'♙'},
      groups:[['dashboard','نظرة عامة'],['calendar','التخطيط والمتابعة'],['technical-cards','البرامج والتوثيق'],['governance-finance','الحكامة والإدارة']]
    },
    website:{
      title:'تدبير الموقع',subtitle:'إدارة المحتوى والنشر',icon:'🌐',
      order:['website-dashboard','posts','content','gallery','messages','registration','branding','settings'],
      labels:{'website-dashboard':'الرئيسية',posts:'المنشورات',content:'البرامج والأنشطة',gallery:'معرض الصور',messages:'الرسائل',registration:'التسجيل',branding:'الهوية والواجهة',settings:'بيانات التواصل'},
      icons:{'website-dashboard':'⌂',posts:'✎',content:'▦',gallery:'▧',messages:'✉',registration:'◎',branding:'◇',settings:'⚙'},
      groups:[['website-dashboard','نظرة عامة'],['posts','المحتوى'],['messages','التفاعل والخدمات'],['branding','إعدادات الموقع']]
    }
  }[space];
  if(!config)return;

  let mobileOpen=false,refreshTimer=null;
  function esc(v=''){return String(v).replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

  function installSidebarBrand(){
    if(tabs.querySelector('.workspace-sidebar-brand'))return;
    const brand=document.createElement('div');brand.className='workspace-sidebar-brand';brand.innerHTML=`<div class="workspace-sidebar-icon">${config.icon}</div><div><strong>${esc(config.title)}</strong><span>${esc(config.subtitle)}</span></div>`;tabs.prepend(brand);
  }

  function decorateButton(btn){
    const name=btn.dataset.tab;if(!name||btn.dataset.workspaceDecorated)return;
    btn.dataset.workspaceDecorated='1';const label=config.labels[name]||btn.textContent.trim(),icon=config.icons[name]||'•';
    btn.innerHTML=`<span class="workspace-tab-icon">${icon}</span><span class="workspace-tab-label">${esc(label)}</span><span class="workspace-tab-arrow">‹</span>`;
    btn.title=label;
  }

  function reorderButtons(){
    const buttons=[...tabs.querySelectorAll(':scope > button[data-tab]')];
    buttons.sort((a,b)=>{const ai=config.order.indexOf(a.dataset.tab),bi=config.order.indexOf(b.dataset.tab);return (ai<0?999:ai)-(bi<0?999:bi)}).forEach(b=>tabs.appendChild(b));
  }

  function installGroups(){
    tabs.querySelectorAll('.workspace-nav-group').forEach(x=>x.remove());
    const map=new Map(config.groups);
    for(const [tab,label] of map){const b=tabs.querySelector(`:scope > button[data-tab="${tab}"]`);if(!b||b.style.display==='none')continue;const g=document.createElement('div');g.className='workspace-nav-group';g.textContent=label;b.insertAdjacentElement('beforebegin',g)}
  }

  function installMobileToggle(){
    if(document.getElementById('workspaceMenuToggle'))return;
    const head=document.querySelector('.admin-head');if(!head)return;
    const b=document.createElement('button');b.id='workspaceMenuToggle';b.type='button';b.className='secondary workspace-menu-toggle';b.innerHTML='<span>☰</span><span>القائمة</span>';
    b.addEventListener('click',()=>{mobileOpen=!mobileOpen;document.body.classList.toggle('workspace-nav-open',mobileOpen);b.setAttribute('aria-expanded',String(mobileOpen))});head.appendChild(b);
    document.addEventListener('click',e=>{if(window.innerWidth>880||!mobileOpen)return;if(e.target.closest('#tabs')||e.target.closest('#workspaceMenuToggle'))return;mobileOpen=false;document.body.classList.remove('workspace-nav-open');b.setAttribute('aria-expanded','false')});
  }

  function installContextBar(){
    if(document.getElementById('workspaceContextBar'))return;
    const bar=document.createElement('div');bar.id='workspaceContextBar';bar.className='workspace-context-bar';bar.innerHTML=`<div><span>${config.icon} ${esc(config.title)}</span><strong id="workspaceContextTitle">${esc(config.title)}</strong></div><div class="workspace-context-actions"><a href="admin.html">بوابة الإدارة</a>${space==='website'?'<a href="index.html" target="_blank">عرض الموقع ↗</a>':'<a href="association-admin.html">المساحة الداخلية</a>'}</div>`;
    const head=document.querySelector('.admin-head');head?.insertAdjacentElement('afterend',bar);
  }

  function updateContext(name){
    const t=document.getElementById('workspaceContextTitle');if(t)t.textContent=config.labels[name]||name||config.title;
  }

  function refresh(){
    clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{
      installSidebarBrand();tabs.querySelectorAll(':scope > button[data-tab]').forEach(decorateButton);reorderButtons();installGroups();installMobileToggle();installContextBar();
      const active=tabs.querySelector(':scope > button[data-tab].active');if(active)updateContext(active.dataset.tab);
    },40);
  }

  tabs.addEventListener('click',e=>{const b=e.target.closest('button[data-tab]');if(!b)return;updateContext(b.dataset.tab);if(window.innerWidth<=880){mobileOpen=false;document.body.classList.remove('workspace-nav-open');document.getElementById('workspaceMenuToggle')?.setAttribute('aria-expanded','false')}});
  new MutationObserver(refresh).observe(tabs,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
  window.addEventListener('admin-modules-ready',refresh);window.addEventListener('admin-auth-ready',refresh);window.addEventListener('resize',()=>{if(window.innerWidth>880){mobileOpen=false;document.body.classList.remove('workspace-nav-open')}});
  refresh();
})();