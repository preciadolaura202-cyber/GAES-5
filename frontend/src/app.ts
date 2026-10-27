/**
 * SegurIA - Plataforma Interactiva Comunitaria de Seguridad Predictiva
 * Interfaz de Acceso y Monitoreo Situacional Táctico
 */

interface RiskNode {
  x: number;
  y: number;
  radius: number;
  level: 'safe' | 'caution' | 'danger';
  pulsePhase: number;
  pulseSpeed: number;
  label: string;
}

interface StreetLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  intensity: number;
}

interface GoogleAccount {
  name: string;
  email: string;
  initials: string;
  avatarColor: string;
}

// URL base de la API SegurIA. Puede sobreescribirse definiendo window.SEGURIA_API_BASE
// antes de cargar este script (útil en producción: p. ej. el backend en Render).
const API_BASE: string =
  (window as unknown as { SEGURIA_API_BASE?: string }).SEGURIA_API_BASE ||
  'http://127.0.0.1:8000';

class SegurIALoginApp {
  // Canvas Elements
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animFrameId: number = 0;
  private radarAngle: number = 0;
  private riskNodes: RiskNode[] = [];
  private streetLines: StreetLine[] = [];
  private mouseX: number = 0;
  private mouseY: number = 0;
  private isMouseActive: boolean = false;

  // Audio Context (Synthesized Micro-feedback)
  private audioCtx: AudioContext | null = null;
  private isSoundMuted: boolean = true;

  // DOM Elements
  private roleTabCitizen: HTMLButtonElement | null = null;
  private roleTabOperator: HTMLButtonElement | null = null;
  private loginForm: HTMLFormElement | null = null;
  private emailInput: HTMLInputElement | null = null;
  private passwordInput: HTMLInputElement | null = null;
  private togglePasswordBtn: HTMLButtonElement | null = null;
  private submitBtn: HTMLButtonElement | null = null;
  private formStatusBanner: HTMLDivElement | null = null;
  private domainChipsContainer: HTMLDivElement | null = null;
  private passwordStrengthWrap: HTMLDivElement | null = null;
  private strengthSegments: NodeListOf<HTMLDivElement> | null = null;
  private strengthText: HTMLElement | null = null;
  private soundToggleBtn: HTMLButtonElement | null = null;
  private tickerCoords: HTMLElement | null = null;

  // Modals
  private biometricModal: HTMLDialogElement | null = null;
  private openBiometricBtn: HTMLButtonElement | null = null;
  private sensorRing: HTMLDivElement | null = null;
  private scannerStatusText: HTMLParagraphElement | null = null;

  private emergencyModal: HTMLDialogElement | null = null;
  private emergencyTopBtn: HTMLButtonElement | null = null;
  private emergencyDirectBtn: HTMLButtonElement | null = null;
  private emergencyForm: HTMLFormElement | null = null;

  // Recovery (¿Olvidaste tu clave?)
  private forgotLink: HTMLButtonElement | null = null;
  private recoverModal: HTMLDialogElement | null = null;
  private closeRecoverBtn: HTMLButtonElement | null = null;
  private recoverStep1: HTMLDivElement | null = null;
  private recoverStep2: HTMLDivElement | null = null;
  private recoverMethodEmail: HTMLButtonElement | null = null;
  private recoverMethodPhone: HTMLButtonElement | null = null;
  private recoverContactInput: HTMLInputElement | null = null;
  private recoverContactLabel: HTMLLabelElement | null = null;
  private recoverContactHint: HTMLElement | null = null;
  private recoverStatus: HTMLDivElement | null = null;
  private sendCodeBtn: HTMLButtonElement | null = null;
  private recoverSentTo: HTMLParagraphElement | null = null;
  private recoverCodeInput: HTMLInputElement | null = null;
  private recoverCodeHint: HTMLElement | null = null;
  private newPasswordInput: HTMLInputElement | null = null;
  private confirmPasswordInput: HTMLInputElement | null = null;
  private recoverStep2Status: HTMLDivElement | null = null;
  private recoverConfirmBtn: HTMLButtonElement | null = null;
  private resendCodeBtn: HTMLButtonElement | null = null;
  private resendTimerText: HTMLElement | null = null;

  // Civic ID (Identidad Digital / Google)
  private civicIdModal: HTMLDialogElement | null = null;
  private closeCivicIdBtn: HTMLButtonElement | null = null;
  private googleAccountGrid: HTMLDivElement | null = null;
  private googleOtherAccount: HTMLDivElement | null = null;
  private googleOtherEmail: HTMLInputElement | null = null;
  private googleOtherContinue: HTMLButtonElement | null = null;
  private civicIdStatus: HTMLDivElement | null = null;

  // State
  private currentRole: 'ciudadano' | 'operador' = 'ciudadano';
  private recoverMethod: 'email' | 'phone' = 'email';
  private recoverContactValue: string = '';
  private resendCooldown: number = 0;
  private resendTimerId: number = 0;

  private readonly demoGoogleAccounts: GoogleAccount[] = [
    { name: 'Maria Fernanda Lopez', email: 'mariafernanda.lopez@gmail.com', initials: 'ML', avatarColor: 'c-emerald' },
    { name: 'Carlos Andres Perez', email: 'carlos.andres.perez@gmail.com', initials: 'CP', avatarColor: 'c-violet' },
    { name: 'Laura Quiroz', email: 'preciadolaura202@gmail.com', initials: 'LQ', avatarColor: 'c-rose' },
    { name: 'Daniel Rojas Mejia', email: 'daniel.rojas@gmail.com', initials: 'DR', avatarColor: 'c-cyan' }
  ];

  constructor() {
    this.initDOMElements();
    this.initCanvasMap();
    this.initRoleSelector();
    this.initFormInteractions();
    this.initModals();
    this.initAuthOptions();
    this.initAudioFeedback();
    this.initCoordinatesTracker();
  }

  /**
   * Bind all DOM elements safely
   */
  private initDOMElements(): void {
    this.canvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }

    this.roleTabCitizen = document.getElementById('tabCitizen') as HTMLButtonElement;
    this.roleTabOperator = document.getElementById('tabOperator') as HTMLButtonElement;
    this.loginForm = document.getElementById('loginForm') as HTMLFormElement;
    this.emailInput = document.getElementById('emailInput') as HTMLInputElement;
    this.passwordInput = document.getElementById('passwordInput') as HTMLInputElement;
    this.togglePasswordBtn = document.getElementById('togglePasswordBtn') as HTMLButtonElement;
    this.submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
    this.formStatusBanner = document.getElementById('formStatusBanner') as HTMLDivElement;
    this.domainChipsContainer = document.getElementById('domainChips') as HTMLDivElement;
    this.passwordStrengthWrap = document.getElementById('passwordStrengthWrap') as HTMLDivElement;
    this.strengthSegments = document.querySelectorAll('.strength-segment');
    this.strengthText = document.getElementById('strengthText');
    this.soundToggleBtn = document.getElementById('soundToggleBtn') as HTMLButtonElement;
    this.tickerCoords = document.getElementById('tickerCoords');

    this.biometricModal = document.getElementById('biometricModal') as HTMLDialogElement;
    this.openBiometricBtn = document.getElementById('openBiometricBtn') as HTMLButtonElement;
    this.sensorRing = document.getElementById('sensorRing') as HTMLDivElement;
    this.scannerStatusText = document.getElementById('scannerStatusText') as HTMLParagraphElement;

    this.emergencyModal = document.getElementById('emergencyModal') as HTMLDialogElement;
    this.emergencyTopBtn = document.getElementById('emergencyTopBtn') as HTMLButtonElement;
    this.emergencyDirectBtn = document.getElementById('emergencyDirectBtn') as HTMLButtonElement;
    this.emergencyForm = document.getElementById('emergencyForm') as HTMLFormElement;

    this.forgotLink = document.getElementById('forgotLink') as HTMLButtonElement;
    this.recoverModal = document.getElementById('recoverModal') as HTMLDialogElement;
    this.closeRecoverBtn = document.getElementById('closeRecoverBtn') as HTMLButtonElement;
    this.recoverStep1 = document.getElementById('recoverStep1') as HTMLDivElement;
    this.recoverStep2 = document.getElementById('recoverStep2') as HTMLDivElement;
    this.recoverMethodEmail = document.getElementById('recoverMethodEmail') as HTMLButtonElement;
    this.recoverMethodPhone = document.getElementById('recoverMethodPhone') as HTMLButtonElement;
    this.recoverContactInput = document.getElementById('recoverContactInput') as HTMLInputElement;
    this.recoverContactLabel = document.getElementById('recoverContactLabel') as HTMLLabelElement;
    this.recoverContactHint = document.getElementById('recoverContactHint') as HTMLElement;
    this.recoverStatus = document.getElementById('recoverStatus') as HTMLDivElement;
    this.sendCodeBtn = document.getElementById('sendCodeBtn') as HTMLButtonElement;
    this.recoverSentTo = document.getElementById('recoverSentTo') as HTMLParagraphElement;
    this.recoverCodeInput = document.getElementById('recoverCodeInput') as HTMLInputElement;
    this.recoverCodeHint = document.getElementById('recoverCodeHint') as HTMLElement;
    this.newPasswordInput = document.getElementById('newPasswordInput') as HTMLInputElement;
    this.confirmPasswordInput = document.getElementById('confirmPasswordInput') as HTMLInputElement;
    this.recoverStep2Status = document.getElementById('recoverStep2Status') as HTMLDivElement;
    this.recoverConfirmBtn = document.getElementById('recoverConfirmBtn') as HTMLButtonElement;
    this.resendCodeBtn = document.getElementById('resendCodeBtn') as HTMLButtonElement;
    this.resendTimerText = document.getElementById('resendTimerText') as HTMLElement;

    this.civicIdModal = document.getElementById('civicIdModal') as HTMLDialogElement;
    this.closeCivicIdBtn = document.getElementById('closeCivicIdBtn') as HTMLButtonElement;
    this.googleAccountGrid = document.getElementById('googleAccountGrid') as HTMLDivElement;
    this.googleOtherAccount = document.getElementById('googleOtherAccount') as HTMLDivElement;
    this.googleOtherEmail = document.getElementById('googleOtherEmail') as HTMLInputElement;
    this.googleOtherContinue = document.getElementById('googleOtherContinue') as HTMLButtonElement;
    this.civicIdStatus = document.getElementById('civicIdStatus') as HTMLDivElement;
  }

  /**
   * Initialize and run the dynamic tactical map & radar background
   */
  private initCanvasMap(): void {
    if (!this.canvas || !this.ctx) return;

    const resize = () => {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth * window.devicePixelRatio;
      this.canvas.height = window.innerHeight * window.devicePixelRatio;
      this.generateMapTopology();
    };

    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX * window.devicePixelRatio;
      this.mouseY = e.clientY * window.devicePixelRatio;
      this.isMouseActive = true;
    });

    this.startCanvasLoop();
  }

  /**
   * Generate procedural city street segments and tactical risk beacons
   */
  private generateMapTopology(): void {
    if (!this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.streetLines = [];
    this.riskNodes = [];

    // Create a matrix of urban grid lines
    const gridCols = 14;
    const gridRows = 10;
    const colStep = w / gridCols;
    const rowStep = h / gridRows;

    // Horizontal arterial roads with slight procedural distortion
    for (let i = 1; i < gridRows; i++) {
      const y = i * rowStep;
      this.streetLines.push({
        x1: 0,
        y1: y + (Math.sin(i * 1.5) * 20),
        x2: w,
        y2: y + (Math.sin(i * 1.5) * 20),
        intensity: (i % 3 === 0) ? 0.08 : 0.03
      });
    }

    // Vertical avenues
    for (let j = 1; j < gridCols; j++) {
      const x = j * colStep;
      this.streetLines.push({
        x1: x + (Math.cos(j * 1.2) * 25),
        y1: 0,
        x2: x + (Math.cos(j * 1.2) * 25),
        y2: h,
        intensity: (j % 4 === 0) ? 0.08 : 0.03
      });
    }

    // Add strategic diagonal highway connectors
    this.streetLines.push(
      { x1: 0, y1: h * 0.25, x2: w * 0.7, y2: h, intensity: 0.06 },
      { x1: w * 0.3, y1: 0, x2: w, y2: h * 0.7, intensity: 0.06 }
    );

    // Generate Risk and Safety Community Nodes
    const nodeConfigs: Array<{ relX: number; relY: number; level: 'safe' | 'caution' | 'danger'; label: string }> = [
      { relX: 0.22, relY: 0.28, level: 'safe', label: 'C-04 NORTE' },
      { relX: 0.18, relY: 0.72, level: 'safe', label: 'C-09 OESTE' },
      { relX: 0.82, relY: 0.22, level: 'caution', label: 'C-15 INDUSTRIAL' },
      { relX: 0.76, relY: 0.68, level: 'danger', label: 'INCIDENTE #412' },
      { relX: 0.48, relY: 0.15, level: 'safe', label: 'CORREDOR CENTRAL' },
      { relX: 0.35, relY: 0.85, level: 'caution', label: 'C-22 TRANSITO' },
      { relX: 0.88, relY: 0.88, level: 'safe', label: 'ZONA SUR VERIFICADA' },
      { relX: 0.12, relY: 0.48, level: 'danger', label: 'ALERTA ACTIVA #398' }
    ];

    for (const conf of nodeConfigs) {
      this.riskNodes.push({
        x: conf.relX * w,
        y: conf.relY * h,
        radius: conf.level === 'danger' ? 24 : 16,
        level: conf.level,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: conf.level === 'danger' ? 0.04 : 0.02,
        label: conf.label
      });
    }
  }

  /**
   * Main 60fps render loop for radar sweep, heat clusters and nodes
   */
  private startCanvasLoop(): void {
    const loop = () => {
      if (this.ctx && this.canvas) {
        this.renderCanvas();
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  private renderCanvas(): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // 1. Draw Street Grid
    for (const street of this.streetLines) {
      ctx.beginPath();
      ctx.moveTo(street.x1, street.y1);
      ctx.lineTo(street.x2, street.y2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${street.intensity})`;
      ctx.lineWidth = 1.2 * window.devicePixelRatio;
      ctx.stroke();
    }

    // 2. Draw Radar Sweep Line from Center
    const centerX = w * 0.5;
    const centerY = h * 0.5;
    const radarRadius = Math.max(w, h) * 0.75;

    this.radarAngle += 0.008;
    if (this.radarAngle > Math.PI * 2) {
      this.radarAngle = 0;
    }

    const endX = centerX + Math.cos(this.radarAngle) * radarRadius;
    const endY = centerY + Math.sin(this.radarAngle) * radarRadius;

    // Sweep line
    const sweepGradient = ctx.createLinearGradient(centerX, centerY, endX, endY);
    sweepGradient.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
    sweepGradient.addColorStop(0.5, 'rgba(0, 229, 255, 0.08)');
    sweepGradient.addColorStop(1, 'rgba(0, 229, 255, 0)');

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radarRadius, this.radarAngle - 0.2, this.radarAngle);
    ctx.lineTo(centerX, centerY);
    ctx.fillStyle = sweepGradient;
    ctx.fill();

    // 3. Draw Community Risk Nodes
    for (const node of this.riskNodes) {
      node.pulsePhase += node.pulseSpeed;
      const pulseScale = 1 + Math.sin(node.pulsePhase) * 0.35;
      const alpha = 0.5 + Math.sin(node.pulsePhase) * 0.3;

      let colorMain = '#10B981'; // Safe
      let colorGlow = 'rgba(16, 185, 129, ';

      if (node.level === 'caution') {
        colorMain = '#FFE500';
        colorGlow = 'rgba(255, 229, 0, ';
      } else if (node.level === 'danger') {
        colorMain = '#EF4444';
        colorGlow = 'rgba(239, 68, 68, ';
      }

      // Outer ripple ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius * pulseScale * 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = `${colorGlow}${Math.max(0, 0.35 - (pulseScale - 1) * 0.5)})`;
      ctx.lineWidth = 1 * window.devicePixelRatio;
      ctx.stroke();

      // Middle ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `${colorGlow}${alpha * 0.25})`;
      ctx.fill();

      // Solid central beacon
      ctx.beginPath();
      ctx.arc(node.x, node.y, 4 * window.devicePixelRatio, 0, Math.PI * 2);
      ctx.fillStyle = colorMain;
      ctx.fill();

      // Label text
      ctx.font = `${10 * window.devicePixelRatio}px 'Chivo Mono', monospace`;
      ctx.fillStyle = `rgba(160, 171, 186, 0.7)`;
      ctx.fillText(node.label, node.x + (10 * window.devicePixelRatio), node.y + (3 * window.devicePixelRatio));
    }

    // 4. Interactive Mouse Reticle when over canvas
    if (this.isMouseActive) {
      ctx.beginPath();
      ctx.arc(this.mouseX, this.mouseY, 18 * window.devicePixelRatio, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 229, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  /**
   * Handle Role Switching: Ciudadano vs Operador
   */
  private initRoleSelector(): void {
    if (!this.roleTabCitizen || !this.roleTabOperator) return;

    this.roleTabCitizen.addEventListener('click', () => {
      this.switchRole('ciudadano');
    });

    this.roleTabOperator.addEventListener('click', () => {
      this.switchRole('operador');
    });
  }

  private switchRole(role: 'ciudadano' | 'operador'): void {
    this.currentRole = role;
    this.playTactileBeep(440, 0.05);

    const emailLabel = document.getElementById('emailLabel');
    const emailHint = document.getElementById('emailHint');
    const descText = document.querySelector('.capsule-desc');

    if (role === 'ciudadano') {
      this.roleTabCitizen?.setAttribute('aria-selected', 'true');
      this.roleTabOperator?.setAttribute('aria-selected', 'false');

      if (emailLabel) emailLabel.textContent = 'Correo electrónico o Identificador Ciudadano';
      if (emailHint) emailHint.textContent = 'USR.CIVIC';
      if (this.emailInput) this.emailInput.placeholder = 'ej. vecino@colonia.org';
      if (descText) descText.textContent = 'Accede a la cartografía en tiempo real, alertas de incidentes comunitarios y navegación segura en tu cuadrante.';
      if (this.domainChipsContainer) this.domainChipsContainer.hidden = false;
    } else {
      this.roleTabCitizen?.setAttribute('aria-selected', 'false');
      this.roleTabOperator?.setAttribute('aria-selected', 'true');

      if (emailLabel) emailLabel.textContent = 'Identificador Operativo / Clave de Despacho C5';
      if (emailHint) emailHint.textContent = 'DESPACHO.TACTICO';
      if (this.emailInput) this.emailInput.placeholder = 'ej. op-742@c5.seguria.gob';
      if (descText) descText.textContent = 'Consola de mando para monitoreo de incidentes de alta prioridad, asignación de unidades y telemetría de cuadrantes.';
      if (this.domainChipsContainer) this.domainChipsContainer.hidden = true;
    }

    this.clearStatusBanner();
  }

  /**
   * Real-time inputs, strength meter, visibility toggle and form submission
   */
  private initFormInteractions(): void {
    // Password Visibility Toggle
    if (this.togglePasswordBtn && this.passwordInput) {
      this.togglePasswordBtn.addEventListener('click', () => {
        const isPassword = this.passwordInput?.type === 'password';
        if (this.passwordInput) {
          this.passwordInput.type = isPassword ? 'text' : 'password';
        }
        this.togglePasswordBtn?.setAttribute('aria-pressed', (!isPassword).toString());
        
        const eyeOpen = document.getElementById('eyeIconOpen');
        const eyeClosed = document.getElementById('eyeIconClosed');
        if (eyeOpen && eyeClosed) {
          eyeOpen.style.display = isPassword ? 'none' : 'block';
          eyeClosed.style.display = isPassword ? 'block' : 'none';
        }

        this.playTactileBeep(600, 0.04);
      });
    }

    // Email Domain Autocomplete Chips
    const chips = document.querySelectorAll('.domain-chip');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        if (!this.emailInput) return;
        const currentVal = this.emailInput.value.trim();
        const suffix = chip.getAttribute('data-domain') || '';
        
        if (!currentVal.includes('@')) {
          this.emailInput.value = currentVal + suffix;
        } else {
          const prefix = currentVal.split('@')[0];
          this.emailInput.value = prefix + suffix;
        }
        this.emailInput.focus();
        this.playTactileBeep(520, 0.03);
      });
    });

    // Password Strength Meter
    if (this.passwordInput) {
      this.passwordInput.addEventListener('input', () => {
        const val = this.passwordInput?.value || '';
        this.updatePasswordStrength(val);
      });
    }

    // Boton autocompletar administrador
    const fillAdminBtn = document.getElementById('btnFillAdmin');
    if (fillAdminBtn && this.emailInput && this.passwordInput) {
      fillAdminBtn.addEventListener('click', () => {
        if (this.emailInput) this.emailInput.value = 'admin@seguria.org';
        if (this.passwordInput) this.passwordInput.value = 'admin1234';
        this.updatePasswordStrength('admin1234');
        this.clearStatusBanner();
        this.playTactileBeep(650, 0.06);
      });
    }

    // Form Submission
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }
  }

  /**
   * Password strength calculation algorithm
   */
  private updatePasswordStrength(password: string): void {
    if (!this.passwordStrengthWrap || !this.strengthSegments || !this.strengthText) return;

    if (password.length === 0) {
      this.passwordStrengthWrap.hidden = true;
      return;
    }

    this.passwordStrengthWrap.hidden = false;

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // Normalize score to 1-4
    const level = Math.min(4, Math.max(1, Math.floor(score * 0.8)));

    // Reset segment classes
    this.strengthSegments.forEach((segment, index) => {
      segment.className = 'strength-segment';
      if (index < level) {
        if (level === 1) segment.classList.add('active-weak');
        else if (level === 2) segment.classList.add('active-fair');
        else if (level === 3) segment.classList.add('active-good');
        else segment.classList.add('active-strong');
      }
    });

    const labels = [
      'Seguridad baja • Se recomiendan más caracteres',
      'Seguridad media • Agrega números o símbolos',
      'Seguridad buena • Clave criptográfica adecuada',
      'Seguridad óptima • Blindaje completo contra ataques'
    ];

    this.strengthText.textContent = labels[level - 1];
  }

  /**
   * Authentic multi-step verification simulation
   */
  private handleFormSubmit(): void {
    const email = this.emailInput?.value.trim() || '';
    const password = this.passwordInput?.value || '';

    // Validation
    if (!email || !password) {
      this.showStatusBanner('Por favor completa las credenciales de acceso a la red SegurIA.', 'error');
      this.playTactileBeep(220, 0.15);
      return;
    }

    if (!email.includes('@') || email.length < 5) {
      this.showStatusBanner('El formato del correo o identificador no es válido.', 'error');
      this.playTactileBeep(220, 0.15);
      return;
    }

    // Start verification state
    if (this.submitBtn) {
      this.submitBtn.setAttribute('aria-busy', 'true');
      this.submitBtn.disabled = true;
    }
    if (this.emailInput) this.emailInput.disabled = true;
    if (this.passwordInput) this.passwordInput.disabled = true;

    this.showStatusBanner('Verificando certificado de nodo y firma criptográfica...', 'info');
    this.playTactileBeep(580, 0.06);

    setTimeout(() => {
      this.showStatusBanner('Escudo IA validando integridad situacional del cuadrante...', 'info');
      this.playTactileBeep(650, 0.06);

      setTimeout(() => {
        this.showStatusBanner('¡Acceso autorizado! Iniciando enlace en tiempo real...', 'success');
        this.playTactileBeep(880, 0.12);

        setTimeout(() => {
          // Reset state simulation
          if (this.submitBtn) {
            this.submitBtn.setAttribute('aria-busy', 'false');
            this.submitBtn.disabled = false;
          }
          if (this.emailInput) this.emailInput.disabled = false;
          if (this.passwordInput) this.passwordInput.disabled = false;
          alert(`Enlace seguro establecido con SegurIA como ${this.currentRole.toUpperCase()}.\n\nSesión iniciada con: ${email}`);
        }, 1200);
      }, 900);
    }, 800);
  }

  private showStatusBanner(message: string, type: 'info' | 'error' | 'success'): void {
    if (!this.formStatusBanner) return;
    this.formStatusBanner.className = `form-status-banner ${type}`;
    this.formStatusBanner.hidden = false;
    this.formStatusBanner.textContent = message;
  }

  private clearStatusBanner(): void {
    if (!this.formStatusBanner) return;
    this.formStatusBanner.hidden = true;
    this.formStatusBanner.textContent = '';
  }

  /**
   * Biometric and Emergency Dialog Modals
   */
  private initModals(): void {
    // Biometric Modal
    if (this.openBiometricBtn && this.biometricModal) {
      this.openBiometricBtn.addEventListener('click', () => {
        this.biometricModal?.showModal();
        this.playTactileBeep(480, 0.05);
        this.startBiometricSimulation();
      });
    }

    const closeBiometric = document.getElementById('closeBiometricBtn');
    if (closeBiometric) {
      closeBiometric.addEventListener('click', () => {
        this.biometricModal?.close();
      });
    }

    // Emergency Modal
    const openEmergency = () => {
      this.emergencyModal?.showModal();
      this.playTactileBeep(700, 0.08);
    };

    if (this.emergencyTopBtn) this.emergencyTopBtn.addEventListener('click', openEmergency);
    if (this.emergencyDirectBtn) this.emergencyDirectBtn.addEventListener('click', openEmergency);

    const closeEmergency = document.getElementById('closeEmergencyBtn');
    if (closeEmergency) {
      closeEmergency.addEventListener('click', () => {
        this.emergencyModal?.close();
      });
    }

    // Emergency Dispatch Submission
    if (this.emergencyForm) {
      this.emergencyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selected = (this.emergencyForm?.querySelector('input[name="incidentType"]:checked') as HTMLInputElement)?.value;
        this.emergencyModal?.close();
        this.showStatusBanner(`¡ALERTA URGENTE DESPACHADA! Tipo: ${selected || 'Incidente prioritario'}. Nodo C5 notificado.`, 'error');
        this.playTactileBeep(880, 0.2);
      });
    }

    // Close on backdrop click
    [this.biometricModal, this.emergencyModal, this.recoverModal, this.civicIdModal].forEach((modal) => {
      if (!modal) return;
      modal.addEventListener('click', (e) => {
        const rect = modal.getBoundingClientRect();
        const isInDialog = (
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
          modal.close();
        }
      });
    });
  }

  /**
   * Password recovery (email / SMS) and Civic ID (Google) authentication flows
   */
  private initAuthOptions(): void {
    // --- Password recovery modal ---
    if (this.forgotLink && this.recoverModal) {
      this.forgotLink.addEventListener('click', () => {
        this.openRecoverModal();
      });
    }

    if (this.closeRecoverBtn) {
      this.closeRecoverBtn.addEventListener('click', () => {
        this.recoverModal?.close();
        this.stopResendCooldown();
      });
    }

    if (this.recoverMethodEmail) {
      this.recoverMethodEmail.addEventListener('click', () => {
        this.setRecoverMethod('email');
      });
    }

    if (this.recoverMethodPhone) {
      this.recoverMethodPhone.addEventListener('click', () => {
        this.setRecoverMethod('phone');
      });
    }

    if (this.sendCodeBtn) {
      this.sendCodeBtn.addEventListener('click', () => {
        void this.sendRecoveryCode();
      });
    }

    if (this.recoverConfirmBtn) {
      this.recoverConfirmBtn.addEventListener('click', () => {
        void this.confirmRecovery();
      });
    }

    if (this.resendCodeBtn) {
      this.resendCodeBtn.addEventListener('click', () => {
        if (this.resendCooldown > 0) return;
        void this.requestRecoveryCode();
      });
    }

    if (this.recoverCodeInput) {
      this.recoverCodeInput.addEventListener('input', () => {
        if (this.recoverCodeInput) {
          this.recoverCodeInput.value = this.recoverCodeInput.value.replace(/\D/g, '').slice(0, 6);
        }
      });
    }

    // --- Civic ID / Google modal ---
    const civicBtn = document.getElementById('btnCivicId') as HTMLButtonElement;
    if (civicBtn && this.civicIdModal) {
      civicBtn.addEventListener('click', () => {
        this.openCivicIdModal();
      });
    }

    if (this.closeCivicIdBtn) {
      this.closeCivicIdBtn.addEventListener('click', () => {
        this.civicIdModal?.close();
      });
    }

    if (this.googleOtherContinue && this.googleOtherEmail) {
      this.googleOtherContinue.addEventListener('click', () => {
        const value = this.googleOtherEmail?.value.trim() || '';
        if (!value.includes('@') || value.length < 5) {
          this.showCivicStatus('Ingresa una cuenta de Google válida para continuar.', 'error');
          this.playTactileBeep(220, 0.15);
          return;
        }
        this.completeCivicLogin(value);
      });
    }

    this.renderGoogleAccounts();
  }

  private openRecoverModal(): void {
    if (!this.recoverModal) return;

    this.setRecoverMethod('email');
    this.recoverContactValue = '';
    if (this.recoverContactInput) this.recoverContactInput.value = '';
    if (this.recoverCodeInput) this.recoverCodeInput.value = '';
    if (this.newPasswordInput) this.newPasswordInput.value = '';
    if (this.confirmPasswordInput) this.confirmPasswordInput.value = '';
    if (this.recoverCodeHint) this.recoverCodeHint.textContent = '';

    if (this.recoverStep1) this.recoverStep1.hidden = false;
    if (this.recoverStep2) this.recoverStep2.hidden = true;

    this.hideRecoverStatus();
    this.hideRecoverStep2Status();
    this.stopResendCooldown();

    this.recoverModal.showModal();
    this.playTactileBeep(480, 0.05);
  }

  private setRecoverMethod(method: 'email' | 'phone'): void {
    this.recoverMethod = method;
    const isEmail = method === 'email';

    this.recoverMethodEmail?.classList.toggle('active', isEmail);
    this.recoverMethodPhone?.classList.toggle('active', !isEmail);
    this.recoverMethodEmail?.setAttribute('aria-pressed', isEmail.toString());
    this.recoverMethodPhone?.setAttribute('aria-pressed', (!isEmail).toString());

    this.recoverContactValue = '';
    if (this.recoverContactInput) {
      this.recoverContactInput.type = isEmail ? 'email' : 'tel';
      this.recoverContactInput.placeholder = isEmail ? 'ej. vecino@colonia.org' : 'ej. +57 300 000 0000';
      this.recoverContactInput.value = '';
    }
    if (this.recoverContactLabel) {
      this.recoverContactLabel.textContent = isEmail ? 'Correo electrónico registrado' : 'Número de teléfono registrado';
    }
    if (this.recoverContactHint) {
      this.recoverContactHint.textContent = isEmail ? 'CANAL.SEGURO' : 'SMS.SEGURO';
    }

    this.hideRecoverStatus();
    this.playTactileBeep(520, 0.03);
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private async sendRecoveryCode(): Promise<void> {
    const value = this.recoverContactInput?.value.trim() || '';
    const isEmail = this.recoverMethod === 'email';

    if (!value) {
      this.showRecoverStatus(isEmail ? 'Ingresa el correo registrado para enviar el código.' : 'Ingresa el teléfono registrado para enviar el código.', 'error');
      this.playTactileBeep(220, 0.15);
      return;
    }

    if (!isEmail) {
      this.showRecoverStatus('Por ahora el envío por SMS no está disponible. Usa la opción de correo electrónico.', 'error');
      this.playTactileBeep(220, 0.15);
      return;
    }

    if (!this.isValidEmail(value)) {
      this.showRecoverStatus('El formato del correo no es válido.', 'error');
      this.playTactileBeep(220, 0.15);
      return;
    }

    this.recoverContactValue = value;
    await this.requestRecoveryCode();
  }

  private async requestRecoveryCode(): Promise<void> {
    if (!this.recoverContactValue) {
      this.showRecoverStatus('Ingresa el correo registrado para enviar el código.', 'error');
      return;
    }

    if (this.sendCodeBtn) this.sendCodeBtn.disabled = true;
    if (this.resendCodeBtn) this.resendCodeBtn.disabled = true;

    this.showRecoverStatus('Transmitiendo código al canal seguro...', 'info');
    this.playTactileBeep(580, 0.06);

    try {
      const response = await fetch(`${API_BASE}/api/auth/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: this.recoverContactValue }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo enviar el código de recuperación.');
      }

      if (this.recoverStep1) this.recoverStep1.hidden = true;
      if (this.recoverStep2) this.recoverStep2.hidden = false;

      if (this.recoverSentTo) {
        this.recoverSentTo.textContent = `Enviamos un código de 6 dígitos a ${this.recoverContactValue}. Revisa tu bandeja de entrada y la carpeta de spam.`;
      }
      if (this.recoverCodeHint) this.recoverCodeHint.textContent = 'VÁLIDO 10 MIN';

      this.hideRecoverStatus();
      this.showRecoverStep2Status('Código enviado a tu correo electrónico. Verifícalo para restablecer tu clave.', 'success');
      if (this.recoverCodeInput) this.recoverCodeInput.focus();
      this.playTactileBeep(650, 0.06);
      this.startResendCooldown(30);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo enviar el código de recuperación.';
      this.showRecoverStatus(message, 'error');
      if (this.resendCodeBtn) this.resendCodeBtn.disabled = false;
      this.playTactileBeep(220, 0.15);
    } finally {
      if (this.sendCodeBtn) this.sendCodeBtn.disabled = false;
    }
  }

  private async confirmRecovery(): Promise<void> {
    const code = this.recoverCodeInput?.value.trim() || '';
    const pass = this.newPasswordInput?.value || '';
    const confirm = this.confirmPasswordInput?.value || '';

    if (code.length !== 6) {
      this.showRecoverStep2Status('El código de verificación debe tener 6 dígitos.', 'error');
      this.playTactileBeep(220, 0.15);
      return;
    }
    if (pass.length < 6) {
      this.showRecoverStep2Status('La nueva clave debe tener al menos 6 caracteres.', 'error');
      this.playTactileBeep(220, 0.15);
      return;
    }
    if (pass !== confirm) {
      this.showRecoverStep2Status('Las claves no coinciden. Verifica e intenta de nuevo.', 'error');
      this.playTactileBeep(220, 0.15);
      return;
    }

    if (this.recoverConfirmBtn) this.recoverConfirmBtn.disabled = true;
    this.showRecoverStep2Status('Validando código y actualizando credenciales...', 'info');
    this.playTactileBeep(580, 0.06);

    try {
      const response = await fetch(`${API_BASE}/api/auth/recover/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: this.recoverContactValue,
          codigo: code,
          nuevaClave: pass,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo restablecer la clave.');
      }

      this.stopResendCooldown();
      this.recoverModal?.close();
      this.showStatusBanner('Clave restablecida con éxito. Inicia sesión con tus nuevas credenciales.', 'success');
      this.playTactileBeep(880, 0.12);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo restablecer la clave.';
      this.showRecoverStep2Status(message, 'error');
      this.playTactileBeep(220, 0.15);
    } finally {
      if (this.recoverConfirmBtn) this.recoverConfirmBtn.disabled = false;
    }
  }

  private showRecoverStatus(message: string, type: 'info' | 'error' | 'success'): void {
    if (!this.recoverStatus) return;
    this.recoverStatus.className = `form-status-banner ${type}`;
    this.recoverStatus.hidden = false;
    this.recoverStatus.textContent = message;
  }

  private hideRecoverStatus(): void {
    if (!this.recoverStatus) return;
    this.recoverStatus.hidden = true;
    this.recoverStatus.textContent = '';
  }

  private showRecoverStep2Status(message: string, type: 'info' | 'error' | 'success'): void {
    if (!this.recoverStep2Status) return;
    this.recoverStep2Status.className = `form-status-banner ${type}`;
    this.recoverStep2Status.hidden = false;
    this.recoverStep2Status.textContent = message;
  }

  private hideRecoverStep2Status(): void {
    if (!this.recoverStep2Status) return;
    this.recoverStep2Status.hidden = true;
    this.recoverStep2Status.textContent = '';
  }

  private startResendCooldown(seconds: number): void {
    this.stopResendCooldown();
    this.resendCooldown = seconds;

    if (this.resendCodeBtn) this.resendCodeBtn.disabled = true;
    this.updateResendTimer();

    this.resendTimerId = window.setInterval(() => {
      this.resendCooldown -= 1;
      this.updateResendTimer();
      if (this.resendCooldown <= 0) {
        this.stopResendCooldown();
      }
    }, 1000);
  }

  private stopResendCooldown(): void {
    if (this.resendTimerId) {
      window.clearInterval(this.resendTimerId);
      this.resendTimerId = 0;
    }
    this.resendCooldown = 0;
    if (this.resendCodeBtn) this.resendCodeBtn.disabled = false;
    if (this.resendTimerText) this.resendTimerText.textContent = '';
  }

  private updateResendTimer(): void {
    if (this.resendTimerText) {
      this.resendTimerText.textContent = this.resendCooldown > 0 ? `Puedes reenviar en ${this.resendCooldown}s` : '';
    }
  }

  private openCivicIdModal(): void {
    if (!this.civicIdModal) return;

    this.renderGoogleAccounts();
    if (this.googleOtherEmail) this.googleOtherEmail.value = '';
    this.hideCivicStatus();

    this.civicIdModal.showModal();
    this.playTactileBeep(480, 0.05);
  }

  private renderGoogleAccounts(): void {
    if (!this.googleAccountGrid) return;
    this.googleAccountGrid.innerHTML = '';

    for (const account of this.demoGoogleAccounts) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'google-account-item';

      const avatar = document.createElement('span');
      avatar.className = `google-avatar ${account.avatarColor}`;
      avatar.textContent = account.initials;

      const meta = document.createElement('span');
      meta.className = 'google-account-meta';

      const name = document.createElement('span');
      name.className = 'google-account-name';
      name.textContent = account.name;

      const email = document.createElement('span');
      email.className = 'google-account-email';
      email.textContent = account.email;

      meta.appendChild(name);
      meta.appendChild(email);

      const gWrapper = document.createElement('div');
      gWrapper.innerHTML = `<svg class="google-g-svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
      </svg>`;
      item.appendChild(avatar);
      item.appendChild(meta);

      const gSvg = gWrapper.firstElementChild;
      if (gSvg) item.appendChild(gSvg);

      item.addEventListener('click', () => {
        this.completeCivicLogin(account.email);
      });

      this.googleAccountGrid.appendChild(item);
    }
  }

  private completeCivicLogin(email: string): void {
    this.showCivicStatus('Validando identidad con Google...', 'info');
    this.playTactileBeep(580, 0.06);

    window.setTimeout(() => {
      this.civicIdModal?.close();
      this.showStatusBanner(`Identidad verificada. Sesión iniciada con Google como ${email}.`, 'success');
      this.playTactileBeep(880, 0.12);
    }, 900);
  }

  private showCivicStatus(message: string, type: 'info' | 'error' | 'success'): void {
    if (!this.civicIdStatus) return;
    this.civicIdStatus.className = `form-status-banner ${type}`;
    this.civicIdStatus.hidden = false;
    this.civicIdStatus.textContent = message;
  }

  private hideCivicStatus(): void {
    if (!this.civicIdStatus) return;
    this.civicIdStatus.hidden = true;
    this.civicIdStatus.textContent = '';
  }

  private startBiometricSimulation(): void {
    if (!this.sensorRing || !this.scannerStatusText) return;

    this.sensorRing.classList.add('scanning');
    this.scannerStatusText.textContent = 'Coloca tu huella en el sensor o mira a la cámara...';

    const onSensorClick = () => {
      if (!this.sensorRing || !this.scannerStatusText) return;
      this.sensorRing.classList.remove('scanning');
      this.sensorRing.style.borderColor = '#10B981';
      this.sensorRing.style.color = '#10B981';
      this.scannerStatusText.textContent = '¡Biometría verificada! Enlace autorizado.';
      this.playTactileBeep(880, 0.1);

      setTimeout(() => {
        this.biometricModal?.close();
        this.showStatusBanner('Autenticado mediante Passkey biométrica segura.', 'success');
        this.sensorRing?.removeEventListener('click', onSensorClick);
      }, 900);
    };

    this.sensorRing.addEventListener('click', onSensorClick);
  }

  /**
   * Sound synthesizer using Web Audio API
   */
  private initAudioFeedback(): void {
    if (!this.soundToggleBtn) return;

    this.soundToggleBtn.addEventListener('click', () => {
      this.isSoundMuted = !this.isSoundMuted;
      this.soundToggleBtn?.setAttribute('aria-pressed', (!this.isSoundMuted).toString());
      
      const soundIconOn = document.getElementById('soundIconOn');
      const soundIconOff = document.getElementById('soundIconOff');

      if (soundIconOn && soundIconOff) {
        soundIconOn.style.display = this.isSoundMuted ? 'none' : 'block';
        soundIconOff.style.display = this.isSoundMuted ? 'block' : 'none';
      }

      if (!this.isSoundMuted) {
        this.playTactileBeep(660, 0.08);
      }
    });
  }

  private playTactileBeep(freq: number, duration: number): void {
    if (this.isSoundMuted) return;

    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // Audio context disabled or restricted
    }
  }

  /**
   * Update bottom coordinate tracking on mouse position
   */
  private initCoordinatesTracker(): void {
    if (!this.tickerCoords) return;

    window.addEventListener('mousemove', (e) => {
      const relX = (e.clientX / window.innerWidth).toFixed(4);
      const relY = (e.clientY / window.innerHeight).toFixed(4);
      const lat = (19.4326 + parseFloat(relY) * 0.08).toFixed(4);
      const lng = (-99.1332 - parseFloat(relX) * 0.08).toFixed(4);

      if (this.tickerCoords) {
        this.tickerCoords.textContent = `COORD: ${lat}° N, ${lng}° W`;
      }
    });
  }
}

// Instantiate upon DOM loading
document.addEventListener('DOMContentLoaded', () => {
  new SegurIALoginApp();
});
