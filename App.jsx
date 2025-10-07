import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LogoFull from '/logo_cream.svg';
import LogoIcon from '/icon_cream.svg';

const theme = { navy: '#0C2242', beige: '#D4A574', white: '#FFFFFF' };
const LS_KEY = 'gibbs-bakehouse-loyalty';
const load = () => { try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } };
const save = (s) => localStorage.setItem(LS_KEY, JSON.stringify(s));
const todayKey = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function hashCode(s){ let h=0; for(let i=0;i<s.length;i++) h=(h<<5)-h+s.charCodeAt(i); return Math.abs(h).toString().slice(0,6).padStart(6,'0'); }
function formatDate(ts){ return new Date(ts).toLocaleString(); }

const defaultStore = {
  bakery: { name: 'The Gibbs Family Bakehouse', address: 'Shop 16, 44 Toyon Rd, Kalkallo VIC', hours: '7:00am – 5:00pm, 7 days' },
  settings: { stampsPerReward: 10, minSpendPerStamp: 10, oneStampPerTxn: true, discountPercent: 10, merchantPIN: '1357', playSound: true },
  customers: {}, activity: [], specials: [{ id: crypto.randomUUID(), title: 'Morning Croissant + Coffee', price: '$9.90', desc: 'Buttery croissant & small flat white', day: todayKey() }],
};

export default function App(){
  const [store, setStore] = useState(() => load() || defaultStore);
  useEffect(() => save(store), [store]);
  const [showSplash, setShowSplash] = useState(true);

  // sound
  const triedSound = useRef(false);
  useEffect(() => {
    if (!showSplash || !store.settings.playSound || triedSound.current) return;
    triedSound.current = true;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const playChime = () => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(660, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.55);
    };
    ctx.resume().then(playChime).catch(() => {
      const once = () => { ctx.resume().then(playChime).finally(() => window.removeEventListener('pointerdown', once)); };
      window.addEventListener('pointerdown', once, { once: true });
    });
  }, [showSplash, store.settings.playSound]);

  useEffect(() => { if (!showSplash) return; const t = setTimeout(() => setShowSplash(false), 2500); return () => clearTimeout(t); }, [showSplash]);

  const addActivity = (entry) => setStore((s) => ({ ...s, activity: [{ id: crypto.randomUUID(), ts: Date.now(), ...entry }, ...s.activity].slice(0, 200) }));

  return (
    <div style={{ minHeight:'100vh', backgroundColor: theme.navy, color: theme.white }}>
      <AnimatePresence>{showSplash && (
        <motion.section key="splash" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.8}}
          style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', backgroundColor: theme.navy }}>
          <motion.img src={LogoFull} alt="The Gibbs Family Bakehouse" style={{ width: '256px', marginBottom: '12px' }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} />
          <motion.p style={{ opacity: 0.9 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.8 }}>
            Fresh daily sourdough, cookies & pastries
          </motion.p>
        </motion.section>
      )}</AnimatePresence>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
        <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', backgroundColor: theme.white, color: theme.navy }}>
          <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', backgroundColor: theme.navy, color: theme.white, borderBottom:`1px solid ${theme.beige}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <img src={LogoIcon} alt="Bakehouse Icon" style={{ width:'40px', height:'40px', borderRadius:'12px', backgroundColor: theme.white }} />
              <div>
                <div style={{ fontWeight: 600 }}>Gibbs Bakehouse Loyalty</div>
                <div style={{ fontSize:'12px', opacity: 0.85 }}>Loyalty & Daily Specials</div>
              </div>
            </div>
            <label style={{ fontSize:'12px', display:'flex', alignItems:'center', gap:'6px' }}>
              <input type="checkbox" checked={!!store.settings.playSound} onChange={(e)=> setStore((s)=> ({...s, settings: {...s.settings, playSound: e.target.checked}}))} />
              Play sound on launch
            </label>
          </header>

          <div style={{ padding:'16px' }}>
            <Tabs store={store} setStore={setStore} addActivity={addActivity} />
          </div>
        </div>
      </div>

      <footer style={{ textAlign:'center', fontSize:'12px', padding:'16px', opacity:0.8 }}>© {new Date().getFullYear()} The Gibbs Family Bakehouse</footer>
    </div>
  );
}

function Tabs({ store, setStore, addActivity }){
  const [tab, setTab] = useState('specials'); // default to Specials
  const tabs = ['customer','staff','specials','admin'];
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'8px' }}>
        {tabs.map(v => (
          <button key={v} onClick={()=>setTab(v)} style={{ padding:'8px 10px', borderRadius:'10px', border:'1px solid #ddd', background: tab===v? '#f2e6d8':'#fff' }}>
            {v[0].toUpperCase()+v.slice(1)}
          </button>
        ))}
      </div>
      <div style={{ marginTop:'16px' }}>
        {tab==='specials' && <SpecialsTab store={store} setStore={setStore} />}
        {tab==='customer' && <CustomerTab store={store} setStore={setStore} addActivity={addActivity} />}
        {tab==='staff' && <StaffTab store={store} setStore={setStore} addActivity={addActivity} />}
        {tab==='admin' && <AdminTab store={store} setStore={setStore} />}
      </div>
    </div>
  );
}

function SpecialsTab({ store, setStore }){
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [day, setDay] = useState(todayKey());

  const addSpecial = () => {
    if(!title) return;
    setStore((s)=> ({...s, specials: [{ id: crypto.randomUUID(), title, price, desc, day }, ...s.specials].slice(0,20) }));
    setTitle(''); setPrice(''); setDesc('');
  };

  const today = store.specials.filter(sp => sp.day === todayKey());
  return (
    <div style={{ display:'grid', gap:'16px', gridTemplateColumns:'1fr 1fr' }}>
      <div style={{ border:'1px solid #eee', borderRadius:'16px', padding:'16px' }}>
        <div style={{ fontWeight:600, marginBottom:'8px' }}>Today</div>
        <div style={{ display:'grid', gap:'10px', gridTemplateColumns:'1fr 1fr' }}>
          {today.length ? today.map(sp => (
            <div key={sp.id} style={{ border:'1px solid #D4A574', borderRadius:'12px', padding:'12px' }}>
              <div style={{ fontWeight:600 }}>{sp.title}</div>
              <div style={{ fontSize:'13px', opacity:0.8 }}>{sp.desc}</div>
              <div style={{ marginTop:'6px', fontWeight:700, color: theme.navy }}>{sp.price}</div>
            </div>
          )) : <div style={{ opacity:0.7, fontSize:'14px' }}>No specials yet today.</div>}
        </div>
      </div>

      <div style={{ border:'1px solid #eee', borderRadius:'16px', padding:'16px' }}>
        <div style={{ fontWeight:600, marginBottom:'8px' }}>Add / Schedule</div>
        <div style={{ display:'grid', gap:'8px', maxWidth:'360px' }}>
          <label>Title<input value={title} onChange={(e)=>setTitle(e.target.value)} style={{ width:'100%' }} /></label>
          <label>Description<input value={desc} onChange={(e)=>setDesc(e.target.value)} style={{ width:'100%' }} /></label>
          <label>Price<input value={price} onChange={(e)=>setPrice(e.target.value)} style={{ width:'100%' }} placeholder="$9.90" /></label>
          <label>Day<input value={day} onChange={(e)=>setDay(e.target.value)} type="date" style={{ width:'100%' }} /></label>
          <button onClick={addSpecial} style={{ padding:'8px 10px', borderRadius:'10px', background: theme.navy, color: theme.white }}>Save special</button>
          <div style={{ fontSize:'12px', opacity:0.7 }}>Shows on the chosen date. Keeps the last 20 specials.</div>
        </div>
      </div>
    </div>
  );
}

function CustomerTab({ store, setStore, addActivity }){
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [me, setMe] = useState(null);
  useEffect(()=>{ const last=sessionStorage.getItem('gibbs-last-phone'); if(last) setPhone(last); },[]);
  const login = () => {
    const p = phone.replace(/\D/g, ''); if(!p) return; sessionStorage.setItem('gibbs-last-phone', p);
    setStore((s)=>{ const ex=s.customers[p]; if(ex){ setMe(ex); return s;} const c={ phone:p, name:name||'Customer', stamps:0, rewardsRedeemed:0, createdAt:Date.now()}; addActivity({ type:'signup', who:p }); return { ...s, customers: { ...s.customers, [p]: c } }; });
  };
  useEffect(()=>{ if(!me && phone){ const p = phone.replace(/\D/g,''); const c=store.customers[p]; if(c) setMe(c);} },[store.customers, phone, me]);
  const code = useMemo(()=> phone? hashCode(phone):'------', [phone]);
  const canRedeem = me && me.stamps >= store.settings.stampsPerReward;
  return (
    <div style={{ display:'grid', gap:'16px', gridTemplateColumns:'1fr 1fr' }}>
      <div style={{ border:'1px solid #eee', borderRadius:'16px', padding:'16px' }}>
        <div style={{ fontWeight:600 }}>Sign in</div>
        <div style={{ display:'grid', gap:'8px', marginTop:'8px' }}>
          <label>Name (optional)<input value={name} onChange={(e)=>setName(e.target.value)} /></label>
          <label>Phone<input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="0412 345 678" /></label>
          <div style={{ display:'flex', gap:'8px', marginTop:'6px' }}>
            <button onClick={login} style={{ padding:'8px 10px', borderRadius:'10px', background: theme.navy, color: theme.white }}>Sign in / Join</button>
            <button onClick={()=>setMe(null)} style={{ padding:'8px 10px', borderRadius:'10px' }}>Sign out</button>
          </div>
        </div>
      </div>

      <div style={{ border:'1px solid #eee', borderRadius:'16px', padding:'16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between' }}><div style={{ fontWeight:600 }}>My rewards</div><div style={{ fontSize:'12px' }}>Code: <strong style={{ letterSpacing:'0.1em' }}>{code}</strong></div></div>
        {me ? (
          <div>
            <div style={{ fontSize:'14px', marginTop:'6px' }}>You have <strong>{me.stamps}</strong> stamp{me.stamps===1?'':'s'}.</div>
            <StampRow count={me.stamps} needed={store.settings.stampsPerReward} />
            <button disabled={!canRedeem} style={{ marginTop:'8px', padding:'8px 10px', borderRadius:'10px', background: theme.beige, color: theme.navy }}>Redeem {store.settings.discountPercent}%</button>
          </div>
        ) : <div style={{ fontSize:'14px', opacity:0.7, marginTop:'8px' }}>Sign in to see stamps.</div>}
      </div>
    </div>
  );
}

function StaffTab({ store, setStore, addActivity }){
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [query, setQuery] = useState('');
  const [customer, setCustomer] = useState(null);
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState('');
  const search = () => { const p=query.replace(/\D/g,''); const byPhone=store.customers[p]; if(byPhone) return setCustomer(byPhone); const entry=Object.values(store.customers).find(c=> hashCode(c.phone)===query); setCustomer(entry||null); };
  const addStamp = () => { if(!customer) return; const a=Number(amount); if(isNaN(a)||a<store.settings.minSpendPerStamp) return setMsg(`Min spend $${store.settings.minSpendPerStamp} for a stamp.`); setStore(s=>{ const c={...s.customers[customer.phone]}; c.stamps+=1; s.customers[c.phone]=c; return {...s, customers:{...s.customers}};}); setMsg('+1 stamp added'); };
  const redeem = () => { if(!customer) return; if(customer.stamps<store.settings.stampsPerReward) return setMsg('Not enough stamps.'); setStore(s=>{ const c={...s.customers[customer.phone]}; c.stamps-=s.settings.stampsPerReward; c.rewardsRedeemed=(c.rewardsRedeemed||0)+1; s.customers[c.phone]=c; return {...s, customers:{...s.customers}};}); setMsg(`${store.settings.discountPercent}% discount applied`); };
  return (
    <div style={{ display:'grid', gap:'16px', gridTemplateColumns:'1fr 1fr' }}>
      <div style={{ border:'1px solid #eee', borderRadius:'16px', padding:'16px' }}>
        <div style={{ fontWeight:600 }}>Staff access</div>
        <div style={{ display:'grid', gap:'8px', marginTop:'8px', maxWidth:'360px' }}>
          <label>Merchant PIN<input type="password" value={pin} onChange={(e)=>setPin(e.target.value)} placeholder="••••" /></label>
          <button onClick={()=>setUnlocked(pin===store.settings.merchantPIN)} style={{ padding:'8px 10px', borderRadius:'10px', background: theme.navy, color: theme.white }}>Unlock</button>
          {!unlocked && <div style={{ fontSize:'12px', opacity:0.7 }}>Default PIN is 1357 — change it in Admin.</div>}
        </div>
      </div>

      <div style={{ border:'1px solid #eee', borderRadius:'16px', padding:'16px' }}>
        <div style={{ fontWeight:600 }}>Find customer</div>
        <div style={{ display:'grid', gap:'8px', marginTop:'8px', maxWidth:'360px' }}>
          <label>Phone or code<input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="0412345678 or 6-digit code" /></label>
          <label>Transaction amount ($)<input value={amount} onChange={(e)=>setAmount(e.target.value)} type="number" min="0" step="0.01" /></label>
          <button onClick={search} style={{ padding:'8px 10px', borderRadius:'10px' }}>Lookup</button>
        </div>
        {customer && (
          <div style={{ marginTop:'12px', border:'1px solid #eee', borderRadius:'12px', padding:'12px' }}>
            <div style={{ fontWeight:600 }}>{customer.name || 'Customer'} — {customer.phone}</div>
            <div style={{ fontSize:'14px', opacity:0.8 }}>Stamps: {customer.stamps} • Redeemed: {customer.rewardsRedeemed||0}</div>
            <StampRow count={customer.stamps} needed={store.settings.stampsPerReward} />
            <div style={{ display:'flex', gap:'8px', marginTop:'8px' }}>
              <button onClick={addStamp} disabled={!unlocked} style={{ padding:'8px 10px', borderRadius:'10px', background: theme.beige, color: theme.navy }}>+1 stamp</button>
              <button onClick={redeem} disabled={!unlocked} style={{ padding:'8px 10px', borderRadius:'10px' }}>Redeem {store.settings.discountPercent}%</button>
            </div>
            {msg && <div style={{ fontSize:'12px', marginTop:'6px', color: theme.navy }}>{msg}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminTab({ store, setStore }){
  const [stamps, setStamps] = useState(store.settings.stampsPerReward);
  const [minSpend, setMinSpend] = useState(store.settings.minSpendPerStamp);
  const [discountPercent, setDiscountPercent] = useState(store.settings.discountPercent);
  const [pin, setPin] = useState(store.settings.merchantPIN);
  const [playSound, setPlaySound] = useState(!!store.settings.playSound);
  const save = () => setStore((s)=> ({...s, settings: { ...s.settings, stampsPerReward: Number(stamps)||1, minSpendPerStamp: Number(minSpend)||0, discountPercent: Number(discountPercent)||0, merchantPIN: pin||'1357', playSound } }));
  return (
    <div style={{ display:'grid', gap:'16px', gridTemplateColumns:'1fr 1fr' }}>
      <div style={{ border:'1px solid #eee', borderRadius:'16px', padding:'16px' }}>
        <div style={{ fontWeight:600 }}>Rewards & security</div>
        <div style={{ display:'grid', gap:'8px', marginTop:'8px', maxWidth:'360px' }}>
          <label>Stamps per reward<input type="number" min="1" value={stamps} onChange={(e)=>setStamps(e.target.value)} /></label>
          <label>Min spend per stamp ($)<input type="number" min="0" step="0.01" value={minSpend} onChange={(e)=>setMinSpend(e.target.value)} /></label>
          <label>Discount percent<input type="number" min="0" max="100" value={discountPercent} onChange={(e)=>setDiscountPercent(e.target.value)} /></label>
          <label>Merchant PIN<input type="password" value={pin} onChange={(e)=>setPin(e.target.value)} /></label>
          <label><input type="checkbox" checked={playSound} onChange={(e)=>setPlaySound(e.target.checked)} /> Play sound on launch</label>
          <button onClick={save} style={{ padding:'8px 10px', borderRadius:'10px', background: theme.beige, color: theme.navy }}>Save changes</button>
        </div>
      </div>

      <ActivityLog activity={store.activity.slice(0,8)} />
    </div>
  );
}

function ActivityLog({ activity }){
  return (
    <div style={{ border:'1px solid #eee', borderRadius:'16px', padding:'16px' }}>
      <div style={{ fontWeight:600, marginBottom:'8px' }}>Recent activity</div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><th style={{textAlign:'left'}}>When</th><th style={{textAlign:'left'}}>Type</th><th style={{textAlign:'left'}}>Who</th><th style={{textAlign:'left'}}>Details</th></tr></thead>
        <tbody>
          {activity.map(a => (
            <tr key={a.id}>
              <td>{formatDate(a.ts)}</td><td style={{textTransform:'capitalize'}}>{a.type}</td><td>{a.who}</td><td style={{fontSize:'12px', opacity:0.8}}>{a.meta? JSON.stringify(a.meta):''}</td>
            </tr>
          ))}
          {activity.length===0 && (<tr><td colSpan="4" style={{fontSize:'14px', opacity:0.6}}>No activity yet.</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

function StampRow({ count, needed }){
  const items = Array.from({ length: needed }, (_, i) => i < count);
  return (
    <div style={{ marginTop:'8px', display:'grid', gridTemplateColumns:'repeat(10, 1fr)', gap:'8px' }}>
      {items.map((filled, idx) => (
        <div key={idx} style={{ height:'24px', borderRadius:'12px', border:'1px solid #D4A574', background: filled ? '#D4A574' : '#FFFFFF' }} />
      ))}
    </div>
  );
}
