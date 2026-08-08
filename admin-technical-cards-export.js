(function(){
  if(window.__technicalCardsExportV2)return;
  window.__technicalCardsExportV2=true;

  let tries=0,site={};
  const esc=window.escapeHtml||((v='')=>String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])));
  const money=v=>new Intl.NumberFormat('ar-MA',{style:'currency',currency:'MAD',maximumFractionDigits:2}).format(Number(v)||0);
  const statusLabels={draft:'مسودة',approved:'معتمدة',archived:'مؤرشفة'};
  const fmtDate=v=>v?new Date(v+'T12:00:00').toLocaleDateString('ar-MA'):'—';
  const absUrl=v=>{try{return v?new URL(v,window.location.href).href:''}catch{return v||''}};

  async function boot(){
    const root=document.getElementById('technicalCardsPanel');
    if(!root){if(tries++<150)setTimeout(boot,100);return}
    await loadSite();
    installStyles();
    ensureButtons(root);
    const observer=new MutationObserver(()=>ensureButtons(root));
    observer.observe(root,{childList:true,subtree:true});
    root.addEventListener('click',handleClick);
  }

  async function loadSite(){
    try{
      const {data}=await client.from('site_settings').select('key,value').in('key',['logo_url','address','email','phone']);
      site=Object.fromEntries((data||[]).map(x=>[x.key,x.value]));
    }catch(_){site={}}
  }

  function makeButton(kind,id,action,label,cls='secondary'){
    const b=document.createElement('button');
    b.type='button';b.className=`${cls} tc-export-btn tc-export-${action}`;
    b.dataset[kind+action[0].toUpperCase()+action.slice(1)]=String(id);
    b.textContent=label;
    return b;
  }

  function ensureSet(actions,kind,id){
    if(!id)return;
    let wrap=actions.querySelector(`.tc-export-actions[data-export-kind="${kind}"]`);
    if(!wrap){wrap=document.createElement('div');wrap.className='tc-export-actions';wrap.dataset.exportKind=kind;actions.appendChild(wrap)}
    const prefix=kind==='tcp'?'tcp':'tca';
    const defs=[
      ['preview','👁 معاينة','secondary'],
      ['word','Word','secondary'],
      ['pdf','PDF','']
    ];
    defs.forEach(([action,label,cls])=>{
      if(actions.querySelector(`[data-${prefix}-${action}]`))return;
      const b=document.createElement('button');b.type='button';b.className=`${cls} tc-export-btn tc-export-${action}`.trim();b.setAttribute(`data-${prefix}-${action}`,id);b.textContent=label;wrap.appendChild(b);
    });
  }

  function ensureButtons(root){
    root.querySelectorAll('#tcProgramList .tc-card-actions').forEach(actions=>{
      const id=actions.querySelector('[data-tcp-edit]')?.dataset.tcpEdit;
      ensureSet(actions,'tcp',id);
    });
    root.querySelectorAll('#tcActivityList .tc-card-actions').forEach(actions=>{
      const id=actions.querySelector('[data-tca-edit]')?.dataset.tcaEdit;
      ensureSet(actions,'tca',id);
    });
  }

  function installStyles(){
    if(document.getElementById('tcExportStyleV2'))return;
    const s=document.createElement('style');s.id='tcExportStyleV2';s.textContent=`
      #technicalCardsPanel .tc-hero{border:1px solid #cfe4e0;background:linear-gradient(135deg,#f7fcfb,#eef7f5);border-radius:22px}
      #technicalCardsPanel .tc-stat{box-shadow:0 8px 22px rgba(8,47,44,.05)}
      #technicalCardsPanel .tc-view .admin-grid{align-items:start;gap:18px}
      #technicalCardsPanel .list-panel .post-item{border:1px solid #d7e7e4;border-radius:17px;padding:15px;background:#fff;box-shadow:0 5px 18px rgba(8,47,44,.04);transition:transform .15s ease,box-shadow .15s ease}
      #technicalCardsPanel .list-panel .post-item:hover{transform:translateY(-1px);box-shadow:0 9px 24px rgba(8,47,44,.07)}
      #technicalCardsPanel .tc-card-meta{gap:6px;margin-top:10px}
      #technicalCardsPanel .tc-card-meta span{background:#f1f7f6;border:1px solid #e0ecea;border-radius:999px;padding:5px 9px;color:#4c6864}
      #technicalCardsPanel .tc-summary{background:#fafcfc;border-right:3px solid #bddad5;border-radius:10px;padding:9px 11px;margin-top:10px}
      #technicalCardsPanel .tc-card-actions{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:13px;padding-top:11px;border-top:1px solid #e1ecea}
      #technicalCardsPanel .tc-card-actions>button{min-width:66px}
      #technicalCardsPanel .tc-export-actions{display:flex!important;gap:7px;flex-wrap:wrap;width:100%;padding-top:9px;margin-top:3px;border-top:1px dashed #cfdfdc}
      #technicalCardsPanel .tc-export-btn{display:inline-flex!important;align-items:center;justify-content:center;min-width:82px;padding:8px 12px!important;font-size:11px!important;font-weight:800!important;visibility:visible!important;opacity:1!important}
      #technicalCardsPanel .tc-export-pdf{background:#0f766e!important;color:#fff!important;border-color:#0f766e!important}
      #technicalCardsPanel .tc-export-word{background:#eef6f5!important;color:#0a5e58!important;border:1px solid #c8dfdc!important}
      #technicalCardsPanel .tc-subtabs{background:#f4f8f7;border:1px solid #dce8e6;border-radius:15px;padding:6px}
      #technicalCardsPanel .tc-subtabs button{flex:1;min-width:150px}
      @media(max-width:980px){#technicalCardsPanel .tc-view .admin-grid{grid-template-columns:1fr}}
      @media(max-width:650px){
        #technicalCardsPanel .tc-card-actions>button{flex:1 1 calc(50% - 7px)}
        #technicalCardsPanel .tc-export-actions{display:grid!important;grid-template-columns:repeat(3,1fr);width:100%}
        #technicalCardsPanel .tc-export-btn{min-width:0;width:100%;padding:9px 5px!important}
        #technicalCardsPanel .tc-card-meta span{font-size:9px}
      }
    `;document.head.appendChild(s);
  }

  function section(title,value){
    if(!String(value||'').trim())return '';
    return `<section class="card-section"><h2>${esc(title)}</h2><div class="text-block">${esc(value).replace(/\n/g,'<br>')}</div></section>`;
  }
  function pair(label,value){return `<div class="info-item"><span>${esc(label)}</span><b>${esc(value||'—')}</b></div>`}

  function docStyles(){return `
    @page{size:A4;margin:13mm}*{box-sizing:border-box}body{margin:0;background:#eef3f2;font-family:Arial,Tahoma,sans-serif;color:#193c38;direction:rtl;line-height:1.75}.sheet{width:210mm;min-height:297mm;margin:18px auto;background:#fff;padding:15mm;box-shadow:0 8px 30px rgba(0,0,0,.08)}.doc-head{display:flex;justify-content:space-between;align-items:center;gap:18px;border-bottom:3px solid #0f766e;padding-bottom:14px;margin-bottom:18px}.brand{display:flex;align-items:center;gap:12px}.brand img{width:72px;height:58px;object-fit:contain}.brand strong{display:block;font-size:18px}.brand small{color:#637c78}.doc-kind{text-align:left}.doc-kind span{font-size:11px;color:#718682}.doc-kind b{display:block;font-size:15px;color:#0f766e}.title-box{text-align:center;padding:18px 10px 12px}.title-box .eyebrow{display:inline-block;background:#e9f4f2;color:#0f766e;border-radius:999px;padding:5px 12px;font-size:11px;font-weight:700}.title-box h1{font-size:25px;line-height:1.45;margin:12px 0 5px;color:#082f2c}.title-box p{margin:0;color:#718682;font-size:11px}.info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:18px 0}.info-item{border:1px solid #dce8e6;background:#f8fbfa;border-radius:10px;padding:9px 11px}.info-item span{display:block;color:#718682;font-size:9px}.info-item b{font-size:11px;color:#173e39}.hero-image{width:100%;max-height:68mm;object-fit:cover;border-radius:13px;margin:4px 0 16px}.card-section{margin:14px 0;break-inside:avoid}.card-section h2{font-size:15px;color:#0f766e;margin:0 0 7px;padding-bottom:5px;border-bottom:1px solid #dce8e6}.text-block{font-size:12px}.budget-box{background:#082f2c;color:#fff;border-radius:12px;padding:12px 16px;margin:16px 0;display:flex;justify-content:space-between;align-items:center}.budget-box span{font-size:11px}.budget-box b{font-size:18px}.signature{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:30px;text-align:center;font-size:11px}.signature div{border-top:1px dashed #91a8a4;padding-top:8px}.footer{margin-top:22px;padding-top:9px;border-top:1px solid #dce8e6;display:flex;justify-content:space-between;gap:12px;color:#718682;font-size:9px}@media(max-width:760px){.sheet{width:100%;margin:0;padding:18px}.info-grid{grid-template-columns:1fr 1fr}}@media print{body{background:#fff}.sheet{margin:0;box-shadow:none;width:auto;min-height:auto;padding:0}}
  `}

  function shell(title,reference,status,body,image){
    const logo=site.logo_url?`<img src="${esc(absUrl(site.logo_url))}" alt="شعار الجمعية">`:'';
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${docStyles()}</style></head><body><main class="sheet"><header class="doc-head"><div class="brand">${logo}<div><strong>جمعية نور الأمل</strong><small>Association Nour Al Amal</small></div></div><div class="doc-kind"><span>وثيقة داخلية رسمية</span><b>بطاقة تقنية</b></div></header><section class="title-box"><span class="eyebrow">البطاقة التقنية</span><h1>${esc(title)}</h1><p>المرجع: ${esc(reference||'غير محدد')} · الحالة: ${esc(statusLabels[status]||status||'—')}</p></section>${image?`<img class="hero-image" src="${esc(absUrl(image))}" alt="${esc(title)}">`:''}${body}<div class="signature"><div>المسؤول عن البطاقة</div><div>تأشيرة الجمعية</div></div><footer class="footer"><span>${esc(site.address||'جمعية نور الأمل')}</span><span>${esc([site.phone,site.email].filter(Boolean).join(' · '))}</span></footer></main></body></html>`;
  }

  async function fetchOne(table,id){const {data,error}=await client.from(table).select('*').eq('id',id).single();if(error)throw error;return data}
  async function programName(id){if(!id)return '';const {data}=await client.from('programs').select('title').eq('id',id).maybeSingle();return data?.title||''}
  async function programCardName(id){if(!id)return '';const {data}=await client.from('technical_program_cards').select('title,reference').eq('id',id).maybeSingle();return data?`${data.title}${data.reference?' · '+data.reference:''}`:''}

  async function programHtml(id){
    const c=await fetchOne('technical_program_cards',id),linked=await programName(c.program_id);
    let body=`<div class="info-grid">${pair('البرنامج المرتبط',linked||'غير مرتبط')}${pair('الفئة المستهدفة',c.target_group)}${pair('مدة البرنامج',c.duration_text)}${pair('المجال الترابي',c.territory)}${pair('المسؤول',c.manager)}${pair('الفترة',`${fmtDate(c.start_date)} — ${fmtDate(c.end_date)}`)}</div>`;
    body+=section('السياق والخلفية',c.context)+section('الهدف العام',c.general_objective)+section('الأهداف الخاصة',c.specific_objectives)+section('الأنشطة الرئيسية',c.main_activities)+section('الموارد البشرية والتأطير',c.human_resources)+section('الشركاء',c.partners)+section('النتائج المنتظرة',c.expected_results)+section('مؤشرات التتبع والقياس',c.indicators);
    if(Number(c.estimated_budget)>0)body+=`<div class="budget-box"><span>الميزانية التقديرية</span><b>${esc(money(c.estimated_budget))}</b></div>`;
    body+=section('ملاحظات إضافية',c.notes);
    return {filename:`بطاقة-برنامج-${c.reference||c.id}`,html:shell(`البطاقة التقنية للبرنامج: ${c.title}`,c.reference,c.status,body,c.image_url)};
  }

  async function activityHtml(id){
    const c=await fetchOne('technical_activity_cards',id),linked=await programName(c.program_id),linkedCard=await programCardName(c.program_card_id);
    let body=`<div class="info-grid">${pair('البرنامج',linked||'نشاط عام للجمعية')}${pair('بطاقة البرنامج',linkedCard||'—')}${pair('نوع النشاط',c.category)}${pair('التاريخ',`${fmtDate(c.activity_date)}${c.end_date?' — '+fmtDate(c.end_date):''}`)}${pair('المكان',c.location)}${pair('المدة',c.duration_hours?`${c.duration_hours} ساعة`:'—')}${pair('المشاركون المتوقعون',String(c.expected_participants||0))}${pair('الفئة المستهدفة',c.target_group)}${pair('المؤطرون / المتدخلون',c.facilitators)}</div>`;
    body+=section('أهداف النشاط',c.objectives)+section('محتوى النشاط ومحاوره',c.content)+section('المنهجية وطريقة التنشيط',c.methodology)+section('الوسائل والتجهيزات المطلوبة',c.equipment)+section('الشركاء والمتعاونون',c.partners)+section('البرنامج الزمني',c.schedule)+section('النتائج المنتظرة',c.expected_results)+section('مؤشرات النجاح',c.success_indicators);
    if(Number(c.estimated_budget)>0)body+=`<div class="budget-box"><span>الميزانية التقديرية للنشاط</span><b>${esc(money(c.estimated_budget))}</b></div>`;
    body+=section('ملاحظات إضافية',c.notes);
    return {filename:`بطاقة-نشاط-${c.reference||c.id}`,html:shell(`البطاقة التقنية للنشاط: ${c.title}`,c.reference,c.status,body,null)};
  }

  function openPreview(doc,print=false){
    const w=window.open('','_blank');
    if(!w){alert('تعذر فتح نافذة المعاينة. اسمح بالنوافذ المنبثقة ثم حاول مجدداً.');return}
    w.document.open();w.document.write(doc.html+(print?`<script>window.onload=()=>setTimeout(()=>window.print(),500)<\/script>`:''));w.document.close();
  }
  function downloadWord(doc){
    const blob=new Blob(['\ufeff',doc.html],{type:'application/msword;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`${doc.filename}.doc`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
  }

  async function handleClick(e){
    const b=e.target.closest('[data-tcp-preview],[data-tcp-word],[data-tcp-pdf],[data-tca-preview],[data-tca-word],[data-tca-pdf]');if(!b)return;
    e.preventDefault();e.stopPropagation();
    if(b.disabled)return;const old=b.textContent;b.disabled=true;b.textContent='جارٍ...';
    try{
      const programId=b.dataset.tcpPreview||b.dataset.tcpWord||b.dataset.tcpPdf;
      const activityId=b.dataset.tcaPreview||b.dataset.tcaWord||b.dataset.tcaPdf;
      const doc=programId?await programHtml(programId):await activityHtml(activityId);
      if(b.dataset.tcpWord||b.dataset.tcaWord)downloadWord(doc);else openPreview(doc,!!(b.dataset.tcpPdf||b.dataset.tcaPdf));
    }catch(err){alert('تعذر إنشاء البطاقة الرسمية: '+(err.message||'خطأ غير معروف'))}
    finally{b.disabled=false;b.textContent=old}
  }

  boot();
})();