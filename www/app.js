const STORAGE_KEY='business_finance_capacitor_v1';

const initialExpenseCategories=[
  {id:'personal',name:'شخصي',children:[
    {id:'cigarettes',name:'سجاير'},{id:'coffee',name:'قهوة'},{id:'food',name:'أكل'},{id:'health',name:'صحة'}
  ]},
  {id:'mostafa',name:'مصطفى',children:[]},
  {id:'zahra',name:'زهره',children:[]},
  {id:'ali',name:'علي',children:[{id:'ali-food',name:'أكل'},{id:'ali-money',name:'فلوس'}]},
  {id:'gaw',name:'الجو',children:[]},
  {id:'wood',name:'خشب',children:[]},
  {id:'fabric',name:'قماش',children:[]},
  {id:'boards',name:'اللواح',children:[]},
  {id:'amr',name:'عمرو الموان',children:[]},
  {id:'misc',name:'نثريات',children:[]},
  {id:'mall-rent',name:'ايجار المول',children:[]},
  {id:'shop-rent',name:'ايجار المحل',children:[]},
  {id:'gardens-rent',name:'ايجار الحدايق',children:[]},
  {id:'heliopolis-flat',name:'شقة مصر الجديدة',children:[
    {id:'flat-rent',name:'إيجار'},{id:'electricity',name:'كهرباء'},{id:'water',name:'مياه'},
    {id:'gas',name:'غاز'},{id:'stairs',name:'مسح سلم'},{id:'trash',name:'زبالة'}
  ]},
  {id:'flat-expenses',name:'مصاريف الشقة',children:[{id:'flat-flex-1',name:'مصروف'}]},
  {id:'motorcycle',name:'موتوسيكل',children:[]},
  {id:'charity',name:'صدقه',children:[]},
  {id:'new-expense',name:'مصروف جديد',children:[{id:'new-expense-child',name:'مصروف'}]}
];

const initialIncomeCategories=[
  {id:'haj-sayed',name:'الحاج سيد',hasRemaining:true},
  {id:'sheikh-hamada',name:'الشيخ حماده',hasRemaining:true},
  {id:'nozha',name:'النزهه',hasRemaining:true},
  {id:'deposit',name:'عربون',hasRemaining:false},
  {id:'delivery-balance',name:'باقي التسليم',hasRemaining:false},
  {id:'interest',name:'فايده',hasRemaining:false}
];

function clone(v){return JSON.parse(JSON.stringify(v))}
function uid(prefix='id'){return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}
function dateKey(d=new Date()){
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function parseDateKey(k){const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d)}
function shiftDate(k,n){const d=parseDateKey(k);d.setDate(d.getDate()+n);return dateKey(d)}
function money(n){
  const x=Number(n)||0;
  return `${new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(x)} ج`;
}
function num(v){const n=Number(v);return Number.isFinite(n)&&n>0?n:0}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function displayDate(k){
  try{return new Intl.DateTimeFormat('ar-EG',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(parseDateKey(k))}
  catch{return k}
}
function displayMonth(k){
  const [y,m]=k.split('-').map(Number);
  try{return new Intl.DateTimeFormat('ar-EG-u-nu-latn',{month:'long',year:'numeric'}).format(new Date(y,m-1,1))}
  catch{return k}
}
function renderMonthCalendar(){
  const [y,m]=state.monthKey.split('-').map(Number);
  const first=new Date(y,m-1,1);
  const daysInMonth=new Date(y,m,0).getDate();
  const offset=(first.getDay()+1)%7;
  const weekdays=['سبت','أحد','اثن','ثلا','أرب','خمي','جمع'];
  const cells=[];
  for(let i=0;i<offset;i++)cells.push('<div class="calendar-day empty-slot"></div>');
  for(let d=1;d<=daysInMonth;d++){
    const key=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const t=totals(key);
    const has=t.exp>0||t.inc>0;
    let cls='cal-empty';
    if(has&&t.inc>t.exp)cls='cal-income';
    else if(has&&t.exp>t.inc)cls='cal-expense';
    else if(has)cls='cal-equal';
    const today=key===dateKey()?' today':'';
    cells.push(`<button class="calendar-day ${cls}${today}" data-action="open-calendar-day" data-date="${key}" aria-label="${key}">
      <span class="day-number">${d}</span>
      ${has?'<span class="day-dot"></span>':''}
    </button>`);
  }
  return `
    <div class="calendar-card">
      <div class="calendar-weekdays">${weekdays.map(w=>`<div class="calendar-weekday">${w}</div>`).join('')}</div>
      <div class="calendar-grid">${cells.join('')}</div>
      <div class="calendar-legend">
        <span><i class="legend-dot income"></i>إيرادات أعلى</span>
        <span><i class="legend-dot expense"></i>مصاريف أعلى</span>
        <span><i class="legend-dot current"></i>اليوم</span>
      </div>
      <div class="calendar-tip">اضغط على أي يوم لفتح اليومية وتعديل بياناته مباشرة</div>
    </div>`;
}

let state={
  screen:'daily',
  dailyType:'expense',
  selectedDate:dateKey(),
  monthKey:dateKey().slice(0,7),
  expenseCategories:clone(initialExpenseCategories),
  incomeCategories:clone(initialIncomeCategories),
  days:{},
  remaining:{},
  openExpenses:{},
  unlocked:{}
};

function load(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw)return;
    const saved=JSON.parse(raw);
    state={...state,...saved,screen:'daily',dailyType:'expense',unlocked:{},openExpenses:{}};
  }catch{}
}
function save(silent=true){
  const payload={
    expenseCategories:state.expenseCategories,
    incomeCategories:state.incomeCategories,
    days:state.days,
    remaining:state.remaining,
    selectedDate:state.selectedDate,
    monthKey:state.monthKey
  };
  localStorage.setItem(STORAGE_KEY,JSON.stringify(payload));
  if(!silent)toast('تم الحفظ بنجاح ✓');
}
function dayData(k=state.selectedDate){
  return state.days[k]||{expenses:{},expenseChildren:{},incomes:{}};
}
function ensureDay(k=state.selectedDate){
  if(!state.days[k]) state.days[k]={expenses:{},expenseChildren:{},incomes:{}};
  if(!state.days[k].expenses) state.days[k].expenses={};
  if(!state.days[k].expenseChildren) state.days[k].expenseChildren={};
  if(!state.days[k].incomes) state.days[k].incomes={};
  return state.days[k];
}
function expenseCatTotal(cat,k=state.selectedDate){
  const day=dayData(k);
  if(cat.children?.length){
    const map=day.expenseChildren?.[cat.id]||{};
    return cat.children.reduce((s,ch)=>s+num(map[ch.id]),0);
  }
  return num(day.expenses?.[cat.id]);
}
function totals(k=state.selectedDate){
  const day=dayData(k);
  const exp=state.expenseCategories.reduce((s,c)=>s+expenseCatTotal(c,k),0);
  const inc=state.incomeCategories.reduce((s,c)=>s+num(day.incomes?.[c.id]),0);
  return {exp,inc,net:inc-exp};
}
function monthStats(){
  let exp=0,inc=0;const expBy={},incBy={};
  Object.keys(state.days).filter(k=>k.startsWith(state.monthKey)).forEach(k=>{
    state.expenseCategories.forEach(c=>{
      const v=expenseCatTotal(c,k);exp+=v;expBy[c.id]=(expBy[c.id]||0)+v;
    });
    const day=dayData(k);
    state.incomeCategories.forEach(c=>{
      const v=num(day.incomes?.[c.id]);inc+=v;incBy[c.id]=(incBy[c.id]||0)+v;
    });
  });
  return {exp,inc,net:inc-exp,expBy,incBy};
}
function toast(msg){
  const old=document.querySelector('.toast');if(old)old.remove();
  const el=document.createElement('div');el.className='toast';el.textContent=msg;document.body.appendChild(el);
  setTimeout(()=>el.remove(),1600);
}
function lockHtml(key){
  const open=!!state.unlocked[key];
  return `<div class="lock-wrap ${open?'open':''}">
    <button class="small-btn lock-btn" data-action="toggle-lock" data-key="${esc(key)}">${open?'🔓':'🔒'}</button>
    <div class="delete-pop"><button class="delete-btn" data-action="delete-confirm" data-key="${esc(key)}">حذف</button></div>
  </div>`;
}

function renderExpenseRows(){
  const day=dayData();
  return state.expenseCategories.map(cat=>{
    const has=cat.children?.length>0;
    const open=!!state.openExpenses[cat.id];
    const total=expenseCatTotal(cat);
    const children=(cat.children||[]).map(ch=>`
      <div class="child-row">
        <input class="input name-input" data-kind="expense-child-name" data-cat="${cat.id}" data-child="${ch.id}" value="${esc(ch.name)}" placeholder="اسم البند">
        <input class="input amount-input" inputmode="decimal" type="number" min="0" data-kind="expense-child-amount" data-cat="${cat.id}" data-child="${ch.id}" value="${esc(day.expenseChildren?.[cat.id]?.[ch.id]??'')}" placeholder="0">
        <button class="small-btn plus-btn" data-action="add-child" data-cat="${cat.id}">+</button>
        ${lockHtml(`child:${cat.id}:${ch.id}`)}
      </div>
    `).join('');
    return `<div class="row-card">
      <div class="main-row">
        <button class="arrow-btn" data-action="toggle-expense" data-cat="${cat.id}">${open?'⌃':'⌄'}</button>
        <input class="input name-input" data-kind="expense-name" data-cat="${cat.id}" value="${esc(cat.name)}">
        <input class="input amount-input ${has?'readonly':''}" ${has?'readonly':''} inputmode="decimal" type="number" min="0"
          data-kind="expense-amount" data-cat="${cat.id}" value="${has?(total?total:''):esc(day.expenses?.[cat.id]??'')}" placeholder="0">
        <button class="small-btn plus-btn" data-action="add-expense-after" data-cat="${cat.id}">+</button>
        ${lockHtml(`expense:${cat.id}`)}
      </div>
      ${open?`<div class="children">${children||`<div class="empty-note">اضغط + لإضافة بند فرعي</div>`}</div>`:''}
    </div>`;
  }).join('');
}
function renderIncomeRows(){
  const day=dayData();
  return state.incomeCategories.map(cat=>`
    <div class="row-card">
      <div class="income-row">
        <input class="input name-input" data-kind="income-name" data-cat="${cat.id}" value="${esc(cat.name)}">
        <input class="input amount-input" inputmode="decimal" type="number" min="0" data-kind="income-amount" data-cat="${cat.id}" value="${esc(day.incomes?.[cat.id]??'')}" placeholder="0">
        <button class="small-btn plus-btn" data-action="add-income">+</button>
        ${lockHtml(`income:${cat.id}`)}
      </div>
      ${cat.hasRemaining?`<div class="remaining">
        <div class="remaining-line">
          <span class="remaining-label">متبقي</span>
          <input class="input amount-input" inputmode="decimal" type="number" min="0" data-kind="remaining" data-cat="${cat.id}" value="${esc(state.remaining[cat.id]??'')}" placeholder="0">
        </div>
        <div class="remaining-note">للمتابعة فقط — لا يدخل في أي عملية حسابية</div>
      </div>`:''}
    </div>
  `).join('');
}
function renderDaily(){
  const t=totals();
  const compare=t.inc===t.exp?'الإيرادات والمصاريف متساوية':t.inc>t.exp?`الإيرادات أعلى بـ ${money(t.inc-t.exp)}`:`المصاريف أعلى بـ ${money(t.exp-t.inc)}`;
  return `
    <div class="datebar">
      <button class="icon-square" data-action="next-day">‹</button>
      <div class="date-center"><div class="date-title">${esc(displayDate(state.selectedDate))}</div><button class="today-link" data-action="today">اليوم</button></div>
      <button class="icon-square" data-action="prev-day">›</button>
    </div>
    <div class="kpis">
      <div class="kpi"><div class="kpi-label">المصاريف</div><div class="kpi-value">${money(t.exp)}</div></div>
      <div class="kpi"><div class="kpi-label">الإيرادات</div><div class="kpi-value">${money(t.inc)}</div></div>
      <div class="kpi"><div class="kpi-label">الصافي</div><div class="kpi-value ${t.net>0?'green':t.net<0?'red':'gold'}">${money(t.net)}</div></div>
    </div>
    <div class="type-tabs">
      <button class="type-tab ${state.dailyType==='expense'?'active':''} ${t.exp>t.inc?'expense-higher':''}" data-action="daily-expense">المصاريف</button>
      <button class="type-tab ${state.dailyType==='income'?'active':''} ${t.inc>t.exp?'income-higher':''}" data-action="daily-income">الإيرادات</button>
    </div>
    ${state.dailyType==='expense'?`
      <div class="section-head"><div><div class="section-title">بنود المصاريف</div><div class="hint">+ للإضافة • 🔒 للحماية من الحذف</div></div><button class="add-top" data-action="add-expense">+</button></div>
      ${renderExpenseRows()}
    `:`
      <div class="section-head"><div><div class="section-title">بنود الإيرادات</div><div class="hint">متبقي = متابعة فقط ولا يدخل في الحساب</div></div><button class="add-top" data-action="add-income">+</button></div>
      ${renderIncomeRows()}
    `}
    <div class="summary">
      <div class="sumline"><span class="sumlabel">${state.dailyType==='expense'?'إجمالي مصاريف اليوم':'إجمالي إيرادات اليوم'}</span><span class="sumvalue">${money(state.dailyType==='expense'?t.exp:t.inc)}</span></div>
      <div class="compare">${compare}</div>
      <button class="save-btn" data-action="save">حفظ اليومية</button>
    </div>
  `;
}
function shiftMonth(delta){
  const [y,m]=state.monthKey.split('-').map(Number);const d=new Date(y,m-1+delta,1);
  state.monthKey=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function renderMonthly(){
  const m=monthStats();
  return `
    <div class="monthbar">
      <button class="icon-square" data-action="next-month">‹</button><div class="month-title">${displayMonth(state.monthKey)}</div><button class="icon-square" data-action="prev-month">›</button>
    </div>
    ${renderMonthCalendar()}
    <div class="kpis">
      <div class="kpi"><div class="kpi-label">المصاريف</div><div class="kpi-value">${money(m.exp)}</div></div>
      <div class="kpi"><div class="kpi-label">الإيرادات</div><div class="kpi-value">${money(m.inc)}</div></div>
      <div class="kpi"><div class="kpi-label">الصافي</div><div class="kpi-value ${m.net>=0?'green':'red'}">${money(m.net)}</div></div>
    </div>
    <div class="section-title">تفصيل المصاريف</div>
    ${state.expenseCategories.map(c=>`<div class="report-row"><span class="report-name">${esc(c.name)}</span><span class="report-value">${money(m.expBy[c.id]||0)}</span></div>`).join('')}
    <div class="section-title" style="margin-top:18px">تفصيل الإيرادات</div>
    ${state.incomeCategories.map(c=>`<div class="report-row"><span class="report-name">${esc(c.name)}</span><span class="report-value">${money(m.incBy[c.id]||0)}</span></div>`).join('')}
  `;
}
function renderReports(){
  const m=monthStats();
  const topExp=[...state.expenseCategories].sort((a,b)=>(m.expBy[b.id]||0)-(m.expBy[a.id]||0))[0];
  const topInc=[...state.incomeCategories].sort((a,b)=>(m.incBy[b.id]||0)-(m.incBy[a.id]||0))[0];
  return `
    <div class="section-title">تقرير الشهر الحالي</div>
    <div class="card">
      <div class="card-title">الملخص التنفيذي</div>
      <div class="card-line"><span class="card-key">إجمالي الإيرادات</span><span class="card-val">${money(m.inc)}</span></div>
      <div class="card-line"><span class="card-key">إجمالي المصاريف</span><span class="card-val">${money(m.exp)}</span></div>
      <div class="card-line"><span class="card-key">صافي الشهر</span><span class="card-val ${m.net>=0?'green':'red'}">${money(m.net)}</span></div>
    </div>
    <div class="card">
      <div class="card-title">أعلى البنود</div>
      <div class="card-line"><span class="card-key">أعلى مصروف</span><span class="card-val">${topExp?esc(topExp.name):'-'} • ${money(topExp?(m.expBy[topExp.id]||0):0)}</span></div>
      <div class="card-line"><span class="card-key">أعلى إيراد</span><span class="card-val">${topInc?esc(topInc.name):'-'} • ${money(topInc?(m.incBy[topInc.id]||0):0)}</span></div>
    </div>
    <div class="hint" style="margin-top:12px">خانات «متبقي» لا تدخل في أي إجمالي أو تقرير مالي.</div>
  `;
}
function renderSettings(){
  return `
    <div class="section-title">الإعدادات</div>
    <div class="card">
      <div class="card-title">البيانات</div>
      <div class="hint">كل البيانات محفوظة محليًا على الجهاز، والتطبيق يعمل بدون إنترنت بعد التثبيت.</div>
      <button class="save-btn" data-action="save">حفظ الآن</button>
    </div>
    <div class="card">
      <div class="card-title">إعادة ضبط</div>
      <div class="hint">يعيد البنود للوضع الأصلي ويحذف كل اليوميات المحفوظة.</div>
      <button class="danger-wide" data-action="reset-all">حذف كل البيانات</button>
    </div>
  `;
}
function render(){
  const app=document.getElementById('app');
  app.innerHTML=`
    <div class="app-shell">
      <header class="topbar">
        <div class="brand-row">
          <div><h1 class="brand">حسابات الشغل</h1><div class="brand-sub">BUSINESS FINANCE</div></div>
          <div class="badge">BLACK • GOLD</div>
        </div>
      </header>
      <main class="page">
        ${state.screen==='daily'?renderDaily():state.screen==='monthly'?renderMonthly():state.screen==='reports'?renderReports():renderSettings()}
      </main>
      <nav class="bottom-nav">
        <button class="nav-btn ${state.screen==='daily'?'active':''}" data-nav="daily">اليومية</button>
        <button class="nav-btn ${state.screen==='monthly'?'active':''}" data-nav="monthly">الشهرية</button>
        <button class="nav-btn ${state.screen==='reports'?'active':''}" data-nav="reports">التقارير</button>
        <button class="nav-btn ${state.screen==='settings'?'active':''}" data-nav="settings">الإعدادات</button>
      </nav>
    </div>`;
}
function rerenderSave(){save();render()}
function confirmDeleteByKey(key){
  if(!confirm('تأكيد حذف هذا البند؟'))return;
  const [type,a,b]=key.split(':');
  if(type==='expense')state.expenseCategories=state.expenseCategories.filter(x=>x.id!==a);
  if(type==='income')state.incomeCategories=state.incomeCategories.filter(x=>x.id!==a);
  if(type==='child')state.expenseCategories=state.expenseCategories.map(c=>c.id===a?{...c,children:c.children.filter(ch=>ch.id!==b)}:c);
  delete state.unlocked[key];save();render();toast('تم حذف البند');
}
document.addEventListener('click',e=>{
  const nav=e.target.closest('[data-nav]');if(nav){state.screen=nav.dataset.nav;render();return}
  const el=e.target.closest('[data-action]');if(!el)return;
  const a=el.dataset.action;
  if(a==='prev-day'){state.selectedDate=shiftDate(state.selectedDate,-1);render()}
  else if(a==='next-day'){state.selectedDate=shiftDate(state.selectedDate,1);render()}
  else if(a==='today'){state.selectedDate=dateKey();render()}
  else if(a==='daily-expense'){state.dailyType='expense';render()}
  else if(a==='daily-income'){state.dailyType='income';render()}
  else if(a==='toggle-expense'){const id=el.dataset.cat;state.openExpenses[id]=!state.openExpenses[id];render()}
  else if(a==='toggle-lock'){const k=el.dataset.key;state.unlocked[k]=!state.unlocked[k];render()}
  else if(a==='delete-confirm'){confirmDeleteByKey(el.dataset.key)}
  else if(a==='add-expense'){
    state.expenseCategories.push({id:uid('exp'),name:'بند جديد',children:[]});rerenderSave();toast('تمت إضافة بند مصروف');
  }
  else if(a==='add-expense-after'){
    const id=el.dataset.cat,i=state.expenseCategories.findIndex(x=>x.id===id),item={id:uid('exp'),name:'بند جديد',children:[]};
    state.expenseCategories.splice(i+1,0,item);rerenderSave();toast('تمت إضافة بند');
  }
  else if(a==='add-child'){
    const id=el.dataset.cat;
    state.expenseCategories=state.expenseCategories.map(c=>c.id===id?{...c,children:[...(c.children||[]),{id:uid('child'),name:'بند فرعي'}]}:c);
    state.openExpenses[id]=true;rerenderSave();
  }
  else if(a==='add-income'){
    state.incomeCategories.push({id:uid('inc'),name:'بند جديد',hasRemaining:false});rerenderSave();toast('تمت إضافة بند إيراد');
  }
  else if(a==='save'){save(false)}
  else if(a==='prev-month'){shiftMonth(-1);render()}
  else if(a==='next-month'){shiftMonth(1);render()}
  else if(a==='open-calendar-day'){
    state.selectedDate=el.dataset.date;
    state.monthKey=state.selectedDate.slice(0,7);
    state.dailyType='expense';
    state.screen='daily';
    save();
    render();
  }
  else if(a==='reset-all'){
    if(confirm('سيتم حذف كل البيانات واليوميات المحفوظة. هل أنت متأكد؟')){
      localStorage.removeItem(STORAGE_KEY);
      state={...state,expenseCategories:clone(initialExpenseCategories),incomeCategories:clone(initialIncomeCategories),days:{},remaining:{},openExpenses:{},unlocked:{},selectedDate:dateKey(),monthKey:dateKey().slice(0,7)};
      save();render();toast('تمت إعادة ضبط البرنامج');
    }
  }
});
document.addEventListener('input',e=>{
  const el=e.target;if(!el.matches('[data-kind]'))return;
  const kind=el.dataset.kind,cat=el.dataset.cat,ch=el.dataset.child;
  if(kind==='expense-name')state.expenseCategories=state.expenseCategories.map(x=>x.id===cat?{...x,name:el.value}:x);
  if(kind==='expense-amount'){const d=ensureDay();d.expenses[cat]=el.value}
  if(kind==='expense-child-name')state.expenseCategories=state.expenseCategories.map(c=>c.id===cat?{...c,children:c.children.map(x=>x.id===ch?{...x,name:el.value}:x)}:c);
  if(kind==='expense-child-amount'){const d=ensureDay();if(!d.expenseChildren[cat])d.expenseChildren[cat]={};d.expenseChildren[cat][ch]=el.value}
  if(kind==='income-name')state.incomeCategories=state.incomeCategories.map(x=>x.id===cat?{...x,name:el.value}:x);
  if(kind==='income-amount'){const d=ensureDay();d.incomes[cat]=el.value}
  if(kind==='remaining')state.remaining[cat]=el.value;
  save();
});
document.addEventListener('change',e=>{
  if(e.target.matches('[data-kind$="-amount"],[data-kind="remaining"]'))render();
});
load();render();
