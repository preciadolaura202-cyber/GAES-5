---
name: SegurIA
description: Plataforma interactiva comunitaria de seguridad predictiva y prevención urbana
colors:
  primary: "#FFE500"
  primary-hover: "#F2D800"
  safety-emerald: "#10B981"
  hazard-red: "#EF4444"
  hazard-red-hover: "#DC2626"
  status-amber: "#F59E0B"
  status-blue: "#3B82F6"
  radar-cyan: "#00E5FF"
  neutral-bg: "#050811"
  surface: "#0E1626"
  surface-elevated: "#141F36"
  surface-input: "#0A101C"
  text-primary: "#F8FAFC"
  text-secondary: "#CBD5E1"
  text-muted: "#94A3B8"
  border-dim: "rgba(255, 255, 255, 0.10)"
  border-mid: "rgba(255, 255, 255, 0.18)"
  shadow-neutral: "rgba(0, 0, 0, 0.4)"
typography:
  display:
    fontFamily: "Archivo, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.625rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Archivo, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Archivo, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1.4
  body:
    fontFamily: "Archivo, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  body-sm:
    fontFamily: "Archivo, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Chivo Mono, monospace"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
rounded:
  2xs: "2px"
  3xs: "3px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "36px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.sm}"
    padding: "14px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
---

# Design System: SegurIA

## Overview

**Creative North Star: "Consola Situacional de Alerta Temprana Urbana"**

SegurIA rechaza los formularios de acceso estériles y corporativos de tarjeta blanca. El sistema visual concibe la interfaz como una cabina táctica de comando y protección civil ciudadana, donde conviven una cartografía vectorial viva y un núcleo de autenticación de alta precisión militar y señalética urbana internacional.

El tono comunica serenidad técnica, blindaje de privacidad y respuesta inmediata. Cada interacción ofrece certeza situacional: la red comunitaria está activa, las zonas de riesgo están geolocalizadas y el acceso está protegido con cifrado criptográfico robusto.

**Key Characteristics:**
- Estética táctica de alta visibilidad: Contraste riguroso derivado de la señalética de tránsito e infraestructuras críticas.
- Cartografía en tiempo real integrada: El mapa interactivo y el radar en canvas no son decorados, sino la prueba viva de monitoreo.
- Microinteracciones inmediatas: Verificación en tiempo real, validación de contraseña con medidor de entropía y soporte de Passkeys.
- Accesibilidad incondicional: Cumplimiento de ratios WCAG AA, navegación táctil holgada y control total por teclado.

## Colors

Paleta de obsidiana profunda con acentos de señalética de alta visibilidad inspirados en la señalización internacional de advertencia y cartografía táctica.

### Primary
- **Amarillo Señalética Táctico** (#FFE500): Tono de advertencia y atención inmediata para el botón de acción principal (CTA), estados de foco activo y selección de texto. Transmite urgencia sin pánico.

### Secondary
- **Verde Escudo Seguro** (#10B981): Verificación de cuadrantes seguros, integridad de red comunitaria y confirmación criptográfica exitosa.
- **Rojo Alerta Crítica** (#EF4444): Zonas de riesgo inminente, botón de emergencia directa SOS e incidentes prioritarios reportados.
- **Rojo Despacho Activo** (#DC2626): Estado de envío prioritario al presionar el despacho de alerta.
- **Ámbar Precaución** (#F59E0B): Nivel medio de entropía en contraseñas y advertencia de tráfico.
- **Azul Criptográfico** (#3B82F6): Nivel bueno de robustez en clave de acceso.
- **Azul Cian Radar** (#00E5FF): Escaneo de coordenadas, telemetría de latencia y haz rotatorio del radar cartográfico.

### Neutral
- **Obsidiana Vacío** (#050811): Fondo de pantalla principal del canvas cartográfico y viñeta perimetral.
- **Pizarra de Comando** (#0E1626): Superficie de la cápsula de autenticación y tarjetas de control.
- **Pizarra Elevada** (#141F36): Fondos de botones secundarios, pestañas activas y campos interactivos.
- **Blanco Ártico Primario** (#F8FAFC): Títulos, texto de alta jerarquía e iconos activos.
- **Gris Slate Secundario** (#CBD5E1): Texto de cuerpo, etiquetas descriptivas y subtítulos (ratio > 7:1).
- **Gris Muted Telemetría** (#94A3B8): Coordenadas, hints y metadatos de red (ratio > 4.5:1).

### Named Rules
**The High-Vis Accent Rule.** El amarillo señalética (#FFE500) se reserva exclusivamente para acciones primarias, focos activos y confirmaciones críticas; nunca se utiliza como fondo general o elemento meramente decorativo.

## Typography

**Display Font:** Archivo (con fallback en system-ui, -apple-system, sans-serif)
**Body Font:** Archivo (con fallback en system-ui, -apple-system, sans-serif)
**Label/Mono Font:** Chivo Mono (con fallback en monospace)

**Character:** Archivo aporta la solidez arquitectónica y legibilidad geométrica de la señalética de tránsito contemporánea, mientras Chivo Mono brinda la precisión numérica y tabular de los centros de control de emergencias.

### Hierarchy
- **Display** (800, 1.625rem, 1.25): Título de la cápsula de acceso e identificación de plataforma.
- **Headline** (700, 1.25rem, 1.3): Encabezados de diálogos modales (Biometría, Emergencia).
- **Title** (800, 1rem, 1.4): Botón primario de acceso y llamadas a la acción.
- **Body** (400/500, 0.9375rem, 1.5): Textos explicativos, descripciones de estado y mensajes de alerta.
- **Body Small** (400/600, 0.875rem, 1.5): Etiquetas de formulario, textos secundarios y botones auxiliares.
- **Label** (600, 0.8125rem, 1.2, tracking 0.05em): Telemetría, etiquetas de cuadrante, coordenadas GPS y chips de dominio.

### Named Rules
**The Tabular Telemetry Rule.** Todos los datos numéricos, tiempos de latencia y coordenadas geográficas emplean Chivo Mono con `font-variant-numeric: tabular-nums` para evitar saltos ópticos durante actualizaciones dinámicas.

## Layout

Modelo espacial con viewport completo flexible (`min-height: 100vh`) estructurado en tres estratos:
1. **Estrato Cartográfico de Fondo:** Canvas interactivo a pantalla completa con coordenadas urbanas, cuadrantes de calor y radar sweeping a 60fps.
2. **Estrato Perimetral de Telemetría:** Barra superior fija con identidad de marca y estatus de red, junto a barra inferior con ticker de cuadrantes y coordenadas activas.
3. **Estrato de Foco Central:** Cápsula de cristal blindado centrada (`max-width: 480px`), adaptativa con márgenes automáticos y padding de respiración táctil (`24px` a `36px`). En pantallas móviles (`< 768px`), los márgenes se compactan y los elementos secundarios se apilan verticalmente sin pérdida de funcionalidad.

## Elevation & Depth

El sistema utiliza elevación por definición de bordes milimétricos y capas tonales de cristal templado (`backdrop-filter: blur(24px)`), complementado con sombras neutras oscuras bien calibradas sin halos de color artificiales.

### Shadow Vocabulary
- **Sombra Sutil** (`box-shadow: 0 4px 8px rgba(0, 0, 0, 0.35)`): Botones secundarios y elementos en reposo.
- **Sombra Flotante** (`box-shadow: 0 8px 12px rgba(0, 0, 0, 0.5)`): Cápsula central de autenticación y tarjetas de cuadrante.
- **Sombra Modal** (`box-shadow: 0 10px 14px rgba(0, 0, 0, 0.65)`): Diálogos modales nativos de biometría y despacho de emergencia.

### Named Rules
**The Zero-Glow Rule.** Queda estrictamente prohibido el uso de sombras brillantes o resplandores cromáticos difusos con halo cero. La luminosidad proviene del contraste directo y el color de superficie, manteniendo un perfil táctico limpio.

## Shapes

- **Esquinas Funcionales:** Radios controlados de 2px para micro-barras de fortaleza, 3px para checkbox táctico, 4px para chips y botones de alerta, 8px para campos de entrada y botones de acción, y 16px para la cápsula contenedora principal.
- **Bordes de Precisión:** Bordes continuos de 1px con opacidades calculadas (`rgba(255, 255, 255, 0.10)` para divisores tenues y `rgba(255, 255, 255, 0.18)` para cajas interactivas).
- **Indicadores de Estado:** Discos geométricos estáticos de 8px para estados de conectividad.

## Components

### Buttons
- **Shape:** Radio de 8px (sm) para acción principal; 4px (xs) para botones de emergencia.
- **Primary:** Fondo amarillo señalética (#FFE500), texto en obsidiana (#050811), tipografía Archivo peso 800, padding 14px 20px. Estado activo con micro-traslación de 1px.
- **Secondary:** Fondo pizarra elevada (#141F36), borde de 1px (#FFFFFF18), texto blanco (#F8FAFC), padding 12px 16px con icono integrado SVG.

### Inputs / Fields
- **Style:** Contenedor de 1px (#FFFFFF18) sobre fondo `#0A101C`, radio 8px, padding 12px 14px. Icono integrado a la izquierda con color atenuado (#94A3B8).
- **Focus:** Borde en amarillo señalética (#FFE500) con anillo de enfoque interior directo.
- **Password Strength:** Barra segmentada de 4 etapas que calcula en vivo la entropía de la clave y asigna semáforo de seguridad con descripción técnica.

### Navigation / Role Switcher
- **Style:** Segmented control de 2 columnas con fondo contenedor (#0A101C) y botón activo elevado (#141F36) con acento amarillo señalética (#FFE500).

### Modals (<dialog>)
- **Style:** Contenedor modal nativo de cristal oscuro, radio 16px, backdrop oscurecido al 85% con desenfoque de 8px. Cierre táctil en esquina superior derecha o pulsando fuera del diálogo.

## Do's and Don'ts

### Do:
- **Do** garantizar un ratio de contraste mínimo de 4.5:1 en cualquier texto secundario, utilizando `#CBD5E1` o `#94A3B8` sobre fondos oscuros.
- **Do** utilizar tipografía monoespaciada Chivo Mono exclusivamente para métricas, códigos criptográficos, coordenadas y telemetría de red.
- **Do** preservar los controles de navegación por teclado completos (`Tab`, `Enter`, `Escape`) en todos los diálogos y formularios.
- **Do** proveer retroalimentación de estado accesible con `aria-live="polite"` y `aria-busy` durante cualquier operación asíncrona.

### Don't:
- **Don't** aplicar gradientes de color al texto. El énfasis tipográfico debe provenir del peso y la jerarquía.
- **Don't** utilizar halos brillantes fluorescentes difusos o sombras de color en fondos oscuros.
- **Don't** recurrir a emojis o glifos Unicode como sustitutos de iconos. Todos los pictogramas deben ser vectores SVG homogéneos con trazo de 2px.
- **Don't** bloquear el acceso de emergencia ciudadano tras procesos de registro o confirmación burocrática obligatoria.
