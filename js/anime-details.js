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
const DETAILS_RATING_FIELDS = [
  { key: "story", label: "Story", description: "How strong and well-written the plot is, including structure, conflict, and payoff." },
  { key: "characters", label: "Characters", description: "How well-developed, believable, and memorable the main and supporting characters are." },
  { key: "animation", label: "Visuals", description: "The quality of the animation, artwork, CGI, cinematography, and overall presentation." },
  { key: "sound", label: "Sound", description: "The quality of the music, sound design, voice acting, and audio atmosphere." },
  { key: "world", label: "World", description: "How interesting, detailed, and believable the setting and world-building are." },
  { key: "pacing", label: "Pacing", description: "How well the story moves without feeling rushed, slow, or repetitive." },
  { key: "emotion", label: "Emotion", description: "How strongly the anime makes you feel invested, excited, sad, tense, or connected." },
  { key: "originality", label: "Originality", description: "How fresh, creative, or distinctive the anime feels compared with similar shows." },
  { key: "rewatch_value", label: "Rewatch Value", description: "How likely you would be to watch the anime again." },
  { key: "enjoyment", label: "Enjoyment", description: "How much you personally enjoyed the overall experience." }
];
function detailsAverage(record){
  const scores=DETAILS_RATING_FIELDS
    .map(({key})=>record?.[key]===null||record?.[key]===undefined||record?.[key]===""?null:Number(record[key]))
    .filter(Number.isFinite);
  return scores.length<10?null:scores.reduce((a,b)=>a+b,0)/scores.length;
}
function stripHtml(html){ const el=document.createElement("div"); el.innerHTML=html||""; return el.textContent||el.innerText||""; }
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
  const owned=Boolean(record);
  const completed=owned&&detailsNormalize(record.status)==="completed";
  const rating=completed?detailsAverage(record):null;
  const meta=[media?.format?.replaceAll("_"," "),media?.episodes?`${media.episodes} Episodes`:null,media?.seasonYear].filter(Boolean).join(" • ");

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
            ${owned?'<button class="edit-anime-btn status-details-btn" id="editAnimeBtn" type="button">Change Status</button><button class="remove-anime-btn" id="removeAnimeBtn" type="button">Remove from Collection</button>':'<button class="edit-anime-btn" id="addToQueueBtn" type="button">+ Add to Queue</button>'}
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
        ${owned?`<h2>Your Tracking</h2><div class="info-list">${rating!==null?`<div class="info-row"><span class="info-label">Overall Rating</span><span class="info-value">⭐ ${rating.toFixed(1)}</span></div>`:""}<div class="info-row"><span class="info-label">Last Season</span><span class="info-value">${detailsEscapeHtml(record.last_season||"—")}</span></div><div class="info-row"><span class="info-label">Started Watching</span><span class="info-value">${detailsEscapeHtml(record.started_watching||"—")}</span></div></div>`:""}
        <h2 class="section-spacing">Information</h2>
        <div class="info-list"><div class="info-row"><span class="info-label">Studio</span><span class="info-value">${detailsEscapeHtml(studios)}</span></div><div class="info-row"><span class="info-label">Episodes</span><span class="info-value">${detailsEscapeHtml(media?.episodes??"Unknown")}</span></div><div class="info-row"><span class="info-label">Format</span><span class="info-value">${detailsEscapeHtml(media?.format?.replaceAll("_"," ")||"Unknown")}</span></div><div class="info-row"><span class="info-label">Year</span><span class="info-value">${detailsEscapeHtml(media?.seasonYear??"Unknown")}</span></div></div>
      </aside>
    </section>

    <section class="anime-comments-section" id="animeCommentsSection">
      <div class="comments-section-heading">
        <div>
          <h2>Public Comments</h2>
          <p>Share your thoughts and join the conversation.</p>
        </div>
        <label class="comments-sort-label">
          Sort
          <select id="commentsSort">
            <option value="relevant">Relevant</option>
            <option value="recent">Recent</option>
            <option value="oldest">Oldest</option>
          </select>
        </label>
      </div>

      <form class="comment-compose" id="commentForm">
        <textarea id="commentText" maxlength="2000" rows="3" placeholder="Write a public comment…" required></textarea>
        <div class="comment-compose-footer">
          <span id="commentMessage" class="comment-message"></span>
          <button class="comment-submit-btn" type="submit">Post Comment</button>
        </div>
      </form>

      <div class="comments-list" id="commentsList">
        <div class="loading">Loading comments…</div>
      </div>
    </section>

    <div class="comment-profile-backdrop" id="commentProfileModal" hidden>
      <section class="comment-profile-dialog" role="dialog" aria-modal="true" aria-labelledby="commentProfileName">
        <button class="comment-profile-close" id="closeCommentProfileBtn" type="button" aria-label="Close">×</button>
        <div id="commentProfileContent"></div>
      </section>
    </div>

    ${owned?editorMarkup(record,title):""}
  `;

  if(owned) initializeEditor(record,media);
  else document.getElementById("addToQueueBtn")?.addEventListener("click",async(event)=>{ const btn=event.currentTarget; btn.disabled=true; btn.textContent="Adding..."; try{ const newRecord=await addToQueue(media); window.location.href=`anime.html?id=${encodeURIComponent(newRecord.id)}`; }catch(error){ alert(error.message||"Could not add anime."); btn.disabled=false; btn.textContent="+ Add to Queue"; }});

  initAnimeComments(Number(media?.id));
}

function ratingSliderMarkup(record){
  return DETAILS_RATING_FIELDS.map(({key,label,description})=>{
    const value=Number(record?.[key]);
    const safeValue=Number.isFinite(value)&&value>=1&&value<=10?value:5;
    return `<div class="rating-slider-group">
      <div class="rating-slider-heading"><label for="rating-${key}">${label}</label><output id="rating-${key}-value" for="rating-${key}">${safeValue}</output></div>
      <p>${detailsEscapeHtml(description)}</p>
      <div class="rating-slider-control"><span>1</span><input id="rating-${key}" data-rating-field="${key}" type="range" min="1" max="10" step="1" value="${safeValue}"><span>10</span></div>
    </div>`;
  }).join("");
}

function editorMarkup(record,title){ return `
<div class="remove-modal-backdrop hidden" id="removeAnimeModal" aria-hidden="true"><section class="remove-modal-card" role="dialog" aria-modal="true"><h2>Remove from Collection?</h2><p>Remove <strong>${detailsEscapeHtml(title)}</strong> from your collection? This cannot be undone.</p><div class="remove-modal-actions"><button class="secondary-action-btn" id="cancelRemoveBtn" type="button">Cancel</button><button class="confirm-remove-btn" id="confirmRemoveBtn" type="button">Remove</button></div><div class="edit-message" id="removeMessage"></div></section></div>
<div class="edit-modal-backdrop hidden" id="editAnimeModal" aria-hidden="true"><section class="edit-modal-card" role="dialog" aria-modal="true"><div class="edit-modal-header"><div><h2>Change Status</h2><p>Update ${detailsEscapeHtml(title)} status, progress, notes, and completed rating.</p></div><button class="edit-close-btn" id="closeEditBtn" type="button">×</button></div><form id="editAnimeForm" class="edit-form"><label>Status<select id="editStatus">${statusOptions(record.status||"Queued")}</select></label><details class="status-guide"><summary>ⓘ Status Guide</summary><div class="status-guide-list"><p><strong>Queued:</strong> You've added this anime to your collection but haven't started watching it yet.</p><p><strong>In Progress:</strong> You're currently watching these anime.</p><p><strong>Waiting:</strong> You're waiting for new episodes or the next season.</p><p><strong>Completed:</strong> You've finished watching these anime.</p><p><strong>Dropped:</strong> You've decided not to continue watching these anime.</p></div></details><div class="rating-completed-only ${detailsNormalize(record.status)==="completed"?"":"hidden"}" id="completedRatingFields"><div class="live-overall-rating"><span>Overall Score</span><strong id="liveOverallRating">${detailsAverage(record)?.toFixed(1)||"5.0"}</strong><small>/ 10</small></div><p class="rating-availability-note">Move each slider from 1 to 10. Your overall score updates automatically.</p><div class="rating-slider-list">${ratingSliderMarkup(record)}</div></div><label>Last Season Watched<input id="editLastSeason" type="text" value="${detailsEscapeHtml(record.last_season||"")}" placeholder="Example: Season 2"></label><label>Started Watching<input id="editStartedWatching" type="date" value="${detailsEscapeHtml(record.started_watching||"")}"></label><label>Notes<textarea id="editNotes" rows="5" placeholder="Add personal notes...">${detailsEscapeHtml(record.notes||"")}</textarea></label><label class="favorite-toggle"><input id="editFavorite" type="checkbox" ${record.favorite?"checked":""}><span>Mark as favorite</span></label><div class="edit-message" id="editMessage"></div><div class="edit-form-actions"><button class="secondary-action-btn" id="cancelEditBtn" type="button">Cancel</button><button class="save-anime-btn" id="saveEditBtn" type="submit">Save Changes</button></div></form></section></div>`; }

function initializeEditor(record,media){
  const modal=document.getElementById("editAnimeModal"),form=document.getElementById("editAnimeForm"),removeModal=document.getElementById("removeAnimeModal");
  const open=()=>{modal.classList.remove("hidden");document.body.classList.add("modal-open")}; const close=()=>{modal.classList.add("hidden");document.body.classList.remove("modal-open")};
  const openRemove=()=>{removeModal.classList.remove("hidden");document.body.classList.add("modal-open")}; const closeRemove=()=>{removeModal.classList.add("hidden");document.body.classList.remove("modal-open")};
  const statusSelect=document.getElementById("editStatus"),ratingFields=document.getElementById("completedRatingFields");
  const syncRatingVisibility=()=>{ratingFields.classList.toggle("hidden",detailsNormalize(statusSelect.value)!=="completed")};
  statusSelect.addEventListener("change",syncRatingVisibility);
  syncRatingVisibility();
  const updateLiveOverall=()=>{
    const values=DETAILS_RATING_FIELDS.map(({key})=>Number(document.getElementById(`rating-${key}`)?.value));
    const average=values.reduce((sum,value)=>sum+value,0)/values.length;
    const output=document.getElementById("liveOverallRating");
    if(output)output.textContent=average.toFixed(1);
  };
  document.querySelectorAll("[data-rating-field]").forEach((slider)=>{
    slider.addEventListener("input",()=>{
      const output=document.getElementById(`${slider.id}-value`);
      if(output)output.textContent=slider.value;
      updateLiveOverall();
    });
  });
  updateLiveOverall();
  document.getElementById("editAnimeBtn").onclick=open; document.getElementById("removeAnimeBtn").onclick=openRemove; document.getElementById("closeEditBtn").onclick=close; document.getElementById("cancelEditBtn").onclick=close; document.getElementById("cancelRemoveBtn").onclick=closeRemove;
  document.getElementById("confirmRemoveBtn").onclick=async()=>{try{await deleteRecord(record.id);location.href="collection.html"}catch(e){document.getElementById("removeMessage").textContent=e.message||"Could not remove anime."}};
  if(new URLSearchParams(location.search).get("edit")==="1")open();
  form.onsubmit=async(e)=>{e.preventDefault(); const status=document.getElementById("editStatus").value; const completed=detailsNormalize(status)==="completed"; const ratingChanges=Object.fromEntries(DETAILS_RATING_FIELDS.map(({key})=>[key,completed?Number(document.getElementById(`rating-${key}`).value):null])); const changes={status,...ratingChanges,last_season:document.getElementById("editLastSeason").value.trim()||null,started_watching:document.getElementById("editStartedWatching").value||null,notes:document.getElementById("editNotes").value.trim()||null,favorite:document.getElementById("editFavorite").checked}; try{const updated=await updateRecord(record.id,changes);close();renderDetails(updated,media)}catch(err){document.getElementById("editMessage").textContent=err.message||"Could not save changes."}};
}

async function initAnimeDetails(){
  const root=document.getElementById("detailsRoot"); const params=new URLSearchParams(location.search); const recordId=params.get("id"); const anilistId=params.get("anilist_id");
  if(!recordId&&!anilistId){root.innerHTML='<div class="error">No anime was selected.</div>';return;}
  try{ let record=recordId?await fetchOwnRecordById(recordId):await fetchOwnRecordByAnimeId(anilistId); const mediaId=record?.anilist_id||anilistId; const media=await fetchAnimeDetails(mediaId); renderDetails(record,media); }
  catch(error){console.error(error);root.innerHTML=`<div class="error">${detailsEscapeHtml(error.message||"Could not load anime details.")}</div>`;}
}


/* v3.0.6 Public comments */
let animeCommentsState = {
  anilistId: null,
  currentUserId: null,
  comments: [],
  sort: "relevant"
};

function commentAvatarPath(avatarId) {
  const safeId = Math.min(8, Math.max(1, Number(avatarId) || 1));
  return `assets/avatars/avatar-${safeId}.svg`;
}

function commentDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined
  }).format(date);
}

async function fetchAnimeComments(anilistId) {
  const { data, error } = await supabaseClient.rpc("get_anime_comments", {
    p_anilist_id: Number(anilistId)
  });

  if (error) throw error;
  return data || [];
}

function sortedTopLevelComments(comments, sort) {
  const list = comments.filter((comment) => comment.parent_comment_id === null);

  return list.sort((a, b) => {
    if (sort === "recent") {
      return new Date(b.created_at) - new Date(a.created_at);
    }

    if (sort === "oldest") {
      return new Date(a.created_at) - new Date(b.created_at);
    }

    const likeDifference = Number(b.like_count || 0) - Number(a.like_count || 0);
    if (likeDifference !== 0) return likeDifference;
    return new Date(b.created_at) - new Date(a.created_at);
  });
}

function commentOwnerControls(comment) {
  if (comment.user_id !== animeCommentsState.currentUserId) return "";

  return `
    <button class="comment-text-action" type="button" data-comment-edit="${comment.id}">Edit</button>
    <button class="comment-text-action danger" type="button" data-comment-delete="${comment.id}">Delete</button>
  `;
}

function commentMarkup(comment, isReply = false) {
  return `
    <article class="comment-card ${isReply ? "comment-reply-card" : ""}" data-comment-id="${comment.id}">
      <button
        class="comment-author-button"
        type="button"
        data-comment-profile="${comment.user_id}"
        data-comment-username="${detailsEscapeHtml(comment.username || "Anime Fan")}"
        data-comment-avatar="${Number(comment.avatar_id) || 1}"
      >
        <img src="${commentAvatarPath(comment.avatar_id)}" alt="" />
      </button>

      <div class="comment-content">
        <div class="comment-meta">
          <button
            class="comment-author-name"
            type="button"
            data-comment-profile="${comment.user_id}"
            data-comment-username="${detailsEscapeHtml(comment.username || "Anime Fan")}"
            data-comment-avatar="${Number(comment.avatar_id) || 1}"
          >
            ${detailsEscapeHtml(comment.username || "Anime Fan")}
          </button>
          <span>${commentDate(comment.created_at)}</span>
          ${comment.updated_at && comment.updated_at !== comment.created_at ? "<span>Edited</span>" : ""}
        </div>

        <p class="comment-body">${detailsEscapeHtml(comment.comment_text)}</p>

        <div class="comment-actions">
          <button
            class="comment-like-btn ${comment.liked_by_me ? "liked" : ""}"
            type="button"
            data-comment-like="${comment.id}"
            aria-pressed="${comment.liked_by_me ? "true" : "false"}"
          >
            ♥ <span>${Number(comment.like_count || 0)}</span>
          </button>
          ${isReply ? "" : `<button class="comment-text-action" type="button" data-comment-reply="${comment.id}">Reply</button>`}
          ${commentOwnerControls(comment)}
        </div>

        ${isReply ? "" : `<div class="reply-form-slot" id="replySlot-${comment.id}"></div>`}
      </div>
    </article>
  `;
}

function renderAnimeComments() {
  const root = document.getElementById("commentsList");
  if (!root) return;

  const topLevel = sortedTopLevelComments(
    [...animeCommentsState.comments],
    animeCommentsState.sort
  );

  if (!topLevel.length) {
    root.innerHTML = '<div class="comments-empty">No comments yet. Start the conversation.</div>';
    return;
  }

  root.innerHTML = topLevel.map((comment) => {
    const replies = animeCommentsState.comments
      .filter((reply) => Number(reply.parent_comment_id) === Number(comment.id))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return `
      <div class="comment-thread">
        ${commentMarkup(comment)}
        ${replies.length ? `
          <div class="comment-replies">
            ${replies.map((reply) => commentMarkup(reply, true)).join("")}
          </div>
        ` : ""}
      </div>
    `;
  }).join("");

  bindCommentActions();
}

async function refreshAnimeComments() {
  animeCommentsState.comments = await fetchAnimeComments(animeCommentsState.anilistId);
  renderAnimeComments();
}

async function createAnimeComment(commentText, parentCommentId = null) {
  const { error } = await supabaseClient.from("anime_comments").insert({
    anilist_id: animeCommentsState.anilistId,
    user_id: animeCommentsState.currentUserId,
    parent_comment_id: parentCommentId,
    comment_text: commentText.trim()
  });

  if (error) throw error;
}

async function toggleCommentLike(commentId) {
  const comment = animeCommentsState.comments.find(
    (item) => Number(item.id) === Number(commentId)
  );
  if (!comment) return;

  if (comment.liked_by_me) {
    const { error } = await supabaseClient
      .from("comment_likes")
      .delete()
      .eq("comment_id", Number(commentId))
      .eq("user_id", animeCommentsState.currentUserId);

    if (error) throw error;
  } else {
    const { error } = await supabaseClient.from("comment_likes").insert({
      comment_id: Number(commentId),
      user_id: animeCommentsState.currentUserId
    });

    if (error) throw error;
  }
}

function openReplyForm(commentId) {
  document.querySelectorAll(".reply-form-slot").forEach((slot) => {
    if (slot.id !== `replySlot-${commentId}`) slot.innerHTML = "";
  });

  const slot = document.getElementById(`replySlot-${commentId}`);
  if (!slot) return;

  if (slot.innerHTML.trim()) {
    slot.innerHTML = "";
    return;
  }

  slot.innerHTML = `
    <form class="reply-compose" data-reply-form="${commentId}">
      <textarea maxlength="2000" rows="2" placeholder="Write a reply…" required></textarea>
      <div>
        <button class="comment-text-action" type="button" data-cancel-reply="${commentId}">Cancel</button>
        <button class="comment-submit-btn compact" type="submit">Reply</button>
      </div>
    </form>
  `;

  slot.querySelector("textarea").focus();

  slot.querySelector(`[data-cancel-reply="${commentId}"]`).addEventListener("click", () => {
    slot.innerHTML = "";
  });

  slot.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const textarea = event.currentTarget.querySelector("textarea");
    const button = event.currentTarget.querySelector(".comment-submit-btn");
    const text = textarea.value.trim();
    if (!text) return;

    button.disabled = true;
    button.textContent = "Posting…";

    try {
      await createAnimeComment(text, Number(commentId));
      await refreshAnimeComments();
    } catch (error) {
      alert(error.message || "Could not post reply.");
      button.disabled = false;
      button.textContent = "Reply";
    }
  });
}

async function editAnimeComment(commentId) {
  const comment = animeCommentsState.comments.find(
    (item) => Number(item.id) === Number(commentId)
  );
  if (!comment || comment.user_id !== animeCommentsState.currentUserId) return;

  const updatedText = prompt("Edit your comment:", comment.comment_text);
  if (updatedText === null) return;

  const text = updatedText.trim();
  if (!text) {
    alert("A comment cannot be empty.");
    return;
  }

  const { error } = await supabaseClient
    .from("anime_comments")
    .update({
      comment_text: text,
      updated_at: new Date().toISOString()
    })
    .eq("id", Number(commentId));

  if (error) {
    alert(error.message);
    return;
  }

  await refreshAnimeComments();
}

async function deleteAnimeComment(commentId) {
  const comment = animeCommentsState.comments.find(
    (item) => Number(item.id) === Number(commentId)
  );
  if (!comment || comment.user_id !== animeCommentsState.currentUserId) return;
  if (!confirm("Delete this comment and all of its replies?")) return;

  const { error } = await supabaseClient
    .from("anime_comments")
    .delete()
    .eq("id", Number(commentId));

  if (error) {
    alert(error.message);
    return;
  }

  await refreshAnimeComments();
}

async function friendshipWithUser(targetUserId) {
  const { data, error } = await supabaseClient
    .from("friendships")
    .select("id, sender_id, receiver_id, status")
    .or(
      `and(sender_id.eq.${animeCommentsState.currentUserId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${animeCommentsState.currentUserId})`
    )
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function sendCommentFriendRequest(targetUserId, button, message) {
  button.disabled = true;
  button.textContent = "Sending…";

  try {
    const existing = await friendshipWithUser(targetUserId);

    if (existing?.status === "accepted") {
      window.location.href = `friend.html?user=${encodeURIComponent(targetUserId)}`;
      return;
    }

    if (existing?.status === "pending") {
      message.textContent =
        existing.receiver_id === animeCommentsState.currentUserId
          ? "This user already sent you a request. Open Friends to respond."
          : "Friend request already pending.";
      button.textContent = "Request Pending";
      return;
    }

    if (existing?.status === "declined") {
      const { error: deleteError } = await supabaseClient
        .from("friendships")
        .delete()
        .eq("id", existing.id);

      if (deleteError) throw deleteError;
    }

    const { error } = await supabaseClient.from("friendships").insert({
      sender_id: animeCommentsState.currentUserId,
      receiver_id: targetUserId,
      status: "pending"
    });

    if (error) throw error;

    message.textContent = "Friend request sent.";
    button.textContent = "Request Sent";
  } catch (error) {
    message.textContent = error.message || "Could not send friend request.";
    button.disabled = false;
    button.textContent = "Send Friend Request";
  }
}

async function openCommentProfile(targetUserId, username, avatarId) {
  const modal = document.getElementById("commentProfileModal");
  const content = document.getElementById("commentProfileContent");
  const closeButton = document.getElementById("closeCommentProfileBtn");
  if (!modal || !content || !closeButton) return;

  modal.hidden = false;
  document.body.classList.add("modal-open");

  let publicBadges = [];
  try {
    publicBadges = await matLoadUserBadges(targetUserId);
  } catch (badgeError) {
    console.warn("Could not load profile badges", badgeError);
  }

  content.innerHTML = `
    <img class="comment-profile-avatar" src="${commentAvatarPath(avatarId)}" alt="" />
    <h2 id="commentProfileName">${detailsEscapeHtml(username || "Anime Fan")}</h2>
    ${matBadgeRowHtml(publicBadges, { emptyText: "No badges awarded yet.", compact: true })}
    <p class="comment-profile-private">Profile locked</p>
    <div class="comment-profile-message" id="commentProfileMessage">Checking friendship…</div>
  `;
  matBindBadgeButtons(content);

  if (targetUserId === animeCommentsState.currentUserId) {
    content.insertAdjacentHTML("beforeend", '<a class="comment-profile-primary" href="profile.html">View My Profile</a>');
    document.getElementById("commentProfileMessage").textContent = "This is your profile.";
    return;
  }

  try {
    const friendship = await friendshipWithUser(targetUserId);
    const message = document.getElementById("commentProfileMessage");

    if (friendship?.status === "accepted") {
      message.textContent = "You are friends with this user.";
      content.insertAdjacentHTML("beforeend", `
        <a class="comment-profile-primary" href="friend.html?user=${encodeURIComponent(targetUserId)}">
          View Full Profile
        </a>
      `);
      return;
    }

    if (friendship?.status === "pending") {
      message.textContent =
        friendship.receiver_id === animeCommentsState.currentUserId
          ? "This user sent you a friend request. Open Friends to respond."
          : "Friend request pending.";

      content.insertAdjacentHTML("beforeend", '<a class="comment-profile-secondary" href="friends.html">Open Friends</a>');
      return;
    }

    message.textContent = "Become friends to unlock their full profile.";
    content.insertAdjacentHTML("beforeend", `
      <button class="comment-profile-primary" id="sendCommentFriendRequestBtn" type="button">
        Send Friend Request
      </button>
    `);

    document
      .getElementById("sendCommentFriendRequestBtn")
      .addEventListener("click", (event) => {
        sendCommentFriendRequest(targetUserId, event.currentTarget, message);
      });
  } catch (error) {
    document.getElementById("commentProfileMessage").textContent =
      error.message || "Could not load profile.";
  }
}

function bindCommentActions() {
  document.querySelectorAll("[data-comment-like]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await toggleCommentLike(button.dataset.commentLike);
        await refreshAnimeComments();
      } catch (error) {
        alert(error.message || "Could not update like.");
        button.disabled = false;
      }
    });
  });

  document.querySelectorAll("[data-comment-reply]").forEach((button) => {
    button.addEventListener("click", () => openReplyForm(button.dataset.commentReply));
  });

  document.querySelectorAll("[data-comment-edit]").forEach((button) => {
    button.addEventListener("click", () => editAnimeComment(button.dataset.commentEdit));
  });

  document.querySelectorAll("[data-comment-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteAnimeComment(button.dataset.commentDelete));
  });

  document.querySelectorAll("[data-comment-profile]").forEach((button) => {
    button.addEventListener("click", () => {
      openCommentProfile(
        button.dataset.commentProfile,
        button.dataset.commentUsername,
        button.dataset.commentAvatar
      );
    });
  });
}

async function initAnimeComments(anilistId) {
  if (!Number.isFinite(Number(anilistId))) return;

  const { data, error } = await supabaseClient.auth.getSession();
  if (error || !data?.session?.user) return;

  animeCommentsState.anilistId = Number(anilistId);
  animeCommentsState.currentUserId = data.session.user.id;

  const form = document.getElementById("commentForm");
  const textarea = document.getElementById("commentText");
  const message = document.getElementById("commentMessage");
  const sort = document.getElementById("commentsSort");
  const modal = document.getElementById("commentProfileModal");
  const closeButton = document.getElementById("closeCommentProfileBtn");

  sort?.addEventListener("change", () => {
    animeCommentsState.sort = sort.value;
    renderAnimeComments();
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = textarea.value.trim();
    if (!text) return;

    const button = form.querySelector(".comment-submit-btn");
    button.disabled = true;
    button.textContent = "Posting…";
    message.textContent = "";

    try {
      await createAnimeComment(text);
      textarea.value = "";
      await refreshAnimeComments();
    } catch (submitError) {
      message.textContent = submitError.message || "Could not post comment.";
    } finally {
      button.disabled = false;
      button.textContent = "Post Comment";
    }
  });

  const closeProfile = () => {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  };

  closeButton?.addEventListener("click", closeProfile);
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeProfile();
  });

  try {
    await refreshAnimeComments();
  } catch (loadError) {
    console.error(loadError);
    const root = document.getElementById("commentsList");
    if (root) {
      root.innerHTML = `<div class="error">${detailsEscapeHtml(
        loadError.message || "Could not load comments."
      )}</div>`;
    }
  }
}
