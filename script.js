// =====================================================
// 3RD ZONE - SUPABASE PRODUCT SHOP
// Product Details + Multiple Images + Video + WhatsApp
// =====================================================

const SUPABASE_URL = "https://oiuvprtyjajatubueoum.supabase.co";

const SUPABASE_ANON_KEY =
"sb_publishable_i7FvSYVlb-gg73oLQyFMCg_fyfcg5pU";

const WHATSAPP_NUMBER = "8801404610359";

let products = [];
let cart = [];
let currentProduct = null;
let currentMedia = [];


// =====================================================
// LOAD PRODUCTS
// =====================================================

async function loadProducts() {

    const box = document.getElementById("products");

    box.innerHTML = `
        <div class="loading-products">
            Loading products...
        </div>
    `;

    try {

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/products?select=*&active=eq.true&order=created_at.desc`,
            {
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Could not load products");
        }

        const data = await response.json();

        products = data.map(p => ({
            id: p.id,
            name: p.name || "Unnamed Product",
            cat: p.category || "Other",
            price: Number(p.price || 0),
            old: Number(p.old_price || 0),
            description:
                p.description ||
                p.details ||
                "High quality product from 3RD ZONE.",
            stock: p.stock ?? "In Stock",
            brand: p.brand || "3RD ZONE",
            rating: p.rating || 5,
            reviews: p.reviews || 0,
            icon: getIcon(p.category),
            media: []
        }));


        // Load media for every product
        await Promise.all(
            products.map(async product => {
                product.media = await loadProductMedia(product.id);
            })
        );

        render();

    } catch (error) {

        console.error(error);

        box.innerHTML = `
            <div class="error-products">
                <h3>Unable to load products</h3>
                <p>Please refresh the page.</p>
            </div>
        `;
    }
}


// =====================================================
// LOAD PRODUCT MEDIA
// =====================================================

async function loadProductMedia(productId) {

    try {

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/product_media?select=*&product_id=eq.${productId}&order=sort_order.asc`,
            {
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );

        if (!response.ok) {
            console.log("Media loading failed:", productId);
            return [];
        }

        const data = await response.json();

        return data.map(m => ({
            type: (m.media_type || "image").toLowerCase(),
            url: m.media_url
        }));

    } catch (error) {

        console.error("Media error:", error);

        return [];
    }
}


// =====================================================
// ICON
// =====================================================

function getIcon(category) {

    if (!category) return "📦";

    const cat = category.toLowerCase();

    if (cat.includes("power")) return "🔋";
    if (cat.includes("tws")) return "🎧";
    if (cat.includes("cooler")) return "❄️";
    if (cat.includes("charger")) return "🔌";
    if (cat.includes("cable")) return "🔗";
    if (cat.includes("gaming")) return "🎮";
    if (cat.includes("speaker")) return "🔊";

    return "📦";
}


// =====================================================
// PRODUCT CARD
// =====================================================

function render(list = products) {

    let sortedList = [...list];

    const sortElement = document.getElementById("sort");

    if (sortElement) {

        const sort = sortElement.value;

        if (sort === "low") {
            sortedList.sort((a, b) => a.price - b.price);
        }

        if (sort === "high") {
            sortedList.sort((a, b) => b.price - a.price);
        }
    }


    const productBox = document.getElementById("products");

    if (!sortedList.length) {

        productBox.innerHTML = `
            <div class="no-products">
                No products found.
            </div>
        `;

        return;
    }


    productBox.innerHTML = sortedList.map(p => {

        const firstImage =
            p.media.find(m => m.type === "image");

        const imageHTML = firstImage

            ? `
                <img
                    src="${firstImage.url}"
                    alt="${escapeHTML(p.name)}"
                    loading="lazy"
                >
              `

            : `
                <div class="product-icon">
                    ${p.icon}
                </div>
              `;


        const discount =
            p.old > p.price
                ? Math.round(((p.old - p.price) / p.old) * 100)
                : 0;


        return `

            <article
                class="card product-card-new"
                onclick="openProduct('${p.id}')"
            >

                <div class="pic product-image">
                    ${imageHTML}

                    ${
                        discount
                            ? `<span class="discount-badge">-${discount}%</span>`
                            : ""
                    }

                    ${
                        p.media.length > 1
                            ? `<span class="media-count">📷 ${p.media.length}</span>`
                            : ""
                    }
                </div>


                <div class="info">

                    <span class="tag">
                        ${escapeHTML(p.cat)}
                    </span>

                    <h3>
                        ${escapeHTML(p.name)}
                    </h3>


                    <div class="stars">
                        ⭐⭐⭐⭐⭐
                    </div>


                    <div class="price">

                        ৳${p.price.toLocaleString()}

                        ${
                            p.old
                                ? `<span class="old">
                                    ৳${p.old.toLocaleString()}
                                   </span>`
                                : ""
                        }

                    </div>


                    <button
                        class="add"
                        onclick="event.stopPropagation(); addToCart('${p.id}')"
                    >
                        🛒 Add to Cart
                    </button>

                </div>

            </article>
        `;

    }).join("");
}


// =====================================================
// PRODUCT DETAILS
// =====================================================

async function openProduct(id) {

    const product =
        products.find(p => String(p.id) === String(id));

    if (!product) return;

    currentProduct = product;

    currentMedia = product.media || [];

    createProductModal();

    renderProductDetails();
}


// =====================================================
// CREATE PRODUCT MODAL
// =====================================================

function createProductModal() {

    if (document.getElementById("productDetailsModal")) {
        return;
    }


    const modal = document.createElement("div");

    modal.id = "productDetailsModal";

    modal.className = "product-details-modal";


    modal.innerHTML = `

        <div
            class="product-details-overlay"
            onclick="closeProductDetails()"
        ></div>


        <div class="product-details-box">

            <button
                class="product-close"
                onclick="closeProductDetails()"
            >
                ×
            </button>


            <div id="productDetailsContent"></div>

        </div>

    `;


    document.body.appendChild(modal);
}


// =====================================================
// RENDER PRODUCT DETAILS
// =====================================================

function renderProductDetails() {

    const p = currentProduct;

    const box =
        document.getElementById("productDetailsContent");


    const images =
        currentMedia.filter(m => m.type === "image");


    const videos =
        currentMedia.filter(m => m.type === "video");


    const firstImage =
        images.length
            ? images[0].url
            : null;


    const discount =
        p.old > p.price
            ? Math.round(((p.old - p.price) / p.old) * 100)
            : 0;


    let mainMedia = "";


    if (firstImage) {

        mainMedia = `
            <img
                id="mainProductImage"
                class="main-product-media"
                src="${firstImage}"
                alt="${escapeHTML(p.name)}"
            >
        `;

    } else if (videos.length) {

        mainMedia = `
            <video
                class="main-product-media"
                controls
                playsinline
            >
                <source src="${videos[0].url}">
            </video>
        `;

    } else {

        mainMedia = `
            <div class="big-product-icon">
                ${p.icon}
            </div>
        `;
    }


    box.innerHTML = `

        <div class="product-detail-layout">


            <!-- LEFT SIDE -->

            <div class="product-gallery">

                <div class="main-media">

                    ${mainMedia}

                    ${
                        discount
                            ? `<span class="detail-discount">
                                -${discount}%
                               </span>`
                            : ""
                    }

                </div>


                <div class="thumbnail-list">

                    ${
                        images.map((m, i) => `

                            <button
                                class="thumbnail"
                                onclick="changeMainImage('${m.url}')"
                            >
                                <img src="${m.url}">
                            </button>

                        `).join("")
                    }


                    ${
                        videos.map((m, i) => `

                            <button
                                class="thumbnail video-thumb"
                                onclick="showMainVideo('${m.url}')"
                            >
                                🎥
                                <span>Video</span>
                            </button>

                        `).join("")
                    }

                </div>

            </div>


            <!-- RIGHT SIDE -->

            <div class="product-information">


                <div class="product-category">
                    ${escapeHTML(p.cat)}
                </div>


                ${
                    discount
                        ? `
                            <div class="offer">
                                -${discount}% OFF
                            </div>
                          `
                        : ""
                }


                <h1>
                    ${escapeHTML(p.name)}
                </h1>


                <div class="rating-row">

                    <span class="stars-big">
                        ⭐⭐⭐⭐⭐
                    </span>

                    <span>
                        ${p.rating}/5
                    </span>

                    ${
                        p.reviews
                            ? `<span>
                                (${p.reviews} Reviews)
                               </span>`
                            : ""
                    }

                </div>


                <div class="detail-price">

                    ৳${p.price.toLocaleString()}

                    ${
                        p.old
                            ? `
                                <span class="detail-old-price">
                                    ৳${p.old.toLocaleString()}
                                </span>
                              `
                            : ""
                    }

                </div>


                <div class="stock">
                    🟢 ${escapeHTML(String(p.stock))}
                </div>


                <div class="detail-section">

                    <h3>📦 Product Details</h3>

                    <p>
                        ${escapeHTML(p.description)}
                    </p>

                </div>


                <div class="detail-info-row">

                    <b>Brand</b>

                    <span>
                        ${escapeHTML(String(p.brand))}
                    </span>

                </div>


                <div class="detail-info-row">

                    <b>Category</b>

                    <span>
                        ${escapeHTML(p.cat)}
                    </span>

                </div>


                <div class="detail-section">

                    <h3>🚚 Delivery</h3>

                    <p>
                        Nationwide delivery available.
                        Cash on Delivery available.
                    </p>

                </div>


                <div class="detail-section">

                    <h3>🛡️ Service</h3>

                    <p>
                        Quality checked before delivery.
                    </p>

                </div>


                <!-- DESKTOP BUTTONS -->

                <div class="detail-buttons">

                    <button
                        class="buy-now"
                        onclick="buyNow('${p.id}')"
                    >
                        🟢 Buy Now
                    </button>


                    <button
                        class="detail-cart"
                        onclick="addToCart('${p.id}')"
                    >
                        🛒 Add to Cart
                    </button>

                </div>

            </div>

        </div>


        <!-- MOBILE STICKY BUTTONS -->

        <div class="mobile-buy-bar">

            <button
                onclick="buyNow('${p.id}')"
                class="mobile-buy"
            >
                Buy Now
                <small>WhatsApp</small>
            </button>


            <button
                onclick="addToCart('${p.id}')"
                class="mobile-cart"
            >
                Add to Cart
            </button>

        </div>

    `;


    document
        .getElementById("productDetailsModal")
        .classList.add("show");


    document.body.style.overflow = "hidden";
}


// =====================================================
// CHANGE IMAGE
// =====================================================

function changeMainImage(url) {

    const container =
        document.querySelector(".main-media");

    if (!container) return;


    container.innerHTML = `

        <img
            id="mainProductImage"
            class="main-product-media"
            src="${url}"
            alt="Product"
        >

    `;
}


// =====================================================
// SHOW VIDEO
// =====================================================

function showMainVideo(url) {

    const container =
        document.querySelector(".main-media");

    if (!container) return;


    container.innerHTML = `

        <video
            class="main-product-media"
            controls
            autoplay
            playsinline
        >
            <source src="${url}">
        </video>

    `;
}


// =====================================================
// CLOSE DETAILS
// =====================================================

function closeProductDetails() {

    const modal =
        document.getElementById("productDetailsModal");

    if (modal) {
        modal.classList.remove("show");
    }

    document.body.style.overflow = "";
}


// =====================================================
// BUY NOW - WHATSAPP
// =====================================================

function buyNow(id) {

    const product =
        products.find(p => String(p.id) === String(id));

    if (!product) return;


    const message =
`🛍️ 3RD ZONE ORDER

📦 Product: ${product.name}

💰 Price: ৳${product.price.toLocaleString()}

I want to buy this product.

Please confirm my order.`;

    const url =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
}


// =====================================================
// CART
// =====================================================

function addToCart(id) {

    const product =
        products.find(
            p => String(p.id) === String(id)
        );

    if (!product) return;


    cart.push(product);

    updateCart();

    alert("Added to cart!");
}


function updateCart() {

    const count =
        document.getElementById("cartCount");

    if (count) {
        count.textContent = cart.length;
    }
}


function openCart() {

    const modal =
        document.getElementById("cartModal");

    if (!modal) return;


    modal.style.display = "flex";


    const items =
        document.getElementById("cartItems");


    items.innerHTML = cart.length

        ? cart.map((p, i) => `

            <div class="cart-row">

                <span>
                    ${p.icon}
                    ${escapeHTML(p.name)}
                </span>

                <b>
                    ৳${p.price.toLocaleString()}

                    <button
                        onclick="removeItem(${i})"
                    >
                        ×
                    </button>
                </b>

            </div>

        `).join("")

        : "Your cart is empty.";


    document.getElementById("cartTotal").textContent =
        cart
            .reduce((sum, p) => sum + p.price, 0)
            .toLocaleString();
}


function removeItem(i) {

    cart.splice(i, 1);

    updateCart();

    openCart();
}


function closeCart() {

    const modal =
        document.getElementById("cartModal");

    if (modal) {
        modal.style.display = "none";
    }
}


// =====================================================
// CHECKOUT
// =====================================================

function showCheckout() {

    if (!cart.length) {

        alert("Your cart is empty.");

        return;
    }


    closeCart();

    document.getElementById(
        "checkoutModal"
    ).style.display = "flex";
}


function closeCheckout() {

    document.getElementById(
        "checkoutModal"
    ).style.display = "none";
}


// =====================================================
// PLACE ORDER
// =====================================================

function placeOrder(e) {

    e.preventDefault();


    const customerName =
        document.getElementById("name").value;

    const customerPhone =
        document.getElementById("phone").value;

    const customerAddress =
        document.getElementById("address").value;

    const paymentMethod =
        document.getElementById("payment").value;


    const items =
        cart
            .map(p => p.name)
            .join(", ");


    const total =
        cart.reduce(
            (sum, p) => sum + p.price,
            0
        );


    const message =
`🛍️ 3RD ZONE ORDER

👤 Name: ${customerName}

📞 Phone: ${customerPhone}

📍 Address: ${customerAddress}

💳 Payment: ${paymentMethod}

📦 Products:
${items}

💰 Total: ৳${total.toLocaleString()}`;


    const url =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;


    window.open(url, "_blank");


    cart = [];

    updateCart();

    closeCheckout();
}


// =====================================================
// CATEGORY
// =====================================================

function filterProducts(cat) {

    if (cat === "all") {

        render(products);

        return;
    }


    render(
        products.filter(
            p =>
                p.cat.toLowerCase() ===
                cat.toLowerCase()
        )
    );
}


// =====================================================
// SEARCH
// =====================================================

function searchProducts() {

    const input =
        document.getElementById("search");

    const q =
        input.value.toLowerCase();


    render(
        products.filter(p =>
            (
                p.name +
                " " +
                p.cat
            )
            .toLowerCase()
            .includes(q)
        )
    );
}


// =====================================================
// SECURITY / HTML ESCAPE
// =====================================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// START
// =====================================================

loadProducts();
