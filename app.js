const GENRES = { 28:"动作",12:"冒险",16:"动画",35:"喜剧",80:"犯罪",99:"纪录",18:"剧情",10751:"家庭",14:"奇幻",36:"历史",27:"恐怖",10402:"音乐",9648:"悬疑",10749:"爱情",878:"科幻",10770:"电视电影",53:"惊悚",10752:"战争",37:"西部" };
const GENRE_IDS = Object.fromEntries(Object.entries(GENRES).map(([id, name]) => [name, id]));
const COUNTRY_WORDS = { 中国:"CN",大陆:"CN",香港:"HK",台湾:"TW",美国:"US",日本:"JP",韩国:"KR",法国:"FR",英国:"GB",德国:"DE",印度:"IN",意大利:"IT",西班牙:"ES",北欧:"SE" };
const STYLE_RULES = {
  slow:{ label:"缓慢克制", genres:[18], keywords:"克制、留白与人物关系" },
  dark:{ label:"暗黑压抑", genres:[53,80,27], keywords:"阴郁氛围与道德困境" },
  warm:{ label:"温暖治愈", genres:[35,10751,10749], keywords:"温暖关系与轻盈表达" },
  mind:{ label:"烧脑高概念", genres:[878,9648,53], keywords:"复杂设定与非线性叙事" },
  visual:{ label:"视觉风格", genres:[878,14,16], keywords:"强烈影像与美术风格" }
};

const DEMO = [
  [1,"燃烧","Burning",2018,148,7.8,"KR",[18,9648],"阶层隐喻与开放结局"],
  [2,"驾驶我的车","Drive My Car",2021,179,7.9,"JP",[18],"缓慢、克制而细腻"],
  [3,"彗星来的那一夜","Coherence",2013,89,7.7,"US",[878,9648,53],"小成本高概念科幻"],
  [4,"花样年华","In the Mood for Love",2000,98,8.1,"HK",[18,10749],"情感留白与精致影像"],
  [5,"寄生虫","Parasite",2019,133,8.5,"KR",[18,53,35],"锋利的阶层寓言"],
  [6,"银翼杀手 2049","Blade Runner 2049",2017,164,8.0,"US",[878,18],"宏大视觉与存在主义"],
  [7,"晒后假日","Aftersun",2022,102,7.7,"GB",[18],"记忆碎片与情绪留白"],
  [8,"狩猎","The Hunt",2012,116,8.3,"DK",[18],"群体心理与人性困境"],
  [9,"穆赫兰道","Mulholland Drive",2001,147,7.9,"US",[9648,18,53],"梦境结构与身份迷宫"],
  [10,"一一","Yi Yi",2000,174,8.3,"TW",[18],"生活细节与家庭群像"],
  [11,"海边的曼彻斯特","Manchester by the Sea",2016,138,8.0,"US",[18],"克制而沉重的创伤"],
  [12,"她","Her",2013,126,8.0,"US",[10749,878,18],"孤独、科技与亲密关系"],
  [13,"盗梦空间","Inception",2010,148,8.4,"US",[878,28,53],"多层梦境与精密结构"],
  [14,"小偷家族","Shoplifters",2018,121,7.9,"JP",[18],"非典型家庭与社会边缘"],
  [15,"完美陌生人","Perfect Strangers",2016,97,7.8,"IT",[35,18],"密闭空间与关系秘密"],
  [16,"机器人总动员","WALL·E",2008,98,8.4,"US",[16,10751,878],"浪漫、环保与无声叙事"],
  [17,"恐怖游轮","Triangle",2009,99,7.5,"GB",[9648,53,27],"时间循环与心理惊悚"],
  [18,"布达佩斯大饭店","The Grand Budapest Hotel",2014,100,8.1,"US",[35,18],"精确构图与冷调幽默"],
  [19,"熔炉","Silenced",2011,125,8.5,"KR",[18],"社会现实与制度批判"],
  [20,"情书","Love Letter",1995,117,8.2,"JP",[10749,18],"纯净记忆与含蓄情感"],
  [21,"这个杀手不太冷","Léon",1994,111,8.5,"FR",[80,18,28],"孤独人物与危险温情"],
  [22,"楚门的世界","The Truman Show",1998,103,8.2,"US",[35,18],"媒介寓言与自由意志"],
  [23,"东京物语","Tokyo Story",1953,137,8.2,"JP",[18],"家庭疏离与静观生活"],
  [24,"七宗罪","Se7en",1995,127,8.4,"US",[80,9648,53],"暗黑犯罪与道德命题"]
].map(([id,title,original,year,runtime,score,country,genre_ids,reason]) => ({id,title,original_title:original,year,runtime,score,country,genre_ids,reason,vote_count:8000-id*91}));

const state = {
  connected: false,
  ratings: JSON.parse(localStorage.getItem("pianai-ratings-v2") || "{}"),
  searches: JSON.parse(localStorage.getItem("pianai-searches") || "[]"),
  saved: JSON.parse(localStorage.getItem("pianai-saved-v2") || "[]"),
  pages:{ search:1, chart:1, recommend:1 }, searchMode:"", lastSearch:"", chartItems:[]
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const persist = () => {
  localStorage.setItem("pianai-ratings-v2", JSON.stringify(state.ratings));
  localStorage.setItem("pianai-searches", JSON.stringify(state.searches.slice(-30)));
  localStorage.setItem("pianai-saved-v2", JSON.stringify(state.saved));
};
const showToast = message => { $("#toast").textContent=message; $("#toast").classList.add("show"); clearTimeout(window.toastTimer); window.toastTimer=setTimeout(()=>$("#toast").classList.remove("show"),1800); };
const countryName = code => ({CN:"中国大陆",HK:"中国香港",TW:"中国台湾",US:"美国",JP:"日本",KR:"韩国",FR:"法国",GB:"英国",DE:"德国",IN:"印度",IT:"意大利",DK:"丹麦"}[code] || code || "未知");
const getYear = m => Number((m.release_date || m.first_air_date || m.year || "").toString().slice(0,4)) || 0;
const normalize = m => ({...m, year:getYear(m), score:Number(m.vote_average ?? m.score ?? 0), runtime:m.runtime || null, country:m.production_countries?.[0]?.iso_3166_1 || m.origin_country?.[0] || m.country, reason:m.reason || explain(m)});

async function api(path, params={}) {
  if (!state.connected) throw new Error("NO_SERVER");
  const url = new URL("/api/tmdb", window.location.origin);
  url.searchParams.set("path", path);
  Object.entries({language:"zh-CN",...params}).forEach(([k,v]) => v !== "" && v != null && url.searchParams.set(k,v));
  const response = await fetch(url);
  if (!response.ok) throw new Error(response.status === 503 ? "SERVER_NOT_CONFIGURED" : `API_${response.status}`);
  return response.json();
}

async function enrich(items) {
  if (!state.connected) return items;
  return Promise.all(items.map(async movie => {
    try { return {...movie, ...(await api(`/movie/${movie.id}`))}; }
    catch { return movie; }
  }));
}

function parseDescription(text) {
  const q=text.trim(), filters={genres:[],country:"",from:"",to:"",runtime:"",style:"",minScore:""};
  Object.entries(GENRE_IDS).forEach(([name,id]) => q.includes(name) && filters.genres.push(Number(id)));
  Object.entries(COUNTRY_WORDS).forEach(([word,code]) => q.includes(word) && (filters.country=code));
  if (/90年代|九十年代/.test(q)) [filters.from,filters.to]=[1990,1999];
  if (/80年代|八十年代/.test(q)) [filters.from,filters.to]=[1980,1989];
  if (/近十年/.test(q)) [filters.from,filters.to]=[new Date().getFullYear()-10,new Date().getFullYear()];
  const year=q.match(/(19|20)\d{2}/)?.[0]; if(year) [filters.from,filters.to]=[year,year];
  if (/两小时内|2小时内|短片|不太长/.test(q)) filters.runtime=120;
  if (/高分/.test(q)) filters.minScore=7.5;
  if (/压抑|暗黑|阴郁|沉重/.test(q)) filters.style="dark";
  if (/治愈|温暖|轻松/.test(q)) filters.style="warm";
  if (/烧脑|高概念|反转/.test(q)) filters.style="mind";
  if (/缓慢|克制|留白/.test(q)) filters.style="slow";
  if (/视觉|画面|美术/.test(q)) filters.style="visual";
  if (filters.style) filters.genres.push(...STYLE_RULES[filters.style].genres);
  filters.genres=[...new Set(filters.genres)];
  const hasFilters=filters.genres.length || filters.country || filters.from || filters.runtime || filters.style || filters.minScore;
  return {filters, isDescription:Boolean(hasFilters), query:q};
}

function explain(m) {
  const names=(m.genre_ids||[]).map(id=>GENRES[id]).filter(Boolean);
  const topTaste=getTasteProfile().slice(0,2).map(x=>x.id);
  const overlap=(m.genre_ids||[]).filter(id=>topTaste.includes(id)).map(id=>GENRES[id]);
  return overlap.length ? `符合你偏爱的${overlap.join("、")}；${names.slice(0,2).join(" × ")}组合` : `${names.slice(0,2).join(" × ") || "独特类型"}，值得拓展口味边界`;
}

function getTasteProfile() {
  const weights={};
  Object.entries(state.ratings).forEach(([id,r]) => {
    const movie=DEMO.find(m=>String(m.id)===String(id)); if(!movie) return;
    movie.genre_ids.forEach(g => weights[g]=(weights[g]||0)+(r-2.5)*2);
  });
  state.searches.forEach(s => parseDescription(s).filters.genres.forEach(g=>weights[g]=(weights[g]||0)+1));
  if (!Object.keys(weights).length) { weights[18]=8; weights[9648]=6; weights[878]=5; weights[10749]=3; }
  return Object.entries(weights).map(([id,value])=>({id:Number(id),name:GENRES[id],value})).sort((a,b)=>b.value-a.value);
}

function posterStyle(m) {
  const hue=(Number(m.id)*47)%360, second=(hue+72)%360;
  return `--cover:linear-gradient(145deg,hsl(${hue} 38% 30%),hsl(${second} 32% 12%));`;
}

function stars(m, compact=false) {
  const rating=state.ratings[m.id]||0;
  return `<div class="stars ${compact?"compact":""}" data-id="${m.id}" title="给这部电影评分">${[1,2,3,4,5].map(n=>`<button data-rate="${n}" class="${n<=rating?"on":""}">★</button>`).join("")}</div>`;
}

function card(m) {
  m=normalize(m); const poster=m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "";
  return `<article class="movie-card" data-movie="${m.id}" style="${posterStyle(m)}">
    <div class="poster" ${poster?`style="background-image:url('${poster}')"`:""}><span>${m.title}</span></div>
    <button class="save ${state.saved.includes(m.id)?"saved":""}" data-save="${m.id}">${state.saved.includes(m.id)?"✓":"＋"}</button>
    <div class="card-body"><div class="card-top"><span>${m.year||"—"} · ${m.runtime||"—"} 分钟</span><b>★ ${m.score?m.score.toFixed(1):"—"}</b></div>
    <h3>${m.title}</h3><small>${m.original_title && m.original_title!==m.title?m.original_title:""}</small>
    <p>${m.reason}</p>${stars(m,true)}</div>
  </article>`;
}

function rankRow(m,index) {
  m=normalize(m); const poster=m.poster_path ? `https://image.tmdb.org/t/p/w185${m.poster_path}` : "";
  return `<article class="rank-row"><b class="rank">${String(index).padStart(3,"0")}</b><div class="rank-poster" style="${poster?`background-image:url('${poster}')`:posterStyle(m)}"></div><div class="rank-main"><h3>${m.title}</h3><p>${m.original_title||""}</p><span>${m.year||"—"} · ${countryName(m.country)} · ${(m.genre_ids||[]).map(id=>GENRES[id]).filter(Boolean).slice(0,3).join(" / ")}</span></div><div class="rank-runtime">${m.runtime||"—"}<small>分钟</small></div><div class="rank-score">${m.score?m.score.toFixed(1):"—"}<small>TMDB</small></div>${stars(m,true)}</article>`;
}

function bindMovieActions(root=document) {
  root.querySelectorAll("[data-rate]").forEach(btn=>btn.onclick=e=>{ e.stopPropagation(); const id=e.target.closest(".stars").dataset.id; state.ratings[id]=Number(btn.dataset.rate); persist(); renderProfile(); renderRecommendations(); showToast(`已记录 ${btn.dataset.rate} 星，推荐流已更新`); });
  root.querySelectorAll("[data-save]").forEach(btn=>btn.onclick=e=>{ e.stopPropagation(); const id=Number(btn.dataset.save); state.saved=state.saved.includes(id)?state.saved.filter(x=>x!==id):[...state.saved,id]; persist(); btn.classList.toggle("saved"); btn.textContent=state.saved.includes(id)?"✓":"＋"; });
}

async function runSearch(text, append=false) {
  if(!text.trim()) return; const parsed=parseDescription(text); state.lastSearch=text; state.searches.push(text); persist();
  if(!append) state.pages.search=1; $("#searchTitle").textContent=`“${text}”`; $("#searchMeta").textContent="正在理解你的描述…";
  let items=[];
  try {
    if (state.connected) {
      if(parsed.isDescription) {
        const f=parsed.filters, params={page:state.pages.search,sort_by:"vote_average.desc","vote_count.gte":80,with_genres:f.genres.join("|"),with_origin_country:f.country,"vote_average.gte":f.minScore,"with_runtime.lte":f.runtime};
        if(f.from) params["primary_release_date.gte"]=`${f.from}-01-01`; if(f.to) params["primary_release_date.lte"]=`${f.to}-12-31`;
        items=(await api("/discover/movie",params)).results;
      } else items=(await api("/search/movie",{query:text,page:state.pages.search})).results;
      items=await enrich(items);
    } else items=filterDemo(parsed);
  } catch(err) { handleApiError(err); items=filterDemo(parsed); }
  items=items.map(normalize); const html=items.map(card).join(""); $("#searchGrid").innerHTML=append?$("#searchGrid").innerHTML+html:html;
  $("#searchMeta").textContent=state.connected?`第 ${state.pages.search} 页 · 可继续加载完整结果`:`演示片库匹配 ${items.length} 部 · 启动本地服务并配置密钥可获得完整结果`;
  $("#searchMore").classList.toggle("hidden",!items.length); bindMovieActions($("#searchGrid"));
}

function filterDemo(parsed) {
  const f=parsed.filters, q=parsed.query.toLowerCase(); let list=DEMO.filter(m=>{
    if(!parsed.isDescription) return `${m.title}${m.original_title}`.toLowerCase().includes(q);
    return (!f.genres.length || f.genres.some(g=>m.genre_ids.includes(g))) && (!f.country||m.country===f.country) && (!f.from||m.year>=f.from) && (!f.to||m.year<=f.to) && (!f.runtime||m.runtime<=f.runtime) && (!f.minScore||m.score>=f.minScore);
  }); return list.sort((a,b)=>b.score-a.score);
}

async function renderRecommendations() {
  const taste=getTasteProfile(), ids=taste.slice(0,3).map(x=>x.id); let items=[];
  try { items=state.connected?await enrich((await api("/discover/movie",{page:state.pages.recommend,sort_by:"vote_average.desc","vote_count.gte":200,with_genres:ids.join("|")})).results.slice(0,12)):DEMO; }
  catch(err){ handleApiError(err); items=DEMO; }
  const rated=new Set(Object.keys(state.ratings)); items=items.map(normalize).filter(m=>!rated.has(String(m.id))).sort((a,b)=>personalScore(b,taste)-personalScore(a,taste));
  $("#recommendGrid").innerHTML=items.slice(0,12).map(m=>card({...m,reason:explain(m)})).join("");
  $("#recommendMeta").textContent=`综合 ${Object.keys(state.ratings).length} 次评分与 ${state.searches.length} 次搜索`;
  $("#tasteTags").innerHTML=taste.slice(0,5).map(t=>`<span>${t.name}<b>${Math.max(1,Math.round(t.value))}</b></span>`).join("");
  $("#profileSentence").textContent=`你目前最偏爱${taste.slice(0,3).map(t=>t.name).join("、")}，推荐会随每次搜索和评分变化。`;
  bindMovieActions($("#recommendGrid"));
}
const personalScore=(m,taste)=>m.score+(m.genre_ids||[]).reduce((sum,id)=>sum+(taste.find(t=>t.id===id)?.value||0)*.12,0);

async function renderCharts(append=false) {
  if(!append){state.pages.chart=1;state.chartItems=[];} const decade=$("#decadeFilter").value, params={page:state.pages.chart,sort_by:$("#sortFilter").value,"vote_average.gte":$("#scoreFilter").value,"vote_count.gte":100,with_origin_country:$("#countryFilter").value,with_genres:$("#genreFilter").value};
  if(decade){params["primary_release_date.gte"]=`${decade}-01-01`;params["primary_release_date.lte"]=`${Number(decade)+(decade==1970?9:9)}-12-31`; if(decade==1970)params["primary_release_date.gte"]="1900-01-01";}
  const style=$("#styleFilter").value;if(style)params.with_genres=STYLE_RULES[style].genres.join("|"); let items=[];
  try { items=state.connected?await enrich((await api("/discover/movie",params)).results):filterChartDemo(params,decade,style); } catch(err){handleApiError(err);items=filterChartDemo(params,decade,style);}
  state.chartItems.push(...items.map(normalize)); $("#chartGrid").innerHTML=state.chartItems.map((m,i)=>rankRow(m,i+1)).join("");
  $("#chartMeta").textContent=state.connected?`已加载 ${state.chartItems.length} 部 · 继续向下探索`:`演示片库共 ${state.chartItems.length} 部 · 服务端片库连接后可无限翻页`;
  bindMovieActions($("#chartGrid"));
}

function filterChartDemo(params,decade,style){ let list=[...DEMO]; if(params.with_origin_country)list=list.filter(m=>m.country===params.with_origin_country); if(params.with_genres){const ids=params.with_genres.split("|").map(Number);list=list.filter(m=>ids.some(id=>m.genre_ids.includes(id)));} if(decade)list=list.filter(m=>decade==1970?m.year<=1979:m.year>=decade&&m.year<=Number(decade)+9); list=list.filter(m=>m.score>=Number(params["vote_average.gte"])); return list.sort((a,b)=>params.sort_by.startsWith("primary")?b.year-a.year:b.score-a.score); }

function renderProfile(){ const taste=getTasteProfile(), max=Math.max(...taste.map(t=>t.value),1); $("#tasteBars").innerHTML=taste.slice(0,8).map(t=>`<div class="bar-row"><span>${t.name}</span><i><b style="width:${Math.max(8,t.value/max*100)}%"></b></i><strong>${Math.round(t.value)}</strong></div>`).join(""); $("#tasteManifesto").textContent=`“偏爱${taste.slice(0,3).map(t=>t.name).join("、")}，并持续探索${taste.slice(3,5).map(t=>t.name).join("与")}。”`; const rated=Object.entries(state.ratings).map(([id,rating])=>({...DEMO.find(m=>String(m.id)===id),id,rating})).filter(m=>m.title); $("#ratedList").innerHTML=rated.length?rated.map(m=>`<div class="rated-row"><div><b>${m.title}</b><span>${m.original_title} · ${m.year}</span></div>${stars(m)}<button class="text-button" data-remove="${m.id}">删除</button></div>`).join(""):`<div class="empty">还没有评分。给任意电影点星，推荐便会开始了解你。</div>`; bindMovieActions($("#ratedList")); $$("[data-remove]").forEach(b=>b.onclick=()=>{delete state.ratings[b.dataset.remove];persist();renderProfile();renderRecommendations();}); }

function handleApiError(err){ if(err.message==="SERVER_NOT_CONFIGURED"){state.connected=false;$("#libraryStatus").textContent="片库未配置";showToast("服务端尚未配置 TMDB Token");} }
function switchView(name){ $$(".view,nav button").forEach(x=>x.classList.remove("active")); $(`#${name}View`).classList.add("active"); $(`nav [data-view='${name}']`)?.classList.add("active"); window.scrollTo({top:0,behavior:"smooth"}); if(name==="profile")renderProfile(); }

$$('[data-view]').forEach(b=>b.onclick=()=>switchView(b.dataset.view));
$("#searchForm").onsubmit=e=>{e.preventDefault();runSearch($("#searchInput").value);};
$$('.search-examples button').forEach(b=>b.onclick=()=>{$("#searchInput").value=b.textContent;runSearch(b.textContent);});
$("#searchMore").onclick=()=>{state.pages.search++;runSearch(state.lastSearch,true);};
$("#recommendMore").onclick=()=>{state.pages.recommend++;renderRecommendations();};
$("#chartMore").onclick=()=>{state.pages.chart++;renderCharts(true);};
$$('.filter-panel select').forEach(x=>x.onchange=()=>renderCharts());
$("#scoreFilter").oninput=e=>{$("#scoreOutput").textContent=Number(e.target.value).toFixed(1);}; $("#scoreFilter").onchange=()=>renderCharts();
$("#libraryStatus").onclick=()=>showToast(state.connected?"TMDB 已由本地服务端安全连接":"请运行 start.ps1，并在 .env 中配置 TMDB_READ_TOKEN");
$("#clearData").onclick=()=>{state.ratings={};state.searches=[];state.saved=[];persist();renderProfile();renderRecommendations();showToast("行为数据已清除");};

Object.entries(GENRES).forEach(([id,name])=>$("#genreFilter").insertAdjacentHTML("beforeend",`<option value="${id}">${name}</option>`));
async function initialize(){
  localStorage.removeItem("pianai-tmdb-token");
  try { const status=await fetch("/api/status").then(r=>r.json()); state.connected=Boolean(status.tmdbConfigured); }
  catch { state.connected=false; }
  $("#libraryStatus").textContent=state.connected?"片库已连接":"演示片库";
  renderRecommendations(); renderCharts(); renderProfile();
}
initialize();
