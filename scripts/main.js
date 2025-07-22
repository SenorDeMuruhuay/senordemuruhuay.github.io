let models = [];
let sections = [];

const whatsappNumbers = [
  '51900432978',
  '51935817987' 
];


async function loadSections() {
  const response = await fetch('data/sections.json');
  sections = await response.json();
}

async function loadModels() {
  const response = await fetch('data/models.json');
  models = await response.json();
}

function createSection({ id, title, filters, customText, imagenes }) {
  const container = document.getElementById('sections-container');
  const section = document.createElement('section');
  section.id = id;
  section.innerHTML = `
    <h2 class="${id}-title models-title">${title}</h2>
    ${customText ? `<p class="section-info">${customText}</p>` : ''}
    ${imagenes && imagenes.length > 0 ? `
      <div class="tumbas-gallery">
        ${imagenes.map(src => `
          <div class="model-gallery-item fade-in">
            <img src="${src}" class="tumba-img" alt="Tumba">
            <div class="model-info">
              <hr>
              <div class="model-title">Tumba</div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
    ${filters && filters.length > 0 ? `
      <div id="filters-bar-${id}" class="filters-bar-lapidas">
        ${filters.map(f => `
          <div class="filter-group">
            <label for="${f.id}">${f.label}</label>
            <select id="${f.id}"></select>
          </div>
        `).join('')}
      </div>
      <div id="model-list-${id}"></div>
      <div id="pagination-${id}" class="pagination"></div>
    ` : ''}
  `;
  container.appendChild(section);
}

function populateDynamicOptions(section) {
  section.filters.forEach(f => {
    const select = document.getElementById(f.id);
    if (f.dynamic) {
      select.innerHTML = `<option value="all">Todos</option>`;
      const values = [...new Set(models.filter(m => m.categoria === section.categoria).map(m => m.material))];
      values.forEach(val => {
        const option = document.createElement("option");
        option.value = val;
        option.textContent = val.charAt(0).toUpperCase() + val.slice(1);
        select.appendChild(option);
      });
    } else if (f.options) {
      select.innerHTML = f.options.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('');
    }
  });
}

function animateOnScroll() {
  const elements = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  elements.forEach(el => observer.observe(el));
}

function addLightboxEvents() {
  document.querySelectorAll('.model-gallery-item img').forEach(img => {
    img.style.cursor = "zoom-in";
    img.addEventListener('click', function() {
      const lightbox = document.getElementById('lightbox');
      const lightboxImg = document.getElementById('lightbox-img');
      const lightboxActions = document.getElementById('lightbox-actions');
      lightboxImg.src = this.src;
      lightboxActions.innerHTML = `
        <div class="lightbox-actions-panel">
          <a href="${this.src}" download class="whatsapp-btn" style="padding:0.4em 1em; font-size:0.95em;">Descargar imagen</a>
          <a href="https://wa.me/${whatsappNumbers[0]}?text=${encodeURIComponent('Hola, quiero información sobre este modelo: ' + this.src)}" target="_blank" class="whatsapp-btn" style="padding:0.4em 1em; font-size:0.95em;">WhatsApp 1</a>
          <a href="https://wa.me/${whatsappNumbers[1]}?text=${encodeURIComponent('Hola, quiero información sobre este modelo: ' + this.src)}" target="_blank" class="whatsapp-btn" style="padding:0.4em 1em; font-size:0.95em;">WhatsApp 2</a>
        </div>
      `;
      lightbox.classList.add('active');
    });
  });

  document.getElementById('lightbox-close').onclick = function() {
    document.getElementById('lightbox').classList.remove('active');
    document.getElementById('lightbox-img').src = "";
    document.getElementById('lightbox-actions').innerHTML = "";
  };

  document.getElementById('lightbox').onclick = function(e) {
    if (e.target === this) {
      this.classList.remove('active');
      document.getElementById('lightbox-img').src = "";
      document.getElementById('lightbox-actions').innerHTML = "";
    }
  };
}

function renderPaginatedList(items, containerId, paginationId, pageSize = 9) {
  let currentPage = 1;
  const container = document.getElementById(containerId);
  const pagination = document.getElementById(paginationId);

  function renderPage(page) {
    container.innerHTML = '';
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = items.slice(start, end);

    // Centrado si solo hay un modelo
    if (pageItems.length === 1) {
      container.classList.add('model-list-single');
    } else {
      container.classList.remove('model-list-single');
    }

    pageItems.forEach(model => {
      const card = document.createElement("div");
      card.className = "model-gallery-item fade-in";
      card.innerHTML = `
        <img src="${model.imagen}" alt="${model.nombre}">
        <div class="model-info">
          <hr>
          <div class="model-title">${model.nombre}</div>
          <div class="model-meta">
            <span class="model-material">${model.material ? model.material.charAt(0).toUpperCase() + model.material.slice(1) : ''}</span>
            <span class="model-price">${model.precio ? 'S/ ' + model.precio : ''}</span>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
    animateOnScroll();
    addLightboxEvents();
  }

  function renderPagination() {
    pagination.innerHTML = '';
    const pageCount = Math.ceil(items.length / pageSize);
    for (let i = 1; i <= pageCount; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === currentPage) btn.classList.add('active');
      btn.onclick = () => {
        currentPage = i;
        renderPage(currentPage);
        renderPagination();
      };
      pagination.appendChild(btn);
    }
  }

  renderPage(currentPage);
  renderPagination();
}

function getFilterValues(section) {
  const values = {};
  section.filters.forEach(f => {
    values[f.id] = document.getElementById(f.id).value;
  });
  return values;
}

function filterAndPaginateSection(section) {
  let filtered = models.filter(m => m.categoria === section.categoria);
  section.filters.forEach(f => {
    const value = document.getElementById(f.id).value;
    if (value !== "all") {
      if (f.id.startsWith("price-range")) {
        const [min, max] = value.split("-").map(Number);
        filtered = filtered.filter(m => m.precio >= min && m.precio <= max);
      } else {
        filtered = filtered.filter(m => m[f.id.replace(/-.+/, '')] === value);
      }
    }
  });
  renderPaginatedList(filtered, `model-list-${section.id}`, `pagination-${section.id}`);
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadSections();
  await loadModels();
  sections.forEach(section => {
    createSection(section);
    if (section.filters && section.filters.length > 0) {
      populateDynamicOptions(section);
      filterAndPaginateSection(section);
      section.filters.forEach(f => {
        document.getElementById(f.id).addEventListener("change", () => filterAndPaginateSection(section));
      });
    }
  });
});