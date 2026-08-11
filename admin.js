// =====================================================
// 3RD ZONE — PROFESSIONAL ADMIN PANEL
// Supabase Auth + Products + Media + Analytics + Social
// =====================================================

const SUPABASE_URL = "https://oiuvprtyjajatubueoum.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_i7FvSYVlb-gg73oLQyFMCg_fyfcg5pU";
const STORAGE_BUCKET = "product-media";

let supabaseClient = null;

const $ = (id) => document.getElementById(id);

// =====================================================
// START
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    init();
});

async function init() {
    try {
        if (!window.supabase) {
            showError(
                "Supabase library load হয়নি। admin.html-এর Supabase script check করো."
            );
            return;
        }

        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );

        // Hide config card because config is already inside this JS
        if ($("configCard")) {
            $("configCard").classList.add("hidden");
        }

        // Show login
        if ($("loginCard")) {
            $("loginCard").classList.remove("hidden");
        }

        // Login button
        if ($("loginBtn")) {
            $("loginBtn").addEventListener("click", login);
        }

        // Logout
        if ($("logoutBtn")) {
            $("logoutBtn").addEventListener("click", logout);
        }

        // Product form
        if ($("productForm")) {
            $("productForm").addEventListener(
                "submit",
                addProduct
            );
        }

        // Social form
        if ($("socialForm")) {
            $("socialForm").addEventListener(
                "submit",
                saveSocialLinks
            );
        }

        // Check existing login
        const {
            data,
            error
        } = await supabaseClient.auth.getSession();

        if (error) {
            console.error("Session error:", error);
            return;
        }

        if (data && data.session) {
            await showDashboard();
        }

    } catch (error) {
        console.error("Init error:", error);
        showError(error.message);
    }
}

// =====================================================
// LOGIN
// =====================================================

async function login() {

    const msg = $("loginMsg");

    const email =
        $("email")?.value.trim();

    const password =
        $("password")?.value;

    if (!email || !password) {
        if (msg) {
            msg.textContent =
                "Email and password enter করো.";
        }
        return;
    }

    if (msg) {
        msg.textContent = "Logging in...";
    }

    const button = $("loginBtn");

    if (button) {
        button.disabled = true;
        button.textContent = "Logging in...";
    }

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            console.error("Login error:", error);

            if (msg) {
                msg.textContent =
                    "Login failed: " + error.message;
            }

            return;
        }

        if (!data || !data.session) {
            if (msg) {
                msg.textContent =
                    "Login failed. Session পাওয়া যায়নি.";
            }

            return;
        }

        if (msg) {
            msg.textContent =
                "Login successful!";
        }

        await showDashboard();

    } catch (error) {

        console.error(error);

        if (msg) {
            msg.textContent =
                "Login error: " + error.message;
        }

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent = "Login";
        }
    }
}

// =====================================================
// LOGOUT
// =====================================================

async function logout() {

    try {

        await supabaseClient.auth.signOut();

        location.reload();

    } catch (error) {

        console.error(error);

        alert(
            "Logout failed: " +
            error.message
        );
    }
}

// =====================================================
// DASHBOARD
// =====================================================

async function showDashboard() {

    if ($("configCard")) {
        $("configCard").classList.add("hidden");
    }

    if ($("loginCard")) {
        $("loginCard").classList.add("hidden");
    }

    if ($("dashboard")) {
        $("dashboard").classList.remove("hidden");
    }

    if ($("logoutBtn")) {
        $("logoutBtn").classList.remove("hidden");
    }

    await Promise.all([
        loadStats(),
        loadProducts(),
        loadAnalytics(),
        loadSocial()
    ]);
}

// =====================================================
// STATS
// =====================================================

async function loadStats() {

    try {

        const products =
            await supabaseClient
                .from("products")
                .select("id", {
                    count: "exact",
                    head: true
                });

        const views =
            await supabaseClient
                .from("product_views")
                .select("id", {
                    count: "exact",
                    head: true
                });

        const orders =
            await supabaseClient
                .from("orders")
                .select("id", {
                    count: "exact",
                    head: true
                });

        if ($("productCount")) {
            $("productCount").textContent =
                products.count ?? 0;
        }

        if ($("viewCount")) {
            $("viewCount").textContent =
                views.count ?? 0;
        }

        if ($("orderCount")) {
            $("orderCount").textContent =
                orders.count ?? 0;
        }

    } catch (error) {

        console.error(
            "Stats error:",
            error
        );
    }
}

// =====================================================
// ADD PRODUCT
// =====================================================

async function addProduct(e) {

    e.preventDefault();

    const msg =
        $("productMsg");

    if (msg) {
        msg.textContent =
            "Saving product...";
    }

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
            Number(
                $("pStock").value || 0
            );

        const featured =
            $("pFeatured").value === "true";

        const description =
            $("pDescription").value.trim();

        if (!name) {
            throw new Error(
                "Product name is required."
            );
        }

        if (!Number.isFinite(price) || price < 0) {
            throw new Error(
                "Valid product price দাও."
            );
        }

        // Create unique slug
        const slug =
            name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
            + "-" +
            Date.now();

        // ---------------------------------------------
        // INSERT PRODUCT
        // ---------------------------------------------

        const {
            data: product,
            error
        } =
            await supabaseClient
                .from("products")
                .insert({
                    name: name,
                    slug: slug,
                    category: category,
                    price: price,
                    old_price: oldPrice,
                    stock: stock,
                    featured: featured,
                    description: description,
                    active: true
                })
                .select()
                .single();

        if (error) {
            throw new Error(
                "Product save failed: " +
                error.message
            );
        }

        // ---------------------------------------------
        // UPLOAD MEDIA
        // ---------------------------------------------

        const files =
            Array.from(
                $("pMedia").files || []
            );

        for (
            let i = 0;
            i < files.length;
            i++
        ) {

            const file =
                files[i];

            const safeName =
                file.name
                    .replace(
                        /[^a-zA-Z0-9._-]/g,
                        "-"
                    );

            const path =
                `${product.id}/${Date.now()}-${i}-${safeName}`;

            // Upload file
            const upload =
                await supabaseClient
                    .storage
                    .from(STORAGE_BUCKET)
                    .upload(
                        path,
                        file,
                        {
                            cacheControl: "3600",
                            upsert: false
                        }
                    );

            if (upload.error) {

                throw new Error(
                    "Media upload failed: " +
                    upload.error.message
                );
            }

            // Get public URL
            const publicUrl =
                supabaseClient
                    .storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(path);

            const mediaType =
                file.type.startsWith("video/")
                    ? "video"
                    : "image";

            // Save media record
            const mediaInsert =
                await supabaseClient
                    .from("product_media")
                    .insert({
                        product_id: product.id,
                        media_type: mediaType,
                        media_url:
                            publicUrl.data.publicUrl,
                        sort_order: i
                    });

            if (mediaInsert.error) {

                throw new Error(
                    "Media database save failed: " +
                    mediaInsert.error.message
                );
            }
        }

        if (msg) {
            msg.textContent =
                "✅ Product added successfully.";
        }

        $("productForm").reset();

        await loadProducts();
        await loadStats();

    } catch (error) {

        console.error(
            "Add product error:",
            error
        );

        if (msg) {
            msg.textContent =
                "❌ " + error.message;
        }
    }
}

// =====================================================
// LOAD PRODUCTS
// =====================================================

async function loadProducts() {

    const list =
        $("productsList");

    if (!list) return;

    list.innerHTML =
        `<div class="item">
            Loading products...
        </div>`;

    try {

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
            throw error;
        }

        if (!data || !data.length) {

            list.innerHTML =
                `<div class="item">
                    No products yet.
                </div>`;

            return;
        }

        list.innerHTML = "";

        data.forEach(
            (product) => {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "item";

                const status =
                    product.active
                        ? "🟢 Active"
                        : "🔴 Hidden";

                const featured =
                    product.featured
                        ? " ⭐ Featured"
                        : "";

                item.innerHTML = `
                    <div style="flex:1">
                        <b>
                            ${esc(product.name)}
                        </b>

                        <span>
                            ${esc(
                                product.category ||
                                "Other"
                            )}
                            ·
                            ৳${Number(
                                product.price || 0
                            ).toLocaleString()}
                            · Stock:
                            ${product.stock ?? 0}
                        </span>

                        <small>
                            ${status}${featured}
                        </small>
                    </div>

                    <div style="
                        display:flex;
                        gap:6px;
                        flex-wrap:wrap;
                    ">

                        <button
                            class="secondary"
                            data-action="toggle"
                        >
                            ${
                                product.active
                                    ? "Hide"
                                    : "Show"
                            }
                        </button>

                        <button
                            class="secondary"
                            data-action="feature"
                        >
                            ${
                                product.featured
                                    ? "Unfeature"
                                    : "Feature"
                            }
                        </button>

                        <button
                            class="danger"
                            data-action="delete"
                        >
                            Delete
                        </button>

                    </div>
                `;

                // -------------------------------------
                // HIDE / SHOW
                // -------------------------------------

                item
                    .querySelector(
                        '[data-action="toggle"]'
                    )
                    .onclick =
                    async () => {

                        const {
                            error
                        } =
                            await supabaseClient
                                .from("products")
                                .update({
                                    active:
                                        !product.active
                                })
                                .eq(
                                    "id",
                                    product.id
                                );

                        if (error) {
                            alert(
                                error.message
                            );
                            return;
                        }

                        await loadProducts();
                    };

                // -------------------------------------
                // FEATURE
                // -------------------------------------

                item
                    .querySelector(
                        '[data-action="feature"]'
                    )
                    .onclick =
                    async () => {

                        const {
                            error
                        } =
                            await supabaseClient
                                .from("products")
                                .update({
                                    featured:
                                        !product.featured
                                })
                                .eq(
                                    "id",
                                    product.id
                                );

                        if (error) {
                            alert(
                                error.message
                            );
                            return;
                        }

                        await loadProducts();
                    };

                // -------------------------------------
                // DELETE
                // -------------------------------------

                item
                    .querySelector(
                        '[data-action="delete"]'
                    )
                    .onclick =
                    async () => {

                        const yes =
                            confirm(
                                `Delete "${product.name}"?`
                            );

                        if (!yes) return;

                        const {
                            error
                        } =
                            await supabaseClient
                                .from("products")
                                .delete()
                                .eq(
                                    "id",
                                    product.id
                                );

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
            }
        );

    } catch (error) {

        console.error(
            "Products error:",
            error
        );

        list.innerHTML =
            `<div class="item">
                ❌ ${esc(error.message)}
            </div>`;
    }
}

// =====================================================
// ANALYTICS
// =====================================================

async function loadAnalytics() {

    const list =
        $("analyticsList");

    if (!list) return;

    list.textContent =
        "Loading analytics...";

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("product_views")
                .select("product_id");

        if (error) {
            throw error;
        }

        if (!data || !data.length) {

            list.textContent =
                "No product views yet.";

            return;
        }

        const counts = {};

        data.forEach(
            (row) => {

                if (!row.product_id) {
                    return;
                }

                counts[row.product_id] =
                    (counts[row.product_id] || 0) +
                    1;
            }
        );

        const ids =
            Object.keys(counts);

        if (!ids.length) {

            list.textContent =
                "No product views yet.";

            return;
        }

        const {
            data: productData,
            error: productError
        } =
            await supabaseClient
                .from("products")
                .select("id,name")
                .in(
                    "id",
                    ids
                );

        if (productError) {
            throw productError;
        }

        list.innerHTML = "";

        (productData || [])
            .sort(
                (a, b) =>
                    counts[b.id] -
                    counts[a.id]
            )
            .forEach(
                (product) => {

                    const item =
                        document.createElement(
                            "div"
                        );

                    item.className =
                        "item";

                    item.innerHTML = `
                        <b>
                            ${esc(product.name)}
                        </b>

                        <span>
                            👀
                            ${counts[product.id]}
                            views
                        </span>
                    `;

                    list.appendChild(item);
                }
            );

    } catch (error) {

        console.error(
            "Analytics error:",
            error
        );

        list.textContent =
            "Analytics error: " +
            error.message;
    }
}

// =====================================================
// SOCIAL LINKS
// =====================================================

async function loadSocial() {

    const fields =
        $("socialFields");

    if (!fields) return;

    fields.textContent =
        "Loading...";

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("social_links")
                .select(
                    "platform,url"
                )
                .order(
                    "platform"
                );

        if (error) {
            throw error;
        }

        fields.innerHTML = "";

        if (!data || !data.length) {

            fields.textContent =
                "No social links found.";

            return;
        }

        data.forEach(
            (social) => {

                const row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "social-row";

                row.innerHTML = `
                    <label>
                        ${esc(
                            social.platform
                        )}
                    </label>

                    <input
                        data-platform="${esc(
                            social.platform
                        )}"
                        value="${esc(
                            social.url || ""
                        )}"
                        placeholder="https://..."
                    >
                `;

                fields.appendChild(row);
            }
        );

    } catch (error) {

        console.error(
            "Social error:",
            error
        );

        fields.textContent =
            "Social links error: " +
            error.message;
    }
}

// =====================================================
// SAVE SOCIAL LINKS
// =====================================================

async function saveSocialLinks(e) {

    e.preventDefault();

    const msg =
        $("socialMsg");

    if (msg) {
        msg.textContent =
            "Saving...";
    }

    try {

        const inputs =
            $("socialFields")
                .querySelectorAll(
                    "input"
                );

        for (
            const input of inputs
        ) {

            const platform =
                input.dataset.platform;

            const url =
                input.value.trim();

            const {
                error
            } =
                await supabaseClient
                    .from("social_links")
                    .update({
                        url: url,
                        updated_at:
                            new Date()
                                .toISOString()
                    })
                    .eq(
                        "platform",
                        platform
                    );

            if (error) {
                throw error;
            }
        }

        if (msg) {
            msg.textContent =
                "✅ Social links saved.";
        }

    } catch (error) {

        console.error(
            "Social save error:",
            error
        );

        if (msg) {
            msg.textContent =
                "❌ " +
                error.message;
        }
    }
}

// =====================================================
// HTML ESCAPE
// =====================================================

function esc(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

// =====================================================
// GENERAL ERROR
// =====================================================

function showError(message) {

    console.error(message);

    const loginMsg =
        $("loginMsg");

    if (loginMsg) {
        loginMsg.textContent =
            message;
    } else {
        alert(message);
    }
}

// =====================================================
// AUTH STATE
// =====================================================

function setupAuthListener() {

    if (!supabaseClient) {
        return;
    }

    supabaseClient.auth.onAuthStateChange(
        async (event, session) => {

            if (
                event === "SIGNED_IN" &&
                session
            ) {
                await showDashboard();
            }

            if (
                event === "SIGNED_OUT"
            ) {
                location.reload();
            }
        }
    );
}
