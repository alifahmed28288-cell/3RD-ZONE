// =====================================================
// 3RD ZONE - PROFESSIONAL ADMIN PANEL
// Supabase + Products + Media + Analytics + Social
// =====================================================

let supabaseClient = null;

const $ = (id) => document.getElementById(id);

// -----------------------------------------------------
// SUPABASE CONFIG
// -----------------------------------------------------

const savedUrl = localStorage.getItem("3rdzone_supabase_url");
const savedKey = localStorage.getItem("3rdzone_supabase_anon");

if (savedUrl && savedKey) {
    $("supabaseUrl").value = savedUrl;
    $("supabaseKey").value = savedKey;

    initSupabase(savedUrl, savedKey);
}

// -----------------------------------------------------
// INITIALIZE SUPABASE
// -----------------------------------------------------

function initSupabase(url, key) {
    try {
        supabaseClient = window.supabase.createClient(url, key);

        $("configCard").classList.add("hidden");
        $("loginCard").classList.remove("hidden");

        supabaseClient.auth.getSession().then(({ data }) => {
            if (data.session) {
                showDashboard();
            }
        });

    } catch (error) {
        console.error(error);
        alert("Supabase connection failed.");
    }
}

// -----------------------------------------------------
// SAVE SUPABASE CONFIG
// -----------------------------------------------------

$("saveConfigBtn").onclick = () => {

    const url = $("supabaseUrl").value.trim();
    const key = $("supabaseKey").value.trim();

    if (!url || !key) {
        alert("Project URL and anon/public key are required.");
        return;
    }

    localStorage.setItem("3rdzone_supabase_url", url);
    localStorage.setItem("3rdzone_supabase_anon", key);

    initSupabase(url, key);
};

// -----------------------------------------------------
// LOGIN
// -----------------------------------------------------

$("loginBtn").onclick = async () => {

    if (!supabaseClient) {
        $("loginMsg").textContent = "Supabase is not connected.";
        return;
    }

    const email = $("email").value.trim();
    const password = $("password").value;

    if (!email || !password) {
        $("loginMsg").textContent = "Enter email and password.";
        return;
    }

    $("loginMsg").textContent = "Logging in...";

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

    if (error) {
        console.error(error);
        $("loginMsg").textContent = error.message;
        return;
    }

    if (!data.session) {
        $("loginMsg").textContent = "Login failed.";
        return;
    }

    await showDashboard();
};

// -----------------------------------------------------
// LOGOUT
// -----------------------------------------------------

$("logoutBtn").onclick = async () => {

    if (supabaseClient) {
        await supabaseClient.auth.signOut();
    }

    location.reload();
};

// -----------------------------------------------------
// DASHBOARD
// -----------------------------------------------------

async function showDashboard() {

    $("loginCard").classList.add("hidden");
    $("configCard").classList.add("hidden");
    $("dashboard").classList.remove("hidden");
    $("logoutBtn").classList.remove("hidden");

    await Promise.all([
        loadStats(),
        loadProducts(),
        loadAnalytics(),
        loadSocial()
    ]);
}

// -----------------------------------------------------
// STATISTICS
// -----------------------------------------------------

async function loadStats() {

    try {

        const productsResult =
            await supabaseClient
                .from("products")
                .select("id", {
                    count: "exact",
                    head: true
                });

        const viewsResult =
            await supabaseClient
                .from("product_views")
                .select("id", {
                    count: "exact",
                    head: true
                });

        const ordersResult =
            await supabaseClient
                .from("orders")
                .select("id", {
                    count: "exact",
                    head: true
                });

        $("productCount").textContent =
            productsResult.count ?? 0;

        $("viewCount").textContent =
            viewsResult.count ?? 0;

        $("orderCount").textContent =
            ordersResult.count ?? 0;

    } catch (error) {

        console.error("Stats error:", error);

    }
}

// -----------------------------------------------------
// ADD PRODUCT
// -----------------------------------------------------

$("productForm").onsubmit = async (e) => {

    e.preventDefault();

    const msg = $("productMsg");

    msg.textContent = "Saving product...";

    try {

        const name =
            $("pName").value.trim();

        const category =
            $("pCategory").value.trim();

        const price =
            Number($("pPrice").value);

        const oldPrice =
            $("pOldPrice").value
                ? Number($("pOldPrice").value)
                : null;

        const stock =
            Number($("pStock").value || 0);

        const featured =
            $("pFeatured").value === "true";

        const description =
            $("pDescription").value.trim();

        if (!name) {
            msg.textContent = "Product name is required.";
            return;
        }

        if (price < 0) {
            msg.textContent = "Invalid price.";
            return;
        }

        // Create slug
        const slug =
            name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
            + "-" +
            Date.now();

        // Insert product
        const {
            data: product,
            error
        } =
            await supabaseClient
                .from("products")
                .insert({
                    name,
                    slug,
                    category,
                    price,
                    old_price: oldPrice,
                    stock,
                    featured,
                    description,
                    active: true
                })
                .select()
                .single();

        if (error) {

            console.error(error);

            msg.textContent =
                "Product error: " + error.message;

            return;
        }

        // -------------------------------------------------
        // UPLOAD MEDIA
        // -------------------------------------------------

        const files =
            [...$("pMedia").files];

        for (let i = 0; i < files.length; i++) {

            const file = files[i];

            const safeName =
                file.name
                    .replace(/[^a-zA-Z0-9._-]/g, "-");

            const path =
                `${product.id}/${Date.now()}-${i}-${safeName}`;

            const upload =
                await supabaseClient
                    .storage
                    .from("product-media")
                    .upload(
                        path,
                        file,
                        {
                            upsert: false
                        }
                    );

            if (upload.error) {

                console.error(upload.error);

                msg.textContent =
                    "Product saved, but media upload failed: " +
                    upload.error.message;

                return;
            }

            const publicUrl =
                supabaseClient
                    .storage
                    .from("product-media")
                    .getPublicUrl(path);

            const mediaType =
                file.type.startsWith("video/")
                    ? "video"
                    : "image";

            const mediaInsert =
                await supabaseClient
                    .from("product_media")
                    .insert({
                        product_id: product.id,
                        media_type: mediaType,
                        media_url: publicUrl.data.publicUrl,
                        sort_order: i
                    });

            if (mediaInsert.error) {

                console.error(mediaInsert.error);

                msg.textContent =
                    "Product saved, but media record failed: " +
                    mediaInsert.error.message;

                return;
            }
        }

        msg.textContent =
            "✅ Product added successfully.";

        $("productForm").reset();

        await showDashboard();

    } catch (error) {

        console.error(error);

        msg.textContent =
            "Unexpected error: " + error.message;
    }
};

// -----------------------------------------------------
// LOAD PRODUCTS
// -----------------------------------------------------

async function loadProducts() {

    const list =
        $("productsList");

    list.innerHTML =
        `<div class="item">Loading products...</div>`;

    const {
        data,
        error
    } =
        await supabaseClient
            .from("products")
            .select(
                "id,name,category,price,old_price,stock,featured,active,created_at"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {

        console.error(error);

        list.innerHTML =
            `<div class="item">Error: ${esc(error.message)}</div>`;

        return;
    }

    if (!data || !data.length) {

        list.innerHTML =
            `<div class="item">
                No products yet. Add your first product above.
             </div>`;

        return;
    }

    list.innerHTML = "";

    data.forEach((p) => {

        const item =
            document.createElement("div");

        item.className = "item";

        const status =
            p.active
                ? "🟢 Active"
                : "🔴 Hidden";

        const featured =
            p.featured
                ? " ⭐ Featured"
                : "";

        item.innerHTML = `
            <div style="flex:1">
                <b>${esc(p.name)}</b>

                <span>
                    ${esc(p.category || "Other")}
                    · ৳${Number(p.price || 0).toLocaleString()}
                    · Stock: ${p.stock ?? 0}
                </span>

                <small>
                    ${status}${featured}
                </small>
            </div>

            <div style="display:flex;gap:6px;flex-wrap:wrap">

                <button
                    class="secondary"
                    data-action="toggle"
                >
                    ${p.active ? "Hide" : "Show"}
                </button>

                <button
                    class="secondary"
                    data-action="feature"
                >
                    ${p.featured ? "Unfeature" : "Feature"}
                </button>

                <button
                    class="danger"
                    data-action="delete"
                >
                    Delete
                </button>

            </div>
        `;

        // Toggle active
        item
            .querySelector('[data-action="toggle"]')
            .onclick = async () => {

                const { error } =
                    await supabaseClient
                        .from("products")
                        .update({
                            active: !p.active
                        })
                        .eq("id", p.id);

                if (error) {
                    alert(error.message);
                    return;
                }

                await loadProducts();
            };

        // Toggle featured
        item
            .querySelector('[data-action="feature"]')
            .onclick = async () => {

                const { error } =
                    await supabaseClient
                        .from("products")
                        .update({
                            featured: !p.featured
                        })
                        .eq("id", p.id);

                if (error) {
                    alert(error.message);
                    return;
                }

                await loadProducts();
            };

        // Delete
        item
            .querySelector('[data-action="delete"]')
            .onclick = async () => {

                const confirmed =
                    confirm(
                        `Delete "${p.name}"?\n\nThis cannot be undone.`
                    );

                if (!confirmed) return;

                const { error } =
                    await supabaseClient
                        .from("products")
                        .delete()
                        .eq("id", p.id);

                if (error) {

                    alert(
                        "Delete failed: " +
                        error.message
                    );

                    return;
                }

                await loadProducts();
                await loadStats();
            };

        list.appendChild(item);
    });
}

// -----------------------------------------------------
// ANALYTICS
// -----------------------------------------------------

async function loadAnalytics() {

    const list =
        $("analyticsList");

    list.textContent =
        "Loading analytics...";

    const {
        data,
        error
    } =
        await supabaseClient
            .from("product_views")
            .select("product_id");

    if (error) {

        console.error(error);

        list.textContent =
            error.message;

        return;
    }

    if (!data || !data.length) {

        list.textContent =
            "No product views yet.";

        return;
    }

    const counts = {};

    data.forEach((row) => {

        if (!row.product_id) return;

        counts[row.product_id] =
            (counts[row.product_id] || 0) + 1;
    });

    const ids =
        Object.keys(counts);

    if (!ids.length) {

        list.textContent =
            "No product views yet.";

        return;
    }

    const {
        data: products,
        error: productError
    } =
        await supabaseClient
            .from("products")
            .select("id,name")
            .in("id", ids);

    if (productError) {

        list.textContent =
            productError.message;

        return;
    }

    list.innerHTML = "";

    (products || [])
        .sort(
            (a, b) =>
                counts[b.id] - counts[a.id]
        )
        .forEach((p) => {

            const item =
                document.createElement("div");

            item.className = "item";

            item.innerHTML = `
                <b>${esc(p.name)}</b>
                <span>
                    👀 ${counts[p.id]} views
                </span>
            `;

            list.appendChild(item);
        });
}

// -----------------------------------------------------
// SOCIAL LINKS
// -----------------------------------------------------

async function loadSocial() {

    const fields =
        $("socialFields");

    fields.innerHTML =
        "Loading...";

    const {
        data,
        error
    } =
        await supabaseClient
            .from("social_links")
            .select("platform,url")
            .order("platform");

    if (error) {

        console.error(error);

        fields.textContent =
            error.message;

        return;
    }

    fields.innerHTML = "";

    if (!data || !data.length) {

        fields.textContent =
            "No social links found.";

        return;
    }

    data.forEach((social) => {

        const row =
            document.createElement("div");

        row.className =
            "social-row";

        row.innerHTML = `
            <label>
                ${esc(social.platform)}
            </label>

            <input
                data-platform="${esc(social.platform)}"
                value="${esc(social.url || "")}"
                placeholder="https://..."
            >
        `;

        fields.appendChild(row);
    });
}

// -----------------------------------------------------
// SAVE SOCIAL LINKS
// -----------------------------------------------------

$("socialForm").onsubmit = async (e) => {

    e.preventDefault();

    const inputs =
        $("socialFields")
            .querySelectorAll("input");

    for (const input of inputs) {

        const platform =
            input.dataset.platform;

        const url =
            input.value.trim();

        const { error } =
            await supabaseClient
                .from("social_links")
                .update({
                    url,
                    updated_at:
                        new Date().toISOString()
                })
                .eq(
                    "platform",
                    platform
                );

        if (error) {

            $("socialMsg").textContent =
                error.message;

            return;
        }
    }

    $("socialMsg").textContent =
        "✅ Social links saved successfully.";
};

// -----------------------------------------------------
// ESCAPE HTML
// -----------------------------------------------------

function esc(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// -----------------------------------------------------
// AUTO SESSION
// -----------------------------------------------------

if (supabaseClient) {

    supabaseClient.auth.onAuthStateChange(
        (event, session) => {

            if (event === "SIGNED_IN" && session) {
                showDashboard();
            }

        }
    );
}
