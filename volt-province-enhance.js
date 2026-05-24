/* ============================================================
   VOLT Province Table Enhance — drop-in script
   Sorts the province table by risk descending, adds search,
   heat-colors the rate column, and shows Top 10 + expand.
   No markup changes required.
   ============================================================ */
(function () {
  const TOP_N = 10;
  let showAll = false;
  let rows = [];

  function parseRate(text) {
    const m = (text || '').match(/[\d.]+/);
    return m ? parseFloat(m[0]) : 0;
  }

  function paintHeatCell(cell, rate) {
    if (!cell) return;
    let bg, fg;
    if (rate >= 50)      { bg = '#FEE4E2'; fg = '#B42318'; }
    else if (rate >= 30) { bg = '#FEDF89'; fg = '#B54708'; }
    else if (rate >= 15) { bg = '#FEF0C7'; fg = '#854708'; }
    else if (rate > 0)   { bg = '#DCFAE6'; fg = '#067647'; }
    else                 { bg = '#F2F4F7'; fg = '#667085'; }
    cell.style.background = bg;
    cell.style.color = fg;
    cell.style.fontWeight = '700';
    cell.style.borderRadius = '6px';
    cell.style.textAlign = 'center';
  }

  function render() {
    const search = (document.getElementById('provSearch')?.value || '').toLowerCase().trim();
    let visible = 0;
    rows.forEach((r, i) => {
      const name = r.cells[0].textContent.toLowerCase();
      const matchSearch = !search || name.includes(search);
      const matchTop = showAll || i < TOP_N || search;
      if (matchSearch && matchTop) { r.style.display = ''; visible++; }
      else { r.style.display = 'none'; }
    });

    const btn = document.getElementById('provToggle');
    if (!btn) return;
    if (search) {
      btn.textContent = 'กรองได้ ' + visible + ' จังหวัด';
      btn.classList.add('is-disabled');
    } else {
      btn.classList.remove('is-disabled');
      btn.textContent = showAll
        ? '⬆ แสดง Top ' + TOP_N + ' จังหวัดเสี่ยงสุด'
        : '⬇ แสดงทั้งหมด (' + rows.length + ' จังหวัด)';
    }
  }

  function init() {
    const table = document.getElementById('provinceTable');
    if (!table || !table.tBodies[0]) return;
    const tbody = table.tBodies[0];
    rows = Array.from(tbody.rows);
    if (!rows.length) return;

    /* Compute risk metrics + sort */
    rows.forEach(r => {
      const total = parseInt(r.cells[1]?.textContent) || 0;
      const late  = parseInt(r.cells[4]?.textContent) || 0;
      const npl   = parseInt(r.cells[5]?.textContent) || 0;
      const rate  = parseRate(r.cells[6]?.textContent);
      r._rate = rate;
      r._risk = late + npl;          // absolute risk count (primary sort)
      r._total = total;
      paintHeatCell(r.cells[6], rate);
    });
    /* Primary: absolute risk count desc.  Secondary: rate desc. */
    rows.sort((a, b) => (b._risk - a._risk) || (b._rate - a._rate));
    rows.forEach(r => tbody.appendChild(r));

    /* Wrap table in a controls + container */
    const wrap = document.createElement('div');
    wrap.className = 'province-enhance';
    wrap.innerHTML = ''
      + '<div class="prov-head">'
      +   '<div class="prov-title">'
      +     '<span class="prov-title-main">📍 ภาพรวมตามจังหวัด</span>'
      +     '<span class="prov-title-sub">เรียงตามจำนวน Late + NPL สูงสุด</span>'
      +     '<span class="prov-title-hint">👆 คลิกที่แถวจังหวัด → ดูตำแหน่งบนแผนที่ทันที</span>'
      +   '</div>'
      +   '<div class="prov-controls">'
      +     '<input type="text" id="provSearch" placeholder="ค้นหาจังหวัด..." />'
      +     '<button id="provToggle" type="button"></button>'
      +   '</div>'
      + '</div>';
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);

    /* Wire events */
    document.getElementById('provSearch').addEventListener('input', render);
    document.getElementById('provToggle').addEventListener('click', function () {
      if (this.classList.contains('is-disabled')) return;
      showAll = !showAll;
      render();
    });

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ============================================================
   Follow-up history UI override
   Keeps the existing index.html compatible while making the
   customer history button and timeline cleaner.
   ============================================================ */
(function () {
  function escHtml(v) {
    return String(v ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  function money(n) {
    return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  function shortTimestamp(v) {
    const raw = String(v || '').trim();
    if (!raw) return '-';
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return raw.replace(/\s*GMT[^\n\r]*/, '').trim();
  }

  function shortDate(v) {
    const raw = String(v || '').trim();
    if (!raw) return '';
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    return raw.replace(/\s*GMT[^\n\r]*/, '').trim();
  }

  function styleHistoryButton(btn) {
    if (!btn) return;
    btn.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#FFC400;color:#1C1A00;font-size:12px;line-height:1">↺</span><span>ประวัติการติดตามทั้งหมด</span>';
    btn.style.background = '#1C1A00';
    btn.style.color = '#FFC400';
    btn.style.borderColor = '#1C1A00';
    btn.style.fontWeight = '700';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.gap = '8px';
    btn.style.justifyContent = 'flex-start';
  }

  function styleHistoryBox(box) {
    if (!box) return;
    box.style.maxHeight = '260px';
    box.style.border = '1px solid #e8d99a';
    box.style.borderRadius = '6px';
  }

  function enhanceOpenCustomerDetail() {
    document.querySelectorAll('[id^="historyBox-"]').forEach(styleHistoryBox);
    document.querySelectorAll('button[onclick^="fetchCommentHistory"]').forEach(function (btn) {
      if (!btn.id) {
        const m = btn.getAttribute('onclick').match(/fetchCommentHistory\((\d+)\)/);
        if (m) btn.id = 'historyBtn-' + m[1];
      }
      styleHistoryButton(btn);
    });
  }

  function getCustomers() {
    if (typeof customers !== 'undefined' && Array.isArray(customers)) return customers;
    try {
      return JSON.parse(document.getElementById('customer-data')?.textContent || '[]');
    } catch (_) {
      return [];
    }
  }

  const originalOpenCustomerModal = window.openCustomerModal;
  if (typeof originalOpenCustomerModal === 'function') {
    window.openCustomerModal = function () {
      const result = originalOpenCustomerModal.apply(this, arguments);
      setTimeout(enhanceOpenCustomerDetail, 0);
      return result;
    };
  }

  const originalToggleCustomerDetail = window.toggleCustomerDetail;
  if (typeof originalToggleCustomerDetail === 'function') {
    window.toggleCustomerDetail = function () {
      const result = originalToggleCustomerDetail.apply(this, arguments);
      setTimeout(enhanceOpenCustomerDetail, 0);
      return result;
    };
  }

  if (window.COMMENT_SUBMIT_URL || typeof COMMENT_SUBMIT_URL !== 'undefined') {
    window.fetchCommentHistory = function (idx) {
      const customerRows = getCustomers();
      const c = customerRows[idx];
      if (!c) return;
      const endpoint = window.COMMENT_SUBMIT_URL || COMMENT_SUBMIT_URL;
      const voltId = encodeURIComponent(c.id || c.crm_id || '');
      if (!voltId || !endpoint) return;

      const cb = 'voltHist_' + idx + '_' + Date.now();
      const histBox = document.getElementById('historyBox-' + idx);
      const btn = document.getElementById('historyBtn-' + idx);
      if (!histBox) return;

      styleHistoryButton(btn);
      styleHistoryBox(histBox);
      histBox.style.display = 'block';
      histBox.innerHTML = '<div class="muted" style="padding:6px 0">กำลังโหลดประวัติการติดตาม...</div>';
      if (btn) btn.textContent = 'กำลังโหลดประวัติการติดตาม...';

      window[cb] = function (data) {
        styleHistoryButton(btn);
        if (!histBox) return;
        if (!data || !data.length) {
          histBox.innerHTML = '<div class="muted" style="padding:6px 0">ยังไม่มีประวัติการติดตามของลูกค้ารายนี้ใน Comment Log</div>';
          delete window[cb];
          return;
        }
        histBox.innerHTML = '<div style="font-weight:700;color:#8B6500;margin-bottom:6px">ประวัติการติดตาม ' + data.length + ' รายการ</div>' + data.map(function (r) {
          const ptp = Number(String(r.ptp_amount || '').replace(/,/g, '')) || 0;
          const meta = [
            r.contact_status ? 'ผลติดต่อ: ' + escHtml(r.contact_status) : '',
            ptp ? 'PTP: ' + money(ptp) + (r.ptp_date ? ' | ' + escHtml(shortDate(r.ptp_date)) : '') : '',
            r.next_call_date ? 'โทรถัดไป: ' + escHtml(shortDate(r.next_call_date)) : '',
            r.case_status ? 'สถานะเคส: ' + escHtml(r.case_status) : ''
          ].filter(Boolean).join(' · ');
          return '<div style="border-bottom:1px solid var(--line);padding:8px 0;margin-bottom:4px">'
            + '<div style="font-size:11px;color:var(--muted);margin-bottom:3px">'
            + '<b>' + escHtml(shortTimestamp(r.timestamp)) + '</b> | ' + escHtml(r.comment_by || '-')
            + (r.status ? '<span style="background:#FFC400;color:#1C1A00;border-radius:4px;padding:1px 6px;margin-left:4px;font-size:10px">' + escHtml(r.status) + '</span>' : '')
            + '</div>'
            + '<div style="font-size:13px;color:var(--text);white-space:pre-wrap">' + escHtml(r.comment || '-') + '</div>'
            + (meta ? '<div style="font-size:11px;color:#1f6f43;margin-top:4px">' + meta + '</div>' : '')
            + '</div>';
        }).join('');
        delete window[cb];
      };

      const s = document.createElement('script');
      s.src = endpoint + '?action=history&volt_id=' + voltId + '&callback=' + cb;
      s.onerror = function () {
        styleHistoryButton(btn);
        histBox.innerHTML = '<div class="muted" style="padding:6px 0">โหลดประวัติไม่สำเร็จ กรุณาลองใหม่หรือเปิด Comment Log</div>';
        delete window[cb];
      };
      document.head.appendChild(s);
      setTimeout(function () {
        if (window[cb]) {
          styleHistoryButton(btn);
          histBox.innerHTML = '<div class="muted" style="padding:6px 0">โหลดประวัติไม่สำเร็จ กรุณาลองใหม่หรือเปิด Comment Log</div>';
          delete window[cb];
        }
      }, 10000);
    };
  }

  document.addEventListener('DOMContentLoaded', enhanceOpenCustomerDetail);
})();
