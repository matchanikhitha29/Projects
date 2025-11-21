const { useState, useEffect } = React;

/*
  Simple Todo & Notes app (React via CDN + Babel)
  Features:
  - Add note (title + body)
  - Mark complete / delete
  - Edit note
  - Search & filter
  - Persist in localStorage
*/

function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch (e) { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch(e){}
  }, [key, state]);
  return [state, setState];
}

function App() {
  const [notes, setNotes] = useLocalStorage("rfn_notes_v1", []);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);

  const addNote = () => {
    if (!title.trim() && !body.trim()) return;
    if (editingId) {
      setNotes(prev => prev.map(n => n.id === editingId ? {...n, title: title.trim(), body: body.trim(), updatedAt: Date.now()} : n));
      setEditingId(null);
    } else {
      const newNote = { id: Date.now().toString(), title: title.trim() || "Untitled", body: body.trim(), done: false, createdAt: Date.now(), updatedAt: Date.now() };
      setNotes(prev => [newNote, ...prev]);
    }
    setTitle(""); setBody("");
  };

  const toggleDone = (id) => setNotes(prev => prev.map(n => n.id===id ? {...n, done: !n.done, updatedAt: Date.now()} : n));
  const remove = (id) => setNotes(prev => prev.filter(n => n.id!==id));
  const edit = (id) => {
    const n = notes.find(x => x.id===id);
    if (!n) return;
    setTitle(n.title); setBody(n.body); setEditingId(id);
    window.scrollTo({top:0, behavior:"smooth"});
  };

  const filtered = notes.filter(n => {
    if (filter==="done" && !n.done) return false;
    if (filter==="active" && n.done) return false;
    if (query) {
      const q = query.toLowerCase();
      return (n.title + " " + n.body).toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="container" role="application">
      <div className="header">
        <h1>React Todo & Notes App</h1>
        <div className="controls">
          <input className="search" placeholder="Search notes..." value={query} onChange={e=>setQuery(e.target.value)} />
          <div className="filters" role="tablist" aria-label="Filters">
            <label><input type="radio" name="f" checked={filter==="all"} onChange={()=>setFilter("all")} /> All</label>
            <label><input type="radio" name="f" checked={filter==="active"} onChange={()=>setFilter("active")} /> Active</label>
            <label><input type="radio" name="f" checked={filter==="done"} onChange={()=>setFilter("done")} /> Done</label>
          </div>
        </div>
      </div>

      <div className="input-row" aria-label="Add note">
        <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <textarea rows="2" placeholder="Write something..." value={body} onChange={e=>setBody(e.target.value)} />
        <button className="btn" onClick={addNote}>{editingId ? "Update" : "Add"}</button>
      </div>

      <div className="list" aria-live="polite">
        {filtered.length===0 ? <p style={{color:"#64748b"}}>No notes — add one!</p> : null}
        {filtered.map(n => (
          <article key={n.id} className="card" aria-label={`Note ${n.title}`}>
            <div>
              <strong style={{textDecoration: n.done ? "line-through" : "none"}}>{n.title}</strong>
              <div className="meta">{n.body}</div>
              <div className="meta" style={{marginTop:6}}>
                <small>Created: {new Date(n.createdAt).toLocaleString()}</small>
                {" • "}
                <small>Updated: {new Date(n.updatedAt).toLocaleString()}</small>
              </div>
            </div>
            <div className="actions">
              <button className="action-btn" onClick={()=>toggleDone(n.id)} aria-pressed={n.done}>{n.done ? "Undo" : "Done"}</button>
              <button className="action-btn" onClick={()=>edit(n.id)}>Edit</button>
              <button className="action-btn" onClick={()=>remove(n.id)}>Delete</button>
            </div>
          </article>
        ))}
      </div>

      <div className="footer">
        <div>{notes.length} total • {notes.filter(n=>n.done).length} done</div>
        <div>Persistent in localStorage</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);