const api = "/api";
const money = value => Number(value).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
let products=[], categories=[], cart=JSON.parse(localStorage.getItem("cart")||"[]");
let adminKey=sessionStorage.getItem("adminKey")||"";

const $=selector=>document.querySelector(selector);
const toast=message=>{ $("#toast").textContent=message;$("#toast").classList.add("show");setTimeout(()=>$("#toast").classList.remove("show"),2600); };
async function request(url,options={}){
  const response=await fetch(api+url,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});
  const data=response.status===204?null:await response.json();
  if(!response.ok) throw new Error(data?.error||"Não foi possível realizar a operação.");
  return data;
}
function go(page){
  document.querySelectorAll(".page").forEach(el=>el.classList.toggle("active",el.id===page));
  if(page==="cart") renderCart();
  if(page==="admin"&&adminKey) loadAdmin();
  scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll("[data-page]").forEach(el=>el.onclick=e=>{e.preventDefault();go(el.dataset.page)});

async function loadStore(){
  [products,categories]=await Promise.all([request("/products"),request("/categories")]);
  const options=categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
  $("#category-filter").insertAdjacentHTML("beforeend",options);
  $("#product-category").innerHTML='<option value="">Sem categoria</option>'+options;
  renderProducts();
}
function renderProducts(){
  const term=$("#search").value.toLowerCase(),category=$("#category-filter").value;
  const filtered=products.filter(p=>(p.name+" "+p.description).toLowerCase().includes(term)&&(!category||String(p.category_id)===category));
  $("#products").innerHTML=filtered.length?filtered.map(p=>`<article class="product">
    <img src="${p.image_url||"https://placehold.co/700x450?text=Produto"}" alt="${p.name}">
    <div class="product-body"><span class="muted">${p.category_name||"Geral"}</span><h3>${p.name}</h3>
    <p>${p.description}</p><div class="product-footer"><div><div class="price">${money(p.price)}</div>
    <small>${p.stock} em estoque</small></div><button class="primary" onclick="addCart(${p.id})" ${p.stock?"":"disabled"}>Adicionar</button></div></div></article>`).join(""):"<p>Nenhum produto encontrado.</p>";
}
$("#search").oninput=renderProducts;$("#category-filter").onchange=renderProducts;

window.addCart=id=>{
  const product=products.find(p=>p.id===id),existing=cart.find(i=>i.product_id===id);
  if(existing){if(existing.quantity>=product.stock)return toast("Limite do estoque atingido.");existing.quantity++}
  else cart.push({product_id:id,quantity:1,name:product.name,price:product.price,stock:product.stock});
  saveCart();toast("Produto adicionado ao carrinho.");
};
function saveCart(){localStorage.setItem("cart",JSON.stringify(cart));$("#cart-count").textContent=cart.reduce((s,i)=>s+i.quantity,0)}
window.changeQuantity=(id,value)=>{const item=cart.find(i=>i.product_id===id);item.quantity=Math.max(1,Math.min(Number(value),item.stock));saveCart();renderCart()};
window.removeCart=id=>{cart=cart.filter(i=>i.product_id!==id);saveCart();renderCart()};
function renderCart(){
  $("#cart-items").innerHTML=cart.length?cart.map(i=>`<div class="cart-row"><div><b>${i.name}</b><div class="muted">${money(i.price)}</div></div><input type="number" min="1" max="${i.stock}" value="${i.quantity}" onchange="changeQuantity(${i.product_id},this.value)"><button class="danger" onclick="removeCart(${i.product_id})">Remover</button></div>`).join(""):"<p>Seu carrinho está vazio.</p>";
  $("#cart-total").textContent=money(cart.reduce((s,i)=>s+i.price*i.quantity,0));
}
$("#checkout-form").onsubmit=async e=>{
  e.preventDefault();if(!cart.length)return toast("Adicione produtos ao carrinho.");
  const customer=Object.fromEntries(new FormData(e.target));
  try{const sale=await request("/sales",{method:"POST",body:JSON.stringify({customer,items:cart.map(({product_id,quantity})=>({product_id,quantity}))})});
    toast(`Compra nº ${sale.id} registrada!`);cart=[];saveCart();e.target.reset();await loadStore();go("orders");$("#orders-email").value=customer.email;loadOrders(customer.email);
  }catch(error){toast(error.message)}
};
$("#orders-form").onsubmit=e=>{e.preventDefault();loadOrders($("#orders-email").value)};
async function loadOrders(email){
  try{const sales=await request("/sales?email="+encodeURIComponent(email));
    $("#orders-list").innerHTML=sales.length?sales.map(orderCard).join(""):"<div class='panel'>Nenhuma compra encontrada.</div>";
  }catch(error){toast(error.message)}
}
function orderCard(s){return `<article class="order"><div class="order-head"><div><b>Pedido #${s.id}</b><div class="muted">${new Date(s.created_at+"Z").toLocaleString("pt-BR")}</div></div><span class="badge">${s.status}</span></div>
  ${s.items.map(i=>`<p>${i.quantity}x ${i.name} — ${money(i.quantity*i.unit_price)}</p>`).join("")}<strong>Total: ${money(s.total)}</strong></article>`}

$("#admin-enter").onclick=async()=>{adminKey=$("#admin-key").value;try{await request("/products?all=1",{headers:{"x-admin-key":adminKey}});sessionStorage.setItem("adminKey",adminKey);loadAdmin()}catch(e){adminKey="";toast(e.message)}};
$("#admin-exit").onclick=()=>{adminKey="";sessionStorage.removeItem("adminKey");$("#admin-area").hidden=true;$("#admin-login").hidden=false};
async function loadAdmin(){
  try{
    const [allProducts,sales]=await Promise.all([request("/products?all=1",{headers:{"x-admin-key":adminKey}}),request("/sales",{headers:{"x-admin-key":adminKey}})]);
    $("#admin-login").hidden=true;$("#admin-area").hidden=false;
    $("#stat-products").textContent=allProducts.filter(p=>p.active).length;$("#stat-sales").textContent=sales.length;$("#stat-revenue").textContent=money(sales.reduce((s,v)=>s+v.total,0));
    $("#admin-products").innerHTML=allProducts.map(p=>`<div class="admin-row"><div><b>${p.name}</b><div class="muted">${money(p.price)} · estoque ${p.stock} · ${p.active?"ativo":"inativo"}</div></div><div><button onclick='editProduct(${JSON.stringify(p)})'>Editar</button> ${p.active?`<button class="danger" onclick="disableProduct(${p.id})">Desativar</button>`:""}</div></div>`).join("");
    $("#admin-sales").innerHTML=sales.length?sales.map(s=>`<div class="admin-row"><div><b>#${s.id} · ${s.customer_name}</b><div class="muted">${s.email} · ${money(s.total)}</div></div><select onchange="changeStatus(${s.id},this.value)">${["Confirmada","Em preparação","Enviada","Concluída","Cancelada"].map(v=>`<option ${v===s.status?"selected":""}>${v}</option>`).join("")}</select></div>`).join(""):"Nenhuma venda.";
  }catch(e){$("#admin-exit").click();toast(e.message)}
}
window.editProduct=p=>{const f=$("#product-form");Object.keys(p).forEach(k=>{if(f.elements[k])f.elements[k].value=p[k]??""});$("#product-title").textContent="Editar produto";f.scrollIntoView({behavior:"smooth"})};
$("#cancel-edit").onclick=()=>{$("#product-form").reset();$("#product-form").elements.id.value="";$("#product-title").textContent="Cadastrar produto"};
$("#product-form").onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));const id=data.id;delete data.id;data.price=Number(data.price);data.stock=Number(data.stock);data.category_id=data.category_id?Number(data.category_id):null;data.active=1;
  try{await request(id?"/products/"+id:"/products",{method:id?"PUT":"POST",headers:{"x-admin-key":adminKey},body:JSON.stringify(data)});toast("Produto salvo.");$("#cancel-edit").click();await loadStore();loadAdmin()}catch(error){toast(error.message)}
};
window.disableProduct=async id=>{if(!confirm("Deseja desativar este produto?"))return;try{await request("/products/"+id,{method:"DELETE",headers:{"x-admin-key":adminKey}});toast("Produto desativado.");await loadStore();loadAdmin()}catch(e){toast(e.message)}};
window.changeStatus=async(id,status)=>{try{await request("/sales/"+id+"/status",{method:"PATCH",headers:{"x-admin-key":adminKey},body:JSON.stringify({status})});toast("Status atualizado.")}catch(e){toast(e.message)}};

saveCart();loadStore().catch(e=>toast("Não foi possível conectar à API: "+e.message));
