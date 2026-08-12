(function(){
  const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const $=id=>document.getElementById(id);
  const monthNames=['يناير','فبراير','مارس','أبريل','ماي','يونيو','يوليوز','غشت','شتنبر','أكتوبر','نونبر','دجنبر'];

  const profiles={
    'لقاء أو ندوة':{duration:'2–3 ساعات',team:'منسق النشاط + منشط/ضيف',resources:'قاعة، جهاز عرض، حاسوب، مكبر صوت، أوراق تسجيل، استمارات تقييم',steps:['الاستقبال والتسجيل','تقديم موضوع اللقاء وأهدافه','مداخلة أو عرض تفاعلي','نقاش وأسئلة المشاركين','خلاصة وتوصيات وتقييم سريع'],indicators:['عدد المشاركين','نسبة التفاعل والمشاركة','عدد التوصيات أو المخرجات العملية']},
    'تكويني':{duration:'3–4 ساعات',team:'مؤطر متخصص + مساعد تربوي',resources:'قاعة تكوين، حاسوب وجهاز عرض، أوراق عمل، أدوات تطبيقية حسب الموضوع',steps:['تشخيص قبلي سريع','عرض مبسط للمفاهيم','تمرين أو تطبيق موجه','إنجاز فردي أو جماعي','تقويم ختامي وتغذية راجعة'],indicators:['عدد المستفيدين الذين أتموا الورشة','جودة الأعمال التطبيقية','نتائج التقويم القبلي/البعدي']},
    'رقمي':{duration:'3–5 ساعات',team:'مؤطر رقمي + مساعد تقني',resources:'حواسيب أو هواتف، اتصال بالإنترنت، جهاز عرض، حسابات/برامج لازمة، ملفات تدريب',steps:['تقديم الأداة أو المهارة','شرح عملي خطوة بخطوة','تطبيق موجه','مشروع صغير من إنجاز المستفيدين','عرض الأعمال والتقويم'],indicators:['عدد الأعمال الرقمية المنجزة','نسبة إتمام التطبيق','قدرة المستفيد على إعادة تنفيذ المهمة مستقلاً']},
    'ثقافي':{duration:'2–4 ساعات',team:'منشط ثقافي + فريق التنظيم',resources:'فضاء مناسب، مواد ثقافية أو فنية، صوتيات عند الحاجة، أوراق وأدوات تعبير',steps:['تهيئة الفضاء واستقبال المشاركين','تقديم النشاط وقواعد المشاركة','تنفيذ الفقرات الثقافية/الفنية','مشاركة إنتاجات المستفيدين','اختتام وتوثيق النشاط'],indicators:['عدد المشاركين','عدد المساهمات أو العروض','رضا المشاركين']},
    'اجتماعي':{duration:'نصف يوم',team:'منسق اجتماعي + متطوعون',resources:'لوائح المستفيدين، مواد الدعم حسب المبادرة، وسائل نقل عند الحاجة، وسائل توثيق',steps:['تحديد الفئة والحاجيات','تنظيم فريق المتطوعين','تنفيذ التدخل الميداني','توثيق المستفيدين والنتائج','تقييم العملية والمتابعة'],indicators:['عدد المستفيدين المباشرين','حجم المساهمات أو الخدمات المقدمة','عدد المتطوعين المشاركين']},
    'رياضي':{duration:'3–5 ساعات',team:'منشط رياضي + لجنة تنظيم',resources:'ملعب أو فضاء رياضي، كرات ومعدات، ماء، حقيبة إسعافات أولية، لائحة المشاركين',steps:['التسجيل وتقسيم الفرق','إحماء وتعليمات السلامة','تنفيذ المباريات أو التحديات','إعلان النتائج والتتويج','تقييم وتوثيق النشاط'],indicators:['عدد المشاركين والفرق','احترام قواعد السلامة والروح الرياضية','نسبة إتمام البرنامج الرياضي']},
    'حملة':{duration:'نصف يوم إلى يوم',team:'منسق الحملة + متطوعون',resources:'ملصقات ومطويات، لافتات، وسائل تواصل، سترات/شارات، أدوات ميدانية حسب الموضوع',steps:['تحديد الرسالة والفئة المستهدفة','تقسيم الأدوار والمسارات','تنفيذ الحملة ميدانياً ورقمياً','تجميع المعطيات والتفاعل','توثيق النتائج واستخلاص التوصيات'],indicators:['عدد الأشخاص الذين تم الوصول إليهم','عدد نقاط/فضاءات التدخل','حجم التفاعل أو الإحالات الناتجة عن الحملة']},
    'زيارة ميدانية':{duration:'نصف يوم',team:'مؤطر مرافق + مسؤول الجهة المستقبلة',resources:'ترتيبات الزيارة، موافقات، لائحة المشاركين، نقل عند الحاجة، بطاقات ملاحظة',steps:['التهيئة القبلية وتوضيح أهداف الزيارة','الاستقبال والتعريف بالمؤسسة','جولة ميدانية وشرح مهني','أسئلة وملاحظات المستفيدين','خلاصة وتقويم بعد العودة'],indicators:['عدد المستفيدين المشاركين','عدد المهن/الخدمات التي تم التعرف عليها','جودة خلاصات المشاركين بعد الزيارة']},
    'معرض':{duration:'يوم واحد',team:'لجنة تنظيم + مؤطرون + مستفيدون',resources:'أروقة وطاولات، لوحات عرض، تجهيزات صوتية، بطاقات تعريف، وسائل توثيق',steps:['اختيار المشاريع/الأروقة','إعداد الفضاء والهوية البصرية','استقبال الزوار وتقديم الأعمال','تنظيم عروض قصيرة أو لقاءات','تقييم المشاركة وتوثيق المعرض'],indicators:['عدد المشاريع المعروضة','عدد الزوار','عدد فرص التواصل أو الشراكات الناتجة']},
    'مسابقة':{duration:'3–5 ساعات',team:'لجنة تنظيم + لجنة تحكيم',resources:'قواعد المسابقة، أوراق/أجهزة حسب المجال، شبكة تنقيط، جوائز أو شهادات',steps:['شرح القواعد والمعايير','تكوين الفرق أو استقبال المشاركات','تنفيذ التحدي ضمن الزمن المحدد','عرض الأعمال والتحكيم','إعلان النتائج والتغذية الراجعة'],indicators:['عدد المشاركات','جودة الأعمال وفق شبكة التحكيم','نسبة إتمام التحدي']},
    'رحلة':{duration:'يوم واحد',team:'منسق الرحلة + مرافقون',resources:'وسيلة نقل، تراخيص، لائحة المشاركين، حقيبة إسعاف، ماء ووسائل توثيق',steps:['إعداد برنامج الرحلة والتراخيص','تجمع المشاركين وتعليمات السلامة','تنفيذ الزيارة والأنشطة المبرمجة','فترة تبادل وتجربة جماعية','عودة وتقييم وتوثيق'],indicators:['عدد المشاركين','الالتزام بالبرنامج والسلامة','مستوى رضا المشاركين']},
    'تحسيسي':{duration:'2–3 ساعات',team:'منشط + متدخل متخصص عند الحاجة',resources:'عرض مبسط، مطويات، فيديوهات أو ملصقات، استبيان قصير',steps:['استكشاف معارف المشاركين','تقديم الرسائل الأساسية','أنشطة تفاعلية أو حالات واقعية','أسئلة وتصحيح المفاهيم','تقويم الرسائل المكتسبة'],indicators:['عدد المشاركين','تحسن المعرفة بعد النشاط','عدد التعهدات أو السلوكات المستهدفة']}
  };

  const titleOverrides={
    'حملة استقطاب المنقطعين عن الدراسة':{resources:'مطويات التسجيل، استمارات إحالة، هواتف للتواصل، خرائط الأحياء، سترات تعريفية، قاعدة بيانات للتتبع',indicators:['عدد الشباب الذين تم التواصل معهم','عدد طلبات التسجيل','عدد الحالات التي استكملت التوجيه أو الالتحاق']},
    'أيام التوجيه والاستقبال':{duration:'يومان',resources:'مكتب استقبال، استمارات تسجيل وتوجيه، مطويات المسارات، حاسوب، فضاء للمقابلات الفردية',indicators:['عدد المستفيدين المستقبَلين','عدد ملفات التوجيه المكتملة','نسبة المستفيدين الذين تم ربطهم بمسار مناسب']},
    'اختبارات تحديد المستوى والميول':{duration:'نصف يوم إلى يوم',resources:'اختبارات مطبوعة أو رقمية، أوراق إجابة، أقلام، حواسيب عند الحاجة، ملفات فردية للنتائج',steps:['شرح هدف الاختبارات وضمان السرية','تمرير اختبارات المستوى','تمرير استبيان الميول','تصحيح وتجميع النتائج','إعداد بطاقة تشخيص وتوجيه لكل مستفيد'],indicators:['عدد الملفات التشخيصية المكتملة','نسبة حضور المسجلين','عدد توصيات التوجيه الفردية']},
    'ورشة الذكاء الاصطناعي للمبتدئين':{resources:'حواسيب أو هواتف، إنترنت، جهاز عرض، حسابات أدوات AI متاحة، أمثلة وتمارين تطبيقية',indicators:['عدد المشاركين الذين أنجزوا مهمة باستخدام AI','جودة صياغة التعليمات والاستعمال المسؤول','عدد التطبيقات العملية المنتجة']},
    'ملتقى المهن والمسارات المهنية':{duration:'يوم كامل',resources:'أروقة، مطويات التكوين والمهن، بطاقات تعريف المتدخلين، جهاز صوت، شاشات عرض، استمارات توجيه',indicators:['عدد الزوار الشباب','عدد المؤسسات والمهنيين المشاركين','عدد الإحالات نحو تكوين أو تدريب أو فرصة مهنية']},
    'معرض مشاريع المستفيدين':{resources:'طاولات وأروقة، حواسيب وشاشات، لوحات تعريف المشاريع، شهادات مشاركة، وسائل تصوير وتوثيق',indicators:['عدد المشاريع المعروضة','عدد الزوار والشركاء','عدد المشاريع التي تلقت ملاحظات أو فرص متابعة']},
    'المنتدى السنوي لجمعية نور الأمل':{duration:'نصف يوم إلى يوم',resources:'قاعة، تقرير حصيلة، شاشة عرض، ملفات الشركاء، بطاقات دعوة، سجل حضور، تجهيزات صوتية',indicators:['عدد الشركاء والحاضرين','عدد فرص التعاون أو الالتزامات الجديدة','اعتماد توصيات للسنة الموالية']}
  };

  function getProfile(r){
    const base=profiles[r.category]||profiles['تكويني'];
    const ov=titleOverrides[r.title]||{};
    return {...base,...ov,steps:ov.steps||base.steps,indicators:ov.indicators||base.indicators};
  }

  function formatDate(v){if(!v)return 'غير محدد';try{return new Date(v+'T12:00:00').toLocaleDateString('ar-MA',{year:'numeric',month:'long',day:'numeric'})}catch{return v}}
  function val(v,fallback='غير محدد'){return v&&String(v).trim()?String(v).trim():fallback}
  function infoCell(label,value){return `<div class="cell"><span>${esc(label)}</span><b>${esc(value)}</b></div>`}
  function list(items){return `<ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`}

  async function openCard(id){
    const {data:r,error}=await client.from('annual_activity_plan').select('*').eq('id',id).maybeSingle();
    if(error||!r){alert('تعذر تحميل بيانات البطاقة التقنية.');return}
    const p=getProfile(r);
    const period=r.period_label||([r.start_date,r.end_date].filter(Boolean).map(formatDate).join(' — ')||'غير محدد');
    const budget=Number(r.estimated_budget||0).toLocaleString('ar-MA',{maximumFractionDigits:2})+' درهم';
    const w=window.open('','_blank');if(!w){alert('يرجى السماح بالنوافذ المنبثقة لفتح البطاقة التقنية.');return}
    w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>البطاقة التقنية - ${esc(r.title)}</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet"><style>
      *{box-sizing:border-box}body{font-family:Cairo,Arial,sans-serif;background:#eef4f2;margin:0;color:#17312d}.page{width:210mm;min-height:297mm;margin:12px auto;background:white;padding:16mm 15mm;box-shadow:0 8px 30px #0002}.head{border-bottom:4px solid #0f766e;padding-bottom:12px;margin-bottom:18px;display:flex;justify-content:space-between;gap:15px;align-items:flex-start}.brand{font-weight:800;color:#0f766e;font-size:18px}.tag{background:#e9f5f2;color:#0f766e;padding:6px 10px;border-radius:999px;font-weight:700;font-size:12px}h1{font-size:25px;margin:7px 0 0;line-height:1.5}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0}.cell{border:1px solid #d7e5e1;border-radius:10px;padding:9px 11px}.cell span{display:block;font-size:11px;color:#69807b;margin-bottom:3px}.cell b{font-size:13px}.section{margin:15px 0}.section h2{font-size:15px;color:#0f766e;margin:0 0 7px;border-right:4px solid #0f766e;padding-right:8px}.box{border:1px solid #dbe7e4;border-radius:10px;padding:11px 13px;line-height:1.9;font-size:13px}.box ul{margin:0;padding-right:20px}.box li{margin:4px 0}.footer{margin-top:24px;padding-top:12px;border-top:1px solid #dbe7e4;display:flex;justify-content:space-between;color:#6c807c;font-size:11px}.printbar{width:210mm;margin:12px auto 0;display:flex;gap:8px}.printbar button{font-family:Cairo;border:0;border-radius:9px;padding:9px 15px;cursor:pointer;font-weight:700}.primary{background:#0f766e;color:#fff}.secondary{background:#fff;border:1px solid #cadbd7!important}@media print{body{background:white}.printbar{display:none}.page{margin:0;box-shadow:none;width:auto;min-height:auto;padding:12mm}}
    </style></head><body><div class="printbar"><button class="primary" onclick="window.print()">طباعة / حفظ PDF</button><button class="secondary" onclick="window.close()">إغلاق</button></div><main class="page"><div class="head"><div><div class="brand">جمعية نور الأمل</div><h1>البطاقة التقنية للنشاط<br>${esc(r.title)}</h1></div><span class="tag">${esc(r.category||'نشاط')}</span></div>
      <div class="meta">${infoCell('السنة',String(r.year||''))}${infoCell('المحور / المجال',val(r.axis))}${infoCell('الفترة',period)}${infoCell('المدة المقترحة',p.duration)}${infoCell('المكان',val(r.location,'يحدد حسب البرمجة'))}${infoCell('الفئة المستهدفة',val(r.target_group))}${infoCell('المسؤول عن التنفيذ',val(r.responsible,'فريق جمعية نور الأمل'))}${infoCell('الشركاء',val(r.partners,'حسب الحاجة'))}${infoCell('الميزانية التقديرية',budget)}${infoCell('الحالة',({planned:'مبرمج',in_progress:'قيد التنفيذ',completed:'منجز',postponed:'مؤجل',cancelled:'ملغى'}[r.status]||val(r.status)))}</div>
      <section class="section"><h2>الهدف العام</h2><div class="box">${esc(val(r.objectives,'تنفيذ النشاط بما يحقق أهداف الجمعية ويستجيب لحاجيات الفئة المستهدفة.'))}</div></section>
      <section class="section"><h2>النتائج المنتظرة</h2><div class="box">${esc(val(r.expected_results,'تحقيق مشاركة فعالة ومخرجات قابلة للتوثيق والمتابعة.'))}</div></section>
      <section class="section"><h2>فريق التنفيذ</h2><div class="box">${esc(p.team)}</div></section>
      <section class="section"><h2>الوسائل والموارد المطلوبة</h2><div class="box">${esc(p.resources)}</div></section>
      <section class="section"><h2>مراحل التنفيذ</h2><div class="box">${list(p.steps)}</div></section>
      <section class="section"><h2>مؤشرات الإنجاز والتقييم</h2><div class="box">${list(p.indicators)}</div></section>
      <section class="section"><h2>التوثيق والمتابعة</h2><div class="box">لائحة حضور، صور النشاط، مخرجات أو أعمال المشاركين، ملاحظات فريق التنفيذ، وتقرير موجز يوضح النتائج والصعوبات والتوصيات.</div></section>
      ${r.notes?`<section class="section"><h2>ملاحظات خاصة</h2><div class="box">${esc(r.notes)}</div></section>`:''}
      <div class="footer"><span>جمعية نور الأمل — البرمجة السنوية للأنشطة</span><span>بطاقة تقنية قابلة للتحديث من بيانات النشاط</span></div></main></body></html>`);w.document.close();
  }

  function enhance(){
    const listBox=$('annualList');if(!listBox)return;
    listBox.querySelectorAll('[data-annual-edit]').forEach(edit=>{
      const id=edit.dataset.annualEdit;const actions=edit.closest('.annual-actions');if(!actions||actions.querySelector(`[data-tech-card="${id}"]`))return;
      const b=document.createElement('button');b.type='button';b.dataset.techCard=id;b.className='secondary';b.textContent='بطاقة تقنية';actions.insertBefore(b,edit);
    });
  }

  function init(){
    const listBox=$('annualList');if(!listBox)return;
    enhance();
    new MutationObserver(enhance).observe(listBox,{childList:true,subtree:true});
    listBox.addEventListener('click',e=>{const b=e.target.closest('[data-tech-card]');if(b){e.preventDefault();e.stopPropagation();openCard(b.dataset.techCard)}});
  }

  window.addEventListener('admin-auth-ready',()=>setTimeout(init,100));
  if(window.currentAdminProfile)setTimeout(init,100);
})();