const topics=["Nomen","Die vier Fälle","Artikel & Pronomen","Adjektive","Gemischte Aufgaben"];
const questions=[
["Welches Wort ist ein Nomen?","Schatz","mutig|segeln|Schatz|schnell","Der Schatz bezeichnet eine Sache.",0],
["Welcher Artikel gehört zu Muschel?","die","der|die|das|dem","Es heißt die Muschel.",0],
["Wie lautet der Plural von Schiff?","Schiffe",null,"Ein Schiff, mehrere Schiffe.",0],
["Welches Wort kommt normalerweise nur im Plural vor?","Ferien","Getreide|Musik|Ferien|Wasser","Ferien ist ein Pluralwort.",0],
["In welchem Fall steht dem Seemann: Der Pirat hilft dem Seemann?","Dativ","Nominativ|Genitiv|Dativ|Akkusativ","Wem hilft er? Dem Seemann.",1],
["Ergänze: Der Wert ___ Schatzes ist hoch.","des",null,"Wessen Wert? Des Schatzes.",1],
["Welchen Fall hat den Schatz: Die Piraten entdecken den Schatz?","Akkusativ","Nominativ|Genitiv|Dativ|Akkusativ","Wen oder was entdecken sie?",1],
["Ergänze: Die Karte gehört ___ Kapitän.","dem",null,"Wem gehört die Karte?",1],
["Ersetze dem Piraten: Ich helfe dem Piraten. Ich helfe ___.","ihm",null,"Im Dativ heißt das Pronomen ihm.",2],
["Ergänze: Das ist das Boot ___ Vaters.","meines",null,"Genitiv: meines Vaters.",2],
["Ergänze: Er sieht die Piraten. Er sieht ___.","sie",null,"Akkusativ Plural: sie.",2],
["Ergänze: Wir fahren mit ___ Schiff. (unbestimmter Artikel)","einem",null,"Mit einem Schiff steht im Dativ.",2],
["Komparativ von hoch?","höher",null,"hoch, höher, am höchsten.",3],
["Superlativ von gut mit am?","am besten",null,"gut, besser, am besten.",3],
["Ergänze: mit einem ___ Schiff (groß)","großen",null,"Dativ Neutrum: einem großen Schiff.",3],
["Ergänze: Der ___ Seemann winkt. (klein)","kleine",null,"Nominativ Maskulinum: der kleine Seemann.",3],
["Welcher Satz ist richtig?","Der Pirat hilft dem Kapitän.","Der Pirat hilft den Kapitän.|Der Pirat hilft dem Kapitän.|Der Pirat hilft des Kapitäns.|Der Pirat hilft der Kapitän.","Helfen verlangt den Dativ.",4],
["Ergänze: Die Piraten sehen ___ gefährlichen Hai.","den",null,"Akkusativ Maskulinum: den Hai.",4],
["Welchen Fall hat dem Meer: Die Mannschaft segelt auf dem Meer?","Dativ","Nominativ|Genitiv|Dativ|Akkusativ","Ortsangabe mit auf: Dativ.",4],
["Ergänze: Das Segel ___ kleinen Bootes ist weiß.","des",null,"Wessen Segel? Des kleinen Bootes.",4]
];
const $=id=>document.getElementById(id);
let data;try{data=JSON.parse(localStorage.getItem("deutsch-mission-v1"))}catch{}data=data||{profile:"",stats:{},log:[]};
let phase="home",queue=[],index=0,answer="",checked=false,correct=false,score=0,sessionMistakes={},sessionSeen={};
const DAY=86400000;const intervals=[1,3,7,14,30];
function dueIds(){return questions.map((q,i)=>i).filter(i=>data.stats[i]&&data.stats[i].next<=Date.now())}
function status(){const due=dueIds().length,learned=Object.values(data.stats).filter(s=>s.streak>=2).length;return {due,learned}}
function stagger(ids){const buckets=[[],[],[],[],[]];ids.forEach(i=>buckets[questions[i][4]].push(i));let result=[];while(buckets.some(b=>b.length)){for(const b of buckets)if(b.length)result.push(b.shift())}return result}

function save(){localStorage.setItem("deutsch-mission-v1",JSON.stringify(data))}
function esc(s){return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll('"',"&quot;")}
function norm(s){return String(s).trim().toLocaleLowerCase("de").replace(/[.!?]+$/,"").replace(/\s+/g," ")}
function start(type){phase=type;index=0;score=0;answer="";checked=false;sessionMistakes={};sessionSeen={};
if(type==="diagnose")queue=[0,4,8,12,16,1,6,10,14,18];
if(type==="training"){const due=dueIds();const fresh=questions.map((q,i)=>i).filter(i=>!data.stats[i]);queue=stagger([...due,...fresh]).slice(0,12);if(!queue.length){queue=stagger(questions.map((q,i)=>i).filter(i=>data.stats[i].streak<2)).slice(0,10)}}
if(type==="extra"){
const today=new Date().toDateString();
const todayWrong={};for(const item of data.log||[]){if(new Date(item.date).toDateString()===today&&!item.correct)todayWrong[item.id]=(todayWrong[item.id]||0)+1}
const ranked=questions.map((q,i)=>({i,priority:(todayWrong[i]||0)*100+(data.stats[i]?.wrong||0)*10-Math.min(data.stats[i]?.streak||0,5)*3+(data.stats[i]?.next<=Date.now()?30:0)})).sort((a,b)=>b.priority-a.priority||a.i-b.i);
queue=stagger(ranked.slice(0,12).map(x=>x.i));
}
if(type==="boss")queue=[19,15,7,10,17,3,13,5,9,18];
if(!queue.length){phase="caughtup"}render()}
function check(){const q=questions[queue[index]];correct=norm(answer)===norm(q[1]);checked=true;if(correct)score++;
const id=queue[index],s=data.stats[id]||{right:0,wrong:0,streak:0};s.right+=Number(correct);s.wrong+=Number(!correct);s.streak=correct?s.streak+1:0;
const early=phase==="extra"&&s.next>Date.now();
if(!early||!correct){
s.level=correct?Math.min((s.level||0)+1,intervals.length):0;
s.next=Date.now()+(correct?intervals[s.level-1]*DAY:0);
}
// An early voluntary success must not move the next scheduled review forward.
if(!correct){sessionMistakes[id]=(sessionMistakes[id]||0)+1;if(sessionMistakes[id]<=2){const at=Math.min(index+3,queue.length);queue.splice(at,0,id)}}
sessionSeen[id]=(sessionSeen[id]||0)+1;data.stats[id]=s;data.log.push({id,correct,date:new Date().toISOString(),profile:data.profile});save();render()}
function next(){if(++index>=queue.length)phase="results";answer="";checked=false;render()}
function exportData(){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="deutsch-mission-backup.json";a.click();URL.revokeObjectURL(a.href)}
function render(){const mode=$("mode");mode.textContent={home:"Start",diagnose:"Diagnose",training:"Training",boss:"Bosskampf",results:"Ergebnis",caughtup:"Erledigt",extra:"Extra-Training"}[phase];const root=$("app");
if(phase==="home"){const st=status();root.innerHTML='<section class="card"><h2>🏴‍☠️ Die Piraten-Akademie</h2><p>Trainiere die Grammatik für deinen Deutschtest.</p><p><strong>'+st.due+' Wiederholungen fällig</strong> · '+st.learned+' Aufgaben mindestens zweimal hintereinander richtig</p><label>Dein Lernprofil</label><input id="profile" placeholder="Vorname oder Spitzname" value="'+esc(data.profile)+'"><p class="muted small">Der Lernstand wird auf diesem Gerät gespeichert.</p><button class="btn primary" id="start">Diagnose starten</button><button class="btn" id="train">Adaptives Training</button><button class="btn" id="extra">Noch eine Runde üben</button><button class="btn" id="boss">Bosskampf</button><button class="btn" id="backup">Lernstand exportieren</button></section>';const store=()=>{data.profile=$("profile").value.trim();save()};$("profile").onchange=store;$("start").onclick=()=>{store();start("diagnose")};$("train").onclick=()=>{store();start("training")};$("extra").onclick=()=>{store();start("extra")};$("boss").onclick=()=>{store();start("boss")};$("backup").onclick=exportData;return}
if(phase==="caughtup"){root.innerHTML='<section class="card"><h2>Alles für heute erledigt!</h2><p>Die nächsten Wiederholungen erscheinen automatisch an ihrem Fälligkeitstag.</p><button class="btn primary" id="home">Zur Startseite</button></section>';$("home").onclick=()=>{phase="home";render()};return}
if(phase==="results"){root.innerHTML='<section class="card"><h2>🏆 '+score+' / '+queue.length+' Punkte</h2><p>Runde abgeschlossen.</p><h3>Lernstand nach Themen</h3>'+topics.map((t,i)=>{let ids=questions.map((q,j)=>q[4]===i?j:-1).filter(j=>j>=0),n=ids.filter(j=>data.stats[j]?.right).length;return '<p>'+t+': '+n+' / '+ids.length+' Aufgaben schon einmal richtig</p><div class="progress"><div style="width:'+100*n/ids.length+'%"></div></div>'}).join('')+'<button class="btn primary" id="train">Adaptives Training</button><button class="btn" id="extra">Noch eine Runde üben</button><button class="btn" id="boss">Bosskampf</button><button class="btn" id="home">Zur Startseite</button></section>';$("train").onclick=()=>start("training");$("extra").onclick=()=>start("extra");$("boss").onclick=()=>start("boss");$("home").onclick=()=>{phase="home";render()};return}
const q=questions[queue[index]],opts=q[2]?.split("|");
root.innerHTML='<section class="card"><div class="row"><span>Aufgabe '+(index+1)+' / '+queue.length+'</span><span>☆ '+score+' Punkte</span></div><div class="progress"><div style="width:'+100*index/queue.length+'%"></div></div><p class="muted">'+topics[q[4]]+'</p><h2>'+esc(q[0])+'</h2><div id="answers">'+(opts?opts.map(o=>'<button class="btn option" data-value="'+esc(o)+'">'+esc(o)+'</button>').join(""):'<input id="typed" placeholder="Deine Antwort" autocomplete="off">')+'</div><div id="feedback"></div><button class="btn primary" id="action">'+(checked?"Weiter":"Prüfen")+'</button></section>';
if(opts){document.querySelectorAll(".option").forEach(b=>{b.onclick=()=>{if(checked)return;answer=b.dataset.value;document.querySelectorAll(".option").forEach(x=>x.classList.toggle("chosen",x===b))}})}else{$("typed").value=answer;$("typed").oninput=e=>answer=e.target.value}
if(checked){$("feedback").innerHTML='<p class="'+(correct?"good":"bad")+'">'+(correct?"✓ Richtig!":"✗ Richtige Antwort: "+esc(q[1]))+'</p><p>'+esc(q[3])+'</p>';document.querySelectorAll(".option").forEach(b=>{b.disabled=true;b.classList.toggle("good",b.dataset.value===q[1]);b.classList.toggle("bad",b.dataset.value===answer&&!correct)});if($("typed"))$("typed").disabled=true}
$("action").onclick=()=>{if(checked)next();else if(answer.trim())check()};}
render();