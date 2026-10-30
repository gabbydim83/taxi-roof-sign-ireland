/* Owner Management: local demo is intentionally NOT a secure shared backend.
 * Production requires Supabase Auth, product_settings and admin_users RLS policies.
 */
(() => {
  'use strict';
  const CATALOG = window.TAXI_CATALOG || [];
  const CONFIG = window.TAXI_CONFIG || {};
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
    product_id:p.id,price_eur:null,collect_info:'',delivery_info:'',
    led_enabled:false,cable_enabled:false,cable_length_m:3,plug_type:'',
    text_english:false,text_irish:false
  }]));

  function localLoad() {
    try {
      const data=JSON.parse(localStorage.getItem(KEY)||'{}');
      for (const id of Object.keys(products)) if (data[id]) products[id]={...products[id],...data[id]};
    } catch (e) { console.warn('Local demo data cannot be read:',e); }
  }
  function notice(value,error=false){$('owner-message').textContent=value;$('owner-message').style.color=error?'#b22537':'#216f4f'}
  function showRecord(id) {
    const p=CATALOG.find(x=>x.id===id);if(!p)return;
    const record=products[id]||{};
    $('owner-product-name').textContent=p.name;
    $('owner-product-image').src='../assets/images/'+p.image;
    $('owner-product-image').alt=p.name;
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
  function createPayload(id){
    const priceString=$('owner-price').value.trim();
    const price=priceString===''?null:Number(priceString);
    if (price!==null && (!Number.isFinite(price)||price<0)) throw new Error('Enter a valid non-negative price.');
    const current=products[id]||{};
    const payload={
      product_id:id,price_eur:price,
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
  async function loadRemote() {
    const {data,error}=await client.from('product_settings').select('*');
    if (error) throw error;
    for(const row of (data||[]))if(products[row.product_id])products[row.product_id]={...products[row.product_id],...row};
    showRecord(productSelect.value);
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
    event.preventDefault();const id=productSelect.value;
    const saveBtn=$('owner-save');
    try{
      const payload=createPayload(id);
      saveBtn.disabled=true;notice('Saving…');
      if(configured){
        if(!isOwner)throw new Error('Sign in as an owner before saving.');
        const {data,error}=await client.from('product_settings').update({
          price_eur:payload.price_eur,collect_info:payload.collect_info,delivery_info:payload.delivery_info,
          led_enabled:payload.led_enabled,cable_enabled:payload.cable_enabled,
          cable_length_m:payload.cable_length_m,plug_type:payload.plug_type,
          text_english:payload.text_english,text_irish:payload.text_irish,
          updated_at:new Date().toISOString()
        }).eq('product_id',id).select('product_id').single();
        if(error)throw error;
        if(!data)throw new Error('No product was updated. Verify owner permissions.');
        products[id]={...products[id],...payload};
        notice('Saved to the live database. The catalogue now uses these values.');
      }else{
        products[id]={...products[id],...payload};
        localStorage.setItem(KEY,JSON.stringify(products));
        notice('Saved in this browser only (demo). Not published online.');
      }
    }catch(error){notice(error.message||'Saving failed.',true)}finally{saveBtn.disabled=false}
  }
  function init(){
    productSelect.replaceChildren();
    CATALOG.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.name;productSelect.appendChild(o)});
    productSelect.addEventListener('change',()=>showRecord(productSelect.value));
    $('owner-cable').addEventListener('change',()=>{$('owner-cable-length').disabled=!$('owner-cable').checked});
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
