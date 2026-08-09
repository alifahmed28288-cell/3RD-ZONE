// ======================================================
// 3RD ZONE - MAIN WEBSITE
// Supabase Product System
// ======================================================

const SUPABASE_URL = "https://oiuvprtyjajatubueoum.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_i7FvSYVlb-gg73oLQyFMCg_fyfcg5pU";

let products = [];
let cart = [];


// ======================================================
// LOAD PRODUCTS FROM SUPABASE
// ======================================================

async function loadProducts() {

  const box = document.getElementById("products");

  box.innerHTML = "<p>Loading products...</p>";

  try {

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=*&active=eq.true&order=created_at.desc`,
      {
        method: "GET",
        headers: {
          "apikey": SUPABASE_ANON_KEY
        }
      }
    );

    if (!response.ok) {

      const errorText = await response.text();

      throw new Error(errorText);
    }

    const data = await response.json();

    console.log("Supabase Products:", data);

    products = data.map(function (p) {

      return {
        id: p.id,
        name: p.name || "Unnamed Product",
        cat: p.category || "Other",
        price: Number(p.price || 0),
        old: Number(p.old_price || 0),
        icon: getIcon(p.category)
      };

    });

    render();

  } catch (error) {

    console.error("Supabase Error:", error);

    box.innerHTML = `
      <p>
        Unable to load products.
        Please refresh the page.
      </p>
    `;
  }
}


// ======================================================
// PRODUCT ICON
// ======================================================

function getIcon(category) {

  if (!category) {
    return "📦";
  }

  const cat = String(category).toLowerCase();

  if (cat.includes("power")) {
    return "🔋";
  }

  if (cat.includes("tws")) {
    return "🎧";
  }

  if (cat.includes("airpods")) {
    return "🎧";
  }

  if (cat.includes("cooler")) {
    return "❄️";
  }

  if (cat.includes("charger")) {
    return "🔌";
  }

  if (cat.includes("cable")) {
    return "🔗";
  }

  if (cat.includes("gaming")) {
    return "🎮";
  }

  if (cat.includes("speaker")) {
    return "🔊";
  }

  return "📦";
}


// ======================================================
// RENDER PRODUCTS
// ======================================================

function render(list = products) {

  const productBox =
    document.getElementById("products");

  if (!productBox) {
    return;
  }

  let sortedList = [...list];

  const sortElement =
    document.getElementById("sort");

  const sort =
    sortElement ? sortElement.value : "default";


  if (sort === "low") {

    sortedList.sort(function (a, b) {

      return a.price - b.price;

    });

  }


  if (sort === "high") {

    sortedList.sort(function (a, b) {

      return b.price - a.price;

    });

  }


  if (!sortedList.length) {

    productBox.innerHTML = `
      <p>No products found.</p>
    `;

    return;
  }


  productBox.innerHTML = sortedList.map(function (p) {

    let oldPrice = "";

    if (p.old > 0) {

      oldPrice = `
        <span class="old">
          ৳${p.old.toLocaleString()}
        </span>
      `;

    }


    return `
      <article class="card">

        <div class="pic">
          ${p.icon}
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
            onclick="addToCart('${p.id}')">

            Add to Cart

          </button>

        </div>

      </article>
    `;

  }).join("");
}


// ======================================================
// HTML SECURITY
// ======================================================

function escapeHTML(text) {

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ======================================================
// CATEGORY FILTER
// ======================================================

function filterProducts(category) {

  if (category === "all") {

    render(products);

    return;
  }


  const filtered =
    products.filter(function (p) {

      return p.cat === category;

    });


  render(filtered);
}


// ======================================================
// SEARCH
// ======================================================

function searchProducts() {

  const searchBox =
    document.getElementById("search");

  if (!searchBox) {
    return;
  }

  const query =
    searchBox.value.toLowerCase().trim();


  if (!query) {

    render(products);

    return;
  }


  const filtered =
    products.filter(function (p) {

      return (
        String(p.name).toLowerCase().includes(query) ||
        String(p.cat).toLowerCase().includes(query)
      );

    });


  render(filtered);
}


// ======================================================
// CART - ADD
// ======================================================

function addToCart(id) {

  const product =
    products.find(function (p) {

      return String(p.id) === String(id);

    });


  if (!product) {

    alert("Product not found.");

    return;
  }


  cart.push(product);

  updateCart();

  alert("Added to cart!");
}


// ======================================================
// UPDATE CART
// ======================================================

function updateCart() {

  const count =
    document.getElementById("cartCount");

  if (count) {

    count.textContent =
      cart.length;

  }
}


// ======================================================
// OPEN CART
// ======================================================

function openCart() {

  const modal =
    document.getElementById("cartModal");

  if (!modal) {
    return;
  }


  modal.style.display = "flex";


  const cartItems =
    document.getElementById("cartItems");


  if (!cart.length) {

    cartItems.innerHTML =
      "Your cart is empty.";

  } else {

    cartItems.innerHTML =
      cart.map(function (p, i) {

        return `
          <div class="cart-row">

            <span>

              ${p.icon}
              ${escapeHTML(p.name)}

            </span>

            <b>

              ৳${p.price.toLocaleString()}

              <button
                onclick="removeItem(${i})">

                ×

              </button>

            </b>

          </div>
        `;

      }).join("");

  }


  const total =
    cart.reduce(function (sum, p) {

      return sum + p.price;

    }, 0);


  document.getElementById("cartTotal").textContent =
    total.toLocaleString();
}


// ======================================================
// REMOVE CART ITEM
// ======================================================

function removeItem(index) {

  cart.splice(index, 1);

  updateCart();

  openCart();
}


// ======================================================
// CLOSE CART
// ======================================================

function closeCart() {

  const modal =
    document.getElementById("cartModal");

  if (modal) {

    modal.style.display = "none";

  }
}


// ======================================================
// SHOW CHECKOUT
// ======================================================

function showCheckout() {

  if (!cart.length) {

    alert("Your cart is empty.");

    return;
  }


  closeCart();


  const modal =
    document.getElementById("checkoutModal");


  if (modal) {

    modal.style.display = "flex";

  }
}


// ======================================================
// CLOSE CHECKOUT
// ======================================================

function closeCheckout() {

  const modal =
    document.getElementById("checkoutModal");


  if (modal) {

    modal.style.display = "none";

  }
}


// ======================================================
// PLACE ORDER
// ======================================================

function placeOrder(event) {

  event.preventDefault();


  const customerName =
    document.getElementById("name").value;


  const customerPhone =
    document.getElementById("phone").value;


  const customerAddress =
    document.getElementById("address").value;


  const paymentMethod =
    document.getElementById("payment").value;


  const items =
    cart.map(function (p) {

      return p.name;

    }).join(", ");


  const total =
    cart.reduce(function (sum, p) {

      return sum + p.price;

    }, 0);


  const message =
`3RD ZONE ORDER

Name: ${customerName}

Phone: ${customerPhone}

Address: ${customerAddress}

Payment: ${paymentMethod}

Items: ${items}

Total: ৳${total}`;


  // ====================================================
  // WHATSAPP NUMBER
  // ====================================================

  const whatsappNumber = "8801404610359";


  const whatsappURL =
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;


  window.open(
    whatsappURL,
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
  document.getElementById("sort");


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
