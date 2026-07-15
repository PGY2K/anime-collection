const ANIME_DETAILS_ENDPOINT = "https://graphql.anilist.co";

function detailsEscapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function detailsNormalize(value){ return String(value ?? "").trim().toLowerCase(); }
function detailsStatusClass(status){ const v=detailsNormalize(status); if(v==="completed")return"status-completed"; if(v==="in progress")return"status-progress"; if(v==="waiting")return"status-waiting"; if(v==="dropped")return"status-dropped"; return"status-queued"; }
function detailsAverage(story,animation,enjoyment){ const scores=[story,animation,enjoyment].map(Number).filter(Number.isFinite); return scores.length<3?null:scores.reduce((a,b)=>a+b,0)/scores.length; }
function stripHtml(html){ const el=document.createElement("div"); el.innerHTML=html||""; return el.textContent||el.innerText||""; }
function scoreOptions(selectedValue){ const selected=selectedValue==null?"":String(selectedValue); return ["","1","2","3","4","5"].map(v=>`<option value="${v}" ${v===selected?"selected":""}>${v||"Not rated"}</option>`).join(""); }
function statusOptions(selectedStatus){ return ["Queued","In Progress","Waiting","Completed","Dropped"].map(s=>`<option value="${s}" ${s===selectedStatus?"selected":""}>${s}</option>`).join(""); }

async function fetchOwnRecordById(id){ const {data,error}=await supabaseClient.from("anime").select("*").eq("id",id).maybeSingle(); if(error)throw error; return data; }
async function fetchOwnRecordByAnimeId(anilistId){ const {data,error}=await supabaseClient.from("anime").select("*").eq("anilist_id",Number(anilistId)).maybeSingle(); if(error)throw error; return data; }
async function updateRecord(id,changes){ const {data,error}=await supabaseClient.from("anime").update({...changes,updated_at:new Date().toISOString()}).eq("id",id).select("*").single(); if(error)throw error; return data; }
async function deleteRecord(id){ const {error}=await supabaseClient.from("anime").delete().eq("id",id); if(error)throw error; }
async function addToQueue(media){ const title=media?.title?.english||media?.title?.romaji||"Untitled"; const {data,error}=await supabaseClient.from("anime").insert({anilist_id:media.id,title,status:"Queued"}).select("*").single(); if(error){ if(error.code==="23505") throw new Error("This anime is already in your collection."); throw error;} return data; }

async function fetchAnimeDetails(anilistId){
  const query=`query($id:Int){Media(id:$id,type:ANIME){id title{romaji english native} description(asHtml:true) bannerImage coverImage{extraLarge large} episodes duration format season seasonYear status genres studios(isMain:true){nodes{name}} trailer{id site thumbnail}}}`;
  const response=await fetch(ANIME_DETAILS_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({query,variables:{id:Number(anilistId)}})});
  if(!response.ok)throw new Error("Could not load anime details.");
  const json=await response.json(); return json?.data?.Media??null;
}

function trailerMarkup(media){
  const trailer=media?.trailer;
  if(!trailer?.id) return `<div class="trailer-unavailable">No trailer is available for this anime.</div>`;
  const site=String(trailer.site||"").toLowerCase();
  if(site==="youtube") return `<div class="trailer-frame"><iframe src="https://www.youtube.com/embed/${encodeURIComponent(trailer.id)}" title="Trailer" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
  return `<a class="trailer-external-link" href="${detailsEscapeHtml(trailer.id)}" target="_blank" rel="noopener">Watch trailer</a>`;
}

function renderDetails(record,media){
  const root=document.getElementById("detailsRoot");
  const title=media?.title?.english||media?.title?.romaji||record?.title||"Anime";
  const poster=media?.coverImage?.extraLarge||media?.coverImage?.large||"";
  const banner=media?.bannerImage||"";
  const synopsis=stripHtml(media?.description)||"No description is available yet.";
  const genres=media?.genres||[];
  const studios=media?.studios?.nodes?.map(s=>s.name).join(", ")||"Unknown";
  const completed=owned&&detailsNormalize(record.status)==="completed";
  const rating=completed?detailsAverage(record.story,record.animation,record.enjoyment):null;
  const meta=[media?.format?.replaceAll("_"," "),media?.episodes?`${media.episodes} Episodes`:null,media?.seasonYear].filter(Boolean).join(" • ");
  const owned=Boolean(record);

  root.innerHTML=`
    <section class="details-hero">
      ${banner?`<img class="details-banner" src="${detailsEscapeHtml(banner)}" alt="${detailsEscapeHtml(title)} banner">`:'<div class="details-banner-fallback"></div>'}
      <div class="details-overlay"></div>
      <div class="details-hero-content">
        ${poster?`<img class="details-poster" src="${detailsEscapeHtml(poster)}" alt="${detailsEscapeHtml(title)} poster">`:'<div class="details-poster"></div>'}
        <div>
          <a class="back-link" href="javascript:history.back()">← Back</a>
          <h1 class="details-title">${detailsEscapeHtml(title)}</h1>
          <div class="details-meta">${detailsEscapeHtml(meta||"Anime")}</div>
          <div class="details-actions">
            ${owned?`<span class="details-status status ${detailsStatusClass(record.status)}">${detailsEscapeHtml(record.status||"Queued")}</span>`:""}
            ${rating!==null?`<span class="details-rating">⭐ ${rating.toFixed(1)}</span>`:""}
            ${owned&&record.favorite?'<span class="favorite-badge">♥ Favorite</span>':""}
            ${owned?'<button class="edit-anime-btn status-details-btn" id="editAnimeBtn" type="button">Status & Details</button><button class="remove-anime-btn" id="removeAnimeBtn" type="button">Remove from Collection</button>':'<button class="edit-anime-btn" id="addToQueueBtn" type="button">+ Add to Queue</button>'}
          </div>
        </div>
      </div>
    </section>

    <section class="details-trailer-section">
      <h2>Trailer</h2>
      ${trailerMarkup(media)}
    </section>

    <section class="details-grid">
      <article class="details-panel">
        <details class="description-disclosure">
          <summary>Description</summary>
          <p class="synopsis">${detailsEscapeHtml(synopsis)}</p>
        </details>
        <h2 class="section-spacing">Genres</h2>
        <div class="genre-list">${genres.length?genres.map(g=>`<span class="genre-chip">${detailsEscapeHtml(g)}</span>`).join(""):'<span class="genre-chip">Unknown</span>'}</div>
        ${owned?`<h2 class="section-spacing">Your Notes</h2><p class="notes-display">${record.notes?detailsEscapeHtml(record.notes):"No notes yet."}</p>`:""}
      </article>
      <aside class="details-panel">
        ${owned?`<h2>Your Tracking</h2><div class="info-list">${completed?`<div class="info-row"><span class="info-label">Story</span><span class="info-value">${record.story??"—"}</span></div><div class="info-row"><span class="info-label">Animation</span><span class="info-value">${record.animation??"—"}</span></div><div class="info-row"><span class="info-label">Enjoyment</span><span class="info-value">${record.enjoyment??"—"}</span></div>`:""}<div class="info-row"><span class="info-label">Last Season</span><span class="info-value">${detailsEscapeHtml(record.last_season||"—")}</span></div><div class="info-row"><span class="info-label">Started Watching</span><span class="info-value">${detailsEscapeHtml(record.started_watching||"—")}</span></div></div>`:""}
        <h2 class="section-spacing">Information</h2>
        <div class="info-list"><div class="info-row"><span class="info-label">Studio</span><span class="info-value">${detailsEscapeHtml(studios)}</span></div><div class="info-row"><span class="info-label">Episodes</span><span class="info-value">${detailsEscapeHtml(media?.episodes??"Unknown")}</span></div><div class="info-row"><span class="info-label">Format</span><span class="info-value">${detailsEscapeHtml(media?.format?.replaceAll("_"," ")||"Unknown")}</span></div><div class="info-row"><span class="info-label">Year</span><span class="info-value">${detailsEscapeHtml(media?.seasonYear??"Unknown")}</span></div></div>
      </aside>
    </section>
    ${owned?editorMarkup(record,title):""}
  `;

  if(owned) initializeEditor(record,media);
  else document.getElementById("addToQueueBtn")?.addEventListener("click",async(event)=>{ const btn=event.currentTarget; btn.disabled=true; btn.textContent="Adding..."; try{ const newRecord=await addToQueue(media); window.location.href=`anime.html?id=${encodeURIComponent(newRecord.id)}`; }catch(error){ alert(error.message||"Could not add anime."); btn.disabled=false; btn.textContent="+ Add to Queue"; }});
}

function editorMarkup(record,title){ return `
<div class="remove-modal-backdrop hidden" id="removeAnimeModal" aria-hidden="true"><section class="remove-modal-card" role="dialog" aria-modal="true"><h2>Remove from Collection?</h2><p>Remove <strong>${detailsEscapeHtml(title)}</strong> from your collection? This cannot be undone.</p><div class="remove-modal-actions"><button class="secondary-action-btn" id="cancelRemoveBtn" type="button">Cancel</button><button class="confirm-remove-btn" id="confirmRemoveBtn" type="button">Remove</button></div><div class="edit-message" id="removeMessage"></div></section></div>
<div class="edit-modal-backdrop hidden" id="editAnimeModal" aria-hidden="true"><section class="edit-modal-card" role="dialog" aria-modal="true"><div class="edit-modal-header"><div><h2>Status & Details</h2><p>Update ${detailsEscapeHtml(title)} status, progress, notes, and completed rating.</p></div><button class="edit-close-btn" id="closeEditBtn" type="button">×</button></div><form id="editAnimeForm" class="edit-form"><label>Status<select id="editStatus">${statusOptions(record.status||"Queued")}</select></label><details class="status-guide"><summary>ⓘ Status Guide</summary><div class="status-guide-list"><p><strong>Queued:</strong> You've added this anime to your collection but haven't started watching it yet.</p><p><strong>In Progress:</strong> You're currently watching these anime.</p><p><strong>Waiting:</strong> You're waiting for new episodes or the next season.</p><p><strong>Completed:</strong> You've finished watching these anime.</p><p><strong>Dropped:</strong> You've decided not to continue watching these anime.</p></div></details><div class="rating-completed-only ${detailsNormalize(record.status)==="completed"?"":"hidden"}" id="completedRatingFields"><p class="rating-availability-note">Ratings are available only for anime marked Completed.</p><div class="rating-fields"><label>Story<select id="editStory">${scoreOptions(record.story)}</select></label><label>Animation<select id="editAnimation">${scoreOptions(record.animation)}</select></label><label>Enjoyment<select id="editEnjoyment">${scoreOptions(record.enjoyment)}</select></label></div></div><label>Last Season Watched<input id="editLastSeason" type="text" value="${detailsEscapeHtml(record.last_season||"")}" placeholder="Example: Season 2"></label><label>Started Watching<input id="editStartedWatching" type="date" value="${detailsEscapeHtml(record.started_watching||"")}"></label><label>Notes<textarea id="editNotes" rows="5" placeholder="Add personal notes...">${detailsEscapeHtml(record.notes||"")}</textarea></label><label class="favorite-toggle"><input id="editFavorite" type="checkbox" ${record.favorite?"checked":""}><span>Mark as favorite</span></label><div class="edit-message" id="editMessage"></div><div class="edit-form-actions"><button class="secondary-action-btn" id="cancelEditBtn" type="button">Cancel</button><button class="save-anime-btn" id="saveEditBtn" type="submit">Save Changes</button></div></form></section></div>`; }

function initializeEditor(record,media){
  const modal=document.getElementById("editAnimeModal"),form=document.getElementById("editAnimeForm"),removeModal=document.getElementById("removeAnimeModal");
  const open=()=>{modal.classList.remove("hidden");document.body.classList.add("modal-open")}; const close=()=>{modal.classList.add("hidden");document.body.classList.remove("modal-open")};
  const openRemove=()=>{removeModal.classList.remove("hidden");document.body.classList.add("modal-open")}; const closeRemove=()=>{removeModal.classList.add("hidden");document.body.classList.remove("modal-open")};
  const statusSelect=document.getElementById("editStatus"),ratingFields=document.getElementById("completedRatingFields");
  const syncRatingVisibility=()=>{ratingFields.classList.toggle("hidden",detailsNormalize(statusSelect.value)!=="completed")};
  statusSelect.addEventListener("change",syncRatingVisibility);
  syncRatingVisibility();
  document.getElementById("editAnimeBtn").onclick=open; document.getElementById("removeAnimeBtn").onclick=openRemove; document.getElementById("closeEditBtn").onclick=close; document.getElementById("cancelEditBtn").onclick=close; document.getElementById("cancelRemoveBtn").onclick=closeRemove;
  document.getElementById("confirmRemoveBtn").onclick=async()=>{try{await deleteRecord(record.id);location.href="collection.html"}catch(e){document.getElementById("removeMessage").textContent=e.message||"Could not remove anime."}};
  if(new URLSearchParams(location.search).get("edit")==="1")open();
  form.onsubmit=async(e)=>{e.preventDefault(); const nullable=id=>{const v=document.getElementById(id).value;return v===""?null:Number(v)}; const status=document.getElementById("editStatus").value; const completed=detailsNormalize(status)==="completed"; const changes={status,story:completed?nullable("editStory"):null,animation:completed?nullable("editAnimation"):null,enjoyment:completed?nullable("editEnjoyment"):null,last_season:document.getElementById("editLastSeason").value.trim()||null,started_watching:document.getElementById("editStartedWatching").value||null,notes:document.getElementById("editNotes").value.trim()||null,favorite:document.getElementById("editFavorite").checked}; try{const updated=await updateRecord(record.id,changes);close();renderDetails(updated,media)}catch(err){document.getElementById("editMessage").textContent=err.message||"Could not save changes."}};
}

async function initAnimeDetails(){
  const root=document.getElementById("detailsRoot"); const params=new URLSearchParams(location.search); const recordId=params.get("id"); const anilistId=params.get("anilist_id");
  if(!recordId&&!anilistId){root.innerHTML='<div class="error">No anime was selected.</div>';return;}
  try{ let record=recordId?await fetchOwnRecordById(recordId):await fetchOwnRecordByAnimeId(anilistId); const mediaId=record?.anilist_id||anilistId; const media=await fetchAnimeDetails(mediaId); renderDetails(record,media); }
  catch(error){console.error(error);root.innerHTML=`<div class="error">${detailsEscapeHtml(error.message||"Could not load anime details.")}</div>`;}
}
