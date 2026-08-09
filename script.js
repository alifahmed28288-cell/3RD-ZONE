// ===============================
// 3RD ZONE - SUPABASE PRODUCTS
// ===============================

const SUPABASE_URL = "https://oiuvprtyjajatubueoum.supabase.co";

// এখানে তোমার Supabase-এর ANON/PUBLIC KEY বসাবে
// SERVICE_ROLE KEY কখনো এখানে দেবে না।
const SUPABASE_ANON_KEY = "sb_publishable_i7FvSYVlb-gg73oLQyFMCg_fyfcg5pU";

let products = [];
let cart = [];


// ===============================
// LOAD PRODUCTS FROM SUPABASE
// ===============================

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
      throw new Error("Failed to load products");
    }

    const data = await response.json();

    products = data.map(p => ({
      id: p.id,
      name: p.name,
      cat: p.category || "Other",
      price: Number(p.price || 0),
      old: Number(p.old_price || 0),
      icon: getIcon(p.category)
    }));

    render();

  } catch (error) {
    console.error(error);

    box.innerHTML = `
      <p>
        Unable to load products.
        Please refresh the page.
      </p>
    `;
  }
}


// ===============================
// PRODUCT ICON
// ===============================

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


// ===============================
// RENDER PRODUCTS
// ===============================

function render(list = products) {

  let sortedList = [...list];

  const sort = document.getElementById("sort").value;

  if (sort === "low") {
    sortedList.sort((a, b) => a.price - b.price);
  }

  if (sort === "high") {
    sortedList.sort((a, b) => b.price - a.price);
  }

  const productBox = document.getElementById("products");

  if (!sortedList.length) {
    productBox.innerHTML = "<p>No products found.</p>";
    return;
  }

  productBox.innerHTML = sortedList.map(p => {

    const oldPrice = p.old
      ? `<span class="old">৳${p.old.toLocaleString()}</span>`
      : "";

    return `
      <article class="card">

        <div class="pic">
          ${p.icon}
        </div>

        <div class="info">

          <span class="tag">
            ${p.cat}
          </span>

          <h3>
            ${p.name}
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


// ===============================
// CATEGORY FILTER
// ===============================

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


// ===============================
// SEARCH
// ===============================

function searchProducts() {

  const q = document
    .getElementById("search")
    .value
    .toLowerCase();

  render(
    products.filter(p =>
      (p.name + " " + p.cat)
        .toLowerCase()
        .includes(q)
    )
  );
}


// ===============================
// CART
// ===============================

function addToCart(id) {

  const product = products.find(
    p => String(p.id) === String(id)
  );

  if (!product) return;

  cart.push(product);

  updateCart();

  alert("Added to cart!");
}


function updateCart() {

  document.getElementById("cartCount").textContent =
    cart.length;
}


function openCart() {

  document.getElementById("cartModal").style.display = "flex";

  document.getElementById("cartItems").innerHTML =
    cart.length

      ? cart.map((p, i) => `
          <div class="cart-row">

            <span>
              ${p.icon} ${p.name}
            </span>

            <b>
              ৳${p.price.toLocaleString()}

              <button
                onclick="removeItem(${i})">
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

  document.getElementById("cartModal").style.display =
    "none";
}


// ===============================
// CHECKOUT
// ===============================

function showCheckout() {

  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  closeCart();

  document.getElementById("checkoutModal").style.display =
    "flex";
}


function closeCheckout() {

  document.getElementById("checkoutModal").style.display =
    "none";
}


// ===============================
// PLACE ORDER
// ===============================

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
    cart.map(p => p.name).join(", ");

  const total =
    cart.reduce(
      (sum, p) => sum + p.price,
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

  alert(
    "Order information prepared!"
  );

  const whatsappNumber = "8801XXXXXXXXX";

  window.open(
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`,
    "_blank"
  );

  cart = [];

  updateCart();

  closeCheckout();
}


// ===============================
// START
// ===============================

loadProducts();
