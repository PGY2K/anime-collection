const MAT_FRANCHISE_ENDPOINT = "https://graphql.anilist.co";
const MAT_FRANCHISE_CACHE_KEY = "matFranchiseCacheV2";
const MAT_RATING_FIELDS = ["story","characters","animation","sound","world","pacing","emotion","originality","rewatch_value","enjoyment"];
const MAT_MEDIA_MEMORY_CACHE = new Map();

function matText(value){ return String(value ?? "").trim(); }
function matLower(value){ return matText(value).toLowerCase(); }
function matFranchiseTitle(media){ return media?.title?.english || media?.title?.romaji || "Untitled"; }
function matEntryRating(item){
  const rawDirect = item?.overall_rating;
  const direct = rawDirect === null || rawDirect === undefined || rawDirect === "" ? null : Number(rawDirect);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const scores = MAT_RATING_FIELDS
    .map((field)=>item?.[field] === null || item?.[field] === undefined || item?.[field] === "" ? null : Number(item[field]))
    .filter(Number.isFinite);
  return scores.length === 10 ? scores.reduce((sum,n)=>sum+n,0)/10 : null;
}
function matFranchiseRating(item){
  const rawDirect = item?.overall_rating;
  const direct = rawDirect === null || rawDirect === undefined || rawDirect === "" ? null : Number(rawDirect);
  if(Number.isFinite(direct) && direct > 0) return direct;
  const scores=MAT_RATING_FIELDS
    .map((field)=>item?.[field] === null || item?.[field] === undefined || item?.[field] === "" ? null : Number(item[field]))
    .filter(Number.isFinite);
  return scores.length===10?scores.reduce((sum,n)=>sum+n,0)/10:null;
}
function matReadFranchiseCache(){ try{return JSON.parse(localStorage.getItem(MAT_FRANCHISE_CACHE_KEY)||"{}")}catch{return{}} }
function matWriteFranchiseCache(cache){ try{localStorage.setItem(MAT_FRANCHISE_CACHE_KEY,JSON.stringify(cache))}catch{} }

async function matFranchiseQuery(query, variables){
  try {
    const response=await fetch(MAT_FRANCHISE_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({query,variables})});
    if(!response.ok) throw new Error("Could not load franchise information.");
    const json=await response.json();
    if(json.errors?.length) throw new Error(json.errors[0].message||"Could not load franchise information.");
    return json.data;
  } catch (error) {
    if (window.matIsOffline?.()) {
      window.matShowOfflineDialog?.();
      throw new Error("No internet connection. MAT requires an internet connection. Check your connection and try again.");
    }
    if (/failed to fetch|networkerror|load failed/i.test(String(error?.message || ""))) {
      throw new Error("Unable to load anime information. The service may be temporarily unavailable. Please try again.");
    }
    throw error;
  }
}

async function matFetchRelationNode(id){
  const key=Number(id);
  if(MAT_MEDIA_MEMORY_CACHE.has(key)) return MAT_MEDIA_MEMORY_CACHE.get(key);
  const query=`query($id:Int){Media(id:$id,type:ANIME){id format episodes duration seasonYear status isAdult description(asHtml:true) bannerImage startDate{year month day} title{romaji english} coverImage{extraLarge large} trailer{id site thumbnail} relations{edges{relationType node{id type format episodes duration seasonYear status isAdult startDate{year month day} title{romaji english} coverImage{extraLarge large}}}}}}`;
  const media=(await matFranchiseQuery(query,{id:key}))?.Media||null;
  MAT_MEDIA_MEMORY_CACHE.set(key,media);
  return media;
}

async function matFetchMediaBatch(ids){
  const clean=[...new Set((ids||[]).map(Number).filter(Number.isFinite))];
  if(!clean.length) return [];
  const missing=clean.filter(id=>!MAT_MEDIA_MEMORY_CACHE.has(id));
  if(missing.length){
    const query=`query($ids:[Int]){Page(page:1,perPage:50){media(id_in:$ids,type:ANIME){id format episodes duration seasonYear status isAdult description(asHtml:true) bannerImage startDate{year month day} title{romaji english} coverImage{extraLarge large} trailer{id site thumbnail}}}}`;
    const rows=(await matFranchiseQuery(query,{ids:missing}))?.Page?.media||[];
    rows.forEach(row=>MAT_MEDIA_MEMORY_CACHE.set(Number(row.id),row));
  }
  return clean.map(id=>MAT_MEDIA_MEMORY_CACHE.get(id)).filter(Boolean);
}

function matFranchisePrefs(profile={}){
  return {
    tv: profile.franchise_group_tv !== false,
    movie: profile.franchise_group_movies !== false,
    ova: Boolean(profile.franchise_include_ova),
    special: Boolean(profile.franchise_include_specials),
    ona: Boolean(profile.franchise_include_ona),
    recaps: Boolean(profile.franchise_include_recaps)
  };
}
function matAllowedFormat(format,prefs){
  const f=String(format||"").toUpperCase();
  if(f==="TV"||f==="TV_SHORT") return prefs.tv;
  if(f==="MOVIE") return prefs.movie;
  if(f==="OVA") return prefs.ova;
  if(f==="SPECIAL") return prefs.special;
  if(f==="ONA") return prefs.ona;
  return false;
}
function matLooksLikeRecap(media, relationType){
  const title=matLower(matFranchiseTitle(media));
  return String(relationType||"").toUpperCase()==="SUMMARY" || /\b(recap|summary|compilation)\b/.test(title);
}
function matSortDate(media){
  const d=media?.startDate||{};
  return Number(d.year||9999)*10000+Number(d.month||1)*100+Number(d.day||1);
}

async function matResolveFranchise(anilistId,prefs){
  const cache=matReadFranchiseCache();
  const cacheKey=`${anilistId}:all`;
  if(Object.prototype.hasOwnProperty.call(cache,cacheKey)) return cache[cacheKey];

  const queue=[Number(anilistId)], seen=new Set(), entries=new Map();
  while(queue.length && seen.size<40){
    const id=queue.shift();
    if(seen.has(id)) continue;
    seen.add(id);
    const media=await matFetchRelationNode(id);
    if(!media) continue;
    if(["TV","TV_SHORT","MOVIE","OVA","SPECIAL","ONA"].includes(String(media.format||"").toUpperCase())) entries.set(media.id,{...media,relationType:entries.get(media.id)?.relationType||"ROOT"});
    for(const edge of media.relations?.edges||[]){
      const relation=String(edge.relationType||"").toUpperCase();
      const node=edge.node;
      if(node?.type!=="ANIME") continue;
      if(!["PREQUEL","SEQUEL"].includes(relation)) continue;
      if(!["TV","TV_SHORT","MOVIE","OVA","SPECIAL","ONA"].includes(String(node.format||"").toUpperCase())) continue;
      if(!entries.has(node.id)) entries.set(node.id,{...node,relationType:relation});
      if(!seen.has(node.id)) queue.push(node.id);
    }
  }
  const list=[...entries.values()].sort((a,b)=>matSortDate(a)-matSortDate(b)||a.id-b.id);
  if(list.length<2){ cache[cacheKey]=null; matWriteFranchiseCache(cache); return null; }
  const root=list[0];
  const result={
    franchiseKey:Number(root.id),
    title:matFranchiseTitle(root),
    coverAnilistId:Number(root.id),
    entries:list.map((item,index)=>({anilist_id:Number(item.id),title:matFranchiseTitle(item),media_format:item.format||null,relation_type:item.relationType||null,is_recap:matLooksLikeRecap(item,item.relationType),sort_order:index}))
  };
  cache[cacheKey]=result; matWriteFranchiseCache(cache); return result;
}

async function matStoreFranchise(franchise){
  if(!franchise) return;
  const {error:catalogError}=await supabaseClient.from("franchise_catalog").upsert({franchise_key:franchise.franchiseKey,title:franchise.title,cover_anilist_id:franchise.coverAnilistId,updated_at:new Date().toISOString()},{onConflict:"franchise_key"});
  if(catalogError) throw catalogError;
  const rows=franchise.entries.map((entry)=>({franchise_key:franchise.franchiseKey,...entry}));
  const {error:entryError}=await supabaseClient.from("franchise_entries").upsert(rows,{onConflict:"franchise_key,anilist_id"});
  if(entryError) throw entryError;
}

async function matAttachRecordToFranchise(record,profile){
  if(!record || record.franchise_key) return record;
  const franchise=await matResolveFranchise(record.anilist_id,matFranchisePrefs(profile));
  if(!franchise) return record;
  await matStoreFranchise(franchise);
  const matching=franchise.entries.find((entry)=>Number(entry.anilist_id)===Number(record.anilist_id));
  const {data,error}=await supabaseClient.from("anime").update({franchise_key:franchise.franchiseKey,franchise_title:franchise.title,media_format:matching?.media_format||null}).eq("id",record.id).select("*").single();
  if(error) throw error;
  await matEnsureUserFranchise(record.user_id,franchise,record.status||"Queued");
  return data;
}

async function matLoadOwnFranchises(){
  const {data,error}=await supabaseClient.from("user_franchises").select("*, franchise_catalog(title,cover_anilist_id)");
  if(error) throw error;
  return (data||[]).map((row)=>({...row,title:row.franchise_catalog?.title||"Franchise",cover_anilist_id:row.franchise_catalog?.cover_anilist_id}));
}
async function matLoadFranchiseEntries(franchiseKey){
  const {data,error}=await supabaseClient.from("franchise_entries").select("*").eq("franchise_key",Number(franchiseKey)).order("sort_order");
  if(error) throw error; return data||[];
}
async function matEnsureUserFranchise(userId,franchise,status="Queued"){
  if(!franchise) return;
  const {data:existing,error:lookupError}=await supabaseClient.from("user_franchises").select("franchise_key").eq("user_id",userId).eq("franchise_key",franchise.franchiseKey).maybeSingle();
  if(lookupError) throw lookupError;
  if(existing) throw new Error("That franchise is already in your collection.");
  const {error}=await supabaseClient.from("user_franchises").insert({user_id:userId,franchise_key:franchise.franchiseKey,status,updated_at:new Date().toISOString()});
  if(error) throw error;
}

function matEntryVisibleForPrefs(entry,prefs){ if(entry?.is_recap && !prefs.recaps)return false; return matAllowedFormat(entry?.media_format,prefs); }
