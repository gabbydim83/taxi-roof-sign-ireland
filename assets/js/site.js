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
    product_id: p.id, price_eur: null, collect_info: '', delivery_info: '',
    led_enabled: false, cable_enabled: false, cable_length_m: 3, plug_type: '',
    text_english: false, text_irish: false
  }]));
  const isConfigured = Boolean(CONFIG.supabaseUrl && (CONFIG.supabasePublishableKey || CONFIG.supabaseAnonKey));
  const isLocalPreview = location.protocol === 'file:' || ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const root = document.body?.dataset.root || './';
  const el = (selector) => document.querySelector(selector);
  const all = (selector) => [...document.querySelectorAll(selector)];
  const productId = document.body?.dataset.product;
  const currentProduct = CATALOG.find(p => p.id === productId);
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
  function updateSettingsUI() {
    for (const p of CATALOG) {
      const record = settings[p.id] || {};
      all(`[data-price-for="${p.id}"]`).forEach(node => node.textContent = formatPrice(record.price_eur));
      all(`[data-collect-for="${p.id}"]`).forEach(node => node.textContent = record.collect_info?.trim() || 'Ask us for collection details');
      all(`[data-delivery-for="${p.id}"]`).forEach(node => node.textContent = record.delivery_info?.trim() || 'Ask us about delivery');
    }
    if (currentProduct?.id === 'refurbished') renderRefurbishedFeatures();
    if (currentProduct) updateProductOrderMessage();
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
    let lines = ['I Want to buy ' + currentProduct.name];
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
    link.setAttribute('aria-label', 'Book Now on WhatsApp: ' + currentProduct.name);
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
    if (!currentProduct || !location.protocol.startsWith('http')) return;
    const data = {
      '@context':'https://schema.org','@type':'Product',
      name:currentProduct.name,
      description:currentProduct.summary,
      image:new URL(root + 'assets/images/' + currentProduct.image, location.href).href,
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
    (data || []).forEach(row => { if (settings[row.product_id]) settings[row.product_id] = {...settings[row.product_id],...row}; });
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
