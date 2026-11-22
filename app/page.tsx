"use client";

import { useMemo, useState } from "react";

type Category = "tech" | "fashion" | "beauty" | "cash" | "groceries" | "home" | "experiences" | "loans";
type Gift = {
  id: string; name: string; category: Category; total?: number; raised?: number;
  description?: string; image?: string; fulfilled?: boolean; flexible?: boolean;
  contributors?: number; featured?: boolean; tag?: string;
};

const money = (n: number) => new Intl.NumberFormat("en-NG", {
  style: "currency", currency: "NGN", maximumFractionDigits: 0,
}).format(n);

const gifts: Gift[] = [
  { id:"macbook", name:"MacBook", category:"tech", featured:true, tag:"Most wanted", image:"https://images.unsplash.com/photo-1517256718643-7e6c5f8c3d4f?auto=format&fit=crop&w=1200&q=85" },
  { id:"bag", name:"Handbag", category:"fashion", image:"https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=85" },
  { id:"perfumes", name:"Perfumes", category:"fashion" },
  { id:"shoes", name:"New shoes", category:"fashion", image:"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=85" },
  { id:"slippers", name:"New slippers", category:"fashion", image:"https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=600&q=85" },
  { id:"bra", name:"Big-size bra", category:"fashion" },
  { id:"clothes", name:"Clothes", category:"fashion" },
  { id:"new-hair", name:"New hair", category:"beauty" },
  { id:"nails", name:"Nails", category:"beauty" },
  { id:"clement", name:"Clement Isong", category:"cash", description:"Five bundles of ₦1,000 notes." },
  { id:"azikiwe", name:"Nnamdi Azikiwe", category:"cash", description:"Six bundles of ₦500 notes." },
  { id:"item-7", name:"Food from Item 7 Go", category:"groceries" },
  { id:"turkey", name:"Molabat peppered turkey", category:"groceries", description:"Five pieces." },
  { id:"yam", name:"Big tubers of yam", category:"groceries" },
  { id:"eggs", name:"A crate of eggs", category:"groceries" },
  { id:"rice-stew", name:"Half bag of rice, stew and soup ingredients", category:"groceries" },
  { id:"pots", name:"Set of non-stick pots", category:"home" },
  { id:"gas", name:"Abeg, fill my gas", category:"home", flexible:true, total:0, raised:0 },
  { id:"gym", name:"Gym membership", category:"experiences", description:"I wan start soon!" },
  { id:"gift-cards", name:"Gift cards", category:"experiences", flexible:true, total:0, raised:0 },
  { id:"surprises", name:"Surprises", category:"experiences", flexible:true, total:0, raised:0 },
  { id:"palmpay-loan", name:"PalmPay loan repayment", category:"loans", flexible:true, total:0, raised:0, description:"Amount to clear: ₦30,000." },
  { id:"fairmoney-loan", name:"FairMoney loan repayment", category:"loans", flexible:true, total:0, raised:0, description:"Amount to clear: ₦40,000." },
  { id:"opay-loan", name:"OPay loan repayment", category:"loans", flexible:true, total:0, raised:0, description:"Amount to clear: ₦10,000." },
];

const categories: { id: "all" | Category; label: string }[] = [
  {id:"all",label:"All gifts"},{id:"tech",label:"Tech"},{id:"fashion",label:"Fashion"},
  {id:"beauty",label:"Hair & beauty"},{id:"cash",label:"Cash gifts"},{id:"groceries",label:"Groceries"},
  {id:"home",label:"Home"},{id:"experiences",label:"Experiences"},{id:"loans",label:"Loan repayments"},
];

function GiftCard({ gift, onContribute }: { gift: Gift; onContribute: (gift: Gift, full?: boolean) => void }) {
  const total = gift.total ?? 0, raised = gift.raised ?? 0;
  const remaining = Math.max(total - raised, 0);
  const progress = total ? Math.min((raised / total) * 100, 100) : 0;
  return (
    <article className={`overflow-hidden rounded-3xl border border-white/80 bg-white/70 p-4 shadow-[0_12px_36px_-22px_rgba(125,86,45,.35)] backdrop-blur-xl ${gift.featured ? "md:col-span-2" : ""}`}>
      {gift.image && <div className={`relative mb-4 overflow-hidden rounded-2xl bg-[#f6ded1] ${gift.featured ? "h-52 sm:h-64" : "h-36"}`}>
        <img src={gift.image} alt={gift.name} className="h-full w-full object-cover" />
        {gift.tag && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#7d562d]">{gift.tag}</span>}
        {gift.fulfilled && <span className="absolute inset-0 flex items-center justify-center bg-[#251911]/35 text-sm font-bold text-white">✓ Already fulfilled</span>}
      </div>}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-serif text-xl font-semibold text-[#251911]">{gift.name}</h3>
        {gift.total ? <span className="font-semibold text-[#7d562d]">{money(gift.total)}</span> : <span className="text-sm font-semibold text-[#865046]">Any amount</span>}
      </div>
      {gift.description && <p className="mt-1 text-sm leading-6 text-[#6c5b50]">{gift.description}</p>}
      {gift.fulfilled ? <p className="mt-3 text-sm font-semibold text-[#7d562d]">An angel has taken care of this ✨</p> : <>
        {gift.total ? <>
          <div className="mt-4 flex justify-between gap-2 text-xs font-semibold"><span>{money(raised)} raised</span><span className="text-[#865046]">{money(remaining)} left</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f6ded1]"><div className="h-full rounded-full bg-gradient-to-r from-[#d4a373] to-[#865046]" style={{width:`${progress}%`}} /></div>
        </> : <p className="mt-3 text-sm text-[#6c5b50]">Open contribution — support with any amount.</p>}
        <div className="mt-4 flex gap-2">
          <button onClick={() => onContribute(gift)} className="flex-1 rounded-full bg-gradient-to-r from-[#d4a373] to-[#feb8ab] px-4 py-3 text-sm font-bold text-[#2c1600] transition hover:brightness-105 active:scale-[.98]">Contribute</button>
          {gift.total && remaining > 0 && <button onClick={() => onContribute(gift, true)} className="rounded-full bg-[#f6ded1] px-4 py-3 text-sm font-semibold text-[#7d562d]">Gift all</button>}
        </div>
      </>}
    </article>
  );
}

export default function BirthdayWishlistPage() {
  const [category, setCategory] = useState<"all" | Category>("all");
  const [selected, setSelected] = useState<Gift | null>(null);
  const [amount, setAmount] = useState("");
  const [fullGift, setFullGift] = useState(false);
  const [toast, setToast] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [wishes, setWishes] = useState<{name:string; message:string; time:string}[]>([]);
  const filtered = useMemo(() => gifts.filter(g => category === "all" || g.category === category), [category]);
  const remaining = selected?.flexible ? 0 : Math.max((selected?.total ?? 0) - (selected?.raised ?? 0), 0);

  function openGift(gift: Gift, full = false) {
    setSelected(gift); setFullGift(full);
    setAmount(full && gift.total ? String(Math.max(gift.total - (gift.raised ?? 0), 0)) : "");
  }
  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  }
  async function copyAccount(account: string) {
    try { await navigator.clipboard.writeText(account); showToast(`Account number ${account} copied. Thank you!`); }
    catch { showToast("Copy isn't available in this browser. Please copy the number manually."); }
  }
  function postWish() {
    if (!guestMessage.trim()) { showToast("Please write a birthday wish first."); return; }
    setWishes(current => [{name:guestName.trim() || "A sweet well-wisher", message:guestMessage.trim(), time:"Just now"}, ...current]);
    setGuestName(""); setGuestMessage(""); showToast("Your birthday love has been added 💌");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff8f5] text-[#251911]">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-20 h-80 w-80 rounded-full bg-[#fbe9d0]/80 blur-[90px]" />
        <div className="absolute right-[-8rem] top-1/4 h-96 w-96 rounded-full bg-[#fce4ec]/70 blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-[#f3e8ff]/60 blur-[100px]" />
      </div>

      <header className="fixed inset-x-0 top-0 z-30 px-3 pt-[max(env(safe-area-inset-top),12px)] sm:px-6">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between rounded-full border border-white/70 bg-white/75 px-4 shadow-lg shadow-[#b8896e]/10 backdrop-blur-xl sm:px-6">
          <a href="#" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f6ded1] text-xl">🎂</span>
            <span className="min-w-0"><span className="block truncate font-serif text-lg font-semibold sm:text-xl">My Birthday Wishlist ✨</span><span className="block text-[10px] font-bold uppercase tracking-[.2em] text-[#7d562d]">Wishlist curation</span></span>
          </a>
          <a href="#guestbook" aria-label="Go to guestbook" className="rounded-full bg-[#f6ded1] px-4 py-2 text-sm font-semibold text-[#7d562d]">Send love</a>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-32 pt-28 sm:px-6 lg:gap-14">
        <section className="rounded-[2rem] border border-white/80 bg-white/65 px-5 py-10 text-center shadow-xl shadow-[#d4a373]/15 backdrop-blur-2xl sm:px-10 sm:py-14">
          <div className="mx-auto grid h-28 w-28 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-[#d4a373] via-[#feb8ab] to-[#b7a5d2] text-5xl shadow-lg">🎀</div>
          <p className="mx-auto mt-6 inline-flex rounded-full bg-[#ffdcbd]/60 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#623f18]">November 27, 2005 • Turning 21</p>
          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">My Birthday Wishlist</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#6c5b50] sm:text-base">My birthday is coming, and I’ve put together a little list of things that would make me very happy. Whether you choose to get me a gift, contribute towards something special, send me a surprise or simply say a prayer, I appreciate you.</p>
          <div className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
            <a href="#wishlist" className="flex-1 rounded-full bg-gradient-to-r from-[#d4a373] to-[#feb8ab] px-6 py-3.5 text-sm font-bold text-[#2c1600] shadow-md">Explore my wishlist ↓</a>
            <a href="#bank-transfer" className="flex-1 rounded-full border border-[#ead7c9] bg-white/80 px-6 py-3.5 text-sm font-bold text-[#7d562d]">Contribute directly ♡</a>
          </div>
        </section>

        <section id="wishlist" className="scroll-mt-28">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#7d562d]">Curated registry</p><h2 className="mt-1 font-serif text-3xl font-semibold sm:text-4xl">Things on my birthday list</h2></div>
            <span className="text-3xl">🎁</span>
          </div>
          <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
            {categories.map(item => <button key={item.id} onClick={() => setCategory(item.id)} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${category === item.id ? "bg-[#d4a373] text-[#2c1600] shadow-md" : "border border-white bg-white/70 text-[#6c5b50]"}`}>{item.label}</button>)}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(gift => <GiftCard key={gift.id} gift={gift} onContribute={openGift} />)}
          </div>
          {filtered.length === 0 && <p className="rounded-2xl bg-white/70 p-8 text-center text-[#6c5b50]">No gifts in this category yet.</p>}
        </section>

        <section id="bank-transfer" className="scroll-mt-28 rounded-[2rem] border border-white/80 bg-white/70 p-5 shadow-xl shadow-[#d4a373]/10 backdrop-blur-xl sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#7d562d]">Direct bank transfer</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Want to send a birthday gift?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c5b50]">Transfer directly to either account below. Please add a sweet birthday note as your reference.</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <AccountCard bank="United Bank for Africa (UBA)" initials="UBA" account="2197674482" accountName="CHIAMAKA JULIA KENNETH" primary onCopy={copyAccount} />
            <AccountCard bank="OPay" initials="OPAY" account="9154106435" accountName="CHIAMAKA JULIA KENNETH" onCopy={copyAccount} />
          </div>
          <p className="mt-4 rounded-xl bg-[#fff1ea] p-3 text-xs leading-5 text-[#865046]">Please confirm the account name and number before completing your transfer.</p>
        </section>

        <section className="rounded-[2rem] bg-white/70 p-5 shadow-lg shadow-[#d4a373]/10 backdrop-blur-xl sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#7d562d]">Collaborations & referrals</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Want to make me even happier?</h2>
          <p className="mt-2 font-serif text-xl text-[#865046]">Let’s build something exceptional together.</p>
          <p className="mt-3 text-sm leading-7 text-[#6c5b50]">Beyond gifts, the most fulfilling birthday present is sharing my craft with the world. Know anyone launching a startup, revamping an online boutique, or needing high-converting digital design? Refer me or let’s work together!</p>
          <div className="mt-5 flex flex-wrap gap-2">{["Business websites","E-commerce stores","Bespoke portfolios","Personal branding","Web design & development"].map(x=><span key={x} className="rounded-full bg-[#f6ded1]/70 px-4 py-2 text-sm font-medium">{x}</span>)}</div>
          <a href="mailto:chiamakaehise@gmail.com?subject=Birthday%20Project%20Inquiry" className="mt-6 flex justify-center rounded-full bg-gradient-to-r from-[#7d562d] to-[#865046] px-5 py-3.5 text-sm font-bold text-white">Work with me or send a referral ↗</a>
          <p className="mt-3 text-center text-sm text-[#6c5b50]">Email: <a href="mailto:chiamakaehise@gmail.com" className="font-semibold underline underline-offset-2">chiamakaehise@gmail.com</a></p>
        </section>

        <section>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#7d562d]">Real talk & soft life</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Abeg, make these happen! 😂</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["💼","Abeg make una beg my HR to increase my salary","Please, I need this salary increase."],
              ["🇳🇬","Vote Peter Obi abeg","Abeg."],
              ["⛽🔥","Abeg, fill my gas","Please help me refill it."],
              ["🏋️‍♀️✨","Gym membership — I wan start soon!","I wan start soon!"],
            ].map(([emoji,title,desc])=><div key={title} className="flex gap-3 rounded-2xl border border-white bg-white/70 p-4 shadow-sm"><span className="text-2xl">{emoji}</span><div><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-[#6c5b50]">{desc}</p></div></div>)}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white/70 p-5 shadow-lg shadow-[#d4a373]/10 backdrop-blur-xl sm:p-8">
          <div className="text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#7d562d]">Prayers</p><h2 className="mt-2 font-serif text-3xl font-semibold">Please remember me in your prayers</h2></div>
        </section>

        <section id="guestbook" className="scroll-mt-28">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#7d562d]">Warm affections</p><h2 className="mt-2 font-serif text-3xl font-semibold">Birthday wishes & guestbook</h2>
          <div className="mt-5 rounded-3xl border border-white bg-white/75 p-4 shadow-lg shadow-[#d4a373]/10 sm:p-6">
            <label className="mb-2 block text-sm font-semibold" htmlFor="guest-name">Your name or nickname</label>
            <input id="guest-name" value={guestName} onChange={e=>setGuestName(e.target.value)} placeholder="Your name or nickname" className="w-full rounded-xl border border-[#ead7c9] bg-[#fff8f5] px-4 py-3 text-sm outline-none focus:border-[#b8896e]" />
            <label className="mb-2 mt-4 block text-sm font-semibold" htmlFor="guest-message">Your birthday message</label>
            <textarea id="guest-message" rows={4} value={guestMessage} onChange={e=>setGuestMessage(e.target.value)} placeholder="Leave a heartfelt prayer, funny memory, or birthday greeting..." className="w-full resize-y rounded-xl border border-[#ead7c9] bg-[#fff8f5] px-4 py-3 text-sm outline-none focus:border-[#b8896e]" />
            <button onClick={postWish} className="mt-4 w-full rounded-full bg-gradient-to-r from-[#d4a373] to-[#feb8ab] px-5 py-3.5 text-sm font-bold text-[#2c1600]">♡ Send birthday love</button>
          </div>
          <div className="mt-4 space-y-3">{wishes.map((wish,i)=><article key={`${wish.time}-${i}`} className="rounded-2xl border border-white bg-white/65 p-4 shadow-sm"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm">{wish.name}</strong><span className="text-xs text-[#9b8577]">{wish.time}</span></div><p className="mt-2 text-sm leading-6 text-[#6c5b50]">{wish.message}</p></article>)}</div>
          <p className="mt-8 text-center font-serif text-lg italic leading-7 text-[#6c5b50]">“Thank you for being part of my story. Every gift, contribution, referral, kind word and prayer means the whole universe to me.”</p>
          <p className="mt-3 text-center text-xs font-bold uppercase tracking-[.2em] text-[#7d562d]">Blessed • Loved • Radiant ✨</p>
        </section>
      </div>

      {selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#251911]/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}>
        <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-[#fffaf7] p-5 shadow-2xl sm:rounded-[2rem] sm:p-7">
          <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-[#d4c4b7] sm:hidden" />
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#7d562d]">Contribution tray</p><h2 id="modal-title" className="mt-1 font-serif text-2xl font-semibold">{selected.name}</h2></div><button onClick={()=>setSelected(null)} aria-label="Close" className="rounded-full bg-[#f6ded1] px-3 py-2 text-lg">×</button></div>
          <div className="mt-5 rounded-2xl bg-[#fff1ea] p-4 text-sm">
            {selected.flexible ? <p>Open contribution — choose an amount that feels right.</p> : <><div className="flex justify-between"><span className="text-[#6c5b50]">Goal amount</span><strong>{money(selected.total ?? 0)}</strong></div><div className="mt-2 flex justify-between gap-3"><span className="text-[#6c5b50]">Already raised: {money(selected.raised ?? 0)}</span><strong className="text-[#865046]">Left: {money(remaining)}</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f6ded1]"><div className="h-full bg-[#d4a373]" style={{width:`${selected.total ? ((selected.raised ?? 0)/selected.total)*100 : 0}%`}} /></div></>}
          </div>
          <p className="mt-5 text-sm font-semibold">Choose a contribution amount</p>
          <div className="mt-3 grid grid-cols-4 gap-2">{[5000,10000,20000,50000].map(n=><button key={n} onClick={()=>{setAmount(String(n));setFullGift(false);}} className={`rounded-full px-2 py-2.5 text-xs font-bold ${amount===String(n)&&!fullGift?"bg-[#d4a373] text-[#2c1600]":"bg-[#f6ded1] text-[#6c5b50]"}`}>{money(n)}</button>)}</div>
          <label htmlFor="gift-amount" className="mb-2 mt-4 block text-sm font-semibold">Or enter a custom amount (₦)</label>
          <input id="gift-amount" inputMode="numeric" value={amount} onChange={e=>{setAmount(e.target.value.replace(/[^\d]/g,""));setFullGift(false);}} placeholder="e.g. 25000" className="w-full rounded-xl border border-[#ead7c9] bg-white px-4 py-3 outline-none focus:border-[#b8896e]" />
          {!selected.flexible && remaining>0 && <button onClick={()=>{setFullGift(v=>!v);setAmount(fullGift?"":String(remaining));}} className={`mt-4 flex w-full items-center justify-between rounded-xl p-4 text-left text-sm font-semibold ${fullGift?"bg-[#f6ded1]":"bg-[#fff1ea]"}`}><span>🎁 I’ll sponsor the entire remaining amount</span><span>{fullGift?"✓":"○"}</span></button>}
          <button onClick={()=>{if(!amount || Number(amount)<=0){showToast("Please enter a valid contribution amount.");return;}setSelected(null);document.getElementById("bank-transfer")?.scrollIntoView({behavior:"smooth"});showToast(`You selected ${money(Number(amount))}. Please complete your transfer below.`);}} className="mt-5 w-full rounded-full bg-gradient-to-r from-[#d4a373] to-[#feb8ab] px-5 py-4 text-sm font-bold text-[#2c1600]">Continue to send gift 🎁</button>
          <p className="mt-3 text-center text-xs text-[#6c5b50]">You’ll complete your gift by bank transfer.</p>
        </div>
      </div>}

      {toast && <div role="status" className="fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-full bg-[#3b2d25] px-5 py-3 text-center text-sm font-semibold text-white shadow-xl">{toast}</div>}
      <nav className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(env(safe-area-inset-bottom),10px)] sm:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around rounded-full border border-white/80 bg-white/85 px-2 py-2 shadow-xl backdrop-blur-xl">
          {[["🎁","Wishes","#wishlist"],["🏦","Gifts","#bank-transfer"],["♡","Guestbook","#guestbook"]].map(([icon,label,href])=><a key={label} href={href} className="flex min-w-[76px] flex-col items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-[#7d562d]"><span className="text-lg">{icon}</span>{label}</a>)}
        </div>
      </nav>
    </main>
  );
}

function AccountCard({bank,initials,account,accountName,primary,onCopy}:{bank:string;initials:string;account:string;accountName:string;primary?:boolean;onCopy:(account:string)=>void}) {
  return <div className="rounded-2xl bg-[#fff1ea] p-4"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#d4a373]/30 text-xs font-extrabold text-[#7d562d]">{initials}</span><div><p className="text-sm font-bold">{bank}</p><p className="text-xs text-[#6c5b50]">Account holder: {accountName}</p></div></div>{primary&&<span className="rounded-full bg-[#ffdad3] px-2 py-1 text-[10px] font-bold text-[#6a3930]">Primary</span>}</div><div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-white p-3"><span className="font-mono text-lg font-bold tracking-wider sm:text-xl">{account}</span><button onClick={()=>onCopy(account)} className="rounded-full bg-[#d4a373] px-4 py-2 text-xs font-bold text-[#2c1600]">Copy</button></div></div>;
}
