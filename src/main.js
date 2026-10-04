const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pad=n=>String(n).padStart(2,'0');
const nowT=()=>{const d=new Date();return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`};
const ago=m=>{const d=new Date(Date.now()-m*60000);return `${pad(d.getHours())}:${pad(d.getMinutes())}`};
const fmtN=n=>Number(n).toLocaleString('en-US');

function toast(title,msg,type='ok'){
 const el=document.createElement('div');
 const icon=type==='crit'?'✕':type==='warn'?'⚠':type==='info'?'ℹ':'✓';
 const border=type==='crit'?'border-red-400':type==='warn'?'border-yellow-400':'border-limex';
 el.className=`toast-in bg-ink text-white rounded-2xl p-4 shadow-premium border-l-4 ${border} flex gap-3`;
 el.innerHTML=`<div class="w-8 h-8 rounded-full ${type==='crit'?'bg-red-400':'bg-limex'} text-ink flex items-center justify-center font-bold">${icon}</div><div class="flex-1"><b class="font-grotesk">${title}</b><div class="text-white/60 text-[12px] mt-1">${msg}</div><div class="font-mono text-[9px] text-white/30 mt-1">${nowT()} • Express API</div></div><button onclick="this.parentElement.remove()">✕</button>`;
 $('#toasts').appendChild(el);
 setTimeout(()=>{if(el.isConnected)el.remove()},4500);
}
function modal(html,max='max-w-[600px]'){
 $('#modalRoot').innerHTML=`<div class="fixed inset-0 z-[95] modal-bg flex items-center justify-center p-4" onclick="if(event.target===this)closeModal()"><div class="bg-white rounded-[22px] shadow-premium w-full ${max} max-h-[90vh] overflow-y-auto">${html}</div></div>`;
 document.body.style.overflow='hidden';
}
function closeModal(){$('#modalRoot').innerHTML='';document.body.style.overflow=''}
function expressLog(method,path,status=200){console.log(`${method} ${path} ${status}`)}

let currentRole='admin';
const PERMS={admin:['*'],operator:['backup:run','backup:restore','dr:simulate','dr:failover','schedule:edit','alert:ack','storage:edit'],auditor:['audit:export','report:export'],viewer:[]};
function can(p){return PERMS[currentRole].includes('*')||PERMS[currentRole].includes(p)}
function applyPerms(){
 $$('[data-perm]').forEach(el=>{const ok=can(el.dataset.perm);el.classList.toggle('opacity-40',!ok);el.classList.toggle('pointer-events-none',!ok);el.title=ok?'':'Requires a higher role'});
 const r=$('#userRoleLabel');if(r)r.textContent=currentRole.toUpperCase()+' • '+(currentRole==='admin'?'SRE':currentRole==='operator'?'OPERATOR':currentRole==='auditor'?'COMPLIANCE':'READ-ONLY');
}
function switchRole(r){currentRole=r;applyPerms();toast('Role switched',`Operating as <b>${r.toUpperCase()}</b>. Permissions re-evaluated.`,'info')}

const REGIONS=[['us-east-1','N. Virginia','PRIMARY',98],['eu-west-1','Ireland','STANDBY',64],['ap-south-1','Mumbai','ACTIVE',41],['eu-central-1','Frankfurt','ACTIVE',28],['us-west-2','Oregon','ACTIVE',12],['ap-southeast-2','Sydney','ARCHIVE',5]];
const ASSETS=['payments-api-prod','orders-db-primary','user-media-store','auth-service-cluster','ledger-postgres-01','ml-feature-store','session-cache-02','billing-worker-pool','search-opensearch','cdn-origin-bucket'];
let BACKUPS=Array.from({length:18},(_,i)=>({id:'bkp-'+(70000+i),asset:ASSETS[i%ASSETS.length],type:['Full','Incremental','Snapshot','Differential'][i%4],size:(40+i*17)+' GB',started:ago(i*17+4),status:i===4?'Running':i===7?'Failed':'Completed',region:REGIONS[i%REGIONS.length][0],retention:['7d','30d','90d','1yr'][i%4],enc:'AES-256',prog:i===4?55:100}));
let AUDIT=[{t:'09:41:14',user:'system',act:'FAILOVER_EXECUTE',res:'us-east-1 → eu-west-1',st:'success'},{t:'09:38:02',user:'a.rahman',act:'BACKUP_VERIFY',res:'bkp-73412',st:'success'},{t:'09:12:47',user:'m.okafor',act:'RESTORE_INITIATE',res:'orders-db-primary',st:'success'}];
let ALERTS=[{sev:'critical',title:'Replication lag spike on orders-db-primary',src:'Monitor • eu-west-1',time:'2m ago'},{sev:'warning',title:'Backup window overrun: user-media-store',src:'Scheduler',time:'26m ago'},{sev:'warning',title:'Anomalous read pattern detected',src:'Python ML Engine',time:'1h ago'},{sev:'info',title:'DR drill completed — PASS',src:'DR Simulator',time:'3h ago'}];

function auditPush(act,res,st='success'){AUDIT.unshift({t:nowT(),user:currentRole,act,res,st})}

const NAV=[
 ['OPERATE',[['overview','◉','Dashboard'],['monitor','〜','Monitoring'],['analytics','◆','Analytics']]],
 ['PROTECT',[['backups','▣','Backups'],['schedules','◷','Schedules'],['replication','⇄','Replication'],['storage','▤','Storage']]],
 ['RECOVER',[['recovery','⚡','Recovery'],['simulator','▶','Simulator'],['restore','↩','Restore']]],
 ['GOVERN',[['security','⬢','Security'],['audit','☰','Reports'],['iam','👥','Users'],['settings','⚙','Settings']]]
];
const TOP=[
 ['overview','◉','Dashboard'],['backups','▣','Backups'],['recovery','⚡','Recovery'],['replication','⇄','Replication'],['storage','▤','Storage'],['monitor','〜','Monitoring'],['analytics','◆','Analytics'],['simulator','▶','Simulator'],['restore','↩','Restore'],['security','⬢','Security'],['audit','☰','Reports'],['iam','👥','Users'],['settings','⚙','Settings']
];
const CRUMBS={
 overview:['OPERATE','Dashboard • Operations Overview'],monitor:['OPERATE','Monitoring & Alerts'],analytics:['OPERATE','Python Analytics Engine'],
 backups:['PROTECT','Backup Management'],schedules:['PROTECT','Advanced Scheduling'],replication:['PROTECT','Replication'],storage:['PROTECT','Storage Management'],
 recovery:['RECOVER','Disaster Recovery'],simulator:['RECOVER','DR Simulator'],restore:['RECOVER','Restore Center'],
 security:['GOVERN','Security Center'],audit:['GOVERN','Compliance Reports'],iam:['GOVERN','Users & Access'],settings:['GOVERN','Platform Settings']
};

function renderNavigation(){
 $('#topTaskbar').innerHTML=TOP.map(([id,ic,label])=>`<button data-top="${id}" onclick="switchView('${id}')" class="top-task shrink-0 flex items-center gap-2 px-3 py-2 rounded-full text-[11px] font-semibold"><span class="task-ico">${ic}</span>${label}</button>`).join('');
 $('#sideNav').innerHTML=NAV.map(([group,items])=>`<div><div class="font-mono text-[9px] tracking-[.2em] text-mutedx px-2 mb-1">${group}</div>${items.map(([id,ic,label])=>`<button data-nav="${id}" onclick="switchView('${id}')" class="side-link w-full flex items-center gap-2 px-2 py-2 rounded-xl text-left"><span class="side-ico w-7 h-7 rounded-lg bg-paper border border-line flex items-center justify-center">${ic}</span><span>${label}</span></button>`).join('')}</div>`).join('');
}

function launchConsole(view='overview'){
 $('#landing').classList.add('hidden');$('#console').classList.remove('hidden');renderNavigation();switchView(view);toast('Connected to production','Express API :4000 • Supabase PG • Python ML :8000','ok');
}
function backToSite(){closeModal();$('#console').classList.add('hidden');$('#landing').classList.remove('hidden');window.scrollTo(0,0)}
function toggleSidebar(){$('#sidebar').classList.toggle('max-lg:-translate-x-full')}
function switchView(v){
 currentView=v;
 $$('[data-top]').forEach(b=>b.classList.toggle('active',b.dataset.top===v));
 $$('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===v));
 $$('[data-view]').forEach(s=>s.classList.toggle('hidden',s.dataset.view!==v));
 const c=CRUMBS[v]||['',''];
 $('#crumbTop').textContent=c[0];$('#crumbTitle').textContent=c[1];
 $('#sidebar').classList.add('max-lg:-translate-x-full');
 if(RENDER[v])RENDER[v]();
 applyPerms();expressLog('GET',`/api/${v}`);window.scrollTo({top:0,behavior:'smooth'});
}

const RENDER={};

function sectionHead(k,t,sub=''){return `<div class="mb-5"><div class="font-mono text-[10px] tracking-[.2em] text-mutedx">${k}</div><h1 class="font-grotesk font-bold text-[28px] tracking-tight">${t}</h1>${sub?`<p class="text-[13px] text-mutedx mt-1">${sub}</p>`:''}</div>`}

RENDER.overview=()=>{
 const el=$('[data-view="overview"]');
 el.innerHTML=`${sectionHead('OPERATE • PRODUCTION','Good morning, Aisha.','All systems resilient across 6 regions.')}
 <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">${[
 ['PROTECTED ASSETS','248','+6 this week'],['BACKUP SUCCESS','99.2%','+0.4 pts'],['STORAGE USED','18.4 TB','+412 GB / 24h'],['ACTIVE ALERTS','3','1 critical']
 ].map((x,i)=>`<div class="bg-white border border-line rounded-[18px] p-5 card-hover"><div class="font-mono text-[10px] text-mutedx">${x[0]}</div><div class="font-grotesk text-[30px] font-bold">${x[1]}</div><div class="font-mono text-[10px] ${i===3?'text-red-500':'text-green-600'}">${x[2]}</div></div>`).join('')}</div>
 <div class="grid xl:grid-cols-[1.5fr_1fr] gap-4 mt-4">
 <div class="bg-white border border-line rounded-[18px] p-5"><div class="flex justify-between mb-3"><b>Backup Throughput & Outcomes</b><button onclick="switchView('backups')" class="font-mono text-[10px] underline">VIEW BACKUPS →</button></div><div class="h-[250px]"><canvas id="mainChart"></canvas></div></div>
 <div class="bg-ink text-white rounded-[18px] p-5"><div class="font-mono text-[10px] text-limex">PYTHON ML ENGINE • :8000</div><b class="font-grotesk text-[18px]">Intelligent Monitoring</b><div class="mt-4 space-y-2">${[
 ['No anomalies in 24h','98.4% confidence'],['Forecast: storage +9%','30-day model'],['Recovery score','97 / 100']
 ].map(x=>`<div class="bg-white/[.06] rounded-xl p-3"><b class="text-[13px]">${x[0]}</b><div class="font-mono text-[10px] text-white/50">${x[1]}</div></div>`).join('')}</div><button onclick="switchView('analytics')" class="btn-lime w-full mt-4 py-2.5 rounded-full font-bold text-[12px]">Open Analytics →</button></div></div>
 <div class="grid xl:grid-cols-[1.5fr_1fr] gap-4 mt-4">
 <div class="bg-white border border-line rounded-[18px] overflow-hidden"><div class="p-5 font-grotesk font-bold">Critical Assets</div><div class="overflow-x-auto"><table class="tbl w-full"><thead><tr><th>Asset</th><th>Region</th><th>RPO</th><th>RTO</th><th>Status</th></tr></thead><tbody>${ASSETS.slice(0,6).map((a,i)=>`<tr><td class="font-semibold">${a}</td><td class="font-mono text-[11px]">${REGIONS[i%REGIONS.length][0]}</td><td class="font-mono">4m</td><td class="font-mono">${12+i}s</td><td><span class="pill bg-limex text-ink">● PROTECTED</span></td></tr>`).join('')}</tbody></table></div></div>
 <div class="bg-white border border-line rounded-[18px] p-5"><div class="flex justify-between"><b>Live Operations Feed</b><span class="pill bg-ink text-limex">● STREAMING</span></div><div class="space-y-3 mt-4 text-[12px]">${[
 'bkp-78112 verified — checksums 100%','Replication caught up — lag 0.4s','Python ML scored 2,048 events','Immutable snapshot sealed'
 ].map((x,i)=>`<div class="flex gap-2"><span class="font-mono text-[10px] text-mutedx">${i+1}m</span><span class="dot bg-green-500 mt-1"></span><span>${x}</span></div>`).join('')}</div><button onclick="switchView('monitor')" class="mt-4 font-mono text-[11px] underline">View monitoring →</button></div></div>`;
 drawChart('mainChart','bar',[820,940,880,1020,990,1100,1080,1150,1210,1180,1260,1310,1290,1380]);
};

function drawChart(id,type,data){
 const c=$('#'+id);if(!c||!window.Chart)return;
 new Chart(c,{type,data:{labels:data.map((_,i)=>i+1),datasets:[{label:'Activity',data,borderColor:'#0A0C0A',backgroundColor:type==='bar'?'#0A0C0A':'rgba(205,255,60,.3)',borderWidth:2,tension:.35,fill:type==='line',borderRadius:type==='bar'?4:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{grid:{color:'#EDEFE6'}}}}});
}

let bkpFilter={q:'',status:'all'};
RENDER.backups=()=>{
 const el=$('[data-view="backups"]');
 el.innerHTML=`${sectionHead('PROTECT • BACKUP MANAGEMENT','Backups','Orchestrated backup jobs with verification and immutable retention.')}
 <div class="flex gap-2 mb-4"><button onclick="launchBackupModal()" data-perm="backup:run" class="btn-lime px-5 py-2.5 rounded-full font-bold text-[12px]">+ Backup Now</button><button onclick="verifyAll()" data-perm="backup:run" class="bg-white border-2 border-ink px-5 py-2.5 rounded-full font-bold text-[12px]">✓ Verify All</button></div>
 <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">${[['TOTAL','4,812'],['SUCCESS','99.2%'],['STORED','18.4 TB'],['IMMUTABLE','100%']].map(x=>`<div class="bg-white border border-line rounded-2xl p-4"><div class="font-mono text-[9px] text-mutedx">${x[0]}</div><b class="font-grotesk text-[24px]">${x[1]}</b></div>`).join('')}</div>
 <div class="bg-white border border-line rounded-[18px] overflow-hidden"><div class="p-4 flex gap-2 border-b border-line"><input id="bkpQ" oninput="bkpFilter.q=this.value;renderBkpRows()" placeholder="Search asset, ID, region…" class="flex-1 bg-paper border border-line rounded-xl px-4 py-2.5 text-[13px]"><select onchange="bkpFilter.status=this.value;renderBkpRows()" class="bg-paper border border-line rounded-xl px-3 py-2.5 text-[12px]"><option value="all">All statuses</option><option>Completed</option><option>Running</option><option>Failed</option></select></div><div class="overflow-x-auto"><table class="tbl w-full"><thead><tr><th>ID</th><th>Asset</th><th>Type</th><th>Size</th><th>Started</th><th>Status</th><th>Actions</th></tr></thead><tbody id="bkpRows"></tbody></table></div></div>`;
 renderBkpRows();
};
function renderBkpRows(){
 const tb=$('#bkpRows');if(!tb)return;
 const q=bkpFilter.q.toLowerCase();
 const rows=BACKUPS.filter(b=>(bkpFilter.status==='all'||b.status===bkpFilter.status)&&(!q||(b.id+b.asset+b.region).toLowerCase().includes(q)));
 tb.innerHTML=rows.map(b=>`<tr><td class="font-mono font-bold">${b.id}</td><td class="font-semibold">${b.asset}<div class="font-mono text-[9px] text-mutedx">${b.region}</div></td><td>${b.type}</td><td class="font-mono">${b.size}</td><td class="font-mono text-[11px]">${b.started}</td><td><span class="pill ${b.status==='Failed'?'bg-red-500 text-white':b.status==='Running'?'bg-ink text-limex':'bg-limex text-ink'}">${b.status}</span></td><td><button onclick="backupDetail('${b.id}')" class="font-mono text-[10px] underline">DETAIL</button> <button onclick="verifyOne('${b.id}')" data-perm="backup:run" class="font-mono text-[10px] underline">VERIFY</button></td></tr>`).join('')||`<tr><td colspan="7" class="text-center py-8 text-mutedx">No backups match.</td></tr>`;
 applyPerms();
}
function backupDetail(id){const b=BACKUPS.find(x=>x.id===id);if(!b)return;modal(`<div class="p-7"><div class="flex justify-between"><div><div class="font-mono text-[10px] text-mutedx">BACKUP DETAIL</div><h2 class="font-grotesk text-[23px] font-bold">${b.id}</h2></div><button onclick="closeModal()">✕</button></div><div class="mt-4 pill bg-limex text-ink">${b.status}</div><div class="grid grid-cols-3 gap-3 mt-5">${[['ASSET',b.asset],['SIZE',b.size],['RETENTION',b.retention]].map(x=>`<div class="bg-paper rounded-xl p-3"><div class="font-mono text-[9px] text-mutedx">${x[0]}</div><b class="text-[13px]">${x[1]}</b></div>`).join('')}</div><div class="mt-5 space-y-2">${['Snapshot captured','Encrypted AES-256','Replicated to standby','Checksum verified','WORM sealed'].map(x=>`<div class="bg-paper rounded-xl px-4 py-3 text-[13px]">✓ ${x}</div>`).join('')}</div><button onclick="quickRestore('${b.id}')" data-perm="backup:restore" class="btn-lime w-full mt-5 py-3 rounded-full font-bold">Restore from this backup →</button></div>`);applyPerms()}
function verifyOne(id){toast('Verification started',`Deep checksum verification queued for <b>${id}</b>.`,'info');auditPush('BACKUP_VERIFY',id)}
function verifyAll(){toast('Fleet verification','All protected assets queued for verification.','ok');auditPush('BACKUP_VERIFY_ALL','fleet')}
function quickRestore(id){closeModal();switchView('restore');setTimeout(()=>{const s=$('#rsBackup');if(s)s.value=id},100)}
function launchBackupModal(){
 if(!can('backup:run')){toast('Permission denied','Your current role cannot run backups.','crit');return}
 modal(`<div class="p-7"><div class="flex justify-between"><h2 class="font-grotesk text-[22px] font-bold">Run Backup Now</h2><button onclick="closeModal()">✕</button></div><label class="block font-mono text-[10px] text-mutedx mt-5">ASSET</label><select id="backupAsset" class="w-full mt-2 bg-paper border border-line rounded-xl px-3 py-2.5">${ASSETS.map(a=>`<option>${a}</option>`).join('')}</select><label class="block font-mono text-[10px] text-mutedx mt-4">TYPE</label><select id="backupType" class="w-full mt-2 bg-paper border border-line rounded-xl px-3 py-2.5"><option>Incremental</option><option>Full</option><option>Snapshot</option></select><button onclick="startBackupJob()" class="btn-lime w-full mt-5 py-3 rounded-full font-bold">Start Backup Job →</button></div>`);
}
function startBackupJob(){
 const asset=$('#backupAsset')?.value||ASSETS[0],type=$('#backupType')?.value||'Incremental';
 const id='bkp-'+rnd(78000,78999);
 const job={id,asset,type,size:'—',started:nowT(),status:'Running',region:'us-east-1',retention:'30d',enc:'AES-256',prog:5};
 BACKUPS.unshift(job);closeModal();toast('Backup job started',`<b>${id}</b> queued for ${asset}.`,'ok');auditPush('BACKUP_RUN',id);if(currentView==='backups')renderBkpRows();
 const timer=setInterval(()=>{job.prog+=rnd(8,18);if(job.prog>=100){job.prog=100;job.status='Completed';job.size=rnd(80,480)+' GB';clearInterval(timer);toast('Backup completed',`<b>${id}</b> verified and WORM sealed.`,'ok');auditPush('BACKUP_COMPLETE',id);if(currentView==='backups')renderBkpRows()}},900);
}

RENDER.recovery=()=>{
 const el=$('[data-view="recovery"]');
 el.innerHTML=`${sectionHead('RECOVER • DR PLANS','Disaster Recovery','Failover policies, recovery objectives and regional readiness.')}<div class="grid lg:grid-cols-3 gap-4">${[
 ['DR-01 • Region Failover','RTO 60s','Automatic DNS + traffic cutover','dr:failover'],['DR-02 • Database PITR','RPO 5m','Point-in-time restore with WAL','backup:restore'],['DR-03 • Ransomware','Isolate + recover','Immutable snapshot recovery','dr:failover']
 ].map(x=>`<div class="bg-white border border-line rounded-[18px] p-5"><span class="pill bg-limex text-ink">READY</span><h3 class="font-grotesk font-bold text-[18px] mt-3">${x[0]}</h3><p class="font-mono text-[11px] text-mutedx mt-1">${x[1]} • ${x[2]}</p><button onclick="runRecovery('${x[0]}')" data-perm="${x[3]}" class="btn-ink w-full mt-5 py-2.5 rounded-full text-[12px] font-bold">Run Plan →</button></div>`).join('')}</div>`;
 applyPerms();
};
function runRecovery(name){toast('Recovery plan queued',`${name} pre-flight checks started.`,'info');auditPush('DR_PLAN_RUN',name)}

RENDER.replication=()=>{
 const el=$('[data-view="replication"]');
 el.innerHTML=`${sectionHead('PROTECT • REPLICATION','Cross-Region Replication','Live streams from primary regions to recovery targets.')}<div class="grid md:grid-cols-3 gap-4">${REGIONS.slice(0,3).map((r,i)=>`<div class="bg-white border border-line rounded-[18px] p-5"><div class="flex justify-between"><b>${r[0]}</b><span class="pill bg-limex text-ink">HEALTHY</span></div><div class="font-grotesk text-[28px] font-bold mt-3">${(2.1+i*.3).toFixed(1)} GB/s</div><div class="font-mono text-[10px] text-mutedx">replication throughput</div><div class="mt-4 h-2 bg-paper rounded-full"><div class="h-full bg-limex rounded-full" style="width:${92-i*4}%"></div></div><div class="font-mono text-[10px] mt-2">Lag ${i+1}.2s • 14 streams</div></div>`).join('')}</div><div class="bg-white border border-line rounded-[18px] p-5 mt-4"><b>Replication topology</b><div class="grid md:grid-cols-3 gap-3 mt-4">${REGIONS.map(r=>`<div class="bg-paper rounded-xl p-4"><div class="font-mono text-[11px] font-bold">${r[0]}</div><div class="text-[12px] text-mutedx">${r[1]} • ${r[2]}</div><div class="text-green-600 font-mono text-[10px] mt-2">● ${r[3]} assets protected</div></div>`).join('')}</div></div>`;
};

RENDER.storage=()=>{
 const el=$('[data-view="storage"]');
 el.innerHTML=`${sectionHead('PROTECT • STORAGE','Storage Management','Tiering, capacity and retention policies.')}<div class="grid md:grid-cols-3 gap-4">${[['HOT','8.2 TB','$1,840/mo','44%'],['WARM','6.7 TB','$620/mo','36%'],['COLD / GLACIER','3.5 TB','$140/mo','20%']].map(x=>`<div class="bg-white border border-line rounded-[18px] p-5"><div class="font-mono text-[10px] text-mutedx">${x[0]}</div><b class="font-grotesk text-[30px]">${x[1]}</b><div class="font-mono text-[11px] text-mutedx">${x[2]}</div><div class="h-2 bg-paper rounded-full mt-4"><div class="h-full bg-limex rounded-full" style="width:${x[3]}"></div></div></div>`).join('')}</div><div class="bg-white border border-line rounded-[18px] p-5 mt-4"><div class="flex justify-between"><b>Lifecycle Policies</b><button onclick="toast('Policy saved','Lifecycle configuration updated.','ok')" class="btn-lime px-4 py-2 rounded-full text-[11px] font-bold">Save Policy</button></div><div class="mt-4 space-y-2">${['Move backups to Warm after 7 days','Move to Glacier after 30 days','Delete after 7 years'].map(x=>`<div class="flex justify-between bg-paper rounded-xl p-3 text-[13px]"><span>${x}</span><span class="pill bg-limex text-ink">ACTIVE</span></div>`).join('')}</div></div>`;
};

RENDER.monitor=()=>{
 const el=$('[data-view="monitor"]');
 el.innerHTML=`${sectionHead('OPERATE • MONITORING','Monitoring & Alerts','Real-time RPO, RTO, replication and anomaly signals.')}<div class="grid lg:grid-cols-3 gap-4">${ALERTS.map((a,i)=>`<div class="bg-white border border-line rounded-[18px] p-5 ${a.sev==='critical'?'border-l-4 border-l-red-500':''}"><div class="flex justify-between"><span class="pill ${a.sev==='critical'?'bg-red-500 text-white':a.sev==='warning'?'bg-yellow-200 text-ink':'bg-limex text-ink'}">${a.sev}</span><span class="font-mono text-[9px] text-mutedx">${a.time}</span></div><b class="block text-[14px] mt-3">${a.title}</b><div class="font-mono text-[10px] text-mutedx mt-1">${a.src}</div><button onclick="ackAlert(${i})" data-perm="alert:ack" class="mt-4 font-mono text-[10px] underline">Acknowledge</button></div>`).join('')}</div><div class="bg-white border border-line rounded-[18px] p-5 mt-4"><b>Service Health</b><div class="grid md:grid-cols-4 gap-3 mt-4">${['Backup API','Replication','Python ML','Database'].map(x=>`<div class="bg-paper rounded-xl p-4"><div class="font-semibold">${x}</div><div class="text-green-600 font-mono text-[11px] mt-2">● OPERATIONAL</div></div>`).join('')}</div></div>`;
 applyPerms();
};
function ackAlert(i){ALERTS.splice(i,1);toast('Alert acknowledged','Incident state updated.','ok');RENDER.monitor()}

RENDER.analytics=()=>{
 const el=$('[data-view="analytics"]');
 el.innerHTML=`${sectionHead('OPERATE • PYTHON ANALYTICS','Analytics','Model outputs from anomaly detection, forecasting and recovery scoring.')}<div class="grid lg:grid-cols-3 gap-4"><div class="bg-white border border-line rounded-[18px] p-5"><b>Anomaly Score — 24h</b><div class="h-[210px] mt-3"><canvas id="anomChart"></canvas></div></div><div class="bg-white border border-line rounded-[18px] p-5"><b>Storage Forecast — 30d</b><div class="h-[210px] mt-3"><canvas id="forecastChart"></canvas></div></div><div class="bg-ink text-white rounded-[18px] p-6"><div class="font-mono text-[10px] text-limex">RECOVERY SCORE</div><div class="font-grotesk text-[58px] font-bold">97<span class="text-[18px] text-white/40">/100</span></div><p class="text-white/60 text-[13px]">Based on backup health, drill results and MTTR.</p><div class="h-2 bg-white/10 rounded-full mt-5"><div class="h-full bg-limex rounded-full" style="width:97%"></div></div></div></div><div class="bg-white border border-line rounded-[18px] p-5 mt-4"><b>Explainability</b><p class="font-mono text-[11px] text-mutedx mt-2">Top features: replication lag variance, backup failure streak, API error rate.</p></div>`;
 drawChart('anomChart','line',Array.from({length:24},()=>rnd(5,20)));
 drawChart('forecastChart','line',[18.4,19.1,19.8,20.1,21.0]);
};

RENDER.schedules=()=>{
 const el=$('[data-view="schedules"]');
 el.innerHTML=`${sectionHead('PROTECT • SCHEDULING','Advanced Scheduling','Backup policies and automated execution windows.')}<div class="bg-white border border-line rounded-[18px] overflow-hidden"><table class="tbl w-full"><thead><tr><th>Policy</th><th>Frequency</th><th>Assets</th><th>Retention</th><th>Status</th><th>Action</th></tr></thead><tbody>${[['gold-daily-0300','Daily 03:00 UTC','98','90d'],['silver-hourly','Every hour','42','30d'],['critical-15m','Every 15 min','12','7d'],['archive-weekly','Sunday 02:00','31','7yr']].map(x=>`<tr><td class="font-semibold">${x[0]}</td><td class="font-mono">${x[1]}</td><td>${x[2]}</td><td>${x[3]}</td><td><span class="pill bg-limex text-ink">ACTIVE</span></td><td><button onclick="toast('Schedule triggered','${x[0]} queued immediately.','ok')" data-perm="schedule:edit" class="font-mono text-[10px] underline">RUN NOW</button></td></tr>`).join('')}</tbody></table></div>`;
 applyPerms();
};

RENDER.simulator=()=>{
 const el=$('[data-view="simulator"]');
 el.innerHTML=`${sectionHead('RECOVER • DR SIMULATOR','DR Simulator','Run controlled disaster drills and measure RTO/RPO.')}<div class="grid xl:grid-cols-2 gap-4"><div class="bg-ink text-white rounded-[18px] p-6"><div class="font-mono text-[10px] text-limex">INJECT FAILURE</div><div class="grid grid-cols-3 gap-3 mt-4">${['Region Outage','Ransomware','DB Corruption'].map(x=>`<button onclick="runDrill('${x}')" data-perm="dr:simulate" class="bg-white/[.06] border border-white/10 rounded-xl p-4 text-left hover:bg-white/[.1]"><b class="text-[13px]">${x}</b><div class="font-mono text-[10px] text-white/50 mt-2">START DRILL</div></button>`).join('')}</div><div id="simLog" class="mt-5 bg-black/30 rounded-xl p-4 font-mono text-[11px] leading-6">Ready. Select a scenario.</div></div><div class="bg-white border border-line rounded-[18px] p-6"><b>Recent Drills</b><div class="mt-4 space-y-2">${[['Nov 01','Region Outage','11.8s'],['Oct 24','AZ Loss','9.1s'],['Oct 12','Ransomware','3m 10s']].map(x=>`<div class="bg-paper rounded-xl p-3 flex justify-between"><span class="font-mono text-[11px]">${x[0]} • ${x[1]}</span><span class="font-mono text-[11px]">${x[2]} • <b class="text-green-600">PASS</b></span></div>`).join('')}</div></div></div>`;
 applyPerms();
};
function runDrill(scenario){
 if(!can('dr:simulate')){toast('Permission denied','Simulator requires Operator or Admin.','crit');return}
 const box=$('#simLog');let n=0;box.innerHTML='';
 const logs=[`> chaos inject --scenario "${scenario}"`,`> health checks started`,`> ML anomaly engine: 97.2% confidence`,`> failover route selected: eu-west-1`,`> traffic drained and verified`,`✓ DRILL PASS • RTO 11.8s • RPO 3m 58s • 24/24 checks`];
 const timer=setInterval(()=>{box.innerHTML+=`<div class="${n===logs.length-1?'text-limex':''}">${logs[n]}</div>`;n++;if(n>=logs.length){clearInterval(timer);toast('DR drill passed',`${scenario} completed successfully. Evidence added to audit log.`,'ok');auditPush('DR_DRILL_PASS',scenario)}},500)
}

RENDER.restore=()=>{
 const el=$('[data-view="restore"]');
 el.innerHTML=`${sectionHead('RECOVER • RESTORE CENTER','Point-in-Time Restore','Restore a verified backup into an isolated or approved target.')}<div class="grid xl:grid-cols-[1.2fr_.8fr] gap-4"><div class="bg-white border border-line rounded-[18px] p-6"><label class="font-mono text-[10px] text-mutedx">SOURCE BACKUP</label><select id="rsBackup" class="w-full mt-2 bg-paper border border-line rounded-xl px-3 py-3">${BACKUPS.filter(b=>b.status!=='Failed').map(b=>`<option value="${b.id}">${b.id} • ${b.asset}</option>`).join('')}</select><label class="font-mono text-[10px] text-mutedx block mt-4">TARGET</label><select id="restoreTarget" class="w-full mt-2 bg-paper border border-line rounded-xl px-3 py-3"><option>New isolated sandbox</option><option>orders-db-primary (staging)</option><option>Production — approval required</option></select><label class="font-mono text-[10px] text-mutedx block mt-4">PITR TIMESTAMP</label><input type="datetime-local" class="w-full mt-2 bg-paper border border-line rounded-xl px-3 py-3"><div class="bg-paper rounded-xl p-4 mt-4 font-mono text-[11px]">Pre-flight: checksums • capacity • KMS • network • rollback snapshot</div><button onclick="executeRestore()" data-perm="backup:restore" class="btn-lime w-full mt-4 py-3 rounded-full font-bold">Start Restore →</button></div><div class="bg-limex border-2 border-ink rounded-[18px] p-6"><b class="font-grotesk">Safety Guarantees</b><div class="mt-4 space-y-2 text-[13px]">✓ Source backup never mutated<br>✓ Target snapshot before overwrite<br>✓ One-click rollback<br>✓ Full audit trail<br>✓ Checksum verification</div></div></div>`;
 applyPerms();
};
function executeRestore(){if(!can('backup:restore')){toast('Permission denied','Your role cannot restore backups.','crit');return}const id=$('#rsBackup')?.value||'backup';toast('Restore started',`<b>${id}</b> passed pre-flight and restore has been queued.`,'ok');auditPush('RESTORE_INITIATE',id)}

RENDER.security=()=>{
 const el=$('[data-view="security"]');
 el.innerHTML=`${sectionHead('GOVERN • SECURITY','Security Center','Identity, encryption, anomaly response and compliance posture.')}<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">${[['MFA','100%','ENFORCED'],['Encryption','AES-256','ACTIVE'],['Immutable backups','100%','WORM'],['Threat detection','98.4%','CONFIDENCE']].map(x=>`<div class="bg-white border border-line rounded-[18px] p-5"><div class="font-mono text-[9px] text-mutedx">${x[0]}</div><b class="font-grotesk text-[25px]">${x[1]}</b><div class="font-mono text-[10px] text-green-600">${x[2]}</div></div>`).join('')}</div><div class="bg-white border border-line rounded-[18px] p-5 mt-4"><b>Security controls</b><div class="grid md:grid-cols-2 gap-3 mt-4">${['KMS key rotation','Least-privilege IAM','Network segmentation','Audit trail integrity','Anomaly quarantine','WORM retention lock'].map(x=>`<div class="bg-paper rounded-xl p-3 flex justify-between"><span class="text-[13px]">${x}</span><span class="pill bg-limex text-ink">PASS</span></div>`).join('')}</div></div>`;
};

RENDER.audit=()=>{
 const el=$('[data-view="audit"]');
 el.innerHTML=`${sectionHead('GOVERN • COMPLIANCE','Compliance Reports','Exportable evidence and immutable activity history.')}<div class="flex gap-2 mb-4"><button onclick="exportReport()" data-perm="report:export" class="btn-ink px-5 py-2.5 rounded-full text-[12px] font-bold">⬇ Export SOC2 Pack</button><button onclick="exportReport()" data-perm="audit:export" class="btn-lime px-5 py-2.5 rounded-full text-[12px] font-bold">Export Audit CSV</button></div><div class="bg-white border border-line rounded-[18px] overflow-hidden"><table class="tbl w-full"><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Resource</th><th>Status</th></tr></thead><tbody>${AUDIT.map(a=>`<tr><td class="font-mono text-[11px]">${a.t}</td><td class="font-mono text-[11px]">${a.user}</td><td><span class="pill bg-ink text-limex">${a.act}</span></td><td>${a.res}</td><td><span class="pill ${a.st==='success'?'bg-limex text-ink':'bg-red-500 text-white'}">${a.st}</span></td></tr>`).join('')}</tbody></table></div>`;
 applyPerms();
};
function exportReport(){toast('Report queued','Compliance evidence pack is being compiled.','info');auditPush('REPORT_EXPORT','soc2-evidence-pack')}

const USERS=[['A. Rahman','a.rahman@vault.io','ADMIN','MFA'],['M. Okafor','m.okafor@vault.io','OPERATOR','MFA'],['S. Chen','s.chen@vault.io','OPERATOR','MFA'],['L. Gomez','l.gomez@vault.io','AUDITOR','NO MFA'],['J. Doe','j.doe@partner.io','VIEWER','NO MFA']];
RENDER.iam=()=>{
 const el=$('[data-view="iam"]');
 el.innerHTML=`${sectionHead('GOVERN • USERS','Users & Access','RBAC roles and identity controls.')}<div class="flex justify-end mb-4"><button onclick="inviteModal()" class="btn-ink px-5 py-2.5 rounded-full font-bold text-[12px]">+ Invite User</button></div><div class="bg-white border border-line rounded-[18px] overflow-hidden"><table class="tbl w-full"><thead><tr><th>User</th><th>Role</th><th>MFA</th><th>Action</th></tr></thead><tbody>${USERS.map(u=>`<tr><td><b>${u[0]}</b><div class="font-mono text-[10px] text-mutedx">${u[1]}</div></td><td><span class="pill bg-ink text-limex">${u[2]}</span></td><td>${u[3]}</td><td><button onclick="toast('IAM','Role policy re-evaluated.','info')" class="font-mono text-[10px] underline">MANAGE</button></td></tr>`).join('')}</tbody></table></div>`;
};
function inviteModal(){modal(`<div class="p-7"><h2 class="font-grotesk text-[22px] font-bold">Invite Team Member</h2><input placeholder="name@company.io" class="w-full mt-5 bg-paper border border-line rounded-xl px-4 py-3"><select class="w-full mt-3 bg-paper border border-line rounded-xl px-4 py-3"><option>Operator</option><option>Auditor</option><option>Viewer</option><option>Admin</option></select><button onclick="closeModal();toast('Invite sent','Invitation created successfully.','ok')" class="btn-lime w-full mt-5 py-3 rounded-full font-bold">Send Invite →</button></div>`)}

RENDER.settings=()=>{
 const el=$('[data-view="settings"]');
 el.innerHTML=`${sectionHead('GOVERN • PLATFORM','Settings','Organization, notifications, billing and API configuration.')}<div class="grid xl:grid-cols-2 gap-4"><div class="bg-white border border-line rounded-[18px] p-6"><b>General</b><div class="grid md:grid-cols-2 gap-3 mt-4"><input value="Cloud Resilience Inc." class="bg-paper border border-line rounded-xl px-3 py-3"><select class="bg-paper border border-line rounded-xl px-3 py-3"><option>us-east-1</option><option>eu-west-1</option></select><select class="bg-paper border border-line rounded-xl px-3 py-3"><option>Global</option><option>EU Only</option><option>US Only</option></select><select class="bg-paper border border-line rounded-xl px-3 py-3"><option>UTC</option><option>Asia/Kolkata</option></select></div><button onclick="toast('Settings saved','Platform configuration updated.','ok')" class="btn-lime mt-4 px-5 py-2.5 rounded-full font-bold text-[12px]">Save Settings</button></div><div class="bg-ink text-white rounded-[18px] p-6"><div class="font-mono text-[10px] text-limex">BUSINESS PLAN</div><div class="font-grotesk text-[34px] font-bold mt-1">$1,890<span class="text-[13px] text-white/40">/mo</span></div><div class="font-mono text-[10px] text-white/50">250 assets • 25TB</div><div class="h-2 bg-white/10 rounded-full mt-5"><div class="h-full bg-limex rounded-full" style="width:73%"></div></div><button onclick="toast('Billing','Invoice portal opened.','info')" class="btn-lime w-full mt-5 py-2.5 rounded-full font-bold">Manage Billing</button></div><div class="bg-white border border-line rounded-[18px] p-6"><b>Notifications</b><div class="mt-4 space-y-2">${['Slack #incidents','PagerDuty SRE','Email digests'].map(x=>`<div class="bg-paper rounded-xl p-3 flex justify-between"><span>${x}</span><span class="pill bg-limex text-ink">ACTIVE</span></div>`).join('')}</div></div><div class="bg-white border border-line rounded-[18px] p-6"><b>API & Webhooks</b><div class="mt-4 bg-paper rounded-xl p-3 font-mono text-[10px]">https://api.sentinelvault.local/hooks/dr</div><button onclick="toast('Webhook tested','200 OK • 184ms','ok')" class="mt-3 font-mono text-[10px] underline">TEST WEBHOOK</button></div></div>`;
};

function openPalette(){$('#palette').classList.remove('hidden');$('#paletteInput').value='';renderPalette('');setTimeout(()=>$('#paletteInput').focus(),20)}
function closePalette(){$('#palette').classList.add('hidden')}
function renderPalette(q){
 const items=TOP.map(x=>[x[2],x[0]]).concat([['Run backup now','backups'],['Run DR simulator','simulator'],['Export report','audit']]);
 const f=items.filter(x=>!q||(x[0]+x[1]).toLowerCase().includes(q.toLowerCase()));
 $('#paletteList').innerHTML=f.map(x=>`<button onclick="closePalette();switchView('${x[1]}')" class="w-full text-left px-3 py-3 rounded-xl hover:bg-paper flex justify-between"><b>${x[0]}</b><span class="font-mono text-[10px] text-mutedx">${x[1]}</span></button>`).join('');
}
function toggleNotifs(e){
 e.stopPropagation();const d=$('#notifDrop');d.classList.toggle('hidden');
 if(!d.classList.contains('hidden'))d.innerHTML=`<div class="p-4 border-b border-line flex justify-between"><b>Notifications</b><span class="pill bg-limex text-ink">4 NEW</span></div>${ALERTS.slice(0,4).map(a=>`<div class="p-4 border-b border-line"><div class="font-mono text-[9px] text-mutedx">${a.time} • ${a.src}</div><b class="text-[13px]">${a.title}</b></div>`).join('')}<button onclick="$('#notifDrop').classList.add('hidden');switchView('monitor')" class="w-full py-3 bg-ink text-limex font-mono text-[10px]">VIEW MONITORING →</button>`;
}
document.addEventListener('click',e=>{const d=$('#notifDrop');if(d&&!d.contains(e.target)&&!e.target.closest('[onclick*="toggleNotifs"]'))d.classList.add('hidden')});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette()}if(e.key==='Escape'){closePalette();closeModal()}});

const WORKFLOW=[['PROTECT','backups'],['BACKUP','backups'],['MONITOR','monitor'],['DETECT','analytics'],['FAILOVER','recovery'],['RECOVER','restore'],['VERIFY','backups'],['REPORT','audit']];
$('#workflowSteps').innerHTML=WORKFLOW.map((x,i)=>`<button onclick="launchConsole('${x[1]}')" class="bg-white/[.06] border border-white/10 rounded-xl p-3 hover:bg-limex hover:text-ink transition"><div class="font-mono text-[9px] text-limex">${String(i+1).padStart(2,'0')}</div><div class="font-grotesk font-bold text-[11px] mt-2">${x[0]}</div></button>`).join('');

const FEATURES=[
 ['Automated Backup Orchestration','Policy-driven full, incremental and snapshot scheduling.','backups'],
 ['Cross-Region Replication','Continuous replication with health and lag telemetry.','replication'],
 ['One-Click Failover & PITR','Recovery plans with RTO/RPO controls.','recovery'],
 ['Python ML Threat Detection','Anomaly scoring for suspicious behavior.','analytics'],
 ['Real-Time Observability','Streaming RPO, RTO, lag and throughput metrics.','monitor'],
 ['Compliance-Ready Reports','Audit history and evidence exports.','audit']
];
$('#featureGrid').innerHTML=FEATURES.map(x=>`<div onclick="launchConsole('${x[2]}')" class="card-hover bg-white border border-line rounded-[20px] p-6 cursor-pointer"><div class="w-11 h-11 rounded-xl bg-ink text-limex flex items-center justify-center text-xl">◆</div><h3 class="font-grotesk font-bold text-[18px] mt-4">${x[0]}</h3><p class="text-[13px] text-mutedx mt-2 leading-relaxed">${x[1]}</p><div class="font-mono text-[10px] font-bold mt-4">OPEN MODULE →</div></div>`).join('');

$('#stackCards').innerHTML=[['⚛️','React 18 Frontend','Vite + Tailwind console'],['▲','Express.js API','REST + RBAC + jobs'],['🐘','Supabase PostgreSQL','Jobs + policies + audit'],['🐍','Python ML Service','Anomaly + forecasting']].map(x=>`<div class="bg-white border border-line rounded-[20px] p-6 card-hover"><div class="text-2xl">${x[0]}</div><b class="font-grotesk block mt-3">${x[1]}</b><p class="text-[12px] text-mutedx mt-2">${x[2]}</p></div>`).join('');

$('#pricingGrid').innerHTML=[['Starter','$490','50 assets • 5TB • Daily backups','backups'],['Business','$1,890','250 assets • 25TB • ML • SSO','overview'],['Enterprise','Custom','Unlimited • 6 regions • Dedicated ML','settings']].map((x,i)=>`<div class="${i===1?'bg-ink text-white border-2 border-limex':'bg-white border border-line'} rounded-[22px] p-7"><b class="font-grotesk text-[20px]">${['Starter','Business','Enterprise'][i]}</b><div class="font-grotesk text-[38px] font-bold mt-3">${x[1]}</div><p class="text-[13px] ${i===1?'text-white/60':'text-mutedx'} mt-2">${x[2]}</p><button onclick="launchConsole('${x[3]}')" class="${i===1?'btn-lime':'btn-ink'} w-full mt-6 py-3 rounded-full font-bold text-[12px]">Open Console →</button></div>`).join('');

renderNavigation();
const heroData=[820,940,880,1020,990,1100,1080,1150,1210,1180,1260,1310,1290,1380];
setTimeout(()=>drawChart('heroChart','line',heroData),100);
$('#heroJobs').innerHTML=BACKUPS.slice(0,4).map(b=>`<div class="bg-white/[.05] border border-white/10 rounded-xl p-2.5 flex items-center gap-2"><span class="dot ${b.status==='Failed'?'bg-red-400':'bg-limex'}"></span><span class="font-mono text-[10px] flex-1">${b.id} • ${b.asset}</span><span class="font-mono text-[9px] text-white/50">${b.status}</span></div>`).join('');
