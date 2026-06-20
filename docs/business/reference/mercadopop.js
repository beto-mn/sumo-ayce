/* DIRECCIÓN A — MERCADO POP · app vanilla, hash routing, ES/EN */
(function(){
  const S=window.SUMO, C=window.SC;
  const app=document.getElementById("app");

  // copy local bilingüe
  const COPY={
    es:{ heroK:"Come sin límites · Estilo americano-japonés", heroH:"All You Can<br>Eat", heroP:"Rolls, ramen, teppanyaki y smash burgers — ilimitados por un precio fijo. Llega con hambre, vete feliz.",
      typesTitle:"Elige tu SUMO", typesSub:"Dos formatos, la misma garantía SUMO.",
      featTitle:"Antojos del momento", featSub:"Una probadita de lo que te espera en el All You Can Eat.",
      promosTitle:"Esta semana en SUMO", reserve:"Reservar mesa",
      promos:[["MARTES","2×1 en Ramen","El segundo ramen va por nuestra cuenta, toda la noche.","var(--orange)"],
              ["CUMPLE","El festejado come gratis","Trae a 4+ y tu AYCE es cortesía. Solo tu ID.","var(--pink)"],
              ["KIDS","Niños al 50%","Menores de 10 pagan mitad. Lun a vie.","var(--blue)"]],
      sucTease:"10 sucursales en CDMX y Edomex", sucCta:"Encuentra la tuya", menuTitle:"El menú", drinksTitle:"Bebidas",
      footTag:"El mejor all you can eat estilo americano-japonés." },
    en:{ heroK:"Eat without limits · American-Japanese style", heroH:"All You Can<br>Eat", heroP:"Rolls, ramen, teppanyaki and smash burgers — unlimited for one fixed price. Come hungry, leave happy.",
      typesTitle:"Pick your SUMO", typesSub:"Two formats, the same SUMO guarantee.",
      featTitle:"Cravings right now", featSub:"A taste of what's waiting at the all you can eat.",
      promosTitle:"This week at SUMO", reserve:"Book a table",
      promos:[["TUESDAY","2-for-1 Ramen","Your second ramen is on us, all night.","var(--orange)"],
              ["BIRTHDAY","Guest of honor eats free","Bring 4+ and your AYCE is free. Just your ID.","var(--pink)"],
              ["KIDS","Kids 50% off","Under 10 pay half. Mon–Fri.","var(--blue)"]],
      sucTease:"10 locations across Mexico City", sucCta:"Find yours", menuTitle:"The menu", drinksTitle:"Drinks",
      footTag:"The best all-you-can-eat Japanese food." }
  };
  const cp=()=>COPY[C.lang()];

  // estado
  let st={ route:hashRoute(), type:"ayce", modality:"buffet", cat:null, user:null };
  function hashRoute(){ const h=location.hash.replace(/^#\/?/,""); return ["menu","promos","sucursales","contacto"].includes(h)?h:"home"; }

  /* ---------- NAV + shell ---------- */
  function nav(){
    const L=C.L(), on=k=>st.route===k?"true":"false";
    return `<header class="nav"><div class="nav__in">
      <a href="#/" aria-label="SUMO"><img class="nav__logo" src="uploads/SUMO_H.svg" alt="SUMO"></a>
      <div class="nav__links">
        <a href="#/" data-on="${on('home')}">${L.nav.home}</a>
        <a href="#/menu" data-on="${on('menu')}">${L.nav.menu}</a>
        <a href="#/promos" data-on="${on('promos')}">${L.nav.promos}</a>
        <a href="#/sucursales" data-on="${on('sucursales')}">${L.nav.branches}</a>
        <a href="#/contacto" data-on="${on('contacto')}">${L.nav.contact}</a>
      </div>
      <button class="lang" data-act="lang" title="Idioma">${L.lang}</button>
      <button class="btn btn--p btn--sm" data-act="reservar">${L.cta_reserve}</button>
      <button class="burger" data-act="drawer" aria-label="Menú">≡</button>
    </div></header>`;
  }
  function drawer(){ const L=C.L();
    return `<div class="drawer-bg" data-act="closeDrawer"></div><aside class="drawer" id="drawer">
      <button class="btn btn--sm" data-act="closeDrawer" style="align-self:flex-end">✕</button>
      <a href="#/" data-act="closeDrawer">${L.nav.home}</a>
      <a href="#/menu" data-act="closeDrawer">${L.nav.menu}</a>
      <a href="#/promos" data-act="closeDrawer">${L.nav.promos}</a>
      <a href="#/sucursales" data-act="closeDrawer">${L.nav.branches}</a>
      <a href="#/contacto" data-act="closeDrawer">${L.nav.contact}</a>
      <button class="btn btn--p" data-act="reservar">${L.cta_reserve}</button>
    </aside>`; }

  function footer(){ const L=C.L(),c=cp();
    return `<footer class="foot"><div class="wrap">
      <div class="foot__cols">
        <div><img src="uploads/SUMO_H.svg" alt="SUMO" style="height:46px;background:#000;border-radius:12px;padding:8px 12px">
          <p style="margin-top:14px;max-width:260px;color:var(--bg2)">${c.footTag}</p></div>
        <div><h4>${L.nav.menu}</h4><a href="#/menu">${L.buffet}</a><a href="#/menu">${L.carta}</a><a href="#/menu">${C.tx(S.cats.bebidas)}</a></div>
        <div><h4>SUMO</h4><a href="#/sucursales">${L.nav.branches}</a><a href="#/contacto">${L.nav.contact}</a><a href="${C.wa('Hola SUMO')}" target="_blank" rel="noreferrer">WhatsApp</a></div>
        <div><h4>${C.lang()==='es'?'Síguenos':'Follow us'}</h4>
          <div style="display:flex;gap:10px;margin-top:6px">
            <a class="btn btn--sm" href="#" style="background:var(--yellow)">Instagram</a>
            <a class="btn btn--sm" href="#" style="background:var(--yellow)">TikTok</a></div></div>
      </div>
      <p style="margin-top:36px;color:var(--bg2);font-size:13px">© ${new Date().getFullYear()} SUMO All You Can Eat · CDMX y Edomex</p>
    </div></footer>`; }

  /* ---------- HOME ---------- */
  function home(){ const L=C.L(),c=cp();
    const feat=["burger_clasica","roll_white_dragon","ramen","roll_tempura","spicy_smash","gohan_especial"];
    const featData=[]; // pull from menus
    S.menus.ayce.buffet.forEach(sec=>{ (sec.items||[]).forEach(it=>{ if(it.img&&feat.some(f=>it.img.includes(f))) featData.push(it); }); });
    return `${marquee()}
    <section class="hero"><div class="wrap"><div class="hero__in">
      <div class="r in">
        <span class="kicker">${c.heroK}</span>
        <h1 class="h-xl" style="margin-top:16px">${c.heroH}</h1>
        <p class="lead" style="margin-top:18px">${c.heroP}</p>
        <div style="display:flex;gap:12px;margin-top:26px;flex-wrap:wrap">
          <a class="btn btn--p btn--lg" href="#/menu">${L.cta_menu}</a>
          <a class="btn btn--lg" href="#/sucursales">${L.cta_branches}</a>
        </div>
      </div>
      <div class="hero__media r in">
        <div class="hero__frame" style="background:#1A1209;display:flex;align-items:center;justify-content:center;aspect-ratio:1/1;padding:18%;overflow:hidden"><img src="uploads/SUMO_V.svg" alt="SUMO" style="display:block;width:auto;height:auto;max-width:100%;max-height:100%;aspect-ratio:auto;object-fit:contain"></div>
        <div class="price-sticker">${L.price_all}<b>$${S.price_buffet}</b>${L.everyday}</div>
      </div>
    </div></div></section>

    <section class="section"><div class="wrap">
      <span class="kicker">${c.typesTitle}</span>
      <h2 class="h-lg r" style="margin:14px 0 6px">${c.typesSub}</h2>
      <div class="types" style="margin-top:26px">
        ${["ayce","express"].map(t=>{const ti=S.typeInfo[t];return `
          <a class="type-card r" href="#/menu" data-type="${t}">
            <span class="dot" style="background:${ti.accent}"></span>
            <span class="tag-type" style="background:${ti.accent}">${C.tx(ti.tag)}</span>
            <h3 style="margin-top:12px">${ti.name}</h3>
            <p style="color:var(--soft);margin-top:8px">${C.tx(ti.blurb)}</p>
            <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
              ${ti.modalities.map(m=>`<span class="chip" data-on="false">${m==='buffet'?L.buffet:L.carta}</span>`).join("")}
            </div>
            <div class="btn btn--ink btn--sm" style="margin-top:18px">${L.cta_menu} →</div>
          </a>`;}).join("")}
      </div>
    </div></section>

    <section class="section" style="background:var(--bg2);border-block:3px solid var(--ink)">
      <div class="wrap"><span class="kicker" style="background:var(--orange);color:#fff">${c.featTitle}</span>
      <h2 class="h-lg r" style="margin:14px 0 6px">${c.featSub}</h2></div>
      <div class="rail" style="margin-top:20px">
        ${featData.slice(0,8).map(it=>dishCard(it)).join("")}
      </div>
    </section>

    ${promosHome()}
    ${reviewsHome()}

    <section class="section" style="padding-top:0"><div class="wrap">
      <div class="card r" style="display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;background:var(--ink);color:var(--bg)">
        <div><h2 class="h-lg" style="color:var(--bg)">${c.sucTease}</h2></div>
        <a class="btn btn--p btn--lg" href="#/sucursales">${c.sucCta} →</a>
      </div>
    </div></section>`;
  }
  function marquee(){ const items=C.lang()==='es'?["Sushi ilimitado","Ramen 12 h de caldo","Teppanyaki en vivo","Smash burgers","$269 todos los días"]:["Unlimited sushi","12-hour ramen broth","Live teppanyaki","Smash burgers","$269 every day"];
    const row=[...items,...items].map(t=>`${t} <span style="color:var(--orange)">✺</span>`).join(" &nbsp; ");
    return `<div class="marq"><div class="marq__t">${row} &nbsp; ${row}</div></div>`; }
  function dishCard(it){ return `<article class="dish"><img class="dish__img" src="${it.img}" alt="${C.esc(it.name)}" loading="lazy">
    <div class="dish__b"><h4>${C.esc(it.name)}</h4><p>${C.esc(C.dishDesc(it))}</p></div></article>`; }

  /* ---------- MENU ---------- */
  function menu(){ const L=C.L(),c=cp();
    const ti=S.typeInfo[st.type];
    document.documentElement.style.setProperty("--accent", ti.accent);
    if(st.type==="express") st.modality="buffet";
    const sections=S.menus[st.type][st.modality];
    if(!st.cat||!sections.some(s=>s.cat===st.cat)) st.cat=sections[0].cat;
    const active=sections.find(s=>s.cat===st.cat);
    return `<section class="section"><div class="wrap">
      <span class="kicker" style="background:${ti.accent};color:#fff">${c.menuTitle}</span>
      <h1 class="h-lg r" style="margin:14px 0 8px">${ti.name}</h1>
      <p class="lead r">${L.menu_intro}</p>

      <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-top:42px">
        <div class="seg">${["ayce","express"].map(t=>`<button data-act="type" data-type="${t}" data-on="${st.type===t}">${S.typeInfo[t].name}</button>`).join("")}</div>
        ${st.type==="ayce"?`<div class="seg">${["buffet","carta"].map(m=>`<button data-act="mod" data-mod="${m}" data-on="${st.modality===m}">${m==='buffet'?L.buffet:L.carta}</button>`).join("")}</div>`:""}
        ${st.type==="ayce"?`<span class="price-tag" style="font-family:var(--disp);font-weight:800;white-space:nowrap;background:var(--ink);color:var(--bg);-webkit-text-fill-color:var(--bg);padding:8px 14px;border-radius:999px">${st.modality==='buffet'?'$'+S.price_buffet+' '+L.price_all:L.carta}</span>`:`<span style="font-family:var(--disp);font-weight:800;white-space:nowrap;background:var(--ink);color:var(--bg);-webkit-text-fill-color:var(--bg);padding:8px 14px;border-radius:999px">$${S.price_buffet} ${L.price_all}</span>`}
        <button class="btn btn--sm" data-act="poster" style="margin-left:auto">${C.lang()==='es'?'Ver carta completa':'Full menu'}</button>
      </div>

      <div class="catnav">${sections.map(s=>`<button class="chip" data-act="cat" data-cat="${s.cat}" data-on="${st.cat===s.cat}">${C.catName(s.cat)}</button>`).join("")}</div>

      ${st.modality==="carta"?`<p class="r" style="margin-top:14px;color:var(--soft);font-weight:600">★ ${L.carta_pending}</p>`:""}

      <div id="menu-body">${menuBody(active,L)}</div>
    </div></section>${st.lb?lightbox():""}`;
  }
  function lightbox(){ const imgs=S.posters[st.type]||S.posters.ayce;
    return `<div class="modal-bg" data-act="closeLb" style="z-index:110"><div style="display:flex;flex-direction:column;gap:10px;max-height:92vh;overflow:auto">${imgs.map(s=>`<img src="${s}" alt="carta" style="max-width:min(900px,92vw);border:var(--bd);border-radius:var(--r-sm)">`).join("")}</div></div>`; }
  function menuBody(sec,L){
    if(sec.bebidas){ return SC.bev({grid:'extras-list'}); }
    
    if(sec.salsas){ return SC.sauces({noteClass:'r'}); }
    if(sec.extras){ return `<div class="extras-list">${sec.extras.map(e=>`<div class="extra-row r"><span>${e.name} <small style="color:var(--soft)">${e.g}</small></span><b style="color:var(--accent)">$${e.price}</b></div>`).join("")}</div>`; }
    const items=sec.items||[];
    return `<div class="menu-grid">${items.map(it=>menuItem(it)).join("")}</div>`+(sec.cat==='alitas'?SC.sauces():"");
  }
  function menuItem(it){
    const img= it.img? `<img class="mitem__img" src="${it.img}" alt="${C.esc(it.name)}" loading="lazy">` : `<div class="mitem__ph">🍱</div>`;
    const price= it.price!=null? `<div class="mitem__price">$${it.price}</div>` : (st.modality==='buffet'? `<div class="mitem__price" style="color:var(--soft);font-size:14px">${C.L().free}</div>`:"");
    const badge= it.badge? `<span class="badge-mini">${it.badge}</span>`:"";
    return `<article class="mitem r">${img}<div class="mitem__b">${badge}<h4>${C.esc(it.name)}</h4><p>${C.esc(C.dishDesc(it))}</p>${price}</div></article>`;
  }

  /* ---------- SUCURSALES ---------- */
  function suc(){ const L=C.L();
    return `<section class="section"><div class="wrap">
      <span class="kicker">${L.nav.branches}</span>
      <h1 class="h-lg r" style="margin:14px 0 8px">${L.find_branch}</h1>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:26px">
        <button class="btn btn--p btn--sm" data-act="geo">📍 ${L.use_location}</button>
        <form data-act="cpform" style="display:flex;gap:8px"><input id="cp" inputmode="numeric" placeholder="${L.search_cp}" style="border:2.5px solid var(--ink);border-radius:999px;padding:9px 16px;font:inherit;width:150px"><button class="btn btn--sm" type="submit">${L.search}</button></form>
        <div class="seg" style="margin-left:auto">${[["all",C.lang()==='es'?"Todas":"All"],["ayce","AYCE"],["express","Express"]].map(([v,lab])=>`<button data-act="ftype" data-v="${v}" data-on="${(st.ftype||'all')===v}">${lab}</button>`).join("")}</div>
      </div>
      <div class="suc-grid"><div class="map" id="map"></div><div class="suc-list" id="suclist"></div></div>
    </div></section>`;
  }
  function renderSuc(){
    const ftype=st.ftype||"all";
    let list=S.branches.filter(b=>ftype==="all"||b.type===ftype);
    if(st.user) list=list.map(b=>({...b,d:C.dist(st.user,b)})).sort((a,b)=>a.d-b.d);
    // map bounds
    const pts=[...list,...(st.user?[st.user]:[])], lats=pts.map(p=>p.lat),lngs=pts.map(p=>p.lng),pad=.04;
    const mnLa=Math.min(...lats)-pad,mxLa=Math.max(...lats)+pad,mnLn=Math.min(...lngs)-pad,mxLn=Math.max(...lngs)+pad;
    const px=ln=>(ln-mnLn)/(mxLn-mnLn)*100, py=la=>(1-(la-mnLa)/(mxLa-mnLa))*100;
    const map=document.getElementById("map"); if(map){ map.innerHTML=
      (st.user?`<div class="userdot" style="left:${px(st.user.lng)}%;top:${py(st.user.lat)}%"></div>`:"")+
      list.map((b,i)=>`<button class="pin" data-jump="${b.id}" title="${b.name}" style="left:${px(b.lng)}%;top:${py(b.lat)}%;background:${S.typeInfo[b.type].accent};color:#fff">${i===0&&st.user?"★":"🍣"}</button>`).join(""); }
    const sl=document.getElementById("suclist"); if(sl){ const L=C.L(); sl.innerHTML=list.map((b,i)=>{
      const ti=S.typeInfo[b.type];
      return `<article class="suc-card" id="b-${b.id}" style="${i===0&&st.user?'border-width:4px':''}">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
          <div><span class="tag-type" style="background:${ti.accent}">${ti.name}</span>
          <h3 style="font-size:22px;margin-top:8px">${b.name}</h3>
          <p style="color:var(--soft);font-size:14px;margin-top:4px">${b.addr}</p></div>
          ${b.d!=null?`<span class="chip" data-on="false" style="white-space:nowrap">${b.d<1?Math.round(b.d*1000)+" m":b.d.toFixed(1)+" km"}</span>`:""}
        </div>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
          <button class="btn btn--sm btn--p" data-act="reservar" data-branch="${b.id}">${L.cta_reserve}</button>
          <a class="btn btn--sm" href="https://maps.google.com/?q=${encodeURIComponent('SUMO '+b.name+' '+b.addr)}" target="_blank" rel="noreferrer">${L.how_get}</a>
          <a class="btn btn--sm" href="tel:${b.phone.replace(/\s/g,'')}">${L.call}</a>
        </div></article>`;}).join(""); }
  }

  /* ---------- CONTACTO ---------- */
  function contacto(){ const L=C.L();
    return `<section class="section"><div class="wrap" style="max-width:900px">
      <span class="kicker" style="background:var(--pink);color:#fff">${L.nav.contact}</span>
      <h1 class="h-lg r" style="margin:14px 0 8px">${L.contact_title}</h1>
      <p class="lead r">${L.contact_sub}</p>
      <div class="grid" style="grid-template-columns:1.2fr .8fr;gap:24px;margin-top:26px">
        <form class="card r" data-act="contactform">
          <div class="field"><label>${L.name}</label><input name="name" required placeholder="${L.name}"></div>
          <div class="field"><label>${L.phone}</label><input name="phone" inputmode="tel" placeholder="55 1234 5678"></div>
          <div class="field"><label>${L.pick_branch}</label><select name="branch" required><option value="" disabled selected>${L.any_branch}</option>${S.branches.map(b=>`<option value="${b.id}">${b.name} — ${S.typeInfo[b.type].name}</option>`).join("")}</select></div>
          <div class="field"><label>${L.message}</label><textarea name="msg" rows="3" placeholder="..."></textarea></div>
          <button class="btn btn--p btn--lg" type="submit" style="width:100%">${L.send}</button>
        </form>
        <div class="card r" style="display:flex;flex-direction:column;gap:14px">
          <div><h4 style="font-family:var(--disp);font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--soft)">WhatsApp</h4>
            <a class="btn btn--ink btn--sm" href="${C.wa('Hola SUMO 🍣')}" target="_blank" rel="noreferrer" style="margin-top:8px">+52 55 0000 0000</a></div>
          <div><h4 style="font-family:var(--disp);font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--soft)">Email</h4>
            <a href="mailto:hola@sumo.com.mx">hola@sumo.com.mx</a></div>
          <div><h4 style="font-family:var(--disp);font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--soft)">${C.lang()==='es'?'Redes':'Social'}</h4>
            <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><a class="chip" href="#">Instagram</a><a class="chip" href="#">Facebook</a><a class="chip" href="#">TikTok</a></div></div>
        </div>
      </div>
    </div></section>`;
  }

  /* ---------- PROMOS (home teaser + página CRUD) ---------- */
  function colorVar(c){ return {orange:"var(--orange)",pink:"var(--pink)",blue:"var(--blue)",yellow:"var(--yellow)"}[c]||"var(--orange)"; }
  function promoCard(p, admin){ const L=C.L(); const col=colorVar(p.color);
    const tag = p.type!=="all"? `<span class="tag-type" style="background:${S.typeInfo[p.type].accent};display:inline-block;margin-bottom:6px">${S.typeInfo[p.type].name}</span>`:"";
    return `<div class="card r" style="position:relative;${p.active?'':'opacity:.5'}">
      <span class="sticker" style="top:-14px;right:14px;background:${col};color:${p.color==='yellow'?'var(--ink)':'#fff'}">${C.tx(p.badge)}</span>
      ${tag}
      <h3 style="font-size:25px;margin-top:6px">${C.tx(p.title)}</h3>
      <p style="color:var(--soft);margin-top:10px">${C.tx(p.desc)}</p>
      <p style="margin-top:12px;font-weight:700;font-size:13px;color:var(--ink)">${L.valid}: <span style="color:var(--soft)">${C.tx(p.validity)}</span></p>
      ${admin?`<div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
        <button class="btn btn--sm" data-act="promoEdit" data-id="${p.id}">${L.admin_edit}</button>
        <button class="btn btn--sm" data-act="promoToggle" data-id="${p.id}">${p.active?L.promo_inactive:L.promo_active}</button>
        <button class="btn btn--sm" data-act="promoDel" data-id="${p.id}" style="background:#ffdede">${L.admin_del}</button></div>`:""}
    </div>`; }
  function promosHome(){ const L=C.L(); const list=C.promos.all().filter(p=>p.active).slice(0,3);
    return `<section class="section"><div class="wrap">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap">
        <span class="kicker" style="background:var(--pink);color:#fff">${L.promos_title}</span>
        <a class="btn btn--sm" href="#/promos">${L.promo_all} →</a></div>
      <div class="grid cards-3" style="margin-top:24px">${list.map(p=>promoCard(p,false)).join("")}</div>
    </div></section>`; }
  function reviewsHome(){ const L=C.L();
    return `<section class="section" style="background:var(--bg2);border-block:3px solid var(--ink)"><div class="wrap">
      <span class="kicker" style="background:#4285F4;color:#fff">★ ${L.reviews_title}</span>
      <h2 class="h-lg r" style="margin:14px 0 6px">${L.reviews_sub}</h2>
      <div class="grid cards-3" style="margin-top:24px">
        ${S.reviews.slice(0,6).map(rv=>`<figure class="card r" style="margin:0;display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:#FBBC05;-webkit-text-fill-color:#FBBC05;font-size:18px;letter-spacing:2px">${"★".repeat(rv.stars)}</span>
            <span class="badge-mini" style="background:#fff;transform:none">Google</span></div>
          <blockquote style="margin:0;font-size:15.5px;line-height:1.5">“${C.esc(C.dishDesc(rv))}”</blockquote>
          <figcaption style="margin-top:auto;display:flex;align-items:center;gap:10px;padding-top:6px">
            <span style="width:38px;height:38px;flex:0 0 auto;border-radius:50%;background:var(--orange);color:#fff;-webkit-text-fill-color:#fff;display:grid;place-items:center;font-family:var(--disp);font-weight:800">${rv.author[0]}</span>
            <span><b style="display:block;font-size:14px">${rv.author}</b><span style="color:var(--soft);font-size:12px">SUMO ${rv.branch}</span></span>
          </figcaption></figure>`).join("")}
      </div></div></section>`; }

  function promos(){ const L=C.L(); const list=C.promos.all(); const admin=st.admin;
    return `<section class="section"><div class="wrap">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:260px"><span class="kicker" style="background:var(--pink);color:#fff">${L.promos_title}</span>
          <h1 class="h-lg r" style="margin:14px 0 8px">${L.promos_title}</h1>
          <p class="lead r">${L.promos_sub}</p></div>
      </div>
      ${admin?`<div class="card r" style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:var(--bg2)">
        <button class="btn btn--p btn--sm" data-act="promoNew">${L.admin_add}</button>
        <button class="btn btn--sm" data-act="promoReset">${L.admin_reset}</button>
        <span style="color:var(--soft);font-size:13px">${L.admin_note}</span></div>`:""}
      <div class="grid cards-3" style="margin-top:26px">${list.map(p=>promoCard(p,admin)).join("")}</div>
    </div></section>${promoModal()}`; }
  function promoModal(){ if(!st.editing) return ""; const L=C.L(); const lng=C.lang();
    const p = st.editing==="new"? {badge:{},title:{},desc:{},validity:{},color:"orange",type:"all",active:true} : (C.promos.get(st.editing)||{});
    const v=o=>o&&o[lng]!=null?o[lng]:((o&&o.es)||"");
    return `<div class="modal-bg" data-act="closeModal"><form class="modal-card" data-act="promoSave" id="promoForm">
      <h3 style="font-size:24px;margin-bottom:8px">${st.editing==="new"?L.admin_add:L.admin_edit}</h3>
      <div class="field"><label>Badge</label><input name="badge" value="${C.esc(v(p.badge))}" maxlength="14" required></div>
      <div class="field"><label>${lng==='es'?'Título':'Title'}</label><input name="title" value="${C.esc(v(p.title))}" required></div>
      <div class="field"><label>${lng==='es'?'Descripción':'Description'}</label><textarea name="desc" rows="2">${C.esc(v(p.desc))}</textarea></div>
      <div class="field"><label>${L.valid}</label><input name="validity" value="${C.esc(v(p.validity))}"></div>
      <div style="display:flex;gap:12px">
        <div class="field" style="flex:1"><label>Color</label><select name="color">${["orange","pink","blue","yellow"].map(c=>`<option ${p.color===c?'selected':''}>${c}</option>`).join("")}</select></div>
        <div class="field" style="flex:1"><label>${L.branch_type}</label><select name="type"><option value="all" ${p.type==='all'?'selected':''}>${L.promo_all}</option><option value="ayce" ${p.type==='ayce'?'selected':''}>AYCE</option><option value="express" ${p.type==='express'?'selected':''}>Express</option></select></div>
      </div>
      <label style="display:flex;gap:8px;align-items:center;font-weight:700;margin:8px 0"><input type="checkbox" name="active" ${p.active?'checked':''}> ${L.promo_active}</label>
      <div style="display:flex;gap:10px;margin-top:8px">
        <button type="button" class="btn btn--sm" data-act="closeModal">${L.admin_cancel}</button>
        <button type="submit" class="btn btn--p btn--sm" style="flex:1">${L.admin_save}</button></div>
    </form></div>`; }

  /* ---------- render ---------- */
  function render(){
    st.route=hashRoute();
    let body="";
    if(st.route==="home") body=home();
    else if(st.route==="menu") body=menu();
    else if(st.route==="promos") body=promos();
    else if(st.route==="sucursales") body=suc();
    else if(st.route==="contacto") body=contacto();
    if(st.route!=="menu") document.documentElement.style.setProperty("--accent","var(--orange)");
    app.innerHTML=`<div class="app">${nav()}<main>${body}</main>${footer()}${drawer()}${resModal()}</div>`;
    if(st.route==="sucursales") renderSuc();
    reveal();
    window.scrollTo(0,0);
  }
  function reveal(){ const els=app.querySelectorAll(".r:not(.in)");
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}}),{threshold:.12});
    const vh=innerHeight; els.forEach(el=>{ const r=el.getBoundingClientRect(); if(r.top<vh*.92){el.classList.add("in");} else io.observe(el); }); }

  /* ---------- eventos ---------- */
  function resModal(){ if(!st.reserva) return ""; const L=C.L(); const r=st.reserva;
    const b=S.branches.find(x=>x.id===(r.branch||S.branches[0].id))||S.branches[0];
    if(r.done){ return `<div class="modal-bg" data-act="closeRes"><div class="modal-card" id="resCard">
      <div style="width:52px;height:52px;border-radius:50%;background:var(--green);color:#fff;-webkit-text-fill-color:#fff;display:grid;place-items:center;font-size:26px;margin-bottom:10px">✓</div>
      <h3 style="font-size:26px">${L.r_ok_title}</h3><p class="muted" style="margin-top:8px">${L.r_ok_msg}</p>
      <div style="border:2px solid var(--ink);border-radius:14px;margin-top:16px;padding:14px"><b style="font-family:var(--disp)">SUMO ${b.name}</b><br><span class="muted" style="font-size:14px">${r.sum}</span></div>
      <a class="btn btn--p" href="${r.link}" target="_blank" rel="noreferrer" style="width:100%;margin-top:16px">${L.r_open}</a>
      <div style="display:flex;gap:10px;margin-top:10px"><button class="btn btn--sm" data-act="resAnother">${L.r_another}</button><button class="btn btn--sm" data-act="closeRes" style="flex:1">${L.admin_cancel}</button></div>
    </div></div>`; }
    const d=r.draft||{}; const sl=C.slots(b); const today=new Date().toISOString().slice(0,10); const def=d.date||new Date(Date.now()+864e5).toISOString().slice(0,10);
    return `<div class="modal-bg" data-act="closeRes"><form class="modal-card" data-act="resSubmit" id="resForm">
      <span class="kicker">${L.cta_reserve}</span>
      <h3 style="font-size:27px;margin:10px 0 4px">${L.r_title}</h3><p class="muted" style="font-size:14.5px">${L.r_sub}</p>
      <div class="field" style="margin-top:14px"><label>${L.pick_branch}</label><select name="branch" data-act="resBranch">${S.branches.map(x=>`<option value="${x.id}" ${x.id===b.id?'selected':''}>${x.name} — ${S.typeInfo[x.type].name}</option>`).join("")}</select></div>
      <p class="muted" style="font-size:13px;margin:-4px 0 6px">🕒 ${L.r_hours}: ${C.hoursLabel(b)}</p>
      <div style="display:flex;gap:12px"><div class="field" style="flex:1"><label>${L.r_date}</label><input type="date" name="date" min="${today}" value="${def}" required></div>
        <div class="field" style="flex:1"><label>${L.r_people}</label><select name="people">${[1,2,3,4,5,6,7,8].map(n=>`<option ${(d.people||4)==n?'selected':''}>${n}${n===8?'+':''}</option>`).join("")}</select></div></div>
      <div class="field"><label>${L.r_time}</label><select name="time" required>${sl.map(s=>`<option ${d.time===s?'selected':''}>${s}</option>`).join("")}</select></div>
      <div class="field"><label>${L.name}</label><input name="name" value="${C.esc(d.name||'')}" required placeholder="${L.name}"></div>
      <div class="field"><label>${L.phone}</label><input name="phone" value="${C.esc(d.phone||'')}" inputmode="tel" placeholder="55 1234 5678" required></div>
      <div style="display:flex;gap:10px;margin-top:6px"><button type="button" class="btn btn--sm" data-act="closeRes">${L.admin_cancel}</button><button type="submit" class="btn btn--p" style="flex:1">${L.r_confirm}</button></div>
    </form></div>`; }

  document.addEventListener("click",e=>{
    const a=e.target.closest("[data-act]"); 
    const jump=e.target.closest("[data-jump]");
    const typeLink=e.target.closest("[data-type][href]");
    if(typeLink){ st.type=typeLink.getAttribute("data-type"); st.cat=null; }
    if(jump){ const el=document.getElementById("b-"+jump.getAttribute("data-jump")); if(el){el.scrollIntoView({behavior:"smooth",block:"center"}); el.animate([{transform:"scale(1)"},{transform:"scale(1.03)"},{transform:"scale(1)"}],{duration:400});} return; }
    if(!a) return;
    const act=a.getAttribute("data-act");
    if(act==="lang"){ C.toggleLang(); return; }
    if(act==="drawer"){ document.getElementById("drawer").classList.add("open"); document.querySelector(".drawer-bg").classList.add("open"); }
    if(act==="closeDrawer"){ const d=document.getElementById("drawer"); if(d)d.classList.remove("open"); const bg=document.querySelector(".drawer-bg"); if(bg)bg.classList.remove("open"); }
    if(act==="type"){ st.type=a.getAttribute("data-type"); st.cat=null; render(); }
    if(act==="mod"){ st.modality=a.getAttribute("data-mod"); st.cat=null; render(); }
    if(act==="cat"){ st.cat=a.getAttribute("data-cat"); const sections=S.menus[st.type][st.modality]; const active=sections.find(s=>s.cat===st.cat);
        document.querySelectorAll("[data-act=cat]").forEach(c=>c.setAttribute("data-on", c.getAttribute("data-cat")===st.cat));
        document.getElementById("menu-body").innerHTML=menuBody(active,C.L()); reveal(); }
    if(act==="geo"){ C.geolocate().then(u=>{st.user=u;renderSuc();}).catch(()=>{ alert(C.lang()==='es'?"No pudimos obtener tu ubicación. Busca por C.P.":"Couldn't get your location. Search by ZIP."); }); }
    if(act==="ftype"){ st.ftype=a.getAttribute("data-v"); render(); }
    if(act==="adminToggle"){ st.admin=!st.admin; st.editing=null; render(); }
    if(act==="promoNew"){ st.editing="new"; render(); }
    if(act==="promoEdit"){ st.editing=a.getAttribute("data-id"); render(); }
    if(act==="promoDel"){ const id=a.getAttribute("data-id"); if(confirm(C.lang()==='es'?'¿Eliminar esta promoción?':'Delete this deal?')){ C.promos.remove(id); render(); } }
    if(act==="promoToggle"){ const id=a.getAttribute("data-id"); const p=C.promos.get(id); C.promos.update(id,{active:!p.active}); render(); }
    if(act==="promoReset"){ if(confirm(C.lang()==='es'?'¿Restablecer las promociones de ejemplo?':'Reset sample deals?')){ C.promos.reset(); render(); } }
    if(act==="closeModal"){ st.editing=null; render(); }
    if(act==="reservar"){ st.reserva={branch:a.getAttribute("data-branch")||null,done:false,draft:null}; render(); }
    if(act==="poster"){ st.lb=true; render(); }
    if(act==="closeLb"){ st.lb=false; render(); }
    if(act==="closeRes"){ st.reserva=null; render(); }
    if(act==="resAnother"){ st.reserva={branch:st.reserva&&st.reserva.branch,done:false,draft:null}; render(); }
  });
  document.addEventListener("change",e=>{ const s=e.target.closest("[data-act=resBranch]"); if(!s||!st.reserva)return; const fm=document.getElementById("resForm"); if(fm){ const fd=new FormData(fm); st.reserva.draft={date:fd.get('date'),people:fd.get('people'),time:fd.get('time'),name:fd.get('name'),phone:fd.get('phone')}; } st.reserva.branch=s.value; render(); });
  document.addEventListener("submit",e=>{
    const f=e.target.closest("[data-act]"); if(!f) return; const act=f.getAttribute("data-act"); e.preventDefault();
    if(act==="cpform"){ const v=(document.getElementById("cp").value||"").replace(/\D/g,"").slice(0,5); if(v.length>=4){ st.user=C.cpToPoint(v); renderSuc(); } }
    if(act==="contactform"){ const fd=new FormData(f); const b=S.branches.find(x=>x.id===fd.get('branch')); if(!b){ alert(C.lang()==='es'?'Elige una sucursal':'Pick a location'); return; }
      const greet=C.lang()==='es'?`¡Hola SUMO ${b.name}! Soy ${fd.get('name')||''}.`:`Hi SUMO ${b.name}! I'm ${fd.get('name')||''}.`;
      const msg=`${greet}${fd.get('msg')?"\n"+fd.get('msg'):''}`; window.open(C.waBranch(b,msg),"_blank"); }
    if(act==="promoSave"){ const fd=new FormData(f); const mirror=val=>({es:val,en:val});
      const data={ badge:mirror(fd.get('badge')||''), title:mirror(fd.get('title')||''), desc:mirror(fd.get('desc')||''), validity:mirror(fd.get('validity')||''), color:fd.get('color')||'orange', type:fd.get('type')||'all', active:!!fd.get('active') };
      if(st.editing==="new") C.promos.add(data); else C.promos.update(st.editing,data); st.editing=null; render(); }
    if(act==="resSubmit"){ const fd=new FormData(f); const b=S.branches.find(x=>x.id===fd.get('branch'))||S.branches[0]; const ff={date:fd.get('date'),time:fd.get('time'),people:fd.get('people'),name:fd.get('name'),phone:fd.get('phone')}; const link=C.resLink(b,ff); window.open(link,"_blank"); st.reserva={branch:b.id,done:true,link,sum:`${ff.date} · ${ff.time} · ${ff.people} ${C.lang()==='es'?'personas':'guests'}`}; render(); }
  });
  window.addEventListener("hashchange",render);
  window.addEventListener("sumo:lang",render);
  document.documentElement.setAttribute("lang",C.lang());
  render();
})();
