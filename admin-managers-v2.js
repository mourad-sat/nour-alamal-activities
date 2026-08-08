(function(){
  const roleLabels={super_admin:'مدير عام',treasurer:'أمين المال',reports_manager:'مسؤول التقارير',content_manager:'مسؤول المحتوى'};
  const tabs=document.getElementById('tabs'),adminView=document.getElementById('adminView'),loginForm=document.getElementById('loginForm');
  if(!tabs||!adminView||!loginForm)return;

  window.getCurrentAdminProfile=async function(){
    const {data:{user}}=await client.auth.getUser();
    if(!user)return null;
    let {data}=await client.from('admins').select('user_id,email,role').eq('user_id',user.id).maybeSingle();
    if(data)return data;
    const claim=await client.rpc('claim_admin_invite');
    if(claim.error||claim.data!==true)return null;
    ({data}=await client.from('admins').select('user_id,email,role').eq('user_id',user.id).maybeSingle());
    return data||null;
  };
  window.isAdmin=async function(){return !!(await window.getCurrentAdminProfile())};

  if(!document.getElementById('invitedSignupBtn')){
    const b=document.createElement('button');b.type='button';b.id='invitedSignupBtn';b.className='secondary full';b.textContent='إنشاء حساب مدير مدعو';
    document.getElementById('resetPasswordBtn')?.insertAdjacentElement('afterend',b);
    b.addEventListener('click',async()=>{
      const email=document.getElementById('email').value.trim().toLowerCase(),password=document.getElementById('password').value,msg=document.getElementById('loginMsg');
      if(!email||password.length<6){msg.textContent='أدخل البريد المدعو وكلمة مرور من 6 أحرف على الأقل.';return}
      msg.textContent='جارٍ إنشاء الحساب...';
      const {data,error}=await client.auth.signUp({email,password});
      if(error){msg.textContent=error.message?.toLowerCase().includes('already')?'الحساب موجود بالفعل. استخدم زر دخول.':'تعذر إنشاء الحساب.';return}
      if(data.session){if(await isAdmin()){msg.textContent='تم تفعيل الحساب والصلاحية.';location.reload()}else{await client.auth.signOut();msg.textContent='هذا البريد غير مدعو للإدارة.'}}
      else msg.textContent='تم إنشاء الحساب. أكّد البريد إذا طُلب ذلك ثم سجل الدخول.';
    });
  }

  async function build(){
    const profile=await getCurrentAdminProfile();
    if(!profile||profile.role!=='super_admin')return;
    if(document.querySelector('#tabs button[data-tab="managers"]'))return;
    const tab=document.createElement('button');tab.dataset.tab='managers';tab.textContent='المديرون والصلاحيات';tabs.appendChild(tab);
    const panel=document.createElement('section');panel.className='tab-panel hidden';panel.dataset.panel='managers';panel.innerHTML=`
      <div class="admin-grid">
        <section class="panel editor"><span class="badge">إدارة الوصول</span><h2>إضافة مستخدم إداري</h2><p>حدد البريد والدور. كل دور يرى ويعدل فقط الأقسام المخصصة له.</p>
          <form id="managerInviteFormV2"><label>البريد الإلكتروني<input id="managerEmailV2" type="email" required autocomplete="off" placeholder="name@example.com"></label>
            <label>الدور<select id="managerRoleV2"><option value="content_manager">مسؤول المحتوى</option><option value="reports_manager">مسؤول التقارير</option><option value="treasurer">أمين المال</option><option value="super_admin">مدير عام</option></select></label>
            <button type="submit">إضافة المستخدم</button><p id="managerMsgV2" class="msg"></p>
          </form>
          <div class="role-help"><b>توزيع الصلاحيات</b><p><strong>مدير عام:</strong> جميع الأقسام والإعدادات. <strong>أمين المال:</strong> المالية والحكامة. <strong>مسؤول التقارير:</strong> التقارير والبطاقات التقنية. <strong>مسؤول المحتوى:</strong> الموقع والمحتوى والهوية.</p></div>
        </section>
        <section class="panel list-panel"><div class="list-head"><div><h2>المستخدمون الإداريون</h2><p>يمكن تغيير الدور دون حذف الحساب.</p></div><button id="managersRefreshV2" type="button" class="secondary">تحديث</button></div><div id="managersListV2" class="posts-list"><p>جارٍ التحميل...</p></div></section>
      </div>`;adminView.appendChild(panel);
    const st=document.createElement('style');st.textContent=`.role-help{margin-top:18px;padding:14px;border:1px solid #dce8e6;border-radius:14px;background:#f4f9f8;font-size:11px;color:#45615d}.manager-v2-row select{min-width:150px;padding:7px 9px}.manager-v2-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px}.manager-v2-email{direction:ltr;text-align:left;font-family:system-ui,sans-serif}.manager-role-pill{display:inline-flex;padding:4px 9px;border-radius:999px;background:#e8f4f2;color:#0f766e;font-size:10px;font-weight:800}`;document.head.appendChild(st);

    async function load(){
      const box=document.getElementById('managersListV2');box.innerHTML='<p>جارٍ التحميل...</p>';
      const {data,error}=await client.rpc('admin_list_members_v2');if(error){box.innerHTML='<div class="empty">تعذر تحميل المستخدمين.</div>';return}
      const {data:{user}}=await client.auth.getUser();
      box.innerHTML=(data||[]).map(m=>{const self=m.user_id===user?.id;return `<article class="post-item manager-v2-row"><div class="post-top"><div><h3 class="manager-v2-email">${escapeHtml(m.email||'')}</h3><small>${m.status==='active'?'حساب مفعّل':'دعوة في انتظار التفعيل'}${self?' · حسابك الحالي':''}</small></div><span class="manager-role-pill">${roleLabels[m.role]||m.role}</span></div><div class="manager-v2-actions"><select data-manager-role-email="${escapeHtml(m.email||'')}">${Object.entries(roleLabels).map(([v,l])=>`<option value="${v}" ${m.role===v?'selected':''}>${l}</option>`).join('')}</select>${self?'<button class="secondary" disabled>الحساب الحالي</button>':`<button class="danger" data-manager-remove-v2="${escapeHtml(m.email||'')}">${m.status==='active'?'إزالة الصلاحية':'إلغاء الدعوة'}</button>`}</div></article>`}).join('')||'<div class="empty">لا توجد حسابات إدارة.</div>';
    }
    document.getElementById('managerInviteFormV2').addEventListener('submit',async e=>{e.preventDefault();const email=document.getElementById('managerEmailV2').value.trim().toLowerCase(),role=document.getElementById('managerRoleV2').value,msg=document.getElementById('managerMsgV2');msg.textContent='جارٍ الإضافة...';const {data,error}=await client.rpc('admin_add_member_with_role',{target_email:email,target_role:role});if(error){msg.textContent='تعذر إضافة المستخدم.';return}msg.textContent=({already_admin:'هذا البريد موجود بالفعل.',activated:'تم تفعيل المستخدم مباشرة.',invited:'تم إنشاء الدعوة بالدور المحدد.'})[data]||'تمت العملية.';document.getElementById('managerEmailV2').value='';await load()});
    document.getElementById('managersRefreshV2').addEventListener('click',load);
    document.getElementById('managersListV2').addEventListener('change',async e=>{const email=e.target.dataset.managerRoleEmail;if(!email)return;const msg=document.getElementById('managerMsgV2'),role=e.target.value;msg.textContent='جارٍ تحديث الدور...';const {error}=await client.rpc('admin_update_member_role',{target_email:email,target_role:role});msg.textContent=error?(error.message?.includes('cannot_demote_last_super_admin')?'لا يمكن خفض صلاحية آخر مدير عام.':'تعذر تغيير الدور.'):'تم تحديث الدور.';await load()});
    document.getElementById('managersListV2').addEventListener('click',async e=>{const email=e.target.dataset.managerRemoveV2;if(!email)return;if(!confirm(`إزالة صلاحية ${email}؟`))return;const {error}=await client.rpc('admin_remove_member',{target_email:email});document.getElementById('managerMsgV2').textContent=error?'تعذر إزالة الصلاحية.':'تمت إزالة الصلاحية.';await load()});
    await load();
  }
  client.auth.onAuthStateChange(()=>build());build();
})();