// ==========================================
// 3RD ZONE - SUPABASE E-COMMERCE WEBSITE
// Products + Images + Videos + Cart + WhatsApp
// ==========================================

const SUPABASE_URL = "https://oiuvprtyjajatubueoum.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_i7FvSYVlb-gg73oLQyFMCg_fyfcg5pU";

const WHATSAPP_NUMBER = "8801404610359";

let products = [];
let cart = [];


// ==========================================
// LOAD PRODUCTS
// ==========================================

async function loadProducts() {

  const box = document.getElementById("products");

  box.innerHTML = "<p>Loading products...</p>";

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
      throw new Error(await response.text());
    }

    const data = await response.json();

    // Load media for every product
    products = await Promise.all(
      data.map(async (p) => {

        let media = [];

        try {

          const mediaResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/product_media?select=*&product_id=eq.${p.id}&order=sort_order.asc`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`
              }
            }
          );

          if (mediaResponse.ok) {
            media = await mediaResponse.json();
          }

        } catch (mediaError) {

          console.error(
            "Media loading error:",
            mediaError
          );

        }

        return {

          id: p.id,

          name: p.name || "Product",

          cat: p.category || "Other",

          price: Number(p.price || 0),

          old: Number(p.old_price || 0),

          description:
            p.description ||
            "Premium quality product from 3RD ZONE.",

          stock:
            p.stock ?? 0,

          media: media,

          icon: getIcon(p.category)

        };

      })
    );

    render();

  } catch (error) {

    console.error(error);

    box.innerHTML = `
      <div style="padding:20px;text-align:center;">
        <h3>Unable to load products</h3>
        <p>Please refresh the page.</p>
      </div>
    `;

  }

}


// ==========================================
// PRODUCT ICON
// ==========================================

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


// ==========================================
// GET IMAGE
// ==========================================

function getProductImage(product) {

  if (!product.media || !product.media.length) {
    return "";
  }

  const image = product.media.find(
    m => m.media_type === "image"
  );

  return image ? image.media_url : "";

}


// ==========================================
// GET VIDEO
// ==========================================

function getProductVideo(product) {

  if (!product.media || !product.media.length) {
    return "";
  }

  const video = product.media.find(
    m => m.media_type === "video"
  );

  return video ? video.media_url : "";

}


// ==========================================
// RENDER PRODUCTS
// ==========================================

function render(list = products) {

  let sortedList = [...list];

  const sortElement =
    document.getElementById("sort");

  const sort =
    sortElement ? sortElement.value : "default";


  if (sort === "low") {

    sortedList.sort(
      (a, b) => a.price - b.price
    );

  }


  if (sort === "high") {

    sortedList.sort(
      (a, b) => b.price - a.price
    );

  }


  const productBox =
    document.getElementById("products");


  if (!sortedList.length) {

    productBox.innerHTML =
      "<p>No products found.</p>";

    return;

  }


  productBox.innerHTML =
    sortedList.map(p => {

      const image =
        getProductImage(p);


      const mediaHTML = image

        ? `
          <img
            src="${image}"
            alt="${escapeHTML(p.name)}"
            style="
              width:100%;
              height:220px;
              object-fit:cover;
              border-radius:12px;
              display:block;
            "
            onerror="this.style.display='none'"
          >
        `

        : `
          <div
            style="
              height:220px;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:70px;
            "
          >
            ${p.icon}
          </div>
        `;


      const oldPrice =
        p.old

          ? `
            <span class="old">
              ৳${p.old.toLocaleString()}
            </span>
          `

          : "";


      return `

        <article
          class="card"
          onclick="openProduct('${p.id}')"
          style="cursor:pointer;"
        >

          <div class="pic">

            ${mediaHTML}

          </div>


          <div class="info">

            <span class="tag">
              ${escapeHTML(p.cat)}
            </span>


            <h3>
              ${escapeHTML(p.name)}
            </h3>


            <div class="price">

              ৳${p.price.toLocaleString()}

              ${oldPrice}

            </div>


            <button
              class="add"
              onclick="
                event.stopPropagation();
                addToCart('${p.id}')
              "
            >
              Add to Cart
            </button>


            <button
              style="
                margin-top:8px;
                width:100%;
                padding:10px;
                border:1px solid #ddd;
                border-radius:8px;
                background:white;
                cursor:pointer;
              "
              onclick="
                event.stopPropagation();
                openProduct('${p.id}')
              "
            >
              View Product
            </button>

          </div>

        </article>

      `;

    }).join("");

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(text) {

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// ==========================================
// PRODUCT DETAILS
// ==========================================

function openProduct(id) {

  const product =
    products.find(
      p => String(p.id) === String(id)
    );


  if (!product) return;


  let modal =
    document.getElementById(
      "productDetailsModal"
    );


  if (!modal) {

    modal =
      document.createElement("div");

    modal.id =
      "productDetailsModal";

    modal.style.cssText = `
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.75);
      display:none;
      align-items:center;
      justify-content:center;
      z-index:9999;
      padding:15px;
      overflow:auto;
    `;

    document.body.appendChild(modal);

  }


  const image =
    getProductImage(product);

  const video =
    getProductVideo(product);


  let mediaHTML = "";


  if (image) {

    mediaHTML += `

      <img
        src="${image}"
        alt="${escapeHTML(product.name)}"
        style="
          width:100%;
          max-height:400px;
          object-fit:contain;
          border-radius:12px;
          margin-bottom:12px;
          background:#f5f5f5;
        "
      >

    `;

  }


  if (video) {

    mediaHTML += `

      <video
        controls
        playsinline
        style="
          width:100%;
          max-height:400px;
          border-radius:12px;
          background:#000;
          margin-bottom:15px;
        "
      >

        <source
          src="${video}"
          type="video/mp4"
        >

        Your browser does not support video.

      </video>

    `;

  }


  if (!mediaHTML) {

    mediaHTML = `

      <div
        style="
          height:250px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:80px;
        "
      >
        ${product.icon}
      </div>

    `;

  }


  modal.innerHTML = `

    <div
      style="
        background:white;
        width:100%;
        max-width:600px;
        max-height:90vh;
        overflow:auto;
        border-radius:18px;
        padding:20px;
        position:relative;
      "
    >

      <button
        onclick="closeProduct()"
        style="
          position:absolute;
          right:12px;
          top:10px;
          width:35px;
          height:35px;
          border:0;
          border-radius:50%;
          background:#111;
          color:white;
          font-size:24px;
          cursor:pointer;
          z-index:5;
        "
      >
        ×
      </button>


      <div>

        ${mediaHTML}

      </div>


      <span
        class="tag"
      >
        ${escapeHTML(product.cat)}
      </span>


      <h2
        style="
          margin:10px 0;
        "
      >
        ${escapeHTML(product.name)}
      </h2>


      <div
        style="
          font-size:24px;
          font-weight:bold;
          margin:10px 0;
        "
      >
        ৳${product.price.toLocaleString()}

        ${
          product.old
            ? `
              <span
                class="old"
                style="
                  font-size:16px;
                  margin-left:8px;
                "
              >
                ৳${product.old.toLocaleString()}
              </span>
            `
            : ""
        }

      </div>


      <p
        style="
          line-height:1.6;
          color:#555;
        "
      >
        ${escapeHTML(product.description)}
      </p>


      <button
        class="add"
        style="
          width:100%;
          padding:14px;
          margin-top:10px;
        "
        onclick="
          addToCart('${product.id}');
          closeProduct();
        "
      >
        🛒 Add to Cart
      </button>

    </div>

  `;


  modal.style.display = "flex";

}


// ==========================================
// CLOSE PRODUCT
// ==========================================

function closeProduct() {

  const modal =
    document.getElementById(
      "productDetailsModal"
    );

  if (modal) {
    modal.style.display = "none";
  }

}


// ==========================================
// CATEGORY FILTER
// ==========================================

function filterProducts(cat) {

  if (cat === "all") {

    render(products);

    return;

  }


  render(
    products.filter(
      p => p.cat === cat
    )
  );

}


// ==========================================
// SEARCH
// ==========================================

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


// ==========================================
// CART
// ==========================================

function addToCart(id) {

  const product =
    products.find(
      p => String(p.id) === String(id)
    );


  if (!product) {

    alert("Product not found.");

    return;

  }


  cart.push(product);

  updateCart();

  alert("Added to cart!");

}


// ==========================================
// UPDATE CART
// ==========================================

function updateCart() {

  const count =
    document.getElementById("cartCount");


  if (count) {

    count.textContent =
      cart.length;

  }

}


// ==========================================
// OPEN CART
// ==========================================

function openCart() {

  const modal =
    document.getElementById(
      "cartModal"
    );


  modal.style.display =
    "flex";


  const items =
    document.getElementById(
      "cartItems"
    );


  if (!cart.length) {

    items.innerHTML =
      "Your cart is empty.";

  }

  else {

    items.innerHTML =

      cart.map((p, i) => `

        <div
          class="cart-row"
        >

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

      `).join("");

  }


  document.getElementById(
    "cartTotal"
  ).textContent =

    cart
      .reduce(
        (sum, p) =>
          sum + p.price,
        0
      )
      .toLocaleString();

}


// ==========================================
// REMOVE CART ITEM
// ==========================================

function removeItem(i) {

  cart.splice(i, 1);

  updateCart();

  openCart();

}


// ==========================================
// CLOSE CART
// ==========================================

function closeCart() {

  document.getElementById(
    "cartModal"
  ).style.display = "none";

}


// ==========================================
// CHECKOUT
// ==========================================

function showCheckout() {

  if (!cart.length) {

    alert(
      "Your cart is empty."
    );

    return;

  }


  closeCart();


  document.getElementById(
    "checkoutModal"
  ).style.display =
    "flex";

}


// ==========================================
// CLOSE CHECKOUT
// ==========================================

function closeCheckout() {

  document.getElementById(
    "checkoutModal"
  ).style.display =
    "none";

}


// ==========================================
// PLACE ORDER
// ==========================================

function placeOrder(e) {

  e.preventDefault();


  const customerName =
    document.getElementById(
      "name"
    ).value;


  const customerPhone =
    document.getElementById(
      "phone"
    ).value;


  const customerAddress =
    document.getElementById(
      "address"
    ).value;


  const paymentMethod =
    document.getElementById(
      "payment"
    ).value;


  const items =
    cart
      .map(p => p.name)
      .join(", ");


  const total =
    cart.reduce(
      (sum, p) =>
        sum + p.price,
      0
    );


  const msg =

    `3RD ZONE ORDER\n` +

    `Name: ${customerName}\n` +

    `Phone: ${customerPhone}\n` +

    `Address: ${customerAddress}\n` +

    `Payment: ${paymentMethod}\n` +

    `Items: ${items}\n` +

    `Total: ৳${total}`;


  const whatsappURL =

    `https://wa.me/${WHATSAPP_NUMBER}` +

    `?text=${encodeURIComponent(msg)}`;


  window.open(
    whatsappURL,
    "_blank"
  );


  cart = [];

  updateCart();

  closeCheckout();

}


// ==========================================
// CLOSE MODALS WHEN CLICKING OUTSIDE
// ==========================================

document.addEventListener(
  "click",
  function(e) {

    const productModal =
      document.getElementById(
        "productDetailsModal"
      );


    if (
      productModal &&
      e.target === productModal
    ) {

      closeProduct();

    }

  }
);


// ==========================================
// START WEBSITE
// ==========================================

loadProducts();
