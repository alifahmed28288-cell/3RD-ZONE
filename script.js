// ======================================================
// 3RD ZONE - PRODUCTS + MEDIA + DETAILS + CART
// ======================================================

const SUPABASE_URL =
  "https://oiuvprtyjajatubueoum.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_i7FvSYVlb-gg73oLQyFMCg_fyfcg5pU";

const WHATSAPP_NUMBER =
  "8801404610359";

let products = [];
let cart = [];


// ======================================================
// SUPABASE REQUEST
// ======================================================

async function supabaseFetch(url) {

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}


// ======================================================
// LOAD PRODUCTS + MEDIA
// ======================================================

async function loadProducts() {

  const box =
    document.getElementById("products");

  box.innerHTML =
    "<p>Loading products...</p>";

  try {

    const productData =
      await supabaseFetch(
        `${SUPABASE_URL}/rest/v1/products?select=*&active=eq.true&order=created_at.desc`
      );


    products =
      await Promise.all(

        productData.map(
          async function (product) {

            let media = [];

            try {

              media =
                await supabaseFetch(
                  `${SUPABASE_URL}/rest/v1/product_media?select=id,product_id,media_type,media_url,sort_order&product_id=eq.${product.id}&order=sort_order.asc`
                );

            } catch (error) {

              console.error(
                "Media error:",
                error
              );

            }


            return {

              id: product.id,

              name:
                product.name ||
                "Unnamed Product",

              cat:
                product.category ||
                "Other",

              price:
                Number(product.price || 0),

              old:
                Number(product.old_price || 0),

              description:
                product.description ||
                "Premium quality product from 3RD ZONE.",

              media: media

            };

          }
        )

      );


    console.log(
      "PRODUCTS:",
      products
    );


    render(products);


  } catch (error) {

    console.error(
      "PRODUCT LOAD ERROR:",
      error
    );


    box.innerHTML = `
      <div style="padding:20px;text-align:center;">
        <h3>Products could not be loaded.</h3>
        <p>Please refresh the website.</p>
      </div>
    `;

  }

}


// ======================================================
// GET IMAGE
// ======================================================

function getImage(product) {

  if (
    !product.media ||
    !product.media.length
  ) {
    return "";
  }


  const image =
    product.media.find(
      function (m) {

        return (
          String(m.media_type)
            .toLowerCase()
            === "image"
        );

      }
    );


  return image
    ? image.media_url
    : "";

}


// ======================================================
// GET VIDEO
// ======================================================

function getVideo(product) {

  if (
    !product.media ||
    !product.media.length
  ) {
    return "";
  }


  const video =
    product.media.find(
      function (m) {

        return (
          String(m.media_type)
            .toLowerCase()
            === "video"
        );

      }
    );


  return video
    ? video.media_url
    : "";

}


// ======================================================
// PRODUCT ICON
// ======================================================

function getIcon(category) {

  if (!category) return "📦";

  const c =
    String(category).toLowerCase();


  if (c.includes("power"))
    return "🔋";

  if (c.includes("tws"))
    return "🎧";

  if (c.includes("airpods"))
    return "🎧";

  if (c.includes("cooler"))
    return "❄️";

  if (c.includes("charger"))
    return "🔌";

  if (c.includes("cable"))
    return "🔗";

  if (c.includes("gaming"))
    return "🎮";

  if (c.includes("speaker"))
    return "🔊";


  return "📦";

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHTML(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// ======================================================
// RENDER PRODUCTS
// ======================================================

function render(list = products) {

  const box =
    document.getElementById("products");

  if (!box) return;


  let sorted =
    [...list];


  const sort =
    document.getElementById("sort");


  if (
    sort &&
    sort.value === "low"
  ) {

    sorted.sort(
      (a, b) =>
        a.price - b.price
    );

  }


  if (
    sort &&
    sort.value === "high"
  ) {

    sorted.sort(
      (a, b) =>
        b.price - a.price
    );

  }


  if (!sorted.length) {

    box.innerHTML =
      "<p>No products found.</p>";

    return;

  }


  box.innerHTML =
    sorted.map(
      function (product) {

        const image =
          getImage(product);


        let mediaHTML;


        if (image) {

          mediaHTML = `
            <img
              src="${image}"
              alt="${escapeHTML(product.name)}"
              style="
                width:100%;
                height:220px;
                object-fit:cover;
                border-radius:12px;
                display:block;
              "
            >
          `;

        } else {

          mediaHTML = `
            <div style="
              height:220px;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:70px;
            ">
              ${getIcon(product.cat)}
            </div>
          `;

        }


        const oldPrice =
          product.old > 0
            ? `
              <span class="old">
                ৳${product.old.toLocaleString()}
              </span>
            `
            : "";


        return `
          <article
            class="card"
            onclick="openProduct('${product.id}')"
            style="cursor:pointer;"
          >

            <div class="pic">
              ${mediaHTML}
            </div>


            <div class="info">

              <span class="tag">
                ${escapeHTML(product.cat)}
              </span>


              <h3>
                ${escapeHTML(product.name)}
              </h3>


              <div class="price">
                ৳${product.price.toLocaleString()}
                ${oldPrice}
              </div>


              <button
                class="add"
                onclick="
                  event.stopPropagation();
                  addToCart('${product.id}');
                "
              >
                Add to Cart
              </button>

            </div>

          </article>
        `;

      }
    ).join("");

}


// ======================================================
// OPEN PRODUCT DETAILS
// ======================================================

function openProduct(id) {

  const product =
    products.find(
      function (p) {

        return String(p.id) ===
          String(id);

      }
    );


  if (!product) {

    alert("Product not found.");

    return;

  }


  const image =
    getImage(product);

  const video =
    getVideo(product);


  let media = "";


  if (image) {

    media += `
      <img
        src="${image}"
        alt="${escapeHTML(product.name)}"
        style="
          width:100%;
          max-height:400px;
          object-fit:contain;
          border-radius:12px;
          margin-bottom:15px;
          background:#f5f5f5;
        "
      >
    `;

  }


  if (video) {

    media += `
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
      </video>
    `;

  }


  if (!media) {

    media = `
      <div style="
        height:250px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:80px;
      ">
        ${getIcon(product.cat)}
      </div>
    `;

  }


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
      z-index:99999;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:15px;
      overflow:auto;
    `;

    document.body.appendChild(
      modal
    );

  }


  modal.innerHTML = `

    <div style="
      background:#fff;
      width:100%;
      max-width:600px;
      max-height:90vh;
      overflow:auto;
      border-radius:18px;
      padding:20px;
      position:relative;
    ">

      <button
        onclick="closeProduct()"
        style="
          position:absolute;
          right:12px;
          top:12px;
          width:38px;
          height:38px;
          border:0;
          border-radius:50%;
          background:#111;
          color:#fff;
          font-size:25px;
          cursor:pointer;
          z-index:2;
        "
      >
        ×
      </button>


      ${media}


      <span class="tag">
        ${escapeHTML(product.cat)}
      </span>


      <h2>
        ${escapeHTML(product.name)}
      </h2>


      <div
        class="price"
        style="
          font-size:24px;
          font-weight:bold;
          margin:12px 0;
        "
      >
        ৳${product.price.toLocaleString()}
      </div>


      <p style="
        line-height:1.6;
        color:#555;
      ">
        ${escapeHTML(product.description)}
      </p>


      <button
        class="add"
        style="
          width:100%;
          padding:14px;
          margin-top:15px;
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


  modal.style.display =
    "flex";

}


// ======================================================
// CLOSE PRODUCT
// ======================================================

function closeProduct() {

  const modal =
    document.getElementById(
      "productDetailsModal"
    );


  if (modal) {

    modal.remove();

  }

}


// ======================================================
// CATEGORY
// ======================================================

function filterProducts(category) {

  if (category === "all") {

    render(products);

    return;

  }


  render(
    products.filter(
      function (p) {

        return p.cat ===
          category;

      }
    )
  );

}


// ======================================================
// SEARCH
// ======================================================

function searchProducts() {

  const input =
    document.getElementById(
      "search"
    );


  const query =
    input.value
      .toLowerCase()
      .trim();


  if (!query) {

    render(products);

    return;

  }


  render(
    products.filter(
      function (p) {

        return (
          p.name
            .toLowerCase()
            .includes(query) ||

          p.cat
            .toLowerCase()
            .includes(query)
        );

      }
    )
  );

}


// ======================================================
// CART
// ======================================================

function addToCart(id) {

  const product =
    products.find(
      function (p) {

        return String(p.id) ===
          String(id);

      }
    );


  if (!product) {

    alert("Product not found.");

    return;

  }


  cart.push(product);

  updateCart();

  alert(
    "Added to cart!"
  );

}


function updateCart() {

  const count =
    document.getElementById(
      "cartCount"
    );


  if (count) {

    count.textContent =
      cart.length;

  }

}


function openCart() {

  const modal =
    document.getElementById(
      "cartModal"
    );


  if (!modal) return;


  modal.style.display =
    "flex";


  const items =
    document.getElementById(
      "cartItems"
    );


  if (!cart.length) {

    items.innerHTML =
      "Your cart is empty.";

  } else {

    items.innerHTML =
      cart.map(
        function (p, i) {

          return `
            <div class="cart-row">

              <span>
                ${getIcon(p.cat)}
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
          `;

        }
      ).join("");

  }


  const total =
    cart.reduce(
      function (sum, p) {

        return sum + p.price;

      },
      0
    );


  document.getElementById(
    "cartTotal"
  ).textContent =
    total.toLocaleString();

}


function removeItem(index) {

  cart.splice(
    index,
    1
  );

  updateCart();

  openCart();

}


function closeCart() {

  const modal =
    document.getElementById(
      "cartModal"
    );


  if (modal) {

    modal.style.display =
      "none";

  }

}


// ======================================================
// CHECKOUT
// ======================================================

function showCheckout() {

  if (!cart.length) {

    alert(
      "Your cart is empty."
    );

    return;

  }


  closeCart();


  const modal =
    document.getElementById(
      "checkoutModal"
    );


  if (modal) {

    modal.style.display =
      "flex";

  }

}


function closeCheckout() {

  const modal =
    document.getElementById(
      "checkoutModal"
    );


  if (modal) {

    modal.style.display =
      "none";

  }

}


// ======================================================
// WHATSAPP ORDER
// ======================================================

function placeOrder(event) {

  event.preventDefault();


  const name =
    document.getElementById(
      "name"
    ).value;


  const phone =
    document.getElementById(
      "phone"
    ).value;


  const address =
    document.getElementById(
      "address"
    ).value;


  const payment =
    document.getElementById(
      "payment"
    ).value;


  const items =
    cart.map(
      p => p.name
    ).join(", ");


  const total =
    cart.reduce(
      (sum, p) =>
        sum + p.price,
      0
    );


  const message =
`3RD ZONE ORDER

Name: ${name}

Phone: ${phone}

Address: ${address}

Payment: ${payment}

Items: ${items}

Total: ৳${total}`;


  const url =
    `https://wa.me/${WHATSAPP_NUMBER}` +
    `?text=${encodeURIComponent(message)}`;


  window.open(
    url,
    "_blank"
  );


  cart = [];

  updateCart();

  closeCheckout();

}


// ======================================================
// SORT
// ======================================================

const sortElement =
  document.getElementById(
    "sort"
  );


if (sortElement) {

  sortElement.addEventListener(
    "change",
    function () {

      render();

    }
  );

}


// ======================================================
// START
// ======================================================

loadProducts();
