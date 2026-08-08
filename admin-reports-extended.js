(function(){
  const panel=document.querySelector('.tab-panel[data-panel="reports"]');
  if(!panel||document.getElementById('reportExtendedSuite'))return;

  const esc=window.escapeHtml||((v='')=>String(v).replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])));
  const today=()=>new Date().toISOString().slice(0,10);
  const thisMonth=()=>new Date().toISOString().slice(0,7);
  const thisYear=()=>String(new Date().getFullYear());
  const monthNames=['يناير','فبراير','مارس','أبريل','ماي','يونيو','يوليوز','غشت','شتنبر','أكتوبر','نونبر','دجنبر'];
  let storiesCache=[];
  let activitiesCache=[];
  let programMap=new Map();

  const suite=document.createElement('div');
  suite.id='reportExtendedSuite';
  suite.className='report-extended-suite';
  suite.innerHTML=`
    <section class="panel impact-section">
      <div class="list-head report-section-head"><div><span class="badge">الأثر الإنساني</span><h2>قصص النجاح والأثر</h2><p>توثيق حالات يظهر فيها أثر واضح لأنشطة الجمعية، مع احترام خصوصية المستفيدين.</p></div><button id="storyNewBtn" type="button" class="secondary">+ قصة أثر جديدة</button></div>
      <div class="admin-grid impact-grid">
        <form id="storyForm" class="impact-form"><input id="storyId" type="hidden">
          <label>عنوان القصة<input id="storyTitle" required maxlength="200" placeholder="مثال: عودة إلى التعلم بثقة أكبر"></label>
          <div class="two"><label>تاريخ القصة<input id="storyDate" type="date" required></label><label>النشاط المرتبط (اختياري)<select id="storyActivity"><option value="">قصة عامة / غير مرتبطة بنشاط واحد</option></select></label></div>
          <div class="two"><label>اسم العرض أو الرمز<input id="storyBeneficiary" maxlength="120" placeholder="مثال: م.أ أو اسم أول فقط"></label><label>حالة الخصوصية<select id="storyConsent"><option value="internal">داخلية فقط</option><option value="anonymous">تظهر في التقرير دون تعريف بالشخص</option><option value="consented">مسموح بإدراج الاسم/الصورة في التقرير</option></select></label></div>
          <div class="two"><label>الفئة العمرية<input id="storyAgeGroup" maxlength="80" placeholder="مثال: 15–18 سنة"></label><label>النوع<select id="storyGender"><option value="">غير محدد</option><option value="أنثى">أنثى</option><option value="ذكر">ذكر</option><option value="آخر">آخر</option></select></label></div>
          <label>ملخص الحالة<textarea id="storySummary" rows="4" placeholder="الوضع أو الحاجة قبل الاستفادة..."></textarea></label>
          <label>التغيير أو الأثر الملحوظ<textarea id="storyChange" rows="4" placeholder="ما الذي تغير؟ ما المهارات أو النتائج التي تحققت؟"></textarea></label>
          <label>شهادة قصيرة أو اقتباس<textarea id="storyQuote" rows="3" placeholder="اختياري"></textarea></label>
          <label>صورة اختيارية<input id="storyImageFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif"><small>لن تُدرج الصورة في التقرير الخارجي إلا إذا كانت حالة الخصوصية «مسموح».</small></label>
          <label>أو رابط صورة<input id="storyImageUrl" type="url" placeholder="https://..."></label>
          <div id="storyImagePreview" class="image-preview hidden"></div>
          <div class="actions"><button type="submit">حفظ قصة الأثر</button><button id="storyCancelBtn" type="button" class="secondary">إلغاء</button></div><p id="storyMsg" class="msg"></p>
        </form>
        <div><div class="list-head"><h3>القصص الموثقة</h3><button id="storiesRefresh" type="button" class="secondary">تحديث</button></div><div id="storiesList" class="impact-list"><p>جارٍ التحميل...</p></div></div>
      </div>
    </section>

    <section class="panel report-builder-section">
      <div class="report-builder-head"><div><span class="badge">إعداد التقرير</span><h2>التقرير الشهري والسنوي</h2><p>يبني النظام مسودة التقرير من جميع الأنشطة الموثقة وقصص الأثر خلال الفترة المختارة.</p></div><div class="report-builder-controls"><label>نوع التقرير<select id="reportBuildType"><option value="monthly">شهري</option><option value="annual">سنوي</option></select></label><label id="reportBuildMonthWrap">الفترة<input id="reportBuildMonth" type="month"></label><label id="reportBuildYearWrap" class="hidden">السنة<input id="reportBuildYear" type="number" min="2020" max="2100"></label><button id="buildLiteraryReport" type="button">إنشاء التقرير</button></div></div>
      <div class="report-notes-grid">
        <label>مقدمة التقرير<textarea id="reportNoteIntro" rows="4" placeholder="يمكن تركها فارغة ليقترح النظام مقدمة تلقائية."></textarea></label>
        <label>أبرز المنجزات<textarea id="reportNoteHighlights" rows="4" placeholder="ملاحظات أو إنجازات نوعية تريد إبرازها."></textarea></label>
        <label>التحديات والإكراهات<textarea id="reportNoteChallenges" rows="4"></textarea></label>
        <label>التوصيات والآفاق<textarea id="reportNoteRecommendations" rows="4"></textarea></label>
        <label class="report-note-wide">الخلاصة<textarea id="reportNoteConclusion" rows="3"></textarea></label>
      </div>
      <div class="actions report-save-actions"><button id="saveReportNotes" type="button" class="secondary">حفظ الملاحظات</button><button id="copyFullReport" type="button" class="secondary">نسخ التقرير</button><button id="printFullReport" type="button">طباعة / حفظ PDF</button><span id="reportBuildMsg" class="msg"></span></div>
      <article id="literaryReportPreview" class="literary-report-preview"><div class="empty">اختر الفترة ثم اضغط «إنشاء التقرير».</div></article>
    </section>`;
  panel.appendChild(suite);

  const style=document.createElement('style');
  style.textContent=`
  .report-extended-suite{display:grid;gap:22px;margin-top:22px}.report-section-head{align-items:flex-start}.impact-form{min-width:0}.impact-list{display:grid;gap:10px;margin-top:12px}.impact-item{border:1px solid #dce8e6;border-radius:16px;padding:14px;background:#fff}.impact-item-top{display:flex;gap:12px;align-items:flex-start}.impact-item img{width:82px;height:82px;border-radius:14px;object-fit:cover;flex:0 0 auto}.impact-item h4{margin:0 0 5px}.impact-item p{margin:7px 0;font-size:12px}.privacy-pill{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:800;background:#eef5f4;color:#315b56}.privacy-pill.consented{background:#e7f6ef;color:#17754c}.privacy-pill.internal{background:#fff4df;color:#9a6211}.report-builder-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}.report-builder-controls{display:flex;align-items:end;gap:8px;flex-wrap:wrap}.report-builder-controls label{min-width:130px;margin:0}.report-notes-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.report-note-wide{grid-column:1/-1}.report-save-actions{justify-content:flex-start;margin:16px 0;flex-wrap:wrap}.literary-report-preview{border:1px solid #d9e8e5;border-radius:20px;background:#fff;padding:28px;min-height:220px}.literary-report-preview h1{font-size:28px;text-align:center;margin:0 0 6px}.literary-report-preview .report-subtitle{text-align:center;margin:0 0 22px}.literary-report-preview h2{font-size:19px;border-bottom:1px solid #e1ecea;padding-bottom:7px;margin-top:24px}.literary-report-preview p,.literary-report-preview li{line-height:1.9;color:#334d49}.literary-report-preview .report-kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:18px 0}.literary-report-preview .report-kpi{background:#f3f8f7;border-radius:14px;padding:12px;text-align:center}.literary-report-preview .report-kpi b{display:block;font-size:22px;color:#0f766e}.literary-report-preview .report-kpi span{font-size:10px;color:#637976}.literary-report-preview .report-gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.literary-report-preview .report-gallery img{width:100%;height:150px;object-fit:cover;border-radius:12px}.literary-report-preview .report-story{border-right:4px solid #0f766e;background:#f7faf9;border-radius:14px;padding:14px;margin:10px 0}.literary-report-preview blockquote{margin:8px 0 0;padding:8px 12px;background:#fff;border-radius:10px;color:#49615e}.report-category-bars{display:grid;gap:7px}.report-category-row{display:grid;grid-template-columns:130px 1fr 42px;gap:8px;align-items:center;font-size:12px}.report-category-track{height:9px;border-radius:999px;background:#eaf2f1;overflow:hidden}.report-category-fill{height:100%;background:#0f766e;border-radius:inherit}.report-activity-entry{padding:10px 0;border-bottom:1px solid #edf3f2}.report-activity-entry:last-child{border-bottom:0}.report-activity-entry strong{color:#173b37}.report-muted{color:#728481;font-size:11px}.report-empty-note{font-style:italic;color:#81908e}.report-print-brand{text-align:center;margin-bottom:10px}.report-print-brand img{max-width:170px;max-height:100px;object-fit:contain}@media(max-width:900px){.report-builder-head{flex-direction:column}.report-notes-grid{grid-template-columns:1fr}.report-note-wide{grid-column:auto}.literary-report-preview{padding:18px}.literary-report-preview .report-kpis{grid-template-columns:repeat(2,1fr)}.literary-report-preview .report-gallery{grid-template-columns:1fr 1fr}.impact-grid{grid-template-columns:1fr}.report-category-row{grid-template-columns:90px 1fr 36px}}`;
  document.head.appendChild(style);

  function privacyLabel(v){return ({internal:'داخلية فقط',anonymous:'مجهولة في التقرير',consented:'مسموح في التقرير'})[v]||v}
  function periodKey(){return document.getElementById('reportBuildType').value==='monthly'?document.getElementById('reportBuildMonth').value:String(document.getElementById('reportBuildYear').value||'')}
  function periodRange(type,key){
    if(type==='annual')return {from:key+'-01-01',to:key+'-12-31',label:'سنة '+key};
    const [y,m]=key.split('-').map(Number);const last=new Date(y,m,0).getDate();return {from:key+'-01',to:key+'-'+String(last).padStart(2,'0'),label:(monthNames[m-1]||'')+' '+y};
  }
  function splitPartners(v){return String(v||'').split(/[،,;\n]+/).map(x=>x.trim()).filter(Boolean)}
  function sum(rows,key){return rows.reduce((a,r)=>a+(Number(r[key])||0),0)}
  function unique(arr){return [...new Set(arr.filter(Boolean))]}

  async function loadStoryActivities(){
    const {data}=await client.from('report_activities').select('id,title,start_date').order('start_date',{ascending:false}).limit(500);
    activitiesCache=data||[];
    const s=document.getElementById('storyActivity');const current=s.value;
    s.innerHTML='<option value="">قصة عامة / غير مرتبطة بنشاط واحد</option>'+activitiesCache.map(a=>`<option value="${a.id}">${esc(a.title)} — ${esc(a.start_date||'')}</option>`).join('');
    if(current)s.value=current;
  }

  async function loadProgramsMap(){const {data}=await client.from('programs').select('id,title');programMap=new Map((data||[]).map(p=>[String(p.id),p.title]))}

  async function loadStories(){
    const box=document.getElementById('storiesList');box.innerHTML='<p>جارٍ التحميل...</p>';
    const {data,error}=await client.from('report_success_stories').select('*').order('story_date',{ascending:false}).order('created_at',{ascending:false});
    if(error){box.innerHTML='<div class="empty">تعذر تحميل قصص الأثر.</div>';return}
    storiesCache=data||[];
    box.innerHTML=storiesCache.length?storiesCache.map(s=>`<article class="impact-item"><div class="impact-item-top">${s.image_url?`<img src="${esc(s.image_url)}" alt="${esc(s.title)}">`:''}<div style="flex:1"><div class="post-top"><div><h4>${esc(s.title)}</h4><small>${new Date(s.story_date+'T12:00:00').toLocaleDateString('ar-MA')} ${s.beneficiary_label?' · '+esc(s.beneficiary_label):''}</small></div><span class="privacy-pill ${esc(s.consent_status)}">${privacyLabel(s.consent_status)}</span></div><p>${esc(s.change_observed||s.summary||'')}</p></div></div><div class="post-actions"><button data-story-edit="${s.id}">تعديل</button><button data-story-delete="${s.id}" class="danger">حذف</button></div></article>`).join(''):'<div class="empty">لا توجد قصص أثر موثقة بعد.</div>';
  }

  function resetStory(){
    document.getElementById('storyForm').reset();document.getElementById('storyId').value='';document.getElementById('storyDate').value=today();document.getElementById('storyConsent').value='internal';document.getElementById('storyMsg').textContent='';document.getElementById('storyImagePreview').classList.add('hidden');document.getElementById('storyImagePreview').innerHTML='';
  }

  document.getElementById('storyImageFile').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const u=URL.createObjectURL(f),p=document.getElementById('storyImagePreview');p.innerHTML=`<img src="${u}" alt="معاينة">`;p.classList.remove('hidden')});
  document.getElementById('storyNewBtn').addEventListener('click',resetStory);document.getElementById('storyCancelBtn').addEventListener('click',resetStory);document.getElementById('storiesRefresh').addEventListener('click',loadStories);
  document.getElementById('storyForm').addEventListener('submit',async e=>{
    e.preventDefault();const msg=document.getElementById('storyMsg');msg.textContent='جارٍ الحفظ...';
    try{
      const id=document.getElementById('storyId').value;let image=document.getElementById('storyImageUrl').value.trim()||null;const f=document.getElementById('storyImageFile').files[0];if(f)image=await uploadImage(f,'report-stories');
      const payload={activity_id:document.getElementById('storyActivity').value?Number(document.getElementById('storyActivity').value):null,story_date:document.getElementById('storyDate').value,title:document.getElementById('storyTitle').value.trim(),beneficiary_label:document.getElementById('storyBeneficiary').value.trim(),age_group:document.getElementById('storyAgeGroup').value.trim(),gender:document.getElementById('storyGender').value,summary:document.getElementById('storySummary').value.trim(),change_observed:document.getElementById('storyChange').value.trim(),quote:document.getElementById('storyQuote').value.trim(),image_url:image,consent_status:document.getElementById('storyConsent').value};
      const r=id?await client.from('report_success_stories').update(payload).eq('id',id):await client.from('report_success_stories').insert(payload);if(r.error)throw r.error;resetStory();await loadStories();msg.textContent='تم حفظ قصة الأثر.';
    }catch(err){msg.textContent='تعذر الحفظ: '+(err.message||'خطأ')}
  });
  document.getElementById('storiesList').addEventListener('click',async e=>{
    const edit=e.target.dataset.storyEdit,del=e.target.dataset.storyDelete;
    if(edit){const s=storiesCache.find(x=>String(x.id)===String(edit));if(!s)return;document.getElementById('storyId').value=s.id;document.getElementById('storyTitle').value=s.title||'';document.getElementById('storyDate').value=s.story_date||today();document.getElementById('storyActivity').value=s.activity_id||'';document.getElementById('storyBeneficiary').value=s.beneficiary_label||'';document.getElementById('storyAgeGroup').value=s.age_group||'';document.getElementById('storyGender').value=s.gender||'';document.getElementById('storySummary').value=s.summary||'';document.getElementById('storyChange').value=s.change_observed||'';document.getElementById('storyQuote').value=s.quote||'';document.getElementById('storyImageUrl').value=s.image_url||'';document.getElementById('storyConsent').value=s.consent_status||'internal';if(s.image_url){const p=document.getElementById('storyImagePreview');p.innerHTML=`<img src="${esc(s.image_url)}" alt="معاينة">`;p.classList.remove('hidden')}document.getElementById('storyForm').scrollIntoView({behavior:'smooth',block:'start'})}
    if(del&&confirm('هل تريد حذف قصة الأثر نهائياً؟')){await client.from('report_success_stories').delete().eq('id',del);await loadStories()}
  });

  document.getElementById('reportBuildType').addEventListener('change',()=>{const annual=document.getElementById('reportBuildType').value==='annual';document.getElementById('reportBuildMonthWrap').classList.toggle('hidden',annual);document.getElementById('reportBuildYearWrap').classList.toggle('hidden',!annual);loadPeriodNotes()});
  document.getElementById('reportBuildMonth').addEventListener('change',loadPeriodNotes);document.getElementById('reportBuildYear').addEventListener('change',loadPeriodNotes);

  async function loadPeriodNotes(){
    const type=document.getElementById('reportBuildType').value,key=periodKey();if(!key)return;
    const {data}=await client.from('report_period_notes').select('*').eq('period_type',type).eq('period_key',key).maybeSingle();
    document.getElementById('reportNoteIntro').value=data?.intro||'';document.getElementById('reportNoteHighlights').value=data?.highlights||'';document.getElementById('reportNoteChallenges').value=data?.challenges||'';document.getElementById('reportNoteRecommendations').value=data?.recommendations||'';document.getElementById('reportNoteConclusion').value=data?.conclusion||'';
  }

  document.getElementById('saveReportNotes').addEventListener('click',async()=>{
    const msg=document.getElementById('reportBuildMsg'),type=document.getElementById('reportBuildType').value,key=periodKey();if(!key){msg.textContent='حدد الفترة أولاً.';return}msg.textContent='جارٍ حفظ الملاحظات...';
    const row={period_type:type,period_key:key,intro:document.getElementById('reportNoteIntro').value.trim(),highlights:document.getElementById('reportNoteHighlights').value.trim(),challenges:document.getElementById('reportNoteChallenges').value.trim(),recommendations:document.getElementById('reportNoteRecommendations').value.trim(),conclusion:document.getElementById('reportNoteConclusion').value.trim()};
    const {error}=await client.from('report_period_notes').upsert(row,{onConflict:'period_type,period_key'});msg.textContent=error?'تعذر حفظ الملاحظات.':'تم حفظ ملاحظات التقرير.';
  });

  async function buildReport(){
    const msg=document.getElementById('reportBuildMsg'),preview=document.getElementById('literaryReportPreview'),type=document.getElementById('reportBuildType').value,key=periodKey();if(!key){msg.textContent='حدد الفترة أولاً.';return}msg.textContent='جارٍ بناء التقرير...';preview.innerHTML='<p>جارٍ تجميع الأنشطة والمؤشرات والصور...</p>';
    const range=periodRange(type,key);
    const [actRes,storyRes,settingsRes]=await Promise.all([
      client.from('report_activities').select('*').gte('start_date',range.from).lte('start_date',range.to).order('start_date',{ascending:true}),
      client.from('report_success_stories').select('*').gte('story_date',range.from).lte('story_date',range.to).order('story_date',{ascending:true}),
      client.from('site_settings').select('key,value').in('key',['logo_url'])
    ]);
    if(actRes.error||storyRes.error){preview.innerHTML='<div class="empty">تعذر إنشاء التقرير حالياً.</div>';msg.textContent='تعذر تحميل بيانات التقرير.';return}
    const acts=actRes.data||[],stories=(storyRes.data||[]).filter(s=>s.consent_status!=='internal'),logo=Object.fromEntries((settingsRes.data||[]).map(x=>[x.key,x.value])).logo_url||'';
    let images=[];if(acts.length){const ids=acts.map(a=>a.id);const {data}=await client.from('report_activity_images').select('*').in('activity_id',ids).order('sort_order',{ascending:true});images=data||[]}
    const total=sum(acts,'beneficiaries_total'),female=sum(acts,'beneficiaries_female'),male=sum(acts,'beneficiaries_male'),hours=sum(acts,'activity_hours'),facilitators=sum(acts,'facilitators_count');
    const partners=unique(acts.flatMap(a=>splitPartners(a.partners)));const locations=unique(acts.map(a=>a.location));
    const categoryCounts={};acts.forEach(a=>{const k=a.category||'عام';categoryCounts[k]=(categoryCounts[k]||0)+1});const maxCat=Math.max(1,...Object.values(categoryCounts));
    const intro=document.getElementById('reportNoteIntro').value.trim()||`خلال ${range.label} واصلت جمعية نور الأمل تنفيذ أنشطتها المتنوعة استجابة لحاجيات الفئات المستهدفة، مع التركيز على التعلم والتأهيل والمواكبة والمشاركة المجتمعية. ويقدم هذا التقرير حصيلة الأنشطة والنتائج والمؤشرات المسجلة خلال هذه الفترة.`;
    const highlights=document.getElementById('reportNoteHighlights').value.trim();
    const challenges=document.getElementById('reportNoteChallenges').value.trim()||unique(acts.map(a=>a.challenges).filter(Boolean)).join('؛ ');
    const recs=document.getElementById('reportNoteRecommendations').value.trim()||unique(acts.map(a=>a.recommendations).filter(Boolean)).join('؛ ');
    const conclusion=document.getElementById('reportNoteConclusion').value.trim()||`تعكس حصيلة ${range.label} استمرار الجمعية في تنويع تدخلاتها وتوسيع أثرها، مع الحرص على توثيق النتائج والاستفادة منها في تحسين التخطيط والبرامج المقبلة.`;
    const activitiesHtml=acts.length?acts.map(a=>`<div class="report-activity-entry"><strong>${esc(a.title)}</strong><div class="report-muted">${new Date(a.start_date+'T12:00:00').toLocaleDateString('ar-MA')} · ${esc(a.category||'نشاط')} ${a.location?'· '+esc(a.location):''}</div><p>${esc(a.results||a.description||'')}</p><div class="report-muted">المستفيدون: ${Number(a.beneficiaries_total)||0} · الساعات: ${Number(a.activity_hours)||0}${a.program_id&&programMap.get(String(a.program_id))?' · '+esc(programMap.get(String(a.program_id))):a.project_name?' · '+esc(a.project_name):''}</div></div>`).join(''):'<p class="report-empty-note">لم يتم توثيق أنشطة خلال هذه الفترة.</p>';
    const storiesHtml=stories.length?stories.map(s=>`<div class="report-story">${s.image_url&&s.consent_status==='consented'?`<img src="${esc(s.image_url)}" alt="${esc(s.title)}" style="width:110px;height:90px;object-fit:cover;border-radius:12px;float:left;margin:0 0 8px 12px">`:''}<strong>${esc(s.title)}</strong><p>${esc(s.change_observed||s.summary||'')}</p>${s.consent_status==='consented'&&s.beneficiary_label?`<div class="report-muted">${esc(s.beneficiary_label)}${s.age_group?' · '+esc(s.age_group):''}</div>`:'<div class="report-muted">قصة أثر موثقة مع الحفاظ على هوية المستفيد.</div>'}${s.quote?`<blockquote>«${esc(s.quote)}»</blockquote>`:''}<div style="clear:both"></div></div>`).join(''):'<p class="report-empty-note">لا توجد قصص أثر قابلة للإدراج في هذا التقرير.</p>';
    const gallery=images.slice(0,type==='annual'?12:6);const galleryHtml=gallery.length?`<div class="report-gallery">${gallery.map(i=>`<img src="${esc(i.image_url)}" alt="${esc(i.caption||'صورة من نشاط الجمعية')}">`).join('')}</div>`:'<p class="report-empty-note">لا توجد صور أنشطة مضافة لهذه الفترة.</p>';
    const categories=Object.entries(categoryCounts).sort((a,b)=>b[1]-a[1]);
    preview.innerHTML=`${logo?`<div class="report-print-brand"><img src="${esc(logo)}" alt="شعار جمعية نور الأمل"></div>`:''}<h1>${type==='annual'?'التقرير الأدبي السنوي':'التقرير الأدبي الشهري'}</h1><p class="report-subtitle">جمعية نور الأمل — ${range.label}</p><h2>1. تقديم</h2><p>${esc(intro)}</p><div class="report-kpis"><div class="report-kpi"><b>${acts.length}</b><span>نشاطاً</span></div><div class="report-kpi"><b>${total}</b><span>مستفيداً/مشاركة</span></div><div class="report-kpi"><b>${female}</b><span>إناث</span></div><div class="report-kpi"><b>${male}</b><span>ذكور</span></div><div class="report-kpi"><b>${hours}</b><span>ساعة نشاط</span></div><div class="report-kpi"><b>${facilitators}</b><span>مؤطراً/مساهمة تأطير</span></div></div><h2>2. توزيع الأنشطة حسب المجال</h2>${categories.length?`<div class="report-category-bars">${categories.map(([c,n])=>`<div class="report-category-row"><span>${esc(c)}</span><div class="report-category-track"><div class="report-category-fill" style="width:${Math.round(n/maxCat*100)}%"></div></div><b>${n}</b></div>`).join('')}</div>`:'<p class="report-empty-note">لا توجد بيانات تصنيف.</p>'}<h2>3. أبرز الأنشطة المنجزة</h2>${activitiesHtml}${highlights?`<h2>4. منجزات نوعية</h2><p>${esc(highlights)}</p>`:''}<h2>${highlights?'5':'4'}. قصص النجاح والأثر</h2>${storiesHtml}<h2>${highlights?'6':'5'}. الشراكات والامتداد</h2><p>تم توثيق ${partners.length} جهة أو شريك خلال الفترة${partners.length?'، ومن بينها: '+esc(partners.slice(0,12).join('، ')):'.'}${locations.length?' كما توزعت الأنشطة على '+locations.length+' موقع/فضاء موثق.':''}</p><h2>${highlights?'7':'6'}. صور مختارة من الأنشطة</h2>${galleryHtml}<h2>${highlights?'8':'7'}. التحديات والإكراهات</h2><p>${challenges?esc(challenges):'لم تُسجل ملاحظات خاصة بالتحديات خلال هذه الفترة.'}</p><h2>${highlights?'9':'8'}. التوصيات والآفاق</h2><p>${recs?esc(recs):'الاستمرار في تحسين التوثيق، وتوسيع الشراكات، وربط التخطيط الدوري بمؤشرات النتائج والأثر.'}</p><h2>${highlights?'10':'9'}. خلاصة</h2><p>${esc(conclusion)}</p>`;
    msg.textContent=`تم إنشاء تقرير ${range.label} اعتماداً على ${acts.length} نشاطاً و${stories.length} قصة أثر قابلة للإدراج.`;
  }

  document.getElementById('buildLiteraryReport').addEventListener('click',buildReport);
  document.getElementById('copyFullReport').addEventListener('click',async()=>{const text=document.getElementById('literaryReportPreview').innerText.trim();if(!text)return;try{await navigator.clipboard.writeText(text);document.getElementById('reportBuildMsg').textContent='تم نسخ التقرير.'}catch{document.getElementById('reportBuildMsg').textContent='تعذر النسخ التلقائي.'}});
  document.getElementById('printFullReport').addEventListener('click',()=>{const body=document.getElementById('literaryReportPreview').innerHTML;if(!body||body.includes('اختر الفترة'))return;const w=window.open('','_blank');w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير جمعية نور الأمل</title><style>body{font-family:Arial,Tahoma,sans-serif;max-width:900px;margin:30px auto;line-height:1.8;color:#233}h1{text-align:center}h2{border-bottom:1px solid #ccc;padding-bottom:6px;margin-top:25px}.report-subtitle{text-align:center}.report-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.report-kpi{border:1px solid #ddd;padding:10px;text-align:center;border-radius:8px}.report-kpi b{display:block;font-size:20px}.report-gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.report-gallery img{width:100%;height:150px;object-fit:cover}.report-story{border:1px solid #ddd;padding:12px;margin:8px 0}.report-category-row{display:grid;grid-template-columns:120px 1fr 30px;gap:8px;align-items:center}.report-category-track{height:8px;background:#eee}.report-category-fill{height:100%;background:#555}.report-print-brand{text-align:center}.report-print-brand img{max-width:170px;max-height:100px}@media print{body{margin:0}.no-print{display:none}}</style></head><body>${body}</body></html>`);w.document.close();setTimeout(()=>w.print(),350)});

  async function initExtended(){if(!(await isAdmin()))return;document.getElementById('reportBuildMonth').value=thisMonth();document.getElementById('reportBuildYear').value=thisYear();resetStory();await Promise.all([loadStoryActivities(),loadProgramsMap(),loadStories()]);await loadPeriodNotes()}
  client.auth.onAuthStateChange(()=>initExtended());initExtended();
})();