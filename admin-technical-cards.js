(function(){
  const tabs=document.getElementById('tabs');
  const adminView=document.getElementById('adminView');
  if(!tabs||!adminView||document.getElementById('technicalCardsPanel'))return;

  const esc=window.escapeHtml||((v='')=>String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])));
  const money=v=>new Intl.NumberFormat('ar-MA',{style:'currency',currency:'MAD',maximumFractionDigits:2}).format(Number(v)||0);
  const statusLabels={draft:'مسودة',approved:'معتمدة',archived:'مؤرشفة'};
  let programs=[];
  let programCards=[];
  let activityCards=[];

  const tab=document.createElement('button');
  tab.dataset.tab='technical-cards';
  tab.textContent='البطاقات التقنية';
  const contentTab=tabs.querySelector('[data-tab="content"]');
  if(contentTab?.nextSibling)tabs.insertBefore(tab,contentTab.nextSibling);else tabs.appendChild(tab);

  const panel=document.createElement('section');
  panel.id='technicalCardsPanel';
  panel.className='tab-panel hidden';
  panel.dataset.panel='technical-cards';
  panel.innerHTML=`
    <div class="tc-shell">
      <section class="panel tc-hero">
        <div><span class="badge">التخطيط والتوثيق</span><h2>البطاقات التقنية للبرامج والأنشطة</h2><p>إعداد بطاقات مرجعية موحدة تساعد على تخطيط البرامج والأنشطة قبل التنفيذ والرجوع إليها لاحقاً.</p></div>
        <div class="tc-hero-actions"><button type="button" data-tc-go="program">+ بطاقة برنامج</button><button type="button" data-tc-go="activity" class="secondary">+ بطاقة نشاط</button></div>
      </section>

      <section id="tcStats" class="tc-stats"></section>

      <nav class="tc-subtabs">
        <button type="button" class="active" data-tc-view="program">بطاقات البرامج</button>
        <button type="button" data-tc-view="activity">بطاقات الأنشطة</button>
      </nav>

      <section class="tc-view" data-tc-panel="program">
        <div class="admin-grid">
          <section class="panel editor">
            <div class="section-title"><div><span class="badge">بطاقة برنامج</span><h2 id="tcProgramFormTitle">بطاقة برنامج جديدة</h2></div><button id="tcProgramNew" type="button" class="secondary">+ جديد</button></div>
            <form id="tcProgramForm"><input id="tcProgramId" type="hidden">
              <div class="two"><label>البرنامج الموجود في الموقع (اختياري)<select id="tcProgramLink"><option value="">بدون ربط</option></select></label><label>حالة البطاقة<select id="tcProgramStatus"><option value="draft">مسودة</option><option value="approved">معتمدة</option><option value="archived">مؤرشفة</option></select></label></div>
              <div class="two"><label>اسم البرنامج<input id="tcProgramTitle" required maxlength="220"></label><label>المرجع / رقم البطاقة<input id="tcProgramReference" maxlength="120" placeholder="مثال: FT-PROG-2026-01"></label></div>
              <label>السياق والحاجة التي يستجيب لها البرنامج<textarea id="tcProgramContext" rows="4"></textarea></label>
              <label>الهدف العام<textarea id="tcProgramGeneralObjective" rows="3"></textarea></label>
              <label>الأهداف الخاصة<textarea id="tcProgramSpecificObjectives" rows="4" placeholder="يمكن كتابة كل هدف في سطر"></textarea></label>
              <div class="two"><label>الفئة المستهدفة<input id="tcProgramTargetGroup" maxlength="260"></label><label>مدة البرنامج<input id="tcProgramDuration" maxlength="160" placeholder="مثال: 10 أشهر"></label></div>
              <label>المجال الترابي / مناطق التدخل<input id="tcProgramTerritory" maxlength="260"></label>
              <label>الشركاء<textarea id="tcProgramPartners" rows="3"></textarea></label>
              <label>الموارد البشرية والتأطير<textarea id="tcProgramHumanResources" rows="3"></textarea></label>
              <label>الأنشطة والمحاور الرئيسية<textarea id="tcProgramMainActivities" rows="5"></textarea></label>
              <label>مؤشرات التتبع والقياس<textarea id="tcProgramIndicators" rows="4"></textarea></label>
              <label>النتائج المنتظرة<textarea id="tcProgramExpectedResults" rows="4"></textarea></label>
              <div class="three"><label>الميزانية التقديرية (درهم)<input id="tcProgramBudget" type="number" min="0" step="0.01" value="0"></label><label>المسؤول عن البرنامج<input id="tcProgramManager" maxlength="180"></label><label>صورة اختيارية<input id="tcProgramImageFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label></div>
              <label>أو رابط/مسار الصورة<input id="tcProgramImageUrl" type="text" inputmode="url" placeholder="https://... أو assets/image.webp"></label>
              <div class="two"><label>تاريخ البداية<input id="tcProgramStartDate" type="date"></label><label>تاريخ النهاية<input id="tcProgramEndDate" type="date"></label></div>
              <label>ملاحظات إضافية<textarea id="tcProgramNotes" rows="3"></textarea></label>
              <div class="actions"><button type="submit">حفظ البطاقة</button><button id="tcProgramCancel" type="button" class="secondary">إلغاء</button></div><p id="tcProgramMsg" class="msg"></p>
            </form>
          </section>
          <section class="panel list-panel">
            <div class="list-head"><div><h2>بطاقات البرامج</h2><p>يمكن تعديل البطاقة أو نسخها أو أرشفتها.</p></div><button id="tcProgramRefresh" type="button" class="secondary">تحديث</button></div>
            <div class="two"><label>الحالة<select id="tcProgramFilterStatus"><option value="">الكل</option><option value="draft">مسودة</option><option value="approved">معتمدة</option><option value="archived">مؤرشفة</option></select></label><label>بحث<input id="tcProgramSearch" type="search" placeholder="اسم البرنامج أو المرجع..."></label></div>
            <div id="tcProgramList" class="posts-list"></div>
          </section>
        </div>
      </section>

      <section class="tc-view hidden" data-tc-panel="activity">
        <div class="admin-grid">
          <section class="panel editor">
            <div class="section-title"><div><span class="badge">بطاقة نشاط</span><h2 id="tcActivityFormTitle">بطاقة نشاط جديدة</h2></div><button id="tcActivityNew" type="button" class="secondary">+ جديد</button></div>
            <form id="tcActivityForm"><input id="tcActivityId" type="hidden">
              <div class="two"><label>البرنامج المرتبط<select id="tcActivityProgram"><option value="">نشاط عام للجمعية</option></select></label><label>البطاقة التقنية للبرنامج (اختياري)<select id="tcActivityProgramCard"><option value="">بدون ربط</option></select></label></div>
              <div class="two"><label>عنوان النشاط<input id="tcActivityTitle" required maxlength="220"></label><label>المرجع / رقم البطاقة<input id="tcActivityReference" maxlength="120" placeholder="مثال: FT-ACT-2026-01"></label></div>
              <div class="three"><label>نوع النشاط<input id="tcActivityCategory" maxlength="140" placeholder="ورشة، لقاء، حملة..."></label><label>الحالة<select id="tcActivityStatus"><option value="draft">مسودة</option><option value="approved">معتمدة</option><option value="archived">مؤرشفة</option></select></label><label>المدة بالساعات<input id="tcActivityHours" type="number" min="0" step="0.5" value="0"></label></div>
              <div class="two"><label>تاريخ البداية<input id="tcActivityDate" type="date"></label><label>تاريخ النهاية<input id="tcActivityEndDate" type="date"></label></div>
              <div class="two"><label>المكان<input id="tcActivityLocation" maxlength="220"></label><label>عدد المشاركين المتوقع<input id="tcActivityParticipants" type="number" min="0" value="0"></label></div>
              <label>الفئة المستهدفة<input id="tcActivityTargetGroup" maxlength="260"></label>
              <label>أهداف النشاط<textarea id="tcActivityObjectives" rows="4"></textarea></label>
              <label>محتوى النشاط ومحاوره<textarea id="tcActivityContent" rows="5"></textarea></label>
              <label>المنهجية وطريقة التنشيط<textarea id="tcActivityMethodology" rows="4"></textarea></label>
              <label>الوسائل والتجهيزات المطلوبة<textarea id="tcActivityEquipment" rows="3"></textarea></label>
              <label>المؤطرون / المتدخلون<textarea id="tcActivityFacilitators" rows="3"></textarea></label>
              <label>الشركاء والمتعاونون<textarea id="tcActivityPartners" rows="3"></textarea></label>
              <label>البرنامج الزمني للنشاط<textarea id="tcActivitySchedule" rows="5" placeholder="مثال: 09:00 استقبال – 09:30 افتتاح..."></textarea></label>
              <label>النتائج المنتظرة<textarea id="tcActivityExpectedResults" rows="4"></textarea></label>
              <label>مؤشرات النجاح<textarea id="tcActivityIndicators" rows="4"></textarea></label>
              <label>الميزانية التقديرية (درهم)<input id="tcActivityBudget" type="number" min="0" step="0.01" value="0"></label>
              <label>ملاحظات إضافية<textarea id="tcActivityNotes" rows="3"></textarea></label>
              <div class="actions"><button type="submit">حفظ البطاقة</button><button id="tcActivityCancel" type="button" class="secondary">إلغاء</button></div><p id="tcActivityMsg" class="msg"></p>
            </form>
          </section>
          <section class="panel list-panel">
            <div class="list-head"><div><h2>بطاقات الأنشطة</h2><p>ربط النشاط بالبرنامج يسهل التنظيم والتكرار والتوثيق.</p></div><button id="tcActivityRefresh" type="button" class="secondary">تحديث</button></div>
            <div class="three"><label>الحالة<select id="tcActivityFilterStatus"><option value="">الكل</option><option value="draft">مسودة</option><option value="approved">معتمدة</option><option value="archived">مؤرشفة</option></select></label><label>البرنامج<select id="tcActivityFilterProgram"><option value="">كل البرامج</option></select></label><label>بحث<input id="tcActivitySearch" type="search" placeholder="عنوان، نوع، مكان، مرجع..."></label></div>
            <div id="tcActivityList" class="posts-list"></div>
          </section>
        </div>
      </section>
    </div>`;
  adminView.appendChild(panel);

  const style=document.createElement('style');
  style.textContent=`.tc-shell{display:grid;gap:18px}.tc-hero{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.tc-hero h2{margin:8px 0}.tc-hero-actions{display:flex;gap:8px;flex-wrap:wrap}.tc-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.tc-stat{background:#fff;border:1px solid #dce8e6;border-radius:17px;padding:14px}.tc-stat span{display:block;font-size:10px;color:#718682;margin-bottom:4px}.tc-stat b{font-size:22px;color:#0f766e}.tc-subtabs{display:flex;gap:8px;flex-wrap:wrap}.tc-subtabs button{background:#e5efed;color:#274744}.tc-subtabs button.active{background:#082f2c;color:#fff}.tc-card-meta{display:flex;gap:7px;flex-wrap:wrap;font-size:10px;color:#718682;margin-top:6px}.tc-budget{font-weight:800;color:#0f766e}.tc-summary{white-space:pre-wrap;color:#526b67;font-size:11px;margin-top:8px;line-height:1.65}.tc-card-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.tc-card-actions button{font-size:10px;padding:6px 9px}@media(max-width:900px){.tc-stats{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.tc-hero{flex-direction:column}.tc-stats{grid-template-columns:1fr 1fr}}`;
  document.head.appendChild(style);

  function switchView(name){
    panel.querySelectorAll('.tc-subtabs button').forEach(b=>b.classList.toggle('active',b.dataset.tcView===name));
    panel.querySelectorAll('.tc-view').forEach(v=>v.classList.toggle('hidden',v.dataset.tcPanel!==name));
  }
  panel.querySelector('.tc-subtabs').addEventListener('click',e=>{const b=e.target.closest('[data-tc-view]');if(b)switchView(b.dataset.tcView)});
  panel.querySelectorAll('[data-tc-go]').forEach(b=>b.addEventListener('click',()=>{switchView(b.dataset.tcGo);setTimeout(()=>document.querySelector(`[data-tc-panel="${b.dataset.tcGo}"] form`)?.scrollIntoView({behavior:'smooth',block:'start'}),80)}));

  function fillProgramSelects(){
    const opts=programs.map(p=>`<option value="${p.id}">${esc(p.title)}</option>`).join('');
    document.getElementById('tcProgramLink').innerHTML='<option value="">بدون ربط</option>'+opts;
    document.getElementById('tcActivityProgram').innerHTML='<option value="">نشاط عام للجمعية</option>'+opts;
    document.getElementById('tcActivityFilterProgram').innerHTML='<option value="">كل البرامج</option>'+opts;
    refreshProgramCardSelect();
  }
  function refreshProgramCardSelect(selected=''){
    const programId=document.getElementById('tcActivityProgram').value;
    const rows=programCards.filter(c=>!programId||String(c.program_id||'')===String(programId));
    document.getElementById('tcActivityProgramCard').innerHTML='<option value="">بدون ربط</option>'+rows.map(c=>`<option value="${c.id}">${esc(c.title)}${c.reference?' · '+esc(c.reference):''}</option>`).join('');
    if(selected)document.getElementById('tcActivityProgramCard').value=String(selected);
  }

  function resetProgramForm(){
    document.getElementById('tcProgramForm').reset();document.getElementById('tcProgramId').value='';document.getElementById('tcProgramStatus').value='draft';document.getElementById('tcProgramBudget').value=0;document.getElementById('tcProgramFormTitle').textContent='بطاقة برنامج جديدة';document.getElementById('tcProgramMsg').textContent='';
  }
  function resetActivityForm(){
    document.getElementById('tcActivityForm').reset();document.getElementById('tcActivityId').value='';document.getElementById('tcActivityStatus').value='draft';document.getElementById('tcActivityBudget').value=0;document.getElementById('tcActivityHours').value=0;document.getElementById('tcActivityParticipants').value=0;document.getElementById('tcActivityFormTitle').textContent='بطاقة نشاط جديدة';document.getElementById('tcActivityMsg').textContent='';refreshProgramCardSelect();
  }

  function renderStats(){
    const approvedPrograms=programCards.filter(x=>x.status==='approved').length,approvedActivities=activityCards.filter(x=>x.status==='approved').length;
    document.getElementById('tcStats').innerHTML=`<div class="tc-stat"><span>بطاقات البرامج</span><b>${programCards.length}</b></div><div class="tc-stat"><span>برامج معتمدة</span><b>${approvedPrograms}</b></div><div class="tc-stat"><span>بطاقات الأنشطة</span><b>${activityCards.length}</b></div><div class="tc-stat"><span>أنشطة معتمدة</span><b>${approvedActivities}</b></div>`;
  }

  function filteredProgramCards(){
    const status=document.getElementById('tcProgramFilterStatus').value,q=document.getElementById('tcProgramSearch').value.trim().toLowerCase();
    return programCards.filter(c=>(!status||c.status===status)&&(!q||`${c.title} ${c.reference} ${c.target_group} ${c.territory}`.toLowerCase().includes(q)));
  }
  function filteredActivityCards(){
    const status=document.getElementById('tcActivityFilterStatus').value,program=document.getElementById('tcActivityFilterProgram').value,q=document.getElementById('tcActivitySearch').value.trim().toLowerCase();
    return activityCards.filter(c=>(!status||c.status===status)&&(!program||String(c.program_id||'')===program)&&(!q||`${c.title} ${c.reference} ${c.category} ${c.location} ${c.target_group}`.toLowerCase().includes(q)));
  }
  function renderProgramList(){
    const box=document.getElementById('tcProgramList'),rows=filteredProgramCards();
    box.innerHTML=rows.length?rows.map(c=>{const p=programs.find(x=>String(x.id)===String(c.program_id));return `<article class="post-item"><div class="post-top"><div><h3>${esc(c.title)}</h3><small>${esc(c.reference||'بدون مرجع')} ${p?'· مرتبط بـ '+esc(p.title):''}</small></div><span class="status ${c.status==='approved'?'published':'draft'}">${esc(statusLabels[c.status]||c.status)}</span></div><div class="tc-card-meta"><span>👥 ${esc(c.target_group||'الفئة غير محددة')}</span>${c.duration_text?`<span>⏱ ${esc(c.duration_text)}</span>`:''}${c.manager?`<span>👤 ${esc(c.manager)}</span>`:''}<span class="tc-budget">${esc(money(c.estimated_budget))}</span></div>${c.general_objective?`<div class="tc-summary">${esc(c.general_objective).slice(0,240)}</div>`:''}<div class="tc-card-actions"><button data-tcp-edit="${c.id}">تعديل</button><button data-tcp-copy="${c.id}" class="secondary">نسخ</button>${c.status!=='archived'?`<button data-tcp-archive="${c.id}" class="secondary">أرشفة</button>`:''}<button data-tcp-delete="${c.id}" class="danger">حذف</button></div></article>`}).join(''):'<div class="empty">لا توجد بطاقات برامج بعد.</div>';
  }
  function renderActivityList(){
    const box=document.getElementById('tcActivityList'),rows=filteredActivityCards();
    box.innerHTML=rows.length?rows.map(c=>{const p=programs.find(x=>String(x.id)===String(c.program_id));return `<article class="post-item"><div class="post-top"><div><h3>${esc(c.title)}</h3><small>${esc(c.reference||'بدون مرجع')} ${c.activity_date?'· '+esc(c.activity_date):''}</small></div><span class="status ${c.status==='approved'?'published':'draft'}">${esc(statusLabels[c.status]||c.status)}</span></div><div class="tc-card-meta">${p?`<span>📁 ${esc(p.title)}</span>`:''}${c.category?`<span>🏷 ${esc(c.category)}</span>`:''}${c.location?`<span>📍 ${esc(c.location)}</span>`:''}<span>👥 ${Number(c.expected_participants)||0} متوقع</span><span class="tc-budget">${esc(money(c.estimated_budget))}</span></div>${c.objectives?`<div class="tc-summary">${esc(c.objectives).slice(0,240)}</div>`:''}<div class="tc-card-actions"><button data-tca-edit="${c.id}">تعديل</button><button data-tca-copy="${c.id}" class="secondary">نسخ</button>${c.status!=='archived'?`<button data-tca-archive="${c.id}" class="secondary">أرشفة</button>`:''}<button data-tca-delete="${c.id}" class="danger">حذف</button></div></article>`}).join(''):'<div class="empty">لا توجد بطاقات أنشطة بعد.</div>';
  }

  async function loadAll(){
    const [pRes,pcRes,acRes]=await Promise.all([
      client.from('programs').select('id,title').order('sort_order',{ascending:true}),
      client.from('technical_program_cards').select('*').order('updated_at',{ascending:false}),
      client.from('technical_activity_cards').select('*').order('updated_at',{ascending:false})
    ]);
    programs=pRes.data||[];programCards=pcRes.data||[];activityCards=acRes.data||[];fillProgramSelects();renderStats();renderProgramList();renderActivityList();
  }

  document.getElementById('tcProgramLink').addEventListener('change',()=>{const p=programs.find(x=>String(x.id)===document.getElementById('tcProgramLink').value);if(p&&!document.getElementById('tcProgramTitle').value.trim())document.getElementById('tcProgramTitle').value=p.title||''});
  document.getElementById('tcActivityProgram').addEventListener('change',()=>refreshProgramCardSelect());
  document.getElementById('tcProgramImageFile').addEventListener('change',()=>{if(document.getElementById('tcProgramImageFile').files[0])document.getElementById('tcProgramImageUrl').value=''});

  document.getElementById('tcProgramForm').addEventListener('submit',async e=>{
    e.preventDefault();const msg=document.getElementById('tcProgramMsg');msg.textContent='جارٍ الحفظ...';
    try{
      const id=document.getElementById('tcProgramId').value;let image=document.getElementById('tcProgramImageUrl').value.trim()||null;const file=document.getElementById('tcProgramImageFile').files[0];if(file)image=await uploadImage(file,'technical-cards/programs');
      const row={program_id:document.getElementById('tcProgramLink').value||null,title:document.getElementById('tcProgramTitle').value.trim(),reference:document.getElementById('tcProgramReference').value.trim(),status:document.getElementById('tcProgramStatus').value,context:document.getElementById('tcProgramContext').value.trim(),general_objective:document.getElementById('tcProgramGeneralObjective').value.trim(),specific_objectives:document.getElementById('tcProgramSpecificObjectives').value.trim(),target_group:document.getElementById('tcProgramTargetGroup').value.trim(),duration_text:document.getElementById('tcProgramDuration').value.trim(),territory:document.getElementById('tcProgramTerritory').value.trim(),partners:document.getElementById('tcProgramPartners').value.trim(),human_resources:document.getElementById('tcProgramHumanResources').value.trim(),main_activities:document.getElementById('tcProgramMainActivities').value.trim(),indicators:document.getElementById('tcProgramIndicators').value.trim(),expected_results:document.getElementById('tcProgramExpectedResults').value.trim(),estimated_budget:Number(document.getElementById('tcProgramBudget').value)||0,manager:document.getElementById('tcProgramManager').value.trim(),start_date:document.getElementById('tcProgramStartDate').value||null,end_date:document.getElementById('tcProgramEndDate').value||null,image_url:image,notes:document.getElementById('tcProgramNotes').value.trim(),updated_at:new Date().toISOString()};
      const res=id?await client.from('technical_program_cards').update(row).eq('id',id):await client.from('technical_program_cards').insert(row);if(res.error)throw res.error;resetProgramForm();await loadAll();msg.textContent='تم حفظ بطاقة البرنامج.';
    }catch(err){msg.textContent='تعذر الحفظ: '+(err.message||'خطأ')}
  });

  document.getElementById('tcActivityForm').addEventListener('submit',async e=>{
    e.preventDefault();const msg=document.getElementById('tcActivityMsg');msg.textContent='جارٍ الحفظ...';
    try{
      const id=document.getElementById('tcActivityId').value,row={program_id:document.getElementById('tcActivityProgram').value||null,program_card_id:document.getElementById('tcActivityProgramCard').value||null,title:document.getElementById('tcActivityTitle').value.trim(),reference:document.getElementById('tcActivityReference').value.trim(),status:document.getElementById('tcActivityStatus').value,category:document.getElementById('tcActivityCategory').value.trim(),activity_date:document.getElementById('tcActivityDate').value||null,end_date:document.getElementById('tcActivityEndDate').value||null,duration_hours:Number(document.getElementById('tcActivityHours').value)||0,location:document.getElementById('tcActivityLocation').value.trim(),target_group:document.getElementById('tcActivityTargetGroup').value.trim(),expected_participants:Number(document.getElementById('tcActivityParticipants').value)||0,objectives:document.getElementById('tcActivityObjectives').value.trim(),content:document.getElementById('tcActivityContent').value.trim(),methodology:document.getElementById('tcActivityMethodology').value.trim(),equipment:document.getElementById('tcActivityEquipment').value.trim(),facilitators:document.getElementById('tcActivityFacilitators').value.trim(),partners:document.getElementById('tcActivityPartners').value.trim(),schedule:document.getElementById('tcActivitySchedule').value.trim(),expected_results:document.getElementById('tcActivityExpectedResults').value.trim(),success_indicators:document.getElementById('tcActivityIndicators').value.trim(),estimated_budget:Number(document.getElementById('tcActivityBudget').value)||0,notes:document.getElementById('tcActivityNotes').value.trim(),updated_at:new Date().toISOString()};
      const res=id?await client.from('technical_activity_cards').update(row).eq('id',id):await client.from('technical_activity_cards').insert(row);if(res.error)throw res.error;resetActivityForm();await loadAll();msg.textContent='تم حفظ بطاقة النشاط.';
    }catch(err){msg.textContent='تعذر الحفظ: '+(err.message||'خطأ')}
  });

  document.getElementById('tcProgramList').addEventListener('click',async e=>{
    const edit=e.target.dataset.tcpEdit,copy=e.target.dataset.tcpCopy,archive=e.target.dataset.tcpArchive,del=e.target.dataset.tcpDelete,id=edit||copy||archive||del;if(!id)return;const c=programCards.find(x=>String(x.id)===String(id));if(!c)return;
    if(edit){document.getElementById('tcProgramId').value=c.id;document.getElementById('tcProgramLink').value=c.program_id||'';document.getElementById('tcProgramTitle').value=c.title||'';document.getElementById('tcProgramReference').value=c.reference||'';document.getElementById('tcProgramStatus').value=c.status||'draft';document.getElementById('tcProgramContext').value=c.context||'';document.getElementById('tcProgramGeneralObjective').value=c.general_objective||'';document.getElementById('tcProgramSpecificObjectives').value=c.specific_objectives||'';document.getElementById('tcProgramTargetGroup').value=c.target_group||'';document.getElementById('tcProgramDuration').value=c.duration_text||'';document.getElementById('tcProgramTerritory').value=c.territory||'';document.getElementById('tcProgramPartners').value=c.partners||'';document.getElementById('tcProgramHumanResources').value=c.human_resources||'';document.getElementById('tcProgramMainActivities').value=c.main_activities||'';document.getElementById('tcProgramIndicators').value=c.indicators||'';document.getElementById('tcProgramExpectedResults').value=c.expected_results||'';document.getElementById('tcProgramBudget').value=c.estimated_budget||0;document.getElementById('tcProgramManager').value=c.manager||'';document.getElementById('tcProgramStartDate').value=c.start_date||'';document.getElementById('tcProgramEndDate').value=c.end_date||'';document.getElementById('tcProgramImageUrl').value=c.image_url||'';document.getElementById('tcProgramNotes').value=c.notes||'';document.getElementById('tcProgramFormTitle').textContent='تعديل بطاقة البرنامج';document.getElementById('tcProgramForm').scrollIntoView({behavior:'smooth',block:'start'});}
    if(copy){const {id:_id,created_at,updated_at,created_by,...clone}=c;clone.title=`نسخة من ${c.title}`;clone.reference='';clone.status='draft';const r=await client.from('technical_program_cards').insert(clone);if(r.error)alert('تعذر نسخ البطاقة.');else loadAll()}
    if(archive){await client.from('technical_program_cards').update({status:'archived',updated_at:new Date().toISOString()}).eq('id',id);loadAll()}
    if(del&&confirm('هل تريد حذف بطاقة البرنامج نهائياً؟')){await client.from('technical_program_cards').delete().eq('id',id);loadAll()}
  });

  document.getElementById('tcActivityList').addEventListener('click',async e=>{
    const edit=e.target.dataset.tcaEdit,copy=e.target.dataset.tcaCopy,archive=e.target.dataset.tcaArchive,del=e.target.dataset.tcaDelete,id=edit||copy||archive||del;if(!id)return;const c=activityCards.find(x=>String(x.id)===String(id));if(!c)return;
    if(edit){document.getElementById('tcActivityId').value=c.id;document.getElementById('tcActivityProgram').value=c.program_id||'';refreshProgramCardSelect(c.program_card_id);document.getElementById('tcActivityTitle').value=c.title||'';document.getElementById('tcActivityReference').value=c.reference||'';document.getElementById('tcActivityStatus').value=c.status||'draft';document.getElementById('tcActivityCategory').value=c.category||'';document.getElementById('tcActivityDate').value=c.activity_date||'';document.getElementById('tcActivityEndDate').value=c.end_date||'';document.getElementById('tcActivityHours').value=c.duration_hours||0;document.getElementById('tcActivityLocation').value=c.location||'';document.getElementById('tcActivityTargetGroup').value=c.target_group||'';document.getElementById('tcActivityParticipants').value=c.expected_participants||0;document.getElementById('tcActivityObjectives').value=c.objectives||'';document.getElementById('tcActivityContent').value=c.content||'';document.getElementById('tcActivityMethodology').value=c.methodology||'';document.getElementById('tcActivityEquipment').value=c.equipment||'';document.getElementById('tcActivityFacilitators').value=c.facilitators||'';document.getElementById('tcActivityPartners').value=c.partners||'';document.getElementById('tcActivitySchedule').value=c.schedule||'';document.getElementById('tcActivityExpectedResults').value=c.expected_results||'';document.getElementById('tcActivityIndicators').value=c.success_indicators||'';document.getElementById('tcActivityBudget').value=c.estimated_budget||0;document.getElementById('tcActivityNotes').value=c.notes||'';document.getElementById('tcActivityFormTitle').textContent='تعديل بطاقة النشاط';document.getElementById('tcActivityForm').scrollIntoView({behavior:'smooth',block:'start'});}
    if(copy){const {id:_id,created_at,updated_at,created_by,...clone}=c;clone.title=`نسخة من ${c.title}`;clone.reference='';clone.status='draft';const r=await client.from('technical_activity_cards').insert(clone);if(r.error)alert('تعذر نسخ البطاقة.');else loadAll()}
    if(archive){await client.from('technical_activity_cards').update({status:'archived',updated_at:new Date().toISOString()}).eq('id',id);loadAll()}
    if(del&&confirm('هل تريد حذف بطاقة النشاط نهائياً؟')){await client.from('technical_activity_cards').delete().eq('id',id);loadAll()}
  });

  ['tcProgramFilterStatus','tcProgramSearch'].forEach(id=>document.getElementById(id).addEventListener(id.includes('Search')?'input':'change',renderProgramList));
  ['tcActivityFilterStatus','tcActivityFilterProgram','tcActivitySearch'].forEach(id=>document.getElementById(id).addEventListener(id.includes('Search')?'input':'change',renderActivityList));
  document.getElementById('tcProgramNew').addEventListener('click',resetProgramForm);document.getElementById('tcProgramCancel').addEventListener('click',resetProgramForm);document.getElementById('tcProgramRefresh').addEventListener('click',loadAll);
  document.getElementById('tcActivityNew').addEventListener('click',resetActivityForm);document.getElementById('tcActivityCancel').addEventListener('click',resetActivityForm);document.getElementById('tcActivityRefresh').addEventListener('click',loadAll);

  async function init(){const ok=await isAdmin();if(!ok)return;resetProgramForm();resetActivityForm();await loadAll()}
  client.auth.onAuthStateChange(()=>init());
  init();
})();