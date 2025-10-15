// skills.js — transforms <li data-level="NN">Name</li> into an accessible skill slider row
(function () {
  'use strict';

  function createSkillRow(name, level) {
    const li = document.createElement('li');
    li.className = 'skill-item';

    const row = document.createElement('div');
    row.className = 'skill-row';

    const nameEl = document.createElement('div');
    nameEl.className = 'skill-name';
    nameEl.textContent = name;
    // create a compact skill bar (small height) with a colored fill
    const bar = document.createElement('div');
    bar.className = 'skill-bar small';

    const fill = document.createElement('div');
    fill.className = 'skill-fill';
    fill.setAttribute('aria-hidden', 'true');
    fill.dataset.target = String(level);

  // use a consistent site blue gradient for all skills
  fill.style.background = 'linear-gradient(90deg, #2d89ef, #1ea0ff)';

    bar.appendChild(fill);

    const value = document.createElement('div');
    value.className = 'skill-value';
    value.textContent = level + '%';

  row.appendChild(nameEl);
  row.appendChild(bar);
  row.appendChild(value);
    li.appendChild(row);

    return li;
  }

  function enhanceList(list) {
    // convert li[data-level] in a specific list into enhanced rows
    const items = Array.from(list.querySelectorAll('li[data-level]'));
    if (items.length === 0) return;

    const frag = document.createDocumentFragment();
    items.forEach(orig => {
      const name = orig.textContent.trim();
      const level = Math.max(0, Math.min(100, Number(orig.getAttribute('data-level') || 0)));
      const row = createSkillRow(name, level);
      frag.appendChild(row);
    });
    list.innerHTML = '';
    list.appendChild(frag);
  }

  function animateList(list) {
    // animate compact bar fills
    const fills = list.querySelectorAll('.skill-bar .skill-fill');
    fills.forEach(fill => {
      const target = Number(fill.dataset.target || 0);
      setTimeout(() => { fill.style.width = target + '%'; }, 120);
    });
  }

  function enhanceSkills() {
    // enhance all lists inside skill panels
    const lists = Array.from(document.querySelectorAll('.skills-list'));
    if (lists.length === 0) return;
    lists.forEach(enhanceList);

    // set up tab behavior if present
    const tabButtons = Array.from(document.querySelectorAll('.tab-button'));
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        // set active states
        tabButtons.forEach(b => {
          const isActive = b === btn;
          b.classList.toggle('active', isActive);
          b.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        // switch panels
        const panels = document.querySelectorAll('.skills-panel');
        panels.forEach(p => {
          const show = p.id === targetId;
          p.hidden = !show;
          if (show) {
            // animate fills within this panel
            const list = p.querySelector('.skills-list');
            if (list) animateList(list);
          }
        });
      });
    });

    // observe panels coming into view — animate the currently visible panel
    const panels = document.querySelectorAll('.skills-panel');
    const panelObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const list = entry.target.querySelector('.skills-list');
          if (list) animateList(list);
        }
      });
    }, { threshold: 0.25 });

    panels.forEach(p => panelObserver.observe(p));
  }

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceSkills);
  } else {
    enhanceSkills();
  }

})();
