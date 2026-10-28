---
name: SegurIA
description: Plataforma interactiva comunitaria de seguridad predictiva y prevención urbana
colors:
  primary: "#1C1917"
  primary-hover: "#292524"
  accent-gold: "#92400E"
  accent-gold-hover: "#78350F"
  safety-emerald: "#047857"
  hazard-red: "#B91C1C"
  hazard-red-hover: "#991B1B"
  status-amber: "#92400E"
  status-blue: "#1D4ED8"
  radar-cyan: "#0369A1"
  neutral-bg: "#FBF9F4"
  surface: "#FFFFFF"
  surface-elevated: "#F5F1E8"
  surface-input: "#FFFFFF"
  text-primary: "#1C1917"
  text-secondary: "#44403C"
  text-muted: "#57534E"
  border-dim: "rgba(28, 25, 23, 0.08)"
  border-mid: "rgba(28, 25, 23, 0.14)"
  border-bright: "rgba(28, 25, 23, 0.28)"
  shadow-neutral: "rgba(28, 25, 23, 0.06)"
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
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
---

# Design System: SegurIA (Estilo Limpio y Crema Elegante)

## Overview

**Creative North Star: "Consola Cívica de Seguridad Urbana - Estilo Editorial Crema y Alta Precisión"**

SegurIA adopta una dirección visual refinada, limpia y crema elegante. Rechaza la sobreestimulación de interfaces oscuras saturadas de luces fluorescentes, sustituyéndolas por una estética inspirada en el diseño editorial y cívico de alta calidad: lienzos cálidos marfil/crema (`#FBF9F4`), tarjetas blancas inmaculadas (`#FFFFFF`), bordes sutiles tono lino/arena (`#E6DFD3`), tipografía con peso y contraste óptimo (`#1C1917` sobre crema), y acentos sobrios en ámbar dorado, esmeralda bosque y azul cobalto.

El tono comunica serenidad institucional, claridad visual y elegancia técnica.

**Directivas Impeccable incorporadas:**
- **Sin cursores parpadeantes decorativos:** El cursor parpadeante se reserva exclusivamente para los campos de entrada de texto nativos (`input`, `textarea`). No existe en títulos ni elementos estáticos.
- **Sin marquesinas automáticas (Auto-scrolling marquee):** Los elementos permanecen estáticos y escaneables, respetando el ritmo de lectura del usuario sin animaciones forzadas.
- **Georreferenciación inicial en Bucaramanga:** Centro de mapa predeterminado en las coordenadas del Área Metropolitana de Bucaramanga (`7.1193, -73.1227`).
