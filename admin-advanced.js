(function(){
  const tabs=document.getElementById('tabs');
  const adminView=document.getElementById('adminView');
  if(!tabs||!adminView)return;

  const messagesTab=document.createElement('button');
  messagesTab.dataset.tab='messages';
  messagesTab.textContent='الرسائل';
  const brandingTab=document.createElement('button');
  brandingTab.dataset.tab='branding';
  brandingTab.textContent='الهوية والواجهة';
  tabs.append(messagesTab,brandingTab);

  const messagesPanel=document.createElement('section');
  messagesPanel.className='tab-panel hidden';
  messagesPanel.dataset.panel='messages';
  messagesPanel.innerHTML=`<section class="panel"><div class="list-head"><div><h2>رسائل الموقع</h2><p>الرسائل المرسلة من نموذج «تواصل معنا».</p></div><button id="messagesRefresh" class="secondary">تحديث</button></div><div id="messagesStats" class="message-stats"></div><div id="messagesList" class="messages-list"><p>جارٍ التحميل...</p></div></section>`;

  const brandingPanel=document.createElement('section');
  brandingPanel.className='tab-panel hidden';
  brandingPanel.dataset.panel='branding';
  brandingPanel.innerHTML=`<div class="admin-grid"><section class="panel editor"><h2>هوية الجمعية</h2><form id="brandingForm"><label>شعار الجمعية<input id="brandingLogoFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label><label>أو رابط/مسار الشعار<input id="brandingLogoUrl" type="text" inputmode="url" placeholder="https://... أو assets/logo.svg"></label><div id="brandingLogoPreview" class="image-preview hidden"></div><hr class="sep"><h2>الواجهة الرئيسية</h2><label>العبارة القصيرة<input id="heroBadge" maxlength="100"></label><label>العنوان الرئيسي<input id="heroTitle" maxlength="220"></label><label>النص التعريفي<textarea id="heroText" rows="5" maxlength="700"></textarea></label><label>صورة الواجهة<input id="heroImageFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label><label>أو رابط/مسار الصورة<input id="heroImageUrl" type="text" inputmode="url" placeholder="https://... أو assets/image.webp"></label><div id="heroImagePreview" class="image-preview hidden"></div><button type="submit">حفظ الهوية والواجهة</button><p id="brandingMsg" class="msg"></p></form></section><section class="panel"><h2>معاينة سريعة</h2><div class="brand-preview"><div id="brandPreviewLogo" class="brand-preview-logo">ن</div><span id="brandPreviewBadge" class="badge">جمعية نور الأمل</span><h3 id="brandPreviewTitle">نحو فرص جديدة للتعلم والتأهيل والاندماج</h3><p id="brandPreviewText"></p><img id="brandPreviewHero" class="brand-preview-hero" alt="معاينة صورة الواجهة"></div></section></div>`;

  adminView.append(messagesPanel,brandingPanel);

  const style=document.createElement('style');
  style.textContent=`.messages-list{display:grid;gap:12px}.message-item{border:1px solid #dce8e6;border-radius:16px;padding:16px;background:#fff}.message-item.new{border-right:5px solid #0f766e}.message-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.message-item h3{margin:0 0 4px;font-size:16px}.message-item .meta{font-size:12px;color:#718682}.message-item .body{white-space:pre-wrap;background:#f7faf9;border-radius:12px;padding:12px;margin:12px 0;color:#314b48}.message-actions{display:flex;gap:8px;flex-wrap:wrap}.message-actions a,.message-actions button{font-size:11px;padding:7px 10px}.message-actions a{border-radius:10px;background:#0f766e;color:#fff;text-decoration:none;font-weight:800}.message-stats{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.message-stats span{background:#eef5f4;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:800}.sep{border:0;border-top:1px solid #e2ecea;margin:24px 0}.brand-preview{display:grid;gap:14px}.brand-preview-logo{width:82px;height:82px;border-radius:22px;background:#e5f4f2;color:#0f766e;display:grid;place-items:center;font-size:36px;font-weight:800;overflow:hidden}.brand-preview-logo img{width:100%;height:100%;object-fit:contain}.brand-preview h3{font-size:26px;margin:0}.brand-preview p{margin:0}.brand-preview-hero{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:18px;border:1px solid #dce8e6}`;
  document.head.appendChild(style);

  let messagesCache=[];

  function statusLabel(status){return ({new:'جديدة',read:'مقروءة',replied:'تم الرد',archived:'مؤرشفة'})[status]||status}

  async function loadMessages(){
    const box=document.getElementById('messagesList');
    if(!box)return;
    box.innerHTML='<p>جارٍ التحميل...</p>';
    const {data,error}=await client.from('contact_messages').select('*').order('created_at',{ascending:false});
    if(error){box.innerHTML='<p>تعذر تحميل الرسائل.</p>';return}
    messagesCache=data||[];
    const stats=document.getElementById('messagesStats');
    if(stats){const counts=['new','read','replied','archived'].map(s=>[s,messagesCache.filter(x=>x.status===s).length]);stats.innerHTML=counts.map(([s,n])=>`<span>${statusLabel(s)}: ${n}</span>`).join('')}
    box.innerHTML=messagesCache.length?messagesCache.map(m=>`<article class="message-item ${m.status==='new'?'new':''}"><div class="message-head"><div><h3>${escapeHtml(m.subject||'بدون موضوع')}</h3><div class="meta">${escapeHtml(m.name)} · ${escapeHtml(m.email)} · ${new Date(m.created_at).toLocaleString('ar-MA')}</div></div><span class="status ${m.status==='new'?'published':'draft'}">${statusLabel(m.status)}</span></div><div class="body">${escapeHtml(m.message)}</div><div class="message-actions"><a href="mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent('Re: '+(m.subject||''))}">الرد بالبريد</a><button data-msg-read="${m.id}" class="secondary">مقروءة</button><button data-msg-replied="${m.id}" class="secondary">تم الرد</button><button data-msg-archive="${m.id}" class="secondary">أرشفة</button><button data-msg-delete="${m.id}" class="danger">حذف</button></div></article>`).join(''):'<div class="empty">لا توجد رسائل حتى الآن.</div>';
  }

  document.getElementById('messagesRefresh')?.addEventListener('click',loadMessages);
  document.getElementById('messagesList')?.addEventListener('click',async e=>{
    const id=e.target.dataset.msgRead||e.target.dataset.msgReplied||e.target.dataset.msgArchive||e.target.dataset.msgDelete;
    if(!id)return;
    if(e.target.dataset.msgDelete){if(!confirm('هل تريد حذف هذه الرسالة نهائياً؟'))return;await client.from('contact_messages').delete().eq('id',id)}
    else{const status=e.target.dataset.msgRead?'read':e.target.dataset.msgReplied?'replied':'archived';await client.from('contact_messages').update({status}).eq('id',id)}
    await loadMessages();
  });

  function setPreview(map){
    document.getElementById('heroBadge').value=map.hero_badge||'';
    document.getElementById('heroTitle').value=map.hero_title||'';
    document.getElementById('heroText').value=map.hero_text||'';
    document.getElementById('brandingLogoUrl').value=map.logo_url||'';
    document.getElementById('heroImageUrl').value=map.hero_image_url||'';
    document.getElementById('brandPreviewBadge').textContent=map.hero_badge||'جمعية نور الأمل';
    document.getElementById('brandPreviewTitle').textContent=map.hero_title||'';
    document.getElementById('brandPreviewText').textContent=map.hero_text||'';
    const logoBox=document.getElementById('brandPreviewLogo');
    logoBox.innerHTML=map.logo_url?`<img src="${escapeHtml(map.logo_url)}" alt="الشعار">`:'ن';
    const hero=document.getElementById('brandPreviewHero');
    hero.src=map.hero_image_url||'';
  }

  async function loadBranding(){
    const {data,error}=await client.from('site_settings').select('key,value').in('key',['logo_url','hero_image_url','hero_badge','hero_title','hero_text']);
    if(error)return;
    setPreview(Object.fromEntries((data||[]).map(x=>[x.key,x.value])));
  }

  document.getElementById('brandingLogoFile')?.addEventListener('change',e=>{
    const f=e.target.files[0];if(!f)return;
    document.getElementById('brandingLogoUrl').value='';
    const u=URL.createObjectURL(f);
    document.getElementById('brandingLogoPreview').innerHTML=`<img src="${u}" alt="معاينة الشعار">`;
    document.getElementById('brandingLogoPreview').classList.remove('hidden');
  });
  document.getElementById('heroImageFile')?.addEventListener('change',e=>{
    const f=e.target.files[0];if(!f)return;
    document.getElementById('heroImageUrl').value='';
    const u=URL.createObjectURL(f);
    document.getElementById('heroImagePreview').innerHTML=`<img src="${u}" alt="معاينة الواجهة">`;
    document.getElementById('heroImagePreview').classList.remove('hidden');
  });

  document.getElementById('brandingForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const msg=document.getElementById('brandingMsg');msg.textContent='جارٍ الحفظ...';
    try{
      let logo=document.getElementById('brandingLogoUrl').value.trim();
      let hero=document.getElementById('heroImageUrl').value.trim();
      const logoFile=document.getElementById('brandingLogoFile').files[0];
      const heroFile=document.getElementById('heroImageFile').files[0];
      if(logoFile)logo=await uploadImage(logoFile,'branding');
      if(heroFile)hero=await uploadImage(heroFile,'branding');
      const rows=[
        {key:'logo_url',value:logo||''},
        {key:'hero_image_url',value:hero||''},
        {key:'hero_badge',value:document.getElementById('heroBadge').value.trim()},
        {key:'hero_title',value:document.getElementById('heroTitle').value.trim()},
        {key:'hero_text',value:document.getElementById('heroText').value.trim()}
      ];
      const {error}=await client.from('site_settings').upsert(rows,{onConflict:'key'});if(error)throw error;
      msg.textContent='تم حفظ الهوية والواجهة بنجاح.';await loadBranding();
    }catch(err){msg.textContent='تعذر الحفظ: '+(err.message||'خطأ')}
  });

  async function initAdvanced(){const ok=await isAdmin();if(!ok)return;await Promise.all([loadMessages(),loadBranding()])}
  client.auth.onAuthStateChange(()=>initAdvanced());
  initAdvanced();
})();

if(!document.querySelector('script[src="admin-registration.js"]')){
  const registrationScript=document.createElement('script');
  registrationScript.src='admin-registration.js';
  document.body.appendChild(registrationScript);
}