(() => {
  'use strict';
  const STORAGE_KEY = 'mi_compra_pwa_v1_1';
  const VERSION = 1;
  const SEED = [
    ['Toalla de cocina Stylus','Limpieza y hogar','22x20 cm','Areté',9200,'2026-09-11'],
    ['Ñoquis Quiero Más con papa','Almacén','500 g','Areté',8250,'2026-09-11'],
    ['Corte para guiso','Carnes','Por kg','Areté',45500,'2026-09-11'],
    ['Muslo especial entero','Carnes','Por kg','Areté',25600,'2026-09-11'],
    ['Hamburguesa Concepción So’o','Carnes','Pack x6','Areté',10600,'2026-09-11'],
    ['Carnaza blanca','Carnes','Por kg','Areté',65000,'2026-09-11'],
    ['Alimento para gato Pronto Cat','Mascotas','Por kg','Areté',10600,'2026-09-11'],
    ['Pedigree sachet adulto carne','Mascotas','100 g','Areté',7500,'2026-09-11'],
    ['Pedigree sachet adulto pollo','Mascotas','100 g','Areté',7500,'2026-09-11'],
    ['Fideos Anita Spaghetti Nido','Almacén','400 g','Areté',5300,'2026-09-11'],
    ['Locote verde','Frutas y verduras','Por kg','Areté',22350,'2026-09-11'],
    ['Zanahoria','Frutas y verduras','Por kg','Areté',6950,'2026-09-11'],
    ['Tomate Santa Cruz','Frutas y verduras','Por kg','Areté',14000,'2026-09-11'],
    ['Pan integral para sandwich Bauducco','Panificados','400 g','Areté',11500,'2026-09-11'],
    ['Pan francés','Panificados','Por kg','BOX',8900,'2026-09-11'],
    ['Galletitas saladas Crackers clásica tripack','Almacén','330 g','BOX',8500,'2026-09-11'],
    ['Galletitas surtidas Recreo Gaona','Almacén','300 g','BOX',9900,'2026-09-11'],
    ['Chocolate Cofler Block con maní','Golosinas','300 g','BOX',34900,'2026-09-11'],
    ['Muslo pollo parrillero entero fresco Pimpollo','Carnes','Por kg','BOX',21900,'2026-09-11'],
    ['Queso Danbo feteado Passione','Lácteos y fiambres','Por kg','BOX',42900,'2026-09-11'],
    ['Jamonada feteada OCHSI','Lácteos y fiambres','Por kg','BOX',35900,'2026-09-11'],
    ['Edulcorante líquido Dulzero clásico','Almacén','600 ml','BOX',14500,'2026-09-11'],
    ['Nescafé Tradición Forte','Bebidas','40 g','BOX',13900,'2026-09-11'],
    ['Leche larga vida sin lactosa Lactolanda','Lácteos y fiambres','1 L','BOX',8650,'2026-09-11'],
    ['Bebida láctea natural UAT Som Berg','Lácteos y fiambres','1 L','BOX',5850,'2026-09-11']
  ];

  const $ = id => document.getElementById(id);
  const fmtMoney = n => Number(n) > 0 ? `Gs. ${Math.round(Number(n)).toLocaleString('es-PY')}` : 'Sin precio';
  const today = () => new Date().toISOString().slice(0,10);
  let deferredPrompt = null;
  let toastTimer = null;

  function initialState(){
    return {
      version: VERSION,
      nextId: SEED.length + 1,
      products: SEED.map((r,i) => ({id:i+1,name:r[0],category:r[1],presentation:r[2],preferredStore:r[3],lastPrice:r[4],lastPurchaseDate:r[5],needed:false,bought:false,qtyNeeded:'',notes:'',purchaseCount:1}))
    };
  }
  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return initialState();
      const parsed = JSON.parse(raw);
      if(!parsed || !Array.isArray(parsed.products)) return initialState();
      parsed.nextId = Number(parsed.nextId) || Math.max(0,...parsed.products.map(p=>Number(p.id)||0))+1;
      parsed.products = parsed.products.map(p => ({purchaseCount:0,qtyNeeded:'',notes:'',needed:false,bought:false,...p}));
      return parsed;
    }catch(e){ return initialState(); }
  }
  let state = loadState();
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  function escapeHtml(value){
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }
  function toast(msg){
    const el = $('toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(()=>el.classList.remove('show'),1800);
  }
  function activeItems(){ return state.products.filter(p=>p.needed); }
  function renderStats(){
    const items=activeItems(), bought=items.filter(p=>p.bought).length, total=items.length, pending=total-bought, pct=total?Math.round(bought*100/total):0;
    $('statPending').textContent=pending; $('statBought').textContent=bought; $('statProgress').textContent=`${pct}%`;
    $('progressText').textContent=`${bought} de ${total} comprados`; $('progressPercent').textContent=`${pct}%`; $('progressBar').style.width=`${pct}%`;
  }
  function productCard(p, compact=false){
    const stateClass = p.needed ? (p.bought?'bought needed':'needed') : '';
    const actionText = p.needed ? '✓ En lista' : '+ Me falta';
    const qty = p.qtyNeeded ? ` · ${escapeHtml(p.qtyNeeded)}` : '';
    return `<article class="product-card ${stateClass}" data-id="${p.id}">
      <div class="product-top"><div><span class="badge">${escapeHtml(p.category)}</span><h3>${escapeHtml(p.name)}</h3><div class="meta">${escapeHtml(p.presentation||'')} ${p.preferredStore?`· ${escapeHtml(p.preferredStore)}`:''}${qty}<br>${fmtMoney(p.lastPrice)}</div></div></div>
      <div class="card-actions"><button class="btn ${p.needed?'':'btn-primary'} toggle-needed" type="button">${actionText}</button>${compact?'':`<button class="btn edit-product" type="button">Editar</button>`}</div>
    </article>`;
  }
  function renderHome(){
    const needed=activeItems().filter(p=>!p.bought).slice(0,8);
    $('homeNeeded').innerHTML=needed.length?needed.map(p=>productCard(p,true)).join(''):'<div class="empty">Todavía no marcaste productos. Entrá en Productos y tocá “Me falta”.</div>';
  }
  function renderFilters(){
    const categories=[...new Set(state.products.map(p=>p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
    const stores=[...new Set(state.products.map(p=>p.preferredStore).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
    const oldCat=$('categoryFilter').value, oldStore=$('storeFilter').value;
    $('categoryFilter').innerHTML='<option value="">Todas</option>'+categories.map(x=>`<option>${escapeHtml(x)}</option>`).join('');
    $('storeFilter').innerHTML='<option value="">Todos</option>'+stores.map(x=>`<option>${escapeHtml(x)}</option>`).join('');
    $('categoryFilter').value=categories.includes(oldCat)?oldCat:''; $('storeFilter').value=stores.includes(oldStore)?oldStore:'';
  }
  function renderCatalog(){
    const q=$('searchInput').value.trim().toLocaleLowerCase('es'), cat=$('categoryFilter').value, store=$('storeFilter').value;
    const rows=state.products.filter(p=>(!q||`${p.name} ${p.presentation} ${p.category}`.toLocaleLowerCase('es').includes(q))&&(!cat||p.category===cat)&&(!store||p.preferredStore===store)).sort((a,b)=>a.category.localeCompare(b.category,'es')||a.name.localeCompare(b.name,'es'));
    $('catalogList').innerHTML=rows.length?rows.map(p=>productCard(p)).join(''):'<div class="empty">No hay productos con esos filtros.</div>';
  }
  function shoppingRow(p, bought){
    const qty=p.qtyNeeded?` · ${escapeHtml(p.qtyNeeded)}`:'';
    return `<article class="shopping-row ${bought?'bought':''}" data-id="${p.id}"><div><div class="shopping-name">${escapeHtml(p.name)}</div><div class="shopping-meta">${escapeHtml(p.category)}${qty}${p.preferredStore?` · ${escapeHtml(p.preferredStore)}`:''}</div></div><button class="btn ${bought?'':'btn-primary'} shopping-action" type="button">${bought?'↶ Volver':'✓ Comprado'}</button></article>`;
  }
  function renderShopping(){
    const items=activeItems().sort((a,b)=>a.category.localeCompare(b.category,'es')||a.name.localeCompare(b.name,'es'));
    const pending=items.filter(p=>!p.bought), bought=items.filter(p=>p.bought);
    $('pendingList').innerHTML=pending.length?pending.map(p=>shoppingRow(p,false)).join(''):'<div class="empty">No quedan productos pendientes.</div>';
    $('boughtList').innerHTML=bought.length?bought.map(p=>shoppingRow(p,true)).join(''):'<div class="empty">Todavía no marcaste productos como comprados.</div>';
  }
  function renderAll(){ renderStats(); renderHome(); renderFilters(); renderCatalog(); renderShopping(); }
  function findProduct(id){ return state.products.find(p=>Number(p.id)===Number(id)); }
  function toggleNeeded(id){
    const p=findProduct(id); if(!p)return; p.needed=!p.needed; if(!p.needed)p.bought=false; save(); renderAll(); toast(p.needed?'Agregado a Mi lista':'Quitado de Mi lista');
  }
  function toggleBought(id){
    const p=findProduct(id); if(!p)return; p.needed=true; p.bought=!p.bought; save(); renderAll(); toast(p.bought?'Marcado como comprado':'Devuelto a pendientes');
  }
  function showView(viewId){
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===viewId));
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===viewId));
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function openProductDialog(p=null){
    $('dialogTitle').textContent=p?'Editar producto':'Agregar producto'; $('editId').value=p?.id||''; $('nameInput').value=p?.name||''; $('categoryInput').value=p?.category||'Otros'; $('presentationInput').value=p?.presentation||''; $('preferredStoreInput').value=p?.preferredStore||''; $('priceInput').value=p?.lastPrice||''; $('qtyInput').value=p?.qtyNeeded||''; $('notesInput').value=p?.notes||''; $('deleteProductBtn').classList.toggle('hidden',!p); $('productDialog').showModal(); setTimeout(()=>$('nameInput').focus(),30);
  }
  function saveProductFromDialog(){
    const name=$('nameInput').value.trim(), category=$('categoryInput').value.trim()||'Otros'; if(!name){toast('Ingresá el nombre del producto');return;}
    const data={name,category,presentation:$('presentationInput').value.trim(),preferredStore:$('preferredStoreInput').value.trim(),lastPrice:Math.max(0,Number($('priceInput').value)||0),qtyNeeded:$('qtyInput').value.trim(),notes:$('notesInput').value.trim()};
    const id=Number($('editId').value);
    if(id){Object.assign(findProduct(id),data);}else{state.products.push({id:state.nextId++,...data,lastPurchaseDate:'',needed:false,bought:false,purchaseCount:0});}
    save(); $('productDialog').close(); renderAll(); toast(id?'Producto actualizado':'Producto agregado');
  }
  function deleteCurrentProduct(){
    const id=Number($('editId').value); const p=findProduct(id); if(!p)return; if(!confirm(`¿Eliminar “${p.name}” del catálogo?`))return;
    state.products=state.products.filter(x=>x.id!==id); save(); $('productDialog').close(); renderAll(); toast('Producto eliminado');
  }
  function finishShopping(){
    const items=activeItems(); if(!items.length){toast('La lista está vacía');return;}
    const bought=items.filter(p=>p.bought).length;
    if(!confirm(`Finalizar compra: ${bought} comprados de ${items.length}. Se vaciará la lista activa. ¿Continuar?`))return;
    const d=today(); items.forEach(p=>{if(p.bought){p.lastPurchaseDate=d;p.purchaseCount=(Number(p.purchaseCount)||0)+1;}p.needed=false;p.bought=false;p.qtyNeeded='';}); save(); renderAll(); showView('homeView'); toast('Compra finalizada');
  }
  function exportBackup(){
    const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`mi-compra-respaldo-${today()}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  function importBackup(file){
    if(!file)return; const reader=new FileReader(); reader.onload=()=>{try{const parsed=JSON.parse(String(reader.result)); if(!parsed||!Array.isArray(parsed.products))throw new Error('Formato no válido'); if(!confirm(`Importar ${parsed.products.length} productos y reemplazar los datos actuales?`))return; state={version:VERSION,nextId:Number(parsed.nextId)||Math.max(0,...parsed.products.map(p=>Number(p.id)||0))+1,products:parsed.products}; save(); renderAll(); toast('Respaldo importado');}catch(e){alert('No se pudo importar el archivo. Verifique que sea un respaldo de Mi Compra.');}}; reader.readAsText(file);
  }
  function resetData(){ if(!confirm('¿Restablecer la aplicación al catálogo inicial? Se perderán los cambios actuales.'))return; state=initialState(); save(); renderAll(); toast('Datos restablecidos'); }
  function updateInstallStatus(){
    const standalone=window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true;
    $('installStatus').textContent=standalone?'Mi Compra ya está instalada como aplicación.':(location.protocol==='https:'||location.hostname==='localhost'?'La aplicación está lista para instalar desde este navegador.':'Para instalar como PWA debe abrirse desde una dirección HTTPS.');
    $('installBtn2').classList.add('hidden');
  }
  async function promptInstall(){ if(!deferredPrompt){toast('Usá el menú de Chrome → Instalar aplicación / Agregar a pantalla principal');return;} deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; updateInstallStatus(); }

  document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  $('goShoppingBtn').addEventListener('click',()=>showView('shoppingView')); $('homeCatalogBtn').addEventListener('click',()=>showView('catalogView')); $('addProductBtn').addEventListener('click',()=>openProductDialog());
  $('searchInput').addEventListener('input',renderCatalog); $('categoryFilter').addEventListener('change',renderCatalog); $('storeFilter').addEventListener('change',renderCatalog);
  document.body.addEventListener('click',e=>{const card=e.target.closest('[data-id]'); if(!card)return; const id=Number(card.dataset.id); if(e.target.closest('.toggle-needed'))toggleNeeded(id); else if(e.target.closest('.edit-product'))openProductDialog(findProduct(id)); else if(e.target.closest('.shopping-action'))toggleBought(id);});
  $('productForm').addEventListener('submit',e=>{e.preventDefault();saveProductFromDialog();}); $('closeDialogBtn').addEventListener('click',()=>$('productDialog').close()); $('deleteProductBtn').addEventListener('click',deleteCurrentProduct); $('finishBtn').addEventListener('click',finishShopping); $('exportBtn').addEventListener('click',exportBackup); $('importInput').addEventListener('change',e=>{importBackup(e.target.files?.[0]);e.target.value='';}); $('resetBtn').addEventListener('click',resetData); $('installBtn2').addEventListener('click',promptInstall);
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;updateInstallStatus();}); window.addEventListener('appinstalled',()=>{deferredPrompt=null;updateInstallStatus();toast('Mi Compra instalada');});
  save(); renderAll(); updateInstallStatus();
})();
