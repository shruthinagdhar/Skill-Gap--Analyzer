if(typeof pdfjsLib!=='undefined')pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ── CANVAS PARTICLES ──
(()=>{
  const c=document.getElementById('pc'),ctx=c.getContext('2d');let W,H,pts=[];
  const N=70,cols=['rgba(0,229,255,','rgba(124,58,237,','rgba(244,114,182,'];
  function resize(){W=c.width=innerWidth;H=c.height=innerHeight;}resize();addEventListener('resize',resize);
  for(let i=0;i<N;i++)pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,r:Math.random()*1.8+.4,c:cols[i%3],a:Math.random()*.45+.15});
  function draw(){ctx.clearRect(0,0,W,H);pts.forEach(p=>{p.x=(p.x+p.vx+W)%W;p.y=(p.y+p.vy+H)%H;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.c+p.a+')';ctx.fill();});
  for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.hypot(dx,dy);if(d<115){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(0,229,255,${.065*(1-d/115)})`;ctx.lineWidth=.5;ctx.stroke();}}requestAnimationFrame(draw);}draw();
})();

// ── CURSOR ──
const cur=document.getElementById('cur'),curR=document.getElementById('curR');let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.style.left=mx+'px';cur.style.top=my+'px';});
(function anim(){rx+=(mx-rx)*.1;ry+=(my-ry)*.1;curR.style.left=rx+'px';curR.style.top=ry+'px';requestAnimationFrame(anim);})();
document.querySelectorAll('button,a,[onclick],.si,.jc,.ftab').forEach(el=>{el.addEventListener('mouseenter',()=>cur.style.transform='translate(-50%,-50%) scale(2.5)');el.addEventListener('mouseleave',()=>cur.style.transform='translate(-50%,-50%) scale(1)');});

// ── STATE ──
let U={name:'',email:'',initials:''},sJob='',resumeText='',ar=null,anCount=0;

// ── NAV ──
function go(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(id).classList.add('active');scrollTo(0,0);}
function sec(id,el){
  document.querySelectorAll('.sect').forEach(s=>s.classList.remove('on'));
  document.querySelectorAll('.si').forEach(s=>s.classList.remove('on'));
  document.getElementById('sect-'+id).classList.add('on');
  if(el)el.classList.add('on');
  if(id==='res')showRes();
  if(id==='ac')renderC();
  if(id==='rm')showRM();
}

// ── AUTH ──
function doLogin(){const e=document.getElementById('li-e').value||'demo@klh.ac.in';const n=e.split('@')[0].replace(/[._]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());U.name=n;U.initials=n.slice(0,2).toUpperCase();U.email=e;boot();}
function doSignup(){const f=document.getElementById('su-f').value||'User';const l=document.getElementById('su-l').value||'';U.name=f+(l?' '+l:'');U.email=document.getElementById('su-e').value||'user@example.com';U.initials=(f[0]+(l?l[0]:f[1]||'')).toUpperCase();const r=document.getElementById('su-r').value;if(r)sJob=r;boot();sec('az',null);}
function ql(p){U.name='Demo User';U.initials='DU';U.email='demo@klh.ac.in';toast('Signed in with '+p,'suc');setTimeout(boot,400);}
function boot(){['dav','sb-av'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=U.initials||'?';});document.getElementById('du').textContent=U.name.split(' ')[0];document.getElementById('sb-nm').textContent=U.name||'User';document.getElementById('gname').textContent=U.name.split(' ')[0]||'there';document.getElementById('pn').value=U.name;document.getElementById('pe').value=U.email;document.getElementById('pr2').value=sJob;document.getElementById('ps-role').textContent=sJob||'Not set';renderC();go('pg-dash');}

// ── FILE HANDLING ──
async function onFile(inp){
  if(!inp.files[0])return;
  const f=inp.files[0];
  toast('Reading your resume...','inf');
  try{
    resumeText=await extractText(f);
    document.getElementById('uico').textContent='✅';
    document.getElementById('utitle').textContent='📎 '+f.name;
    document.getElementById('udesc').textContent='✓ Ready · '+(f.size/1024).toFixed(0)+' KB extracted';
    document.getElementById('uz').classList.add('done');
    document.getElementById('resume-preview').style.display='block';
    document.getElementById('resume-chars').textContent=resumeText.length.toLocaleString();
    stepDone(1);stepAct(2);lineDone(1);
    toast('Resume ready! '+resumeText.length+' characters extracted.','suc');
  }catch(e){toast('Could not read file: '+e.message,'err');}
}
function onDrop(e){e.preventDefault();document.getElementById('uz').classList.remove('drag');const f=e.dataTransfer.files[0];if(f){document.getElementById('rf').files=e.dataTransfer.files;onFile(document.getElementById('rf'));}}

async function extractText(file){
  const name=file.name.toLowerCase();
  if(name.endsWith('.txt')){
    return await file.text();
  } else if(name.endsWith('.pdf')){
    return await extractPDF(file);
  } else {
    // DOCX/DOC — try as text (partial), or ArrayBuffer
    try{
      const text=await file.text();
      // Clean non-printable chars from docx xml
      const cleaned=text.replace(/<[^>]+>/g,' ').replace(/[^\x20-\x7E\n\r\t]/g,' ').replace(/\s+/g,' ').trim();
      if(cleaned.length>100)return cleaned;
    }catch(e){}
    // Fallback: ArrayBuffer
    const buf=await file.arrayBuffer();
    const bytes=new Uint8Array(buf);
    let str='';for(let i=0;i<Math.min(bytes.length,50000);i++){const c=bytes[i];if(c>=32&&c<127)str+=String.fromCharCode(c);}
    return str.replace(/\s+/g,' ').trim();
  }
}

async function extractPDF(file){
  if(typeof pdfjsLib==='undefined')throw new Error('PDF.js not loaded');
  const ab=await file.arrayBuffer();
  const pdf=await pdfjsLib.getDocument({data:ab}).promise;
  let text='';
  for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i);
    const content=await page.getTextContent();
    text+=content.items.map(item=>item.str).join(' ')+'\n';
  }
  if(text.trim().length<50)throw new Error('Could not extract text — try a text-based PDF or paste as TXT');
  return text;
}

// ── JOB ROLE ──
function pj(el,n){
  document.querySelectorAll('.jc').forEach(c=>c.classList.remove('pk'));
  el.classList.add('pk');
  sJob=n;
  document.getElementById('custom-role').value='';
  showRoleBadge(n);
  stepDone(2);stepAct(3);lineDone(2);
}
function setCustomRole(){
  const v=document.getElementById('custom-role').value.trim();
  if(!v){toast('Please enter a role name','err');return;}
  sJob=v;
  document.querySelectorAll('.jc').forEach(c=>c.classList.remove('pk'));
  showRoleBadge(v);
  stepDone(2);stepAct(3);lineDone(2);
  toast('Custom role set: '+v,'suc');
}
function clearRole(){sJob='';document.getElementById('role-badge').style.display='none';document.getElementById('custom-role').value='';document.querySelectorAll('.jc').forEach(c=>c.classList.remove('pk'));}
function showRoleBadge(name){const b=document.getElementById('role-badge');document.getElementById('role-badge-text').textContent=name;b.style.display='inline-flex';}

function stepDone(n){const e=document.getElementById('s'+n);e.classList.remove('act','done');e.classList.add('done');e.textContent='✓';document.getElementById('sl'+n).classList.remove('act');}
function stepAct(n){const e=document.getElementById('s'+n);if(e){e.classList.add('act');document.getElementById('sl'+n).classList.add('act');}}
function lineDone(n){const e=document.getElementById('ln'+n);if(e)e.classList.add('done');}

// ── SKILL DATABASE ──
// Comprehensive skill sets per role + synonyms
const ROLE_SKILLS={
  'Full Stack Developer':{req:['React','Node.js','JavaScript','TypeScript','Python','SQL','PostgreSQL','MongoDB','Docker','AWS','Git','REST API','GraphQL','Redis','Kubernetes','CI/CD','HTML','CSS','Express.js','Next.js','Webpack','Jest','System Design','Linux','Microservices'],cats:{Frontend:['React','HTML','CSS','TypeScript','JavaScript','Next.js','Webpack'],'Backend':['Node.js','Python','Express.js','REST API','GraphQL','Microservices'],'DevOps/Cloud':['Docker','AWS','Kubernetes','CI/CD','Linux'],'Databases':['SQL','PostgreSQL','MongoDB','Redis'],'Architecture':['System Design','Microservices'],'Tools':['Git','Jest']}},
  'Data Scientist':{req:['Python','Machine Learning','TensorFlow','PyTorch','Pandas','NumPy','SQL','Statistics','Scikit-learn','Matplotlib','Seaborn','Deep Learning','NLP','Spark','Tableau','Power BI','R','A/B Testing','Feature Engineering','Data Visualization','XGBoost','Jupyter','Git','Statistics','Cloud ML'],cats:{'Programming':['Python','R','SQL'],'ML/AI':['Machine Learning','Deep Learning','NLP','TensorFlow','PyTorch','Scikit-learn','XGBoost'],'Data Tools':['Pandas','NumPy','Matplotlib','Seaborn','Jupyter'],'Data Engineering':['Spark','A/B Testing','Feature Engineering'],'Visualization':['Tableau','Power BI','Data Visualization'],'Cloud':['Cloud ML']}},
  'ML Engineer':{req:['Python','TensorFlow','PyTorch','MLOps','Docker','Kubernetes','AWS','REST API','CI/CD','Spark','SQL','Scala','Git','Airflow','Kafka','Model Monitoring','Feature Store','ONNX','Linux','Distributed Systems','A/B Testing','Data Pipelines','FastAPI','Prometheus','System Design'],cats:{'ML Frameworks':['TensorFlow','PyTorch','ONNX'],'MLOps':['MLOps','Model Monitoring','Feature Store','Airflow'],'Infrastructure':['Docker','Kubernetes','AWS','Kafka','Prometheus','Distributed Systems'],'Programming':['Python','Scala','SQL'],'APIs':['REST API','FastAPI'],'Tools':['Git','CI/CD','Linux']}},
  'DevOps Engineer':{req:['Docker','Kubernetes','Terraform','AWS','GCP','CI/CD','Jenkins','Ansible','Prometheus','Grafana','Linux','Shell Scripting','Python','Git','Vault','ArgoCD','Helm','ELK Stack','Nginx','Networking','Security','Redis','Kafka','Istio','Cloudformation'],cats:{'Containers':['Docker','Kubernetes','Helm','Istio'],'Cloud':['AWS','GCP','Terraform','Cloudformation'],'CI/CD':['CI/CD','Jenkins','ArgoCD'],'Monitoring':['Prometheus','Grafana','ELK Stack'],'Automation':['Ansible','Vault','Shell Scripting'],'Networking':['Nginx','Networking','Linux']}},
  'Cloud Architect':{req:['AWS','Azure','GCP','Terraform','Docker','Kubernetes','Networking','Security','IAM','Serverless','CDN','Load Balancing','Monitoring','High Availability','Disaster Recovery','Microservices','Cost Optimization','DevOps','Python','System Design','API Gateway','Compliance','FinOps','Event-Driven Architecture','Multi-Cloud'],cats:{'Cloud Platforms':['AWS','Azure','GCP','Multi-Cloud'],'IaC':['Terraform','Cloudformation'],'Architecture':['System Design','Microservices','Event-Driven Architecture','API Gateway'],'Security':['Security','IAM','Compliance'],'Networking':['Networking','CDN','Load Balancing'],'Operations':['Monitoring','High Availability','Disaster Recovery','FinOps','Cost Optimization']}},
  'Cybersecurity Analyst':{req:['Network Security','Penetration Testing','SIEM','Firewalls','Python','SOC','Vulnerability Assessment','Cloud Security','Incident Response','OWASP','Cryptography','Linux','Risk Management','Compliance','Threat Intelligence','Malware Analysis','Forensics','Zero Trust','WAF','DevSecOps','IDS/IPS','CISSP','CEH','Nmap','Metasploit'],cats:{'Security Ops':['SIEM','SOC','Incident Response','Threat Intelligence','Forensics'],'Offensive':['Penetration Testing','Vulnerability Assessment','Nmap','Metasploit'],'Defensive':['Firewalls','IDS/IPS','WAF','Zero Trust','OWASP'],'Cloud/Infra':['Cloud Security','DevSecOps','Linux'],'Compliance':['Risk Management','Compliance','Cryptography','CISSP','CEH'],'Tools':['Python']}},
  'Product Manager':{req:['Product Roadmap','Agile','Scrum','JIRA','User Research','Data Analysis','A/B Testing','Stakeholder Management','UX Design','OKRs','Competitive Analysis','SQL','Figma','Customer Interviews','Feature Prioritization','Sprint Planning','Market Research','Monetization','KPIs','Communication','Go-To-Market','Analytics','Pricing Strategy','Backlog Management','Product Strategy'],cats:{'Methodology':['Agile','Scrum','Sprint Planning','Backlog Management'],'Tools':['JIRA','Figma','Analytics'],'Research':['User Research','Customer Interviews','Market Research','Competitive Analysis'],'Data':['Data Analysis','A/B Testing','SQL','KPIs'],'Strategy':['Product Strategy','OKRs','Pricing Strategy','Monetization','Go-To-Market'],'Communication':['Stakeholder Management','Communication']}},
  'UI/UX Designer':{req:['Figma','Adobe XD','Sketch','Prototyping','User Research','Wireframing','Design Systems','Typography','Color Theory','Usability Testing','HTML','CSS','Motion Design','Accessibility','User Flows','Information Architecture','A/B Testing','Zeplin','Design Thinking','Responsive Design','Illustration','Brand Design','Component Libraries','Interaction Design','Storybook'],cats:{'Design Tools':['Figma','Adobe XD','Sketch','Zeplin','Storybook'],'Research':['User Research','Usability Testing','Design Thinking','Information Architecture'],'Visual':['Typography','Color Theory','Illustration','Brand Design','Motion Design'],'Development':['HTML','CSS','Responsive Design','Accessibility'],'Process':['Prototyping','Wireframing','Design Systems','User Flows','Component Libraries','Interaction Design']}},
  'Backend Developer':{req:['Python','Java','Node.js','Go','SQL','PostgreSQL','MongoDB','Redis','REST API','GraphQL','Microservices','Docker','AWS','Kafka','Elasticsearch','gRPC','Authentication','Authorization','System Design','Performance Optimization','Git','Linux','Caching','Load Balancing','API Design'],cats:{'Languages':['Python','Java','Node.js','Go'],'Databases':['SQL','PostgreSQL','MongoDB','Redis','Elasticsearch'],'APIs':['REST API','GraphQL','gRPC','API Design'],'Infrastructure':['Docker','AWS','Kafka','Load Balancing','Caching'],'Architecture':['Microservices','System Design','Performance Optimization'],'Security':['Authentication','Authorization']}},
  'Frontend Developer':{req:['React','Vue.js','Angular','JavaScript','TypeScript','HTML','CSS','Sass','Tailwind CSS','Next.js','Webpack','Vite','GraphQL','REST API','Jest','Cypress','Performance Optimization','Accessibility','Responsive Design','Git','Redux','State Management','Web Components','PWA','SEO'],cats:{'Frameworks':['React','Vue.js','Angular','Next.js'],'Languages':['JavaScript','TypeScript','HTML','CSS','Sass'],'Styling':['Tailwind CSS','Responsive Design','Accessibility'],'Build Tools':['Webpack','Vite'],'Testing':['Jest','Cypress'],'State':['Redux','State Management'],'APIs':['GraphQL','REST API']}},
  'Android Developer':{req:['Kotlin','Java','Android SDK','Jetpack Compose','MVVM','Retrofit','Room DB','Firebase','Coroutines','Dagger/Hilt','Git','Play Store','Gradle','REST API','SQLite','Material Design','Unit Testing','CI/CD','Performance Optimization','Bluetooth/NFC','App Architecture','LiveData','ViewModel','WorkManager','Navigation Component'],cats:{'Languages':['Kotlin','Java'],'Frameworks':['Jetpack Compose','Android SDK','Coroutines','LiveData','ViewModel'],'Architecture':['MVVM','App Architecture','Navigation Component','WorkManager'],'Libraries':['Retrofit','Room DB','Dagger/Hilt','Firebase'],'Tools':['Git','Gradle','Play Store','CI/CD'],'Testing':['Unit Testing']}},
  'Data Engineer':{req:['Python','SQL','Spark','Airflow','Kafka','dbt','Snowflake','AWS','GCP','BigQuery','Redshift','ETL','Data Modeling','Data Warehousing','Docker','Git','Scala','Hadoop','Delta Lake','Data Quality','Orchestration','Databricks','Stream Processing','Batch Processing','Data Pipelines'],cats:{'Languages':['Python','SQL','Scala'],'Processing':['Spark','Kafka','Stream Processing','Batch Processing','Hadoop'],'Orchestration':['Airflow','Orchestration','dbt'],'Cloud':['AWS','GCP','Snowflake','BigQuery','Redshift','Databricks'],'Architecture':['ETL','Data Modeling','Data Warehousing','Delta Lake','Data Pipelines'],'Tools':['Docker','Git']}},
  'QA Engineer':{req:['Selenium','Playwright','Cypress','Python','Java','JavaScript','Manual Testing','Automation Testing','API Testing','Performance Testing','Postman','JIRA','Git','CI/CD','Agile','Test Planning','Bug Reporting','JMeter','SQL','Mobile Testing','Security Testing','TestNG','JUnit','BDD/TDD','Gatling'],cats:{'Automation':['Selenium','Playwright','Cypress','TestNG','JUnit'],'Testing Types':['Manual Testing','Automation Testing','API Testing','Performance Testing','Security Testing','Mobile Testing','BDD/TDD'],'Tools':['Postman','JMeter','JIRA','Gatling'],'Languages':['Python','Java','JavaScript','SQL'],'Process':['CI/CD','Agile','Test Planning','Bug Reporting','Git']}},
  'Blockchain Developer':{req:['Solidity','Ethereum','Web3.js','Ethers.js','Smart Contracts','Hardhat','Truffle','IPFS','DeFi','NFT','JavaScript','Python','Cryptography','Consensus Mechanisms','Layer 2','Polygon','Chainlink','OpenZeppelin','Gas Optimization','Security Auditing','React','Node.js','Rust','Solana','Go'],cats:{'Smart Contracts':['Solidity','Smart Contracts','OpenZeppelin','Gas Optimization','Security Auditing'],'Web3':['Web3.js','Ethers.js','IPFS','DeFi','NFT'],'Platforms':['Ethereum','Polygon','Solana','Layer 2','Chainlink'],'Dev Tools':['Hardhat','Truffle'],'Languages':['JavaScript','Python','Rust','Go'],'Concepts':['Cryptography','Consensus Mechanisms']}},
  'iOS Developer':{req:['Swift','SwiftUI','Objective-C','Xcode','UIKit','Core Data','Combine','CocoaPods','SPM','REST API','Firebase','Git','App Store','MVVM','Core Location','Push Notifications','Unit Testing','CI/CD','Performance Optimization','Core Animation','ARKit','Core ML','WidgetKit','CloudKit','TestFlight'],cats:{'Languages':['Swift','Objective-C'],'UI Frameworks':['SwiftUI','UIKit','Core Animation','ARKit'],'Architecture':['MVVM','Combine'],'Data':['Core Data','CloudKit','Firebase'],'Tools':['Xcode','CocoaPods','SPM','Git','TestFlight','App Store','CI/CD'],'APIs':['REST API','Core Location','Push Notifications','Core ML','WidgetKit']}},
  'Site Reliability Engineer':{req:['Linux','Python','Go','Kubernetes','Docker','Terraform','Prometheus','Grafana','PagerDuty','SLI/SLO/SLA','Incident Management','Automation','CI/CD','AWS','GCP','Chaos Engineering','Distributed Systems','Networking','Load Balancing','Database Administration','Git','Ansible','ELK Stack','Capacity Planning','Observability'],cats:{'Operations':['SLI/SLO/SLA','Incident Management','Capacity Planning','Observability','Chaos Engineering'],'Infrastructure':['Kubernetes','Docker','Terraform','Ansible','Linux'],'Cloud':['AWS','GCP'],'Monitoring':['Prometheus','Grafana','PagerDuty','ELK Stack'],'Languages':['Python','Go'],'Networking':['Networking','Load Balancing','Distributed Systems']}},
};

// SYNONYMS MAP — if resume contains these, count as known skill
const SYNONYMS={
  'React':['react.js','reactjs','react native'],'Node.js':['nodejs','node js'],'JavaScript':['js','ecmascript','es6','es2015'],'TypeScript':['ts','typescript'],'Python':['python3','python2','py'],
  'SQL':['mysql','sqlite','plsql','t-sql','mssql'],'PostgreSQL':['postgres','pg','psql'],'MongoDB':['mongo','mongoose'],'REST API':['rest','restful','rest apis','api'],'GraphQL':['gql'],'Docker':['dockerfile','docker-compose','container'],'Kubernetes':['k8s','kubectl','helm'],'AWS':['amazon web services','ec2','s3','lambda','ecs','eks','rds'],'GCP':['google cloud','bigquery'],'Azure':['microsoft azure'],'CI/CD':['cicd','github actions','gitlab ci','jenkins','travis','pipeline'],'Git':['github','gitlab','bitbucket','version control'],'Linux':['unix','bash','ubuntu','centos','debian'],'Machine Learning':['ml','machine learning','ml models'],'Deep Learning':['dl','neural network','neural networks','cnn','rnn','lstm'],'TensorFlow':['tensorflow','tf'],'PyTorch':['pytorch','torch'],'Pandas':['pandas dataframe'],'NumPy':['numpy','np'],'Scikit-learn':['sklearn','scikit learn'],'HTML':['html5','html/css'],'CSS':['css3','scss','sass','html/css'],'Tailwind CSS':['tailwind'],'Next.js':['nextjs','next js'],'Vue.js':['vue','vuejs'],'Angular':['angularjs','angular2+'],'Kotlin':['android kotlin'],'Swift':['ios swift'],'Solidity':['solidity smart contract'],'Agile':['agile methodology','scrum','sprint'],'JIRA':['jira board','atlassian jira'],'Figma':['figma design'],'User Research':['ux research','user interviews'],'Selenium':['selenium webdriver'],'Prometheus':['prom'],'Terraform':['tf infra','iac'],'Airflow':['apache airflow'],'Kafka':['apache kafka'],'Spark':['apache spark','pyspark'],'Elasticsearch':['elastic search','es'],'Redis':['redis cache'],'System Design':['system architecture','architecture design'],'Microservices':['microservice','micro services'],'DevOps':['devops practices','dev ops'],'A/B Testing':['ab testing','split testing','experimentation'],'Data Analysis':['data analytics','data analysis'],'Statistics':['statistical analysis','statistical modeling'],'Penetration Testing':['pentest','pen test','ethical hacking'],'Network Security':['network protection','firewall management'],'SIEM':['security information','splunk','qradar'],'Vulnerability Assessment':['vapt','vulnerability scan'],'Incident Response':['incident management','security incident'],'Shell Scripting':['bash scripting','shell script','bash script'],'Data Visualization':['data viz','tableau','power bi visualization'],'Feature Engineering':['feature extraction','feature selection'],'ETL':['extract transform load','etl pipeline'],'Swagger':['openapi','swagger docs'],'FastAPI':['fast api'],'gRPC':['grpc','protocol buffers'],'Responsive Design':['responsive web','mobile responsive'],'Accessibility':['a11y','wcag','aria'],'Component Libraries':['component library','storybook','design system'],'API Design':['api design','restful api design']
};

// SKILL EXTRACTOR — reads resume text and checks for skills
function extractSkillsFromText(text){
  const lower=text.toLowerCase();
  const found=new Set();
  // Grab role skills
  const allSkills=new Set();
  Object.values(ROLE_SKILLS).forEach(r=>r.req.forEach(s=>allSkills.add(s)));
  // Check each skill directly + via synonyms
  allSkills.forEach(skill=>{
    const sl=skill.toLowerCase();
    if(lower.includes(sl)){found.add(skill);return;}
    const syns=SYNONYMS[skill]||[];
    for(const syn of syns){if(lower.includes(syn.toLowerCase())){found.add(skill);break;}}
  });
  // Also look for experience keywords → infer related skills
  if(lower.includes('react')&&(lower.includes('redux')||lower.includes('hooks')))found.add('React');
  if(lower.includes('aws')&&lower.includes('serverless'))found.add('Serverless');
  if(lower.includes('agile')||lower.includes('scrum')||lower.includes('sprint'))found.add('Agile');
  if(lower.includes('machine learning')||lower.includes('neural'))found.add('Machine Learning');
  if(lower.includes('penetrat')||lower.includes('ethical hack'))found.add('Penetration Testing');
  return found;
}

// Generate insights text
function genInsights(score,matched,missing,role,level){
  const pct=score;
  let verdict='';
  if(pct>=80)verdict='You are a strong candidate for this role.';
  else if(pct>=60)verdict='You have a solid foundation but need a few key skills.';
  else if(pct>=40)verdict='You have relevant experience but significant gaps to close.';
  else verdict='You are at an early stage — a structured learning plan will be highly beneficial.';
  const top3=missing.slice(0,3);
  return `${verdict} Based on your resume, you currently match ${matched} out of the core required skills for ${role} (${pct}% match rate)${level?' — placing you at '+level+' level':''}. ${top3.length>0?'Your top priority gaps are: '+top3.join(', ')+'. Focus on these first for maximum hiring impact.':'You match all required skills!'}`;
}

// Main analysis runner
function analyzeResume(text,role){
  const roleData=ROLE_SKILLS[role]||buildGenericRole(role);
  const foundSkills=extractSkillsFromText(text);
  const req=roleData.req;
  const matched=req.filter(s=>foundSkills.has(s));
  const missing=req.filter(s=>!foundSkills.has(s));
  // Partial: missing but text contains part of skill name
  const textLower=text.toLowerCase();
  const partial=missing.filter(s=>{
    const words=s.toLowerCase().split(/[\s\/]/);
    return words.length>1&&words.some(w=>w.length>3&&textLower.includes(w));
  });
  const finalMissing=missing.filter(s=>!partial.includes(s));
  const score=Math.round(matched.length/req.length*100);
  // Category scores
  const cats=roleData.cats||{};
  const catScores={};
  Object.entries(cats).forEach(([cat,skills])=>{
    const m=skills.filter(s=>foundSkills.has(s)).length;
    catScores[cat]=Math.round(m/skills.length*100);
  });
  // If no cats, make default
  if(Object.keys(catScores).length===0){catScores['Skills']=score;}
  // Top skills (matched with simulated proficiency levels)
  const topSkills=matched.slice(0,5).map((s,i)=>({
    name:s,
    level:Math.min(95,75+Math.floor(Math.random()*20)),
    color:['#00e5ff','#7c3aed','#10b981','#f59e0b','#f472b6'][i%5]
  }));
  // Level
  let candidateLevel='Fresher';
  if(score>=80)candidateLevel='Senior';
  else if(score>=65)candidateLevel='Mid-Level';
  else if(score>=45)candidateLevel='Junior';
  const weeksToReady=Math.max(4,Math.round(finalMissing.length*1.5));
  // Recommendations based on top missing
  const recTemplates=[
    {ico:'🎓',platform:'Coursera',tag:'Cert',price:'₹999/mo'},
    {ico:'📚',platform:'Udemy',tag:'Paid',price:'₹499'},
    {ico:'🆓',platform:'FreeCodeCamp',tag:'Free',price:'Free'},
    {ico:'☁️',platform:'AWS / Official',tag:'Cert',price:'₹3,200'},
    {ico:'🔥',platform:'Educative.io',tag:'Paid',price:'₹1,200'},
  ];
  const recs=finalMissing.slice(0,5).map((skill,i)=>{
    const t=recTemplates[i%recTemplates.length];
    return{ico:t.ico,title:skill+' — Complete Guide',platform:t.platform,duration:(6+i*2)+'h',tag:t.tag,price:t.price};
  });
  // Add a general course
  recs.push({ico:'🏆',title:'System Design & Architecture for '+role,platform:'Educative.io',duration:'15h',tag:'Paid',price:'₹1,200'});
  return{score,matched,missing:finalMissing,partial,categories:catScores,topSkills,recommendations:recs.slice(0,5),weeksToReady,candidateLevel,job:role,insights:genInsights(score,matched.length,finalMissing,role,candidateLevel)};
}

// Generic role builder for custom roles
function buildGenericRole(role){
  const generic=['Python','JavaScript','SQL','Git','REST API','Docker','Communication','Problem Solving','Agile','Linux','HTML','CSS','Data Analysis','System Design','Teamwork','Project Management','Testing','CI/CD','Cloud','Security'];
  return{req:generic,cats:{'Technical':generic.slice(0,8),'Process':generic.slice(8,14),'Soft Skills':generic.slice(14)}};
}

// Roadmap generator
function genRoadmap(missing,role){
  const phases=[
    {week:'Week 1–2',title:'Foundation & Quick Wins',icon:'🏗️',color:'#7c3aed'},
    {week:'Week 3–4',title:'Core Skill Acquisition',icon:'🎯',color:'#00e5ff'},
    {week:'Week 5–6',title:'Projects & Portfolio',icon:'💻',color:'#10b981'},
    {week:'Week 7–8',title:'Certification Sprint',icon:'🏆',color:'#f472b6'},
    {week:'Week 9–12',title:'Job Application Mode',icon:'🚀',color:'#f59e0b'},
  ];
  const chunks=[];
  const m=missing.slice(0,12);
  for(let i=0;i<phases.length;i++){const start=i*2;const end=start+2;chunks.push(m.slice(start,end));}
  return phases.map((p,i)=>({...p,tasks:[...(chunks[i].map(s=>`Learn ${s} — complete 1 hands-on project`)),(i===2?['Push 2 new projects to GitHub with strong README']:i===3?['Enroll in top certification for '+role,'Complete 3 practice exams (target 80%+)']:i===4?['Apply to 15+ companies/week','Network on LinkedIn with hiring managers']:['Set up dev environment','Join relevant online communities'])[0]?[]:[],...(i===2?['Push 2 new projects to GitHub with strong README']:i===3?['Enroll in top certification for '+role,'Complete 3 practice exams (target 80%+)']:i===4?['Apply to 15+ companies/week','Network on LinkedIn with hiring managers','Attend career fairs and tech meetups']:i===0?['Review fundamentals of '+role+' stack']:['Complete 1 mini-project combining new skills'])]}));
}

// ── RUN ANALYSIS ──
async function runAn(){
  if(!resumeText||resumeText.length<50){toast('Please upload your resume first!','err');return;}
  if(!sJob){toast('Please select or type a target role!','err');return;}
  const steps=[
    {ico:'📄',text:'Reading resume text...'},
    {ico:'🧠',text:'Extracting skills with NLP...'},
    {ico:'🔍',text:'Matching against '+sJob+' requirements...'},
    {ico:'📊',text:'Calculating match score & category breakdown...'},
    {ico:'🎯',text:'Identifying priority gaps...'},
    {ico:'📚',text:'Generating recommendations & roadmap...'},
  ];
  const ov=document.getElementById('ov');
  document.getElementById('ov-steps').innerHTML=steps.map((s,i)=>`<div class="ov-step" id="ovs${i}"><span>${s.ico}</span>${s.text}</div>`).join('');
  ov.classList.add('show');
  stepDone(3);
  // Animate steps with delays
  for(let i=0;i<steps.length;i++){
    await sleep(700);
    if(i>0)document.getElementById('ovs'+(i-1))?.classList.replace('cur','done');
    document.getElementById('ovs'+i)?.classList.add('cur');
    document.getElementById('ov-bar').style.width=((i+1)/steps.length*100)+'%';
  }
  await sleep(600);
  // Run sync analysis
  ar=analyzeResume(resumeText,sJob);
  ar.roadmap=genRoadmap(ar.missing,sJob);
  anCount++;
  ov.classList.remove('show');
  stepDone(4);lineDone(3);
  updateOv();updateProfile();sec('res',null);
  toast('🎉 Analysis complete! Report ready.','suc');
}

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

// ── DEMO ──
const DEMO_RESUME=`Arjun Reddy
Software Engineer | arjun@klh.ac.in

SKILLS
Programming: JavaScript, TypeScript, Python, HTML, CSS
Frontend: React.js, Redux, Next.js, HTML5/CSS3, Responsive Design
Backend: Node.js, Express.js, REST APIs
Databases: MongoDB, PostgreSQL, SQL, SQLite
Tools: Git, GitHub, Agile methodology, Linux, Postman, VS Code

EXPERIENCE
Software Engineer Intern — TCS, Hyderabad (2024)
• Built React components for internal dashboard reducing load time by 30%
• Wrote RESTful APIs with Node.js and Express serving 500+ daily users
• Integrated MongoDB for data persistence

Project — E-Commerce Platform (2023)
• Full-stack web app with React frontend and Node.js backend
• Implemented JWT authentication and PostgreSQL database
• Deployed on GitHub with documentation

EDUCATION
B.Tech Computer Science — KLH University, Hyderabad
CGPA: 8.4/10 | Expected Graduation: 2025

CERTIFICATIONS
• Python for Everybody — Coursera
• JavaScript Algorithms — FreeCodeCamp`;

async function runDemo(){
  resumeText=DEMO_RESUME;
  if(!sJob)sJob='Full Stack Developer';
  document.querySelectorAll('.jc').forEach(c=>{if(c.textContent.includes('Full Stack'))c.classList.add('pk');});
  showRoleBadge(sJob);
  document.getElementById('uico').textContent='✅';
  document.getElementById('utitle').textContent='📎 arjun_reddy_resume.txt';
  document.getElementById('udesc').textContent='✓ Demo resume loaded · '+DEMO_RESUME.length+' characters';
  document.getElementById('uz').classList.add('done');
  document.getElementById('resume-preview').style.display='block';
  document.getElementById('resume-chars').textContent=DEMO_RESUME.length.toLocaleString();
  await runAn();
}

// ── UPDATE OVERVIEW ──
function updateOv(){
  if(!ar)return;
  document.getElementById('ov-empty').style.display='none';
  document.getElementById('ov-data').style.display='block';
  document.getElementById('ov-s').textContent=ar.score+'%';
  document.getElementById('ov-m').textContent=ar.missing.length;
  document.getElementById('ov-k').textContent=ar.matched.length;
  document.getElementById('ov-wk').textContent=(ar.weeksToReady||8)+' wks';
  document.getElementById('ov-mt').textContent=ar.missing.length+' skills to acquire';
  document.getElementById('ov-bars').innerHTML=(ar.topSkills||[]).map(s=>`<div class="brow"><div class="bhead"><span>${s.name}</span><span class="pct">${s.level}%</span></div><div class="track"><div class="fill" style="width:${s.level}%;background:${s.color||'#00e5ff'}"></div></div></div>`).join('')||'<span style="color:var(--m2);font-size:.82rem;">Run analysis first</span>';
  const pri=['🔴','🔴','🟠','🟠','🟡','🟡','🟡','⚪'];
  document.getElementById('ov-miss').innerHTML=(ar.missing||[]).slice(0,5).map((s,i)=>`<div class="rrow" style="padding:10px 13px;margin-bottom:6px;"><span style="width:6px;height:6px;border-radius:50%;background:#f87171;flex-shrink:0;"></span><div style="flex:1;"><div style="font-size:.83rem;font-weight:600;">${s}</div><div style="font-size:.71rem;color:var(--m2);">${i<2?'🔴 Critical':i<4?'🟠 High':'🟡 Medium'} priority</div></div><button class="eb" onclick="sec('ac',null)">Learn</button></div>`).join('')||'<span style="color:var(--c4);font-size:.82rem;">🎉 No major gaps!</span>';
}

// ── SHOW RESULTS ──
function showRes(){
  if(!ar){document.getElementById('res-empty').style.display='block';document.getElementById('res-data').style.display='none';return;}
  document.getElementById('res-empty').style.display='none';document.getElementById('res-data').style.display='block';
  document.getElementById('rjob').textContent=ar.job;
  setTimeout(()=>document.getElementById('rprog').style.strokeDashoffset=439.8*(1-ar.score/100),200);
  document.getElementById('rpct').textContent=ar.score+'%';
  document.getElementById('rmn').textContent=ar.matched.length;
  document.getElementById('rmiss').textContent=ar.missing.length;
  document.getElementById('rpart').textContent=ar.partial.length;
  // Verdict
  const v=document.getElementById('score-verdict');
  if(ar.score>=80)v.innerHTML='<span style="padding:5px 15px;border-radius:50px;background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);color:var(--c4);font-size:.82rem;font-weight:700;">🟢 Strong Candidate</span>';
  else if(ar.score>=60)v.innerHTML='<span style="padding:5px 15px;border-radius:50px;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);color:var(--c5);font-size:.82rem;font-weight:700;">🟡 Developing Candidate</span>';
  else v.innerHTML='<span style="padding:5px 15px;border-radius:50px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#f87171;font-size:.82rem;font-weight:700;">🔴 Needs Development</span>';
  // Category bars
  const catColors={'Frontend':'#00e5ff','Backend':'#7c3aed','Languages':'#00e5ff','DevOps/Cloud':'#f472b6','CI/CD':'#f472b6','Databases':'#10b981','Architecture':'#f59e0b','Tools':'#64748b','Security':'#ef4444','Soft Skills':'#64748b','ML/AI':'#7c3aed','ML Frameworks':'#7c3aed','MLOps':'#f472b6','Infrastructure':'#f59e0b','Cloud':'#f59e0b','Monitoring':'#10b981','Automation':'#64748b','Networking':'#00e5ff','Security Ops':'#ef4444','Offensive':'#ef4444','Defensive':'#10b981','Cloud/Infra':'#f59e0b','Compliance':'#64748b','Methodology':'#00e5ff','Research':'#f472b6','Data':'#7c3aed','Strategy':'#f59e0b','Communication':'#10b981','Design Tools':'#00e5ff','Visual':'#f472b6','Development':'#7c3aed','Process':'#10b981','Data Tools':'#64748b','Data Engineering':'#f59e0b','Visualization':'#00e5ff','APIs':'#10b981','State':'#f472b6','Build Tools':'#f59e0b','Testing':'#ef4444','Containers':'#00e5ff','Frameworks':'#7c3aed','Programming':'#7c3aed','Smart Contracts':'#f59e0b','Web3':'#00e5ff','Platforms':'#10b981','Dev Tools':'#f472b6','Concepts':'#64748b','Skills':'#00e5ff','Operations':'#7c3aed'};
  document.getElementById('catbars').innerHTML=Object.entries(ar.categories).map(([n,p])=>`<div class="brow"><div class="bhead"><span>${n}</span><span class="pct">${p}%</span></div><div class="track"><div class="fill" style="width:0%;background:${catColors[n]||'#00e5ff'}" data-p="${p}"></div></div></div>`).join('');
  setTimeout(()=>document.querySelectorAll('.fill[data-p]').forEach(f=>{f.style.width=f.dataset.p+'%';}),300);
  // Chips
  const pri=['🔴','🔴','🟠','🟠','🟡','🟡','🟡','⚪','⚪','⚪'];
  document.getElementById('mchips').innerHTML=ar.missing.map((s,i)=>`<span class="chip cmiss">${pri[i]||'⚪'} ${s}</span>`).join('')||'<span style="color:var(--c4);">No missing skills! 🎉</span>';
  document.getElementById('okchips').innerHTML=ar.matched.map(s=>`<span class="chip cok">✓ ${s}</span>`).join('')||'<span style="color:var(--m2);">No matches found</span>';
  if(ar.partial&&ar.partial.length>0){document.getElementById('partial-row').style.display='block';document.getElementById('partchips').innerHTML=ar.partial.map(s=>`<span class="chip cpart">~ ${s}</span>`).join('');}
  // Recs
  const tagMap={Free:'tf',Paid:'tp',Cert:'tc'};
  document.getElementById('recs').innerHTML=ar.recommendations.map(r=>`<div class="rrow"><span class="rico">${r.ico||'📚'}</span><div style="flex:1"><div class="rt">${r.title}</div><div class="rm2">${r.platform} · ${r.duration}</div></div><div class="rr"><span class="tag ${tagMap[r.tag]||'tp'}">${r.tag}</span><span style="font-weight:800;font-size:.85rem;">${r.price}</span><button class="eb" onclick="toast('Enrolled!','suc')">Enroll →</button></div></div>`).join('');
  document.getElementById('ai-insights').innerHTML=(ar.insights||'').replace(/\n/g,'<br>');
}

// ── ROADMAP ──
function showRM(){
  if(!ar||!ar.roadmap||!ar.roadmap.length){document.getElementById('rm-empty').style.display='block';document.getElementById('rmbody').innerHTML='';return;}
  document.getElementById('rm-empty').style.display='none';
  document.getElementById('rmbody').innerHTML=ar.roadmap.map((r,i)=>`<div class="rmi"><div class="rmspine"><div class="rmdot" style="background:${r.color}1a;border:2px solid ${r.color};">${r.icon||'📌'}</div>${i<ar.roadmap.length-1?`<div class="rmline" style="background:linear-gradient(${r.color},${ar.roadmap[i+1]?.color||r.color});"></div>`:''}</div><div class="rmcard card" style="border-left:3px solid ${r.color};"><div class="rmw" style="color:${r.color};">${r.week}</div><div class="rmtitle">${r.title}</div><div class="rmtasks">${(r.tasks||[]).map(t=>`<div class="rmtask"><span style="width:5px;height:5px;border-radius:50%;background:${r.color};flex-shrink:0;"></span>${t}</div>`).join('')}</div></div></div>`).join('');
}

// ── PROFILE UPDATE ──
function updateProfile(){
  if(!ar)return;
  document.getElementById('ps-an').textContent=anCount;
  document.getElementById('ps-sc').textContent=ar.score+'%';
  document.getElementById('ps-km').textContent=ar.matched.length+' skills';
  document.getElementById('ps-miss').textContent=ar.missing.length+' skills';
  document.getElementById('ps-role').textContent=ar.job;
  const lvlMap={'Fresher':'🌱 Rising Talent','Junior':'⚡ Junior Pro','Mid-Level':'🚀 Mid-Level','Senior':'🏆 Senior'};
  document.getElementById('ps-lvl').textContent=lvlMap[ar.candidateLevel]||ar.candidateLevel||'—';
  document.getElementById('ps-wk').textContent=(ar.weeksToReady||8)+' weeks';
  document.getElementById('pr2').value=ar.job;
}

// ── ACADEMY ──
const COURSES=[
  {cat:'rec',bg:'linear-gradient(135deg,#0a1628,#1a2d50)',ico:'⚛️',platform:'Udemy',title:'React 18 + Next.js 14 Complete Bootcamp',dur:'28h',lvl:'Intermediate',tags:['React','Next.js','TypeScript'],price:'₹499',free:false},
  {cat:'free cert',bg:'linear-gradient(135deg,#0d1035,#1a1050)',ico:'☁️',platform:'Coursera',title:'Google Cloud Associate Engineer',dur:'40h',lvl:'Advanced',tags:['GCP','Cloud','DevOps'],price:'Audit Free',free:true},
  {cat:'rec free',bg:'linear-gradient(135deg,#061520,#0c2840)',ico:'🐳',platform:'FreeCodeCamp',title:'Docker & Kubernetes Zero to Hero',dur:'10h',lvl:'Beginner',tags:['Docker','K8s','DevOps'],price:'Free',free:true},
  {cat:'cert',bg:'linear-gradient(135deg,#100a1a,#201030)',ico:'🔐',platform:'AWS',title:'AWS Solutions Architect SAA-C03',dur:'50h',lvl:'Advanced',tags:['AWS','Cloud','Architecture'],price:'₹3,200',free:false},
  {cat:'rec free',bg:'linear-gradient(135deg,#0a1520,#102030)',ico:'🤖',platform:'fast.ai',title:'Practical Deep Learning for Coders',dur:'20h',lvl:'Intermediate',tags:['Deep Learning','PyTorch','NLP'],price:'Free',free:true},
  {cat:'cert',bg:'linear-gradient(135deg,#0e1205,#1c2410)',ico:'🏅',platform:'Meta / Coursera',title:'Meta Front-End Developer Certificate',dur:'7 months',lvl:'Beginner',tags:['React','CSS','HTML'],price:'₹999/mo',free:false},
  {cat:'rec',bg:'linear-gradient(135deg,#0a1820,#0a2030)',ico:'📐',platform:'Educative.io',title:'Grokking System Design Interview',dur:'15h',lvl:'Advanced',tags:['System Design','Architecture'],price:'₹1,200',free:false},
  {cat:'free',bg:'linear-gradient(135deg,#0f1a08,#182808)',ico:'🐍',platform:'Google',title:'Crash Course: Python Automation',dur:'6 wks',lvl:'Beginner',tags:['Python','Automation','Bash'],price:'Audit Free',free:true},
  {cat:'cert',bg:'linear-gradient(135deg,#100a28,#180a40)',ico:'⚙️',platform:'Linux Foundation',title:'Certified Kubernetes Administrator',dur:'35h',lvl:'Expert',tags:['Kubernetes','CKA','DevOps'],price:'₹8,000',free:false},
  {cat:'rec free',bg:'linear-gradient(135deg,#1a0a0a,#300a10)',ico:'🔒',platform:'CISCO',title:'Cybersecurity Essentials',dur:'30h',lvl:'Beginner',tags:['Security','Networking','SOC'],price:'Free',free:true},
  {cat:'cert',bg:'linear-gradient(135deg,#0a1510,#102520)',ico:'📊',platform:'Google',title:'Data Analytics Professional Certificate',dur:'6 months',lvl:'Beginner',tags:['SQL','Tableau','Analytics'],price:'₹999/mo',free:false},
  {cat:'rec',bg:'linear-gradient(135deg,#100818,#1c0a2c)',ico:'🎨',platform:'Figma Academy',title:'UI/UX Design Mastery: Figma Pro',dur:'22h',lvl:'Intermediate',tags:['Figma','UX','Prototyping'],price:'₹799',free:false},
];
function renderC(f='all'){const list=f==='all'?COURSES:f==='free'?COURSES.filter(c=>c.free):f==='cert'?COURSES.filter(c=>c.cat.includes('cert')):COURSES.filter(c=>c.cat.includes('rec'));document.getElementById('cgrid').innerHTML=list.map(c=>`<div class="ccard card"><div class="cthumb" style="background:${c.bg}">${c.ico}</div><div class="cbody"><div class="cplatform">${c.platform}</div><div class="ctitle">${c.title}</div><div class="cmeta"><span>⏱ ${c.dur}</span><span>📶 ${c.lvl}</span></div><div class="ctags">${c.tags.map(t=>`<span class="ctag">${t}</span>`).join('')}</div><div class="cfooter"><div class="cprice ${c.free?'free':''}">${c.price}</div><button class="eb" onclick="toast('Enrolled in: ${c.title.slice(0,20)}...','suc')">Enroll Now</button></div></div></div>`).join('');}
function fC(type,el){document.querySelectorAll('.ftab').forEach(t=>t.classList.remove('on'));el.classList.add('on');renderC(type);}

// ── AI COACH (smart response) ──
function sendAI(){
  const inp=document.getElementById('aiinp');const q=inp.value.trim();if(!q)return;inp.value='';
  const out=document.getElementById('aiout');
  const ctx=ar?{score:ar.score,role:ar.job,missing:ar.missing.slice(0,6),matched:ar.matched.slice(0,8),level:ar.candidateLevel,weeks:ar.weeksToReady}:null;
  // Generate smart local response
  const response=genAIResponse(q,ctx);
  out.innerHTML=`<div style="margin-bottom:14px;"><span style="color:var(--m2);">You:</span> <span>${q}</span></div><div><span style="color:var(--c1);font-weight:600;">SkillBridge AI:</span><br><span style="color:var(--m2);">${response}</span></div>`;
}

function genAIResponse(q,ctx){
  const lower=q.toLowerCase();
  if(!ctx){
    if(lower.includes('first')||lower.includes('start'))return'Upload your resume and select a target role first, then I can give you personalized advice based on your actual skill gaps! 🚀';
    return'Please run an analysis first by uploading your resume. Once done, I can give you personalized advice about your skill gaps, learning path, and career strategy! 🎯';
  }
  const{score,role,missing,matched,level,weeks}=ctx;
  const top3=missing.slice(0,3).join(', ');
  if(lower.includes('first')||lower.includes('priorit')||lower.includes('top gap')||lower.includes('what should')){
    return`Based on your ${score}% match for <strong>${role}</strong>, your top 3 priorities are: <strong>${top3}</strong>.<br><br>• Start with <strong>${missing[0]}</strong> — it appears in most ${role} job descriptions and will give you the highest hiring impact.<br>• Then tackle <strong>${missing[1]||'the next skill'}</strong> — often paired with ${missing[0]} in interviews.<br>• Build small projects combining these skills before moving on. Quality over quantity! ✅`;
  }
  if(lower.includes('how long')||lower.includes('weeks')||lower.includes('time')){
    return`At 10 hours/week, you can close your skill gap in approximately <strong>${weeks} weeks</strong>.<br><br>• Weeks 1–4: Focus on <strong>${missing.slice(0,2).join(' and ')}</strong><br>• Weeks 5–8: Build 2 projects combining new skills<br>• Weeks 9+: Job applications + interview prep<br><br>With 15+ hrs/week, you could reduce this to ~${Math.round(weeks*0.65)} weeks! ⚡`;
  }
  if(lower.includes('cert')||lower.includes('certificat')){
    if(role.includes('Cloud')||role.includes('AWS')||role.includes('DevOps'))return`For <strong>${role}</strong>, the top certification is the <strong>AWS Solutions Architect Associate (SAA-C03)</strong> — it's the most recognized cert in Indian IT hiring. Then consider <strong>CKA (Certified Kubernetes Administrator)</strong>.<br><br>Prep time: ~6–8 weeks at 2hrs/day. Cost: ₹3,200 for the exam. ROI is excellent — average 20–30% salary bump! 🏆`;
    if(role.includes('Data')||role.includes('ML'))return`For <strong>${role}</strong>, start with <strong>Google Data Analytics Certificate</strong> (Coursera, audit-free) or <strong>TensorFlow Developer Certificate</strong>. These are recognized widely in Indian tech companies.<br><br>Then consider <strong>AWS Machine Learning Specialty</strong> once you have 6+ months of ML experience. ✅`;
    if(role.includes('Security')||role.includes('Cyber'))return`For <strong>${role}</strong>, target:<br>• <strong>CEH (Certified Ethical Hacker)</strong> — most recognized in India<br>• <strong>CompTIA Security+</strong> — great for freshers<br>• <strong>CISSP</strong> — for senior roles after 5 years experience<br><br>Start with CEH — 45 hrs prep, ~₹15,000 exam fee. Most MNCs look for this. 🔒`;
    return`For <strong>${role}</strong>, I recommend:<br>1. <strong>Meta Front-End Certificate</strong> (Coursera) — industry recognized, ~7 months<br>2. <strong>AWS Cloud Practitioner</strong> — even if not cloud-focused, shows deployability<br>3. Any platform-specific cert relevant to <strong>${missing[0]}</strong><br><br>Certifications + projects = strong portfolio! 🎓`;
  }
  if(lower.includes('compet')||lower.includes('ready')||lower.includes('good enough')){
    if(score>=80)return`Yes! At <strong>${score}% match</strong> you are a <strong>strong candidate</strong> for ${role}. Your matched skills (${matched.slice(0,4).join(', ')}) are exactly what hiring managers want.<br><br>To go from good to standout: learn <strong>${missing[0]}</strong>, add 1–2 strong GitHub projects, and polish your LinkedIn. You should be actively applying! 🚀`;
    if(score>=60)return`At <strong>${score}% match</strong>, you are a <strong>developing candidate</strong> — competitive but not quite there yet. Close the gap by mastering <strong>${top3}</strong> first.<br><br>✅ Your strengths: ${matched.slice(0,4).join(', ')}<br>⚠️ Key gaps: ${top3}<br><br>In ~${Math.round(weeks/2)} weeks of focused learning, you can reach 80%+ match! 💪`;
    return`At <strong>${score}% match</strong>, you're <strong>building your foundation</strong>. Don't be discouraged — everyone starts here!<br><br>Your ${matched.length} matched skills show real potential. Focus intensively on <strong>${top3}</strong> and build 2 strong projects. In ~${weeks} weeks you can significantly boost your candidacy. 🌱`;
  }
  if(lower.includes('project')||lower.includes('portfolio')||lower.includes('build')){
    return`For <strong>${role}</strong>, build these projects:<br><br>1. <strong>${missing[0]} Project</strong> — build a real-world app specifically using ${missing[0]}<br>2. <strong>Full ${role} App</strong> — combines ${matched.slice(0,3).join(', ')} + ${missing[0]||'new skills'}<br>3. <strong>Open Source Contribution</strong> — even small PRs show collaboration skills<br><br>Push everything to GitHub with clear READMEs, live demos, and a portfolio page. Recruiters look at GitHub! 💻`;
  }
  // Default
  return`Based on your profile (<strong>${score}% match for ${role}</strong>, ${level} level):<br><br>• Your matched skills: ${matched.slice(0,5).join(', ')}<br>• Top gaps to close: <strong>${top3}</strong><br>• Estimated time: ~${weeks} weeks<br><br>Would you like specific advice on prioritization, certifications, projects, or interview prep? Ask me anything! 🤖`;
}
function pf(q){document.getElementById('aiinp').value=q;document.getElementById('aiinp').focus();}

// ── TOAST ──
function toast(msg,type='suc'){const t=document.getElementById('toast');t.className='';t.classList.add(type);t.innerHTML=(type==='suc'?'✅ ':type==='err'?'❌ ':'ℹ️ ')+msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),3200);}

// ── INIT ──
renderC();
