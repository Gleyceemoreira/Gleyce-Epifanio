// ══════════════════════════════════════════════════════════
//  PAUTA EDITORIAL DE STORIES — Gleyce Epifanio
//  Adicione ao index.html antes de </body>:
//  <script src="pauta-stories.js"></script>
// ══════════════════════════════════════════════════════════

(function() {
  'use strict';

  const DEFAULT_PILARES = [
    {id:'pi1', name:'Conexão',    color:'#E1306C'},
    {id:'pi2', name:'Autoridade', color:'#9b59b6'},
    {id:'pi3', name:'Educativo',  color:'#2A6B7C'},
    {id:'pi4', name:'Desejo',     color:'#c49a3c'},
    {id:'pi5', name:'Objeção',    color:'#b85454'},
    {id:'pi6', name:'Reflexão',   color:'#4a9e6b'}
  ];

  let peY = new Date().getFullYear();
  let peM = new Date().getMonth();
  let peSelectedPilarId = null; // pilar selecionado no modal

  // ── HELPERS DE DADOS ───────────────────────────────────
  function getPilares() {
    const c = window.gc ? window.gc() : null;
    if (!c) return DEFAULT_PILARES;
    if (!c.pautaPilares || !c.pautaPilares.length) {
      c.pautaPilares = JSON.parse(JSON.stringify(DEFAULT_PILARES));
      if (window.saveClients) window.saveClients();
    }
    return c.pautaPilares;
  }

  function getPilarById(id) {
    return getPilares().find(p => p.id === id) || null;
  }

  function getPilarByName(name) {
    return getPilares().find(p => p.name === name) || null;
  }

  function escH(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── 1. INJETAR TAB BUTTON ──────────────────────────────
  function injectTabButton() {
    const tabs = document.querySelector('.dt');
    if (!tabs) return;
    const conteudosBtn = Array.from(tabs.querySelectorAll('.tb'))
      .find(b => b.dataset.tab === 'conteudos');
    if (!conteudosBtn) return;
    if (tabs.querySelector('[data-tab="pauta-editorial"]')) return;
    const btn = document.createElement('button');
    btn.className = 'tb';
    btn.dataset.tab = 'pauta-editorial';
    btn.textContent = 'Pauta de Stories';
    btn.onclick = function() { window.swTab('pauta-editorial', btn); };
    conteudosBtn.after(btn);
  }

  // ── 2. INJETAR PAINEL HTML ─────────────────────────────
  function injectTabPanel() {
    if (document.getElementById('tp-pauta-editorial')) return;
    const dc = document.querySelector('.dc');
    if (!dc) return;
    const transpPanel = document.getElementById('tp-transporte');
    const panel = document.createElement('div');
    panel.className = 'tp';
    panel.id = 'tp-pauta-editorial';
    panel.innerHTML = `
      <!-- RÉGUA DE PILARES -->
      <div id="pe-ruler" style="position:sticky;top:-32px;z-index:50;background:var(--bg);border-bottom:1px solid var(--b);padding:10px 32px;margin:-32px -32px 0 -32px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:8px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--m)">Régua de pilares</div>
          <button onclick="window.openAddPilar(null)" style="background:none;border:1px dashed var(--b2);border-radius:5px;padding:3px 10px;color:var(--m);cursor:pointer;font-size:11px;font-family:'DM Sans',sans-serif">+ Pilar</button>
        </div>
        <div id="pe-ruler-items" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;min-height:36px;padding:7px 10px;background:var(--s2);border:1px solid var(--b);border-radius:8px">
          <span id="pe-ruler-empty" style="font-size:11px;color:var(--b2);font-style:italic">Adicione pilares para montar sua régua...</span>
        </div>
      </div>
      <!-- NAVEGAÇÃO MÊS -->
      <div style="position:sticky;top:calc(-32px + 80px);z-index:49;background:var(--bg);border-bottom:1px solid var(--b);padding:10px 32px;margin:0 -32px 16px -32px">
        <div class="cn2" style="margin-bottom:0">
          <button class="cnb" onclick="window.chPeMonth(-1)">&#8249;</button>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="cm2" id="pe-month-label"></div>
            <button class="cnb" onclick="window.openPautaDia(null)" style="font-size:11px;padding:5px 12px">+ Dia</button>
          </div>
          <button class="cnb" onclick="window.chPeMonth(1)">&#8250;</button>
        </div>
      </div>
      <!-- CALENDÁRIO -->
      <div class="cgrid" id="pe-grid"></div>
      <!-- LISTA -->
      <div style="margin-top:24px">
        <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--b)">Lista do mês</div>
        <div id="pe-list"></div>
      </div>
    `;
    if (transpPanel) dc.insertBefore(panel, transpPanel);
    else dc.appendChild(panel);
  }

  // ── 3. PATCH swTab ─────────────────────────────────────
  function patchSwTab() {
    const origSwTab = window.swTab;
    if (!origSwTab || origSwTab.__pautaPatched) return;
    window.swTab = function(t, b) {
      origSwTab(t, b);
      if (t === 'pauta-editorial') window.renderPautaEditorial();
    };
    window.swTab.__pautaPatched = true;
  }

  // ── RÉGUA: RENDERIZAR ──────────────────────────────────
  function renderPautaRegua() {
    const el = document.getElementById('pe-ruler-items');
    const empty = document.getElementById('pe-ruler-empty');
    if (!el) return;
    const pilares = getPilares();
    if (!pilares.length) {
      if (empty) empty.style.display = '';
      el.innerHTML = '<span id="pe-ruler-empty" style="font-size:11px;color:var(--b2);font-style:italic">Adicione pilares para montar sua régua...</span>';
      return;
    }
    el.innerHTML = pilares.map(p =>
      `<span onclick="window.openAddPilar('${p.id}')" style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;background:${p.color}22;border:1px solid ${p.color};color:${p.color};transition:all 0.15s" onmouseover="this.style.background='${p.color}44'" onmouseout="this.style.background='${p.color}22'">
        <span style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0"></span>${escH(p.name)}
      </span>`
    ).join('');
  }

  // ── RÉGUA: ADICIONAR / EDITAR PILAR ───────────────────
  window.openAddPilar = function(id) {
    const pilares = getPilares();
    const p = id ? pilares.find(x => x.id === id) : null;
    if (window.showMo) window.showMo(p ? 'Editar pilar' : 'Novo pilar',
      `<div class="fg2"><label>Nome do pilar</label>
        <input type="text" id="pe-pilar-nome" value="${escH(p ? p.name : '')}" placeholder="Ex: Bastidor, Venda, Dica...">
      </div>
      <div class="fg2"><label>Cor</label>
        <div style="display:flex;align-items:center;gap:12px">
          <input type="color" id="pe-pilar-cor" value="${p ? p.color : '#2A6B7C'}" style="width:60px;height:40px">
          <span id="pe-pilar-preview" style="flex:1;padding:8px 14px;border-radius:6px;font-size:13px;font-weight:600;text-align:center;background:${p ? p.color : '#2A6B7C'}22;border:1px solid ${p ? p.color : '#2A6B7C'};color:${p ? p.color : '#2A6B7C'}">${escH(p ? p.name : 'Pré-visualização')}</span>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="btn bp" style="flex:1" onclick="window.savePautaPilar('${id||''}')">Salvar</button>
        ${p ? `<button class="btn bd" onclick="window.delPautaPilar('${id}');window.closeMo()">Excluir</button>` : ''}
      </div>`
    );
    // Live preview
    setTimeout(() => {
      const corInput = document.getElementById('pe-pilar-cor');
      const nomeInput = document.getElementById('pe-pilar-nome');
      const preview = document.getElementById('pe-pilar-preview');
      function updatePreview() {
        const cor = corInput ? corInput.value : '#2A6B7C';
        const nome = nomeInput ? nomeInput.value || 'Pré-visualização' : '';
        if (preview) {
          preview.style.background = cor + '22';
          preview.style.borderColor = cor;
          preview.style.color = cor;
          preview.textContent = nome;
        }
      }
      if (corInput) corInput.addEventListener('input', updatePreview);
      if (nomeInput) nomeInput.addEventListener('input', updatePreview);
    }, 50);
  };

  window.savePautaPilar = function(id) {
    const nome = (document.getElementById('pe-pilar-nome') || {}).value;
    const cor  = (document.getElementById('pe-pilar-cor')  || {}).value;
    if (!nome || !nome.trim()) { if (window.toast) window.toast('Digite o nome do pilar', 'err'); return; }
    if (window.uc) {
      window.uc(c => {
        if (!c.pautaPilares || !c.pautaPilares.length) c.pautaPilares = JSON.parse(JSON.stringify(DEFAULT_PILARES));
        if (id) {
          const idx = c.pautaPilares.findIndex(p => p.id === id);
          if (idx >= 0) { c.pautaPilares[idx].name = nome.trim(); c.pautaPilares[idx].color = cor; }
        } else {
          c.pautaPilares.push({ id: 'pi' + Date.now(), name: nome.trim(), color: cor });
        }
      });
    }
    if (window.closeMo) window.closeMo();
    if (window.toast) window.toast(id ? 'Pilar atualizado!' : 'Pilar criado!');
    renderPautaRegua();
  };

  window.delPautaPilar = function(id) {
    if (window.uc) {
      window.uc(c => {
        if (c.pautaPilares) c.pautaPilares = c.pautaPilares.filter(p => p.id !== id);
      });
    }
    if (window.toast) window.toast('Pilar excluído');
    renderPautaRegua();
  };

  // ── CALENDÁRIO: RENDERIZAR ─────────────────────────────
  window.chPeMonth = function(d) {
    peM += d;
    if (peM > 11) { peM = 0; peY++; }
    if (peM < 0)  { peM = 11; peY--; }
    window.renderPautaEditorial();
  };

  window.renderPautaEditorial = function() {
    const c = window.gc ? window.gc() : null;
    if (!c) return;
    const MNAMES = window.MNAMES || ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const lbl = document.getElementById('pe-month-label');
    if (lbl) lbl.textContent = MNAMES[peM] + ' ' + peY;
    renderPautaRegua();
    const pe = c.pautaEditorial || {};
    const fd  = new Date(peY, peM, 1).getDay();
    const dim = new Date(peY, peM + 1, 0).getDate();
    const dp  = new Date(peY, peM, 0).getDate();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dows = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    let h = dows.map(dw => `<div class="cdow">${dw}</div>`).join('');
    for (let i = fd - 1; i >= 0; i--)
      h += `<div class="cday om"><div class="cdn">${dp - i}</div></div>`;
    for (let d = 1; d <= dim; d++) {
      const ds = peY + '-' + String(peM + 1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      const isT = new Date(ds + 'T12:00:00').getTime() === today.getTime();
      const dia = pe[ds];
      let card = '';
      if (dia) {
        const pilar = dia.pilarId ? getPilarById(dia.pilarId) : getPilarByName(dia.pilar);
        const cor = (pilar ? pilar.color : null) || dia.pilarColor || '#5a5a52';
        const nome = pilar ? pilar.name : (dia.pilar || '');
        card = `<div onclick="event.stopPropagation();window.openPautaDia('${ds}')"
          style="border-radius:5px;padding:5px 7px;font-size:10px;margin-bottom:4px;cursor:pointer;
          line-height:1.35;border-left:3px solid ${cor};background:${cor}22;
          box-shadow:0 1px 4px rgba(0,0,0,0.4);transition:transform 0.1s"
          onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform=''">
          <div style="font-weight:700;color:${cor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${dia.executado ? '✓ ' : ''}${escH(nome)}</div>
          <div style="font-size:9px;color:${cor};opacity:0.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px">${escH(dia.tema || '')}</div>
        </div>`;
      }
      h += `<div class="cday${isT ? ' td2' : ''}" onclick="window.openPautaDia('${ds}')">
        <div class="cdn">${d}</div>${card}<span class="cah">+</span>
      </div>`;
    }
    const tc = Math.ceil((fd + dim) / 7) * 7;
    for (let i = 1; i <= tc - (fd + dim); i++)
      h += `<div class="cday om"><div class="cdn">${i}</div></div>`;
    const grid = document.getElementById('pe-grid');
    if (grid) grid.innerHTML = h;
    renderPautaList();
  };

  function renderPautaList() {
    const c = window.gc ? window.gc() : null;
    if (!c) return;
    const el = document.getElementById('pe-list');
    if (!el) return;
    const pe = c.pautaEditorial || {};
    const ms = peY + '-' + String(peM + 1).padStart(2,'0');
    const MNAMES = window.MNAMES || ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const dias = Object.keys(pe).filter(d => d.startsWith(ms)).sort();
    if (!dias.length) {
      el.innerHTML = `<div class="empty"><div style="font-size:22px;opacity:0.5;margin-bottom:10px">📱</div>Nenhuma pauta em ${MNAMES[peM]} ${peY}</div>`;
      return;
    }
    el.innerHTML = dias.map(ds => {
      const dia = pe[ds];
      const pilar = dia.pilarId ? getPilarById(dia.pilarId) : getPilarByName(dia.pilar);
      const cor = (pilar ? pilar.color : null) || dia.pilarColor || '#5a5a52';
      const nome = pilar ? pilar.name : (dia.pilar || '');
      const dLabel = new Date(ds + 'T12:00:00').toLocaleDateString('pt-BR', {weekday:'short', day:'numeric', month:'short'});
      return `<div class="pi2" onclick="window.openPautaDia('${ds}')" style="flex-direction:column;align-items:stretch;gap:0">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:4px;min-height:44px;border-radius:2px;background:${cor};flex-shrink:0"></div>
          <div style="flex:1">
            <div style="font-size:11px;color:var(--m);margin-bottom:3px">${dLabel}</div>
            <div style="font-size:13px;font-weight:600;color:${cor};margin-bottom:2px">${escH(nome)}</div>
            <div style="font-size:12px;color:var(--t2)">${escH(dia.tema || '')}</div>
            ${dia.gancho ? `<div style="font-size:11px;color:var(--m);font-style:italic;margin-top:4px">${escH(dia.gancho)}</div>` : ''}
          </div>
          <span class="bdg" style="background:${dia.executado ? 'rgba(74,158,107,0.15)' : 'rgba(90,90,82,0.15)'};color:${dia.executado ? '#4a9e6b' : '#5a5a52'}">
            ${dia.executado ? 'Executado' : 'Pendente'}
          </span>
        </div>
      </div>`;
    }).join('');
  }

  // ── MODAL: ADICIONAR / EDITAR DIA ─────────────────────
  window.openPautaDia = function(dateStr) {
    const c = window.gc ? window.gc() : null;
    if (!c) return;
    const pe = c.pautaEditorial || {};
    const dia = dateStr ? pe[dateStr] : null;
    const pilares = getPilares();

    // Pilar pré-selecionado
    let selId = dia ? (dia.pilarId || (getPilarByName(dia.pilar) || {}).id || '') : '';

    function buildModal() {
      const chips = pilares.map(p => {
        const sel = p.id === selId;
        return `<span onclick="window._peSel('${p.id}')" id="pe-chip-${p.id}"
          style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:20px;
          font-size:12px;font-weight:600;cursor:pointer;transition:all 0.15s;
          background:${sel ? p.color : p.color + '22'};
          border:2px solid ${p.color};
          color:${sel ? '#fff' : p.color}">
          <span style="width:8px;height:8px;border-radius:50%;background:${sel ? '#fff' : p.color};flex-shrink:0;display:${sel ? 'none' : 'inline-block'}"></span>
          ${escH(p.name)}
        </span>`;
      }).join('');

      const noPilares = !pilares.length
        ? `<div style="font-size:12px;color:var(--m);padding:10px">Nenhum pilar cadastrado. <button onclick="window.openAddPilar(null);window.closeMo()" style="background:none;border:none;color:var(--al);cursor:pointer;font-size:12px;text-decoration:underline">Criar na régua</button></div>`
        : chips;

      if (window.showMo) window.showMo(dia ? 'Editar pauta de stories' : 'Nova pauta de stories',
        `<div class="fg2"><label>Data *</label>
          <input type="date" id="pe-data" value="${escH(dateStr || '')}">
        </div>
        <div class="fg2">
          <label>Pilar</label>
          <div style="display:flex;flex-wrap:wrap;gap:6px;padding:10px;background:var(--bg);border:1px solid var(--b);border-radius:6px;min-height:44px">${noPilares}</div>
          <input type="hidden" id="pe-pilar-sel" value="${escH(selId)}">
        </div>
        <div class="fg2"><label>Tema</label>
          <input type="text" id="pe-tema" value="${escH(dia ? dia.tema || '' : '')}" placeholder="Assunto principal do story">
        </div>
        <div class="fg2"><label>Gancho de abertura</label>
          <textarea id="pe-gancho" rows="2" placeholder="Frase de abertura que prende a atenção...">${escH(dia ? dia.gancho || '' : '')}</textarea>
        </div>
        <div class="fg2"><label>Objetivo</label>
          <textarea id="pe-objetivo" rows="2" placeholder="O que esse story precisa gerar?">${escH(dia ? dia.objetivo || '' : '')}</textarea>
        </div>
        <div class="fg2"><label>Material necessário</label>
          <textarea id="pe-material" rows="2" placeholder="Imagens, vídeos, gravações...">${escH(dia ? dia.material || '' : '')}</textarea>
        </div>
        <div class="fg2">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;text-transform:none;letter-spacing:0;font-size:13px;font-weight:400">
            <input type="checkbox" id="pe-exec" ${dia && dia.executado ? 'checked' : ''} style="width:17px;height:17px;accent-color:#4a9e6b;cursor:pointer">
            <span>Marcar como executado</span>
          </label>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn bp" style="flex:1" onclick="window.savePautaDia('${escH(dateStr || '')}')">Salvar</button>
          ${dia ? `<button class="btn bd" onclick="window.delPautaDia('${escH(dateStr)}');window.closeMo()">Excluir</button>` : ''}
        </div>`
      );
    }

    // Seleção de pilar (atualiza chips visualmente)
    window._peSel = function(id) {
      selId = id;
      const hidden = document.getElementById('pe-pilar-sel');
      if (hidden) hidden.value = id;
      pilares.forEach(p => {
        const chip = document.getElementById('pe-chip-' + p.id);
        if (!chip) return;
        const sel = p.id === id;
        chip.style.background = sel ? p.color : p.color + '22';
        chip.style.color = sel ? '#fff' : p.color;
        const dot = chip.querySelector('span');
        if (dot) dot.style.display = sel ? 'none' : 'inline-block';
      });
    };

    buildModal();
  };

  // ── SALVAR DIA ─────────────────────────────────────────
  window.savePautaDia = function(oldDate) {
    const newDate = (document.getElementById('pe-data') || {}).value;
    if (!newDate) { if (window.toast) window.toast('Selecione a data', 'err'); return; }
    const pilarId = (document.getElementById('pe-pilar-sel') || {}).value || '';
    const pilarObj = pilarId ? getPilarById(pilarId) : null;
    const dia = {
      pilarId:    pilarId,
      pilar:      pilarObj ? pilarObj.name  : '',
      pilarColor: pilarObj ? pilarObj.color : '#5a5a52',
      tema:       (document.getElementById('pe-tema')     || {value:''}).value.trim(),
      gancho:     (document.getElementById('pe-gancho')   || {value:''}).value.trim(),
      objetivo:   (document.getElementById('pe-objetivo') || {value:''}).value.trim(),
      material:   (document.getElementById('pe-material') || {value:''}).value.trim(),
      executado:  (document.getElementById('pe-exec')     || {checked:false}).checked
    };
    if (window.uc) {
      window.uc(c => {
        if (!c.pautaEditorial) c.pautaEditorial = {};
        if (oldDate && oldDate !== newDate) delete c.pautaEditorial[oldDate];
        c.pautaEditorial[newDate] = dia;
      });
    }
    if (window.closeMo) window.closeMo();
    if (window.toast) window.toast('Pauta salva!');
    window.renderPautaEditorial();
  };

  // ── EXCLUIR DIA ────────────────────────────────────────
  window.delPautaDia = function(dateStr) {
    if (window.uc) {
      window.uc(c => { if (c.pautaEditorial) delete c.pautaEditorial[dateStr]; });
    }
    if (window.toast) window.toast('Pauta removida');
    window.renderPautaEditorial();
  };

  // ── INICIALIZAÇÃO ──────────────────────────────────────
  function init() {
    injectTabButton();
    injectTabPanel();
    patchSwTab();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }

  const origOpenClient = window.openClient;
  if (origOpenClient) {
    window.openClient = function(id) {
      origOpenClient(id);
      injectTabButton();
      patchSwTab();
    };
  }

})();
