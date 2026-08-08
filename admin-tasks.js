(function(){
  const tabs=document.getElementById('tabs');
  const adminView=document.getElementById('adminView');
  if(!tabs||!adminView||document.getElementById('associationTasksPanel'))return;

  const esc=window.escapeHtml||((v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])));
  const today=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`};
  const addDays=n=>{const d=new Date();d.setDate(d.getDate()+n);const p=x=>String(x).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`};
  const typeLabels={task:'مهمة',meeting:'اجتماع',deadline:'أجل/استحقاق',renewal:'تجديد وثيقة',report:'موعد تقرير',partnership_followup:'متابعة شراكة',other:'أخرى'};
  const statusLabels={pending:'في الانتظار',in_progress:'قيد الإنجاز',done:'منجزة',cancelled:'ملغاة'};
  const priorityLabels={low:'منخفضة',normal:'عادية',high:'مرتفعة',urgent:'عاجلة'};
  let tasksCache=[];

  const tab=document.createElement('button');
  tab.dataset.tab='tasks';
  tab.textContent='المهام والمتابعة';
  const dashboardTab=tabs.querySelector('[data-tab="dashboard"]');
  if(dashboardTab?.nextSibling)tabs.insertBefore(tab,dashboardTab.nextSibling);else tabs.prepend(tab);

  const panel=document.createElement('section');
  panel.id='associationTasksPanel';
  panel.className='tab-panel hidden';
  panel.dataset.panel='tasks';
  panel.innerHTML=`
    <div class="tasks-shell">
      <section class="panel tasks-hero">
        <div><span class="badge">المتابعة الداخلية</span><h2>المهام والمواعيد والاستحقاقات</h2><p>تتبع مهام أعضاء الجمعية، الاجتماعات، مواعيد التقارير، تجديد الوثائق ومتابعة الشراكات.</p></div>
        <button id="taskNewTop" type="button">+ مهمة جديدة</button>
      </section>

      <section id="taskStats" class="task-stats">
        <div class="task-stat"><span>متأخرة</span><b>0</b></div><div class="task-stat"><span>اليوم</span><b>0</b></div><div class="task-stat"><span>خلال 7 أيام</span><b>0</b></div><div class="task-stat"><span>قيد الإنجاز</span><b>0</b></div><div class="task-stat"><span>منجزة</span><b>0</b></div>
      </section>

      <div class="admin-grid tasks-grid">
        <section class="panel editor">
          <div class="section-title"><div><span class="badge">إضافة / تعديل</span><h2 id="taskFormTitle">مهمة جديدة</h2></div><button id="taskNewBtn" type="button" class="secondary">+ جديد</button></div>
          <form id="taskForm"><input id="taskId" type="hidden">
            <div class="two"><label>النوع<select id="taskType"><option value="task">مهمة</option><option value="meeting">اجتماع</option><option value="deadline">أجل/استحقاق</option><option value="renewal">تجديد وثيقة</option><option value="report">موعد تقرير</option><option value="partnership_followup">متابعة شراكة</option><option value="other">أخرى</option></select></label><label>الأولوية<select id="taskPriority"><option value="normal">عادية</option><option value="high">مرتفعة</option><option value="urgent">عاجلة</option><option value="low">منخفضة</option></select></label></div>
            <label>العنوان<input id="taskTitle" required maxlength="220" placeholder="مثال: إعداد التقرير الشهري لشهر غشت"></label>
            <label>الوصف<textarea id="taskDescription" rows="4"></textarea></label>
            <div class="three"><label>تاريخ الاستحقاق<input id="taskDueDate" type="date" required></label><label>الوقت (اختياري)<input id="taskDueTime" type="time"></label><label>بدء التنبيه من<input id="taskReminderDate" type="date"></label></div>
            <div class="two"><label>المسؤول / المكلف<input id="taskAssignedTo" maxlength="180" placeholder="الاسم أو الصفة"></label><label>الحالة<select id="taskStatus"><option value="pending">في الانتظار</option><option value="in_progress">قيد الإنجاز</option><option value="done">منجزة</option><option value="cancelled">ملغاة</option></select></label></div>
            <div class="two"><label>القسم المرتبط<select id="taskRelatedSection"><option value="">غير مرتبط</option><option value="reports">التقارير والإحصائيات</option><option value="governance-finance">الإدارة والمالية</option><option value="content">البرامج والأنشطة</option><option value="messages">الرسائل</option><option value="settings">بيانات التواصل</option></select></label><label>مرجع / رقم وثيقة<input id="taskRelatedReference" maxlength="160"></label></div>
            <label>ملاحظات المتابعة<textarea id="taskNotes" rows="3"></textarea></label>
            <div class="actions"><button type="submit">حفظ المهمة</button><button id="taskCancelBtn" type="button" class="secondary">إلغاء</button></div><p id="taskMsg" class="msg"></p>
          </form>
        </section>

        <section class="panel list-panel">
          <div class="list-head"><div><h2>قائمة المهام</h2><p>مرتبة حسب أقرب تاريخ استحقاق.</p></div><button id="tasksRefresh" type="button" class="secondary">تحديث</button></div>
          <div class="three task-filters"><label>الحالة<select id="taskFilterStatus"><option value="active">النشطة</option><option value="">الكل</option><option value="pending">في الانتظار</option><option value="in_progress">قيد الإنجاز</option><option value="done">منجزة</option><option value="cancelled">ملغاة</option></select></label><label>النوع<select id="taskFilterType"><option value="">كل الأنواع</option><option value="task">مهمة</option><option value="meeting">اجتماع</option><option value="deadline">أجل/استحقاق</option><option value="renewal">تجديد وثيقة</option><option value="report">موعد تقرير</option><option value="partnership_followup">متابعة شراكة</option><option value="other">أخرى</option></select></label><label>بحث<input id="taskSearch" type="search" placeholder="عنوان، مسؤول، مرجع..."></label></div>
          <div id="tasksList" class="posts-list"><p>جارٍ التحميل...</p></div>
        </section>
      </div>
    </div>`;
  adminView.appendChild(panel);

  const style=document.createElement('style');
  style.textContent=`
    .tasks-shell{display:grid;gap:18px}.tasks-hero{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.tasks-hero h2{margin:8px 0}.task-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.task-stat{background:#fff;border:1px solid #dce8e6;border-radius:17px;padding:14px}.task-stat span{font-size:10px;color:#718682;display:block;margin-bottom:4px}.task-stat b{font-size:22px;color:#0f766e}.task-card.overdue{border-right:5px solid #b83b32}.task-card.today{border-right:5px solid #d98518}.task-card.upcoming{border-right:5px solid #287b9c}.task-card.done{opacity:.72}.task-card .task-title-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.task-card h3{margin:0 0 4px}.task-meta{display:flex;gap:7px;flex-wrap:wrap;font-size:10px;color:#6d817d;margin-top:7px}.task-pill{display:inline-flex;padding:4px 8px;border-radius:999px;background:#edf4f3;color:#355953;font-size:9px;font-weight:800}.task-pill.urgent{background:#fde9e7;color:#a62e27}.task-pill.high{background:#fff0dd;color:#a05d05}.task-deadline{font-size:11px;font-weight:800}.task-deadline.overdue{color:#b83b32}.task-deadline.today{color:#b56c0b}.task-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.task-actions button{padding:6px 9px;font-size:10px}.dash-task-panel{margin-top:0}.dash-task-list{display:grid;gap:8px}.dash-task-row{display:flex;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid #e0ebe9;border-radius:13px;background:#fff}.dash-task-row.overdue{border-right:4px solid #b83b32}.dash-task-row.today{border-right:4px solid #d98518}.dash-task-row .main strong{display:block;font-size:11px}.dash-task-row .main small{font-size:9px;color:#718682}.dash-task-row .date{font-size:10px;font-weight:800;white-space:nowrap}@media(max-width:900px){.task-stats{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.tasks-hero{flex-direction:column}.task-stats{grid-template-columns:1fr 1fr}.task-title-row{flex-direction:column}}
  `;
  document.head.appendChild(style);

  function dueClass(t){
    if(t.status==='done'||t.status==='cancelled')return t.status==='done'?'done':'';
    const d=t.due_date,td=today();
    if(d<td)return 'overdue';
    if(d===td)return 'today';
    if(d<=addDays(7))return 'upcoming';
    return '';
  }
  function dueLabel(t){
    const c=dueClass(t);if(c==='overdue')return 'متأخرة';if(c==='today')return 'اليوم';if(c==='upcoming')return 'قريبة';return t.status==='done'?'منجزة':t.due_date;
  }
  function resetForm(){
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value='';
    document.getElementById('taskDueDate').value=addDays(1);
    document.getElementById('taskReminderDate').value=today();
    document.getElementById('taskPriority').value='normal';
    document.getElementById('taskStatus').value='pending';
    document.getElementById('taskType').value='task';
    document.getElementById('taskFormTitle').textContent='مهمة جديدة';
    document.getElementById('taskMsg').textContent='';
  }

  function renderStats(){
    const td=today(),week=addDays(7),active=tasksCache.filter(t=>!['done','cancelled'].includes(t.status));
    const overdue=active.filter(t=>t.due_date<td).length;
    const dueToday=active.filter(t=>t.due_date===td).length;
    const upcoming=active.filter(t=>t.due_date>td&&t.due_date<=week).length;
    const inProgress=tasksCache.filter(t=>t.status==='in_progress').length;
    const done=tasksCache.filter(t=>t.status==='done').length;
    document.getElementById('taskStats').innerHTML=`<div class="task-stat"><span>متأخرة</span><b>${overdue}</b></div><div class="task-stat"><span>اليوم</span><b>${dueToday}</b></div><div class="task-stat"><span>خلال 7 أيام</span><b>${upcoming}</b></div><div class="task-stat"><span>قيد الإنجاز</span><b>${inProgress}</b></div><div class="task-stat"><span>منجزة</span><b>${done}</b></div>`;
  }

  function filteredTasks(){
    const status=document.getElementById('taskFilterStatus').value,type=document.getElementById('taskFilterType').value,q=document.getElementById('taskSearch').value.trim().toLowerCase();
    return tasksCache.filter(t=>{
      if(status==='active'&&['done','cancelled'].includes(t.status))return false;
      if(status&&status!=='active'&&t.status!==status)return false;
      if(type&&t.task_type!==type)return false;
      if(q&&!`${t.title} ${t.description} ${t.assigned_to} ${t.related_reference} ${t.notes}`.toLowerCase().includes(q))return false;
      return true;
    });
  }

  function renderList(){
    const box=document.getElementById('tasksList'),rows=filteredTasks();
    box.innerHTML=rows.length?rows.map(t=>{
      const cls=dueClass(t),deadlineCls=cls==='overdue'?'overdue':cls==='today'?'today':'';
      return `<article class="post-item task-card ${cls}"><div class="task-title-row"><div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:5px"><span class="task-pill">${esc(typeLabels[t.task_type]||t.task_type)}</span><span class="task-pill ${esc(t.priority)}">${esc(priorityLabels[t.priority]||t.priority)}</span><span class="task-pill">${esc(statusLabels[t.status]||t.status)}</span></div><h3>${esc(t.title)}</h3><small>${esc(t.description||'')}</small></div><div class="task-deadline ${deadlineCls}">${esc(dueLabel(t))}<br><small>${esc(t.due_date)}${t.due_time?' · '+esc(String(t.due_time).slice(0,5)):''}</small></div></div><div class="task-meta">${t.assigned_to?`<span>👤 ${esc(t.assigned_to)}</span>`:''}${t.related_reference?`<span>🔖 ${esc(t.related_reference)}</span>`:''}${t.reminder_date?`<span>🔔 من ${esc(t.reminder_date)}</span>`:''}</div><div class="task-actions"><button data-task-edit="${t.id}">تعديل</button>${!['done','cancelled'].includes(t.status)?`<button data-task-progress="${t.id}" class="secondary">${t.status==='in_progress'?'إرجاع للانتظار':'بدء الإنجاز'}</button><button data-task-done="${t.id}" class="secondary">✓ تم الإنجاز</button>`:''}<button data-task-delete="${t.id}" class="danger">حذف</button></div></article>`;
    }).join(''):'<div class="empty">لا توجد مهام مطابقة.</div>';
  }

  async function loadTasks(){
    const box=document.getElementById('tasksList');box.innerHTML='<p>جارٍ التحميل...</p>';
    const {data,error}=await client.from('association_tasks').select('*').order('due_date',{ascending:true}).order('priority',{ascending:false});
    if(error){box.innerHTML='<div class="empty">تعذر تحميل المهام.</div>';return}
    tasksCache=data||[];renderStats();renderList();renderDashboardTasks();
  }

  document.getElementById('taskForm').addEventListener('submit',async e=>{
    e.preventDefault();const msg=document.getElementById('taskMsg');msg.textContent='جارٍ الحفظ...';
    const id=document.getElementById('taskId').value;
    const payload={task_type:document.getElementById('taskType').value,title:document.getElementById('taskTitle').value.trim(),description:document.getElementById('taskDescription').value.trim(),priority:document.getElementById('taskPriority').value,status:document.getElementById('taskStatus').value,due_date:document.getElementById('taskDueDate').value,due_time:document.getElementById('taskDueTime').value||null,reminder_date:document.getElementById('taskReminderDate').value||null,assigned_to:document.getElementById('taskAssignedTo').value.trim(),related_section:document.getElementById('taskRelatedSection').value,related_reference:document.getElementById('taskRelatedReference').value.trim(),notes:document.getElementById('taskNotes').value.trim()};
    const {error}=id?await client.from('association_tasks').update(payload).eq('id',id):await client.from('association_tasks').insert(payload);
    if(error){msg.textContent='تعذر حفظ المهمة.';return}resetForm();await loadTasks();msg.textContent='تم حفظ المهمة.';
  });

  document.getElementById('taskNewBtn').addEventListener('click',resetForm);
  document.getElementById('taskNewTop').addEventListener('click',()=>{resetForm();document.getElementById('taskForm').scrollIntoView({behavior:'smooth',block:'start'})});
  document.getElementById('taskCancelBtn').addEventListener('click',resetForm);
  document.getElementById('tasksRefresh').addEventListener('click',loadTasks);
  ['taskFilterStatus','taskFilterType'].forEach(id=>document.getElementById(id).addEventListener('change',renderList));
  document.getElementById('taskSearch').addEventListener('input',renderList);
  document.getElementById('tasksList').addEventListener('click',async e=>{
    const edit=e.target.dataset.taskEdit,progress=e.target.dataset.taskProgress,done=e.target.dataset.taskDone,del=e.target.dataset.taskDelete,id=edit||progress||done||del;if(!id)return;
    const t=tasksCache.find(x=>String(x.id)===String(id));if(!t)return;
    if(edit){document.getElementById('taskId').value=t.id;document.getElementById('taskType').value=t.task_type;document.getElementById('taskTitle').value=t.title||'';document.getElementById('taskDescription').value=t.description||'';document.getElementById('taskPriority').value=t.priority;document.getElementById('taskStatus').value=t.status;document.getElementById('taskDueDate').value=t.due_date||'';document.getElementById('taskDueTime').value=t.due_time?String(t.due_time).slice(0,5):'';document.getElementById('taskReminderDate').value=t.reminder_date||'';document.getElementById('taskAssignedTo').value=t.assigned_to||'';document.getElementById('taskRelatedSection').value=t.related_section||'';document.getElementById('taskRelatedReference').value=t.related_reference||'';document.getElementById('taskNotes').value=t.notes||'';document.getElementById('taskFormTitle').textContent='تعديل المهمة';document.getElementById('taskForm').scrollIntoView({behavior:'smooth',block:'start'});return}
    if(progress){await client.from('association_tasks').update({status:t.status==='in_progress'?'pending':'in_progress'}).eq('id',id);await loadTasks();return}
    if(done){await client.from('association_tasks').update({status:'done'}).eq('id',id);await loadTasks();return}
    if(del&&confirm('هل تريد حذف هذه المهمة نهائياً؟')){await client.from('association_tasks').delete().eq('id',id);await loadTasks()}
  });

  function openTasks(){document.querySelector('#tabs button[data-tab="tasks"]')?.click()}
  function ensureDashboardBlock(){
    const dash=document.querySelector('#mainDashboardPanel .dash-shell');if(!dash||document.getElementById('dashTaskPanel'))return;
    const quick=dash.querySelector('.dash-quick-actions');if(quick&&!quick.querySelector('[data-open-tasks]')){const b=document.createElement('button');b.type='button';b.className='secondary';b.dataset.openTasks='1';b.textContent='المهام والمواعيد';b.addEventListener('click',openTasks);quick.prepend(b)}
    const s=document.createElement('section');s.id='dashTaskPanel';s.className='panel dash-task-panel';s.innerHTML=`<div class="list-head"><div><span class="badge">المهام</span><h3>المهام القريبة والمتأخرة</h3><p>تظهر المهام التي بدأ موعد تنبيهها أو اقترب استحقاقها.</p></div><button id="dashOpenTasks" type="button" class="secondary">فتح المهام</button></div><div id="dashTaskList" class="dash-task-list"><p>جارٍ التحميل...</p></div>`;dash.appendChild(s);document.getElementById('dashOpenTasks').addEventListener('click',openTasks);
  }
  function renderDashboardTasks(){
    ensureDashboardBlock();const box=document.getElementById('dashTaskList');if(!box)return;
    const td=today(),limit=addDays(14);
    const rows=tasksCache.filter(t=>!['done','cancelled'].includes(t.status)&&t.due_date<=limit&&(!t.reminder_date||t.reminder_date<=td)).sort((a,b)=>a.due_date.localeCompare(b.due_date)).slice(0,6);
    box.innerHTML=rows.length?rows.map(t=>{const c=dueClass(t);return `<div class="dash-task-row ${c}"><div class="main"><strong>${esc(t.title)}</strong><small>${esc(typeLabels[t.task_type]||t.task_type)}${t.assigned_to?' · '+esc(t.assigned_to):''}</small></div><div class="date">${c==='overdue'?'متأخرة':c==='today'?'اليوم':esc(t.due_date)}</div></div>`}).join(''):'<div class="empty">لا توجد مهام قريبة تحتاج المتابعة.</div>';
  }

  async function init(){
    const {data:{user}}=await client.auth.getUser();if(!user)return;
    const {data}=await client.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();if(!data)return;
    resetForm();ensureDashboardBlock();await loadTasks();
  }
  client.auth.onAuthStateChange(()=>setTimeout(init,150));
  setTimeout(init,250);
})();
