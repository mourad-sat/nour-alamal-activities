(function(){
  let tries=0;

  function waitForCards(){
    const root=document.getElementById('technicalCardsPanel');
    if(!root){if(tries++<120)setTimeout(waitForCards,120);return}
    ensureBoxes(root);
    syncFromMessages(root);
    const observer=new MutationObserver(()=>{ensureBoxes(root);syncFromMessages(root)});
    observer.observe(root,{childList:true,subtree:true,characterData:true});
    root.addEventListener('click',e=>handleCardClick(root,e));
  }

  function ensureBoxes(root){
    const pMsg=root.querySelector('#tcProgramMsg');
    if(pMsg&&!root.querySelector('#tcProgramFormExports')){
      const box=document.createElement('div');
      box.id='tcProgramFormExports';
      box.className='tc-form-export-box hidden';
      pMsg.insertAdjacentElement('afterend',box);
    }
    const aMsg=root.querySelector('#tcActivityMsg');
    if(aMsg&&!root.querySelector('#tcActivityFormExports')){
      const box=document.createElement('div');
      box.id='tcActivityFormExports';
      box.className='tc-form-export-box hidden';
      aMsg.insertAdjacentElement('afterend',box);
    }
    if(!document.getElementById('tcFormExportStyles')){
      const style=document.createElement('style');
      style.id='tcFormExportStyles';
      style.textContent=`
        .tc-form-export-box{margin-top:14px;padding:14px;border:1px solid #cfe1de;border-radius:14px;background:#f4faf8}
        .tc-form-export-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}
        .tc-form-export-head strong{font-size:12px;color:#0f766e}.tc-form-export-head span{font-size:10px;color:#718682}
        .tc-form-export-actions{display:flex;gap:8px;flex-wrap:wrap}.tc-form-export-actions button{padding:8px 12px;font-size:10px}
      `;
      document.head.appendChild(style);
    }
  }

  function renderProgram(root,id){
    if(!id)return;
    const box=root.querySelector('#tcProgramFormExports');if(!box)return;
    box.dataset.cardId=String(id);
    box.innerHTML=`<div class="tc-form-export-head"><strong>تم حفظ البطاقة — الإخراج الرسمي جاهز</strong><span>يمكنك معاينتها أو إخراجها الآن.</span></div><div class="tc-form-export-actions"><button type="button" data-tcp-preview="${id}" class="secondary">معاينة</button><button type="button" data-tcp-word="${id}" class="secondary">Word</button><button type="button" data-tcp-pdf="${id}">PDF</button></div>`;
    box.classList.remove('hidden');
  }

  function renderActivity(root,id){
    if(!id)return;
    const box=root.querySelector('#tcActivityFormExports');if(!box)return;
    box.dataset.cardId=String(id);
    box.innerHTML=`<div class="tc-form-export-head"><strong>تم حفظ البطاقة — الإخراج الرسمي جاهز</strong><span>يمكنك معاينتها أو إخراجها الآن.</span></div><div class="tc-form-export-actions"><button type="button" data-tca-preview="${id}" class="secondary">معاينة</button><button type="button" data-tca-word="${id}" class="secondary">Word</button><button type="button" data-tca-pdf="${id}">PDF</button></div>`;
    box.classList.remove('hidden');
  }

  function hideProgram(root){root.querySelector('#tcProgramFormExports')?.classList.add('hidden')}
  function hideActivity(root){root.querySelector('#tcActivityFormExports')?.classList.add('hidden')}

  function syncFromMessages(root){
    const pMsg=root.querySelector('#tcProgramMsg')?.textContent.trim()||'';
    if(pMsg.includes('تم حفظ بطاقة البرنامج')){
      const id=root.querySelector('#tcProgramList [data-tcp-edit]')?.dataset.tcpEdit;
      if(id)renderProgram(root,id);
    }else if(!pMsg||pMsg.includes('جارٍ')||pMsg.includes('تعذر')) hideProgram(root);

    const aMsg=root.querySelector('#tcActivityMsg')?.textContent.trim()||'';
    if(aMsg.includes('تم حفظ بطاقة النشاط')){
      const id=root.querySelector('#tcActivityList [data-tca-edit]')?.dataset.tcaEdit;
      if(id)renderActivity(root,id);
    }else if(!aMsg||aMsg.includes('جارٍ')||aMsg.includes('تعذر')) hideActivity(root);
  }

  function handleCardClick(root,e){
    const pe=e.target.closest('[data-tcp-edit]');
    if(pe){setTimeout(()=>renderProgram(root,pe.dataset.tcpEdit),40);return}
    const ae=e.target.closest('[data-tca-edit]');
    if(ae){setTimeout(()=>renderActivity(root,ae.dataset.tcaEdit),40);return}
    if(e.target.closest('#tcProgramNew,#tcProgramCancel'))hideProgram(root);
    if(e.target.closest('#tcActivityNew,#tcActivityCancel'))hideActivity(root);
  }

  waitForCards();
})();