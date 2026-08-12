(function(){
  const $=id=>document.getElementById(id);
  const esc=window.escapeHtml||((v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])));
  const months=['يناير','فبراير','مارس','أبريل','ماي','يونيو','يوليوز','غشت','شتنبر','أكتوبر','نونبر','دجنبر'];
  const statusLabels={planned:'مبرمج',in_progress:'قيد التنفيذ',completed:'منجز',postponed:'مؤجل',cancelled:'ملغى'};
  let installing=false;

  function money(v){return new Intl.NumberFormat('ar-MA',{maximumFractionDigits:2}).format(Number(v)||0)+' درهم'}
  function dateText(v){return v?new Date(v+'T12:00:00').toLocaleDateString('ar-MA'):'—'}
  function monthIndex(r){if(r.start_date)return Math.max(0,Number(String(r.start_date).slice(5,7))-1);const t=String(r.period_label||'');const i=months.findIndex(m=>t.includes(m));return i>=0?i:12}
  function monthTitle(i){return i<12?months[i]:'أنشطة بدون شهر محدد'}

  async function getRows(){
    const year=Number($('annualYearFilter')?.value)||new Date().getFullYear();
    const {data,error}=await client.from('annual_activity_plan').select('*').eq('year',year).order('start_date',{ascending:true,nullsFirst:false}).order('id',{ascending:true});
    if(error)throw error;
    return {year,rows:data||[]};
  }

  function buildReport(year,rows){
    const totalBudget=rows.reduce((s,r)=>s+(Number(r.estimated_budget)||0),0);
    const completed=rows.filter(r=>r.status==='completed').length;
    const progress=rows.filter(r=>r.status==='in_progress').length;
    const axes=[...new Set(rows.map(r=>String(r.axis||'').trim()).filter(Boolean))];
    const categories=[...new Set(rows.map(r=>String(r.category||'').trim()).filter(Boolean))];
    const groups=Array.from({length:13},()=>[]);rows.forEach(r=>groups[monthIndex(r)].push(r));
    const today=new Date().toLocaleDateString('ar-MA');
    const monthly=groups.map((g,i)=>g.length?`<section class="pdf-month"><div class="pdf-month-head"><h2>${monthTitle(i)}</h2><span>${g.length} نشاط</span></div><table><thead><tr><th style="width:25%">النشاط</th><th style="width:12%">النوع</th><th style="width:13%">المحور</th><th style="width:14%">الفئة المستهدفة</th><th style="width:14%">الفترة / التاريخ</th><th style="width:11%">المسؤول</th><th style="width:11%">الميزانية</th></tr></thead><tbody>${g.map(r=>`<tr><td><strong>${esc(r.title)}</strong>${r.objectives?`<small>${esc(r.objectives)}</small>`:''}</td><td>${esc(r.category||'—')}</td><td>${esc(r.axis||'—')}</td><td>${esc(r.target_group||'—')}</td><td>${esc(r.period_label||'')}${r.start_date?`${r.period_label?'<br>':''}${dateText(r.start_date)}${r.end_date?' - '+dateText(r.end_date):''}`:''}</td><td>${esc(r.responsible||'—')}</td><td>${money(r.estimated_budget)}</td></tr>`).join('')}</tbody></table></section>`:'').join('');

    const wrap=document.createElement('div');wrap.id='annualDonorPdf';wrap.dir='rtl';wrap.innerHTML=`
      <style>
        #annualDonorPdf{font-family:Cairo,Arial,sans-serif;color:#173c37;background:#fff;width:210mm;box-sizing:border-box;font-size:10.5px;line-height:1.65}
        #annualDonorPdf *{box-sizing:border-box}#annualDonorPdf .pdf-cover{min-height:285mm;padding:24mm 18mm 18mm;display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(150deg,#f5fbf9 0%,#fff 52%,#edf7f4 100%);border-top:9mm solid #0f766e}
        #annualDonorPdf .brand{display:flex;align-items:center;gap:14px}.brand-mark{width:58px;height:58px;border-radius:18px;background:#0f766e;color:#fff;display:grid;place-items:center;font-size:27px;font-weight:800}.brand-name b{display:block;font-size:21px}.brand-name span{font-size:11px;color:#64807a}
        #annualDonorPdf .cover-main{padding:20mm 0}.cover-kicker{display:inline-block;background:#e3f2ee;color:#0f766e;border-radius:999px;padding:6px 12px;font-weight:800}.cover-main h1{font-size:30px;line-height:1.35;margin:14px 0 8px}.cover-main h2{font-size:19px;color:#0f766e;margin:0}.cover-main p{max-width:145mm;color:#5d7771;font-size:12px}.cover-year{font-size:42px;font-weight:800;color:#0f766e;margin-top:15mm}.cover-footer{border-top:1px solid #cadeda;padding-top:10px;display:flex;justify-content:space-between;color:#6c827d}
        #annualDonorPdf .pdf-page{padding:14mm 13mm;min-height:282mm}.pdf-section-title{display:flex;justify-content:space-between;align-items:end;border-bottom:2px solid #0f766e;padding-bottom:7px;margin-bottom:12px}.pdf-section-title h2{margin:0;font-size:18px}.pdf-section-title span{color:#748a85}.pdf-intro{background:#f3f9f7;border-right:4px solid #0f766e;border-radius:12px;padding:13px 15px;margin:12px 0 16px}.pdf-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:14px 0 18px}.pdf-kpi{border:1px solid #d9e8e4;border-radius:12px;padding:11px;background:#fff}.pdf-kpi span{display:block;color:#738681;font-size:9px}.pdf-kpi b{font-size:17px;color:#0f766e}.pdf-meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pdf-meta{border:1px solid #e1ece9;border-radius:12px;padding:12px}.pdf-meta h3{margin:0 0 5px;font-size:12px}.pdf-meta p{margin:0;color:#5d7771}
        #annualDonorPdf .pdf-month{padding:10mm 12mm 8mm;break-inside:avoid-page;page-break-inside:avoid}.pdf-month-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;border-right:5px solid #0f766e;padding-right:9px}.pdf-month-head h2{margin:0;font-size:16px}.pdf-month-head span{background:#eaf5f2;color:#0f766e;padding:4px 9px;border-radius:999px;font-weight:800}
        #annualDonorPdf table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:8.6px}#annualDonorPdf th{background:#0f766e;color:#fff;padding:7px 5px;text-align:right}#annualDonorPdf td{border:1px solid #dfe9e7;padding:6px 5px;vertical-align:top;word-break:break-word}#annualDonorPdf tr:nth-child(even) td{background:#f8fbfa}#annualDonorPdf td strong{display:block;font-size:9.2px}#annualDonorPdf td small{display:block;color:#71847f;margin-top:2px;line-height:1.45}
        #annualDonorPdf .pdf-summary{padding:14mm 13mm}.pdf-summary-box{border:2px solid #0f766e;border-radius:16px;padding:16px;background:#f7fbfa}.pdf-summary-box h2{margin:0 0 10px;font-size:18px}.pdf-summary-table{width:100%;margin-top:12px;font-size:10px}.pdf-summary-table td{padding:8px}.pdf-sign{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:28mm}.pdf-sign div{border-top:1px solid #78918b;padding-top:6px;text-align:center;color:#6d827d}.pdf-note{margin-top:14px;color:#6e827e;font-size:8.5px;text-align:center}
        @media print{#annualDonorPdf{width:auto}.pdf-cover,.pdf-page,.pdf-month,.pdf-summary{break-after:page;page-break-after:always}.pdf-summary{break-after:auto;page-break-after:auto}}
      </style>
      <section class="pdf-cover">
        <div class="brand"><div class="brand-mark">ن</div><div class="brand-name"><b>جمعية نور الأمل</b><span>Association NOUR AL AMAL</span></div></div>
        <div class="cover-main"><span class="cover-kicker">وثيقة التخطيط السنوي</span><h1>البرمجة السنوية للأنشطة</h1><h2>وثيقة تقديمية للجهات المانحة والشركاء</h2><p>تقدم هذه الوثيقة تصور الجمعية للأنشطة المبرمجة خلال السنة، ومحاور التدخل، والفئات المستهدفة، والميزانية التقديرية، بما يدعم الشفافية والتخطيط والتواصل مع الشركاء.</p><div class="cover-year">${year}</div></div>
        <div class="cover-footer"><span>جمعية نور الأمل</span><span>تاريخ إعداد الوثيقة: ${today}</span></div>
      </section>
      <section class="pdf-page">
        <div class="pdf-section-title"><h2>ملخص تنفيذي</h2><span>البرمجة السنوية ${year}</span></div>
        <div class="pdf-intro">تعتمد البرمجة السنوية على تنويع مجالات التدخل بين الأنشطة التربوية والتكوينية والثقافية والاجتماعية والرقمية والرياضية والتحسيسية، مع ربط كل نشاط بفئة مستهدفة وأهداف ونتائج منتظرة ومسؤولية تنفيذ واضحة.</div>
        <div class="pdf-kpis"><div class="pdf-kpi"><span>إجمالي الأنشطة</span><b>${rows.length}</b></div><div class="pdf-kpi"><span>قيد التنفيذ</span><b>${progress}</b></div><div class="pdf-kpi"><span>الأنشطة المنجزة</span><b>${completed}</b></div><div class="pdf-kpi"><span>الميزانية التقديرية</span><b>${money(totalBudget)}</b></div></div>
        <div class="pdf-meta-grid"><div class="pdf-meta"><h3>محاور التدخل</h3><p>${axes.length?axes.map(esc).join('، '):'يتم تحديد المحاور حسب الأنشطة المبرمجة.'}</p></div><div class="pdf-meta"><h3>أنواع الأنشطة</h3><p>${categories.length?categories.map(esc).join('، '):'أنشطة متعددة المجالات.'}</p></div><div class="pdf-meta"><h3>منهجية التتبع</h3><p>يتم تحديث حالة كل نشاط من مبرمج إلى قيد التنفيذ ثم منجز، مع إمكانية التأجيل أو الإلغاء وتحيين الميزانية والملاحظات.</p></div><div class="pdf-meta"><h3>الغرض من الوثيقة</h3><p>تسهيل مشاركة الخطة السنوية مع الجهات المانحة والشركاء وإبراز وضوح الرؤية والاحتياجات والنتائج المنتظرة.</p></div></div>
      </section>
      ${monthly}
      <section class="pdf-summary"><div class="pdf-summary-box"><h2>الخلاصة المالية والتنفيذية</h2><table class="pdf-summary-table"><tbody><tr><td>عدد الأنشطة المبرمجة</td><td><strong>${rows.length}</strong></td></tr><tr><td>إجمالي الميزانية التقديرية</td><td><strong>${money(totalBudget)}</strong></td></tr><tr><td>عدد المحاور الرئيسية</td><td><strong>${axes.length}</strong></td></tr><tr><td>عدد أنواع الأنشطة</td><td><strong>${categories.length}</strong></td></tr></tbody></table><p>تبقى البرمجة قابلة للتحيين وفق الشراكات المتاحة، الموارد المرصودة، الأولويات المحلية، وحاجيات الفئات المستهدفة، مع الحرص على توثيق التنفيذ والنتائج الفعلية لكل نشاط.</p></div><div class="pdf-sign"><div>رئيس(ة) الجمعية / التوقيع والخاتم</div><div>مسؤول(ة) البرنامج / التوقيع</div></div><div class="pdf-note">جمعية نور الأمل - البرمجة السنوية للأنشطة ${year}</div></section>`;
    return wrap;
  }

  function ensureHtml2Pdf(){return new Promise((resolve,reject)=>{if(window.html2pdf){resolve();return}const old=document.querySelector('script[data-annual-html2pdf]');if(old){old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return}const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';s.dataset.annualHtml2pdf='1';s.onload=resolve;s.onerror=()=>reject(new Error('تعذر تحميل مكتبة PDF'));document.head.appendChild(s)})}

  async function downloadPdf(){const btn=$('annualPdfDownload');if(btn){btn.disabled=true;btn.textContent='جارٍ إعداد PDF...'}try{const {year,rows}=await getRows();if(!rows.length){alert('لا توجد أنشطة في السنة المحددة لتصديرها.');return}await ensureHtml2Pdf();const report=buildReport(year,rows);report.style.position='fixed';report.style.right='-10000px';report.style.top='0';document.body.appendChild(report);await document.fonts?.ready;await window.html2pdf().set({margin:0,filename:`NOUR-AL-AMAL-Annual-Plan-${year}.pdf`,image:{type:'jpeg',quality:0.98},html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff',logging:false},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy'],avoid:['tr']}}).from(report).save();report.remove()}catch(err){console.error(err);alert('تعذر إنشاء ملف PDF: '+(err.message||'خطأ غير معروف'))}finally{if(btn){btn.disabled=false;btn.textContent='تحميل PDF احترافي'}}}

  async function printOfficial(){try{const {year,rows}=await getRows();if(!rows.length){alert('لا توجد أنشطة في السنة المحددة للطباعة.');return}const report=buildReport(year,rows);const w=window.open('','_blank');if(!w){alert('المتصفح منع نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.');return}w.document.open();w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>البرمجة السنوية ${year} - جمعية نور الأمل</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet"><style>@page{size:A4;margin:0}body{margin:0;background:#fff}</style></head><body>${report.outerHTML}<script>window.onload=()=>setTimeout(()=>window.print(),500)<\/script></body></html>`);w.document.close()}catch(err){console.error(err);alert('تعذر فتح نسخة الطباعة.') }}

  function install(){if(installing||$('annualPdfDownload'))return;const old=$('annualPrint');if(!old)return;installing=true;old.textContent='طباعة النسخة الرسمية';old.removeEventListener?.('click',()=>window.print());old.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();printOfficial()},{capture:true});const b=document.createElement('button');b.id='annualPdfDownload';b.type='button';b.textContent='تحميل PDF احترافي';b.style.background='#0f766e';b.style.color='#fff';b.style.marginInlineStart='8px';b.addEventListener('click',downloadPdf);old.parentNode.insertBefore(b,old);installing=false}

  function boot(){let n=0;const t=setInterval(()=>{install();if($('annualPdfDownload')||++n>30)clearInterval(t)},200)}
  window.addEventListener('admin-auth-ready',boot);window.addEventListener('admin-modules-ready',boot);if(window.currentAdminProfile)boot();
})();