(function(){
  let attempts=0;
  function waitForSuite(){
    const base=document.getElementById('reportExtendedSuite');
    if(!base){if(attempts++<80)setTimeout(waitForSuite,100);return}
    if(document.getElementById('officialReportSuite'))return;
    initOfficial(base);
  }

  function initOfficial(base){
    const esc=window.escapeHtml||((v='')=>String(v).replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])));
    const monthNames=['يناير','فبراير','مارس','أبريل','ماي','يونيو','يوليوز','غشت','شتنبر','أكتوبر','نونبر','دجنبر'];
    let lastBookHtml='';
    let lastFilename='report';

    const box=document.createElement('section');
    box.id='officialReportSuite';
    box.className='panel official-report-suite';
    box.innerHTML=`
      <div class="official-head">
        <div><span class="badge">النسخة الرسمية</span><h2>إخراج التقرير الأدبي</h2><p>غلاف وفهرس وترقيم صفحات واختيار صور، مع تصدير نسخة Word ونسخة جاهزة للحفظ PDF.</p></div>
        <button id="officialBuildBtn" type="button">إنشاء النسخة الرسمية</button>
      </div>
      <div class="official-settings-grid">
        <label>عنوان الغلاف<input id="officialCoverTitle" maxlength="220" placeholder="التقرير الأدبي الشهري / السنوي"></label>
        <label>العنوان الفرعي<input id="officialCoverSubtitle" maxlength="220" placeholder="حصيلة أنشطة جمعية نور الأمل"></label>
        <label>إعداد التقرير<input id="officialPreparedBy" maxlength="180" placeholder="جمعية نور الأمل"></label>
        <label>المكان<input id="officialReportPlace" maxlength="160" placeholder="المغرب"></label>
      </div>
      <div class="official-image-section">
        <div class="list-head"><div><h3>اختيار صور التقرير</h3><p>الاختيار خاص بالفترة الحالية ولا يؤثر على تقارير الفترات الأخرى.</p></div><button id="officialLoadImages" type="button" class="secondary">تحميل صور الفترة</button></div>
        <div id="officialImagePicker" class="official-image-picker"><div class="empty">حمّل صور الفترة ثم اختر ما سيظهر في التقرير.</div></div>
      </div>
      <div class="actions official-actions">
        <button id="officialSaveSettings" type="button" class="secondary">حفظ إعدادات الغلاف</button>
        <button id="officialWordBtn" type="button" class="secondary">تصدير Word (.doc)</button>
        <button id="officialPdfBtn" type="button">تصدير PDF</button>
        <span id="officialReportMsg" class="msg"></span>
      </div>
      <div id="officialReportPreview" class="official-report-preview"><div class="empty">أنشئ النسخة الرسمية لمعاينتها هنا.</div></div>`;
    base.appendChild(box);

    const style=document.createElement('style');
    style.textContent=`
      .official-report-suite{margin-top:22px}.official-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.official-settings-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:14px 0}.official-image-section{margin-top:18px;padding-top:18px;border-top:1px solid #e2ecea}.official-image-picker{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}.official-image-card{position:relative;border:2px solid transparent;border-radius:14px;overflow:hidden;background:#f7faf9}.official-image-card.selected{border-color:#0f766e}.official-image-card img{width:100%;height:135px;object-fit:cover;display:block}.official-image-card .official-image-tools{padding:8px;display:grid;gap:6px;font-size:11px}.official-image-card label{margin:0;display:flex;gap:6px;align-items:center}.official-image-card input{width:auto;margin:0}.official-cover-badge{position:absolute;top:8px;right:8px;background:#082f2c;color:white;border-radius:999px;padding:4px 8px;font-size:9px;font-weight:800}.official-actions{justify-content:flex-start;flex-wrap:wrap;margin:18px 0}.official-report-preview{display:grid;gap:18px;background:#dfe9e7;padding:22px;border-radius:20px;overflow:auto}.official-sheet{position:relative;width:210mm;min-height:297mm;margin:auto;background:white;padding:20mm 18mm 18mm;box-shadow:0 8px 24px rgba(0,0,0,.12);color:#203936;overflow:hidden}.official-sheet h1,.official-sheet h2,.official-sheet h3{color:#103f3a}.official-sheet h1{font-size:28px}.official-sheet h2{font-size:20px;border-bottom:2px solid #d8e8e5;padding-bottom:7px;margin:0 0 16px}.official-sheet p,.official-sheet li{line-height:1.9;font-size:13px}.official-page-footer{position:absolute;bottom:8mm;left:18mm;right:18mm;display:flex;justify-content:space-between;border-top:1px solid #dce8e6;padding-top:5px;font-size:9px;color:#6d7f7c}.official-cover{padding:0;display:flex;flex-direction:column}.official-cover-top{padding:23mm 20mm 10mm;text-align:center}.official-cover-logo{max-width:180px;max-height:105px;object-fit:contain;margin-bottom:18px}.official-cover-title{font-size:34px!important;margin:8px 0}.official-cover-subtitle{font-size:17px;color:#4d6965}.official-cover-period{display:inline-block;margin-top:18px;background:#e6f3f1;color:#0f766e;padding:8px 18px;border-radius:999px;font-weight:800}.official-cover-image{width:100%;height:118mm;object-fit:cover;margin-top:auto}.official-cover-bottom{background:#082f2c;color:#fff;padding:10mm 20mm;display:flex;justify-content:space-between;gap:15px;font-size:11px}.official-toc{list-style:none;padding:0;margin:10px 0}.official-toc li{display:flex;align-items:center;gap:8px;border-bottom:1px dotted #b9ceca;padding:7px 0}.official-toc li span:first-child{flex:1}.official-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0}.official-kpi{background:#f1f7f6;border-radius:16px;padding:16px;text-align:center}.official-kpi b{display:block;color:#0f766e;font-size:27px}.official-kpi span{font-size:11px}.official-category-row{display:grid;grid-template-columns:120px 1fr 35px;align-items:center;gap:8px;margin:8px 0;font-size:12px}.official-category-track{height:11px;border-radius:999px;background:#e6efed;overflow:hidden}.official-category-fill{height:100%;background:#0f766e}.official-activity-card{border:1px solid #dfeae8;border-radius:15px;padding:14px;margin:12px 0;break-inside:avoid}.official-activity-card h3{margin:0 0 6px}.official-meta{font-size:10px;color:#6f817e}.official-story-card{border-right:4px solid #0f766e;background:#f5f9f8;border-radius:14px;padding:15px;margin:12px 0;break-inside:avoid}.official-story-card img{width:105px;height:85px;object-fit:cover;border-radius:10px;float:left;margin:0 0 8px 12px}.official-gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.official-gallery figure{margin:0}.official-gallery img{width:100%;height:92mm;object-fit:cover;border-radius:12px}.official-gallery figcaption{font-size:9px;color:#6e817e;padding-top:4px}.official-brand-line{height:5px;background:#0f766e;margin:-20mm -18mm 12mm}.official-section-number{font-size:11px;color:#0f766e;font-weight:800}.official-summary-list{display:grid;gap:9px}.official-summary-list div{padding:10px;border-radius:12px;background:#f7faf9}.official-print-only{display:none}@media(max-width:900px){.official-head{flex-direction:column}.official-settings-grid{grid-template-columns:1fr}.official-image-picker{grid-template-columns:repeat(2,1fr)}.official-report-preview{padding:8px}.official-sheet{transform:scale(.72);transform-origin:top right;margin-bottom:-78mm}.official-kpis{grid-template-columns:repeat(2,1fr)}}`;
    document.head.appendChild(style);

    function reportType(){return document.getElementById('reportBuildType')?.value||'monthly'}
    function periodKey(){return reportType()==='annual'?String(document.getElementById('reportBuildYear')?.value||''):String(document.getElementById('reportBuildMonth')?.value||'')}
    function periodInfo(){
      const type=reportType(),key=periodKey();
      if(type==='annual')return {type,key,from:key+'-01-01',to:key+'-12-31',label:'سنة '+key};
      const [y,m]=key.split('-').map(Number),last=new Date(y,m,0).getDate();
      return {type,key,from:key+'-01',to:key+'-'+String(last).padStart(2,'0'),label:(monthNames[m-1]||'')+' '+y};
    }
    function chunks(arr,size){const out=[];for(let i=0;i<arr.length;i+=size)out.push(arr.slice(i,i+size));return out}
    function sum(rows,key){return rows.reduce((a,r)=>a+(Number(r[key])||0),0)}
    function unique(arr){return [...new Set(arr.filter(Boolean))]}
    function splitPartners(v){return String(v||'').split(/[،,;\n]+/).map(x=>x.trim()).filter(Boolean)}
    function slugName(v){return String(v||'report').replace(/[^\p{L}\p{N}\-_]+/gu,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'report'}

    async function loadOfficialSettings(){
      const p=periodInfo();if(!p.key)return;
      const {data}=await client.from('report_period_notes').select('*').eq('period_type',p.type).eq('period_key',p.key).maybeSingle();
      document.getElementById('officialCoverTitle').value=data?.cover_title|| (p.type==='annual'?'التقرير الأدبي السنوي':'التقرير الأدبي الشهري');
      document.getElementById('officialCoverSubtitle').value=data?.cover_subtitle||'حصيلة أنشطة جمعية نور الأمل';
      document.getElementById('officialPreparedBy').value=data?.prepared_by||'جمعية نور الأمل';
      document.getElementById('officialReportPlace').value=data?.report_place||'المغرب';
    }

    async function saveOfficialSettings(){
      const p=periodInfo(),msg=document.getElementById('officialReportMsg');if(!p.key){msg.textContent='حدد الفترة أولاً.';return false}
      const row={period_type:p.type,period_key:p.key,cover_title:document.getElementById('officialCoverTitle').value.trim(),cover_subtitle:document.getElementById('officialCoverSubtitle').value.trim(),prepared_by:document.getElementById('officialPreparedBy').value.trim(),report_place:document.getElementById('officialReportPlace').value.trim()};
      const {error}=await client.from('report_period_notes').upsert(row,{onConflict:'period_type,period_key'});msg.textContent=error?'تعذر حفظ إعدادات الغلاف.':'تم حفظ إعدادات الغلاف.';return !error
    }

    async function fetchPeriodImages(){
      const p=periodInfo();if(!p.key)return [];
      const {data:acts,error}=await client.from('report_activities').select('id,title,start_date').gte('start_date',p.from).lte('start_date',p.to).order('start_date',{ascending:true});
      if(error||!acts?.length)return [];
      const ids=acts.map(a=>a.id),titleMap=new Map(acts.map(a=>[String(a.id),a.title]));
      const [{data:imgs},{data:sel}]=await Promise.all([
        client.from('report_activity_images').select('id,activity_id,image_url,caption,sort_order').in('activity_id',ids).order('sort_order',{ascending:true}),
        client.from('report_period_images').select('*').eq('period_type',p.type).eq('period_key',p.key)
      ]);
      const selection=new Map((sel||[]).map(x=>[String(x.image_id),x]));
      return (imgs||[]).map(img=>({ ...img, activity_title:titleMap.get(String(img.activity_id))||'', included:selection.has(String(img.id))?selection.get(String(img.id)).included:true, is_cover:selection.get(String(img.id))?.is_cover||false }));
    }

    async function renderImagePicker(){
      const picker=document.getElementById('officialImagePicker');picker.innerHTML='<p>جارٍ تحميل الصور...</p>';
      const imgs=await fetchPeriodImages();
      if(!imgs.length){picker.innerHTML='<div class="empty">لا توجد صور لأنشطة هذه الفترة.</div>';return}
      picker.innerHTML=imgs.map(i=>`<article class="official-image-card ${i.included?'selected':''}" data-official-image-card="${i.id}">${i.is_cover?'<span class="official-cover-badge">صورة الغلاف</span>':''}<img src="${esc(i.image_url)}" alt="${esc(i.caption||i.activity_title)}"><div class="official-image-tools"><label><input type="checkbox" data-official-include="${i.id}" ${i.included?'checked':''}> إدراج في التقرير</label><label><input type="radio" name="officialCoverImage" data-official-cover="${i.id}" ${i.is_cover?'checked':''}> صورة الغلاف</label><small>${esc(i.activity_title)}</small></div></article>`).join('');
    }

    async function saveImageChoice(imageId,changes){
      const p=periodInfo();if(!p.key)return;
      if(changes.is_cover){await client.from('report_period_images').update({is_cover:false}).eq('period_type',p.type).eq('period_key',p.key)}
      const row={period_type:p.type,period_key:p.key,image_id:Number(imageId),included:changes.included!==undefined?changes.included:true,is_cover:!!changes.is_cover};
      if(changes.included===undefined){const {data}=await client.from('report_period_images').select('included').eq('period_type',p.type).eq('period_key',p.key).eq('image_id',Number(imageId)).maybeSingle();row.included=data?.included??true}
      await client.from('report_period_images').upsert(row,{onConflict:'period_type,period_key,image_id'});
    }

    document.getElementById('officialImagePicker').addEventListener('change',async e=>{
      const inc=e.target.dataset.officialInclude,cover=e.target.dataset.officialCover;
      if(inc){await saveImageChoice(inc,{included:e.target.checked});e.target.closest('.official-image-card')?.classList.toggle('selected',e.target.checked)}
      if(cover){await saveImageChoice(cover,{is_cover:true});await renderImagePicker()}
    });

    async function buildOfficialReport(){
      const p=periodInfo(),msg=document.getElementById('officialReportMsg'),preview=document.getElementById('officialReportPreview');
      if(!p.key){msg.textContent='حدد الفترة أولاً.';return}
      msg.textContent='جارٍ إعداد النسخة الرسمية...';preview.innerHTML='<p>جارٍ التجميع...</p>';
      await saveOfficialSettings();
      const [actRes,storyRes,noteRes,settingsRes,images]=await Promise.all([
        client.from('report_activities').select('*').gte('start_date',p.from).lte('start_date',p.to).order('start_date',{ascending:true}),
        client.from('report_success_stories').select('*').gte('story_date',p.from).lte('story_date',p.to).order('story_date',{ascending:true}),
        client.from('report_period_notes').select('*').eq('period_type',p.type).eq('period_key',p.key).maybeSingle(),
        client.from('site_settings').select('key,value').in('key',['logo_url','address','email','phone']),
        fetchPeriodImages()
      ]);
      if(actRes.error||storyRes.error){preview.innerHTML='<div class="empty">تعذر بناء التقرير.</div>';msg.textContent='حدث خطأ أثناء تحميل البيانات.';return}
      const acts=actRes.data||[],stories=(storyRes.data||[]).filter(s=>s.consent_status!=='internal'),notes=noteRes.data||{},settings=Object.fromEntries((settingsRes.data||[]).map(x=>[x.key,x.value]));
      const includedImages=images.filter(i=>i.included),coverImage=images.find(i=>i.is_cover)?.image_url||includedImages[0]?.image_url||'';
      const total=sum(acts,'beneficiaries_total'),female=sum(acts,'beneficiaries_female'),male=sum(acts,'beneficiaries_male'),hours=sum(acts,'activity_hours'),facilitators=sum(acts,'facilitators_count');
      const partners=unique(acts.flatMap(a=>splitPartners(a.partners))),locations=unique(acts.map(a=>a.location));
      const categories={};acts.forEach(a=>{const k=a.category||'عام';categories[k]=(categories[k]||0)+1});const catEntries=Object.entries(categories).sort((a,b)=>b[1]-a[1]),maxCat=Math.max(1,...catEntries.map(x=>x[1]));
      const activityPages=chunks(acts,3),storyPages=chunks(stories,2),galleryPages=chunks(includedImages,4);
      const coverTitle=notes.cover_title||document.getElementById('officialCoverTitle').value.trim()||(p.type==='annual'?'التقرير الأدبي السنوي':'التقرير الأدبي الشهري');
      const coverSubtitle=notes.cover_subtitle||document.getElementById('officialCoverSubtitle').value.trim()||'حصيلة أنشطة جمعية نور الأمل';
      const preparedBy=notes.prepared_by||document.getElementById('officialPreparedBy').value.trim()||'جمعية نور الأمل';
      const reportPlace=notes.report_place||document.getElementById('officialReportPlace').value.trim()||'المغرب';
      const intro=notes.intro||`يقدم هذا التقرير حصيلة أنشطة جمعية نور الأمل خلال ${p.label}، ويعرض أبرز المؤشرات والأنشطة والنتائج وقصص الأثر والشراكات الموثقة خلال الفترة.`;
      const challenges=notes.challenges||unique(acts.map(a=>a.challenges).filter(Boolean)).join('؛ ')||'لم يتم تسجيل تحديات خاصة ضمن البيانات الموثقة لهذه الفترة.';
      const recs=notes.recommendations||unique(acts.map(a=>a.recommendations).filter(Boolean)).join('؛ ')||'مواصلة تطوير التوثيق المنتظم، وتعزيز الشراكات، وتوسيع الاستفادة من الأنشطة ذات الأثر الإيجابي.';
      const conclusion=notes.conclusion||`تعكس حصيلة ${p.label} استمرار جمعية نور الأمل في تنويع تدخلاتها ومواكبة الفئات المستهدفة، مع اعتماد التوثيق والمؤشرات أساساً لتحسين التخطيط المستقبلي.`;
      let pageNo=1;
      const toc=[['تقديم ومؤشرات عامة',2],['توزيع الأنشطة حسب المجالات',3]];
      const activitiesStart=4;toc.push(['الأنشطة المنجزة',activitiesStart]);
      const storiesStart=activitiesStart+Math.max(1,activityPages.length);toc.push(['قصص النجاح والأثر',storiesStart]);
      const galleryStart=storiesStart+Math.max(1,storyPages.length);toc.push(['صور مختارة من الأنشطة',galleryStart]);
      const finalStart=galleryStart+Math.max(1,galleryPages.length);toc.push(['التحديات والتوصيات والخلاصة',finalStart]);
      const footer=n=>`<div class="official-page-footer"><span>جمعية نور الأمل · ${esc(p.label)}</span><b>${n}</b></div>`;
      const sheet=(content,n,cls='')=>`<section class="official-sheet ${cls}">${content}${n?footer(n):''}</section>`;
      let html='';
      html+=sheet(`<div class="official-cover-top">${settings.logo_url?`<img class="official-cover-logo" src="${esc(settings.logo_url)}" alt="شعار جمعية نور الأمل">`:''}<div class="official-section-number">جمعية نور الأمل</div><h1 class="official-cover-title">${esc(coverTitle)}</h1><p class="official-cover-subtitle">${esc(coverSubtitle)}</p><span class="official-cover-period">${esc(p.label)}</span></div>${coverImage?`<img class="official-cover-image" src="${esc(coverImage)}" alt="صورة الغلاف">`:'<div style="height:118mm;background:linear-gradient(135deg,#dcefeb,#f7fbfa)"></div>'}<div class="official-cover-bottom"><span>إعداد: ${esc(preparedBy)}</span><span>${esc(reportPlace)}</span></div>`,0,'official-cover');
      html+=sheet(`<div class="official-brand-line"></div><h1>الفهرس</h1><ul class="official-toc">${toc.map(([t,n])=>`<li><span>${esc(t)}</span><b>${n}</b></li>`).join('')}</ul>`,pageNo++);
      html+=sheet(`<div class="official-brand-line"></div><span class="official-section-number">القسم الأول</span><h2>تقديم ومؤشرات عامة</h2><p>${esc(intro)}</p><div class="official-kpis"><div class="official-kpi"><b>${acts.length}</b><span>عدد الأنشطة</span></div><div class="official-kpi"><b>${total}</b><span>المستفيدون/المشاركات</span></div><div class="official-kpi"><b>${female}</b><span>الإناث</span></div><div class="official-kpi"><b>${male}</b><span>الذكور</span></div><div class="official-kpi"><b>${hours}</b><span>ساعات الأنشطة</span></div><div class="official-kpi"><b>${facilitators}</b><span>مساهمات التأطير</span></div></div><div class="official-summary-list"><div><strong>الشركاء والجهات:</strong> ${partners.length?esc(partners.join('، ')):'غير مسجل'}</div><div><strong>أماكن التنفيذ:</strong> ${locations.length?esc(locations.join('، ')):'غير مسجل'}</div></div>`,pageNo++);
      html+=sheet(`<div class="official-brand-line"></div><span class="official-section-number">القسم الثاني</span><h2>توزيع الأنشطة حسب المجالات</h2>${catEntries.length?catEntries.map(([c,n])=>`<div class="official-category-row"><span>${esc(c)}</span><div class="official-category-track"><div class="official-category-fill" style="width:${Math.round(n/maxCat*100)}%"></div></div><b>${n}</b></div>`).join(''):'<p>لا توجد بيانات تصنيف للفترة.</p>'}${notes.highlights?`<h2 style="margin-top:24px">أبرز المنجزات</h2><p>${esc(notes.highlights)}</p>`:''}`,pageNo++);
      if(activityPages.length){activityPages.forEach((group,idx)=>{html+=sheet(`<div class="official-brand-line"></div><span class="official-section-number">القسم الثالث${activityPages.length>1?' · '+(idx+1):''}</span><h2>الأنشطة المنجزة</h2>${group.map(a=>`<article class="official-activity-card"><h3>${esc(a.title)}</h3><div class="official-meta">${esc(a.start_date||'')} · ${esc(a.category||'نشاط')} ${a.location?'· '+esc(a.location):''}</div><p>${esc(a.results||a.description||'')}</p><div class="official-meta">المستفيدون/المشاركات: ${Number(a.beneficiaries_total)||0} · الساعات: ${Number(a.activity_hours)||0}${a.partners?' · الشركاء: '+esc(a.partners):''}</div></article>`).join('')}`,pageNo++)})}else{html+=sheet(`<div class="official-brand-line"></div><h2>الأنشطة المنجزة</h2><p>لم يتم توثيق أنشطة خلال هذه الفترة.</p>`,pageNo++)}
      if(storyPages.length){storyPages.forEach((group,idx)=>{html+=sheet(`<div class="official-brand-line"></div><span class="official-section-number">القسم الرابع${storyPages.length>1?' · '+(idx+1):''}</span><h2>قصص النجاح والأثر</h2>${group.map(s=>`<article class="official-story-card">${s.image_url&&s.consent_status==='consented'?`<img src="${esc(s.image_url)}" alt="${esc(s.title)}">`:''}<h3>${esc(s.title)}</h3><p>${esc(s.change_observed||s.summary||'')}</p>${s.quote?`<blockquote>«${esc(s.quote)}»</blockquote>`:''}<div class="official-meta">${s.consent_status==='consented'&&s.beneficiary_label?esc(s.beneficiary_label):'تم الحفاظ على هوية المستفيد'}${s.age_group?' · '+esc(s.age_group):''}</div><div style="clear:both"></div></article>`).join('')}`,pageNo++)})}else{html+=sheet(`<div class="official-brand-line"></div><h2>قصص النجاح والأثر</h2><p>لا توجد قصص أثر قابلة للإدراج في هذه الفترة.</p>`,pageNo++)}
      if(galleryPages.length){galleryPages.forEach((group,idx)=>{html+=sheet(`<div class="official-brand-line"></div><span class="official-section-number">القسم الخامس${galleryPages.length>1?' · '+(idx+1):''}</span><h2>صور مختارة من الأنشطة</h2><div class="official-gallery">${group.map(i=>`<figure><img src="${esc(i.image_url)}" alt="${esc(i.caption||i.activity_title)}"><figcaption>${esc(i.caption||i.activity_title)}</figcaption></figure>`).join('')}</div>`,pageNo++)})}else{html+=sheet(`<div class="official-brand-line"></div><h2>صور مختارة من الأنشطة</h2><p>لم يتم اختيار صور لهذه الفترة.</p>`,pageNo++)}
      html+=sheet(`<div class="official-brand-line"></div><span class="official-section-number">القسم السادس</span><h2>التحديات والإكراهات</h2><p>${esc(challenges)}</p><h2>التوصيات والآفاق</h2><p>${esc(recs)}</p><h2>الخلاصة</h2><p>${esc(conclusion)}</p><div style="margin-top:25mm;text-align:center">${settings.logo_url?`<img src="${esc(settings.logo_url)}" alt="الشعار" style="max-width:120px;max-height:70px">`:''}<p class="official-meta">${esc(settings.address||'')} ${settings.email?'· '+esc(settings.email):''} ${settings.phone?'· '+esc(settings.phone):''}</p></div>`,pageNo++);
      preview.innerHTML=html;lastBookHtml=html;lastFilename=slugName(`${coverTitle}-${p.label}`);msg.textContent='تم إنشاء النسخة الرسمية.';
    }

    function officialDocumentHtml(content){return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(lastFilename)}</title><style>@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#fff;font-family:Arial,Tahoma,sans-serif;color:#203936}.official-sheet{position:relative;width:210mm;min-height:297mm;padding:20mm 18mm 18mm;page-break-after:always;overflow:hidden}.official-cover{padding:0;display:flex;flex-direction:column}.official-cover-top{padding:23mm 20mm 10mm;text-align:center}.official-cover-logo{max-width:180px;max-height:105px;object-fit:contain;margin-bottom:18px}.official-cover-title{font-size:34px;margin:8px 0;color:#103f3a}.official-cover-subtitle{font-size:17px;color:#4d6965}.official-cover-period{display:inline-block;margin-top:18px;background:#e6f3f1;color:#0f766e;padding:8px 18px;border-radius:999px;font-weight:bold}.official-cover-image{width:100%;height:118mm;object-fit:cover;margin-top:auto}.official-cover-bottom{background:#082f2c;color:#fff;padding:10mm 20mm;display:flex;justify-content:space-between}.official-page-footer{position:absolute;bottom:8mm;left:18mm;right:18mm;display:flex;justify-content:space-between;border-top:1px solid #dce8e6;padding-top:5px;font-size:9px;color:#6d7f7c}.official-brand-line{height:5px;background:#0f766e;margin:-20mm -18mm 12mm}.official-sheet h1{font-size:28px;color:#103f3a}.official-sheet h2{font-size:20px;color:#103f3a;border-bottom:2px solid #d8e8e5;padding-bottom:7px;margin:0 0 16px}.official-sheet h3{color:#103f3a}.official-sheet p,.official-sheet li{line-height:1.9;font-size:13px}.official-toc{list-style:none;padding:0}.official-toc li{display:flex;border-bottom:1px dotted #aaa;padding:7px 0}.official-toc li span{flex:1}.official-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.official-kpi{background:#f1f7f6;border-radius:16px;padding:16px;text-align:center}.official-kpi b{display:block;color:#0f766e;font-size:27px}.official-category-row{display:grid;grid-template-columns:120px 1fr 35px;gap:8px;align-items:center;margin:8px 0}.official-category-track{height:11px;background:#e6efed}.official-category-fill{height:100%;background:#0f766e}.official-activity-card{border:1px solid #dfeae8;border-radius:15px;padding:14px;margin:12px 0}.official-meta{font-size:10px;color:#6f817e}.official-story-card{border-right:4px solid #0f766e;background:#f5f9f8;padding:15px;margin:12px 0}.official-story-card img{width:105px;height:85px;object-fit:cover;float:left;margin:0 0 8px 12px}.official-gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.official-gallery img{width:100%;height:92mm;object-fit:cover}.official-gallery figure{margin:0}.official-gallery figcaption{font-size:9px}.official-section-number{font-size:11px;color:#0f766e;font-weight:bold}.official-summary-list div{padding:10px;background:#f7faf9;margin:8px 0}</style></head><body>${content}</body></html>`}

    function exportWord(){
      if(!lastBookHtml){document.getElementById('officialReportMsg').textContent='أنشئ النسخة الرسمية أولاً.';return}
      const blob=new Blob(['\ufeff',officialDocumentHtml(lastBookHtml)],{type:'application/msword;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=lastFilename+'.doc';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }

    function exportPdf(){
      if(!lastBookHtml){document.getElementById('officialReportMsg').textContent='أنشئ النسخة الرسمية أولاً.';return}
      const w=window.open('','_blank');if(!w){document.getElementById('officialReportMsg').textContent='اسمح بالنوافذ المنبثقة لتصدير PDF.';return}
      w.document.open();w.document.write(officialDocumentHtml(lastBookHtml)+`<script>window.onload=()=>setTimeout(()=>window.print(),500)<\/script>`);w.document.close();
      document.getElementById('officialReportMsg').textContent='اختر «Save as PDF / حفظ كـ PDF» من نافذة الطباعة.';
    }

    document.getElementById('officialBuildBtn').addEventListener('click',buildOfficialReport);
    document.getElementById('officialLoadImages').addEventListener('click',renderImagePicker);
    document.getElementById('officialSaveSettings').addEventListener('click',saveOfficialSettings);
    document.getElementById('officialWordBtn').addEventListener('click',exportWord);
    document.getElementById('officialPdfBtn').addEventListener('click',exportPdf);
    document.getElementById('reportBuildType')?.addEventListener('change',()=>{loadOfficialSettings();renderImagePicker()});
    document.getElementById('reportBuildMonth')?.addEventListener('change',()=>{loadOfficialSettings();renderImagePicker()});
    document.getElementById('reportBuildYear')?.addEventListener('change',()=>{loadOfficialSettings();renderImagePicker()});

    loadOfficialSettings();
  }
  waitForSuite();
})();