(function(){
  const VERSION='20260809-0300';
  const space=document.body.dataset.adminSpace||'association';
  const associationStages=[
    [
      ['managers-v2','admin-managers-v2.js'],
      ['finance','admin-finance.js'],
      ['dashboard','admin-dashboard.js'],
      ['tasks','admin-tasks.js'],
      ['technical-cards','admin-technical-cards.js'],
      ['reports-extended','admin-reports-extended.js']
    ],
    [
      ['technical-export','admin-technical-cards-export.js'],
      ['technical-form-actions','admin-technical-cards-form-actions.js'],
      ['report-official','admin-report-official.js'],
      ['report-analytics','admin-report-analytics.js'],
      ['finance-reports','admin-finance-reports.js'],
      ['finance-linker','admin-finance-linker.js'],
      ['story-privacy','admin-story-privacy.js']
    ],
    [
      ['integrated-suite','admin-suite.js'],
      ['export-upgrade','admin-export-upgrade.js']
    ],
    [['workspace-ui','admin-workspace-ui.js']]
  ];
  const websiteStages=[
    [
      ['advanced','admin-advanced.js'],
      ['registration','admin-registration.js']
    ],
    [['public-site-content','admin-public-site-content.js']],
    [['workspace-ui','admin-workspace-ui.js']]
  ];
  const stages=space==='website'?websiteStages:associationStages;
  const external=space==='association' ? [
    ['html2pdf','https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',()=>!!window.html2pdf],
    ['html-docx','https://cdn.jsdelivr.net/npm/html-docx-js@0.3.1/dist/html-docx.js',()=>!!window.htmlDocx]
  ] : [];
  window.ADMIN_BUILD_VERSION=VERSION;
  window.ADMIN_SPACE=space;
  function loadStyle(){const id='admin-space-theme';if(document.getElementById(id))return;const l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href=`${space==='website'?'admin-website-ui.css':'admin-association-ui.css'}?v=${VERSION}`;document.head.appendChild(l)}
  function load(name,src){return new Promise(resolve=>{if(document.querySelector(`script[data-admin-module="${name}"]`)){resolve();return}const s=document.createElement('script');s.src=`${src}?v=${VERSION}`;s.dataset.adminModule=name;s.onload=()=>resolve();s.onerror=()=>{console.error('تعذر تحميل وحدة الإدارة:',src);resolve()};document.body.appendChild(s)})}
  function loadExternal(name,src,test){return new Promise(resolve=>{if(test()){resolve();return}const existing=document.querySelector(`script[data-admin-external="${name}"]`);if(existing){if(test()){resolve();return}existing.addEventListener('load',()=>resolve(),{once:true});existing.addEventListener('error',()=>resolve(),{once:true});return}const s=document.createElement('script');s.src=src;s.dataset.adminExternal=name;s.crossOrigin='anonymous';s.referrerPolicy='no-referrer';s.onload=()=>resolve();s.onerror=()=>{console.warn('تعذر تحميل مكتبة التصدير:',name);resolve()};document.head.appendChild(s)})}
  async function bootModules(){
    loadStyle();
    for(const stage of stages)await Promise.all(stage.map(([name,src])=>load(name,src)));
    document.documentElement.dataset.adminBuild=VERSION;
    document.documentElement.dataset.adminSpace=space;
    window.dispatchEvent(new CustomEvent('admin-modules-ready',{detail:{version:VERSION,space}}));
    Promise.all(external.map(([name,src,test])=>loadExternal(name,src,test))).then(()=>window.dispatchEvent(new CustomEvent('admin-export-libs-ready'))).catch(()=>{});
  }
  bootModules();
})();