(function(){
  const tabs=document.getElementById('tabs');
  const adminView=document.getElementById('adminView');
  const loginForm=document.getElementById('loginForm');
  if(!tabs||!adminView||!loginForm)return;
  if(document.querySelector('#tabs button[data-tab="managers"]'))return;

  // Allow invited users to claim their role after signing in.
  isAdmin=async function(){
    const {data:{user}}=await client.auth.getUser();
    if(!user)return false;
    let {data,error}=await client.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();
    if(!error&&data)return true;
    const claim=await client.rpc('claim_admin_invite');
    if(claim.error||claim.data!==true)return false;
    ({data,error}=await client.from('admins').select('user_id').eq('user_id',user.id).maybeSingle());
    return !error&&!!data;
  };

  // Signup is only useful for an email previously invited by an existing admin.
  if(!document.getElementById('invitedSignupBtn')){
    const signup=document.createElement('button');
    signup.type='button';
    signup.id='invitedSignupBtn';
    signup.className='secondary full';
    signup.textContent='إنشاء حساب مدير مدعو';
    const reset=document.getElementById('resetPasswordBtn');
    reset?.insertAdjacentElement('afterend',signup);
    signup.addEventListener('click',async()=>{
      const email=document.getElementById('email').value.trim().toLowerCase();
      const password=document.getElementById('password').value;
      const msg=document.getElementById('loginMsg');
      if(!email||password.length<6){msg.textContent='أدخل البريد المدعو وكلمة مرور من 6 أحرف على الأقل.';return}
      msg.textContent='جارٍ إنشاء الحساب...';
      const {data,error}=await client.auth.signUp({email,password});
      if(error){msg.textContent=error.message?.toLowerCase().includes('already')?'الحساب موجود بالفعل. استخدم زر دخول.':'تعذر إنشاء الحساب. تحقق من البيانات وحاول مجدداً.';return}
      if(data.session){
        if(await isAdmin()){msg.textContent='تم إنشاء حساب المدير وتفعيل الصلاحية.';await boot()}
        else{await client.auth.signOut();msg.textContent='هذا البريد غير مدعو لإدارة الموقع.'}
      }else{
        msg.textContent='تم إنشاء الحساب. أكّد البريد الإلكتروني إن طُلب ذلك، ثم ارجع وسجّل الدخول بنفس البريد.';
      }
    });
  }

  const tab=document.createElement('button');
  tab.dataset.tab='managers';
  tab.textContent='المديرون';
  tabs.appendChild(tab);

  const panel=document.createElement('section');
  panel.className='tab-panel hidden';
  panel.dataset.panel='managers';
  panel.innerHTML=`
    <div class="admin-grid">
      <section class="panel editor">
        <span class="badge">صلاحيات الإدارة</span>
        <h2>إضافة مدير جديد</h2>
        <p>أدخل بريد الشخص الذي تريد منحه صلاحية إدارة الموقع. لا ترسل أو تطلب كلمة مروره.</p>
        <form id="managerInviteForm">
          <label>البريد الإلكتروني للمدير الجديد<input id="managerEmail" type="email" required autocomplete="off" placeholder="name@example.com"></label>
          <button type="submit">إضافة المدير</button>
          <p id="managerMsg" class="msg"></p>
        </form>
        <div class="admin-help"><b>كيف يدخل المدير الجديد؟</b><ol><li>يفتح صفحة لوحة الإدارة.</li><li>يكتب نفس البريد الذي أضفته هنا وكلمة مرور يختارها بنفسه.</li><li>يضغط «إنشاء حساب مدير مدعو» إذا لم يكن لديه حساب.</li><li>بعد تأكيد البريد إن طُلب، يسجل الدخول وتُفعّل الصلاحية تلقائياً.</li></ol></div>
      </section>
      <section class="panel list-panel">
        <div class="list-head"><div><h2>مديرو الموقع</h2><p>الحسابات المفعلة والدعوات التي تنتظر إنشاء الحساب.</p></div><button id="managersRefresh" class="secondary">تحديث</button></div>
        <div id="managersList" class="posts-list"><p>جارٍ التحميل...</p></div>
      </section>
    </div>`;
  adminView.appendChild(panel);

  const style=document.createElement('style');
  style.textContent=`.admin-help{margin-top:18px;padding:16px;border-radius:16px;background:#f3f9f8;color:#3a524f;font-size:12px}.admin-help b{display:block;margin-bottom:7px}.admin-help ol{margin:0;padding-right:20px}.manager-email{direction:ltr;text-align:left;font-family:system-ui,sans-serif}.manager-self{font-size:10px;color:#0f766e;font-weight:800;margin-right:7px}.manager-row .post-top{align-items:center}`;
  document.head.appendChild(style);

  let currentUserId=null;

  function managerStatusLabel(status){return status==='active'?'مدير مفعّل':'دعوة معلّقة'}

  async function loadManagers(){
    const box=document.getElementById('managersList');
    if(!box)return;
    box.innerHTML='<p>جارٍ التحميل...</p>';
    const {data:{user}}=await client.auth.getUser();
    currentUserId=user?.id||null;
    const {data,error}=await client.rpc('admin_list_members');
    if(error){box.innerHTML='<div class="empty">تعذر تحميل قائمة المديرين.</div>';return}
    const rows=data||[];
    box.innerHTML=rows.length?rows.map(m=>{
      const self=!!m.user_id&&m.user_id===currentUserId;
      return `<article class="post-item manager-row"><div class="post-top"><div><h3 class="manager-email">${escapeHtml(m.email||'')}</h3><small>${m.status==='active'?'لديه صلاحية كاملة لدخول لوحة الإدارة':'لم يفعّل حساب الإدارة بعد'}${self?'<span class="manager-self"> · حسابك الحالي</span>':''}</small></div><span class="status ${m.status==='active'?'published':'draft'}">${managerStatusLabel(m.status)}</span></div><div class="post-actions">${self?'<button class="secondary" disabled>لا يمكن إزالة حسابك</button>':`<button class="danger" data-manager-remove="${escapeHtml(m.email||'')}">${m.status==='active'?'إزالة الصلاحية':'إلغاء الدعوة'}</button>`}</div></article>`;
    }).join(''):'<div class="empty">لا توجد حسابات إدارة.</div>';
  }

  document.getElementById('managerInviteForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const email=document.getElementById('managerEmail').value.trim().toLowerCase();
    const msg=document.getElementById('managerMsg');
    msg.textContent='جارٍ إضافة المدير...';
    const {data,error}=await client.rpc('admin_add_member',{target_email:email});
    if(error){msg.textContent='تعذر إضافة المدير. تحقق من البريد وحاول مجدداً.';return}
    const messages={already_admin:'هذا البريد مدير بالفعل.',activated:'تمت إضافة المدير مباشرة لأن لديه حساباً مسجلاً.',invited:'تمت إضافة الدعوة. على المدير الجديد إنشاء حساب بنفس هذا البريد.'};
    msg.textContent=messages[data]||'تمت العملية بنجاح.';
    document.getElementById('managerEmail').value='';
    await loadManagers();
  });

  document.getElementById('managersRefresh')?.addEventListener('click',loadManagers);
  document.getElementById('managersList')?.addEventListener('click',async e=>{
    const email=e.target.dataset.managerRemove;
    if(!email)return;
    if(!confirm(`هل تريد إزالة صلاحية الإدارة عن ${email}؟`))return;
    const {error}=await client.rpc('admin_remove_member',{target_email:email});
    const msg=document.getElementById('managerMsg');
    if(error){msg.textContent=error.message?.includes('cannot_remove_self')?'لا يمكنك إزالة صلاحية حسابك الحالي.':'تعذر إزالة المدير.';return}
    msg.textContent='تم تحديث صلاحيات الإدارة.';
    await loadManagers();
  });

  async function initManagers(){if(await isAdmin())await loadManagers()}
  client.auth.onAuthStateChange(()=>initManagers());
  initManagers();
})();

if(!document.querySelector('script[data-report-extended]')){
  const extended=document.createElement('script');
  extended.src='admin-reports-extended.js?v=20260808-2247';
  extended.dataset.reportExtended='1';
  document.body.appendChild(extended);
}