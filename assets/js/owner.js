/* Owner Management: local demo is intentionally NOT a secure shared backend.
 * Production requires Supabase Auth, product_settings and admin_users RLS policies.
 */
(() => {
  'use strict';
  const CATALOG = window.TAXI_CATALOG || [];
  const CONFIG = window.TAXI_CONFIG || {};
  const STATIC_COUNT = CATALOG.length;
  const NEW_SENTINEL = '__create__';
  const BUCKET = 'taxi-product-images';
  let creating = false;
  const KEY = 'taxi-roof-sign-preview-settings-v1';
  const configured = Boolean(CONFIG.supabaseUrl && (CONFIG.supabasePublishableKey || CONFIG.supabaseAnonKey));
  const isLocalPreview = location.protocol === 'file:' || ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const $ = id => document.getElementById(id);
  const productSelect = $('owner-product-select');
  const mode = $('owner-mode');
  const dashboard = $('owner-dashboard');
  const auth = $('owner-auth');
  let client = null;
  let isOwner = false;
  let products = Object.fromEntries(CATALOG.map(p => [p.id, {
    product_id:p.id,display_order:CATALOG.indexOf(p)+1,product_name:p.id.startsWith('new')?'':p.name,product_description:'',is_published:!p.id.startsWith('new'),price_eur:null,collect_info:'',delivery_info:'',
    led_enabled:false,cable_enabled:false,cable_length_m:3,plug_type:'',
    text_english:false,text_irish:false
  }]));

  function localLoad() {
    try {
      const data=JSON.parse(localStorage.getItem(KEY)||'{}');
      for (const id of Object.keys(products)) if (data[id]) products[id]={...products[id],...data[id]};
    } catch (e) { console.warn('Local demo data cannot be read:',e); }
  }
  function imageSource(p) {
    const value=String(p.image_path || p.image || '');
    if (p.dynamic && value.startsWith(CONFIG.supabaseUrl + '/storage/v1/object/public/'+BUCKET+'/')) return value;
    if (p.dynamic && value.startsWith('assets/images/')) return '../'+value;
    return '../assets/images/' + (p.dynamic ? '' : value);
  }
  function imageAllowed(value) {
    if (!value) return false;
    if (/^assets\/images\/[\p{L}\p{N} _().-]+\.(webp|png|jpg|jpeg)$/u.test(value)) return true;
    return value.startsWith(CONFIG.supabaseUrl + '/storage/v1/object/public/'+BUCKET+'/');
  }
  function fillProductOptions(selected) {
    productSelect.replaceChildren();
    CATALOG.forEach(p=>{
      const option=document.createElement('option');option.value=p.id;
      option.textContent=products[p.id]?.product_name?.trim() || p.name;
      productSelect.appendChild(option);
    });
    if (selected && CATALOG.some(p=>p.id===selected)) productSelect.value=selected;
  }
  function notice(value,error=false){$('owner-message').textContent=value;$('owner-message').style.color=error?'#b22537':'#216f4f'}
  // Position is defined among *published* products, not hidden drafts.
  // This keeps Position 1 = first visible card even while drafts exist.
  function publishedInOrder(excludeId = null) {
    const fallback = new Map(CATALOG.map((p, i) => [p.id, i + 1]));
    return CATALOG.filter(p => p.id !== excludeId && products[p.id]?.is_published !== false)
      .sort((a, b) => {
        const first = Number(products[a.id]?.display_order);
        const second = Number(products[b.id]?.display_order);
        const x = Number.isInteger(first) && first > 0 ? first : fallback.get(a.id);
        const y = Number.isInteger(second) && second > 0 ? second : fallback.get(b.id);
        return x - y || fallback.get(a.id) - fallback.get(b.id);
      });
  }
  // Use a direct number input, not a native dropdown, so the owner can always
  // enter 1, 2, 3... (including before publishing a draft product).
  function syncPositionControls() {
    const input = $('owner-position');
    const max = Math.max(1, Number(input.max) || 1);
    const value = Number(input.value);
    const valid = Number.isInteger(value) && value >= 1 && value <= max;
    $('owner-position-prev').disabled = !valid || value <= 1;
    $('owner-position-next').disabled = !valid || value >= max;
    $('owner-position-first').disabled = !valid || value <= 1;
    $('owner-position-last').disabled = !valid || value >= max;
  }
  function setPosition(value) {
    const input = $('owner-position');
    const max = Math.max(1, Number(input.max) || 1);
    const v = Number(value);
    input.value = String(Math.min(max, Math.max(1, Number.isFinite(v) ? Math.round(v) : 1)));
    syncPositionControls();
  }
  function refreshPositionOptions(id, desired = null) {
    const input = $('owner-position');
    const published = $('owner-published').checked;
    const positions = publishedInOrder(id).length + 1;
    let chosen = desired;
    if (!Number.isInteger(chosen)) {
      const old = publishedInOrder();
      const oldPosition = old.findIndex(p => p.id === id) + 1;
      chosen = oldPosition || positions;
    }
    input.max = String(positions);
    $('owner-position-total').textContent = `of ${positions}`;
    setPosition(chosen);
    $('owner-position-help').textContent = published
      ? `Enter a position between 1 and ${positions}. The other published products will shift automatically.`
      : `This product is hidden. Set its future position (1–${positions}), tick “Show this product” and save to publish it there.`;
  }
  function reorderLocal(id, newPosition) {
    const remaining = publishedInOrder(id).map(p => p.id);
    const newList = [...remaining.slice(0, newPosition - 1), id, ...remaining.slice(newPosition - 1)];
    newList.forEach((productId, index) => { products[productId].display_order = index + 1; });
  }
  function showRecord(id) {
    const p=CATALOG.find(x=>x.id===id);if(!p)return;
    const record=products[id]||{};
    const actualName=record.product_name?.trim() || p.name;
    $('owner-product-name').textContent=actualName;
    $('owner-name').value=record.product_name || '';
    $('owner-description').value=record.product_description || '';
    $('owner-published').checked=record.is_published!==false;
    refreshPositionOptions(id);
    $('owner-product-image').src=imageSource(p);
    $('owner-product-image').alt=actualName;
    $('owner-dynamic-image-options').hidden=!p.dynamic;
    $('owner-image-path').value=p.dynamic ? (record.image_path || '') : '';
    $('owner-image-file').value='';
    $('owner-new-product').hidden=false;
    $('owner-edit-heading').textContent='Product details';
    creating=false;
    $('owner-price').value=record.price_eur===null||record.price_eur===undefined?'':record.price_eur;
    $('owner-collect').value=record.collect_info||'';
    $('owner-delivery').value=record.delivery_info||'';
    $('owner-features').hidden=id!=='refurbished';
    $('owner-led').checked=Boolean(record.led_enabled);
    $('owner-cable').checked=Boolean(record.cable_enabled);
    $('owner-cable-length').value=String(record.cable_length_m||3);
    $('owner-plug').value=record.plug_type||'';
    $('owner-english').checked=Boolean(record.text_english);
    $('owner-irish').checked=Boolean(record.text_irish);
    $('owner-cable-length').disabled=!$('owner-cable').checked;
    notice('');
  }
  function showNewProduct() {
    if (!configured || !isOwner) return notice('Sign in as an owner to create products.',true);
    creating=true;
    productSelect.selectedIndex=-1;
    $('owner-edit-heading').textContent='Add New Product';
    $('owner-product-name').textContent='New product';
    $('owner-product-image').removeAttribute('src');
    $('owner-product-image').alt='Choose an image for this product';
    $('owner-name').value='';$('owner-description').value='';
    $('owner-price').value='';$('owner-collect').value='';$('owner-delivery').value='';
    $('owner-published').checked=true;
    $('owner-dynamic-image-options').hidden=false;
    $('owner-image-path').value='';$('owner-image-file').value='';
    $('owner-features').hidden=true;
    refreshPositionOptions(NEW_SENTINEL,publishedInOrder().length+1);
    notice('Enter the new product details and choose a photograph, then save.');
  }
  async function uploadPhoto(file,id) {
    if(!file)return null;
    const allowed={'image/webp':'.webp','image/png':'.png','image/jpeg':'.jpg'};
    if(!allowed[file.type])throw new Error('Use a WebP, PNG or JPG image.');
    if(file.size>5*1024*1024)throw new Error('The image must be no larger than 5 MB.');
    const filename=id+'/'+crypto.randomUUID().replace(/-/g,'')+allowed[file.type];
    const {error}=await client.storage.from(BUCKET).upload(filename,file,{contentType:file.type,upsert:false});
    if(error)throw new Error('Image upload failed: '+error.message);
    const {data}=client.storage.from(BUCKET).getPublicUrl(filename);
    return data.publicUrl;
  }
  function createPayload(id){
    const priceString=$('owner-price').value.trim();
    const price=priceString===''?null:Number(priceString);
    if (price!==null && (!Number.isFinite(price)||price<0)) throw new Error('Enter a valid non-negative price.');
    const current=products[id]||{};
    const name=$('owner-name').value.trim();
    const desc=$('owner-description').value.trim();
    const published=$('owner-published').checked;
    if(published && !name)throw new Error('Enter a product name before publishing.');
    if(name.length>120 || desc.length>300)throw new Error('Product name or description is too long.');
    const displayOrder = Number($('owner-position').value);
    const maxPosition = Number($('owner-position').max);
    if (!Number.isInteger(displayOrder) || displayOrder < 1 || displayOrder > maxPosition) {
      throw new Error(`Choose a whole-number position between 1 and ${maxPosition}.`);
    }
    const payload={
      product_id:id,display_order:displayOrder,product_name:name,product_description:desc,is_published:published,price_eur:price,
      collect_info:$('owner-collect').value.trim(),
      delivery_info:$('owner-delivery').value.trim(),
      led_enabled:Boolean(current.led_enabled),cable_enabled:Boolean(current.cable_enabled),
      cable_length_m:current.cable_length_m||3,plug_type:current.plug_type||'',
      text_english:Boolean(current.text_english),text_irish:Boolean(current.text_irish)
    };
    if (id==='refurbished') {
      payload.led_enabled=$('owner-led').checked;
      payload.cable_enabled=$('owner-cable').checked;
      payload.cable_length_m=Number($('owner-cable-length').value);
      payload.plug_type=$('owner-plug').value;
      payload.text_english=$('owner-english').checked;
      payload.text_irish=$('owner-irish').checked;
    }
    return payload;
  }
  function enableDashboard(enabled){dashboard.hidden=!enabled;auth.hidden=enabled;isOwner=enabled;}
  async function getAuthorizedUser() {
    const {data:{session},error:sessionError}=await client.auth.getSession();
    if (sessionError || !session?.user) return false;
    const {data,error}=await client.from('admin_users').select('user_id').eq('user_id',session.user.id).maybeSingle();
    return !error && Boolean(data);
  }
  async function loadRemote(preferredId=null) {
    const selected=preferredId || productSelect.value;
    const {data,error}=await client.from('product_settings').select('*');
    if (error) throw error;
    // Entries added by the owner are discovered from Supabase, not hardcoded in catalog.js.
    CATALOG.splice(STATIC_COUNT);
    for(const row of (data||[])){
      if(row.product_id.startsWith('custom_')){
        CATALOG.push({id:row.product_id, slug:'item', name:row.product_name,
          image_path:row.image_path,tag:'Taxi roof sign part',teaser:row.product_description,
          summary:row.product_description,type:'simple',dynamic:true});
      }
      if(CATALOG.some(p=>p.id===row.product_id)){
        products[row.product_id]={...products[row.product_id],...row};
      }
    }
    fillProductOptions(selected);
    showRecord(productSelect.value || CATALOG[0].id);
  }
  async function initProduction() {
    mode.classList.add('secure');
    mode.textContent='Live database configured. Editing requires a verified owner account; changes are shared with all visitors.';
    enableDashboard(false);
    try{
      const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      client=createClient(CONFIG.supabaseUrl,CONFIG.supabasePublishableKey || CONFIG.supabaseAnonKey);
      if(await getAuthorizedUser()) { await loadRemote(); enableDashboard(true); $('owner-logout').hidden=false; }
    }catch(error){mode.classList.remove('secure');mode.textContent='Connection problem: '+error.message;}
  }
  async function signIn(event){
    event.preventDefault();
    const msg=$('login-message');
    const button=$('login-form').querySelector('button[type="submit"]');
    button.disabled=true;
    msg.textContent='Checking account…';
    try{
      const {error}=await client.auth.signInWithPassword({email:$('login-email').value.trim(),password:$('login-password').value});
      if(error)throw error;
      if(!await getAuthorizedUser()) {
        await client.auth.signOut(); throw new Error('This account has not been granted owner-management access.');
      }
      await loadRemote();
      enableDashboard(true);
      $('owner-logout').hidden=false;
      msg.textContent='';$('login-password').value='';
    }catch(error){msg.textContent=error.message;}
    finally{button.disabled=false;}
  }
  async function save(event){
    event.preventDefault();
    const isNew=creating;
    const id=isNew ? 'custom_'+crypto.randomUUID().replace(/-/g,'').slice(0,20) : productSelect.value;
    const saveBtn=$('owner-save');
    try{
      const payload=createPayload(id);
      saveBtn.disabled=true;notice('Saving…');
      if(configured){
        if(!isOwner)throw new Error('Sign in as an owner before saving.');
        const p=CATALOG.find(x=>x.id===id);
        const file=$('owner-image-file').files[0];
        let path=($('owner-image-path').value||'').trim();
        if(!isNew && p && !p.dynamic)path='';
        if(file) path=await uploadPhoto(file,id);
        if((isNew || p?.dynamic) && path && !imageAllowed(path))throw new Error('Choose a photo or a valid assets/images/ path.');
        if(isNew && !path)throw new Error('Choose a product image before saving.');
        const record={
          product_name:payload.product_name, product_description:payload.product_description,
          is_published:payload.is_published,price_eur:payload.price_eur,
          collect_info:payload.collect_info,delivery_info:payload.delivery_info
        };
        if(isNew){
          const {data,error}=await client.from('product_settings').insert({
            ...record,product_id:id,display_order:9999,image_path:path
          }).select('product_id').single();
          if(error)throw error;
          if(!data)throw new Error('The new product was not created.');
        }else{
          const update={...record,
            led_enabled:payload.led_enabled,cable_enabled:payload.cable_enabled,
            cable_length_m:payload.cable_length_m,plug_type:payload.plug_type,
            text_english:payload.text_english,text_irish:payload.text_irish,
            updated_at:new Date().toISOString()};
          if(p?.dynamic)update.image_path=path;
          const {data,error}=await client.from('product_settings').update(update)
            .eq('product_id',id).select('product_id').single();
          if(error)throw error;
          if(!data)throw new Error('No product was updated. Verify owner permissions.');
        }
        if(payload.is_published){
          const {error}=await client.rpc('set_product_display_position',{
            p_product_id:id,p_new_position:payload.display_order
          });
          if(error){await loadRemote(id);throw new Error('Details saved, but order not changed: '+error.message);}
        }
        await loadRemote(id);
        notice(isNew ? 'New product saved in Supabase. It is now available in the catalogue if published.' : 'Saved in Supabase. Product updated.');
      }else{
        if(isNew)throw new Error('Creating products requires the live Supabase database.');
        products[id]={...products[id],...payload};
        if(payload.is_published) reorderLocal(id,payload.display_order);
        localStorage.setItem(KEY,JSON.stringify(products));
        const selected=productSelect.selectedOptions[0];
        if(selected)selected.textContent=payload.product_name||('Product '+id+' (draft)');
        showRecord(id);notice('Saved in this browser only (demo). Catalogue order is not published online.');
      }
    }catch(error){notice(error.message||'Saving failed.',true)}finally{saveBtn.disabled=false}
  }
  function init(){
    productSelect.replaceChildren();
    CATALOG.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.name;productSelect.appendChild(o)});
    productSelect.addEventListener('change',()=>showRecord(productSelect.value));
    $('owner-new-product').addEventListener('click',showNewProduct);
    $('owner-published').addEventListener('change', () => refreshPositionOptions(productSelect.value, Number($('owner-position').value)));
    $('owner-position').addEventListener('input', syncPositionControls);
    $('owner-position').addEventListener('change', () => setPosition($('owner-position').value));
    $('owner-position-prev').addEventListener('click', () => setPosition(Number($('owner-position').value) - 1));
    $('owner-position-next').addEventListener('click', () => setPosition(Number($('owner-position').value) + 1));
    $('owner-position-first').addEventListener('click', () => setPosition(1));
    $('owner-position-last').addEventListener('click', () => setPosition(Number($('owner-position').max)));
    $('owner-cable').addEventListener('change',()=>{$('owner-cable-length').disabled=!$('owner-cable').checked});
    $('owner-image-file').addEventListener('change',()=>{
      const file=$('owner-image-file').files[0];
      if(file){const url=URL.createObjectURL(file);const img=$('owner-product-image');
        img.onload=()=>URL.revokeObjectURL(url);img.src=url;}
    });
    $('owner-form').addEventListener('submit',save);
    $('login-form').addEventListener('submit',signIn);
    $('owner-logout').addEventListener('click',async()=>{if(client)await client.auth.signOut();enableDashboard(false);$('owner-logout').hidden=true;$('login-password').value='';notice('')});
    if(configured){$('owner-logout').hidden=true;initProduction();}
    else if (isLocalPreview){
      mode.textContent='LOCAL DEMO MODE — values you edit here are saved only in this browser. This is NOT a secured owner account or a shared online database. Connect Supabase and create an authorized owner before launch.';
      localLoad();enableDashboard(true);showRecord(CATALOG[0].id);
    } else {
      mode.textContent='Owner Management is not yet connected to the live database. The editing panel is disabled until the secure owner account is configured.';
      dashboard.hidden=true;auth.hidden=true;
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
