(function(){
  const panel=document.querySelector('.tab-panel[data-panel="settings"]');
  if(!panel||document.getElementById('publicSiteContentForm'))return;
  const card=document.createElement('section');
  card.className='panel settings-panel';
  card.style.marginTop='18px';
  card.innerHTML=`
    <div class="list-head"><div><span class="badge">الموقع العام</span><h2>المحتوى العام وSEO</h2><p>تعديل «من نحن»، الأثر، وصف محركات البحث وروابط الشبكات الاجتماعية دون تغيير الكود.</p></div><a class="button-link" href="index.html" target="_blank">معاينة الموقع ↗</a></div>
    <form id="publicSiteContentForm">
      <h3 class="form-subtitle">من نحن</h3>
      <label>عنوان القسم<input id="pscAboutTitle" maxlength="220" placeholder="نحو عمل جمعوي يربط الفرصة بالقدرة على التغيير"></label>
      <label>النص التعريفي<textarea id="pscAboutText" rows="4" maxlength="900"></textarea></label>
      <h3 class="form-subtitle">الأثر</h3>
      <label>عنوان قسم الأثر<input id="pscImpactTitle" maxlength="220"></label>
      <label>نص الأثر<textarea id="pscImpactText" rows="4" maxlength="900"></textarea></label>
      <h3 class="form-subtitle">محركات البحث والمشاركة</h3>
      <label>عنوان الموقع في Google والمشاركة<input id="pscSeoTitle" maxlength="70" placeholder="جمعية نور الأمل | تعلم، تأهيل، ابتكار"></label>
      <label>الوصف المختصر<input id="pscSeoDescription" maxlength="170" placeholder="وصف واضح للموقع يظهر في نتائج البحث والمشاركة"></label>
      <h3 class="form-subtitle">الشبكات الاجتماعية</h3>
      <div class="two"><label>Facebook<input id="pscFacebook" type="url" placeholder="https://..."></label><label>Instagram<input id="pscInstagram" type="url" placeholder="https://..."></label></div>
      <div class="two"><label>YouTube<input id="pscYoutube" type="url" placeholder="https://..."></label><label>LinkedIn<input id="pscLinkedin" type="url" placeholder="https://..."></label></div>
      <button type="submit">حفظ محتوى الموقع العام</button><p id="pscMsg" class="msg"></p>
    </form>`;
  panel.appendChild(card);

  const fields={about_title:'pscAboutTitle',about_text:'pscAboutText',impact_title:'pscImpactTitle',impact_text:'pscImpactText',seo_title:'pscSeoTitle',seo_description:'pscSeoDescription',facebook_url:'pscFacebook',instagram_url:'pscInstagram',youtube_url:'pscYoutube',linkedin_url:'pscLinkedin'};
  async function load(){
    const profile=await window.getCurrentAdminProfile?.();if(!profile||!['super_admin','content_manager'].includes(profile.role))return;
    const {data,error}=await client.from('site_settings').select('key,value').in('key',Object.keys(fields));if(error)return;
    const map=Object.fromEntries((data||[]).map(r=>[r.key,r.value]));Object.entries(fields).forEach(([key,id])=>{const el=document.getElementById(id);if(el)el.value=map[key]||''});
  }
  document.getElementById('publicSiteContentForm').addEventListener('submit',async e=>{
    e.preventDefault();const msg=document.getElementById('pscMsg');msg.textContent='جارٍ الحفظ...';
    const rows=Object.entries(fields).map(([key,id])=>({key,value:document.getElementById(id)?.value.trim()||''}));
    const {error}=await client.from('site_settings').upsert(rows,{onConflict:'key'});msg.textContent=error?'تعذر حفظ الإعدادات: '+error.message:'تم حفظ محتوى الموقع العام بنجاح.';
  });
  window.addEventListener('admin-auth-ready',load);load();
})();