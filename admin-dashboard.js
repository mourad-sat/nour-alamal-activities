(function(){
  const tabs=document.getElementById('tabs');
  const adminView=document.getElementById('adminView');
  if(!tabs||!adminView||document.getElementById('mainDashboardPanel'))return;

  const esc=window.escapeHtml||((v='')=>String(v).replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])));
  const money=v=>new Intl.NumberFormat('ar-MA',{style:'currency',currency:'MAD',maximumFractionDigits:2}).format(Number(v)||0);
  const pad=n=>String(n).padStart(2,'0');
  const now=new Date();
  const year=now.getFullYear();
  const month=now.getMonth()+1;
  const monthKey=`${year}-${pad(month)}`;
  const monthStart=`${monthKey}-01`;
  const monthEnd=`${monthKey}-${pad(new Date(year,month,0).getDate())}`;
  const yearStart=`${year}-01-01`,yearEnd=`${year}-12-31`;
  const monthNames=['يناير','فبراير','مارس','أبريل','ماي','يونيو','يوليوز','غشت','شتنبر','أكتوبر','نونبر','دجنبر'];

  const tab=document.createElement('button');
  tab.dataset.tab='dashboard';
  tab.textContent='الرئيسية';
  tabs.prepend(tab);

  const panel=document.createElement('section');
  panel.id='mainDashboardPanel';
  panel.className='tab-panel';
  panel.dataset.panel='dashboard';
  panel.innerHTML=`
    <div class="dash-shell">
      <section class="panel dash-hero">
        <div><span class="badge">لوحة القيادة</span><h2>نظرة شاملة على الجمعية</h2><p id="dashPeriodLabel">مؤشرات ${monthNames[month-1]} ${year} والسنة الجارية.</p></div>
        <div class="dash-hero-actions"><button id="dashRefresh" type="button" class="secondary">تحديث البيانات</button><span id="dashUpdated" class="dash-updated"></span></div>
      </section>

      <section id="dashKpis" class="dash-kpis">
        ${Array.from({length:8},()=>'<div class="dash-kpi"><span>جارٍ التحميل</span><b>—</b></div>').join('')}
      </section>

      <div class="dash-grid-main">
        <section class="panel dash-attention">
          <div class="list-head"><div><span class="badge">يحتاج الانتباه</span><h3>التنبيهات والمتابعة</h3></div><span id="dashAlertCount" class="dash-count">0</span></div>
          <div id="dashAlerts" class="dash-alerts"><p>جارٍ فحص البيانات...</p></div>
        </section>
        <section class="panel dash-actions-panel">
          <div class="list-head"><div><span class="badge">اختصارات</span><h3>إجراءات سريعة</h3></div></div>
          <div class="dash-quick-actions">
            <button data-dash-go="reports">+ توثيق نشاط</button>
            <button data-dash-go="finance">+ عملية مالية</button>
            <button data-dash-go="admin-record">+ سجل إداري</button>
            <button data-dash-go="messages" class="secondary">الرسائل</button>
            <button data-dash-go="posts" class="secondary">منشور جديد</button>
            <button data-dash-go="annual-finance" class="secondary">التقرير الإداري والمالي</button>
          </div>
        </section>
      </div>

      <div class="dash-grid-main">
        <section class="panel">
          <div class="list-head"><div><span class="badge">التوثيق</span><h3>تغطية أشهر السنة</h3><p>الأشهر التي تحتوي على نشاط موثق واحد على الأقل.</p></div><b id="dashCoverageLabel">0/${month}</b></div>
          <div id="dashMonthCoverage" class="dash-month-coverage"></div>
        </section>
        <section class="panel">
          <div class="list-head"><div><span class="badge">الميزانية</span><h3>تنفيذ الميزانية السنوية</h3></div></div>
          <div id="dashBudget" class="dash-budget"><p>جارٍ التحميل...</p></div>
        </section>
      </div>

      <div class="dash-grid-main">
        <section class="panel">
          <div class="list-head"><div><span class="badge">آخر الأنشطة</span><h3>أحدث الأنشطة الموثقة</h3></div><button type="button" class="secondary" data-dash-go="reports">عرض الكل</button></div>
          <div id="dashRecentActivities" class="posts-list"><p>جارٍ التحميل...</p></div>
        </section>
        <section class="panel">
          <div class="list-head"><div><span class="badge">آخر الحركات</span><h3>الإدارة والمالية</h3></div><button type="button" class="secondary" data-dash-go="finance">فتح القسم</button></div>
          <div id="dashRecentOperations" class="posts-list"><p>جارٍ التحميل...</p></div>
        </section>
      </div>
    </div>`;
  adminView.prepend(panel);

  // Make dashboard the default landing view.
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('active',b===tab));
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('hidden',p!==panel));

  const style=document.createElement('style');
  style.textContent=`
    .dash-shell{display:grid;gap:18px}.dash-hero{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.dash-hero h2{margin:8px 0}.dash-hero-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.dash-updated{font-size:10px;color:#718682}.dash-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.dash-kpi{background:#fff;border:1px solid #dce8e6;border-radius:18px;padding:16px;box-shadow:0 8px 25px rgba(8,47,44,.05)}.dash-kpi span{display:block;color:#6f827f;font-size:10px;margin-bottom:6px}.dash-kpi b{display:block;color:#0f766e;font-size:23px;line-height:1.25}.dash-kpi small{display:block;margin-top:5px;color:#879693;font-size:9px}.dash-grid-main{display:grid;grid-template-columns:1.25fr .75fr;gap:18px}.dash-count{display:grid;place-items:center;min-width:30px;height:30px;padding:0 8px;border-radius:999px;background:#fff0dd;color:#a05d05;font-weight:800}.dash-alerts{display:grid;gap:9px;margin-top:12px}.dash-alert{display:flex;gap:11px;align-items:flex-start;border:1px solid #e2ecea;border-radius:14px;padding:11px 12px;background:#fafcfc}.dash-alert.warn{border-right:4px solid #d98518}.dash-alert.info{border-right:4px solid #287b9c}.dash-alert.ok{border-right:4px solid #299563}.dash-alert .icon{font-size:17px}.dash-alert .body{flex:1}.dash-alert strong{display:block;font-size:12px;margin-bottom:2px}.dash-alert p{margin:0;font-size:10px;color:#6c7f7b;line-height:1.7}.dash-alert button{padding:5px 8px;font-size:9px;margin-top:6px}.dash-quick-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px}.dash-quick-actions button{min-height:45px}.dash-month-coverage{display:grid;grid-template-columns:repeat(12,1fr);gap:7px;margin-top:16px}.dash-month{border-radius:12px;padding:10px 4px;text-align:center;background:#eef4f3;color:#84938f;font-size:9px}.dash-month.done{background:#e5f5ef;color:#18764e;font-weight:800}.dash-month.current{outline:2px solid #0f766e}.dash-month b{display:block;font-size:14px;margin-bottom:3px}.dash-budget-track{height:14px;background:#edf3f2;border-radius:999px;overflow:hidden;margin:12px 0}.dash-budget-fill{height:100%;background:#0f766e;border-radius:inherit}.dash-budget-numbers{display:flex;justify-content:space-between;gap:10px;font-size:10px;color:#687d79}.dash-budget-main{font-size:22px;color:#0f766e;font-weight:800}.dash-mini-meta{display:flex;gap:7px;flex-wrap:wrap;color:#718682;font-size:9px;margin-top:5px}.dash-operation-amount{font-weight:800}.dash-operation-amount.income{color:#18764e}.dash-operation-amount.expense{color:#a43a3a}@media(max-width:1000px){.dash-kpis{grid-template-columns:repeat(2,1fr)}.dash-grid-main{grid-template-columns:1fr}.dash-month-coverage{grid-template-columns:repeat(6,1fr)}}@media(max-width:600px){.dash-hero{flex-direction:column}.dash-kpis{grid-template-columns:1fr 1fr}.dash-quick-actions{grid-template-columns:1fr}.dash-month-coverage{grid-template-columns:repeat(4,1fr)}}`;
  document.head.appendChild(style);

  function switchTab(name){
    const b=document.querySelector(`#tabs button[data-tab="${name}"]`);if(!b)return false;b.click();return true;
  }
  function go(target){
    if(target==='reports'){switchTab('reports');setTimeout(()=>document.getElementById('reportActivityForm')?.scrollIntoView({behavior:'smooth',block:'start'}),120);return}
    if(target==='posts'){switchTab('posts');setTimeout(()=>document.getElementById('postForm')?.scrollIntoView({behavior:'smooth',block:'start'}),120);return}
    if(target==='messages'){if(!switchTab('messages'))setTimeout(()=>switchTab('messages'),400);return}
    if(target==='finance'||target==='admin-record'||target==='annual-finance'){
      if(!switchTab('governance-finance')){setTimeout(()=>go(target),350);return}
      const sub=target==='finance'?'finance':target==='admin-record'?'admin':'annual-reports';
      setTimeout(()=>document.querySelector(`.gf-subtabs button[data-gf-view="${sub}"]`)?.click(),150);return;
    }
  }
  panel.addEventListener('click',e=>{const t=e.target.closest('[data-dash-go]')?.dataset.dashGo;if(t)go(t)});

  function activityCard(a){return `<article class="post-item"><div class="post-top"><div><h3>${esc(a.title)}</h3><small>${esc(a.start_date||'')} · ${esc(a.category||'نشاط')}</small></div><span class="status published">${Number(a.beneficiaries_total)||0} مشاركة</span></div><div class="dash-mini-meta">${a.location?`<span>📍 ${esc(a.location)}</span>`:''}${a.activity_hours?`<span>⏱ ${Number(a.activity_hours)} س</span>`:''}</div></article>`}
  function operationCard(o){return `<article class="post-item"><div class="post-top"><div><h3>${esc(o.category||'عملية مالية')}</h3><small>${esc(o.transaction_date||'')} ${o.counterparty?'· '+esc(o.counterparty):''}</small></div><span class="dash-operation-amount ${o.transaction_type}">${o.transaction_type==='income'?'+':'−'} ${esc(money(o.amount))}</span></div></article>`}

  async function loadDashboard(){
    const updated=document.getElementById('dashUpdated');updated.textContent='جارٍ التحديث...';
    const {data:{user}}=await client.auth.getUser();if(!user){updated.textContent='';return}
    const adminCheck=await client.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();if(adminCheck.error||!adminCheck.data){updated.textContent='';return}

    const [actsRes,imgsRes,storiesRes,finRes,finSettingsRes,adminRes,msgRes,periodRes]=await Promise.all([
      client.from('report_activities').select('*').gte('start_date',yearStart).lte('start_date',yearEnd).order('start_date',{ascending:false}),
      client.from('report_activity_images').select('activity_id'),
      client.from('report_success_stories').select('id,story_date').gte('story_date',yearStart).lte('story_date',yearEnd),
      client.from('finance_transactions').select('*').gte('transaction_date',yearStart).lte('transaction_date',yearEnd).order('transaction_date',{ascending:false}),
      client.from('finance_year_settings').select('*').eq('year',year).maybeSingle(),
      client.from('association_admin_records').select('*').gte('record_date',yearStart).lte('record_date',yearEnd).order('record_date',{ascending:false}),
      client.from('contact_messages').select('id,status,created_at').eq('status','new'),
      client.from('report_period_notes').select('id').eq('period_type','monthly').eq('period_key',monthKey).maybeSingle()
    ]);

    const acts=actsRes.data||[],images=imgsRes.data||[],stories=storiesRes.data||[],fin=finRes.data||[],admin=adminRes.data||[],newMessages=msgRes.data||[];
    const monthActs=acts.filter(a=>String(a.start_date||'').slice(0,7)===monthKey);
    const monthStories=stories.filter(s=>String(s.story_date||'').slice(0,7)===monthKey);
    const monthParticipations=monthActs.reduce((s,a)=>s+(Number(a.beneficiaries_total)||0),0);
    const yearParticipations=acts.reduce((s,a)=>s+(Number(a.beneficiaries_total)||0),0);
    const income=fin.filter(x=>x.transaction_type==='income').reduce((s,x)=>s+(Number(x.amount)||0),0);
    const expenses=fin.filter(x=>x.transaction_type==='expense').reduce((s,x)=>s+(Number(x.amount)||0),0);
    const opening=Number(finSettingsRes.data?.opening_balance)||0,approved=Number(finSettingsRes.data?.approved_budget)||0,balance=opening+income-expenses;
    const pendingAdmin=admin.filter(x=>x.status==='pending'||x.status==='planned');

    document.getElementById('dashKpis').innerHTML=`
      <div class="dash-kpi"><span>أنشطة هذا الشهر</span><b>${monthActs.length}</b><small>${monthNames[month-1]} ${year}</small></div>
      <div class="dash-kpi"><span>مشاركات هذا الشهر</span><b>${monthParticipations}</b><small>مجموع الحضور المسجل</small></div>
      <div class="dash-kpi"><span>أنشطة السنة</span><b>${acts.length}</b><small>${yearParticipations} مشاركة مسجلة</small></div>
      <div class="dash-kpi"><span>قصص أثر هذا الشهر</span><b>${monthStories.length}</b><small>${stories.length} خلال السنة</small></div>
      <div class="dash-kpi"><span>المداخيل</span><b>${esc(money(income))}</b><small>منذ بداية ${year}</small></div>
      <div class="dash-kpi"><span>المصاريف</span><b>${esc(money(expenses))}</b><small>الرصيد ${esc(money(balance))}</small></div>
      <div class="dash-kpi"><span>متابعات إدارية</span><b>${pendingAdmin.length}</b><small>مبرمجة أو قيد المتابعة</small></div>
      <div class="dash-kpi"><span>رسائل جديدة</span><b>${newMessages.length}</b><small>من نموذج التواصل</small></div>`;

    const imgActivityIds=new Set(images.map(x=>String(x.activity_id)));
    const missingImages=monthActs.filter(a=>!imgActivityIds.has(String(a.id)));
    const countMismatch=monthActs.filter(a=>{const total=Number(a.beneficiaries_total)||0,parts=(Number(a.beneficiaries_female)||0)+(Number(a.beneficiaries_male)||0)+(Number(a.beneficiaries_other)||0);return total>0&&parts!==total});
    const noDocs=fin.filter(x=>!x.document_path);
    const alerts=[];
    if(!monthActs.length)alerts.push({type:'warn',icon:'⚠️',title:'لا توجد أنشطة موثقة لهذا الشهر',text:`لم يتم توثيق أي نشاط في ${monthNames[month-1]}.`,go:'reports',action:'توثيق نشاط'});
    if(missingImages.length)alerts.push({type:'info',icon:'🖼️',title:`${missingImages.length} نشاط/أنشطة بدون صور`,text:'إضافة الصور تقوي التقرير الأدبي والتوثيق المؤسسي.',go:'reports',action:'مراجعة الأنشطة'});
    if(countMismatch.length)alerts.push({type:'warn',icon:'🔢',title:`${countMismatch.length} نشاط/أنشطة تحتاج مراجعة أعداد المشاركين`,text:'الإجمالي لا يساوي مجموع الإناث والذكور وغير المحدد.',go:'reports',action:'مراجعة الأرقام'});
    if(!periodRes.data)alerts.push({type:'info',icon:'📝',title:'ملاحظات التقرير الشهري غير محفوظة بعد',text:`يمكن إعداد مقدمة ومنجزات وتحديات وتوصيات تقرير ${monthNames[month-1]}.`,go:'reports',action:'فتح التقارير'});
    if(!finSettingsRes.data)alerts.push({type:'warn',icon:'💰',title:`إعدادات السنة المالية ${year} غير محددة`,text:'أدخل الرصيد الافتتاحي والميزانية المعتمدة للحصول على حصيلة أدق.',go:'finance',action:'إعداد المالية'});
    if(noDocs.length)alerts.push({type:'info',icon:'🧾',title:`${noDocs.length} عملية مالية بدون مرفق`,text:'يمكن إرفاق الفاتورة أو الوصل أو الوثيقة المرجعية عند توفرها.',go:'finance',action:'مراجعة العمليات'});
    if(pendingAdmin.length)alerts.push({type:'info',icon:'📌',title:`${pendingAdmin.length} سجل/سجلات إدارية تحتاج متابعة`,text:'هناك سجلات مبرمجة أو ما زالت قيد المتابعة.',go:'admin-record',action:'فتح السجل'});
    if(newMessages.length)alerts.push({type:'info',icon:'✉️',title:`${newMessages.length} رسالة جديدة`,text:'توجد رسائل لم تتم قراءتها بعد.',go:'messages',action:'قراءة الرسائل'});
    if(!alerts.length)alerts.push({type:'ok',icon:'✓',title:'لا توجد تنبيهات عاجلة',text:'المؤشرات الأساسية مكتملة وفق البيانات المسجلة حالياً.'});
    document.getElementById('dashAlertCount').textContent=alerts.filter(a=>a.type!=='ok').length;
    document.getElementById('dashAlerts').innerHTML=alerts.map(a=>`<div class="dash-alert ${a.type}"><span class="icon">${a.icon}</span><div class="body"><strong>${esc(a.title)}</strong><p>${esc(a.text)}</p>${a.go?`<button type="button" class="secondary" data-dash-go="${a.go}">${esc(a.action)}</button>`:''}</div></div>`).join('');

    const monthCounts=Array(12).fill(0);acts.forEach(a=>{const m=Number(String(a.start_date||'').slice(5,7));if(m>=1&&m<=12)monthCounts[m-1]++});
    const covered=monthCounts.slice(0,month).filter(Boolean).length;
    document.getElementById('dashCoverageLabel').textContent=`${covered}/${month}`;
    document.getElementById('dashMonthCoverage').innerHTML=monthCounts.map((n,i)=>`<div class="dash-month ${n?'done':''} ${i===month-1?'current':''}"><b>${n}</b>${monthNames[i].slice(0,3)}</div>`).join('');

    const budgetPct=approved>0?Math.min(100,Math.round(expenses/approved*100)):0;
    document.getElementById('dashBudget').innerHTML=approved>0?`<div class="dash-budget-main">${budgetPct}%</div><p>من الميزانية المعتمدة تم تسجيله كمصاريف.</p><div class="dash-budget-track"><div class="dash-budget-fill" style="width:${budgetPct}%"></div></div><div class="dash-budget-numbers"><span>المصاريف: ${esc(money(expenses))}</span><span>الميزانية: ${esc(money(approved))}</span></div><p style="margin-top:14px"><b>الرصيد الحالي:</b> ${esc(money(balance))}</p>`:`<p>لم يتم تحديد الميزانية المعتمدة لسنة ${year} بعد.</p><button type="button" class="secondary" data-dash-go="finance">إعداد السنة المالية</button>`;

    document.getElementById('dashRecentActivities').innerHTML=acts.length?acts.slice(0,5).map(activityCard).join(''):'<div class="empty">لا توجد أنشطة موثقة بعد.</div>';
    const operations=fin.slice(0,5);
    document.getElementById('dashRecentOperations').innerHTML=operations.length?operations.map(operationCard).join(''):'<div class="empty">لا توجد عمليات مالية بعد.</div>';

    updated.textContent='آخر تحديث: '+new Date().toLocaleTimeString('ar-MA',{hour:'2-digit',minute:'2-digit'});
  }

  document.getElementById('dashRefresh').addEventListener('click',loadDashboard);
  client.auth.onAuthStateChange(()=>setTimeout(loadDashboard,180));
  setTimeout(loadDashboard,250);
})();