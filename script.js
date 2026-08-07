const products=[
{id:1,name:"20,000mAh Fast Power Bank",cat:"Power Bank",price:1490,old:1790,icon:"🔋"},
{id:2,name:"Wireless TWS Earbuds Pro",cat:"TWS",price:990,old:1290,icon:"🎧"},
{id:3,name:"RGB Magnetic Phone Cooler",cat:"Phone Cooler",price:850,old:1050,icon:"❄️"},
{id:4,name:"20W Fast Charger",cat:"Charger",price:650,old:790,icon:"🔌"},
{id:5,name:"Braided Type-C Fast Cable",cat:"Charger",price:290,old:390,icon:"🔗"},
{id:6,name:"Mobile Gaming Trigger",cat:"Gaming",price:450,old:550,icon:"🎮"},
{id:7,name:"Mini Wireless Speaker",cat:"Gaming",price:750,old:950,icon:"🔊"},
{id:8,name:"Phone Stand for Gaming",cat:"Gaming",price:390,old:490,icon:"📱"}
];
let cart=[];
function render(list=products){let s=document.getElementById("sort").value;if(s==="low")list=[...list].sort((a,b)=>a.price-b.price);if(s==="high")list=[...list].sort((a,b)=>b.price-a.price);document.getElementById("products").innerHTML=list.map(p=>`<article class="card"><div class="pic">${p.icon}</div><div class="info"><span class="tag">${p.cat}</span><h3>${p.name}</h3><div class="price">৳${p.price.toLocaleString()} <span class="old">৳${p.old.toLocaleString()}</span></div><button class="add" onclick="addToCart(${p.id})">Add to Cart</button></div></article>`).join("")}
function filterProducts(cat){render(cat==="all"?products:products.filter(p=>p.cat===cat))}
function searchProducts(){let q=document.getElementById("search").value.toLowerCase();render(products.filter(p=>(p.name+" "+p.cat).toLowerCase().includes(q)))}
function addToCart(id){cart.push(products.find(p=>p.id===id));updateCart();alert("Added to cart!")}
function updateCart(){document.getElementById("cartCount").textContent=cart.length}
function openCart(){document.getElementById("cartModal").style.display="flex";document.getElementById("cartItems").innerHTML=cart.length?cart.map((p,i)=>`<div class="cart-row"><span>${p.icon} ${p.name}</span><b>৳${p.price.toLocaleString()} <button onclick="removeItem(${i})">×</button></b></div>`).join(""):"<p>Your cart is empty.</p>";document.getElementById("cartTotal").textContent=cart.reduce((s,p)=>s+p.price,0).toLocaleString()}
function removeItem(i){cart.splice(i,1);updateCart();openCart()}
function closeCart(){document.getElementById("cartModal").style.display="none"}
function showCheckout(){if(!cart.length)return alert("Your cart is empty.");closeCart();document.getElementById("checkoutModal").style.display="flex"}
function closeCheckout(){document.getElementById("checkoutModal").style.display="none"}
function placeOrder(e){e.preventDefault();let items=cart.map(p=>p.name).join(", ");let total=cart.reduce((s,p)=>s+p.price,0);let msg=`3RD ZONE ORDER%0AName: ${name.value}%0APhone: ${phone.value}%0AAddress: ${address.value}%0APayment: ${payment.value}%0AItems: ${items}%0ATotal: ৳${total}`;alert("Order information prepared! Replace the WhatsApp number in script.js to send directly.");window.open("https://wa.me/8801XXXXXXXXX?text="+msg,"_blank");cart=[];updateCart();closeCheckout()}
render();