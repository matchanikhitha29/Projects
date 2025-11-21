const {useState, useEffect, useMemo} = React;

/* Mini E-commerce frontend (no backend)
   Features:
   - Product listing (from embedded JSON)
   - Search, category filter, sort by price/rating
   - Add to cart, remove, quantity update
   - Cart persisted to localStorage
   - Simple checkout simulation (form validation + empty cart)
*/

function useLocalStorage(key, initial){
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch(e){
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch(e){}
  }, [key, state]);
  return [state, setState];
}

function formatPrice(n){ return "₹" + n.toFixed(2); }

function App(){
  const raw = document.getElementById("products-data").textContent;
  const products = JSON.parse(raw);
  const categories = ["All", ...Array.from(new Set(products.map(p=>p.category)))];

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [cart, setCart] = useLocalStorage("mini_ecom_cart_v1", []);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);

  const filtered = useMemo(() => {
    let res = products.filter(p => {
      if (category !== "All" && p.category !== category) return false;
      if (query){
        const q = query.toLowerCase();
        return (p.title + " " + p.desc + " " + p.category).toLowerCase().includes(q);
      }
      return true;
    });
    if (sortBy === "price-asc") res.sort((a,b)=>a.price-b.price);
    if (sortBy === "price-desc") res.sort((a,b)=>b.price-a.price);
    if (sortBy === "rating") res.sort((a,b)=>b.rating-b.rating);
    return res;
  }, [products, category, query, sortBy]);

  const addToCart = (p) => {
    setCart(prev => {
      const found = prev.find(x=>x.id===p.id);
      if (found) return prev.map(x=> x.id===p.id ? {...x, qty: x.qty+1} : x);
      return [{...p, qty:1}, ...prev];
    });
    setShowCart(true);
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.flatMap(item => {
      if (item.id !== id) return item;
      const qty = item.qty + delta;
      if (qty <= 0) return [];
      return [{...item, qty}];
    }));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(x=>x.id!==id));
  const clearCart = () => setCart([]);
  const subtotal = cart.reduce((s,i)=>s + i.price * i.qty, 0);

  const placeOrder = (form) => {
    // basic validation
    if (!form.name || !form.address || !form.email) {
      alert("Please fill name, address and email.");
      return;
    }
    const order = { id: "ORD" + Date.now(), name: form.name, email: form.email, total: subtotal, items: cart, date: new Date().toISOString() };
    setOrderPlaced(order);
    clearCart();
    setShowCheckout(false);
    setShowCart(false);
  };

  return (
    <div className="container" role="application">
      <header className="header" aria-label="Store header">
        <div className="brand">
          <div className="logo">E</div>
          <div>
            <div style={{fontWeight:700}}>Mini Store</div>
            <div className="small">Demo e‑commerce frontend</div>
          </div>
        </div>

        <div className="search-row">
          <input className="search" placeholder="Search products..." value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search products"/>
          <button className="cart-btn cart" onClick={()=>setShowCart(s=>!s)} aria-expanded={showCart}>
            Cart
            {cart.length>0 && <span className="cart-count" aria-hidden="true">{cart.reduce((s,i)=>s+i.qty,0)}</span>}
          </button>
        </div>
      </header>

      <main className="main">
        <aside className="sidebar" aria-label="Filters">
          <h3 style={{marginTop:0}}>Filters</h3>
          <div className="filters">
            <label>
              Category
              <select value={category} onChange={e=>setCategory(e.target.value)} style={{width:"100%",marginTop:6,padding:8,borderRadius:8,border:"1px solid #eef2ff"}}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label style={{marginTop:8}}>
              Sort by
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{width:"100%",marginTop:6,padding:8,borderRadius:8,border:"1px solid #eef2ff"}}>
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low → high</option>
                <option value="price-desc">Price: high → low</option>
                <option value="rating">Top rated</option>
              </select>
            </label>
          </div>

          <div style={{marginTop:12}}>
            <h4 style={{marginBottom:6}}>About</h4>
            <div className="small">This is a frontend-only demo. No real payments — checkout simulates order placement and clears the cart.</div>
          </div>
        </aside>

        <section>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div className="small">{filtered.length} products</div>
            <div className="small">Showing {category}</div>
          </div>

          <div className="products" aria-live="polite">
            {filtered.map(p => (
              <article key={p.id} className="card" aria-label={p.title}>
                <img src={p.image} alt={p.title} />
                <div>
                  <div className="title">{p.title}</div>
                  <div className="small">{p.category} • {p.rating} ★</div>
                  <div style={{marginTop:6}}>{p.desc}</div>
                </div>
                <div className="row">
                  <div>
                    <div style={{fontWeight:700}}>{formatPrice(p.price)}</div>
                  </div>
                  <div className="actions">
                    <button className="action" onClick={()=> alert("View details not implemented in demo.")}>View</button>
                    <button className="action add" onClick={()=>addToCart(p)}>Add</button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="footer">Built with React (CDN) • Demo store</div>
        </section>
      </main>

      {showCart && (
        <div className="cart-panel" role="dialog" aria-label="Shopping cart">
          <h3 style={{marginTop:0}}>Your Cart</h3>
          {cart.length===0 ? (
            <div className="empty">Cart is empty</div>
          ) : (
            <>
              {cart.map(item => (
                <div className="cart-item" key={item.id}>
                  <img src={item.image} alt={item.title} />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700}}>{item.title}</div>
                    <div className="small">{formatPrice(item.price)} • {item.qty} pcs</div>
                    <div style={{marginTop:8,display:"flex",gap:8}}>
                      <button className="action" onClick={()=>updateQty(item.id,-1)}>-</button>
                      <button className="action" onClick={()=>updateQty(item.id,1)}>+</button>
                      <button className="action" onClick={()=>removeFromCart(item.id)}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="checkout">
                <div style={{fontWeight:700}}>Subtotal: {formatPrice(subtotal)}</div>
                <div style={{display:"flex",gap:8}}>
                  <button className="action" onClick={()=>clearCart()}>Clear</button>
                  <button className="action add" onClick={()=>{ setShowCheckout(true); }}>Checkout</button>
                </div>
              </div>
            </>
          )}
          {orderPlaced && (
            <div style={{marginTop:12,padding:10,background:"#ecfeff",borderRadius:8}}>
              <div style={{fontWeight:700}}>Last order: {orderPlaced.id}</div>
              <div className="small">Total {formatPrice(orderPlaced.total)}</div>
            </div>
          )}
        </div>
      )}

      {showCheckout && (
        <CheckoutDialog onClose={()=>setShowCheckout(false)} onPlace={placeOrder} />
      )}
    </div>
  );
}

function CheckoutDialog({onClose, onPlace}){
  const [form, setForm] = useState({name:"",email:"",address:""});
  return (
    <div className="cart-panel" role="dialog" aria-label="Checkout">
      <h3 style={{marginTop:0}}>Checkout</h3>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <input placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{padding:8,borderRadius:8,border:"1px solid #eef2ff"}} />
        <input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={{padding:8,borderRadius:8,border:"1px solid #eef2ff"}} />
        <textarea placeholder="Shipping address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} style={{padding:8,borderRadius:8,border:"1px solid #eef2ff"}} rows="3" />
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button className="action" onClick={onClose}>Cancel</button>
          <button className="action add" onClick={()=>onPlace(form)}>Place order</button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);