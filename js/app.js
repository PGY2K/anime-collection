const ANILIST_ENDPOINT = "https://graphql.anilist.co";
let collectionAnime=[]; let collectionFranchises=[]; let collectionFranchiseEntryRatings=[]; let currentFilter="all"; let currentUser=null; let currentProfile=null;
function normalize(v){return String(v??"").trim().toLowerCase()}
function escapeHtml(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function statusClass(status){const v=normalize(status);if(v==="completed")return"status-completed";if(v==="in progress")return"status-progress";if(v==="waiting")return"status-waiting";if(v==="dropped")return"status-dropped";return"status-queued"}
function itemRating(item){return matEntryRating(item)}
async function requestAniList(query,variables){const r=await fetch(ANILIST_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({query,variables})});if(!r.ok)throw new Error("Anime search failed.");return (await r.json())?.data}
async function searchAniListPage(search){const q=`query($search:String){Page(page:1,perPage:8){media(search:$search,type:ANIME,sort:SEARCH_MATCH){id title{romaji english} coverImage{large medium} isAdult episodes format seasonYear status}}}`;return (await requestAniList(q,{search}))?.Page?.media||[]}
async function fetchPoster(id){return (await matFetchMediaBatch([Number(id)]))[0]||null}
async function loadCollection(){const {data,error}=await supabaseClient.from("anime").select("*").order("created_at",{ascending:false});if(error)throw error;return data||[]}
async function loadProfile(){const {data,error}=await supabaseClient.from("profiles").select("*").eq("user_id",currentUser.id).single();if(error)throw error;return data}
async function loadFranchiseEntryRatings(){const {data,error}=await supabaseClient.from("user_franchise_entry_ratings").select("franchise_key,anilist_id,overall_rating,rating_mode,story,characters,animation,sound,world,pacing,emotion,originality,rewatch_value,enjoyment,updated_at");if(error){if(error.code==="42P01")return[];throw error}return data||[]}
async function organizeExisting(records){
  const unresolved=records.filter(r=>!r.franchise_key).slice(0,30);
  if(!unresolved.length)return records;
  const updated=new Map();
  for(const record of unresolved){try{const row=await matAttachRecordToFranchise(record,currentProfile);if(row?.franchise_key)updated.set(row.id,row)}catch(e){console.warn("Franchise grouping skipped",record.title,e)}}
  return records.map(r=>updated.get(r.id)||r);
}
async function addAnime(anime){
  const title=anime.title?.english||anime.title?.romaji||"Untitled";
  const franchise=await matResolveFranchise(anime.id,matFranchisePrefs(currentProfile));
  if(franchise){
    await matStoreFranchise(franchise);
    await matEnsureUserFranchise(currentUser.id,franchise,"Queued");
    await matClaimPioneerBadge({franchiseKey:franchise.franchiseKey,anilistId:anime.id});
    const entryIds=franchise.entries.map(entry=>Number(entry.anilist_id));
    if(entryIds.length){
      await supabaseClient.from("anime").update({franchise_key:franchise.franchiseKey,franchise_title:franchise.title}).in("anilist_id",entryIds);
    }
    return {kind:"franchise",franchise_key:franchise.franchiseKey};
  }
  const {data,error}=await supabaseClient.from("anime").insert({anilist_id:anime.id,title,status:"Queued",media_format:anime.format||null}).select("*").single();
  if(error){if(error.code==="23505")throw new Error("That anime is already in your collection.");throw error}
  await matClaimPioneerBadge({anilistId:anime.id});
  return data;
}
const copy={all:["Your <span>Collection</span>","Search, filter, and browse your anime and franchises."],queued:["Queued","You've added these anime but haven't started watching them yet."],"in progress":["In Progress","You're currently watching these anime."],waiting:["Waiting","You're waiting for new episodes or the next season."],completed:["Completed","You've finished watching these anime."],dropped:["Dropped","You've decided not to continue watching these anime."]};
function updateHeader(){const c=copy[currentFilter]||copy.all;document.getElementById("collectionPageTitle").innerHTML=c[0];document.getElementById("collectionPageSubtitle").textContent=c[1]}
function derivedFranchiseRating(franchise,entries){
  const dedicated=collectionFranchiseEntryRatings.filter(row=>Number(row.franchise_key)===Number(franchise.franchise_key));
  const dedicatedScores=dedicated.map(row=>{const direct=Number(row.overall_rating);if(Number.isFinite(direct)&&direct>0)return direct;const values=["story","characters","animation","sound","world","pacing","emotion","originality","rewatch_value","enjoyment"].map(key=>Number(row[key])).filter(value=>Number.isFinite(value)&&value>0);return values.length===10?values.reduce((sum,value)=>sum+value,0)/10:null}).filter(Number.isFinite);
  if(dedicatedScores.length)return dedicatedScores.reduce((sum,value)=>sum+value,0)/dedicatedScores.length;
  const scores=entries.map(item=>{const direct=Number(item?.overall_rating);if(Number.isFinite(direct)&&direct>0)return direct;return itemRating(item)}).filter(Number.isFinite);
  if(scores.length)return scores.reduce((sum,value)=>sum+value,0)/scores.length;
  return null;
}
function groupCollection(){
  const franchiseMap=new Map(collectionFranchises.map(f=>[Number(f.franchise_key),f]));
  const groupedKeys=new Set(franchiseMap.keys());
  const groups=[...franchiseMap.values()].map(franchise=>({kind:"franchise",key:Number(franchise.franchise_key),entries:collectionAnime.filter(item=>Number(item.franchise_key)===Number(franchise.franchise_key)),franchise}));
  const standalone=collectionAnime.filter(item=>!item.franchise_key || !groupedKeys.has(Number(item.franchise_key))).map(item=>({kind:"anime",item}));
  return {groups,standalone};
}
async function posterHtml(id,title,extraClass="") {try{const m=await fetchPoster(id);const url=m?.coverImage?.extraLarge||m?.coverImage?.large||"";return `<div class="poster ${extraClass}${matAdultPosterClass(m?.isAdult)}">${url?`<img src="${escapeHtml(url)}" alt="${escapeHtml(title)} poster" loading="lazy">`:'<div class="poster-placeholder">🎌</div>'}${matAdultPosterOverlay(m?.isAdult)}</div>`}catch{return '<div class="poster"><div class="poster-placeholder">🎌</div></div>'}}
async function renderCollection(){
  updateHeader(); const search=normalize(document.getElementById("searchInput").value);const sort=document.getElementById("sortSelect").value;
  const {groups,standalone}=groupCollection();
  let items=[...groups,...standalone].filter(x=>{const title=x.kind==="franchise"?x.franchise.title:x.item.title;const status=x.kind==="franchise"?x.franchise.status:x.item.status;return normalize(title).includes(search)&&(currentFilter==="all"||normalize(status)===currentFilter)});
  const ratingOf=x=>x.kind==="franchise"?derivedFranchiseRating(x.franchise,x.entries):itemRating(x.item); const titleOf=x=>x.kind==="franchise"?x.franchise.title:x.item.title;
  items.sort((a,b)=>sort==="title-desc"?titleOf(b).localeCompare(titleOf(a)):sort==="rating-desc"?(ratingOf(b)??-1)-(ratingOf(a)??-1):sort==="rating-asc"?(ratingOf(a)??999)-(ratingOf(b)??999):titleOf(a).localeCompare(titleOf(b)));
  document.getElementById("resultCount").textContent=`${items.length} ${items.length===1?"item":"items"} shown`;
  const posterIds=items.map(x=>x.kind==="franchise"?(x.franchise.cover_anilist_id||x.entries[0]?.anilist_id):x.item.anilist_id).map(Number).filter(Number.isFinite);
  try{await matFetchMediaBatch(posterIds)}catch(error){console.warn("Some collection posters could not be refreshed; cached artwork will be used when available.",error)}
  const cards=await Promise.all(items.map(async x=>{
    if(x.kind==="franchise"){
      const f=x.franchise;const rating=ratingOf(x);const poster=await posterHtml(f.cover_anilist_id||x.entries[0]?.anilist_id,f.title,"franchise-poster");
      return `<a class="anime-card anime-card-link franchise-card" href="franchise.html?key=${f.franchise_key}" aria-label="Open ${escapeHtml(f.title)} franchise">${poster}<div class="card-body"><h3 class="card-title">${escapeHtml(f.title)}</h3><span class="franchise-card-pill">Franchise</span><div class="card-details"><span class="status ${statusClass(f.status)}">${escapeHtml(f.status||"Queued")}</span>${Number.isFinite(rating)?`<span class="rating">⭐ ${rating.toFixed(1)}</span>`:""}</div></div></a>`;
    }
    const item=x.item;const rating=ratingOf(x);const poster=await posterHtml(item.anilist_id,item.title);
    return `<a class="anime-card anime-card-link" href="anime.html?id=${item.id}" aria-label="View ${escapeHtml(item.title)} details">${poster}<div class="card-body"><h3 class="card-title">${escapeHtml(item.title)}</h3><div class="card-details"><span class="status ${statusClass(item.status)}">${escapeHtml(item.status||"Queued")}</span>${Number.isFinite(rating)?`<span class="rating">⭐ ${rating.toFixed(1)}</span>`:""}</div></div></a>`;
  }));
  document.getElementById("animeGrid").innerHTML=cards.length?cards.join(""):'<div class="empty-state">Your collection is empty.</div>';
}
async function refreshCollection(){[collectionAnime,collectionFranchises,collectionFranchiseEntryRatings]=await Promise.all([loadCollection(),matLoadOwnFranchises(),loadFranchiseEntryRatings()]);await renderCollection()}
function openAddAnimeModal(){const m=document.getElementById("addAnimeModal");m.classList.remove("hidden");m.setAttribute("aria-hidden","false");document.getElementById("addAnimeSearchInput").focus()}
function closeAddAnimeModal(){const m=document.getElementById("addAnimeModal");m.classList.add("hidden");m.setAttribute("aria-hidden","true")}
async function runAddAnimeSearch(){const input=document.getElementById("addAnimeSearchInput"),root=document.getElementById("addAnimeResults"),search=input.value.trim();if(!search){root.innerHTML='<div class="empty-state">Type an anime name first.</div>';return}root.innerHTML='<div class="loading">Searching…</div>';try{const results=await searchAniListPage(search);root.innerHTML=results.length?results.map(a=>{const title=a.title?.english||a.title?.romaji||"Untitled",poster=a.coverImage?.large||a.coverImage?.medium||"";return `<article class="search-result-card${matAdultPosterClass(a.isAdult)}"><div class="search-result-poster"><img src="${escapeHtml(poster)}" alt="${escapeHtml(title)} poster">${matAdultPosterOverlay(a.isAdult)}</div><div><h3 class="search-result-title">${escapeHtml(title)}</h3><div class="search-result-meta">${escapeHtml(a.format||"Anime")} • ${a.episodes?`${a.episodes} episodes`:"Episode count unavailable"} • ${a.seasonYear||"Year unavailable"}</div><small class="franchise-search-note">Related TV seasons and movies will be grouped automatically.</small></div><button class="select-anime-btn" type="button" data-id="${a.id}">Add</button></article>`}).join(""):'<div class="empty-state">No matching anime found.</div>';
  root.querySelectorAll(".select-anime-btn").forEach(btn=>btn.addEventListener("click",async()=>{const anime=results.find(x=>String(x.id)===btn.dataset.id);btn.disabled=true;btn.textContent="Adding…";try{await addAnime(anime);await refreshCollection();closeAddAnimeModal();input.value="";root.innerHTML='<div class="empty-state">Search for an anime to begin.</div>'}catch(e){alert(e.message||"Could not add anime.");btn.disabled=false;btn.textContent="Add"}}));
}catch(e){root.innerHTML='<div class="error">Search failed. Please try again.</div>'}}
function initModal(){const modal=document.getElementById("addAnimeModal");document.getElementById("openAddAnimeBtn").onclick=openAddAnimeModal;document.getElementById("closeAddAnimeBtn").onclick=closeAddAnimeModal;document.getElementById("searchAniListBtn").onclick=runAddAnimeSearch;document.getElementById("addAnimeSearchInput").addEventListener("keydown",e=>{if(e.key==="Enter")runAddAnimeSearch()});modal.addEventListener("click",e=>{if(e.target===modal)closeAddAnimeModal()})}
function initFilter(){const requested=normalize(new URLSearchParams(location.search).get("status"));currentFilter=Object.hasOwn(copy,requested)?requested:"all";document.querySelectorAll(".filter-btn").forEach(b=>b.classList.toggle("active",b.dataset.filter===currentFilter))}
async function initCollection(user){currentUser=user;try{currentProfile=await loadProfile();initFilter();await refreshCollection();document.getElementById("searchInput").addEventListener("input",renderCollection);document.getElementById("sortSelect").addEventListener("change",renderCollection);document.querySelectorAll(".filter-btn").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".filter-btn").forEach(x=>x.classList.remove("active"));btn.classList.add("active");currentFilter=btn.dataset.filter;const u=new URL(location.href);currentFilter==="all"?u.searchParams.delete("status"):u.searchParams.set("status",currentFilter);history.replaceState({},"",u);renderCollection()}));initModal()}catch(e){console.error(e);document.getElementById("animeGrid").innerHTML=`<div class="error">${escapeHtml(e.message||"Could not load your collection.")}</div>`}}
