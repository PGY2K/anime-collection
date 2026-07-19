const PROFILE_AVATAR_COUNT=8;
const MAT_RP_SHOP_PRICE=500;
const MAT_RP_COLORS=["red","blue","green","pink","black","white"];
const MAT_RP_SHOP_CATEGORIES=[
  {key:"avatar_glow",title:"PFP",fullTitle:"Profile Picture Glow",description:"Neon ring around your profile picture."},
  {key:"profile_background",title:"Background",fullTitle:"Profile Background",description:"Solid color theme for your complete profile."},
  {key:"top_five_glow",title:"Top 5",fullTitle:"Top 5 Glow",description:"Neon outlines around the Top 5 poster cards."},
  {key:"recommendation_glow",title:"Recommendation",fullTitle:"Recommendation Glow",description:"Neon outline around the recommendation card."}
];
function profileAvatarPath(avatarId){const safeId=Math.min(PROFILE_AVATAR_COUNT,Math.max(1,Number(avatarId)||1));return `assets/avatars/avatar-${safeId}.svg`}
function matRpEscape(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function matRpFormatPoints(value){const number=Number(value)||0;return Number.isInteger(number)?number.toLocaleString():number.toLocaleString(undefined,{maximumFractionDigits:2})}
function matRpLabel(value){return String(value||"").split("_").map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(" ")}
function matRpModalHtml(){return `<div class="rp-modal-backdrop" id="matRpModal" hidden><section class="rp-modal rp-hub-modal" role="dialog" aria-modal="true" aria-labelledby="matRpModalTitle"><button class="rp-modal-close" type="button" aria-label="Close">×</button><div class="rp-modal-title"><img src="assets/icons/rp-gem.png" alt=""><div><h2 id="matRpModalTitle">Recommendation Points</h2><p>Learn about RP, customize your profile, or review what your recommendations earned.</p></div></div><div class="rp-hub-actions"><button type="button" data-rp-view="guide">How RP Works</button><button type="button" data-rp-view="shop">Shop</button><button type="button" data-rp-view="history">History</button></div><div class="rp-hub-panel" id="matRpPanel"></div></section></div>`}
function matRpGuideHtml(){return `<section class="rp-guide"><h3>How RP Works</h3><p>Earn Recommendation Points when users act on a title you recommended.</p><div class="rp-earn-grid"><span><b>+1</b> Added to Collection</span><span><b>+3</b> Completed</span><span><b>+5</b> First Rating</span><span><b>+10</b> Exact First-Rating Match</span></div><p>Spend RP in the Shop on permanent profile customizations. When several eligible users recommended the same title, points may be split between them.</p></section>`}
function matRpPopup(title,message,actions=[{label:"Close",value:false}]){return new Promise(resolve=>{document.getElementById("matRpActionPopup")?.remove();const buttons=actions.map((action,index)=>`<button type="button" class="${action.primary?"primary-btn":"secondary-btn"}" data-rp-popup-action="${index}">${matRpEscape(action.label)}</button>`).join("");document.body.insertAdjacentHTML("beforeend",`<div class="mat-popup-backdrop rp-action-popup" id="matRpActionPopup"><section class="mat-popup-card" role="alertdialog" aria-modal="true" aria-labelledby="matRpActionTitle"><button class="mat-popup-close" type="button" aria-label="Close">×</button><h2 id="matRpActionTitle">${matRpEscape(title)}</h2><p>${matRpEscape(message)}</p><div class="mat-popup-actions">${buttons}</div></section></div>`);const popup=document.getElementById("matRpActionPopup");const close=value=>{popup.remove();resolve(value)};popup.querySelector(".mat-popup-close").onclick=()=>close(false);popup.onclick=e=>{if(e.target===popup)close(false)};popup.querySelectorAll("[data-rp-popup-action]").forEach(button=>button.onclick=()=>close(actions[Number(button.dataset.rpPopupAction)]?.value))})}
async function matLoadProfileCustomizations(userId){if(!userId||typeof supabaseClient==="undefined")return matNormalizeCustomizations({});const {data,error}=await supabaseClient.rpc("get_profile_customizations",{p_user_id:userId});if(error){console.warn("Profile customizations could not be loaded.",error);return matNormalizeCustomizations({})}return matNormalizeCustomizations(data)}
function matCustomizationClass(prefix,color){const safe=MAT_RP_COLORS.includes(String(color))?String(color):"default";return `${prefix}-${safe}`}
function matRpHistoryCard(row){const title=matRpEscape(row.title||`${row.item_type==="franchise"?"Franchise":"Anime"} #${row.item_key}`);const total=matRpFormatPoints(row.total_points);const line=(label,users,points)=>`<div class="rp-history-line"><strong>${label}</strong><span>Users: ${Number(users)||0}</span><span>Points: ${matRpFormatPoints(points)} RP</span></div>`;return `<article class="rp-history-card"><div class="rp-history-card-head"><div><h4>${title}</h4><small>${row.item_type==="franchise"?"Franchise":"Anime"}</small></div><strong>${total} RP</strong></div>${line("Added",row.added_users,row.added_points)}${line("Completed",row.completed_users,row.completed_points)}${line("Rated",row.rated_users,row.rated_points)}${line("Rating Match",row.match_users,row.match_points)}</article>`}
async function matLoadRpHistory(){const panel=document.getElementById("matRpPanel");if(!panel)return;panel.innerHTML='<div class="rp-history-loading">Loading RP history…</div>';try{if(typeof supabaseClient==="undefined")throw new Error("RP history is unavailable right now.");const {data,error}=await supabaseClient.rpc("get_my_recommendation_rp_history");if(error)throw error;const rows=Array.isArray(data)?data:[];panel.innerHTML=`<section class="rp-history"><h3>History</h3><p>RP earned from each anime or franchise you recommended.</p>${rows.length?`<div class="rp-history-list">${rows.map(matRpHistoryCard).join("")}</div>`:'<div class="rp-history-empty">No recommendation RP history yet.</div>'}</section>`}catch(error){panel.innerHTML=`<div class="rp-history-empty">${matRpEscape(error.message||"Could not load RP history.")}</div>`}}
function matNormalizeCustomizations(value){
  let parsed=value;try{if(typeof parsed==="string")parsed=JSON.parse(parsed)}catch{}
  const raw=Array.isArray(parsed)?(parsed[0]||{}):(parsed||{});
  const pick=(...keys)=>{for(const key of keys){const candidate=String(raw[key]??"").toLowerCase();if(MAT_RP_COLORS.includes(candidate)||candidate==="default")return candidate}return "default"};
  return {
    avatar_glow:pick("avatar_glow","avatar_glow_color","profile_picture_glow"),
    profile_background:pick("profile_background","profile_background_color","background_glow"),
    top_five_glow:pick("top_five_glow","top_5_glow","top_five_glow_color"),
    recommendation_glow:pick("recommendation_glow","recommendation_glow_color","my_recommendation_glow")
  };
}
function matRpOwnedSet(value){let parsed=value;try{if(typeof parsed==="string")parsed=JSON.parse(parsed)}catch{}return new Set((Array.isArray(parsed)?parsed:[]).map(item=>typeof item==="string"?item:String(item?.item_key||item?.key||"")));}
function matRpBuildPreview(){
  const source=document.querySelector("#profileRoot .public-profile-card")||document.querySelector(".public-profile-card");
  if(source){
    const clone=source.cloneNode(true);
    clone.removeAttribute("id");
    clone.querySelectorAll("button,a,input,textarea,select").forEach(node=>{node.removeAttribute("href");node.removeAttribute("onclick");node.removeAttribute("id");node.tabIndex=-1;node.disabled=true});
    clone.querySelectorAll(".profile-rp-corner,.profile-admin-controls-btn,.profile-settings-form,.profile-recommendation-settings,.profile-actions").forEach(node=>node.remove());
    clone.classList.add("rp-shop-profile-preview-card");
    return clone.outerHTML;
  }
  const avatar=document.getElementById("navProfileAvatar")?.getAttribute("src")||profileAvatarPath(1);
  return `<section class="public-profile-card mat-profile-customized rp-shop-profile-preview-card mat-profile-bg-default"><div class="profile-header"><img class="profile-main-avatar mat-avatar-glow-default" src="${matRpEscape(avatar)}" alt="Your profile avatar"><h2>Your Profile</h2><p>Live RP Shop preview</p></div><section class="profile-active-recommendation mat-recommendation-glow-default"><div class="profile-section-heading"><h3>💎 My Recommendation</h3><span>Featured title</span></div><article class="dashboard-media-card profile-rec-card"><div class="profile-rec-poster poster-placeholder">🎌</div><div class="dashboard-media-body"><h3>Your Recommendation</h3><strong>⭐ 10.0</strong></div></article></section><section class="profile-top-section mat-top-five-glow-default"><div class="profile-section-heading"><h3>🏆 Top 5</h3><span>Your favorites</span></div><div class="profile-top-grid">${[1,2,3,4,5].map(number=>`<article class="profile-top-card"><div class="profile-top-rank">${number}</div><div class="profile-top-poster poster-placeholder">🎌</div></article>`).join("")}</div></section></section>`;
}
function matRpOption(category,color,state){
  const itemKey=`${category.key}:${color}`;
  const owned=color==="default"||state.ownedSet.has(itemKey);
  const selected=state.draft[category.key]===color;
  const status=color==="default"?"Free":owned?"Owned":"500 RP";
  return `<button type="button" class="rp-designer-color ${selected?"is-selected":""} ${owned?"is-owned":"is-locked"}" data-rp-design-category="${category.key}" data-rp-design-color="${color}" aria-label="${color==="default"?"Restore default":matRpLabel(color)}. ${status}." aria-pressed="${selected}"><span class="rp-color-preview mat-preview-${color}"></span><strong>${color==="default"?"Default":matRpLabel(color)}</strong><small>${status}</small></button>`;
}
function matRpCategoryButton(category,state){
  const color=state.draft[category.key]||"default";
  const label=color==="default"?"Default":matRpLabel(color);
  return `<button type="button" class="rp-category-bubble" data-rp-category-open="${category.key}" aria-label="Customize ${matRpEscape(category.fullTitle||category.title)}"><span class="rp-category-bubble-copy"><strong>${matRpEscape(category.title)}</strong><small>${matRpEscape(label)}</small></span><span class="rp-category-bubble-swatch mat-preview-${color}"></span></button>`;
}
function matRpDesignerHtml(state){
  return `<section class="rp-shop rp-profile-designer"><div class="rp-shop-heading"><div><h3>Design Your Profile</h3><p>Preview your design, then purchase and equip it once.</p></div><strong class="rp-shop-balance"><img src="assets/icons/rp-gem.png" alt="">${matRpFormatPoints(state.balance)} RP</strong></div><div class="rp-designer-layout"><div class="rp-designer-preview-wrap"><div class="rp-designer-preview-label"><strong>Live Preview</strong><span>Not saved yet</span></div><div id="matRpProfilePreview">${matRpBuildPreview()}</div></div><div class="rp-designer-controls"><div class="rp-category-home" id="matRpCategoryHome"><div class="rp-category-home-copy"><h4>Customize</h4><p>Choose a category, then select a color.</p></div><div class="rp-category-bubbles">${MAT_RP_SHOP_CATEGORIES.map(category=>matRpCategoryButton(category,state)).join("")}</div></div><section class="rp-color-picker" id="matRpColorPicker" hidden><div class="rp-color-picker-head"><div><h4 id="matRpColorPickerTitle">Choose a color</h4><p id="matRpColorPickerDescription"></p></div><button type="button" class="rp-color-picker-close" id="matRpColorPickerClose" aria-label="Close color menu">×</button></div><div class="rp-designer-colors" id="matRpColorPickerOptions"></div></section></div></div><footer class="rp-designer-checkout"><div class="rp-designer-totals"><span>Cost <strong id="matRpPendingCost">0 RP</strong></span><span>Balance <strong id="matRpCurrentBalance">${matRpFormatPoints(state.balance)} RP</strong></span><span>After <strong id="matRpRemainingBalance">${matRpFormatPoints(state.balance)} RP</strong></span></div><button class="primary-btn rp-purchase-equip-btn" id="matRpPurchaseEquip" type="button">Purchase and Equip</button></footer></section>`;
}
function matRpRenderCategoryBubbles(state){
  const wrap=document.querySelector(".rp-category-bubbles");
  if(!wrap)return;
  wrap.innerHTML=MAT_RP_SHOP_CATEGORIES.map(category=>matRpCategoryButton(category,state)).join("");
  wrap.querySelectorAll("[data-rp-category-open]").forEach(button=>button.onclick=()=>matRpOpenColorPicker(state,button.dataset.rpCategoryOpen));
}
function matRpCloseColorPicker(){
  const picker=document.getElementById("matRpColorPicker");
  const home=document.getElementById("matRpCategoryHome");
  if(picker)picker.hidden=true;
  if(home)home.hidden=false;
}
function matRpOpenColorPicker(state,key){
  const category=MAT_RP_SHOP_CATEGORIES.find(item=>item.key===key);
  if(!category)return;
  state.activeCategory=key;
  const home=document.getElementById("matRpCategoryHome");
  const picker=document.getElementById("matRpColorPicker");
  const title=document.getElementById("matRpColorPickerTitle");
  const description=document.getElementById("matRpColorPickerDescription");
  const options=document.getElementById("matRpColorPickerOptions");
  if(home)home.hidden=true;
  if(title)title.textContent=category.fullTitle||category.title;
  if(description)description.textContent=category.description;
  if(options){
    options.innerHTML=[...MAT_RP_COLORS,"default"].map(color=>matRpOption(category,color,state)).join("");
    options.querySelectorAll("[data-rp-design-category]").forEach(button=>button.onclick=()=>{
      state.draft[button.dataset.rpDesignCategory]=button.dataset.rpDesignColor;
      matRpRefreshDesigner(state);
      matRpRenderCategoryBubbles(state);
      matRpCloseColorPicker();
    });
  }
  if(picker)picker.hidden=false;
}
function matRpApplyDraftToPreview(draft){
  const preview=document.querySelector("#matRpProfilePreview .public-profile-card");
  if(!preview)return;
  const replace=(node,prefix,color)=>{if(!node)return;[...node.classList].filter(name=>name.startsWith(`${prefix}-`)).forEach(name=>node.classList.remove(name));node.classList.add(matCustomizationClass(prefix,color));};
  replace(preview,"mat-profile-bg",draft.profile_background);
  replace(preview.querySelector(".profile-main-avatar"),"mat-avatar-glow",draft.avatar_glow);
  replace(preview.querySelector(".profile-top-section"),"mat-top-five-glow",draft.top_five_glow);
  replace(preview.querySelector(".profile-active-recommendation"),"mat-recommendation-glow",draft.recommendation_glow);
}
function matRpDraftCost(state){return MAT_RP_SHOP_CATEGORIES.reduce((total,category)=>{const color=state.draft[category.key];return total+(color!=="default"&&!state.ownedSet.has(`${category.key}:${color}`)?MAT_RP_SHOP_PRICE:0)},0)}
function matRpRefreshDesigner(state){
  matRpApplyDraftToPreview(state.draft);
  const cost=matRpDraftCost(state);const remaining=state.balance-cost;
  const costNode=document.getElementById("matRpPendingCost");const remainingNode=document.getElementById("matRpRemainingBalance");
  if(costNode)costNode.textContent=`${matRpFormatPoints(cost)} RP`;if(remainingNode){remainingNode.textContent=`${matRpFormatPoints(remaining)} RP`;remainingNode.classList.toggle("is-negative",remaining<0)}
  document.querySelectorAll("[data-rp-design-category]").forEach(button=>{const selected=state.draft[button.dataset.rpDesignCategory]===button.dataset.rpDesignColor;button.classList.toggle("is-selected",selected);button.setAttribute("aria-pressed",String(selected));button.title=selected?"Selected":button.classList.contains("is-owned")?"Owned":"Locked"});
}
async function matLoadRpShop(){
  const panel=document.getElementById("matRpPanel");if(!panel)return;panel.innerHTML='<div class="rp-history-loading">Loading profile designer…</div>';
  try{
    const {data,error}=await supabaseClient.rpc("get_my_rp_shop_state");if(error)throw error;
    const raw=Array.isArray(data)?(data[0]||{}):(data||{});const equipped=matNormalizeCustomizations(raw.equipped||raw);
    const state={balance:Number(raw.balance)||0,ownedSet:matRpOwnedSet(raw.owned),equipped,draft:{...equipped},activeCategory:MAT_RP_SHOP_CATEGORIES[0].key};
    panel.innerHTML=matRpDesignerHtml(state);matRpApplyDraftToPreview(state.draft);
    matRpRenderCategoryBubbles(state);
    document.getElementById("matRpColorPickerClose").onclick=matRpCloseColorPicker;
    document.getElementById("matRpPurchaseEquip").onclick=()=>matPurchaseAndEquipDesign(state);
    matRpRefreshDesigner(state);
  }catch(error){panel.innerHTML=`<div class="rp-history-empty">${matRpEscape(error.message||"Could not load the RP Shop.")}</div>`}
}
async function matPurchaseAndEquipDesign(state){
  const total=matRpDraftCost(state);
  if(total>state.balance){await matRpPopup("Not Enough RP","You do not have enough RP for this transaction.");return}
  const summary=total?`Purchase the locked colors in this design for ${matRpFormatPoints(total)} RP and equip the full design?`:"Equip this profile design?";
  const confirmed=await matRpPopup("Confirm Profile Design",summary,[{label:"Cancel",value:false},{label:total?"Purchase and Equip":"Equip",value:true,primary:true}]);if(!confirmed)return;
  const button=document.getElementById("matRpPurchaseEquip");if(button){button.disabled=true;button.textContent="Saving…"}
  try{
    for(const category of MAT_RP_SHOP_CATEGORIES){const color=state.draft[category.key];const itemKey=`${category.key}:${color}`;if(color!=="default"&&!state.ownedSet.has(itemKey)){const {data,error}=await supabaseClient.rpc("purchase_rp_shop_item",{p_item_key:itemKey});if(error)throw error;state.ownedSet.add(itemKey);const result=Array.isArray(data)?(data[0]||{}):(data||{});if(result.balance!=null)state.balance=Number(result.balance)||0}}
    for(const category of MAT_RP_SHOP_CATEGORIES){const {error}=await supabaseClient.rpc("equip_profile_customization",{p_category:category.key,p_color:state.draft[category.key]});if(error)throw error}
    state.equipped={...state.draft};matApplyRpBalance(state.balance);
    window.dispatchEvent(new CustomEvent("mat-profile-customization-changed",{detail:{...state.draft}}));
    await matRpPopup("Profile Updated",total?`Your design has been purchased and equipped for ${matRpFormatPoints(total)} RP.`:"Your profile design has been equipped.");
    await matLoadRpShop();
  }catch(error){if(String(error.message||"").toLowerCase().includes("enough rp"))await matRpPopup("Not Enough RP","You do not have enough RP for this transaction.");else await matRpPopup("Could Not Save Design",error.message||"Your profile design could not be saved.");await matLoadRpShop()}
}

function matApplyRpBalance(value){document.querySelectorAll("[data-rp-total]").forEach(node=>node.textContent=Math.round(Number(value)||0).toLocaleString());const profileTotal=document.querySelector(".profile-rp-corner strong");if(profileTotal)profileTotal.textContent=`${Math.round(Number(value)||0).toLocaleString()} RP`}
function matSetRpView(view){document.getElementById("matRpModal")?.classList.toggle("is-shop-view",view==="shop");const panel=document.getElementById("matRpPanel");if(!panel)return;document.querySelectorAll("[data-rp-view]").forEach(button=>button.classList.toggle("is-active",button.dataset.rpView===view));if(view==="shop")matLoadRpShop();else if(view==="history")matLoadRpHistory();else panel.innerHTML=matRpGuideHtml()}
function matOpenRpModal(){let modal=document.getElementById("matRpModal");if(!modal){document.body.insertAdjacentHTML("beforeend",matRpModalHtml());modal=document.getElementById("matRpModal");modal.querySelector(".rp-modal-close").onclick=()=>{modal.hidden=true;document.body.classList.remove("modal-open")};modal.onclick=e=>{if(e.target===modal){modal.hidden=true;document.body.classList.remove("modal-open")}};modal.querySelectorAll("[data-rp-view]").forEach(button=>button.onclick=()=>matSetRpView(button.dataset.rpView))}modal.hidden=false;document.body.classList.add("modal-open");matSetRpView("guide")}
function matEnsureNavRpButton(links,profileLink){let button=links?.querySelector(".nav-rp-button");if(!button&&links){button=document.createElement("button");button.type="button";button.className="nav-rp-button";button.innerHTML='<img src="assets/icons/rp-gem.png" alt="RP"><strong data-rp-total>0</strong><span>RP</span>';links.insertBefore(button,profileLink||null)}if(button){button.title="Open Recommendation Points";button.setAttribute("aria-label","Open Recommendation Points menu.");button.onclick=matOpenRpModal}return button}
async function loadNavigationProfile(){const avatar=document.getElementById("navProfileAvatar");if(!avatar||typeof supabaseClient==="undefined")return;const links=avatar.closest(".nav-links");const profileLink=avatar.closest("a");const button=matEnsureNavRpButton(links,profileLink);try{const {data:sessionData}=await supabaseClient.auth.getSession();const user=sessionData?.session?.user;if(!user)return;const {data,error}=await supabaseClient.from("profiles").select("avatar_id,recommendation_points").eq("user_id",user.id).maybeSingle();if(error)console.warn("Could not load navigation RP total.",error);avatar.src=profileAvatarPath(data?.avatar_id||1);matApplyRpBalance(data?.recommendation_points);const referralCode=String(user.user_metadata?.referral_code||"").trim().toUpperCase();if(data&&referralCode){const {data:claimResult,error:claimError}=await supabaseClient.rpc("claim_referral",{p_referral_code:referralCode});if(!claimError&&(claimResult?.claimed===true||claimResult?.reason==="already_claimed"))await supabaseClient.auth.updateUser({data:{...user.user_metadata,referral_code:null}})}}catch(error){console.warn("Navigation profile could not be loaded.",error)}}
document.addEventListener("DOMContentLoaded",loadNavigationProfile);
