let supabaseClient=null;
const $=id=>document.getElementById(id);
const savedUrl=localStorage.getItem("3rdzone_supabase_url");
const savedKey=localStorage.getItem("3rdzone_supabase_anon");
if(savedUrl&&savedKey){$("supabaseUrl").value=savedUrl;$("supabaseKey").value=savedKey;initSupabase(savedUrl,savedKey);}

function initSupabase(url,key){
  supabaseClient=window.supabase.createClient(url,key);
  $("configCard").classList.add("hidden");
  $("loginCard").classList.remove("hidden");
  supabaseClient.auth.getSession().then(({data})=>{if(data.session)showDashboard();});
}

$("saveConfigBtn").onclick=()=>{
  const url=$("supabaseUrl").value.trim(),key=$("supabaseKey").value.trim();
  if(!url||!key)return alert("Project URL and anon/public key are required.");
  localStorage.setItem("3rdzone_supabase_url",url);
  localStorage.setItem("3rdzone_supabase_anon",key);
  initSupabase(url,key);
};

$("loginBtn").onclick=async()=>{
  $("loginMsg").textContent="Logging in...";
  const {error}=await supabaseClient.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
  if(error){$("loginMsg").textContent=error.message;return;}
  showDashboard();
};

$("logoutBtn").onclick=async()=>{await supabaseClient.auth.signOut();location.reload();};

async function showDashboard(){
  $("loginCard").classList.add("hidden");$("dashboard").classList.remove("hidden");$("logoutBtn").classList.remove("hidden");
  await Promise.all([loadStats(),loadProducts(),loadAnalytics(),loadSocial()]);
}

async function loadStats(){
  const p=await supabaseClient.from("products").select("id",{count:"exact",head:true});
  const v=await supabaseClient.from("product_views").select("id",{count:"exact",head:true});
  const o=await supabaseClient.from("orders").select("id",{count:"exact",head:true});
  $("productCount").textContent=p.count??0;$("viewCount").textContent=v.count??0;$("orderCount").textContent=o.count??0;
}

$("productForm").onsubmit=async e=>{
  e.preventDefault();$("productMsg").textContent="Saving product...";
  const name=$("pName").value.trim(),category=$("pCategory").value.trim();
  const price=Number($("pPrice").value),oldPrice=$("pOldPrice").value?Number($("pOldPrice").value):null;
  const stock=Number($("pStock").value||0),featured=$("pFeatured").value==="true",description=$("pDescription").value.trim();
  const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+"-"+Date.now();
  const {data:product,error}=await supabaseClient.from("products").insert({name,slug,category,price,old_price:oldPrice,stock,featured,description}).select().single();
  if(error){$("productMsg").textContent=error.message;return;}
  const files=[...$("pMedia").files];
  for(let i=0;i<files.length;i++){
    const file=files[i],safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const path=`${product.id}/${Date.now()}-${i}-${safe}`;
    const up=await supabaseClient.storage.from("product-media").upload(path,file,{upsert:false});
    if(up.error){$("productMsg").textContent="Product saved, but media upload failed: "+up.error.message;return;}
    const {data:pub}=supabaseClient.storage.from("product-media").getPublicUrl(path);
    const media_type=file.type.startsWith("video/")?"video":"image";
    const ins=await supabaseClient.from("product_media").insert({product_id:product.id,media_type,media_url:pub.publicUrl,sort_order:i});
    if(ins.error){$("productMsg").textContent="Product saved, but media record failed: "+ins.error.message;return;}
  }
  $("productMsg").textContent="Product added successfully.";
  $("productForm").reset();await showDashboard();
};

async function loadProducts(){
  const {data,error}=await supabaseClient.from("products").select("id,name,category,price,stock,active,created_at").order("created_at",{ascending:false});
  if(error){$("productsList").textContent=error.message;return;}
  $("productsList").innerHTML="";
  data.forEach(p=>{
    const d=document.createElement("div");d.className="item";
    d.innerHTML=`<button class="danger" data-id="${p.id}">Delete</button><b>${esc(p.name)}</b><span>${esc(p.category||"")} · ৳${Number(p.price).toFixed(2)} · Stock: ${p.stock}</span>`;
    d.querySelector("button").onclick=async()=>{if(confirm("Delete this product?")){await supabaseClient.from("products").delete().eq("id",p.id);loadProducts();loadStats();}};
    $("productsList").appendChild(d);
  });
}

async function loadAnalytics(){
  const {data,error}=await supabaseClient.from("product_views").select("product_id");
  if(error){$("analyticsList").textContent=error.message;return;}
  const counts={};data.forEach(x=>counts[x.product_id]=(counts[x.product_id]||0)+1);
  const ids=Object.keys(counts);
  if(!ids.length){$("analyticsList").textContent="No product views yet.";return;}
  const {data:products}=await supabaseClient.from("products").select("id,name").in("id",ids);
  $("analyticsList").innerHTML="";
  (products||[]).sort((a,b)=>counts[b.id]-counts[a.id]).forEach(p=>{
    const d=document.createElement("div");d.className="item";d.innerHTML=`<b>${esc(p.name)}</b><span>👀 ${counts[p.id]} views</span>`;$("analyticsList").appendChild(d);
  });
}

async function loadSocial(){
  const {data,error}=await supabaseClient.from("social_links").select("platform,url").order("platform");
  if(error){$("socialFields").textContent=error.message;return;}
  $("socialFields").innerHTML="";
  (data||[]).forEach(s=>{
    const row=document.createElement("div");row.className="social-row";
    row.innerHTML=`<label>${esc(s.platform)}</label><input data-platform="${esc(s.platform)}" value="${esc(s.url||"")}" placeholder="https://...">`;
    $("socialFields").appendChild(row);
  });
}
$("socialForm").onsubmit=async e=>{
  e.preventDefault();
  for(const input of $("socialFields").querySelectorAll("input")){
    const platform=input.dataset.platform,url=input.value.trim();
    await supabaseClient.from("social_links").update({url,updated_at:new Date().toISOString()}).eq("platform",platform);
  }
  $("socialMsg").textContent="Social links saved.";
};
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
