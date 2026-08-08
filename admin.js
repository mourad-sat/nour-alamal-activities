const SUPABASE_URL='https://eabplnfgisdnlylwqrkb.supabase.co';
const SUPABASE_KEY='sb_publishable_Z7p9pwNVhzehV_ebSTMGCA_S0szQ4yF';
const client=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const loginView=document.getElementById('loginView');
const adminView=document.getElementById('adminView');
const logoutBtn=document.getElementById('logoutBtn');
const loginForm=document.getElementById('loginForm');
const postForm=document.getElementById('postForm');
const postsList=document.getElementById('postsList');
const formMsg=document.getElementById('formMsg');
let cache=[];

function showAdmin(on){loginView.classList.toggle('hidden',on);adminView.classList.toggle('hidden',!on);logoutBtn.classList.toggle('hidden',!on)}
function localDateValue(d=new Date()){const z=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`}
function resetForm(){postForm.reset();document.getElementById('postId').value='';document.getElementById('published').checked=true;document.getElementById('publishedAt').value=localDateValue();document.getElementById('formTitle').textContent='منشور جديد';formMsg.textContent=''}

async function isAdmin(){const {data:{user}}=await client.auth.getUser();if(!user)return false;const {data,error}=await client.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();return !error&&!!data}
async function boot(){const ok=await isAdmin();showAdmin(ok);if(ok){resetForm();await loadPosts()}}

loginForm.addEventListener('submit',async e=>{e.preventDefault();const msg=document.getElementById('loginMsg');msg.textContent='جارٍ التحقق...';const email=document.getElementById('email').value.trim();const password=document.getElementById('password').value;const {error}=await client.auth.signInWithPassword({email,password});if(error){msg.textContent='تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور.';return}if(!(await isAdmin())){await client.auth.signOut();msg.textContent='هذا الحساب ليس ضمن مديري الموقع.';return}msg.textContent='';showAdmin(true);resetForm();await loadPosts()});
logoutBtn.addEventListener('click',async()=>{await client.auth.signOut();showAdmin(false)});

async function loadPosts(){postsList.innerHTML='<p>جارٍ التحميل...</p>';const {data,error}=await client.from('posts').select('*').order('published_at',{ascending:false});if(error){postsList.innerHTML='<p>تعذر تحميل المنشورات.</p>';return}cache=data||[];postsList.innerHTML=cache.length?cache.map(p=>`<article class="post-item"><div class="post-top"><div><h3>${escapeHtml(p.title)}</h3><small>${new Date(p.published_at).toLocaleString('ar-MA')}</small></div><span class="status ${p.published?'published':'draft'}">${p.published?'منشور':'مسودة'}</span></div><div class="post-actions"><button data-edit="${p.id}">تعديل</button><button data-toggle="${p.id}" class="secondary">${p.published?'إخفاء':'نشر'}</button><button data-delete="${p.id}" class="danger">حذف</button></div></article>`).join(''):'<p>لا توجد منشورات بعد.</p>'}
function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

postForm.addEventListener('submit',async e=>{e.preventDefault();formMsg.textContent='جارٍ الحفظ...';const id=document.getElementById('postId').value;const payload={title:document.getElementById('title').value.trim(),excerpt:document.getElementById('excerpt').value.trim(),content:document.getElementById('content').value.trim(),category:document.getElementById('category').value,image_url:document.getElementById('imageUrl').value.trim()||null,published:document.getElementById('published').checked,published_at:new Date(document.getElementById('publishedAt').value).toISOString()};let error;if(id){({error}=await client.from('posts').update(payload).eq('id',id))}else{({error}=await client.from('posts').insert(payload))}if(error){formMsg.textContent='حدث خطأ أثناء الحفظ.';return}formMsg.textContent='تم الحفظ بنجاح.';resetForm();await loadPosts()});

document.getElementById('newBtn').addEventListener('click',()=>{resetForm();window.scrollTo({top:0,behavior:'smooth'})});document.getElementById('cancelBtn').addEventListener('click',resetForm);document.getElementById('refreshBtn').addEventListener('click',loadPosts);
postsList.addEventListener('click',async e=>{const edit=e.target.dataset.edit,toggle=e.target.dataset.toggle,del=e.target.dataset.delete;if(edit){const p=cache.find(x=>String(x.id)===String(edit));if(!p)return;document.getElementById('postId').value=p.id;document.getElementById('title').value=p.title||'';document.getElementById('excerpt').value=p.excerpt||'';document.getElementById('content').value=p.content||'';document.getElementById('category').value=p.category||'community';document.getElementById('imageUrl').value=p.image_url||'';document.getElementById('published').checked=!!p.published;document.getElementById('publishedAt').value=localDateValue(new Date(p.published_at));document.getElementById('formTitle').textContent='تعديل المنشور';window.scrollTo({top:0,behavior:'smooth'})}if(toggle){const p=cache.find(x=>String(x.id)===String(toggle));if(!p)return;await client.from('posts').update({published:!p.published}).eq('id',p.id);await loadPosts()}if(del){if(!confirm('هل تريد حذف هذا المنشور نهائياً؟'))return;await client.from('posts').delete().eq('id',del);await loadPosts()}});

client.auth.onAuthStateChange(()=>boot());boot();