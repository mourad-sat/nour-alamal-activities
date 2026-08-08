(function(){
  const VERSION='20260809-0100';
  const modules=[
    ['managers-v2','admin-managers-v2.js'],
    ['advanced','admin-advanced.js'],
    ['finance','admin-finance.js'],
    ['dashboard','admin-dashboard.js'],
    ['tasks','admin-tasks.js'],
    ['technical-cards','admin-technical-cards.js'],
    ['technical-export','admin-technical-cards-export.js'],
    ['technical-form-actions','admin-technical-cards-form-actions.js'],
    ['reports-extended','admin-reports-extended.js'],
    ['report-official','admin-report-official.js'],
    ['report-analytics','admin-report-analytics.js'],
    ['finance-reports','admin-finance-reports.js'],
    ['story-privacy','admin-story-privacy.js'],
    ['integrated-suite','admin-suite.js']
  ];
  window.ADMIN_BUILD_VERSION=VERSION;
  function load(name,src){return new Promise(resolve=>{if(document.querySelector(`script[data-admin-module="${name}"]`)){resolve();return}const s=document.createElement('script');s.src=`${src}?v=${VERSION}`;s.dataset.adminModule=name;s.onload=()=>resolve();s.onerror=()=>{console.error('تعذر تحميل وحدة الإدارة:',src);resolve()};document.body.appendChild(s)})}
  async function bootModules(){for(const [name,src] of modules)await load(name,src);document.documentElement.dataset.adminBuild=VERSION;window.dispatchEvent(new CustomEvent('admin-modules-ready',{detail:{version:VERSION}}))}
  bootModules();
})();