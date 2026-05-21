/**
 * CCA SAS - Consultores Cambiarios Asociados S.A.S.
 * Front-end Interactions & Lead Capture Logic
 */

// URL del Web App de Google Apps Script (Reemplazar por tu URL para conectar con Google Sheets y Gmail)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQHHYih_XxRmpgZMUWqkz93SCIPq0lXRF6RXgNManYX7XBslpPTujXTZe3pZbBYO1c/exechttps://script.google.com/macros/s/AKfycbwQHHYih_XxRmpgZMUWqkz93SCIPq0lXRF6RXgNManYX7XBslpPTujXTZe3pZbBYO1c/exec';
NOTIFICATION_EMAIL = 'asesoria@ccambiarios.com';

document.addEventListener('DOMContentLoaded', () => {
  initScrollHeader();
  initServiceSelectRedirect();
  initFormValidation();
  initMobileMenu();
  initAdminDashboard();
  initCRMInputListeners();
});

/**
 * Adds styling to header on scroll
 */
function initScrollHeader() {
  const header = document.querySelector('.header');

  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Run once in case user loaded page scrolled down
}

/**
 * Custom micro-interaction: Clicking "Cotizar" or "Saber más" on a service card
 * scrolls down to the CTA form and pre-selects that specific service.
 */
function initServiceSelectRedirect() {
  const ctaButtons = document.querySelectorAll('.service-card .service-link, .hero-btns .btn-primary');
  const serviceSelect = document.getElementById('servicio');

  ctaButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();

      const targetId = button.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      // Pre-select service if specified in data attribute
      const serviceValue = button.getAttribute('data-service');
      if (serviceValue && serviceSelect) {
        serviceSelect.value = serviceValue;
      }

      // Smooth scroll to target
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Offset for sticky header
          behavior: 'smooth'
        });
      }
    });
  });
}

/**
 * Handles validation and lead capture submission
 */
function initFormValidation() {
  const form = document.getElementById('lead-form');
  const overlay = document.querySelector('.success-overlay');
  const resetBtn = document.getElementById('success-reset');

  if (!form) return;

  const fields = {
    nombre: document.getElementById('nombre'),
    telefono: document.getElementById('telefono'),
    email: document.getElementById('email'),
    empresa: document.getElementById('empresa'),
    servicio: document.getElementById('servicio')
  };

  // Validation patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9+\s\-()]{7,15}$/;

  // Validate single field
  const validateField = (field, condition, message) => {
    const group = field.closest('.form-group');
    const feedback = group.querySelector('.invalid-feedback');

    if (condition) {
      group.classList.remove('is-invalid');
      if (feedback) feedback.textContent = '';
      return true;
    } else {
      group.classList.add('is-invalid');
      if (feedback) feedback.textContent = message;
      return false;
    }
  };

  // Setup real-time blur/input validation for professional feedback
  fields.nombre.addEventListener('blur', () => {
    validateField(fields.nombre, fields.nombre.value.trim().length >= 3, 'El nombre debe tener al menos 3 caracteres.');
  });

  fields.telefono.addEventListener('blur', () => {
    validateField(fields.telefono, phoneRegex.test(fields.telefono.value.trim()), 'Ingrese un número de teléfono válido.');
  });

  fields.email.addEventListener('blur', () => {
    validateField(fields.email, emailRegex.test(fields.email.value.trim()), 'Ingrese un correo electrónico válido.');
  });

  fields.empresa.addEventListener('blur', () => {
    validateField(fields.empresa, fields.empresa.value.trim().length >= 2, 'Ingrese el nombre de su empresa.');
  });

  fields.servicio.addEventListener('change', () => {
    validateField(fields.servicio, fields.servicio.value !== '', 'Por favor, seleccione un servicio.');
  });

  // Handle submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all fields on submit
    const isNombreValid = validateField(fields.nombre, fields.nombre.value.trim().length >= 3, 'El nombre debe tener al menos 3 caracteres.');
    const isTelefonoValid = validateField(fields.telefono, phoneRegex.test(fields.telefono.value.trim()), 'Ingrese un número de teléfono válido.');
    const isEmailValid = validateField(fields.email, emailRegex.test(fields.email.value.trim()), 'Ingrese un correo electrónico válido.');
    const isEmpresaValid = validateField(fields.empresa, fields.empresa.value.trim().length >= 2, 'Ingrese el nombre de su empresa.');
    const isServicioValid = validateField(fields.servicio, fields.servicio.value !== '', 'Por favor, seleccione un servicio.');

    if (isNombreValid && isTelefonoValid && isEmailValid && isEmpresaValid && isServicioValid) {
      // Simulate API loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="spinner" viewBox="0 0 50 50" style="animation: rotate 2s linear infinite; width: 20px; height: 20px;">
          <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="80, 200" stroke-dashoffset="0" stroke-linecap="round"></circle>
        </svg> Enviando...
      `;

      // Injecting spinner style dynamically to keep it self-contained
      if (!document.getElementById('spinner-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.textContent = `
          @keyframes rotate { 100% { transform: rotate(360deg); } }
          .spinner { margin-right: 8px; vertical-align: middle; display: inline-block; }
        `;
        document.head.appendChild(style);
      }

      const leadData = {
        id: 'lead_' + Date.now(),
        fecha: getFormattedDate(),
        nombre: fields.nombre.value.trim(),
        telefono: fields.telefono.value.trim(),
        email: fields.email.value.trim(),
        empresa: fields.empresa.value.trim(),
        servicio: fields.servicio.value,
        estado: 'Nuevo',
        fechaContacto: '',
        detallesCaso: '',
        visita: 'sin_agendar',
        valorServicio: 0,
        estadoPago: 'sin_cotizar'
      };

      // Guardado local de respaldo inmediato
      saveLeadToDatabase(leadData);

      const isCloudConfigured = APPS_SCRIPT_URL && APPS_SCRIPT_URL.trim() !== '' && !APPS_SCRIPT_URL.includes('TU_URL_DE_APPS_SCRIPT');

      if (isCloudConfigured) {
        try {
          await saveOrUpdateLeadCloud(leadData, true);
        } catch (err) {
          console.error('Error sincronizando lead con Google Sheets:', err);
        }
      } else {
        // Simulación premium si no está en la nube para mantener UX fluida
        await new Promise(resolve => setTimeout(resolve, 1200));
      }

      // Show success animation overlay
      overlay.classList.add('active');

      // Reset submit button state
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });

  // Handle success overlay reset
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
      form.reset();

      // Clear validation state
      Object.values(fields).forEach(field => {
        const group = field.closest('.form-group');
        group.classList.remove('is-invalid');
      });
    });
  }
}

/**
 * Mobile Navigation Menu (Simulates modal toggle or quick alert on mobile viewport)
 */
function initMobileMenu() {
  const menuBtn = document.querySelector('.nav-mobile-btn');

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      // In a single-page corporate template, scroll to CTA is the primary path
      const target = document.querySelector('#contact');
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  }
}

/* ==========================================================================
   Phase 3: Lead Database & Visual Administration Panel Logic
   ========================================================================== */

/**
 * Initializes listeners and behaviors for the Secret Admin Portal (#admin)
 */
function initAdminDashboard() {
  const loginForm = document.getElementById('admin-login-form');
  const passcodeField = document.getElementById('admin-passcode');
  const gateCloseBtn = document.getElementById('gate-close');
  const logoutBtn = document.getElementById('db-logout-btn');
  const exportBtn = document.getElementById('db-export-btn');
  const searchInput = document.getElementById('db-search');

  // Listen for hash navigation
  window.addEventListener('hashchange', handleHashNavigation);
  handleHashNavigation(); // Run immediately in case loaded directly with hash

  // Handle secret password submit
  if (loginForm && passcodeField) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const passcode = passcodeField.value.trim();
      const gateError = document.getElementById('gate-error');

      if (passcode === 'CCA2026') {
        gateError.style.display = 'none';
        sessionStorage.setItem('cca_admin_auth', 'true');
        passcodeField.value = '';

        // Navigate
        toggleDashboardVisibility(true, false);
        renderAdminLeads();
      } else {
        gateError.style.display = 'block';
      }
    });

    // Clear validation error on type
    passcodeField.addEventListener('input', () => {
      const gateError = document.getElementById('gate-error');
      if (gateError) gateError.style.display = 'none';
    });
  }

  // Close / Exit buttons
  if (gateCloseBtn) {
    gateCloseBtn.addEventListener('click', () => {
      window.location.hash = '';
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('cca_admin_auth');
      window.location.hash = '';
    });
  }

  // Export button
  if (exportBtn) {
    exportBtn.addEventListener('click', exportLeadsToCSV);
  }

  // Filter leads on search typing
  if (searchInput) {
    searchInput.addEventListener('input', renderAdminLeads);
  }
}

/**
 * Manages display status of layout blocks depending on whether admin panel is active
 */
function toggleDashboardVisibility(showAdmin, showGate) {
  const mainElements = [
    document.querySelector('.header'),
    document.querySelector('.hero'),
    document.querySelector('#services'),
    document.querySelector('#why-us'),
    document.querySelector('#contact'),
    document.querySelector('.footer')
  ];

  const adminGate = document.getElementById('admin-gate');
  const adminDashboard = document.getElementById('admin-dashboard');

  if (showAdmin || showGate) {
    // Hide standard landing page elements
    mainElements.forEach(el => {
      if (el) el.style.display = 'none';
    });

    // Manage overlay visibility
    if (adminGate) adminGate.style.display = showGate ? 'flex' : 'none';
    if (adminDashboard) adminDashboard.style.display = showAdmin ? 'flex' : 'none';

    // Disable main body scroll for absolute focus
    document.body.style.overflow = 'hidden';
  } else {
    // Restore standard landing page elements
    mainElements.forEach(el => {
      if (el) el.style.display = '';
    });

    // Hide admin overlays
    if (adminGate) adminGate.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'none';

    // Enable body scroll
    document.body.style.overflow = '';
  }
}

/**
 * Evaluates hash value and initiates login checks or rendering
 */
function handleHashNavigation() {
  const hash = window.location.hash;

  if (hash === '#admin') {
    const isAuthed = sessionStorage.getItem('cca_admin_auth') === 'true';
    if (isAuthed) {
      toggleDashboardVisibility(true, false);
      loadLeadsFromServer();
    } else {
      toggleDashboardVisibility(false, true);
    }
  } else {
    toggleDashboardVisibility(false, false);
  }
}

/**
 * Returns formatted local timestamp YYYY-MM-DD HH:MM:SS
 */
function getFormattedDate() {
  const now = new Date();
  const pad = (num) => String(num).padStart(2, '0');

  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Saves a new lead entry to the browser's database
 */
function saveLeadToDatabase(lead) {
  try {
    const leads = JSON.parse(localStorage.getItem('cca_leads') || '[]');
    leads.unshift(lead); // Push newest lead to front of array
    localStorage.setItem('cca_leads', JSON.stringify(leads));
  } catch (error) {
    console.error('Error saving lead to local database:', error);
  }
}

/**
 * Renders database entries inside admin panel table
 */
function renderAdminLeads() {
  const leadsRows = document.getElementById('db-leads-rows');
  const emptyState = document.getElementById('db-empty-message');
  const searchInput = document.getElementById('db-search');

  const totalLeadsSpan = document.getElementById('stat-total-leads');
  const newLeadsSpan = document.getElementById('stat-new-leads');
  const processLeadsSpan = document.getElementById('stat-process-leads');

  if (!leadsRows) return;

  const leads = JSON.parse(localStorage.getItem('cca_leads') || '[]');
  const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

  // Calculate summary stats
  const total = leads.length;
  const nuevoCount = leads.filter(l => l.estado === 'Nuevo').length;
  const procesoCount = leads.filter(l => l.estado === 'En Proceso').length;

  if (totalLeadsSpan) totalLeadsSpan.textContent = total;
  if (newLeadsSpan) newLeadsSpan.textContent = nuevoCount;
  if (processLeadsSpan) processLeadsSpan.textContent = procesoCount;

  // Filter leads based on search term
  const filteredLeads = leads.filter(lead => {
    return (
      lead.nombre.toLowerCase().includes(searchTerm) ||
      lead.empresa.toLowerCase().includes(searchTerm) ||
      lead.email.toLowerCase().includes(searchTerm) ||
      lead.servicio.toLowerCase().includes(searchTerm) ||
      (lead.detallesCaso && lead.detallesCaso.toLowerCase().includes(searchTerm)) ||
      lead.telefono.toLowerCase().includes(searchTerm)
    );
  });

  // Empty state handling
  if (filteredLeads.length === 0) {
    leadsRows.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  // Render rows dynamically
  leadsRows.innerHTML = filteredLeads.map(lead => {
    // Visit Status
    let visitClass = 'status-visit-none';
    let visitText = 'Sin agendar';
    if (lead.visita === 'virtual') {
      visitClass = 'status-visit-virtual';
      visitText = 'Virtual';
    } else if (lead.visita === 'presencial') {
      visitClass = 'status-visit-presencial';
      visitText = 'Presencial';
    }

    // Formatted Value
    const formattedValor = formatCOP(lead.valorServicio || 0);

    // Payment Status
    let payClass = 'status-pay-none';
    let payText = 'Sin cotizar';
    if (lead.estadoPago === 'pendiente') {
      payClass = 'status-pay-pending';
      payText = 'Pendiente';
    } else if (lead.estadoPago === 'pagado') {
      payClass = 'status-pay-paid';
      payText = 'Pagado';
    } else if (lead.estadoPago === 'cuotas') {
      payClass = 'status-pay-cuotas';
      payText = 'Cuotas';
    }

    // Lead Status
    let statusClass = 'status-new';
    if (lead.estado === 'En Proceso') statusClass = 'status-process';
    if (lead.estado === 'Contactado') statusClass = 'status-contacted';

    return `
      <tr data-id="${lead.id}">
        <td style="white-space: nowrap; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: #64748b;">
          ${lead.fecha}
        </td>
        <td>
          <div style="font-weight: 600; color: #ffffff;">${escapeHtml(lead.nombre)}</div>
          <div style="font-size: 0.78rem; margin-top: 2px;"><a href="mailto:${lead.email}" style="color: #c5a880; text-decoration: underline;">${escapeHtml(lead.email)}</a></div>
        </td>
        <td>${escapeHtml(lead.empresa)}</td>
        <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem;">${escapeHtml(lead.telefono)}</td>
        <td style="font-size: 0.85rem; color: #94a3b8;">${escapeHtml(lead.servicio)}</td>
        <td>
          <span class="status-badge ${visitClass}">${visitText}</span>
        </td>
        <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; font-weight: 600; color: #ffffff;">
          ${formattedValor}
        </td>
        <td>
          <span class="status-badge ${payClass}">${payText}</span>
        </td>
        <td>
          <span class="status-badge ${statusClass}">${lead.estado}</span>
        </td>
        <td>
          <div style="display: flex; gap: 8px; align-items: center; justify-content: center;">
            <select class="status-select" onchange="updateLeadStatus('${lead.id}', this.value)">
              <option value="Nuevo" ${lead.estado === 'Nuevo' ? 'selected' : ''}>Nuevo</option>
              <option value="En Proceso" ${lead.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
              <option value="Contactado" ${lead.estado === 'Contactado' ? 'selected' : ''}>Contactado</option>
            </select>
            <button class="db-crm-btn" onclick="openCRMModal('${lead.id}')" title="Gestionar Caso (CRM)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </button>
            <button class="db-action-btn" onclick="deleteLead('${lead.id}')" title="Eliminar registro">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Globally-exposed status modifier function
 */
window.updateLeadStatus = async function (id, newStatus) {
  try {
    const leads = JSON.parse(localStorage.getItem('cca_leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id === id);
    if (leadIndex !== -1) {
      leads[leadIndex].estado = newStatus;
      localStorage.setItem('cca_leads', JSON.stringify(leads));
      renderAdminLeads();

      const isCloudConfigured = APPS_SCRIPT_URL && APPS_SCRIPT_URL.trim() !== '' && !APPS_SCRIPT_URL.includes('TU_URL_DE_APPS_SCRIPT');
      if (isCloudConfigured) {
        showCRMToast('Sincronizando estado en la nube...');
        const success = await saveOrUpdateLeadCloud(leads[leadIndex], false);
        if (success) {
          showCRMToast('Estado actualizado en Google Sheets.');
        } else {
          showCRMToast('Guardado localmente. Error de conexión.');
        }
      }
    }
  } catch (error) {
    console.error('Error updating lead status in local database:', error);
  }
};

/**
 * Globally-exposed record deletion function
 */
window.deleteLead = function (id) {
  if (confirm('¿Está seguro de que desea eliminar permanentemente este registro de contacto?')) {
    try {
      const leads = JSON.parse(localStorage.getItem('cca_leads') || '[]');
      const filtered = leads.filter(l => l.id !== id);
      localStorage.setItem('cca_leads', JSON.stringify(filtered));
      renderAdminLeads();
    } catch (error) {
      console.error('Error deleting lead from local database:', error);
    }
  }
};

/**
 * Downloads database array as a CSV sheet with premium UTF-8 BOM encoding
 */
function exportLeadsToCSV() {
  const leads = JSON.parse(localStorage.getItem('cca_leads') || '[]');
  if (leads.length === 0) {
    alert('No hay leads almacenados para exportar.');
    return;
  }

  // Build header row with 12 columns
  const headers = [
    'Fecha',
    'Nombre',
    'Empresa',
    'Teléfono',
    'Correo Electrónico',
    'Servicio Solicitado',
    'Fecha de Contacto CRM',
    'Visita Agendada',
    'Valor Cotizado',
    'Esquema de Pago',
    'Estado Lead',
    'Detalles del Caso / Notas'
  ];


  // Format cells
  const rows = leads.map(lead => {
    // Translate visita value to human readable Spanish
    let visitaText = 'Sin agendar';
    if (lead.visita === 'virtual') visitaText = 'Reunión Virtual';
    if (lead.visita === 'presencial') visitaText = 'Visita Presencial';

    // Translate payment value to human readable Spanish
    let pagoText = 'Sin cotizar';
    if (lead.estadoPago === 'pendiente') pagoText = 'Pendiente de Pago';
    if (lead.estadoPago === 'pagado') pagoText = 'Pagado (Contado)';
    if (lead.estadoPago === 'cuotas') pagoText = 'Pago en Cuotas';

    return [
      lead.fecha || '',
      lead.nombre || '',
      lead.empresa || '',
      lead.telefono || '',
      lead.email || '',
      lead.servicio || '',
      lead.fechaContacto || '',
      visitaText,
      lead.valorServicio || 0,
      pagoText,
      lead.estado || '',
      lead.detallesCaso || ''
    ];
  });

  // Enclose values in quotes and escape internal quotes to follow RFC 4180
  const csvContent = [headers, ...rows]
    .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // Export as download with UTF-8 BOM to prevent accents displaying as corrupt text in Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `leads_comerciales_cca_sas_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Simple HTML sanitizer
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   Phase 5: CRM Case Management Overlay Modal Controllers
   ========================================================================== */

let currentEditingLeadId = null;

/**
 * Colombian Peso COP string formatting utility
 */
function formatCOP(value) {
  if (isNaN(value) || value === '' || value === null) return '$ 0';
  return '$ ' + new Intl.NumberFormat('es-CO').format(value);
}

/**
 * Attaches event listeners for the split-column CRM Editor Modal
 */
function initCRMInputListeners() {
  const valInput = document.getElementById('crm-field-valor');
  const formattedSpan = document.getElementById('crm-valor-formatted');

  if (valInput && formattedSpan) {
    valInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      formattedSpan.textContent = formatCOP(isNaN(val) ? 0 : val);
    });
  }

  const closeBtn = document.getElementById('crm-close-btn');
  const cancelBtn = document.getElementById('crm-cancel-btn');
  const modal = document.getElementById('crm-modal');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeCRMModal);
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeCRMModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeCRMModal();
      }
    });
  }

  const form = document.getElementById('crm-editor-form');
  if (form) {
    form.addEventListener('submit', saveCRMDetails);
  }
}

/**
 * Opens double-column glassmorphic modal prefilled with CRM Case Details
 */
window.openCRMModal = function (leadId) {
  currentEditingLeadId = leadId;
  const leads = JSON.parse(localStorage.getItem('cca_leads') || '[]');
  const lead = leads.find(l => l.id === leadId);
  if (!lead) return;

  // Set Read-Only inbound details
  document.getElementById('crm-field-nombre').value = lead.nombre || '';
  document.getElementById('crm-field-empresa').value = lead.empresa || '';
  document.getElementById('crm-field-telefono').value = lead.telefono || '';
  document.getElementById('crm-field-email').value = lead.email || '';
  document.getElementById('crm-field-servicio').value = lead.servicio || '';

  // Prefill interactive CRM controls
  document.getElementById('crm-field-fecha-contacto').value = lead.fechaContacto || '';
  document.getElementById('crm-field-visita').value = lead.visita || 'sin_agendar';

  const valor = lead.valorServicio || 0;
  document.getElementById('crm-field-valor').value = valor || '';
  document.getElementById('crm-valor-formatted').textContent = formatCOP(valor);

  document.getElementById('crm-field-pago').value = lead.estadoPago || 'sin_cotizar';
  document.getElementById('crm-field-detalles').value = lead.detallesCaso || '';

  // Custom visual feedback on client header
  const clientTitle = document.getElementById('crm-client-title');
  if (clientTitle) {
    clientTitle.textContent = `Gestión de Caso: ${lead.nombre} (${lead.empresa})`;
  }

  const modal = document.getElementById('crm-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
};

/**
 * Closes the CRM Modal and recovers dashboard overlay viewport stability
 */
window.closeCRMModal = function () {
  const modal = document.getElementById('crm-modal');
  if (modal) {
    modal.style.display = 'none';
    const adminDashboard = document.getElementById('admin-dashboard');
    if (adminDashboard && adminDashboard.style.display === 'flex') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
  currentEditingLeadId = null;
};

/**
 * Processes CRM modifications, saves them to database, and triggers notifications
 */
async function saveCRMDetails(e) {
  e.preventDefault();
  if (!currentEditingLeadId) return;

  const leads = JSON.parse(localStorage.getItem('cca_leads') || '[]');
  const leadIndex = leads.findIndex(l => l.id === currentEditingLeadId);
  if (leadIndex === -1) return;

  const lead = leads[leadIndex];

  // Parse modified inputs
  const fechaContacto = document.getElementById('crm-field-fecha-contacto').value;
  const visita = document.getElementById('crm-field-visita').value;
  const valorInput = document.getElementById('crm-field-valor').value;
  const valorServicio = valorInput ? parseInt(valorInput, 10) : 0;
  const estadoPago = document.getElementById('crm-field-pago').value;
  const detallesCaso = document.getElementById('crm-field-detalles').value;

  // Smart Workflow Transition: Upgrade "Nuevo" -> "En Proceso" when saving notes/modifying
  let newEstado = lead.estado;
  if (lead.estado === 'Nuevo') {
    if (fechaContacto || detallesCaso.trim() !== '' || visita !== 'sin_agendar' || valorServicio > 0 || estadoPago !== 'sin_cotizar') {
      newEstado = 'En Proceso';
    }
  }

  // Update object database schema
  const updatedLead = {
    ...lead,
    fechaContacto,
    visita,
    valorServicio,
    estadoPago,
    detallesCaso,
    estado: newEstado
  };
  leads[leadIndex] = updatedLead;

  localStorage.setItem('cca_leads', JSON.stringify(leads));

  // Render table changes and close modal
  renderAdminLeads();
  closeCRMModal();

  // Floating notification trigger
  showCRMToast(`Guardando cambios en la nube...`);

  const isCloudConfigured = APPS_SCRIPT_URL && APPS_SCRIPT_URL.trim() !== '' && !APPS_SCRIPT_URL.includes('TU_URL_DE_APPS_SCRIPT');
  if (isCloudConfigured) {
    try {
      const success = await saveOrUpdateLeadCloud(updatedLead, false);
      if (success) {
        showCRMToast(`Caso de ${lead.nombre} guardado en Google Sheets.`);
      } else {
        showCRMToast(`Guardado en caché local. Error al conectar con Google.`);
      }
    } catch (err) {
      console.error(err);
      showCRMToast(`Guardado localmente debido a un error de conexión.`);
    }
  } else {
    showCRMToast(`Caso de ${lead.nombre} guardado localmente.`);
  }
}

/**
 * Renders glassmorphic, floating confirmation toast in the screen bottom corner
 */
function showCRMToast(message) {
  const toast = document.createElement('div');
  toast.className = 'crm-toast';
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 10px; color: var(--color-success);"><polyline points="20 6 9 17 4 12"></polyline></svg>
    <span>${message}</span>
  `;

  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    backgroundColor: 'rgba(13, 22, 39, 0.95)',
    backdropFilter: 'blur(12px)',
    webkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(197, 168, 128, 0.3)',
    color: '#ffffff',
    padding: '16px 24px',
    borderRadius: '8px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    fontWeight: '500',
    zIndex: '9999',
    transform: 'translateY(100px)',
    opacity: '0',
    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
  });

  document.body.appendChild(toast);

  // Transition in
  setTimeout(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  }, 10);

  // Transition out
  setTimeout(() => {
    toast.style.transform = 'translateY(-20px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 3000);
}

/**
 * Realiza la llamada HTTP a Google Apps Script para guardar o actualizar
 */
async function saveOrUpdateLeadCloud(lead, isNew = false) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.trim() === '' || APPS_SCRIPT_URL.includes('TU_URL_DE_APPS_SCRIPT')) {
    return true;
  }

  try {
    const payload = isNew ? lead : { action: 'updateCRM', passcode: 'CCA2026', lead };
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (error) {
    console.error('Error de sincronización con Google Apps Script:', error);
    return false;
  }
}

/**
 * Sincroniza y descarga la base de datos de leads de Google Sheets en tiempo real
 */
async function loadLeadsFromServer() {
  const leadsRows = document.getElementById('db-leads-rows');
  const emptyState = document.getElementById('db-empty-message');

  if (!leadsRows) return;

  const isCloudConfigured = APPS_SCRIPT_URL && APPS_SCRIPT_URL.trim() !== '' && !APPS_SCRIPT_URL.includes('TU_URL_DE_APPS_SCRIPT');

  if (!isCloudConfigured) {
    // Si no está configurada la nube, renderizar lo que haya en LocalStorage
    renderAdminLeads();
    return;
  }

  // Renderizar estado de carga premium en la tabla
  leadsRows.innerHTML = `
    <tr>
      <td colspan="10" style="text-align: center; padding: 50px 20px; color: var(--color-champagne);">
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px;">
          <svg class="spinner" viewBox="0 0 50 50" style="animation: rotate 2s linear infinite; width: 30px; height: 30px; color: var(--color-champagne); margin-right: 0;">
            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="80, 200" stroke-dashoffset="0" stroke-linecap="round"></circle>
          </svg>
          <span style="font-size: 0.95rem; font-weight: 500; letter-spacing: 0.5px; opacity: 0.9;">Sincronizando con la base de datos de Google Sheets...</span>
        </div>
      </td>
    </tr>
  `;
  if (emptyState) emptyState.style.display = 'none';

  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?passcode=CCA2026`);
    if (!response.ok) throw new Error('Error al conectar con la API de Google');

    const leads = await response.json();

    if (leads && leads.status === 'error') {
      throw new Error(leads.message);
    }

    // Guardar en la caché de LocalStorage y renderizar
    localStorage.setItem('cca_leads', JSON.stringify(leads));
    renderAdminLeads();
    showCRMToast('Base de datos sincronizada en tiempo real.');
  } catch (error) {
    console.error('Error cargando base de datos en la nube:', error);
    // Cargar LocalStorage de respaldo
    renderAdminLeads();
    showCRMToast('Error al conectar con Google Sheets. Cargando datos locales.');
  }
}
