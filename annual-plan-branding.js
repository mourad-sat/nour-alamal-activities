(function(){
  let settings={};
  let loaded=false;

  function text(v){return String(v||'').trim()}
  function esc(v=''){return String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function absUrl(v){try{return new URL(v,location.href).href}catch(_e){return v}}

  async function loadSettings(){
    if(loaded)return settings;
    loaded=true;
    try{
      const {data,error}=await client.from('site_settings').select('key,value');
      if(error)throw error;
      settings=Object.fromEntries((data||[]).map(x=>[x.key,x.value]));
    }catch(_e){settings={}}
    window.ANNUAL_DONOR_BRANDING=settings;
    return settings;
  }

  function contactItems(){
    const out=[];
    const address=text(settings.address);
    const email=text(settings.email);
    const phone=text(settings.phone);
    const fallbackPhones=[text(settings.registration_phone_1),text(settings.registration_phone_2)].filter(Boolean);
    if(address)out.push({label:'العنوان',value:address});
    if(email)out.push({label:'البريد الإلكتروني',value:email});
    if(phone)out.push({label:'الهاتف',value:phone});
    else if(fallbackPhones.length)out.push({label:'للتواصل',value:[...new Set(fallbackPhones)].join(' / ')});
    return out;
  }

  function legalItems(){
    const candidates=[
      ['رقم الوصل القانوني','legal_receipt_number'],
      ['رقم الوصل القانوني','receipt_number'],
      ['رقم الوصل','association_receipt'],
      ['ICE','ice'],
      ['RIB','rib']
    ];
    const seen=new Set(),out=[];
    for(const [label,key] of candidates){
      const value=text(settings[key]);
      if(value&&!seen.has(label+value)){seen.add(label+value);out.push({label,value})}
    }
    return out;
  }

  function applyBranding(root){
    if(!root||root.dataset.brandingApplied==='1')return;
    root.dataset.brandingApplied='1';
    const logo=text(settings.logo_url)||'assets/nour-alamal-logo.svg';
    const mark=root.querySelector('.brand-mark');
    if(mark){
      mark.innerHTML=`<img src="${esc(absUrl(logo))}" alt="شعار جمعية نور الأمل" style="width:100%;height:100%;object-fit:contain;background:#fff;border-radius:16px;padding:5px">`;
      mark.style.background='#fff';
      mark.style.border='1px solid #d8e8e4';
    }
    const brandName=root.querySelector('.brand-name');
    if(brandName){
      const b=brandName.querySelector('b');if(b)b.textContent='جمعية نور الأمل';
      const s=brandName.querySelector('span');if(s)s.textContent='NOUR ALAMAL ASSOCIATION';
    }

    const contacts=contactItems();
    const legal=legalItems();
    const info=[...contacts,...legal];
    const coverMain=root.querySelector('.cover-main');
    if(coverMain&&info.length&&!root.querySelector('.donor-official-info')){
      const box=document.createElement('div');
      box.className='donor-official-info';
      box.innerHTML=`<div class="donor-official-title">بيانات الجمعية</div><div class="donor-official-grid">${info.map(x=>`<div><span>${esc(x.label)}</span><b>${esc(x.value)}</b></div>`).join('')}</div>`;
      coverMain.insertAdjacentElement('afterend',box);
    }

    const coverFooter=root.querySelector('.cover-footer');
    if(coverFooter){
      const brief=contacts.map(x=>x.value).filter(Boolean).join(' • ');
      if(brief)coverFooter.innerHTML=`<span>جمعية نور الأمل</span><span>${esc(brief)}</span>`;
    }

    if(!root.querySelector('style[data-donor-branding]')){
      const style=document.createElement('style');
      style.dataset.donorBranding='1';
      style.textContent=`
        #annualDonorPdf .donor-official-info{border:1px solid #d6e7e3;background:#fff;border-radius:16px;padding:13px 15px;margin:0 0 12mm;box-shadow:0 6px 20px rgba(15,118,110,.05)}
        #annualDonorPdf .donor-official-title{font-size:11px;font-weight:800;color:#0f766e;margin-bottom:8px;border-bottom:1px solid #e1ece9;padding-bottom:5px}
        #annualDonorPdf .donor-official-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px 16px}
        #annualDonorPdf .donor-official-grid div{display:flex;gap:7px;align-items:baseline;min-width:0}
        #annualDonorPdf .donor-official-grid span{font-size:8.5px;color:#71847f;white-space:nowrap}
        #annualDonorPdf .donor-official-grid b{font-size:9px;color:#244a45;word-break:break-word}
        #annualDonorPdf .cover-footer{font-size:8.5px;gap:12px;align-items:flex-start}
        #annualDonorPdf .cover-footer span:last-child{text-align:left;direction:ltr;unicode-bidi:plaintext;max-width:60%}
        @media print{#annualDonorPdf .donor-official-info{box-shadow:none}}
      `;
      root.appendChild(style);
    }
  }

  const observer=new MutationObserver(mutations=>{
    for(const m of mutations){
      for(const node of m.addedNodes){
        if(node.nodeType!==1)continue;
        if(node.id==='annualDonorPdf')applyBranding(node);
        else node.querySelector?.('#annualDonorPdf')&&applyBranding(node.querySelector('#annualDonorPdf'));
      }
    }
  });

  function init(){
    loadSettings().finally(()=>{
      const existing=document.getElementById('annualDonorPdf');if(existing)applyBranding(existing);
      observer.observe(document.body,{childList:true,subtree:true});
    });
  }

  window.addEventListener('admin-auth-ready',init,{once:true});
  if(window.currentAdminProfile)init();
})();