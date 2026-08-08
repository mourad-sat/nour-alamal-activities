(function(){
  let ready=false,decorateTimer=null;
  const esc=window.escapeHtml||((v='')=>String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])));

  function wait(){const form=document.getElementById('storyForm');if(!form){setTimeout(wait,180);return}if(ready)return;ready=true;installNotice(form);document.addEventListener('submit',captureStorySubmit,true);document.getElementById('storiesList')?.addEventListener('click',e=>setTimeout(()=>previewPrivateOnEdit(e),120));new MutationObserver(()=>scheduleDecorate()).observe(document.getElementById('storiesList'),{childList:true,subtree:true});scheduleDecorate()}
  function installNotice(form){if(document.getElementById('storyPrivacyNotice'))return;const n=document.createElement('div');n.id='storyPrivacyNotice';n.style.cssText='padding:10px 12px;border:1px solid #d6e6e3;border-radius:12px;background:#f3f9f8;font-size:10px;color:#49645f;margin:8px 0 12px';n.innerHTML='<b>حماية الصور:</b> الصور الداخلية أو المجهولة تحفظ في التخزين الخاص. الصورة العامة تُستخدم فقط عندما تكون حالة الخصوصية «مسموح في التقرير».';form.querySelector('#storyImageFile')?.closest('label')?.insertAdjacentElement('beforebegin',n)}
  async function privateUpload(file){const {data:{user}}=await client.auth.getUser();if(!user)throw new Error('not_authenticated');const ext=(file.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'');const path=`stories/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext||'bin'}`;const {error}=await client.storage.from('admin-private').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||undefined});if(error)throw error;return path}
  async function removeOldPrivate(path){if(path)await client.storage.from('admin-private').remove([path]).catch(()=>{})}
  async function removePublicIfOwned(url){try{const marker='/storage/v1/object/public/site-media/';if(!url||!url.includes(marker))return;const path=decodeURIComponent(url.split(marker)[1].split('?')[0]);if(path)await client.storage.from('site-media').remove([path])}catch(_){}}
  async function captureStorySubmit(e){
    if(e.target?.id!=='storyForm')return;e.preventDefault();e.stopImmediatePropagation();
    const msg=document.getElementById('storyMsg');msg.textContent='جارٍ الحفظ الآمن...';
    try{
      const id=document.getElementById('storyId').value;let old=null;if(id){const r=await client.from('report_success_stories').select('*').eq('id',id).maybeSingle();old=r.data||null}
      const consent=document.getElementById('storyConsent').value,file=document.getElementById('storyImageFile').files[0],typedUrl=document.getElementById('storyImageUrl').value.trim();let imageUrl=old?.image_url||null,privatePath=old?.private_image_path||null;
      if(file){
        if(consent==='consented'){if(privatePath)await removeOldPrivate(privatePath);privatePath=null;imageUrl=await uploadImage(file,'report-stories-consented')}
        else{if(privatePath)await removeOldPrivate(privatePath);if(imageUrl)await removePublicIfOwned(imageUrl);imageUrl=null;privatePath=await privateUpload(file)}
      }else if(consent==='consented'){
        if(typedUrl)imageUrl=typedUrl;
      }else{
        if(imageUrl){await removePublicIfOwned(imageUrl);imageUrl=null}
      }
      const payload={activity_id:document.getElementById('storyActivity').value?Number(document.getElementById('storyActivity').value):null,story_date:document.getElementById('storyDate').value,title:document.getElementById('storyTitle').value.trim(),beneficiary_label:document.getElementById('storyBeneficiary').value.trim(),age_group:document.getElementById('storyAgeGroup').value.trim(),gender:document.getElementById('storyGender').value,summary:document.getElementById('storySummary').value.trim(),change_observed:document.getElementById('storyChange').value.trim(),quote:document.getElementById('storyQuote').value.trim(),image_url:imageUrl,private_image_path:privatePath,consent_status:consent};
      const r=id?await client.from('report_success_stories').update(payload).eq('id',id):await client.from('report_success_stories').insert(payload);if(r.error)throw r.error;
      document.getElementById('storyForm').reset();document.getElementById('storyId').value='';document.getElementById('storyDate').value=new Date().toISOString().slice(0,10);document.getElementById('storyConsent').value='internal';document.getElementById('storyImagePreview').innerHTML='';document.getElementById('storyImagePreview').classList.add('hidden');document.getElementById('storiesRefresh')?.click();msg.textContent=consent==='consented'?'تم حفظ قصة الأثر والصورة المسموح بها.':'تم حفظ قصة الأثر والصورة في التخزين الخاص.';
    }catch(err){msg.textContent='تعذر الحفظ الآمن: '+(err.message||'خطأ')}
  }
  function scheduleDecorate(){clearTimeout(decorateTimer);decorateTimer=setTimeout(decoratePrivateImages,180)}
  async function decoratePrivateImages(){const list=document.getElementById('storiesList');if(!list)return;const {data}=await client.from('report_success_stories').select('id,title,private_image_path').not('private_image_path','is',null);for(const row of data||[]){const item=list.querySelector(`[data-story-edit="${row.id}"]`)?.closest('.impact-item');if(!item||item.querySelector('[data-private-story-thumb]'))continue;const {data:signed}=await client.storage.from('admin-private').createSignedUrl(row.private_image_path,120);if(!signed?.signedUrl)continue;const img=document.createElement('img');img.src=signed.signedUrl;img.alt=row.title||'صورة داخلية';img.dataset.privateStoryThumb='1';img.title='صورة خاصة — الرابط مؤقت';const top=item.querySelector('.impact-item-top');if(top)top.prepend(img)}}
  async function previewPrivateOnEdit(e){const id=e.target?.dataset?.storyEdit;if(!id)return;const {data}=await client.from('report_success_stories').select('private_image_path').eq('id',id).maybeSingle();if(!data?.private_image_path)return;const {data:signed}=await client.storage.from('admin-private').createSignedUrl(data.private_image_path,120);if(!signed?.signedUrl)return;const p=document.getElementById('storyImagePreview');if(p){p.innerHTML=`<img src="${esc(signed.signedUrl)}" alt="معاينة خاصة"><small style="display:block">صورة خاصة — رابط المعاينة مؤقت</small>`;p.classList.remove('hidden')}}
  wait();
})();