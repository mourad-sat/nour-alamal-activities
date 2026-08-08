(function(){
  let tries=0,site={};
  const esc=window.escapeHtml||((v='')=>String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])));
  const money=v=>new Intl.NumberFormat('ar-MA',{style:'currency',currency:'MAD',maximumFractionDigits:2}).format(Number(v)||0);
  const statusLabels={draft:'مسودة',approved:'معتمدة',archived:'مؤرشفة'};
  const fmtDate=v=>v?new Date(v+'T12:00:00').toLocaleDateString('ar-MA'):'—';

  async function wait(){
    const root=document.getElementById('technicalCardsPanel');
    if(!root){if(tries++<120)setTimeout(wait,120);return}
    await loadSite();
    injectButtons(root);
    new MutationObserver(()=>injectButtons(root)).observe(root,{childList:true,subtree:true});
    root.addEventListener('click',handleClick);
  }

  async function loadSite(){
    const {data}=await client.from('site_settings').select('key,value').in('key',['logo_url','address','email','phone']);
    site=Object.fromEntries((data||[]).map(x=>[x.key,x.value]));
  }

  function injectButtons(root){
    root.querySelectorAll('#tcProgramList .tc-card-actions').forEach(a=>{
      if(a.querySelector('[data-tcp-preview]'))return;
      const id=a.querySelector('[data-tcp-edit]')?.dataset.tcpEdit;if(!id)return;
      const wrap=document.createElement('span');wrap.className='tc-export-actions';wrap.innerHTML=`<button type="button" data-tcp-preview="${id}" class="secondary">معاينة</button><button type="button" data-tcp-word="${id}" class="secondary">Word</button><button type="button" data-tcp-pdf="${id}" class="secondary">PDF</button>`;a.prepend(wrap);
    });
    root.querySelectorAll('#tcActivityList .tc-card-actions').forEach(a=>{
      if(a.querySelector('[data-tca-preview]'))return;
      const id=a.querySelector('[data-tca-edit]')?.dataset.tcaEdit;if(!id)return;
      const wrap=document.createElement('span');wrap.className='tc-export-actions';wrap.innerHTML=`<button type="button" data-tca-preview="${id}" class="secondary">معاينة</button><button type="button" data-tca-word="${id}" class="secondary">Word</button><button type="button" data-tca-pdf="${id}" class="secondary">PDF</button>`;a.prepend(wrap);
    });
    if(!document.getElementById('tcExportStyle')){const s=document.createElement('style');s.id='tcExportStyle';s.textContent='.tc-export-actions{display:inline-flex;gap:6px;flex-wrap:wrap}.tc-export-actions button{padding:6px 9px;font-size:10px}';document.head.appendChild(s)}
  }

  function section(title,value){if(!String(value||'').trim())return '';return `<section class="card-section"><h2>${esc(title)}</h2><div class="text-block">${esc(value).replace(/\n/g,'<br>')}</div></section>`}
  function pair(label,value){return `<div class="info-item"><span>${esc(label)}</span><b>${esc(value||'—')}</b></div>`}

  function baseStyles(){return `
    @page{size:A4;margin:13mm}*{box-sizing:border-box}body{margin:0;background:#eef3f2;font-family:Arial,'Tahoma',sans-serif;color:#193c38;direction:rtl;line-height:1.75}.sheet{width:210mm;min-height:297mm;margin:18px auto;background:#fff;padding:16mm 15mm 15mm;box-shadow:0 8px 30px rgba(0,0,0,.08);position:relative}.doc-head{display:flex;justify-content:space-between;align-items:center;gap:18px;border-bottom:3px solid #0f766e;padding-bottom:14px;margin-bottom:18px}.brand{display:flex;align-items:center;gap:12px}.brand img{width:72px;height:58px;object-fit:contain}.brand strong{display:block;font-size:18px}.brand small{color:#637c78}.doc-kind{text-align:left}.doc-kind span{font-size:11px;color:#718682}.doc-kind b{display:block;font-size:15px;color:#0f766e}.title-box{text-align:center;padding:20px 12px 14px}.title-box .eyebrow{display:inline-block;background:#e9f4f2;color:#0f766e;border-radius:999px;padding:5px 12px;font-size:11px;font-weight:700}.title-box h1{font-size:27px;line-height:1.45;margin:12px 0 5px;color:#082f2c}.title-box p{margin:0;color:#718682;font-size:12px}.info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:18px 0}.info-item{border:1px solid #dce8e6;background:#f8fbfa;border-radius:10px;padding:9px 11px}.info-item span{display:block;color:#718682;font-size:9px}.info-item b{font-size:11px;color:#173e39}.hero-image{width:100%;max-height:72mm;object-fit:cover;border-radius:13px;margin:4px 0 16px}.card-section{margin:14px 0;break-inside:avoid}.card-section h2{font-size:15px;color:#0f766e;margin:0 0 7px;padding-bottom:5px;border-bottom:1px solid #dce8e6}.text-block{font-size:12px;white-space:normal}.footer{margin-top:22px;padding-top:9px;border-top:1px solid #dce8e6;display:flex;justify-content:space-between;gap:12px;color:#718682;font-size:9px}.budget-box{background:#082f2c;color:#fff;border-radius:12px;padding:12px 16px;margin:16px 0;display:flex;justify-content:space-between;align-items:center}.budget-box span{font-size:11px}.budget-box b{font-size:18px}.signature{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:28px;text-align:center;font-size:11px}.signature div{border-top:1px dashed #91a8a4;padding-top:8px}@media print{body{background:#fff}.sheet{margin:0;box-shadow:none;width:auto;min-height:auto;padding:0}.no-print{display:none!important}}`}
  }

  function shell(title,reference,status,body,image){
    const logo=site.logo_url?`<img src="${esc(site.logo_url)}" alt="شعار الجمعية">`:'';
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${baseStyles()}</style></head><body><main class="sheet"><header class="doc-head"><div class="brand">${logo}<div><strong>جمعية نور الأمل</strong><small>Association Nour Al Amal</small></div></div><div class="doc-kind"><span>وثيقة داخلية رسمية</span><b>بطاقة تقنية</b></div></header><section class="title-box"><span class="eyebrow">البطاقة التقنية</span><h1>${esc(title)}</h1><p>المرجع: ${esc(reference||'غير محدد')} · الحالة: ${esc(statusLabels[status]||status||'—')}</p></section>${image?`<img class="hero-image" src="${esc(image)}" alt="${esc(title)}">`:''}${body}<div class="signature"><div>المسؤول عن البطاقة</div><div>تأشيرة الجمعية</div></div><footer class="footer"><span>${esc(site.address||'جمعية نور الأمل')}</span><span>${esc([site.phone,site.email].filter(Boolean).join(' · '))}</span></footer></main></body></html>`;
  }

  async function fetchProgram(id){const {data,error}=await client.from('technical_program_cards').select('*').eq('id',id).single();if(error)throw error;return data}
  async function fetchActivity(id){const {data,error}=await client.from('technical_activity_cards').select('*').eq('id',id).single();if(error)throw error;return data}
  async function programName(id){if(!id)return '';const {data}=await client.from('programs').select('title').eq('id',id).maybeSingle();return data?.title||''}

  async function programHtml(id){const c=await fetchProgram(id),linked=await programName(c.program_id);let body=`<div class="info-grid">${pair('البرنامج المرتبط',linked||'غير مرتبط')}${pair('الفئة المستهدفة',c.target_group)}${pair('مدة البرنامج',c.duration_text)}${pair('المجال الترابي',c.territory)}${pair('المسؤول',c.manager)}${pair('الفترة',`${fmtDate(c.start_date)} — ${fmtDate(c.end_date)}`)}</div>`;body+=section('السياق والخلفية',c.context)+section('الهدف العام',c.general_objective)+section('الأهداف الخاصة',c.specific_objectives)+section('الأنشطة الرئيسية',c.main_activities)+section('الموارد البشرية',c.human_resources)+section('الشركاء',c.partners)+section('النتائج المنتظرة',c.expected_results)+section('مؤشرات التتبع والنجاح',c.indicators);if(Number(c.estimated_budget)>0)body+=`<div class="budget-box"><span>الميزانية التقديرية</span><b>${esc(money(c.estimated_budget))}</b></div>`;body+=section('ملاحظات',c.notes);return {title:`البطاقة التقنية للبرنامج: ${c.title}`,filename:`بطاقة-برنامج-${c.reference||c.id}`,html:shell(`البطاقة التقنية للبرنامج: ${c.title}`,c.reference,c.status,body,c.image_url)}}

  async function activityHtml(id){const c=await fetchActivity(id),linked=await programName(c.program_id);let body=`<div class="info-grid">${pair('البرنامج',linked||'نشاط عام')}${pair('نوع النشاط',c.category)}${pair('التاريخ',`${fmtDate(c.activity_date)}${c.end_date?' — '+fmtDate(c.end_date):''}`)}${pair('المكان',c.location)}${pair('المدة',c.duration_hours?`${c.duration_hours} ساعة`:'—')}${pair('المشاركون المتوقعون',String(c.expected_participants||0))}${pair('الفئة المستهدفة',c.target_group)}${pair('المؤطرون',c.facilitators)}${pair('الشركاء',c.partners)}</div>`;body+=section('أهداف النشاط',c.objectives)+section('المحتوى',c.content)+section('المنهجية',c.methodology)+section('الوسائل والتجهيزات',c.equipment)+section('البرنامج الزمني',c.schedule)+section('النتائج المنتظرة',c.expected_results)+section('مؤشرات النجاح',c.success_indicators);if(Number(c.estimated_budget)>0)body+=`<div class="budget-box"><span>الميزانية التقديرية للنشاط</span><b>${esc(money(c.estimated_budget))}</b></div>`;body+=section('ملاحظات',c.notes);return {title:`البطاقة التقنية للنشاط: ${c.title}`,filename:`بطاقة-نشاط-${c.reference||c.id}`,html:shell(`البطاقة التقنية للنشاط: ${c.title}`,c.reference,c.status,body,null)}}

  function openPreview(doc,print=false){const w=window.open('','_blank');if(!w){alert('تعذر فتح نافذة المعاينة. اسمح بالنوافذ المنبثقة ثم حاول مجدداً.');return}w.document.open();w.document.write(doc.html+(print?`<script>window.onload=()=>setTimeout(()=>window.print(),350)<\/script>`:''));w.document.close()}
  function word(doc){const blob=new Blob(['\ufeff',doc.html],{type:'application/msword;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${doc.filename}.doc`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}

  async function handleClick(e){
    const b=e.target.closest('[data-tcp-preview],[data-tcp-word],[data-tcp-pdf],[data-tca-preview],[data-tca-word],[data-tca-pdf]');if(!b)return;
    e.preventDefault();
    try{
      let doc;if(b.dataset.tcpPreview||b.dataset.tcpWord||b.dataset.tcpPdf)doc=await programHtml(b.dataset.tcpPreview||b.dataset.tcpWord||b.dataset.tcpPdf);else doc=await activityHtml(b.dataset.tcaPreview||b.dataset.tcaWord||b.dataset.tcaPdf);
      if(b.dataset.tcpWord||b.dataset.tcaWord)word(doc);else openPreview(doc,!!(b.dataset.tcpPdf||b.dataset.tcaPdf));
    }catch(err){alert('تعذر إنشاء البطاقة الرسمية: '+(err.message||'خطأ'))}
  }

  wait();
})();