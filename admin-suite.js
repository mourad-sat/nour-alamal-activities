(function(){
  const esc=window.escapeHtml||((v='')=>String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])));
  const money=v=>new Intl.NumberFormat('ar-MA',{style:'currency',currency:'MAD',maximumFractionDigits:2}).format(Number(v)||0);
  const pad=n=>String(n).padStart(2,'0');
  const today=()=>new Date().toISOString().slice(0,10);
  let profile=null,calendarDate=new Date(),techPrograms=new Map(),techActivities=new Map();
  const roleLabels={super_admin:'مدير عام',treasurer:'أمين المال',reports_manager:'مسؤول التقارير',content_manager:'مسؤول المحتوى'};

  function safeData(res){return res&&!res.error?(res.data||[]):[]}
  async function getProfile(){
    if(window.getCurrentAdminProfile)return await window.getCurrentAdminProfile();
    const {data:{user}}=await client.auth.getUser();if(!user)return null;
    const {data}=await client.from('admins').select('user_id,email,role').eq('user_id',user.id).maybeSingle();return data||null;
  }
  function clickTab(name){const b=document.querySelector(`#tabs [data-tab="${name}"]`);if(b){b.click();return true}return false}
  function setSearch(id,value,event='input'){const el=document.getElementById(id);if(!el)return;el.value=value||'';el.dispatchEvent(new Event(event,{bubbles:true}))}

  function installBaseStyles(){
    if(document.getElementById('integratedSuiteStyles'))return;
    const s=document.createElement('style');s.id='integratedSuiteStyles';s.textContent=`
      .suite-role-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:#eaf5f3;color:#0f766e;font-size:10px;font-weight:800;margin-top:7px}
      .suite-shell{display:grid;gap:18px}.suite-hero{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;background:linear-gradient(135deg,#f8fcfb,#edf7f5);border:1px solid #d6e7e4}.suite-hero h2{margin:7px 0}.suite-controls{display:flex;gap:8px;align-items:end;flex-wrap:wrap}.suite-controls label{margin:0}
      .calendar-weekdays,.calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:7px}.calendar-weekdays div{text-align:center;font-size:10px;font-weight:800;color:#6b807d;padding:5px}.calendar-day{min-height:112px;border:1px solid #dce8e6;border-radius:14px;background:#fff;padding:8px;overflow:hidden}.calendar-day.outside{opacity:.45;background:#f6f8f8}.calendar-day.today{border:2px solid #0f766e}.calendar-date{font-size:11px;font-weight:800;margin-bottom:5px;color:#254945}.calendar-events{display:grid;gap:4px}.calendar-event{display:block;width:100%;text-align:right;border:0;border-radius:8px;padding:5px 6px;font-size:9px;line-height:1.35;cursor:pointer;background:#edf6f4;color:#28524d}.calendar-event.task{background:#fff4df;color:#80510c}.calendar-event.admin{background:#f0effa;color:#51488a}.calendar-event.report{background:#edf2fb;color:#355b8b}.calendar-event.tech{background:#e7f6ef;color:#176a48}.calendar-event.overdue{outline:1px solid #cf5b5b}.calendar-more{font-size:9px;color:#718682;text-align:center}
      .suite-card-note{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0}.suite-pill{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:9px;font-weight:800;background:#edf5f4;color:#3a625d}.suite-pill.locked{background:#e8f1ff;color:#365f91}.suite-pill.converted{background:#e7f7ec;color:#217046}.suite-workflow-actions{display:flex;gap:6px;flex-wrap:wrap;width:100%;margin-top:7px}.suite-workflow-actions button{font-size:10px;padding:7px 9px}.suite-convert{background:#0f766e!important;color:white!important}.suite-reopen{background:#fff5e8!important;color:#8b5d17!important;border:1px solid #ead6b6!important}
      .suite-finance-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:12px 0}.suite-finance-kpi{border:1px solid #dce8e6;border-radius:14px;padding:12px;background:#f9fcfb}.suite-finance-kpi span{font-size:9px;color:#718682;display:block}.suite-finance-kpi b{font-size:17px;color:#0f766e}.suite-table{width:100%;border-collapse:collapse;font-size:10px}.suite-table th,.suite-table td{padding:8px;border-bottom:1px solid #e4edeb;text-align:right}.suite-progress{height:7px;border-radius:999px;background:#e7efee;overflow:hidden}.suite-progress i{display:block;height:100%;background:#0f766e}
      .suite-dashboard-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.suite-dashboard-card{background:#fff;border:1px solid #dce8e6;border-radius:16px;padding:14px}.suite-dashboard-card span{font-size:9px;color:#718682}.suite-dashboard-card b{display:block;font-size:21px;color:#0f766e;margin-top:4px}.suite-upcoming{display:grid;gap:7px}.suite-upcoming-item{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #edf2f1;padding:7px 0;font-size:11px}.suite-upcoming-item:last-child{border-bottom:0}
      @media(max-width:900px){.calendar-day{min-height:90px}.suite-finance-grid,.suite-dashboard-grid{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:650px){.suite-hero{flex-direction:column}.calendar-weekdays,.calendar-grid{gap:3px}.calendar-day{min-height:78px;border-radius:9px;padding:4px}.calendar-weekdays div{font-size:8px}.calendar-date{font-size:9px}.calendar-event{font-size:8px;padding:4px}.suite-finance-grid,.suite-dashboard-grid{grid-template-columns:1fr 1fr}.suite-table{font-size:9px}.suite-table th,.suite-table td{padding:6px 4px}}
    `;document.head.appendChild(s);
  }

  function applyRoleVisibility(){
    if(!profile)return;
    const allowed={
      super_admin:'*',
      treasurer:['dashboard','governance-finance','tasks','calendar'],
      reports_manager:['dashboard','reports','technical-cards','tasks','calendar'],
      content_manager:['dashboard','posts','content','gallery','settings','messages','branding','registration','technical-cards','tasks','calendar']
    }[profile.role]||[];
    document.querySelectorAll('#tabs [data-tab]').forEach(b=>{const ok=allowed==='*'||allowed.includes(b.dataset.tab);b.style.display=ok?'':'none';b.dataset.roleAllowed=ok?'1':'0'});
    document.querySelectorAll('#adminView [data-panel]').forEach(p=>{const name=p.dataset.panel;if(!name)return;const ok=allowed==='*'||allowed.includes(name);p.dataset.roleAllowed=ok?'1':'0';if(!ok)p.classList.add('hidden')});
    const head=document.querySelector('.admin-head>div');if(head&&!document.getElementById('suiteRoleChip')){const chip=document.createElement('span');chip.id='suiteRoleChip';chip.className='suite-role-chip';chip.textContent=`الصلاحية: ${roleLabels[profile.role]||profile.role}`;head.appendChild(chip)}
  }

  function installRoleObserver(){const tabs=document.getElementById('tabs');if(!tabs)return;new MutationObserver(()=>applyRoleVisibility()).observe(tabs,{childList:true,subtree:true})}

  function buildCalendar(){
    const tabs=document.getElementById('tabs'),adminView=document.getElementById('adminView');if(!tabs||!adminView||document.getElementById('associationCalendarPanel'))return;
    const tab=document.createElement('button');tab.dataset.tab='calendar';tab.textContent='التقويم';tabs.appendChild(tab);
    const panel=document.createElement('section');panel.id='associationCalendarPanel';panel.className='tab-panel hidden';panel.dataset.panel='calendar';panel.innerHTML=`<div class="suite-shell"><section class="panel suite-hero"><div><span class="badge">التخطيط الزمني</span><h2>تقويم الجمعية الموحد</h2><p>الأنشطة المخططة، المهام، الاجتماعات والأنشطة الموثقة في شاشة شهرية واحدة.</p></div><div class="suite-controls"><button id="calPrev" type="button" class="secondary">السابق</button><button id="calToday" type="button" class="secondary">اليوم</button><button id="calNext" type="button" class="secondary">التالي</button></div></section><section class="panel"><div class="list-head"><h2 id="calTitle"></h2><button id="calRefresh" type="button" class="secondary">تحديث</button></div><div class="calendar-weekdays"><div>الإثنين</div><div>الثلاثاء</div><div>الأربعاء</div><div>الخميس</div><div>الجمعة</div><div>السبت</div><div>الأحد</div></div><div id="calendarGrid" class="calendar-grid"><p>جارٍ التحميل...</p></div></section></div>`;adminView.appendChild(panel);
    document.getElementById('calPrev').addEventListener('click',()=>{calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()-1,1);loadCalendar()});
    document.getElementById('calNext').addEventListener('click',()=>{calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()+1,1);loadCalendar()});
    document.getElementById('calToday').addEventListener('click',()=>{calendarDate=new Date();loadCalendar()});
    document.getElementById('calRefresh').addEventListener('click',loadCalendar);
    document.getElementById('calendarGrid').addEventListener('click',e=>{const b=e.target.closest('[data-cal-type]');if(b)navigateCalendar(b.dataset.calType,b.dataset.calId,b.dataset.calTitle)});
  }

  async function loadCalendar(){
    const grid=document.getElementById('calendarGrid');if(!grid)return;
    const y=calendarDate.getFullYear(),m=calendarDate.getMonth(),from=`${y}-${pad(m+1)}-01`,to=`${y}-${pad(m+1)}-${pad(new Date(y,m+1,0).getDate())}`;
    const monthNames=['يناير','فبراير','مارس','أبريل','ماي','يونيو','يوليوز','غشت','شتنبر','أكتوبر','نونبر','دجنبر'];document.getElementById('calTitle').textContent=`${monthNames[m]} ${y}`;grid.innerHTML='<p>جارٍ تجميع المواعيد...</p>';
    const [tasksR,techR,adminR,reportR]=await Promise.all([
      client.from('association_tasks').select('id,title,due_date,due_time,status,priority').gte('due_date',from).lte('due_date',to),
      client.from('technical_activity_cards').select('id,title,activity_date,status,locked,report_activity_id').gte('activity_date',from).lte('activity_date',to),
      client.from('association_admin_records').select('id,title,record_date,record_type,status').gte('record_date',from).lte('record_date',to),
      client.from('report_activities').select('id,title,start_date,category').gte('start_date',from).lte('start_date',to)
    ]);
    const by={};const add=(date,event)=>{if(!date)return;(by[date]||(by[date]=[])).push(event)};
    safeData(tasksR).forEach(x=>add(x.due_date,{type:'task',id:x.id,title:x.title,label:`مهمة: ${x.title}`,overdue:x.status!=='done'&&x.due_date<today()}));
    safeData(techR).forEach(x=>add(x.activity_date,{type:'tech',id:x.id,title:x.title,label:`مخطط: ${x.title}`}));
    safeData(adminR).forEach(x=>add(x.record_date,{type:'admin',id:x.id,title:x.title,label:`إداري: ${x.title}`}));
    safeData(reportR).forEach(x=>add(x.start_date,{type:'report',id:x.id,title:x.title,label:`موثق: ${x.title}`}));
    const first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),offset=(first.getDay()+6)%7,cells=[];
    for(let i=0;i<42;i++){
      const dNum=i-offset+1,cellDate=new Date(y,m,dNum),iso=`${cellDate.getFullYear()}-${pad(cellDate.getMonth()+1)}-${pad(cellDate.getDate())}`,outside=cellDate.getMonth()!==m,events=by[iso]||[];
      cells.push(`<div class="calendar-day ${outside?'outside':''} ${iso===today()?'today':''}"><div class="calendar-date">${cellDate.getDate()}</div><div class="calendar-events">${events.slice(0,4).map(ev=>`<button type="button" class="calendar-event ${ev.type} ${ev.overdue?'overdue':''}" data-cal-type="${ev.type}" data-cal-id="${ev.id}" data-cal-title="${esc(ev.title)}">${esc(ev.label)}</button>`).join('')}${events.length>4?`<div class="calendar-more">+ ${events.length-4} أخرى</div>`:''}</div></div>`);
    }
    grid.innerHTML=cells.join('');
  }

  function navigateCalendar(type,id,title){
    if(type==='task'){clickTab('tasks');setTimeout(()=>setSearch('taskSearch',title),100)}
    if(type==='tech'){clickTab('technical-cards');setTimeout(()=>{document.querySelector('[data-tc-view="activity"]')?.click();setSearch('tcActivitySearch',title)},120)}
    if(type==='report'){clickTab('reports');setTimeout(()=>setSearch('reportSearch',title),120)}
    if(type==='admin'){clickTab('governance-finance');setTimeout(()=>{document.querySelector('[data-gf-view="admin"]')?.click();setSearch('gfAdminSearch',title)},120)}
  }

  async function loadTechWorkflow(){
    const [p,a]=await Promise.all([client.from('technical_program_cards').select('id,title,reference,status,locked,approved_at'),client.from('technical_activity_cards').select('id,title,reference,status,locked,approved_at,report_activity_id')]);
    techPrograms=new Map(safeData(p).map(x=>[String(x.id),x]));techActivities=new Map(safeData(a).map(x=>[String(x.id),x]));enhanceTechCards();
  }
  function addWorkflowInfo(article,c,kind,id){
    if(!article||!c)return;
    let note=article.querySelector('.suite-card-note');if(!note){note=document.createElement('div');note.className='suite-card-note';article.querySelector('.tc-card-meta')?.insertAdjacentElement('afterend',note)}
    note.innerHTML=`${c.locked?'<span class="suite-pill locked">🔒 معتمدة ومقفلة</span>':''}${kind==='activity'&&c.report_activity_id?'<span class="suite-pill converted">✓ محولة إلى التقرير</span>':''}${c.reference?`<span class="suite-pill">${esc(c.reference)}</span>`:''}`;
    const actions=article.querySelector('.tc-card-actions');if(!actions)return;
    let flow=actions.querySelector('.suite-workflow-actions');if(!flow){flow=document.createElement('div');flow.className='suite-workflow-actions';actions.appendChild(flow)}
    let html='';
    if(kind==='activity'&&(profile.role==='super_admin'||profile.role==='reports_manager')) html+=c.report_activity_id?`<button type="button" class="secondary" data-suite-open-report="${id}" data-suite-title="${esc(c.title)}">فتح النشاط الموثق</button>`:`<button type="button" class="suite-convert" data-suite-convert="${id}">تحويل إلى نشاط موثق</button>`;
    if(c.locked&&profile.role==='super_admin')html+=`<button type="button" class="suite-reopen" data-suite-reopen-kind="${kind}" data-suite-reopen-id="${id}">إعادة فتح البطاقة</button>`;
    flow.innerHTML=html;
    const edit=actions.querySelector(kind==='activity'?'[data-tca-edit]':'[data-tcp-edit]');if(edit&&c.locked&&profile.role!=='super_admin'){edit.disabled=true;edit.title='البطاقة معتمدة ومقفلة. يحتاج تعديلها إلى إعادة فتحها من المدير العام.'}
  }
  function enhanceTechCards(){
    document.querySelectorAll('#tcProgramList .post-item').forEach(a=>{const id=a.querySelector('[data-tcp-edit]')?.dataset.tcpEdit;addWorkflowInfo(a,techPrograms.get(String(id)),'program',id)});
    document.querySelectorAll('#tcActivityList .post-item').forEach(a=>{const id=a.querySelector('[data-tca-edit]')?.dataset.tcaEdit;addWorkflowInfo(a,techActivities.get(String(id)),'activity',id)});
    ['tcProgramMsg','tcActivityMsg'].forEach(id=>{const e=document.getElementById(id);if(e&&e.textContent.includes('card_locked'))e.textContent='هذه البطاقة معتمدة ومقفلة. يجب إعادة فتحها قبل التعديل.'});
  }
  function installTechObserver(){const root=document.getElementById('technicalCardsPanel');if(!root)return;new MutationObserver(()=>enhanceTechCards()).observe(root,{childList:true,subtree:true})}
  async function handleWorkflowClick(e){
    const conv=e.target.closest('[data-suite-convert]');if(conv){if(!confirm('سيتم إنشاء نشاط موثق في قسم التقارير انطلاقاً من هذه البطاقة. متابعة؟'))return;const {data,error}=await client.rpc('convert_technical_activity_to_report',{card_id:Number(conv.dataset.suiteConvert)});if(error){alert('تعذر التحويل: '+(error.message||'خطأ'));return}await loadTechWorkflow();alert('تم إنشاء النشاط الموثق. يمكنك الآن إضافة النتائج الفعلية والصور والأعداد.');return}
    const reopen=e.target.closest('[data-suite-reopen-id]');if(reopen){if(!confirm('إعادة فتح البطاقة ستعيد حالتها إلى مسودة وتسمح بتعديلها. متابعة؟'))return;const {error}=await client.rpc('reopen_technical_card',{card_kind:reopen.dataset.suiteReopenKind,card_id:Number(reopen.dataset.suiteReopenId)});if(error){alert('تعذر إعادة فتح البطاقة.');return}await loadTechWorkflow();return}
    const open=e.target.closest('[data-suite-open-report]');if(open){clickTab('reports');setTimeout(()=>setSearch('reportSearch',open.dataset.suiteTitle),100)}
  }

  function buildFinanceEnhancement(){
    const overview=document.querySelector('#governanceFinancePanel [data-gf-panel="overview"]');if(!overview||document.getElementById('suiteFinancePanel'))return;
    const sec=document.createElement('section');sec.id='suiteFinancePanel';sec.className='panel';sec.innerHTML=`<div class="list-head"><div><span class="badge">الضبط المالي</span><h3>إغلاق السنة والميزانية المخططة مقابل المنفذة</h3><p>بعد إغلاق السنة تُمنع إضافة أو تعديل أو حذف عملياتها حتى يعيد المدير العام فتحها.</p></div><button id="suiteFinanceRefresh" type="button" class="secondary">تحديث</button></div><div id="suiteFinanceStatus"></div><div id="suiteBudgetSnapshot"></div>`;overview.appendChild(sec);
    document.getElementById('suiteFinanceRefresh').addEventListener('click',loadFinanceEnhancement);
    document.getElementById('gfYear')?.addEventListener('change',()=>setTimeout(loadFinanceEnhancement,50));
    sec.addEventListener('click',async e=>{const close=e.target.dataset.closeYear,reopen=e.target.dataset.reopenYear;if(!close&&!reopen)return;const year=Number(close||reopen),closing=!!close;if(!confirm(closing?`إغلاق السنة المالية ${year}؟ لن يمكن تعديل عملياتها بعد الإغلاق.`:`إعادة فتح السنة المالية ${year}؟`))return;const notes=closing?prompt('ملاحظة الإغلاق (اختياري):','')||'':'';const {error}=await client.rpc('set_finance_year_closed',{target_year:year,close_year:closing,notes});if(error){alert('تعذر تنفيذ العملية: '+(error.message||'خطأ'));return}await loadFinanceEnhancement()});
  }
  async function loadFinanceEnhancement(){
    if(!['super_admin','treasurer'].includes(profile.role))return;
    const year=Number(document.getElementById('gfYear')?.value)||new Date().getFullYear(),status=document.getElementById('suiteFinanceStatus'),budget=document.getElementById('suiteBudgetSnapshot');if(!status||!budget)return;
    const [sR,bR]=await Promise.all([client.from('finance_year_settings').select('*').eq('year',year).maybeSingle(),client.rpc('finance_budget_snapshot',{target_year:year})]);
    const s=sR.data||{},closed=!!s.is_closed;
    status.innerHTML=`<div class="suite-finance-grid"><div class="suite-finance-kpi"><span>حالة السنة</span><b>${closed?'مغلقة':'مفتوحة'}</b></div><div class="suite-finance-kpi"><span>الرصيد الختامي المعتمد</span><b>${closed?money(s.closing_balance):'—'}</b></div><div class="suite-finance-kpi"><span>تاريخ الإغلاق</span><b style="font-size:12px">${s.closed_at?new Date(s.closed_at).toLocaleDateString('ar-MA'):'—'}</b></div><div class="suite-finance-kpi"><span>الإجراء</span>${closed?(profile.role==='super_admin'?`<button type="button" data-reopen-year="${year}" class="secondary">إعادة فتح السنة</button>`:'<b style="font-size:11px">للقراءة فقط</b>'):`<button type="button" data-close-year="${year}">إغلاق السنة</button>`}</div></div>${closed&&s.closure_notes?`<p class="msg">ملاحظة الإغلاق: ${esc(s.closure_notes)}</p>`:''}`;
    const rows=safeData(bR),planned=rows.reduce((a,x)=>a+Number(x.planned||0),0),actual=rows.reduce((a,x)=>a+Number(x.actual||0),0),pct=planned?Math.round(actual/planned*100):0;
    budget.innerHTML=`<div class="list-head"><div><h4>تنفيذ ميزانيات البطاقات التقنية</h4><p>مطابقة تلقائية مع المصاريف المرتبطة بالبطاقة أو التي يحمل حقل المشروع فيها نفس اسم البطاقة.</p></div><strong>${pct}%</strong></div><div class="suite-progress"><i style="width:${Math.min(100,pct)}%"></i></div><div class="suite-finance-grid"><div class="suite-finance-kpi"><span>المخطط</span><b>${money(planned)}</b></div><div class="suite-finance-kpi"><span>المنفذ</span><b>${money(actual)}</b></div><div class="suite-finance-kpi"><span>المتبقي</span><b>${money(planned-actual)}</b></div><div class="suite-finance-kpi"><span>بطاقات بميزانية</span><b>${rows.filter(x=>Number(x.planned)>0).length}</b></div></div>${rows.length?`<div style="overflow:auto"><table class="suite-table"><thead><tr><th>البطاقة</th><th>المخطط</th><th>المنفذ</th><th>المتبقي</th><th>%</th></tr></thead><tbody>${rows.filter(x=>Number(x.planned)>0||Number(x.actual)>0).map(x=>`<tr><td>${esc(x.reference||'')} ${esc(x.title)}</td><td>${money(x.planned)}</td><td>${money(x.actual)}</td><td>${money(x.variance)}</td><td>${Number(x.execution_pct)||0}%</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">لا توجد بطاقات بميزانيات لهذه السنة بعد.</div>'}`;
  }

  function buildDashboardExtras(){
    const root=document.getElementById('mainDashboardPanel');if(!root||document.getElementById('suiteDashboardExtras'))return;
    const sec=document.createElement('section');sec.id='suiteDashboardExtras';sec.className='panel';sec.innerHTML=`<div class="list-head"><div><span class="badge">المتابعة المترابطة</span><h2>التخطيط والتنفيذ والتوثيق</h2></div><button id="suiteDashRefresh" type="button" class="secondary">تحديث</button></div><div id="suiteDashKpis" class="suite-dashboard-grid"></div><div class="admin-grid" style="margin-top:14px"><div><h3>المواعيد والأنشطة القريبة</h3><div id="suiteDashUpcoming" class="suite-upcoming"></div></div><div><h3>تحتاج متابعة</h3><div id="suiteDashFollowup" class="suite-upcoming"></div></div></div>`;root.appendChild(sec);document.getElementById('suiteDashRefresh').addEventListener('click',loadDashboardExtras);
  }
  async function loadDashboardExtras(){
    const k=document.getElementById('suiteDashKpis');if(!k)return;const now=today(),d7=new Date();d7.setDate(d7.getDate()+7);const next7=d7.toISOString().slice(0,10);
    const [tasksR,techR]=await Promise.all([client.from('association_tasks').select('id,title,due_date,status').gte('due_date',now).lte('due_date',next7).neq('status','done').order('due_date'),client.from('technical_activity_cards').select('id,title,activity_date,status,locked,report_activity_id').order('activity_date',{ascending:true})]);
    const tasks=safeData(tasksR),tech=safeData(techR),upcomingTech=tech.filter(x=>x.activity_date>=now&&x.activity_date<=next7),undocumented=tech.filter(x=>x.activity_date&&x.activity_date<now&&!x.report_activity_id&&x.status!=='archived'),locked=tech.filter(x=>x.locked).length;
    let financeClosed='—';if(['super_admin','treasurer'].includes(profile.role)){const {data}=await client.from('finance_year_settings').select('is_closed').eq('year',new Date().getFullYear()).maybeSingle();financeClosed=data?.is_closed?'مغلقة':'مفتوحة'}
    k.innerHTML=`<div class="suite-dashboard-card"><span>خلال 7 أيام</span><b>${tasks.length+upcomingTech.length}</b></div><div class="suite-dashboard-card"><span>أنشطة منفذة غير موثقة</span><b>${undocumented.length}</b></div><div class="suite-dashboard-card"><span>بطاقات معتمدة ومقفلة</span><b>${locked}</b></div><div class="suite-dashboard-card"><span>السنة المالية الحالية</span><b style="font-size:15px">${financeClosed}</b></div>`;
    document.getElementById('suiteDashUpcoming').innerHTML=[...tasks.map(x=>({date:x.due_date,title:'مهمة: '+x.title})),...upcomingTech.map(x=>({date:x.activity_date,title:'نشاط: '+x.title}))].sort((a,b)=>a.date.localeCompare(b.date)).slice(0,8).map(x=>`<div class="suite-upcoming-item"><span>${esc(x.title)}</span><b>${esc(x.date)}</b></div>`).join('')||'<div class="empty">لا توجد مواعيد قريبة.</div>';
    document.getElementById('suiteDashFollowup').innerHTML=undocumented.slice(0,8).map(x=>`<div class="suite-upcoming-item"><span>${esc(x.title)}</span><button type="button" class="secondary" data-dash-tech="${x.id}" data-dash-title="${esc(x.title)}">توثيق</button></div>`).join('')||'<div class="empty">لا توجد أنشطة متأخرة في التوثيق.</div>';
  }

  async function init(){
    profile=await getProfile();if(!profile)return;installBaseStyles();buildCalendar();applyRoleVisibility();installRoleObserver();
    setTimeout(async()=>{buildFinanceEnhancement();buildDashboardExtras();await Promise.all([loadCalendar(),loadTechWorkflow(),loadDashboardExtras()]);installTechObserver();if(['super_admin','treasurer'].includes(profile.role))await loadFinanceEnhancement();applyRoleVisibility()},500);
    document.addEventListener('click',handleWorkflowClick);
    document.addEventListener('click',e=>{const b=e.target.closest('[data-dash-tech]');if(b){clickTab('technical-cards');setTimeout(()=>{document.querySelector('[data-tc-view="activity"]')?.click();setSearch('tcActivitySearch',b.dataset.dashTitle)},100)}});
  }
  client.auth.onAuthStateChange(()=>setTimeout(init,250));init();
})();