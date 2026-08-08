(function(){
  let attempts=0;
  function waitForFinance(){
    const root=document.getElementById('governanceFinancePanel');
    if(!root){if(attempts++<120)setTimeout(waitForFinance,120);return}
    if(document.getElementById('gfAnnualReportsView'))return;
    init(root);
  }

  function init(root){
    const esc=window.escapeHtml||((v='')=>String(v).replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])));
    const money=v=>new Intl.NumberFormat('ar-MA',{style:'currency',currency:'MAD',maximumFractionDigits:2}).format(Number(v)||0);
    const monthNames=['يناير','فبراير','مارس','أبريل','ماي','يونيو','يوليوز','غشت','شتنبر','أكتوبر','نونبر','دجنبر'];
    const typeLabels={meeting:'اجتماع المكتب',general_assembly:'جمع عام',partnership:'شراكة أو اتفاقية',correspondence:'مراسلة',decision:'قرار إداري',volunteer:'متطوعون وموارد بشرية',equipment:'تجهيزات وممتلكات',other:'أخرى'};
    let lastHtml='';
    let lastTitle='';
    let lastStats={};
    let archiveCache=[];

    const subtabs=root.querySelector('.gf-subtabs');
    const reportsBtn=document.createElement('button');
    reportsBtn.type='button';
    reportsBtn.dataset.gfView='annual-reports';
    reportsBtn.textContent='التقارير السنوية';
    subtabs?.appendChild(reportsBtn);

    const view=document.createElement('section');
    view.id='gfAnnualReportsView';
    view.className='gf-view hidden';
    view.dataset.gfPanel='annual-reports';
    view.innerHTML=`
      <div class="gf-report-shell">
        <section class="panel gf-report-head">
          <div><span class="badge">التقرير الرسمي</span><h2>التقرير الإداري والمالي السنوي</h2><p>إنشاء تقرير إداري أو مالي أو موحد انطلاقاً من السجلات الفعلية للجمعية.</p></div>
          <div class="gf-report-controls"><label>السنة<input id="gfReportYear" type="number" min="2000" max="2200"></label><label>نوع التقرير<select id="gfReportKind"><option value="combined">إداري ومالي موحد</option><option value="administrative">إداري فقط</option><option value="financial">مالي فقط</option></select></label><button id="gfBuildAnnualReport" type="button">إنشاء التقرير</button></div>
        </section>

        <section class="panel gf-analysis-panel">
          <div class="list-head"><div><span class="badge">تحليل السنة</span><h3>المؤشرات والرسوم التحليلية</h3></div><button id="gfRefreshAnalysis" type="button" class="secondary">تحديث</button></div>
          <div id="gfAnnualKpis" class="gf-report-kpis"></div>
          <div class="gf-report-analysis-grid"><div><h4>الحركة المالية الشهرية</h4><div id="gfMonthlyFinanceChart" class="gf-mini-chart"></div></div><div><h4>توزيع المصاريف حسب التصنيف</h4><div id="gfExpenseCategories" class="gf-category-list"></div></div><div><h4>مصادر المداخيل</h4><div id="gfIncomeCategories" class="gf-category-list"></div></div><div><h4>السجل الإداري حسب النوع</h4><div id="gfAdminTypes" class="gf-category-list"></div></div></div>
        </section>

        <section class="panel gf-report-notes">
          <div class="list-head"><div><span class="badge">تحرير التقرير</span><h3>الملاحظات السنوية</h3><p>هذه النصوص تُحفظ حسب السنة ويمكن تعديلها قبل إصدار النسخة النهائية.</p></div><button id="gfSaveReportNotes" type="button" class="secondary">حفظ الملاحظات</button></div>
          <div class="gf-report-notes-grid">
            <label>تقديم التقرير الإداري<textarea id="gfAdminIntro" rows="4"></textarea></label>
            <label>أبرز المنجزات الإدارية<textarea id="gfAdminHighlights" rows="4"></textarea></label>
            <label>التحديات الإدارية<textarea id="gfAdminChallenges" rows="4"></textarea></label>
            <label>التوصيات الإدارية<textarea id="gfAdminRecommendations" rows="4"></textarea></label>
            <label>تقديم التقرير المالي<textarea id="gfFinancialIntro" rows="4"></textarea></label>
            <label>ملاحظات على الحصيلة المالية<textarea id="gfFinancialNotes" rows="4"></textarea></label>
            <label>التوصيات المالية<textarea id="gfFinancialRecommendations" rows="4"></textarea></label>
            <label>الخلاصة العامة<textarea id="gfReportConclusion" rows="4"></textarea></label>
            <label>إعداد التقرير<input id="gfReportPreparedBy" maxlength="180" value="جمعية نور الأمل"></label>
            <label>المكان<input id="gfReportPlace" maxlength="160" value="المغرب"></label>
          </div><p id="gfAnnualReportMsg" class="msg"></p>
        </section>

        <section class="panel gf-official-report">
          <div class="list-head"><div><span class="badge">المعاينة الرسمية</span><h3>النسخة الجاهزة للاعتماد</h3></div><div class="actions gf-report-actions"><button id="gfExportWord" type="button" class="secondary">تصدير Word</button><button id="gfExportPdf" type="button" class="secondary">حفظ PDF</button><button id="gfArchiveAnnualReport" type="button">اعتماد وأرشفة</button></div></div>
          <div id="gfAnnualReportPreview" class="gf-annual-preview"><div class="empty">اختر السنة ونوع التقرير ثم اضغط «إنشاء التقرير».</div></div>
        </section>

        <section class="panel gf-report-archive">
          <div class="list-head"><div><span class="badge">الأرشيف</span><h3>التقارير الإدارية والمالية المعتمدة</h3></div><button id="gfRefreshArchive" type="button" class="secondary">تحديث الأرشيف</button></div>
          <div id="gfAnnualArchiveList" class="posts-list"><p>جارٍ التحميل...</p></div>
        </section>
      </div>`;
    root.querySelector('.gf-shell')?.appendChild(view);

    const style=document.createElement('style');
    style.textContent=`
      .gf-report-shell{display:grid;gap:18px}.gf-report-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}.gf-report-controls{display:flex;align-items:end;gap:8px;flex-wrap:wrap}.gf-report-controls label{margin:0;min-width:135px}.gf-report-kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:9px;margin:14px 0}.gf-report-kpi{background:#f3f8f7;border:1px solid #dce8e6;border-radius:15px;padding:13px;text-align:center}.gf-report-kpi b{display:block;font-size:20px;color:#0f766e}.gf-report-kpi span{font-size:9px;color:#6d817d}.gf-report-analysis-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.gf-mini-chart{display:flex;align-items:end;gap:7px;height:210px;padding:12px 4px 25px;border-bottom:1px solid #dce8e6}.gf-month-col{flex:1;display:flex;align-items:end;justify-content:center;gap:2px;height:100%;position:relative}.gf-month-bar{width:42%;min-height:2px;border-radius:7px 7px 2px 2px}.gf-month-bar.income{background:#19875f}.gf-month-bar.expense{background:#b85252}.gf-month-label{position:absolute;bottom:-22px;font-size:8px;color:#6e817d}.gf-chart-legend{display:flex;gap:12px;font-size:10px;margin-top:8px}.gf-chart-legend i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-left:4px}.gf-chart-legend .income{background:#19875f}.gf-chart-legend .expense{background:#b85252}.gf-category-list{display:grid;gap:7px}.gf-category-row{display:grid;grid-template-columns:130px 1fr 85px;align-items:center;gap:8px;font-size:11px}.gf-category-track{height:9px;background:#e7f0ee;border-radius:99px;overflow:hidden}.gf-category-fill{height:100%;background:#0f766e;border-radius:inherit}.gf-report-notes-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.gf-report-actions{flex-wrap:wrap}.gf-annual-preview{display:grid;gap:16px;background:#dfe9e7;padding:20px;border-radius:18px;overflow:auto}.gf-report-page{position:relative;width:210mm;min-height:297mm;background:#fff;margin:auto;padding:20mm 18mm 18mm;color:#253d39;box-shadow:0 7px 24px rgba(0,0,0,.1)}.gf-report-page h1,.gf-report-page h2,.gf-report-page h3{color:#103f3a}.gf-report-page h1{text-align:center;font-size:30px}.gf-report-page h2{border-bottom:2px solid #d9e8e5;padding-bottom:7px}.gf-report-page p,.gf-report-page li{font-size:12px;line-height:1.9}.gf-report-cover{padding:0;display:flex;flex-direction:column;text-align:center}.gf-report-cover-top{padding:30mm 20mm 15mm}.gf-report-cover-logo{max-width:180px;max-height:110px;object-fit:contain}.gf-report-cover-band{margin-top:auto;background:#082f2c;color:white;padding:17mm}.gf-report-cover-year{display:inline-block;background:#e6f3f1;color:#0f766e;border-radius:99px;padding:7px 18px;font-weight:800;margin-top:14px}.gf-report-page-footer{position:absolute;bottom:7mm;left:18mm;right:18mm;border-top:1px solid #dce8e6;padding-top:5px;display:flex;justify-content:space-between;font-size:9px;color:#6e817d}.gf-report-table{width:100%;border-collapse:collapse;font-size:10px}.gf-report-table th,.gf-report-table td{border:1px solid #dce7e5;padding:7px;text-align:right}.gf-report-table th{background:#f0f6f5}.gf-report-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.gf-report-summary div{padding:14px;border-radius:14px;background:#f2f7f6;text-align:center}.gf-report-summary b{display:block;color:#0f766e;font-size:21px}.gf-report-section-line{height:5px;background:#0f766e;margin:-20mm -18mm 12mm}.gf-archive-stats{display:flex;gap:8px;flex-wrap:wrap;font-size:10px;color:#6b807c}@media(max-width:1000px){.gf-report-kpis{grid-template-columns:repeat(3,1fr)}.gf-report-analysis-grid{grid-template-columns:1fr}.gf-report-notes-grid{grid-template-columns:1fr}}@media(max-width:720px){.gf-report-head{flex-direction:column}.gf-report-kpis{grid-template-columns:repeat(2,1fr)}.gf-annual-preview{padding:6px}.gf-report-page{transform:scale(.7);transform-origin:top right;margin-bottom:-88mm}}
    `;
    document.head.appendChild(style);

    function showReportView(){
      root.querySelectorAll('.gf-subtabs button').forEach(b=>b.classList.toggle('active',b===reportsBtn));
      root.querySelectorAll('.gf-view').forEach(v=>v.classList.toggle('hidden',v!==view));
      refreshAll();
    }
    reportsBtn.addEventListener('click',showReportView);

    const yearEl=document.getElementById('gfReportYear');
    yearEl.value=String(new Date().getFullYear());
    yearEl.addEventListener('change',()=>{loadNotes();refreshAnalysis();loadArchive()});

    function yearRange(){const y=Number(yearEl.value)||new Date().getFullYear();return {y,from:`${y}-01-01`,to:`${y}-12-31`}}
    function sum(rows,key){return rows.reduce((a,r)=>a+(Number(r[key])||0),0)}
    function groupSum(rows,key){const out={};rows.forEach(r=>{const k=r[key]||'أخرى';out[k]=(out[k]||0)+(Number(r.amount)||0)});return out}
    function groupCount(rows,key){const out={};rows.forEach(r=>{const k=r[key]||'other';out[k]=(out[k]||0)+1});return out}

    async function getYearData(){
      const r=yearRange();
      const [adminRes,financeRes,settingRes,siteRes]=await Promise.all([
        client.from('association_admin_records').select('*').gte('record_date',r.from).lte('record_date',r.to).order('record_date',{ascending:true}),
        client.from('finance_transactions').select('*').gte('transaction_date',r.from).lte('transaction_date',r.to).order('transaction_date',{ascending:true}),
        client.from('finance_year_settings').select('*').eq('year',r.y).maybeSingle(),
        client.from('site_settings').select('key,value').in('key',['logo_url','address','email','phone'])
      ]);
      return {year:r.y,admin:adminRes.data||[],finance:financeRes.data||[],settings:settingRes.data||{},site:Object.fromEntries((siteRes.data||[]).map(x=>[x.key,x.value]))};
    }

    function calculate(data){
      const incomeRows=data.finance.filter(x=>x.transaction_type==='income');
      const expenseRows=data.finance.filter(x=>x.transaction_type==='expense');
      const income=sum(incomeRows,'amount'),expense=sum(expenseRows,'amount'),opening=Number(data.settings.opening_balance)||0,budget=Number(data.settings.approved_budget)||0,closing=opening+income-expense;
      const months=Array.from({length:12},(_,i)=>({month:i+1,income:0,expense:0}));
      data.finance.forEach(t=>{const m=Number(String(t.transaction_date).slice(5,7));if(m>=1&&m<=12)months[m-1][t.transaction_type]+=Number(t.amount)||0});
      return {incomeRows,expenseRows,income,expense,opening,budget,closing,months,incomeCats:groupSum(incomeRows,'category'),expenseCats:groupSum(expenseRows,'category'),adminTypes:groupCount(data.admin,'record_type')};
    }

    function renderCategory(boxId,obj,isMoney=true){
      const box=document.getElementById(boxId),entries=Object.entries(obj).sort((a,b)=>b[1]-a[1]);
      if(!entries.length){box.innerHTML='<div class="empty">لا توجد بيانات.</div>';return}
      const max=Math.max(...entries.map(x=>x[1]),1);
      box.innerHTML=entries.map(([k,v])=>`<div class="gf-category-row"><span>${esc(typeLabels[k]||k)}</span><div class="gf-category-track"><div class="gf-category-fill" style="width:${Math.round(v/max*100)}%"></div></div><b>${isMoney?esc(money(v)):v}</b></div>`).join('');
    }

    async function refreshAnalysis(){
      const data=await getYearData(),c=calculate(data);
      document.getElementById('gfAnnualKpis').innerHTML=`<div class="gf-report-kpi"><b>${data.admin.length}</b><span>سجلات إدارية</span></div><div class="gf-report-kpi"><b>${esc(money(c.income))}</b><span>المداخيل</span></div><div class="gf-report-kpi"><b>${esc(money(c.expense))}</b><span>المصاريف</span></div><div class="gf-report-kpi"><b>${esc(money(c.closing))}</b><span>الرصيد الختامي</span></div><div class="gf-report-kpi"><b>${esc(money(c.budget))}</b><span>الميزانية</span></div><div class="gf-report-kpi"><b>${data.finance.length}</b><span>عمليات مالية</span></div>`;
      const max=Math.max(1,...c.months.flatMap(m=>[m.income,m.expense]));
      document.getElementById('gfMonthlyFinanceChart').innerHTML=c.months.map((m,i)=>`<div class="gf-month-col"><div class="gf-month-bar income" title="مداخيل ${monthNames[i]}: ${esc(money(m.income))}" style="height:${Math.max(2,Math.round(m.income/max*170))}px"></div><div class="gf-month-bar expense" title="مصاريف ${monthNames[i]}: ${esc(money(m.expense))}" style="height:${Math.max(2,Math.round(m.expense/max*170))}px"></div><span class="gf-month-label">${monthNames[i].slice(0,3)}</span></div>`).join('')+'<div class="gf-chart-legend" style="position:absolute"></div>';
      renderCategory('gfExpenseCategories',c.expenseCats,true);renderCategory('gfIncomeCategories',c.incomeCats,true);renderCategory('gfAdminTypes',c.adminTypes,false);
    }

    async function loadNotes(){
      const y=yearRange().y,{data}=await client.from('governance_finance_report_notes').select('*').eq('year',y).maybeSingle();
      const map={gfAdminIntro:'administrative_intro',gfAdminHighlights:'administrative_highlights',gfAdminChallenges:'administrative_challenges',gfAdminRecommendations:'administrative_recommendations',gfFinancialIntro:'financial_intro',gfFinancialNotes:'financial_notes',gfFinancialRecommendations:'financial_recommendations',gfReportConclusion:'conclusion',gfReportPreparedBy:'prepared_by',gfReportPlace:'report_place'};
      Object.entries(map).forEach(([id,key])=>{document.getElementById(id).value=data?.[key]||((id==='gfReportPreparedBy')?'جمعية نور الأمل':(id==='gfReportPlace'?'المغرب':''))});
    }

    async function saveNotes(){
      const msg=document.getElementById('gfAnnualReportMsg'),row={year:yearRange().y,administrative_intro:document.getElementById('gfAdminIntro').value.trim(),administrative_highlights:document.getElementById('gfAdminHighlights').value.trim(),administrative_challenges:document.getElementById('gfAdminChallenges').value.trim(),administrative_recommendations:document.getElementById('gfAdminRecommendations').value.trim(),financial_intro:document.getElementById('gfFinancialIntro').value.trim(),financial_notes:document.getElementById('gfFinancialNotes').value.trim(),financial_recommendations:document.getElementById('gfFinancialRecommendations').value.trim(),conclusion:document.getElementById('gfReportConclusion').value.trim(),prepared_by:document.getElementById('gfReportPreparedBy').value.trim()||'جمعية نور الأمل',report_place:document.getElementById('gfReportPlace').value.trim()||'المغرب'};
      const {error}=await client.from('governance_finance_report_notes').upsert(row,{onConflict:'year'});msg.textContent=error?'تعذر حفظ الملاحظات.':'تم حفظ الملاحظات السنوية.';return !error;
    }

    function page(content,n,cls=''){return `<section class="gf-report-page ${cls}">${content}${n?`<div class="gf-report-page-footer"><span>جمعية نور الأمل</span><b>${n}</b></div>`:''}</section>`}
    function tableRows(rows,kind){
      if(kind==='admin')return rows.map(r=>`<tr><td>${esc(r.record_date)}</td><td>${esc(typeLabels[r.record_type]||r.record_type)}</td><td>${esc(r.title)}</td><td>${esc(r.reference||'')}</td><td>${esc(r.status||'')}</td></tr>`).join('');
      return rows.map(r=>`<tr><td>${esc(r.transaction_date)}</td><td>${r.transaction_type==='income'?'مدخول':'مصروف'}</td><td>${esc(r.category)}</td><td>${esc(money(r.amount))}</td><td>${esc(r.reference||'')}</td><td>${esc(r.counterparty||'')}</td></tr>`).join('');
    }

    async function buildReport(){
      const msg=document.getElementById('gfAnnualReportMsg');msg.textContent='جارٍ إنشاء التقرير...';await saveNotes();
      const data=await getYearData(),c=calculate(data),kind=document.getElementById('gfReportKind').value;
      const {data:notes}=await client.from('governance_finance_report_notes').select('*').eq('year',data.year).maybeSingle();
      const title=kind==='administrative'?`التقرير الإداري السنوي ${data.year}`:kind==='financial'?`التقرير المالي السنوي ${data.year}`:`التقرير الإداري والمالي السنوي ${data.year}`;
      const prepared=notes?.prepared_by||'جمعية نور الأمل',place=notes?.report_place||'المغرب';let p=1,html='';
      html+=page(`<div class="gf-report-cover-top">${data.site.logo_url?`<img class="gf-report-cover-logo" src="${esc(data.site.logo_url)}" alt="شعار الجمعية">`:''}<p>جمعية نور الأمل</p><h1>${esc(title)}</h1><span class="gf-report-cover-year">${data.year}</span></div><div class="gf-report-cover-band"><div>إعداد: ${esc(prepared)}</div><div>${esc(place)}</div></div>`,0,'gf-report-cover');
      html+=page(`<div class="gf-report-section-line"></div><h1>الفهرس</h1><ol><li>ملخص السنة والمؤشرات العامة</li>${kind!=='financial'?'<li>الحصيلة الإدارية والحكامة</li>':''}${kind!=='administrative'?'<li>الحصيلة المالية</li><li>تحليل المداخيل والمصاريف</li>':''}<li>التوصيات والخلاصة</li></ol>`,p++);
      html+=page(`<div class="gf-report-section-line"></div><h2>ملخص السنة والمؤشرات العامة</h2><div class="gf-report-summary"><div><b>${data.admin.length}</b><span>سجلاً إدارياً</span></div><div><b>${data.finance.length}</b><span>عملية مالية</span></div><div><b>${esc(money(c.closing))}</b><span>الرصيد الختامي</span></div></div><p>تعرض هذه الوثيقة حصيلة سنة ${data.year} اعتماداً على السجلات الإدارية والمالية الموثقة داخل نظام الجمعية.</p>`,p++);
      if(kind!=='financial'){
        const intro=notes?.administrative_intro||`واصلت جمعية نور الأمل خلال سنة ${data.year} تطوير عملها الإداري وتعزيز الحكامة والتنسيق والشراكات بما يدعم تنفيذ أنشطتها وبرامجها.`;
        html+=page(`<div class="gf-report-section-line"></div><h2>الحصيلة الإدارية والحكامة</h2><p>${esc(intro)}</p><div class="gf-report-summary">${Object.entries(c.adminTypes).slice(0,6).map(([k,v])=>`<div><b>${v}</b><span>${esc(typeLabels[k]||k)}</span></div>`).join('')}</div>${notes?.administrative_highlights?`<h3>أبرز المنجزات</h3><p>${esc(notes.administrative_highlights)}</p>`:''}<h3>السجلات الإدارية الموثقة</h3>${data.admin.length?`<table class="gf-report-table"><thead><tr><th>التاريخ</th><th>النوع</th><th>العنوان</th><th>المرجع</th><th>الحالة</th></tr></thead><tbody>${tableRows(data.admin.slice(0,18),'admin')}</tbody></table>`:'<p>لا توجد سجلات إدارية موثقة لهذه السنة.</p>'}`,p++);
      }
      if(kind!=='administrative'){
        const financialIntro=notes?.financial_intro||`يعرض التقرير المالي لسنة ${data.year} حركة المداخيل والمصاريف المسجلة، ومصادر التمويل وأوجه الصرف، مع مقارنة الحصيلة بالميزانية المعتمدة.`;
        html+=page(`<div class="gf-report-section-line"></div><h2>الحصيلة المالية</h2><p>${esc(financialIntro)}</p><div class="gf-report-summary"><div><b>${esc(money(c.opening))}</b><span>الرصيد الافتتاحي</span></div><div><b>${esc(money(c.income))}</b><span>المداخيل</span></div><div><b>${esc(money(c.expense))}</b><span>المصاريف</span></div><div><b>${esc(money(c.closing))}</b><span>الرصيد الختامي</span></div><div><b>${esc(money(c.budget))}</b><span>الميزانية المعتمدة</span></div></div>${notes?.financial_notes?`<h3>ملاحظات على الحصيلة</h3><p>${esc(notes.financial_notes)}</p>`:''}<h3>آخر العمليات المالية</h3>${data.finance.length?`<table class="gf-report-table"><thead><tr><th>التاريخ</th><th>النوع</th><th>التصنيف</th><th>المبلغ</th><th>المرجع</th><th>الجهة</th></tr></thead><tbody>${tableRows(data.finance.slice(0,16),'finance')}</tbody></table>`:'<p>لا توجد عمليات مالية مسجلة لهذه السنة.</p>'}`,p++);
        const expenseEntries=Object.entries(c.expenseCats).sort((a,b)=>b[1]-a[1]),incomeEntries=Object.entries(c.incomeCats).sort((a,b)=>b[1]-a[1]);
        html+=page(`<div class="gf-report-section-line"></div><h2>تحليل المداخيل والمصاريف</h2><h3>المصاريف حسب التصنيف</h3>${expenseEntries.length?`<table class="gf-report-table"><thead><tr><th>التصنيف</th><th>المبلغ</th><th>النسبة من المصاريف</th></tr></thead><tbody>${expenseEntries.map(([k,v])=>`<tr><td>${esc(k)}</td><td>${esc(money(v))}</td><td>${c.expense?((v/c.expense)*100).toFixed(1):'0'}%</td></tr>`).join('')}</tbody></table>`:'<p>لا توجد مصاريف.</p>'}<h3>مصادر المداخيل</h3>${incomeEntries.length?`<table class="gf-report-table"><thead><tr><th>المصدر</th><th>المبلغ</th><th>النسبة من المداخيل</th></tr></thead><tbody>${incomeEntries.map(([k,v])=>`<tr><td>${esc(k)}</td><td>${esc(money(v))}</td><td>${c.income?((v/c.income)*100).toFixed(1):'0'}%</td></tr>`).join('')}</tbody></table>`:'<p>لا توجد مداخيل.</p>'}`,p++);
      }
      const adminChallenges=notes?.administrative_challenges||'لم تُسجل ملاحظات خاصة بالتحديات الإدارية.';
      const adminRec=notes?.administrative_recommendations||'مواصلة تحسين التوثيق الإداري، وتتبع القرارات والشراكات بصورة دورية.';
      const finRec=notes?.financial_recommendations||'تعزيز التتبع المالي المنتظم، وربط كل عملية بوثيقتها المرجعية، ومراجعة تنفيذ الميزانية دورياً.';
      const conclusion=notes?.conclusion||`تعكس حصيلة سنة ${data.year} أهمية الربط بين الحكامة الإدارية والانضباط المالي لدعم استمرارية عمل جمعية نور الأمل وتحسين التخطيط للسنوات المقبلة.`;
      html+=page(`<div class="gf-report-section-line"></div><h2>التوصيات والخلاصة</h2>${kind!=='financial'?`<h3>التحديات الإدارية</h3><p>${esc(adminChallenges)}</p><h3>التوصيات الإدارية</h3><p>${esc(adminRec)}</p>`:''}${kind!=='administrative'?`<h3>التوصيات المالية</h3><p>${esc(finRec)}</p>`:''}<h3>الخلاصة</h3><p>${esc(conclusion)}</p><div style="text-align:center;margin-top:25mm">${data.site.logo_url?`<img src="${esc(data.site.logo_url)}" alt="الشعار" style="max-width:120px;max-height:75px">`:''}<p>${esc(data.site.address||'')} ${data.site.email?' · '+esc(data.site.email):''} ${data.site.phone?' · '+esc(data.site.phone):''}</p></div>`,p++);
      document.getElementById('gfAnnualReportPreview').innerHTML=html;lastHtml=html;lastTitle=title;lastStats={year:data.year,kind,administrative_records:data.admin.length,transactions:data.finance.length,opening_balance:c.opening,income:c.income,expenses:c.expense,closing_balance:c.closing,approved_budget:c.budget};msg.textContent='تم إنشاء التقرير السنوي.';
    }

    function exportDocHtml(){return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(lastTitle)}</title><style>@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,Tahoma,sans-serif;color:#253d39}.gf-report-page{position:relative;width:210mm;min-height:297mm;padding:20mm 18mm 18mm;page-break-after:always}.gf-report-cover{padding:0;display:flex;flex-direction:column;text-align:center}.gf-report-cover-top{padding:30mm 20mm 15mm}.gf-report-cover-logo{max-width:180px;max-height:110px}.gf-report-cover-band{margin-top:auto;background:#082f2c;color:white;padding:17mm}.gf-report-cover-year{display:inline-block;padding:7px 18px;background:#e6f3f1;color:#0f766e}.gf-report-page-footer{position:absolute;bottom:7mm;left:18mm;right:18mm;border-top:1px solid #ddd;padding-top:5px;display:flex;justify-content:space-between;font-size:9px}.gf-report-section-line{height:5px;background:#0f766e;margin:-20mm -18mm 12mm}.gf-report-page h1,.gf-report-page h2,.gf-report-page h3{color:#103f3a}.gf-report-page p,.gf-report-page li{font-size:12px;line-height:1.8}.gf-report-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.gf-report-summary div{padding:14px;background:#f2f7f6;text-align:center}.gf-report-summary b{display:block;font-size:20px;color:#0f766e}.gf-report-table{width:100%;border-collapse:collapse;font-size:10px}.gf-report-table th,.gf-report-table td{border:1px solid #ccc;padding:7px;text-align:right}.gf-report-table th{background:#f0f6f5}</style></head><body>${lastHtml}</body></html>`}
    function exportWord(){if(!lastHtml){document.getElementById('gfAnnualReportMsg').textContent='أنشئ التقرير أولاً.';return}const blob=new Blob(['\ufeff',exportDocHtml()],{type:'application/msword;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=lastTitle+'.doc';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
    function exportPdf(){if(!lastHtml){document.getElementById('gfAnnualReportMsg').textContent='أنشئ التقرير أولاً.';return}const w=window.open('','_blank');if(!w){document.getElementById('gfAnnualReportMsg').textContent='اسمح بالنوافذ المنبثقة.';return}w.document.write(exportDocHtml()+`<script>window.onload=()=>setTimeout(()=>window.print(),400)<\/script>`);w.document.close()}

    async function archiveReport(){
      const msg=document.getElementById('gfAnnualReportMsg');if(!lastHtml){msg.textContent='أنشئ التقرير قبل الأرشفة.';return}
      const {error}=await client.from('governance_finance_report_archives').insert({year:lastStats.year,report_kind:lastStats.kind,title:lastTitle,stats:lastStats,html_snapshot:lastHtml});msg.textContent=error?'تعذر أرشفة التقرير.':'تم اعتماد التقرير وإضافته إلى الأرشيف.';if(!error)loadArchive();
    }
    async function loadArchive(){
      const box=document.getElementById('gfAnnualArchiveList'),y=yearRange().y;box.innerHTML='<p>جارٍ التحميل...</p>';
      const {data,error}=await client.from('governance_finance_report_archives').select('*').eq('year',y).order('archived_at',{ascending:false});
      if(error){box.innerHTML='<div class="empty">تعذر تحميل الأرشيف.</div>';return}archiveCache=data||[];
      box.innerHTML=archiveCache.length?archiveCache.map(a=>`<article class="post-item"><div class="post-top"><div><h3>${esc(a.title)}</h3><small>${new Date(a.archived_at).toLocaleString('ar-MA')}</small><div class="gf-archive-stats"><span>${a.stats?.administrative_records||0} سجل إداري</span><span>${a.stats?.transactions||0} عملية مالية</span><span>الرصيد: ${esc(money(a.stats?.closing_balance||0))}</span></div></div><span class="status published">معتمد</span></div><div class="post-actions"><button data-gf-archive-open="${a.id}">فتح</button><button data-gf-archive-print="${a.id}" class="secondary">طباعة / PDF</button><button data-gf-archive-delete="${a.id}" class="danger">حذف</button></div></article>`).join(''):'<div class="empty">لا توجد تقارير مؤرشفة لهذه السنة.</div>';
    }
    function openArchived(a,print=false){const w=window.open('','_blank');if(!w)return;const oldHtml=lastHtml,oldTitle=lastTitle;lastHtml=a.html_snapshot;lastTitle=a.title;w.document.write(exportDocHtml()+(print?`<script>window.onload=()=>setTimeout(()=>window.print(),400)<\/script>`:''));w.document.close();lastHtml=oldHtml;lastTitle=oldTitle}

    document.getElementById('gfSaveReportNotes').addEventListener('click',saveNotes);
    document.getElementById('gfRefreshAnalysis').addEventListener('click',refreshAnalysis);
    document.getElementById('gfBuildAnnualReport').addEventListener('click',buildReport);
    document.getElementById('gfExportWord').addEventListener('click',exportWord);
    document.getElementById('gfExportPdf').addEventListener('click',exportPdf);
    document.getElementById('gfArchiveAnnualReport').addEventListener('click',archiveReport);
    document.getElementById('gfRefreshArchive').addEventListener('click',loadArchive);
    document.getElementById('gfAnnualArchiveList').addEventListener('click',async e=>{const open=e.target.dataset.gfArchiveOpen,print=e.target.dataset.gfArchivePrint,del=e.target.dataset.gfArchiveDelete,id=open||print||del;if(!id)return;const a=archiveCache.find(x=>String(x.id)===String(id));if(!a)return;if(open)openArchived(a,false);if(print)openArchived(a,true);if(del&&confirm('هل تريد حذف هذه النسخة المؤرشفة؟')){await client.from('governance_finance_report_archives').delete().eq('id',id);loadArchive()}});

    async function refreshAll(){await Promise.all([loadNotes(),refreshAnalysis(),loadArchive()])}
    refreshAll();
  }
  waitForFinance();
})();