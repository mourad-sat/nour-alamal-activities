(function(){
  const tabs=document.getElementById('tabs');
  const adminView=document.getElementById('adminView');
  if(!tabs||!adminView||document.getElementById('governanceFinancePanel'))return;

  const esc=window.escapeHtml||((v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])));
  const today=()=>new Date().toISOString().slice(0,10);
  const currentYear=()=>new Date().getFullYear();
  const money=v=>new Intl.NumberFormat('ar-MA',{style:'currency',currency:'MAD',maximumFractionDigits:2}).format(Number(v)||0);
  let adminRecords=[];
  let financeRows=[];
  let editingAdminDocument=null;
  let editingFinanceDocument=null;

  const tab=document.createElement('button');
  tab.dataset.tab='governance-finance';
  tab.textContent='الإدارة والمالية';
  tabs.appendChild(tab);

  const panel=document.createElement('section');
  panel.id='governanceFinancePanel';
  panel.className='tab-panel hidden';
  panel.dataset.panel='governance-finance';
  panel.innerHTML=`
    <div class="gf-shell">
      <section class="panel gf-hero">
        <div><span class="badge">قسم داخلي مستقل</span><h2>الإدارة والمالية</h2><p>تتبع السجل الإداري والوثائق والمداخيل والمصاريف والحصيلة السنوية للجمعية. هذه البيانات لا تظهر في الموقع العام.</p></div>
        <div class="gf-year-control"><label>السنة<input id="gfYear" type="number" min="2000" max="2200"></label><button id="gfRefresh" type="button" class="secondary">تحديث الحصيلة</button></div>
      </section>

      <section class="gf-stats" id="gfStats">
        <div class="gf-stat"><span>الرصيد الافتتاحي</span><b>0</b></div><div class="gf-stat"><span>المداخيل</span><b>0</b></div><div class="gf-stat"><span>المصاريف</span><b>0</b></div><div class="gf-stat"><span>الرصيد الحالي</span><b>0</b></div><div class="gf-stat"><span>الميزانية المعتمدة</span><b>0</b></div><div class="gf-stat"><span>السجلات الإدارية</span><b>0</b></div>
      </section>

      <nav class="gf-subtabs"><button class="active" data-gf-view="overview">نظرة عامة</button><button data-gf-view="admin">السجل الإداري</button><button data-gf-view="finance">السجل المالي</button></nav>

      <section class="gf-view" data-gf-panel="overview">
        <div class="admin-grid">
          <section class="panel"><div class="list-head"><div><span class="badge">الحكامة</span><h3>آخر السجلات الإدارية</h3></div><button type="button" class="secondary" data-gf-go="admin">فتح السجل</button></div><div id="gfRecentAdmin" class="posts-list"></div></section>
          <section class="panel"><div class="list-head"><div><span class="badge">المالية</span><h3>آخر العمليات المالية</h3></div><button type="button" class="secondary" data-gf-go="finance">فتح السجل</button></div><div id="gfRecentFinance" class="posts-list"></div></section>
        </div>
        <section class="panel gf-budget-panel"><div class="list-head"><div><h3>إعدادات السنة المالية</h3><p>الرصيد في بداية السنة والميزانية التقديرية/المعتمدة.</p></div></div><form id="gfYearForm"><div class="three"><label>الرصيد الافتتاحي (درهم)<input id="gfOpeningBalance" type="number" step="0.01" value="0"></label><label>الميزانية المعتمدة (درهم)<input id="gfApprovedBudget" type="number" min="0" step="0.01" value="0"></label><label>السنة<input id="gfYearMirror" type="number" readonly></label></div><label>ملاحظات السنة<textarea id="gfYearNotes" rows="3" placeholder="ملاحظات مالية عامة، قرار اعتماد الميزانية..."></textarea></label><button type="submit">حفظ إعدادات السنة</button><span id="gfYearMsg" class="msg"></span></form></section>
      </section>

      <section class="gf-view hidden" data-gf-panel="admin">
        <div class="admin-grid">
          <section class="panel editor"><div class="section-title"><div><span class="badge">السجل الإداري</span><h2 id="gfAdminFormTitle">إضافة سجل إداري</h2></div><button id="gfAdminNew" type="button" class="secondary">+ جديد</button></div>
            <form id="gfAdminForm"><input id="gfAdminId" type="hidden">
              <div class="two"><label>نوع السجل<select id="gfAdminType"><option value="meeting">اجتماع المكتب</option><option value="general_assembly">جمع عام</option><option value="partnership">شراكة أو اتفاقية</option><option value="correspondence">مراسلة</option><option value="decision">قرار إداري</option><option value="volunteer">متطوعون وموارد بشرية</option><option value="equipment">تجهيزات وممتلكات</option><option value="other">أخرى</option></select></label><label>التاريخ<input id="gfAdminDate" type="date" required></label></div>
              <label>العنوان<input id="gfAdminTitle" required maxlength="220"></label>
              <div class="two"><label>المرجع / رقم الوثيقة<input id="gfAdminReference" maxlength="120"></label><label>الحالة<select id="gfAdminStatus"><option value="completed">منجز</option><option value="planned">مبرمج</option><option value="pending">قيد المتابعة</option><option value="archived">مؤرشف</option></select></label></div>
              <label>الأطراف / المشاركون<input id="gfAdminParties" maxlength="400" placeholder="أعضاء المكتب، الشريك، الجهة المراسلة..."></label>
              <label>الوصف أو موضوع السجل<textarea id="gfAdminDescription" rows="4"></textarea></label>
              <label>القرارات / المخرجات<textarea id="gfAdminDecisions" rows="4"></textarea></label>
              <label>إرفاق وثيقة خاصة<input id="gfAdminFile" type="file" accept="application/pdf,image/jpeg,image/png,image/webp"><small>PDF أو صورة، حتى 10MB. تحفظ في مساحة خاصة للمديرين.</small></label>
              <div id="gfAdminDocument" class="gf-document-slot"></div>
              <div class="actions"><button type="submit">حفظ السجل</button><button id="gfAdminCancel" type="button" class="secondary">إلغاء</button></div><p id="gfAdminMsg" class="msg"></p>
            </form>
          </section>
          <section class="panel list-panel"><div class="list-head"><div><h2>السجلات الإدارية</h2><p>المحاضر، الاتفاقيات، المراسلات والقرارات وغيرها.</p></div><button id="gfAdminRefresh" type="button" class="secondary">تحديث</button></div><div class="two"><label>السنة<input id="gfAdminYear" type="number" min="2000" max="2200"></label><label>بحث<input id="gfAdminSearch" type="search" placeholder="عنوان، مرجع، طرف..."></label></div><div id="gfAdminList" class="posts-list"></div></section>
        </div>
      </section>

      <section class="gf-view hidden" data-gf-panel="finance">
        <div class="admin-grid">
          <section class="panel editor"><div class="section-title"><div><span class="badge">السجل المالي</span><h2 id="gfFinanceFormTitle">إضافة عملية مالية</h2></div><button id="gfFinanceNew" type="button" class="secondary">+ جديد</button></div>
            <form id="gfFinanceForm"><input id="gfFinanceId" type="hidden">
              <div class="three"><label>النوع<select id="gfFinanceType"><option value="income">مدخول</option><option value="expense">مصروف</option></select></label><label>التاريخ<input id="gfFinanceDate" type="date" required></label><label>المبلغ (درهم)<input id="gfFinanceAmount" type="number" min="0" step="0.01" required></label></div>
              <div class="two"><label>التصنيف<input id="gfFinanceCategory" list="gfFinanceCategories" required placeholder="اختر أو اكتب تصنيفاً"><datalist id="gfFinanceCategories"><option value="منحة"><option value="تبرع"><option value="واجبات الانخراط"><option value="مداخيل خدمات"><option value="كراء"><option value="معدات وتجهيزات"><option value="لوازم مكتبية"><option value="نقل وتنقل"><option value="تكوين وتأطير"><option value="تواصل وطباعة"><option value="خدمات ومصاريف إدارية"><option value="أخرى"></datalist></label><label>طريقة الأداء<select id="gfFinancePayment"><option value="">غير محدد</option><option value="نقداً">نقداً</option><option value="تحويل بنكي">تحويل بنكي</option><option value="شيك">شيك</option><option value="بطاقة">بطاقة</option><option value="أخرى">أخرى</option></select></label></div>
              <div class="two"><label>المرجع / رقم الوصل<input id="gfFinanceReference" maxlength="140"></label><label>الجهة / المستفيد / الممول<input id="gfFinanceCounterparty" maxlength="220"></label></div>
              <label>المشروع أو البرنامج (اختياري)<input id="gfFinanceProject" maxlength="220"></label>
              <label>البيان / الوصف<textarea id="gfFinanceDescription" rows="4"></textarea></label>
              <label>إرفاق فاتورة أو وصل أو وثيقة<input id="gfFinanceFile" type="file" accept="application/pdf,image/jpeg,image/png,image/webp"><small>PDF أو صورة، حتى 10MB، ولا تظهر للعامة.</small></label>
              <div id="gfFinanceDocument" class="gf-document-slot"></div>
              <div class="actions"><button type="submit">حفظ العملية</button><button id="gfFinanceCancel" type="button" class="secondary">إلغاء</button></div><p id="gfFinanceMsg" class="msg"></p>
            </form>
          </section>
          <section class="panel list-panel"><div class="list-head"><div><h2>العمليات المالية</h2><p>المداخيل والمصاريف المسجلة حسب السنة.</p></div><button id="gfFinanceRefresh" type="button" class="secondary">تحديث</button></div><div class="three"><label>السنة<input id="gfFinanceYear" type="number" min="2000" max="2200"></label><label>النوع<select id="gfFinanceFilterType"><option value="">الكل</option><option value="income">المداخيل</option><option value="expense">المصاريف</option></select></label><label>بحث<input id="gfFinanceSearch" type="search" placeholder="تصنيف، مرجع، جهة..."></label></div><div id="gfFinanceList" class="posts-list"></div></section>
        </div>
      </section>
    </div>`;
  adminView.appendChild(panel);

  const style=document.createElement('style');
  style.textContent=`.gf-shell{display:grid;gap:18px}.gf-hero{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}.gf-hero h2{margin:8px 0}.gf-year-control{display:flex;align-items:end;gap:8px}.gf-year-control label{margin:0;min-width:130px}.gf-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}.gf-stat{background:#fff;border:1px solid #dbe8e6;border-radius:18px;padding:16px;box-shadow:0 8px 24px rgba(8,47,44,.05)}.gf-stat span{display:block;font-size:10px;color:#718682;margin-bottom:6px}.gf-stat b{display:block;font-size:20px;color:#0f766e}.gf-subtabs{display:flex;gap:8px;flex-wrap:wrap}.gf-subtabs button{background:#e5efed;color:#274744}.gf-subtabs button.active{background:#082f2c;color:#fff}.gf-budget-panel{margin-top:18px}.gf-document-slot{margin:10px 0}.gf-document-card{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#f3f8f7;border:1px solid #dce8e6;border-radius:13px;padding:10px 12px;font-size:12px}.gf-document-card button{padding:7px 10px;font-size:11px}.gf-finance-amount{font-size:15px;font-weight:800}.gf-income{color:#17754c}.gf-expense{color:#a33131}.gf-type-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#edf5f4;color:#365b57;font-size:10px;font-weight:800}.gf-record-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:7px;font-size:10px;color:#718682}@media(max-width:1050px){.gf-stats{grid-template-columns:repeat(3,1fr)}}@media(max-width:700px){.gf-hero{flex-direction:column}.gf-year-control{width:100%;flex-wrap:wrap}.gf-stats{grid-template-columns:repeat(2,1fr)}}`;
  document.head.appendChild(style);

  const typeLabel=v=>({meeting:'اجتماع المكتب',general_assembly:'جمع عام',partnership:'شراكة أو اتفاقية',correspondence:'مراسلة',decision:'قرار إداري',volunteer:'متطوعون وموارد بشرية',equipment:'تجهيزات وممتلكات',other:'أخرى'})[v]||v;
  const statusLabel=v=>({completed:'منجز',planned:'مبرمج',pending:'قيد المتابعة',archived:'مؤرشف'})[v]||v;

  function switchView(name){
    panel.querySelectorAll('[data-gf-view]').forEach(b=>b.classList.toggle('active',b.dataset.gfView===name));
    panel.querySelectorAll('[data-gf-panel]').forEach(p=>p.classList.toggle('hidden',p.dataset.gfPanel!==name));
  }
  panel.querySelector('.gf-subtabs').addEventListener('click',e=>{const b=e.target.closest('[data-gf-view]');if(b)switchView(b.dataset.gfView)});
  panel.addEventListener('click',e=>{const b=e.target.closest('[data-gf-go]');if(b)switchView(b.dataset.gfGo)});

  function sanitizeFilename(name='file'){return name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').slice(-120)||'file'}
  async function uploadPrivate(file,folder){
    if(!file)return null;
    if(file.size>10*1024*1024)throw new Error('حجم الملف يتجاوز 10MB');
    const allowed=['application/pdf','image/jpeg','image/png','image/webp'];
    if(!allowed.includes(file.type))throw new Error('نوع الملف غير مسموح');
    const path=`${folder}/${new Date().getFullYear()}/${Date.now()}-${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
    const {error}=await client.storage.from('admin-private').upload(path,file,{upsert:false});
    if(error)throw error;
    return path;
  }
  async function signedUrl(path){if(!path)return null;const {data,error}=await client.storage.from('admin-private').createSignedUrl(path,900);if(error)throw error;return data.signedUrl}
  async function removePrivate(path){if(path)await client.storage.from('admin-private').remove([path])}
  async function openPrivate(path){try{const url=await signedUrl(path);window.open(url,'_blank','noopener')}catch(e){alert('تعذر فتح الوثيقة الخاصة.') }}

  function renderDocumentSlot(id,path){
    const box=$(id);if(!box)return;
    box.innerHTML=path?`<div class="gf-document-card"><span>📎 توجد وثيقة مرفقة محفوظة بشكل خاص</span><button type="button" class="secondary" data-gf-open-doc="${esc(path)}">فتح الوثيقة</button></div>`:'';
  }
  panel.addEventListener('click',e=>{const b=e.target.closest('[data-gf-open-doc]');if(b)openPrivate(b.dataset.gfOpenDoc)});

  function resetAdminForm(){
    $('gfAdminForm').reset();$('gfAdminId').value='';$('gfAdminDate').value=today();$('gfAdminStatus').value='completed';$('gfAdminFormTitle').textContent='إضافة سجل إداري';$('gfAdminMsg').textContent='';editingAdminDocument=null;renderDocumentSlot('gfAdminDocument',null);
  }
  function resetFinanceForm(){
    $('gfFinanceForm').reset();$('gfFinanceId').value='';$('gfFinanceDate').value=today();$('gfFinanceType').value='income';$('gfFinanceFormTitle').textContent='إضافة عملية مالية';$('gfFinanceMsg').textContent='';editingFinanceDocument=null;renderDocumentSlot('gfFinanceDocument',null);
  }

  async function loadYearSettings(){
    const year=Number($('gfYear').value)||currentYear();$('gfYearMirror').value=year;
    const {data}=await client.from('finance_year_settings').select('*').eq('year',year).maybeSingle();
    $('gfOpeningBalance').value=Number(data?.opening_balance)||0;$('gfApprovedBudget').value=Number(data?.approved_budget)||0;$('gfYearNotes').value=data?.notes||'';
    return data||{year,opening_balance:0,approved_budget:0,notes:''};
  }

  async function loadAdminRecords(){
    const year=Number($('gfAdminYear').value)||Number($('gfYear').value)||currentYear();
    const from=`${year}-01-01`,to=`${year}-12-31`;
    const {data,error}=await client.from('association_admin_records').select('*').gte('record_date',from).lte('record_date',to).order('record_date',{ascending:false}).order('created_at',{ascending:false});
    adminRecords=error?[]:(data||[]);renderAdminList();renderRecentAdmin();
  }
  function filteredAdmin(){const q=($('gfAdminSearch').value||'').trim().toLowerCase();return adminRecords.filter(r=>!q||[r.title,r.reference,r.parties,r.description,typeLabel(r.record_type)].some(v=>String(v||'').toLowerCase().includes(q)))}
  function adminCard(r){return `<article class="post-item"><div class="post-top"><div><h3>${esc(r.title)}</h3><small>${new Date(r.record_date+'T12:00:00').toLocaleDateString('ar-MA')} · ${esc(typeLabel(r.record_type))}</small></div><span class="status ${r.status==='completed'?'published':'draft'}">${esc(statusLabel(r.status))}</span></div><div class="gf-record-meta">${r.reference?`<span>مرجع: ${esc(r.reference)}</span>`:''}${r.parties?`<span>الأطراف: ${esc(r.parties)}</span>`:''}${r.document_path?'<span>📎 وثيقة</span>':''}</div><div class="post-actions"><button data-gf-admin-edit="${r.id}">تعديل</button>${r.document_path?`<button class="secondary" data-gf-open-doc="${esc(r.document_path)}">فتح الوثيقة</button>`:''}<button class="danger" data-gf-admin-delete="${r.id}">حذف</button></div></article>`}
  function renderAdminList(){const box=$('gfAdminList'),rows=filteredAdmin();box.innerHTML=rows.length?rows.map(adminCard).join(''):'<div class="empty">لا توجد سجلات إدارية مطابقة.</div>'}
  function renderRecentAdmin(){const box=$('gfRecentAdmin');const rows=adminRecords.slice(0,4);box.innerHTML=rows.length?rows.map(r=>`<article class="post-item"><h3>${esc(r.title)}</h3><small>${new Date(r.record_date+'T12:00:00').toLocaleDateString('ar-MA')} · ${esc(typeLabel(r.record_type))}</small></article>`).join(''):'<div class="empty">لا توجد سجلات بعد.</div>'}

  async function loadFinanceRows(){
    const year=Number($('gfFinanceYear').value)||Number($('gfYear').value)||currentYear();
    const {data,error}=await client.from('finance_transactions').select('*').gte('transaction_date',`${year}-01-01`).lte('transaction_date',`${year}-12-31`).order('transaction_date',{ascending:false}).order('created_at',{ascending:false});
    financeRows=error?[]:(data||[]);renderFinanceList();renderRecentFinance();
  }
  function filteredFinance(){const q=($('gfFinanceSearch').value||'').trim().toLowerCase(),type=$('gfFinanceFilterType').value;return financeRows.filter(r=>(!type||r.transaction_type===type)&&(!q||[r.category,r.reference,r.counterparty,r.project_name,r.description].some(v=>String(v||'').toLowerCase().includes(q))))}
  function financeCard(r){const income=r.transaction_type==='income';return `<article class="post-item"><div class="post-top"><div><h3>${esc(r.category)}</h3><small>${new Date(r.transaction_date+'T12:00:00').toLocaleDateString('ar-MA')} ${r.counterparty?' · '+esc(r.counterparty):''}</small></div><div><span class="gf-type-pill">${income?'مدخول':'مصروف'}</span> <span class="gf-finance-amount ${income?'gf-income':'gf-expense'}">${income?'+':'−'} ${money(r.amount)}</span></div></div><div class="gf-record-meta">${r.reference?`<span>مرجع: ${esc(r.reference)}</span>`:''}${r.payment_method?`<span>${esc(r.payment_method)}</span>`:''}${r.project_name?`<span>${esc(r.project_name)}</span>`:''}${r.document_path?'<span>📎 وثيقة</span>':''}</div><div class="post-actions"><button data-gf-finance-edit="${r.id}">تعديل</button>${r.document_path?`<button class="secondary" data-gf-open-doc="${esc(r.document_path)}">فتح الوثيقة</button>`:''}<button class="danger" data-gf-finance-delete="${r.id}">حذف</button></div></article>`}
  function renderFinanceList(){const rows=filteredFinance();$('gfFinanceList').innerHTML=rows.length?rows.map(financeCard).join(''):'<div class="empty">لا توجد عمليات مالية مطابقة.</div>'}
  function renderRecentFinance(){const rows=financeRows.slice(0,4);$('gfRecentFinance').innerHTML=rows.length?rows.map(r=>`<article class="post-item"><div class="post-top"><div><h3>${esc(r.category)}</h3><small>${new Date(r.transaction_date+'T12:00:00').toLocaleDateString('ar-MA')}</small></div><b class="gf-finance-amount ${r.transaction_type==='income'?'gf-income':'gf-expense'}">${r.transaction_type==='income'?'+':'−'} ${money(r.amount)}</b></div></article>`).join(''):'<div class="empty">لا توجد عمليات مالية بعد.</div>'}

  async function refreshDashboard(){
    const year=Number($('gfYear').value)||currentYear();$('gfAdminYear').value=year;$('gfFinanceYear').value=year;
    const settings=await loadYearSettings();
    await Promise.all([loadAdminRecords(),loadFinanceRows()]);
    const income=financeRows.filter(r=>r.transaction_type==='income').reduce((a,r)=>a+Number(r.amount||0),0);
    const expense=financeRows.filter(r=>r.transaction_type==='expense').reduce((a,r)=>a+Number(r.amount||0),0);
    const opening=Number(settings.opening_balance||0),closing=opening+income-expense,budget=Number(settings.approved_budget||0);
    $('gfStats').innerHTML=`<div class="gf-stat"><span>الرصيد الافتتاحي</span><b>${money(opening)}</b></div><div class="gf-stat"><span>المداخيل</span><b>${money(income)}</b></div><div class="gf-stat"><span>المصاريف</span><b>${money(expense)}</b></div><div class="gf-stat"><span>الرصيد الحالي</span><b>${money(closing)}</b></div><div class="gf-stat"><span>الميزانية المعتمدة</span><b>${money(budget)}</b></div><div class="gf-stat"><span>السجلات الإدارية</span><b>${adminRecords.length}</b></div>`;
  }

  $('gfYearForm').addEventListener('submit',async e=>{e.preventDefault();const year=Number($('gfYear').value)||currentYear(),row={year,opening_balance:Number($('gfOpeningBalance').value)||0,approved_budget:Number($('gfApprovedBudget').value)||0,notes:$('gfYearNotes').value.trim()};const {error}=await client.from('finance_year_settings').upsert(row,{onConflict:'year'});$('gfYearMsg').textContent=error?'تعذر حفظ إعدادات السنة.':'تم حفظ إعدادات السنة.';if(!error)refreshDashboard()});

  $('gfAdminForm').addEventListener('submit',async e=>{e.preventDefault();const msg=$('gfAdminMsg');msg.textContent='جارٍ الحفظ...';try{const id=$('gfAdminId').value;let documentPath=editingAdminDocument;const file=$('gfAdminFile').files[0];if(file){const newPath=await uploadPrivate(file,'administration');if(editingAdminDocument)await removePrivate(editingAdminDocument);documentPath=newPath}const payload={record_type:$('gfAdminType').value,record_date:$('gfAdminDate').value,title:$('gfAdminTitle').value.trim(),reference:$('gfAdminReference').value.trim(),parties:$('gfAdminParties').value.trim(),description:$('gfAdminDescription').value.trim(),decisions:$('gfAdminDecisions').value.trim(),status:$('gfAdminStatus').value,document_path:documentPath};const res=id?await client.from('association_admin_records').update(payload).eq('id',id):await client.from('association_admin_records').insert(payload);if(res.error)throw res.error;resetAdminForm();await refreshDashboard();msg.textContent='تم حفظ السجل الإداري.'}catch(err){msg.textContent='تعذر الحفظ: '+(err.message||'خطأ')}});
  $('gfFinanceForm').addEventListener('submit',async e=>{e.preventDefault();const msg=$('gfFinanceMsg');msg.textContent='جارٍ الحفظ...';try{const id=$('gfFinanceId').value;let documentPath=editingFinanceDocument;const file=$('gfFinanceFile').files[0];if(file){const newPath=await uploadPrivate(file,'finance');if(editingFinanceDocument)await removePrivate(editingFinanceDocument);documentPath=newPath}const payload={transaction_type:$('gfFinanceType').value,transaction_date:$('gfFinanceDate').value,category:$('gfFinanceCategory').value.trim(),amount:Number($('gfFinanceAmount').value)||0,payment_method:$('gfFinancePayment').value,reference:$('gfFinanceReference').value.trim(),counterparty:$('gfFinanceCounterparty').value.trim(),project_name:$('gfFinanceProject').value.trim(),description:$('gfFinanceDescription').value.trim(),document_path:documentPath};const res=id?await client.from('finance_transactions').update(payload).eq('id',id):await client.from('finance_transactions').insert(payload);if(res.error)throw res.error;resetFinanceForm();await refreshDashboard();msg.textContent='تم حفظ العملية المالية.'}catch(err){msg.textContent='تعذر الحفظ: '+(err.message||'خطأ')}});

  $('gfAdminList').addEventListener('click',async e=>{const edit=e.target.dataset.gfAdminEdit,del=e.target.dataset.gfAdminDelete;if(edit){const r=adminRecords.find(x=>String(x.id)===String(edit));if(!r)return;$('gfAdminId').value=r.id;$('gfAdminType').value=r.record_type;$('gfAdminDate').value=r.record_date;$('gfAdminTitle').value=r.title||'';$('gfAdminReference').value=r.reference||'';$('gfAdminStatus').value=r.status||'completed';$('gfAdminParties').value=r.parties||'';$('gfAdminDescription').value=r.description||'';$('gfAdminDecisions').value=r.decisions||'';editingAdminDocument=r.document_path||null;renderDocumentSlot('gfAdminDocument',editingAdminDocument);$('gfAdminFormTitle').textContent='تعديل السجل الإداري';$('gfAdminForm').scrollIntoView({behavior:'smooth',block:'start'})}if(del){const r=adminRecords.find(x=>String(x.id)===String(del));if(!r||!confirm('هل تريد حذف هذا السجل الإداري نهائياً؟'))return;const {error}=await client.from('association_admin_records').delete().eq('id',r.id);if(!error){await removePrivate(r.document_path);await refreshDashboard()}}});
  $('gfFinanceList').addEventListener('click',async e=>{const edit=e.target.dataset.gfFinanceEdit,del=e.target.dataset.gfFinanceDelete;if(edit){const r=financeRows.find(x=>String(x.id)===String(edit));if(!r)return;$('gfFinanceId').value=r.id;$('gfFinanceType').value=r.transaction_type;$('gfFinanceDate').value=r.transaction_date;$('gfFinanceCategory').value=r.category||'';$('gfFinanceAmount').value=Number(r.amount)||0;$('gfFinancePayment').value=r.payment_method||'';$('gfFinanceReference').value=r.reference||'';$('gfFinanceCounterparty').value=r.counterparty||'';$('gfFinanceProject').value=r.project_name||'';$('gfFinanceDescription').value=r.description||'';editingFinanceDocument=r.document_path||null;renderDocumentSlot('gfFinanceDocument',editingFinanceDocument);$('gfFinanceFormTitle').textContent='تعديل العملية المالية';$('gfFinanceForm').scrollIntoView({behavior:'smooth',block:'start'})}if(del){const r=financeRows.find(x=>String(x.id)===String(del));if(!r||!confirm('هل تريد حذف هذه العملية المالية نهائياً؟'))return;const {error}=await client.from('finance_transactions').delete().eq('id',r.id);if(!error){await removePrivate(r.document_path);await refreshDashboard()}}});

  $('gfAdminNew').addEventListener('click',resetAdminForm);$('gfAdminCancel').addEventListener('click',resetAdminForm);$('gfFinanceNew').addEventListener('click',resetFinanceForm);$('gfFinanceCancel').addEventListener('click',resetFinanceForm);
  $('gfAdminRefresh').addEventListener('click',loadAdminRecords);$('gfFinanceRefresh').addEventListener('click',loadFinanceRows);$('gfRefresh').addEventListener('click',refreshDashboard);
  $('gfAdminSearch').addEventListener('input',renderAdminList);$('gfFinanceSearch').addEventListener('input',renderFinanceList);$('gfFinanceFilterType').addEventListener('change',renderFinanceList);
  $('gfAdminYear').addEventListener('change',loadAdminRecords);$('gfFinanceYear').addEventListener('change',loadFinanceRows);$('gfYear').addEventListener('change',refreshDashboard);

  async function init(){const {data:{user}}=await client.auth.getUser();if(!user)return;const {data}=await client.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();if(!data)return;const y=currentYear();$('gfYear').value=y;$('gfAdminYear').value=y;$('gfFinanceYear').value=y;resetAdminForm();resetFinanceForm();await refreshDashboard()}
  client.auth.onAuthStateChange(()=>setTimeout(init,50));
  init();
})();