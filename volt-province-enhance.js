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
