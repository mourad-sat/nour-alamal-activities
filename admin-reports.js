(function(){
  const form=document.getElementById('reportActivityForm');
  if(!form)return;

  let reportCache=[];
  let editingImages=[];
  const monthNames=['يناير','فبراير','مارس','أبريل','ماي','يونيو','يوليوز','غشت','شتنبر','أكتوبر','نونبر','دجنبر'];

  const num=id=>Math.max(0,Number(document.getElementById(id)?.value)||0);
  const val=id=>(document.getElementById(id)?.value||'').trim();
  const monthValue=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const todayValue=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const reportEsc=window.escapeHtml||((v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])));

  function monthLabel(v){
    if(!/^\d{4}-\d{2}$/.test(v||''))return 'الشهر المحدد';
    const [y,m]=v.split('-').map(Number);
    return `${monthNames[m-1]} ${y}`;
  }

  function resetReportForm(){
    form.reset();
    document.getElementById('reportActivityId').value='';
    document.getElementById('reportOrganizer').value='جمعية نور الأمل';
    document.getElementById('reportStartDate').value=todayValue();
    ['reportBeneficiariesTotal','reportBeneficiariesFemale','reportBeneficiariesMale','reportBeneficiariesOther','reportFacilitators','reportHours'].forEach(id=>document.getElementById(id).value=0);
    document.getElementById('reportFormTitle').textContent='توثيق نشاط جديد';
    document.getElementById('reportMsg').textContent='';
    document.getElementById('reportImages').value='';
    document.getElementById('reportImagePreview').innerHTML='';
    editingImages=[];
    renderExistingImages();
  }

  async function loadReportPrograms(){
    const select=document.getElementById('reportProgram');
    if(!select)return;
    const current=select.value;
    const {data,error}=await client.from('programs').select('id,title').order('sort_order',{ascending:true}).order('title',{ascending:true});
    if(error)return;
    select.innerHTML='<option value="">نشاط عام للجمعية</option>'+((data||[]).map(p=>`<option value="${p.id}">${reportEsc(p.title)}</option>`).join(''));
    select.value=current;
  }

  function previewSelectedImages(files){
    const box=document.getElementById('reportImagePreview');
    if(!box)return;
    box.innerHTML='';
    [...files].forEach(file=>{
      const item=document.createElement('figure');
      item.className='multi-image-item';
      item.innerHTML=`<img src="${URL.createObjectURL(file)}" alt="معاينة"><figcaption>${reportEsc(file.name)}</figcaption>`;
      box.appendChild(item);
    });
  }

  function renderExistingImages(){
    const box=document.getElementById('reportExistingImages');
    if(!box)return;
    box.innerHTML=editingImages.map(img=>`<figure class="multi-image-item existing"><img src="${reportEsc(img.image_url)}" alt="صورة النشاط"><figcaption>${reportEsc(img.caption||'صورة موثقة')}</figcaption><button type="button" class="image-remove" data-report-image-delete="${img.id}" title="حذف الصورة">×</button></figure>`).join('');
  }

  async function removeStorageUrl(url){
    try{
      const marker='/storage/v1/object/public/site-media/';
      const pos=url.indexOf(marker);
      if(pos<0)return;
      const path=decodeURIComponent(url.slice(pos+marker.length).split('?')[0]);
      if(path)await client.storage.from('site-media').remove([path]);
    }catch(_e){}
  }

  async function deleteExistingImage(id){
    const image=editingImages.find(x=>String(x.id)===String(id));
    if(!image)return;
    const {error}=await client.from('report_activity_images').delete().eq('id',id);
    if(error){document.getElementById('reportMsg').textContent='تعذر حذف الصورة.';return}
    await removeStorageUrl(image.image_url);
    editingImages=editingImages.filter(x=>String(x.id)!==String(id));
    renderExistingImages();
  }

  function reportPayload(){
    const female=num('reportBeneficiariesFemale'),male=num('reportBeneficiariesMale'),other=num('reportBeneficiariesOther');
    let total=num('reportBeneficiariesTotal');
    if(total===0&&(female+male+other)>0)total=female+male+other;
    return {
      title:val('reportTitle'),
      category:val('reportCategory')||'عام',
      program_id:val('reportProgram')?Number(val('reportProgram')):null,
      project_name:val('reportProjectName'),
      start_date:val('reportStartDate'),
      end_date:val('reportEndDate')||null,
      location:val('reportLocation'),
      organizer:val('reportOrganizer')||'جمعية نور الأمل',
      partners:val('reportPartners'),
      target_group:val('reportTargetGroup'),
      description:val('reportDescription'),
      objectives:val('reportObjectives'),
      results:val('reportResults'),
      beneficiaries_total:total,
      beneficiaries_female:female,
      beneficiaries_male:male,
      beneficiaries_other:other,
      age_groups:val('reportAgeGroups'),
      facilitators_count:num('reportFacilitators'),
      activity_hours:num('reportHours'),
      challenges:val('reportChallenges'),
      recommendations:val('reportRecommendations'),
      notes:val('reportNotes')
    };
  }

  async function uploadReportImages(activityId,files){
    const rows=[];
    let order=editingImages.length;
    for(const file of [...files]){
      const url=await uploadImage(file,`reports/${activityId}`);
      rows.push({activity_id:Number(activityId),image_url:url,caption:file.name,sort_order:order++});
    }
    if(rows.length){
      const {error}=await client.from('report_activity_images').insert(rows);
      if(error)throw error;
    }
  }

  async function saveReportActivity(e){
    e.preventDefault();
    const msg=document.getElementById('reportMsg');
    msg.textContent='جارٍ حفظ النشاط والصور...';
    try{
      const payload=reportPayload();
      if(!payload.title||!payload.start_date)throw new Error('أدخل عنوان النشاط وتاريخه.');
      const id=val('reportActivityId');
      let activityId=id;
      if(id){
        const {error}=await client.from('report_activities').update(payload).eq('id',id);
        if(error)throw error;
      }else{
        const {data,error}=await client.from('report_activities').insert(payload).select('id').single();
        if(error)throw error;
        activityId=data.id;
      }
      const files=document.getElementById('reportImages').files;
      if(files.length)await uploadReportImages(activityId,files);
      msg.textContent='تم توثيق النشاط بنجاح.';
      resetReportForm();
      await loadReportActivities();
    }catch(err){msg.textContent='تعذر الحفظ: '+(err.message||'خطأ غير معروف')}
  }

  async function loadReportActivities(){
    const box=document.getElementById('reportActivitiesList');
    if(!box)return;
    box.innerHTML='<p>جارٍ تحميل الأنشطة الموثقة...</p>';
    const {data,error}=await client.from('report_activities').select('*,programs(title),report_activity_images(id,image_url,caption,sort_order)').order('start_date',{ascending:false}).order('created_at',{ascending:false});
    if(error){box.innerHTML='<div class="empty">تعذر تحميل أنشطة التقارير.</div>';return}
    reportCache=(data||[]).map(x=>({...x,report_activity_images:(x.report_activity_images||[]).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))}));
    renderReportList();
    renderMonthlyDashboard();
  }

  function filteredReportRows(){
    const month=val('reportListMonth');
    const search=val('reportSearch').toLowerCase();
    return reportCache.filter(r=>{
      if(month&&!String(r.start_date||'').startsWith(month))return false;
      if(!search)return true;
      return [r.title,r.category,r.location,r.project_name,r.target_group,r.programs?.title].some(v=>String(v||'').toLowerCase().includes(search));
    });
  }

  function renderReportList(){
    const box=document.getElementById('reportActivitiesList');
    if(!box)return;
    const rows=filteredReportRows();
    if(!rows.length){box.innerHTML='<div class="empty">لا توجد أنشطة مطابقة للتصفية الحالية.</div>';return}
    box.innerHTML=rows.map(r=>{
      const img=r.report_activity_images?.[0]?.image_url;
      const program=r.programs?.title||r.project_name||'نشاط عام للجمعية';
      return `<article class="post-item report-list-item"><div class="thumb-row">${img?`<img src="${reportEsc(img)}" alt="${reportEsc(r.title)}">`:'<div class="report-thumb-empty">📋</div>'}<div class="grow"><div class="post-top"><div><h3>${reportEsc(r.title)}</h3><small>${reportEsc(r.category)} · ${new Date(r.start_date+'T12:00:00').toLocaleDateString('ar-MA')} · ${reportEsc(program)}</small></div><span class="status published">${Number(r.beneficiaries_total)||0} مستفيد</span></div><div class="report-mini-meta"><span>📍 ${reportEsc(r.location||'غير محدد')}</span><span>⏱ ${Number(r.activity_hours)||0} ساعة</span><span>📷 ${(r.report_activity_images||[]).length} صورة</span></div><div class="post-actions"><button data-report-edit="${r.id}">تعديل</button><button class="secondary" data-report-view="${r.id}">عرض الملخص</button><button class="danger" data-report-delete="${r.id}">حذف</button></div></div></div></article>`;
    }).join('');
  }

  function selectedMonthRows(){
    const month=val('reportMonth')||monthValue();
    return reportCache.filter(r=>String(r.start_date||'').startsWith(month));
  }

  function renderMonthlyDashboard(){
    const month=val('reportMonth')||monthValue();
    const rows=selectedMonthRows();
    const sums=rows.reduce((a,r)=>{
      a.total+=Number(r.beneficiaries_total)||0;
      a.female+=Number(r.beneficiaries_female)||0;
      a.male+=Number(r.beneficiaries_male)||0;
      a.hours+=Number(r.activity_hours)||0;
      return a;
    },{total:0,female:0,male:0,hours:0});
    const stats=document.getElementById('reportStats');
    if(stats)stats.innerHTML=`<div class="report-stat"><b>${rows.length}</b><span>الأنشطة</span></div><div class="report-stat"><b>${sums.total}</b><span>المستفيدون</span></div><div class="report-stat"><b>${sums.female}</b><span>الإناث</span></div><div class="report-stat"><b>${sums.male}</b><span>الذكور</span></div><div class="report-stat"><b>${sums.hours.toLocaleString('ar-MA',{maximumFractionDigits:1})}</b><span>ساعات الأنشطة</span></div>`;
    const summary=document.getElementById('monthlySummary');
    if(!summary)return;
    if(!rows.length){summary.textContent=`لم تتم إضافة أنشطة موثقة لشهر ${monthLabel(month)} بعد.`;return}
    const categories={};
    rows.forEach(r=>categories[r.category]=(categories[r.category]||0)+1);
    const catText=Object.entries(categories).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`${n} ${c}`).join('، ');
    const places=[...new Set(rows.map(r=>r.location).filter(Boolean))];
    const partners=[...new Set(rows.flatMap(r=>String(r.partners||'').split(/[،,\n]+/).map(x=>x.trim()).filter(Boolean)))];
    summary.textContent=`خلال شهر ${monthLabel(month)}، وثقت جمعية نور الأمل ${rows.length} نشاطاً بمختلف مجالات تدخلها (${catText})، واستفاد منها ما مجموعه ${sums.total} مستفيداً ومستفيدة، من بينهم ${sums.female} من الإناث و${sums.male} من الذكور. وبلغ الحجم الإجمالي للأنشطة نحو ${sums.hours.toLocaleString('ar-MA',{maximumFractionDigits:1})} ساعة${places.length?`، ونُفذت الأنشطة في ${places.length} موقع/فضاء`:''}${partners.length?`، بمساهمة أو تعاون مع ${partners.length} شريك/جهة`:''}. ويشكل هذا التوثيق قاعدة لإبراز النتائج والأثر وإعداد التقرير الأدبي السنوي للجمعية.`;
  }

  function fillReportForm(r){
    document.getElementById('reportActivityId').value=r.id;
    document.getElementById('reportTitle').value=r.title||'';
    document.getElementById('reportCategory').value=r.category||'';
    document.getElementById('reportProgram').value=r.program_id||'';
    document.getElementById('reportProjectName').value=r.project_name||'';
    document.getElementById('reportStartDate').value=r.start_date||'';
    document.getElementById('reportEndDate').value=r.end_date||'';
    document.getElementById('reportLocation').value=r.location||'';
    document.getElementById('reportOrganizer').value=r.organizer||'';
    document.getElementById('reportPartners').value=r.partners||'';
    document.getElementById('reportTargetGroup').value=r.target_group||'';
    document.getElementById('reportDescription').value=r.description||'';
    document.getElementById('reportObjectives').value=r.objectives||'';
    document.getElementById('reportResults').value=r.results||'';
    document.getElementById('reportBeneficiariesTotal').value=r.beneficiaries_total||0;
    document.getElementById('reportBeneficiariesFemale').value=r.beneficiaries_female||0;
    document.getElementById('reportBeneficiariesMale').value=r.beneficiaries_male||0;
    document.getElementById('reportBeneficiariesOther').value=r.beneficiaries_other||0;
    document.getElementById('reportAgeGroups').value=r.age_groups||'';
    document.getElementById('reportFacilitators').value=r.facilitators_count||0;
    document.getElementById('reportHours').value=r.activity_hours||0;
    document.getElementById('reportChallenges').value=r.challenges||'';
    document.getElementById('reportRecommendations').value=r.recommendations||'';
    document.getElementById('reportNotes').value=r.notes||'';
    editingImages=[...(r.report_activity_images||[])];
    renderExistingImages();
    document.getElementById('reportImagePreview').innerHTML='';
    document.getElementById('reportImages').value='';
    document.getElementById('reportFormTitle').textContent='تعديل النشاط الموثق';
    form.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function showActivitySummary(r){
    const program=r.programs?.title||r.project_name||'نشاط عام للجمعية';
    const text=`${r.title}\nالتاريخ: ${new Date(r.start_date+'T12:00:00').toLocaleDateString('ar-MA')}\nالنوع: ${r.category}\nالبرنامج/الإطار: ${program}\nالمكان: ${r.location||'غير محدد'}\nالمستفيدون: ${r.beneficiaries_total||0}\nالإناث: ${r.beneficiaries_female||0} | الذكور: ${r.beneficiaries_male||0}\nعدد الساعات: ${r.activity_hours||0}\n\nالوصف:\n${r.description||'-'}\n\nالأهداف:\n${r.objectives||'-'}\n\nالنتائج:\n${r.results||'-'}\n\nالشركاء:\n${r.partners||'-'}\n\nالتوصيات:\n${r.recommendations||'-'}`;
    alert(text);
  }

  async function deleteReportActivity(r){
    if(!confirm(`هل تريد حذف توثيق النشاط «${r.title}» نهائياً؟`))return;
    for(const img of (r.report_activity_images||[]))await removeStorageUrl(img.image_url);
    const {error}=await client.from('report_activities').delete().eq('id',r.id);
    if(error){document.getElementById('reportMsg').textContent='تعذر حذف النشاط.';return}
    if(String(document.getElementById('reportActivityId').value)===String(r.id))resetReportForm();
    await loadReportActivities();
  }

  form.addEventListener('submit',saveReportActivity);
  document.getElementById('reportNewBtn')?.addEventListener('click',resetReportForm);
  document.getElementById('reportCancelBtn')?.addEventListener('click',resetReportForm);
  document.getElementById('reportImages')?.addEventListener('change',e=>previewSelectedImages(e.target.files));
  document.getElementById('reportExistingImages')?.addEventListener('click',e=>{const id=e.target.dataset.reportImageDelete;if(id&&confirm('حذف هذه الصورة من توثيق النشاط؟'))deleteExistingImage(id)});
  document.getElementById('reportRefresh')?.addEventListener('click',renderMonthlyDashboard);
  document.getElementById('reportListRefresh')?.addEventListener('click',loadReportActivities);
  document.getElementById('reportMonth')?.addEventListener('change',renderMonthlyDashboard);
  document.getElementById('reportListMonth')?.addEventListener('change',renderReportList);
  document.getElementById('reportSearch')?.addEventListener('input',renderReportList);
  document.getElementById('copyMonthlySummary')?.addEventListener('click',async()=>{
    const text=document.getElementById('monthlySummary').textContent;
    try{await navigator.clipboard.writeText(text);document.getElementById('reportMsg').textContent='تم نسخ الملخص الشهري.'}catch(_e){document.getElementById('reportMsg').textContent='تعذر النسخ التلقائي. يمكنك تحديد النص ونسخه.'}
  });
  document.getElementById('reportActivitiesList')?.addEventListener('click',e=>{
    const edit=e.target.dataset.reportEdit,view=e.target.dataset.reportView,del=e.target.dataset.reportDelete;
    const id=edit||view||del;if(!id)return;
    const row=reportCache.find(x=>String(x.id)===String(id));if(!row)return;
    if(edit)fillReportForm(row);else if(view)showActivitySummary(row);else if(del)deleteReportActivity(row);
  });

  async function initReports(){
    if(!(await isAdmin()))return;
    const current=monthValue();
    if(!document.getElementById('reportMonth').value)document.getElementById('reportMonth').value=current;
    if(!document.getElementById('reportListMonth').value)document.getElementById('reportListMonth').value=current;
    if(!document.getElementById('reportStartDate').value)document.getElementById('reportStartDate').value=todayValue();
    await Promise.all([loadReportPrograms(),loadReportActivities()]);
  }

  client.auth.onAuthStateChange(()=>initReports());
  initReports();
})();