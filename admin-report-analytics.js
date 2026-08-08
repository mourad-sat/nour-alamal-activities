(function(){
  let attempts=0;
  function waitForReporting(){
    const panel=document.querySelector('.tab-panel[data-panel="reports"]');
    const official=document.getElementById('officialReportSuite');
    if(!panel||!official){if(attempts++<120)setTimeout(waitForReporting,120);return}
    if(document.getElementById('reportAnalyticsSuite'))return;
    init(panel);
  }

  function init(panel){
    const esc=window.escapeHtml||((v='')=>String(v).replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])));
    const monthNames=['يناير','فبراير','مارس','أبريل','ماي','يونيو','يوليوز','غشت','شتنبر','أكتوبر','نونبر','دجنبر'];
    const currentYear=()=>new Date().getFullYear();
    const currentMonth=()=>`${currentYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
    let archiveCache=[];

    const suite=document.createElement('section');
    suite.id='reportAnalyticsSuite';
    suite.className='panel report-analytics-suite';
    suite.innerHTML=`
      <div class="analytics-head">
        <div><span class="badge">الأرشيف والتحليل</span><h2>أرشيف التقارير والمقارنة الزمنية</h2><p>اعتماد نسخ نهائية من التقارير ومقارنة تطور أنشطة الجمعية ومؤشراتها عبر الأشهر والسنوات.</p></div>
        <button id="archiveCurrentReport" type="button">اعتماد وأرشفة التقرير الحالي</button>
      </div>

      <div class="analytics-grid">
        <section class="analytics-block">
          <div class="list-head"><div><h3>تحليل سنة كاملة</h3><p>مقارنة شهرية للأنشطة والمستفيدين والساعات.</p></div><div class="analytics-controls"><input id="analyticsYear" type="number" min="2020" max="2100"><button id="analyticsRefresh" type="button" class="secondary">تحديث</button></div></div>
          <div id="analyticsYearSummary" class="analytics-summary"></div>
          <div id="analyticsMonthlyChart" class="analytics-chart"><p>جارٍ التحميل...</p></div>
        </section>

        <section class="analytics-block">
          <div class="list-head"><div><h3>مقارنة السنوات</h3><p>آخر أربع سنوات حتى السنة المختارة.</p></div></div>
          <div id="analyticsYearlyChart" class="analytics-chart"><p>جارٍ التحميل...</p></div>
        </section>
      </div>

      <section class="archive-section">
        <div class="list-head"><div><h3>أرشيف التقارير المعتمدة</h3><p>النسخ المؤرشفة تحفظ شكل التقرير والمؤشرات وقت الاعتماد.</p></div><button id="archiveRefresh" type="button" class="secondary">تحديث الأرشيف</button></div>
        <p id="archiveMsg" class="msg"></p>
        <div id="archiveList" class="archive-list"><p>جارٍ التحميل...</p></div>
      </section>

      <section id="archivePreviewWrap" class="archive-preview-wrap hidden">
        <div class="list-head"><h3 id="archivePreviewTitle">نسخة مؤرشفة</h3><div class="actions"><button id="archivePrint" type="button" class="secondary">طباعة / PDF</button><button id="archiveClose" type="button" class="secondary">إغلاق</button></div></div>
        <div id="archivePreview" class="archive-preview"></div>
      </section>`;
    panel.appendChild(suite);

    const style=document.createElement('style');
    style.textContent=`
      .report-analytics-suite{margin-top:22px}.analytics-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}.analytics-grid{display:grid;grid-template-columns:1.3fr .7fr;gap:18px;margin-top:20px}.analytics-block{border:1px solid #dce8e6;border-radius:18px;padding:18px;background:#fbfdfd}.analytics-controls{display:flex;align-items:center;gap:7px}.analytics-controls input{width:105px;margin:0}.analytics-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:15px 0}.analytics-stat{background:#edf6f4;border-radius:14px;padding:12px;text-align:center}.analytics-stat b{display:block;font-size:22px;color:#0f766e}.analytics-stat span{font-size:10px;color:#657b77}.analytics-chart{display:grid;gap:9px}.analytics-row{display:grid;grid-template-columns:78px 1fr 64px;align-items:center;gap:8px;font-size:11px}.analytics-bars{display:grid;gap:3px}.analytics-bar{height:8px;background:#e5efed;border-radius:999px;overflow:hidden}.analytics-fill{height:100%;border-radius:inherit;background:#0f766e}.analytics-fill.alt{background:#39958b}.analytics-fill.soft{background:#7fb8b1}.analytics-value{text-align:left;color:#5f7773;font-size:10px}.analytics-legend{display:flex;gap:12px;flex-wrap:wrap;font-size:10px;color:#627874;margin:6px 0 12px}.analytics-legend i{width:9px;height:9px;border-radius:3px;background:#0f766e;display:inline-block;margin-left:3px}.analytics-legend i.alt{background:#39958b}.analytics-legend i.soft{background:#7fb8b1}.archive-section{margin-top:24px;border-top:1px solid #e1ecea;padding-top:20px}.archive-list{display:grid;gap:10px;margin-top:10px}.archive-card{border:1px solid #dce8e6;border-radius:16px;padding:15px;background:#fff}.archive-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.archive-card h4{margin:0 0 4px}.archive-kpis{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.archive-kpi{background:#f0f6f5;border-radius:999px;padding:5px 9px;font-size:10px;color:#49645f}.archive-preview-wrap{margin-top:20px;border-top:1px solid #e0ebe9;padding-top:18px}.archive-preview{background:#dfe9e7;border-radius:18px;padding:18px;overflow:auto}.archive-preview .official-sheet{margin:0 auto 18px}.archive-final{background:#e7f6ef;color:#17754c}.archive-period{font-size:11px;color:#718581}.trend-up{color:#17754c}.trend-down{color:#a14b3f}@media(max-width:900px){.analytics-head{flex-direction:column}.analytics-grid{grid-template-columns:1fr}.analytics-summary{grid-template-columns:repeat(2,1fr)}.analytics-row{grid-template-columns:62px 1fr 50px}.archive-card-top{flex-direction:column}}`;
    document.head.appendChild(style);

    function periodInfo(){
      const type=document.getElementById('reportBuildType')?.value||'monthly';
      const key=type==='annual'?String(document.getElementById('reportBuildYear')?.value||''):String(document.getElementById('reportBuildMonth')?.value||'');
      if(!key)return {type,key:'',from:'',to:'',label:''};
      if(type==='annual')return {type,key,from:key+'-01-01',to:key+'-12-31',label:'سنة '+key};
      const [y,m]=key.split('-').map(Number),last=new Date(y,m,0).getDate();
      return {type,key,from:key+'-01',to:key+'-'+String(last).padStart(2,'0'),label:(monthNames[m-1]||'')+' '+y};
    }
    function sum(rows,key){return rows.reduce((a,r)=>a+(Number(r[key])||0),0)}
    function formatNumber(n){return Number(n||0).toLocaleString('ar-MA',{maximumFractionDigits:1})}

    async function archiveCurrent(){
      const msg=document.getElementById('archiveMsg'),p=periodInfo(),preview=document.getElementById('officialReportPreview');
      if(!p.key){msg.textContent='حدد فترة التقرير أولاً.';return}
      if(!preview||!preview.querySelector('.official-sheet')){msg.textContent='أنشئ «النسخة الرسمية» أولاً ثم قم بأرشفتها.';return}
      msg.textContent='جارٍ اعتماد وأرشفة التقرير...';
      const [actsRes,storiesRes]=await Promise.all([
        client.from('report_activities').select('id,beneficiaries_total,beneficiaries_female,beneficiaries_male,activity_hours').gte('start_date',p.from).lte('start_date',p.to),
        client.from('report_success_stories').select('id,consent_status').gte('story_date',p.from).lte('story_date',p.to)
      ]);
      if(actsRes.error||storiesRes.error){msg.textContent='تعذر جمع مؤشرات التقرير.';return}
      const acts=actsRes.data||[],stories=storiesRes.data||[];
      const stats={activities:acts.length,beneficiaries:sum(acts,'beneficiaries_total'),female:sum(acts,'beneficiaries_female'),male:sum(acts,'beneficiaries_male'),hours:sum(acts,'activity_hours'),stories:stories.length};
      const title=document.getElementById('officialCoverTitle')?.value.trim()||(p.type==='annual'?'التقرير الأدبي السنوي':'التقرير الأدبي الشهري');
      const summary=document.getElementById('monthlySummary')?.textContent?.trim()||'';
      const {error}=await client.from('report_archives').upsert({period_type:p.type,period_key:p.key,title,status:'final',stats,summary,html_snapshot:preview.innerHTML,archived_at:new Date().toISOString()},{onConflict:'period_type,period_key'});
      if(error){msg.textContent='تعذر أرشفة التقرير: '+(error.message||'خطأ');return}
      msg.textContent='تم اعتماد التقرير وحفظ نسخة مؤرشفة.';
      await loadArchives();
    }

    async function loadArchives(){
      const box=document.getElementById('archiveList');box.innerHTML='<p>جارٍ التحميل...</p>';
      const {data,error}=await client.from('report_archives').select('*').order('period_key',{ascending:false}).order('archived_at',{ascending:false});
      if(error){box.innerHTML='<div class="empty">تعذر تحميل أرشيف التقارير.</div>';return}
      archiveCache=data||[];
      if(!archiveCache.length){box.innerHTML='<div class="empty">لم يتم اعتماد أي تقرير بعد.</div>';return}
      box.innerHTML=archiveCache.map(a=>{
        const s=a.stats||{};const label=a.period_type==='annual'?'سنوي':'شهري';
        return `<article class="archive-card"><div class="archive-card-top"><div><h4>${esc(a.title||'تقرير أدبي')}</h4><div class="archive-period">${label} · ${esc(a.period_key)} · آخر اعتماد ${new Date(a.archived_at).toLocaleDateString('ar-MA')}</div></div><span class="status archive-final">معتمد</span></div><div class="archive-kpis"><span class="archive-kpi">${formatNumber(s.activities)} نشاط</span><span class="archive-kpi">${formatNumber(s.beneficiaries)} مستفيد/مشاركة</span><span class="archive-kpi">${formatNumber(s.hours)} ساعة</span><span class="archive-kpi">${formatNumber(s.stories)} قصة أثر</span></div><div class="post-actions"><button data-archive-view="${a.id}">فتح النسخة</button><button data-archive-print="${a.id}" class="secondary">طباعة / PDF</button><button data-archive-delete="${a.id}" class="danger">حذف من الأرشيف</button></div></article>`;
      }).join('');
    }

    function openArchive(row){
      document.getElementById('archivePreviewTitle').textContent=(row.title||'تقرير مؤرشف')+' — '+row.period_key;
      document.getElementById('archivePreview').innerHTML=row.html_snapshot||'<div class="empty">لا توجد معاينة محفوظة.</div>';
      document.getElementById('archivePreviewWrap').classList.remove('hidden');
      document.getElementById('archivePreviewWrap').scrollIntoView({behavior:'smooth',block:'start'});
    }

    function printArchive(row){
      if(!row?.html_snapshot)return;
      const w=window.open('','_blank');if(!w)return;
      w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(row.title||'تقرير')}</title><style>@page{size:A4;margin:0}body{margin:0;font-family:Arial,Tahoma,sans-serif}.official-sheet{position:relative;width:210mm;min-height:297mm;padding:20mm 18mm 18mm;page-break-after:always;box-sizing:border-box;overflow:hidden}.official-cover{padding:0}.official-cover-top{text-align:center;padding:23mm 20mm 10mm}.official-cover-logo{max-width:180px;max-height:105px}.official-cover-image{width:100%;height:118mm;object-fit:cover}.official-cover-bottom{background:#082f2c;color:#fff;padding:10mm 20mm;display:flex;justify-content:space-between}.official-page-footer{position:absolute;bottom:8mm;left:18mm;right:18mm;border-top:1px solid #ddd;padding-top:5px;font-size:9px;display:flex;justify-content:space-between}.official-brand-line{height:5px;background:#0f766e;margin:-20mm -18mm 12mm}.official-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.official-kpi{background:#f1f7f6;padding:14px;text-align:center;border-radius:12px}.official-kpi b{display:block;font-size:24px;color:#0f766e}.official-gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.official-gallery img{width:100%;height:92mm;object-fit:cover}.official-activity-card,.official-story-card{border:1px solid #dfeae8;padding:14px;margin:12px 0}.official-category-row{display:grid;grid-template-columns:120px 1fr 35px;gap:8px;align-items:center}.official-category-track{height:10px;background:#e6efed}.official-category-fill{height:100%;background:#0f766e}p,li{line-height:1.8}h1,h2,h3{color:#103f3a}</style></head><body>${row.html_snapshot}<script>window.onload=()=>setTimeout(()=>window.print(),400)<\/script></body></html>`);w.document.close();
    }

    async function loadYearAnalytics(){
      const year=Number(document.getElementById('analyticsYear').value)||currentYear();
      const from=`${year}-01-01`,to=`${year}-12-31`;
      const [actsRes,storiesRes]=await Promise.all([
        client.from('report_activities').select('start_date,beneficiaries_total,activity_hours').gte('start_date',from).lte('start_date',to),
        client.from('report_success_stories').select('story_date').gte('story_date',from).lte('story_date',to)
      ]);
      const acts=actsRes.data||[],stories=storiesRes.data||[];
      const months=Array.from({length:12},(_,i)=>({month:i+1,activities:0,beneficiaries:0,hours:0,stories:0}));
      acts.forEach(a=>{const m=Number(String(a.start_date||'').slice(5,7));if(m>=1&&m<=12){const r=months[m-1];r.activities++;r.beneficiaries+=Number(a.beneficiaries_total)||0;r.hours+=Number(a.activity_hours)||0}});
      stories.forEach(s=>{const m=Number(String(s.story_date||'').slice(5,7));if(m>=1&&m<=12)months[m-1].stories++});
      const totalActivities=months.reduce((a,m)=>a+m.activities,0),totalBeneficiaries=months.reduce((a,m)=>a+m.beneficiaries,0),totalHours=months.reduce((a,m)=>a+m.hours,0),totalStories=months.reduce((a,m)=>a+m.stories,0);
      const best=months.reduce((a,b)=>b.beneficiaries>a.beneficiaries?b:a,months[0]);
      document.getElementById('analyticsYearSummary').innerHTML=`<div class="analytics-stat"><b>${formatNumber(totalActivities)}</b><span>نشاطاً خلال السنة</span></div><div class="analytics-stat"><b>${formatNumber(totalBeneficiaries)}</b><span>مستفيد/مشاركة</span></div><div class="analytics-stat"><b>${formatNumber(totalHours)}</b><span>ساعة نشاط</span></div><div class="analytics-stat"><b>${totalBeneficiaries?monthNames[best.month-1]:'—'}</b><span>أعلى شهر استفادة</span></div>`;
      const maxA=Math.max(1,...months.map(m=>m.activities)),maxB=Math.max(1,...months.map(m=>m.beneficiaries)),maxH=Math.max(1,...months.map(m=>m.hours));
      document.getElementById('analyticsMonthlyChart').innerHTML=`<div class="analytics-legend"><span><i></i> الأنشطة</span><span><i class="alt"></i> المستفيدون</span><span><i class="soft"></i> الساعات</span></div>`+months.map(m=>`<div class="analytics-row"><strong>${monthNames[m.month-1]}</strong><div class="analytics-bars"><div class="analytics-bar"><div class="analytics-fill" style="width:${m.activities/maxA*100}%"></div></div><div class="analytics-bar"><div class="analytics-fill alt" style="width:${m.beneficiaries/maxB*100}%"></div></div><div class="analytics-bar"><div class="analytics-fill soft" style="width:${m.hours/maxH*100}%"></div></div></div><div class="analytics-value">${m.activities} / ${formatNumber(m.beneficiaries)}</div></div>`).join('');
      await loadYearComparison(year);
    }

    async function loadYearComparison(year){
      const first=year-3;
      const {data,error}=await client.from('report_activities').select('start_date,beneficiaries_total,activity_hours').gte('start_date',`${first}-01-01`).lte('start_date',`${year}-12-31`);
      const rows=Array.from({length:4},(_,i)=>({year:first+i,activities:0,beneficiaries:0,hours:0}));
      if(!error)(data||[]).forEach(a=>{const y=Number(String(a.start_date||'').slice(0,4)),r=rows.find(x=>x.year===y);if(r){r.activities++;r.beneficiaries+=Number(a.beneficiaries_total)||0;r.hours+=Number(a.activity_hours)||0}});
      const max=Math.max(1,...rows.map(r=>r.beneficiaries));
      document.getElementById('analyticsYearlyChart').innerHTML=rows.map((r,i)=>{const prev=i?rows[i-1].beneficiaries:null;const diff=prev===null?null:r.beneficiaries-prev;return `<div class="analytics-row"><strong>${r.year}</strong><div class="analytics-bars"><div class="analytics-bar"><div class="analytics-fill alt" style="width:${r.beneficiaries/max*100}%"></div></div></div><div class="analytics-value">${formatNumber(r.beneficiaries)}${diff===null?'':` <span class="${diff>=0?'trend-up':'trend-down'}">${diff>=0?'▲':'▼'}${formatNumber(Math.abs(diff))}</span>`}</div></div>`}).join('')||'<div class="empty">لا توجد بيانات.</div>';
    }

    document.getElementById('analyticsYear').value=currentYear();
    document.getElementById('archiveCurrentReport').addEventListener('click',archiveCurrent);
    document.getElementById('archiveRefresh').addEventListener('click',loadArchives);
    document.getElementById('analyticsRefresh').addEventListener('click',loadYearAnalytics);
    document.getElementById('archiveClose').addEventListener('click',()=>document.getElementById('archivePreviewWrap').classList.add('hidden'));
    document.getElementById('archivePrint').addEventListener('click',()=>{const id=document.getElementById('archivePreview').dataset.archiveId,row=archiveCache.find(x=>String(x.id)===String(id));if(row)printArchive(row)});
    document.getElementById('archiveList').addEventListener('click',async e=>{
      const view=e.target.dataset.archiveView,print=e.target.dataset.archivePrint,del=e.target.dataset.archiveDelete,id=view||print||del;if(!id)return;
      const row=archiveCache.find(x=>String(x.id)===String(id));if(!row)return;
      if(view){document.getElementById('archivePreview').dataset.archiveId=row.id;openArchive(row)}
      if(print)printArchive(row);
      if(del&&confirm('هل تريد حذف هذه النسخة من الأرشيف؟')){await client.from('report_archives').delete().eq('id',row.id);await loadArchives()}
    });

    async function boot(){if(window.isAdmin&&await isAdmin()){await Promise.all([loadArchives(),loadYearAnalytics()])}}
    client.auth.onAuthStateChange(()=>boot());boot();
  }
  waitForReporting();
})();