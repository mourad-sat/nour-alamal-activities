const SUPABASE_URL='https://eabplnfgisdnlylwqrkb.supabase.co';
const SUPABASE_KEY='sb_publishable_Z7p9pwNVhzehV_ebSTMGCA_S0szQ4yF';
const client=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);
const loginView=$('loginView'),adminView=$('adminView'),logoutBtn=$('logoutBtn'),loginForm=$('loginForm');

function escapeHtml(v=''){return String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function showAdmin(on){loginView?.classList.toggle('hidden',on);adminView?.classList.toggle('hidden',!on);logoutBtn?.classList.toggle('hidden',!on)}
function localDateValue(d=new Date()){const z=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`}
async function uploadImage(file,folder){if(!file)return null;if(file.size>5*1024*1024)throw new Error('الصورة أكبر من 5MB');const ext=(file.name.split('.').pop()||'jpg').toLowerCase();const path=`${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;const {error}=await client.storage.from('site-media').upload(path,file,{cacheControl:'3600',upsert:false});if(error)throw error;return client.storage.from('site-media').getPublicUrl(path).data.publicUrl}

window.getCurrentAdminProfile=async function(){
  const {data:{user}}=await client.auth.getUser();if(!user)return null;
  let {data,error}=await client.from('admins').select('user_id,email,role').eq('user_id',user.id).maybeSingle();
  if(!error&&data)return data;
  const claim=await client.rpc('claim_admin_invite');
  if(claim.error||claim.data!==true)return null;
  ({data,error}=await client.from('admins').select('user_id,email,role').eq('user_id',user.id).maybeSingle());
  return !error?data:null;
};
async function isAdmin(){return !!(await window.getCurrentAdminProfile())}

let bootPromise=null;
let readyUserId=null;

async function boot(){
  if(bootPromise)return bootPromise;
  bootPromise=(async()=>{
    const profile=await window.getCurrentAdminProfile();
    const ok=!!profile;
    showAdmin(ok);
    if(!ok){
      window.currentAdminProfile=null;
      readyUserId=null;
      return;
    }
    window.currentAdminProfile=profile;
    if(readyUserId!==profile.user_id){
      readyUserId=profile.user_id;
      window.dispatchEvent(new CustomEvent('admin-auth-ready',{detail:{profile}}));
    }
  })();
  try{return await bootPromise}finally{bootPromise=null}
}

loginForm?.addEventListener('submit',async e=>{
  e.preventDefault();const msg=$('loginMsg');msg.textContent='جارٍ التحقق...';
  const {error}=await client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
  if(error){msg.textContent='تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور.';return}
  const profile=await window.getCurrentAdminProfile();
  if(!profile){await client.auth.signOut();msg.textContent='هذا الحساب لا يملك صلاحية الإدارة.';return}
  msg.textContent='';await boot();
});
$('resetPasswordBtn')?.addEventListener('click',async()=>{const email=$('email').value.trim(),msg=$('loginMsg');if(!email){msg.textContent='أدخل البريد الإلكتروني أولاً.';return}const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.href});msg.textContent=error?'تعذر إرسال رابط الاسترجاع.':'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك.'});
logoutBtn?.addEventListener('click',async()=>{readyUserId=null;window.currentAdminProfile=null;await client.auth.signOut();location.href='admin.html'});
$('tabs')?.addEventListener('click',e=>{const b=e.target.closest('button[data-tab]');if(!b||b.disabled)return;document.querySelectorAll('#tabs button[data-tab]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.tab-panel[data-panel]').forEach(p=>p.classList.toggle('hidden',p.dataset.panel!==b.dataset.tab))});

client.auth.onAuthStateChange((_event,session)=>{
  if(session)boot();
  else{readyUserId=null;window.currentAdminProfile=null;showAdmin(false)}
});
boot();
