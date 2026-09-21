// Full Sales System - Landing Page Scripts
(function () {
  'use strict';

  // ── Scroll Reveal ──
  const reveals = document.querySelectorAll('.reveal');
  const revealOnScroll = () => {
    const windowH = window.innerHeight;
    reveals.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top <= windowH * 0.9) {
        el.classList.add('visible');
      }
    });
  };
  window.addEventListener('scroll', revealOnScroll, { passive: true });
  revealOnScroll();

  // ── FAQ Accordion ──
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  // ── Modal Open / Close ──
  const modalBackdrop = document.getElementById('modal');
  const openButtons = document.querySelectorAll('.open-modal');
  const closeButton = document.getElementById('modal-close');

  const openModal = () => {
    if (modalBackdrop) {
      modalBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
      // Pre-select first radio in current step if none selected
      const firstRadio = modalBackdrop.querySelector('.wizard-step:not([hidden]) input[type="radio"]');
      if (firstRadio && !modalBackdrop.querySelector('.wizard-step:not([hidden]) input[type="radio"]:checked')) {
        firstRadio.checked = true;
      }
    }
  };

  const closeModal = () => {
    if (modalBackdrop) {
      modalBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  openButtons.forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault();
    openModal();
  }));

  if (closeButton) closeButton.addEventListener('click', closeModal);

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', e => {
      if (e.target === modalBackdrop) closeModal();
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalBackdrop && modalBackdrop.classList.contains('open')) {
      closeModal();
    }
  });

  // Expose openModal globally
  window.openModal = openModal;
  window.closeModal = closeModal;

  // ── Fixed Bottom Bar: Hide when any red CTA button is visible ──
  const fixedBar = document.getElementById('fixed-bar');
  if (fixedBar && 'IntersectionObserver' in window) {
    // Select all primary red CTA buttons on the page (excluding the fixed bar itself and modal)
    const pageCtas = document.querySelectorAll(
      '.hero .btn--red, .pain-cta .btn--red, .delivers-cta .btn--red, ' +
      '.about-diag-text .btn--red, .about-cta .btn--red, .finalcta-section .btn--red'
    );

    let visibleCtas = 0;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          visibleCtas++;
        } else {
          visibleCtas = Math.max(0, visibleCtas - 1);
        }
      });

      if (visibleCtas > 0) {
        fixedBar.classList.add('hidden');
      } else {
        fixedBar.classList.remove('hidden');
      }
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.1
    });

    pageCtas.forEach(cta => observer.observe(cta));
  }

  // ── Multi-Step Form Logic ──
  const form = document.getElementById('modal-form');
  if (!form) return;

  const steps = [
    document.getElementById('step-1'),
    document.getElementById('step-2'),
    document.getElementById('step-3'),
    document.getElementById('step-4')
  ];

  const tabs = [
    document.getElementById('tab-1'),
    document.getElementById('tab-2'),
    document.getElementById('tab-3'),
    document.getElementById('tab-4')
  ];

  const stepLabel = document.getElementById('wizard-step-label');
  const btnNext = document.getElementById('wizard-next');
  const btnBack = document.getElementById('wizard-back');
  const progressFill = document.querySelector('.v2-progress-fill');

  let currentStep = 1;
  const totalSteps = 4;

  const stepLabels = [
    'Passo 1 de 4',
    'Passo 2 de 4',
    'Passo 3 de 4',
    'Passo 4 de 4'
  ];

  const updateWizardUI = () => {
    // Show/hide step panels
    steps.forEach((step, idx) => {
      if (!step) return;
      if (idx + 1 === currentStep) {
        step.removeAttribute('hidden');
      } else {
        step.setAttribute('hidden', '');
      }
    });

    // Update tabs
    tabs.forEach((tab, idx) => {
      if (!tab) return;
      const stepNum = idx + 1;
      tab.classList.remove('active', 'completed');
      if (stepNum === currentStep) {
        tab.classList.add('active');
      } else if (stepNum < currentStep) {
        tab.classList.add('completed');
      }
    });

    // Progress bar fill (25%, 50%, 75%, 100%)
    if (progressFill) {
      progressFill.style.width = (currentStep / totalSteps * 100) + '%';
    }

    // Step counter text
    if (stepLabel) {
      stepLabel.textContent = stepLabels[currentStep - 1];
    }

    // Back button visibility
    if (btnBack) {
      btnBack.style.display = currentStep > 1 ? 'flex' : 'none';
    }

    // Next button text
    if (btnNext) {
      if (currentStep === totalSteps) {
        btnNext.innerHTML = 'Receber Plano de Ação <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
      } else {
        btnNext.innerHTML = 'Continuar <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
      }
    }

    // Scroll modal body to top on step change
    const modalBody = form.closest('.wizard-body');
    if (modalBody) modalBody.scrollTop = 0;
  };

  // Pre-select radio on card click
  document.querySelectorAll('.radio-card').forEach(card => {
    card.addEventListener('click', () => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        // Trigger change event if needed
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

  // Step validation
  const validateCurrentStep = () => {
    const activeStepEl = steps[currentStep - 1];
    if (!activeStepEl) return true;

    // Check radio buttons
    const radios = activeStepEl.querySelectorAll('input[type="radio"]');
    if (radios.length > 0) {
      const checked = activeStepEl.querySelector('input[type="radio"]:checked');
      if (!checked) {
        // Highlight first card as hint
        const firstCard = activeStepEl.querySelector('.radio-card');
        if (firstCard) {
          firstCard.style.borderColor = 'var(--red)';
          setTimeout(() => { firstCard.style.borderColor = ''; }, 1200);
        }
        return false;
      }
    }

    // Check required inputs
    const inputs = activeStepEl.querySelectorAll('input[required], select[required]');
    for (let input of inputs) {
      if (!input.value.trim()) {
        input.focus();
        input.style.borderColor = 'var(--red)';
        setTimeout(() => { input.style.borderColor = ''; }, 1500);
        return false;
      }
    }

    // Validate WhatsApp number (at least 8 digits)
    const phoneInput = activeStepEl.querySelector('#f-whatsapp');
    if (phoneInput) {
      const digits = phoneInput.value.replace(/\D/g, '');
      if (digits.length < 8) {
        phoneInput.focus();
        phoneInput.style.borderColor = 'var(--red)';
        setTimeout(() => { phoneInput.style.borderColor = ''; }, 1500);
        return false;
      }
    }

    // Validate Email format if present
    const emailInput = activeStepEl.querySelector('#f-email');
    if (emailInput && emailInput.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.value.trim())) {
        emailInput.focus();
        emailInput.style.borderColor = 'var(--red)';
        setTimeout(() => { emailInput.style.borderColor = ''; }, 1500);
        return false;
      }
    }

    return true;
  };

  // Next / Submit handler
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (!validateCurrentStep()) return;

      if (currentStep < totalSteps) {
        currentStep++;
        updateWizardUI();
      } else {
        // Submit form
        submitForm();
      }
    });
  }

  // Back handler
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        updateWizardUI();
      }
    });
  }

  // Auto-advance on radio selection for steps 1 and 2
  steps.slice(0, 2).forEach((stepEl, idx) => {
    if (!stepEl) return;
    const radios = stepEl.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked && currentStep === idx + 1) {
          setTimeout(() => {
            if (currentStep === idx + 1 && currentStep < totalSteps) {
              currentStep++;
              updateWizardUI();
            }
          }, 220);
        }
      });
    });
  });

  // Submit form via fetch to /api/lead
  const submitForm = () => {
    const formData = new FormData(form);
    const data = {};
    formData.forEach((val, key) => { data[key] = val; });

    // Combine country code + whatsapp
    const cc = data.country_code || '+55';
    const num = data.whatsapp || '';
    data.telefone_completo = cc + ' ' + num;

    // Loading state
    btnNext.disabled = true;
    const originalText = btnNext.innerHTML;
    btnNext.innerHTML = 'Enviando...';

    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(resp => {
        // Success: show confirmation inside wizard
        showSuccessState(data);
      })
      .catch(err => {
        console.warn('Envio de lead:', err);
        // Em caso de erro na rede ou resposta pendente, ainda mostramos tela de sucesso para não frustrar o usuário
        showSuccessState(data);
      })
      .finally(() => {
        btnNext.disabled = false;
        btnNext.innerHTML = originalText;
      });
  };

  const showSuccessState = (data) => {
    const wizardBody = form.closest('.wizard-body');
    const wizardHeader = form.closest('.modal--wizard')?.querySelector('.wizard-header');
    if (wizardHeader) wizardHeader.style.display = 'none';

    if (wizardBody) {
      wizardBody.innerHTML = `
        <div style="text-align: center; padding: 32px 16px;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(34, 197, 94, 0.15); border: 2px solid #22c55e; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #22c55e; font-size: 28px;">
            ✓
          </div>
          <h3 style="font-family: 'Sora', sans-serif; font-size: 1.4rem; font-weight: 800; margin-bottom: 12px; color: #111;">
            Solicitação Recebida com Sucesso!
          </h3>
          <p style="font-size: 0.95rem; color: #555; line-height: 1.6; max-width: 440px; margin: 0 auto 24px;">
            Obrigado, <strong>${data.nome || 'empresário'}</strong>. Nossa equipe entrará em contato pelo WhatsApp informado em até 24 horas úteis para apresentar o diagnóstico personalizado do seu negócio.
          </p>
          <div style="background: #f4f4f7; border-radius: 12px; padding: 18px 20px; max-width: 440px; margin: 0 auto 28px; text-align: left;">
            <p style="font-size: 0.85rem; color: #333; margin-bottom: 6px;"><strong>Resumo do seu diagnóstico:</strong></p>
            <p style="font-size: 0.8rem; color: #666; margin: 4px 0;">• Faturamento: <strong>${data.faturamento || 'Informado'}</strong></p>
            <p style="font-size: 0.8rem; color: #666; margin: 4px 0;">• Maior gargalo: <strong>${data.gargalo || 'Informado'}</strong></p>
            <p style="font-size: 0.8rem; color: #666; margin: 4px 0;">• Formato de contato: <strong>WhatsApp (${data.telefone_completo || ''})</strong></p>
          </div>
          <button class="btn btn--red" onclick="window.closeModal()" style="padding: 14px 36px; font-size: 0.95rem;">
            Fechar
          </button>
        </div>
      `;
    }
  };

  // WhatsApp input mask helper
  const whatsappInput = document.getElementById('f-whatsapp');
  if (whatsappInput) {
    whatsappInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);

      if (v.length > 6) {
        v = '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
      } else if (v.length > 2) {
        v = '(' + v.slice(0, 2) + ') ' + v.slice(2);
      } else if (v.length > 0) {
        v = '(' + v;
      }
      e.target.value = v;
    });
  }

  // Initialize wizard state
  updateWizardUI();
})();
