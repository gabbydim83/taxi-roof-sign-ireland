/* Taxi Roof Sign Ireland — public site behaviours.
 * Demo mode reads localStorage ONLY in the user's own browser.
 * Production mode loads the public catalogue fields from Supabase RLS-protected product_settings.
 */
(() => {
  'use strict';
  const CATALOG = window.TAXI_CATALOG || [];
  const CONFIG = window.TAXI_CONFIG || {};
  const STORAGE_KEY = 'taxi-roof-sign-preview-settings-v1';
  const defaults = () => Object.fromEntries(CATALOG.map(p => [p.id, {
    product_id: p.id, display_order: CATALOG.indexOf(p) + 1, product_name: p.id.startsWith('new') ? '' : p.name, product_description: '', is_published: !p.id.startsWith('new'), price_eur: null, collect_info: '', delivery_info: '',
    led_enabled: false, cable_enabled: false, cable_length_m: 3, plug_type: '',
    text_english: false, text_irish: false
  }]));
  const isConfigured = Boolean(CONFIG.supabaseUrl && (CONFIG.supabasePublishableKey || CONFIG.supabaseAnonKey));
  const isLocalPreview = location.protocol === 'file:' || ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const root = document.body?.dataset.root || './';
  const el = (selector) => document.querySelector(selector);
  const all = (selector) => [...document.querySelectorAll(selector)];
  const productId = document.body?.dataset.product;
  const isDynamicDetail = document.body?.dataset.dynamicProduct === 'true';
  let currentProduct = CATALOG.find(p => p.id === productId);
  let settings = defaults();

  function fetchLocal() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      for (const id of Object.keys(settings)) if (stored[id] && typeof stored[id] === 'object') {
        settings[id] = {...settings[id], ...stored[id]};
      }
    } catch (error) { console.warn('Local demo data unavailable:', error); }
    return settings;
  }
  function formatPrice(raw) {
    if (raw === null || raw === undefined || raw === '') return 'On request';
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0) return 'On request';
    return new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',minimumFractionDigits: num % 1 ? 2 : 0, maximumFractionDigits:2}).format(num);
  }
  function fullWhatsAppUrl(message) {
    const number = String(CONFIG.whatsappNumber || '').replace(/\D/g,'');
    return 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
  }
  function getName(p) { return settings[p.id]?.product_name?.trim() || p.name; }
  function productImageUrl(p) {
    const value = String(p.image_path || p.image || '');
    if (p.dynamic && value.startsWith(CONFIG.supabaseUrl + '/storage/v1/object/public/taxi-product-images/')) return value;
    if (p.dynamic && value.startsWith('assets/images/')) return root + value;
    return root + 'assets/images/' + (p.dynamic ? '' : value);
  }
  function productUrl(p) {
    return p.dynamic
      ? root + 'products/item/index.html?id=' + encodeURIComponent(p.id)
      : root + 'products/' + p.slug + '/index.html';
  }
  function dynamicCatalogueRow(row) {
    return {
      id: row.product_id, slug: 'item', name: row.product_name,
      image_path: row.image_path, tag: 'Taxi roof sign part',
      teaser: row.product_description, summary: row.product_description,
      type: 'simple', dynamic: true
    };
  }
  function cardFor(p) {
    const card = document.createElement('article');
    card.className = 'product-card'; card.dataset.productCard = p.id;
    const url = productUrl(p);
    const imageLink = document.createElement('a'); imageLink.className='product-image-link';imageLink.href=url;
    const tag = document.createElement('span');tag.className='product-tag';tag.textContent=p.tag;
    const img=document.createElement('img');img.src=productImageUrl(p);img.alt=p.name;img.loading='lazy';img.width=770;img.height=440;
    const icon=document.createElement('span');icon.className='image-link-icon';icon.setAttribute('aria-hidden','true');icon.textContent='↗';
    imageLink.append(tag,img,icon);
    const body=document.createElement('div');body.className='product-card-body';
    const category=document.createElement('p');category.className='product-category';category.textContent='TAXI ROOF SIGNS & PRODUCTS';
    const h3=document.createElement('h3');const a=document.createElement('a');a.href=url;a.textContent=p.name;h3.appendChild(a);
    const teaser=document.createElement('p');teaser.className='product-teaser';teaser.textContent=p.teaser||'';
    const bottom=document.createElement('div');bottom.className='card-bottom';
    const priceWrap=document.createElement('div');const priceLabel=document.createElement('span');priceLabel.className='price-label';priceLabel.textContent='PRICE';
    const price=document.createElement('strong');price.className='card-price';price.dataset.priceFor=p.id;price.textContent='On request';priceWrap.append(priceLabel,price);
    const view=document.createElement('a');view.className='view-product';view.href=url;view.textContent='View Product ↗';
    bottom.append(priceWrap,view);body.append(category,h3,teaser,bottom);card.append(imageLink,body);return card;
  }
  function ensureExtraCards() {
    const grid=el('.product-grid');if (!grid) return;
    CATALOG.filter(p=>p.id.startsWith('new') || p.dynamic).forEach(p=>{
      if(!grid.querySelector(`[data-product-card="${p.id}"]`)) grid.appendChild(cardFor(p));
    });
  }
  function updateSettingsUI() {
    if (isDynamicDetail) renderDynamicDetail();
    ensureExtraCards();
    for (const p of CATALOG) {
      const record = settings[p.id] || {};
      const name=getName(p);
      all(`[data-product-card="${p.id}"]`).forEach(card=>{
        card.hidden = record.is_published === false;
        card.querySelectorAll('h3 a').forEach(a=>a.textContent=name);
        card.querySelectorAll('.product-image-link').forEach(a=>a.setAttribute('aria-label','View '+name));
        card.querySelectorAll('img').forEach(img=>{img.alt=name+' product photo'; if (p.dynamic) img.src=productImageUrl(p);});
        card.querySelectorAll('.product-teaser').forEach(t=>t.textContent=record.product_description?.trim() || p.teaser || 'Contact us for product details.');
      });
      all(`[data-price-for="${p.id}"]`).forEach(node => node.textContent = formatPrice(record.price_eur));
      all(`[data-collect-for="${p.id}"]`).forEach(node => node.textContent = record.collect_info?.trim() || 'Ask us for collection details');
      all(`[data-delivery-for="${p.id}"]`).forEach(node => node.textContent = record.delivery_info?.trim() || 'Ask us about delivery');
    }
    // Sort the actual card nodes (including pre-rendered cards) by Supabase order.
    // Draft products remain hidden; ties use the original catalogue sequence.
    const grid = el('.product-grid');
    if (grid) {
      const catalogueIndex = new Map(CATALOG.map((p, i) => [p.id, i]));
      const positionOf = id => {
        const pos = Number(settings[id]?.display_order);
        return Number.isInteger(pos) && pos > 0 ? pos : (catalogueIndex.get(id) ?? 0) + 1;
      };
      [...grid.querySelectorAll('[data-product-card]')]
        .sort((a, b) => positionOf(a.dataset.productCard) - positionOf(b.dataset.productCard)
          || (catalogueIndex.get(a.dataset.productCard) ?? 0) - (catalogueIndex.get(b.dataset.productCard) ?? 0))
        .forEach(card => grid.appendChild(card));
    }
    const numberPublished = CATALOG.filter(p=>settings[p.id]?.is_published!==false).length;
    if(el('#catalogue-count'))el('#catalogue-count').textContent=String(numberPublished).padStart(2,'0');
    if (currentProduct) {
      const r=settings[currentProduct.id]||{};
      if(r.is_published===false){
        const main=el('main.product-main');if(main){main.replaceChildren();
          const notice=document.createElement('div');notice.className='container';notice.style.padding='95px 20px';
          notice.textContent='This product is not currently listed. Please return to the catalogue.';
          main.appendChild(notice);}
        const related=el('.related-section');if(related)related.hidden=true;
      }else{
        const name=getName(currentProduct);
        document.querySelectorAll('.detail-body h1').forEach(node=>node.textContent=name);
        document.querySelectorAll('.breadcrumbs [aria-current="page"]').forEach(node=>node.textContent=name);
        document.querySelectorAll('.detail-image-wrap img').forEach(img=>img.alt=name+' product photograph');
        if(r.product_description?.trim())document.querySelectorAll('.product-summary p').forEach(node=>node.textContent=r.product_description.trim());
        document.title=name+' | Taxi Roof Sign Ireland';
        const meta=el('meta[name="description"]');if(meta)meta.content=name+'. '+(r.product_description?.trim() || currentProduct.summary || '')+'. Contact the seller to order.';
        const og=el('meta[property="og:title"]');if(og)og.content=document.title;
        if(currentProduct.id==='refurbished') renderRefurbishedFeatures();
        updateProductOrderMessage();
      }
    }
  }
  function renderDynamicDetail() {
    const id = new URLSearchParams(location.search).get('id') || '';
    currentProduct = CATALOG.find(p => p.dynamic && p.id === id) || null;
    const main = el('main.product-main');
    if (!main) return;
    if (!currentProduct || settings[id]?.is_published !== true) {
      main.hidden=false;
      main.replaceChildren();
      const message=document.createElement('div');message.className='container';
      message.style.padding='95px 20px';
      message.textContent='This product is not currently listed. Please return to the catalogue.';
      main.appendChild(message);
      document.title='Product not available | Taxi Roof Sign Ireland';
      el('meta[name="robots"]')?.setAttribute('content','noindex,nofollow');
      return;
    }
    const row=settings[id];
    const name=getName(currentProduct);
    el('#dynamic-image').src=productImageUrl(currentProduct);
    el('#dynamic-image').alt=name;
    el('#dynamic-name').textContent=name;
    el('#dynamic-crumb').textContent=name;
    el('#dynamic-description').textContent=row.product_description?.trim() || 'Please contact us for more information.';
    el('#dynamic-price').setAttribute('data-price-for',id);
    el('#dynamic-collect').setAttribute('data-collect-for',id);
    el('#dynamic-delivery').setAttribute('data-delivery-for',id);
    const order=el('.js-product-order');order.dataset.orderFor=id;
    document.title=name+' | Taxi Roof Sign Ireland';
    const meta=el('meta[name="description"]');
    if(meta)meta.content=name+'. '+(row.product_description||'').slice(0,155);
    main.hidden=false;
  }
  function renderRefurbishedFeatures() {
    const container = el('[data-refurb-features]');
    const language = el('[data-refurb-language]');
    const select = el('#refurb-language');
    if (!container || !select || !language) return;
    const product = settings.refurbished || {};
    const features = [];
    if (product.led_enabled) features.push('Comes with LED light');
    if (product.cable_enabled) {
      const metres = [2,3,4,5].includes(Number(product.cable_length_m)) ? Number(product.cable_length_m) : 3;
      features.push(`Comes with wiring cable (approx. ${metres} metres)`);
    }
    if (product.plug_type && ['USB-C','Car power socket'].includes(product.plug_type)) features.push(`Plug type: ${product.plug_type}`);
    container.replaceChildren();
    features.forEach(text => {
      const line = document.createElement('div');
      line.className = 'seller-feature';
      line.textContent = text;
      container.appendChild(line);
    });
    const available = [product.text_english ? 'English' : null,product.text_irish ? 'Irish' : null].filter(Boolean);
    const old = select.value;
    select.replaceChildren();
    available.forEach(name => {
      const opt = document.createElement('option'); opt.value = opt.textContent = name;
      select.appendChild(opt);
    });
    if (available.includes(old)) select.value = old;
    language.hidden = available.length === 0;
    const optionsPanel = el('[data-options-kind="refurbished"]');
    if (optionsPanel) optionsPanel.hidden = features.length === 0 && available.length === 0;
  }
  function picked(name) { return document.querySelector(`input[name="${name}"]:checked`)?.value || ''; }
  function productMessage() {
    if (!currentProduct) return '';
    let lines = ['I Want to buy ' + getName(currentProduct)];
    if (currentProduct.type === 'gs900') {
      lines.push('Variant: ' + picked('variant'));
      lines.push('Roofsign Number: ' + (el('#roofsign-number')?.value.trim() || 'Not provided'));
      lines.push('Wheelchair Stickers: ' + picked('wheelchair'));
      lines.push('Roofsign Text: ' + picked('roofsignText'));
    }
    if (currentProduct.type === 'suction') {
      lines.push('Roofsign Text: ' + picked('roofsignText'));
      lines.push('Wheelchair Stickers: ' + picked('wheelchair'));
    }
    if (currentProduct.type === 'refurbished') {
      const selected = el('#refurb-language');
      if (selected && !selected.closest('[data-refurb-language]')?.hidden && selected.value) {
        lines.push('Roofsign Text: ' + selected.value);
      }
    }
    return lines.join('\n');
  }
  function updateProductOrderMessage() {
    const link = el('.js-product-order');
    if (!link || !currentProduct) return;
    link.href = fullWhatsAppUrl(productMessage());
    link.setAttribute('aria-label', 'Book Now on WhatsApp: ' + getName(currentProduct));
  }
  function bindMenu() {
    const toggle = el('.menu-toggle'), nav = el('.mobile-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open)); nav.hidden = open;
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click',() => {
      nav.hidden = true; toggle.setAttribute('aria-expanded','false');
    }));
  }
  function bindWhatsApp() {
    all('.js-reseller').forEach(link => {
      link.href = fullWhatsAppUrl(CONFIG.resellerMessage || 'I would like to become a reseller of Taxi Roof Sign products.');
      link.target = '_blank'; link.rel = 'noopener noreferrer';
    });
    all('.js-whatsapp').forEach(link => {
      link.href = fullWhatsAppUrl('Hello, I would like more information about your taxi roof signs.');
      link.target = '_blank'; link.rel = 'noopener noreferrer';
    });
    all('.product-options input,.product-options select').forEach(control => {
      control.addEventListener('change',updateProductOrderMessage);
      control.addEventListener('input',updateProductOrderMessage);
    });
  }
  function addProductStructuredData() {
    if (!currentProduct || settings[currentProduct.id]?.is_published===false || !location.protocol.startsWith('http')) return;
    const data = {
      '@context':'https://schema.org','@type':'Product',
      name:getName(currentProduct),
      description:settings[currentProduct.id]?.product_description?.trim() || currentProduct.summary,
      image:new URL(productImageUrl(currentProduct), location.href).href,
      category:'Taxi roof signs'
    };
    // No offer or availability is asserted while product prices are not confirmed.
    const script = document.createElement('script');script.type='application/ld+json';
    script.textContent = JSON.stringify(data);document.head.appendChild(script);
  }
  async function connectProduction() {
    const {createClient} = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const client = createClient(CONFIG.supabaseUrl,CONFIG.supabasePublishableKey || CONFIG.supabaseAnonKey);
    const {data,error} = await client.from('product_settings').select('*');
    if (error) throw error;
    (data || []).forEach(row => {
      if (row.product_id.startsWith('custom_') && row.image_path && !CATALOG.some(p=>p.id===row.product_id)) {
        CATALOG.push(dynamicCatalogueRow(row));
      }
      if (CATALOG.some(p=>p.id===row.product_id)) settings[row.product_id] = {...settings[row.product_id],...row};
    });
    return settings;
  }
  async function init() {
    bindMenu(); bindWhatsApp();
    all('.js-year').forEach(n => n.textContent = String(new Date().getFullYear()));
    if (isConfigured) {
      try { await connectProduction(); } catch (error) {
        console.error('The live catalogue values could not be loaded:',error);
        // No silent fallback to local browser values when production configuration exists.
      }
    } else if (isLocalPreview) fetchLocal();
    updateSettingsUI();
    addProductStructuredData();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
