(function(){
  const tabs=document.getElementById('tabs');
  const adminView=document.getElementById('adminView');
  if(!tabs||!adminView)return;

  const tab=document.createElement('button');
  tab.dataset.tab='registration';
  tab.textContent='التسجيل';
  tabs.appendChild(tab);

  const panel=document.createElement('section');
  panel.className='tab-panel hidden';
  panel.dataset.panel='registration';
  panel.innerHTML=`
    <section class="panel settings-panel">
      <div class="list-head">
        <div><span class="badge">برنامج الفرصة الثانية</span><h2>إدارة التسجيل</h2><p>تحكم في حالة التسجيل ومحتوى البطاقة الظاهرة في الصفحة الرئيسية.</p></div>
        <span id="registrationStatusBadge" class="status draft">...</span>
      </div>
      <form id="registrationForm">
        <label class="check"><input id="registrationOpen" type="checkbox"> التسجيل مفتوح حالياً</label>
        <div class="two">
          <label>الموسم الدراسي<input id="registrationYear" placeholder="2026/2027"></label>
          <label>رابط التسجيل<input id="registrationLink" type="url" placeholder="https://..."></label>
        </div>
        <label>عنوان البرنامج<input id="registrationTitle" maxlength="180"></label>
        <div class="two">
          <label>الجملة الرئيسية<input id="registrationHookTitle" maxlength="180"></label>
          <label>الجملة المرافقة<input id="registrationHookText" maxlength="220"></label>
        </div>
        <label>النص التعريفي<textarea id="registrationDescription" rows="5"></textarea></label>
        <div class="two">
          <label>الهاتف الأول<input id="registrationPhone1" placeholder="066..."></label>
          <label>الهاتف الثاني<input id="registrationPhone2" placeholder="065..."></label>
        </div>
        <label>رسالة أسفل البطاقة<textarea id="registrationNote" rows="3"></textarea></label>
        <label>مزايا البرنامج<textarea id="registrationBenefits" rows="8" placeholder="العنوان|الوصف\nالعنوان الثاني|الوصف الثاني"></textarea><small>كل ميزة في سطر مستقل. افصل عنوان الميزة عن الوصف بعلامة |</small></label>
        <div class="actions"><button type="submit">حفظ إعدادات التسجيل</button><button type="button" id="registrationReload" class="secondary">إعادة التحميل</button></div>
        <p id="registrationMsg" class="msg"></p>
      </form>
    </section>`;
  adminView.appendChild(panel);

  const ids={
    registration_open:'registrationOpen',registration_year:'registrationYear',registration_link:'registrationLink',registration_title:'registrationTitle',registration_hook_title:'registrationHookTitle',registration_hook_text:'registrationHookText',registration_description:'registrationDescription',registration_phone_1:'registrationPhone1',registration_phone_2:'registrationPhone2',registration_note:'registrationNote',registration_benefits:'registrationBenefits'
  };

  function setStatus(open){
    const badge=document.getElementById('registrationStatusBadge');
    if(!badge)return;
    badge.textContent=open?'التسجيل مفتوح':'التسجيل مغلق';
    badge.className='status '+(open?'published':'draft');
  }

  async function loadRegistrationAdmin(){
    if(!(await isAdmin()))return;
    const keys=Object.keys(ids);
    const {data,error}=await client.from('site_settings').select('key,value').in('key',keys);
    const msg=document.getElementById('registrationMsg');
    if(error){if(msg)msg.textContent='تعذر تحميل إعدادات التسجيل.';return}
    const map=Object.fromEntries((data||[]).map(r=>[r.key,r.value]));
    for(const [key,id] of Object.entries(ids)){
      const el=document.getElementById(id);if(!el)continue;
      if(key==='registration_open')el.checked=map[key]==='true';else el.value=map[key]||'';
    }
    setStatus(map.registration_open==='true');
    if(msg)msg.textContent='';
  }

  document.getElementById('registrationForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const msg=document.getElementById('registrationMsg');msg.textContent='جارٍ الحفظ...';
    const rows=Object.entries(ids).map(([key,id])=>{
      const el=document.getElementById(id);
      return {key,value:key==='registration_open'?String(el.checked):el.value.trim()};
    });
    const {error}=await client.from('site_settings').upsert(rows,{onConflict:'key'});
    if(error){msg.textContent='تعذر حفظ إعدادات التسجيل.';return}
    setStatus(document.getElementById('registrationOpen').checked);
    msg.textContent='تم حفظ إعدادات التسجيل بنجاح.';
  });

  document.getElementById('registrationReload').addEventListener('click',loadRegistrationAdmin);
  client.auth.onAuthStateChange(()=>loadRegistrationAdmin());
  loadRegistrationAdmin();
})();

if(!document.querySelector('script[src="admin-managers.js"]')){
  const managersScript=document.createElement('script');
  managersScript.src='admin-managers.js';
  document.body.appendChild(managersScript);
}