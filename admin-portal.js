const SUPABASE_URL='https://eabplnfgisdnlylwqrkb.supabase.co';
const SUPABASE_KEY='sb_publishable_Z7p9pwNVhzehV_ebSTMGCA_S0szQ4yF';
const client=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);
const roleLabels={super_admin:'مدير عام',treasurer:'أمين المال',reports_manager:'مسؤول التقارير',content_manager:'مسؤول المحتوى'};
const websiteRoles=new Set(['super_admin','content_manager']);

async function getProfile(){
  const {data:{user}}=await client.auth.getUser();if(!user)return null;
  let {data,error}=await client.from('admins').select('user_id,email,role').eq('user_id',user.id).maybeSingle();
  if(!error&&data)return data;
  const claim=await client.rpc('claim_admin_invite');if(claim.error||claim.data!==true)return null;
  ({data,error}=await client.from('admins').select('user_id,email,role').eq('user_id',user.id).maybeSingle());return !error?data:null;
}

function show(login){$('portalLogin').classList.toggle('hidden',!login);$('portalHome').classList.toggle('hidden',login);$('portalLogout').classList.toggle('hidden',login)}
async function loadBrand(){const {data}=await client.from('site_settings').select('key,value').in('key',['logo_url']);const logo=(data||[]).find(x=>x.key==='logo_url')?.value;if(logo){$('portalLogo').src=logo;$('portalLogo').classList.remove('hidden')}}

async function boot(){
  const profile=await getProfile();if(!profile){show(true);return}show(false);$('portalEmail').textContent=profile.email||'';$('portalRole').textContent=roleLabels[profile.role]||profile.role;
  const siteCard=$('websitePortalCard');const canWebsite=websiteRoles.has(profile.role);siteCard.classList.toggle('portal-disabled',!canWebsite);siteCard.setAttribute('aria-disabled',canWebsite?'false':'true');const link=siteCard.querySelector('a');if(link){if(canWebsite){link.href='website-admin.html';link.removeAttribute('tabindex')}else{link.removeAttribute('href');link.tabIndex=-1}}
  $('websiteAccessNote').textContent=canWebsite?'إدارة المنشورات والبرامج والصور والرسائل والهوية.':'هذا القسم مخصص للمدير العام ومسؤول المحتوى.';
  const denied=new URLSearchParams(location.search).get('denied');if(denied==='website'){$('portalNotice').textContent='حسابك لا يملك صلاحية الدخول إلى تدبير الموقع الإلكتروني.';$('portalNotice').classList.remove('hidden')}
  await loadBrand();
}

$('portalLoginForm').addEventListener('submit',async e=>{e.preventDefault();const msg=$('portalLoginMsg');msg.textContent='جارٍ التحقق...';const {error}=await client.auth.signInWithPassword({email:$('portalLoginEmail').value.trim(),password:$('portalLoginPassword').value});if(error){msg.textContent='تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور.';return}const p=await getProfile();if(!p){await client.auth.signOut();msg.textContent='هذا الحساب لا يملك صلاحية الإدارة.';return}msg.textContent='';await boot()});
$('portalReset').addEventListener('click',async()=>{const email=$('portalLoginEmail').value.trim(),msg=$('portalLoginMsg');if(!email){msg.textContent='أدخل البريد الإلكتروني أولاً.';return}const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.href});msg.textContent=error?'تعذر إرسال رابط الاسترجاع.':'تم إرسال رابط إعادة تعيين كلمة المرور.'});
$('portalSignup').addEventListener('click',async()=>{const email=$('portalLoginEmail').value.trim().toLowerCase(),password=$('portalLoginPassword').value,msg=$('portalLoginMsg');if(!email||password.length<6){msg.textContent='أدخل البريد المدعو وكلمة مرور من 6 أحرف على الأقل.';return}msg.textContent='جارٍ إنشاء الحساب...';const {data,error}=await client.auth.signUp({email,password});if(error){msg.textContent=error.message?.toLowerCase().includes('already')?'الحساب موجود بالفعل. استخدم تسجيل الدخول.':'تعذر إنشاء الحساب.';return}if(data.session){const p=await getProfile();if(p){msg.textContent='تم تفعيل الحساب.';await boot()}else{await client.auth.signOut();msg.textContent='هذا البريد غير مدعو للإدارة.'}}else msg.textContent='تم إنشاء الحساب. أكّد البريد إذا طُلب ذلك ثم سجل الدخول.'});
$('portalLogout').addEventListener('click',async()=>{await client.auth.signOut();location.href='admin.html'});
client.auth.onAuthStateChange(()=>boot());boot();
