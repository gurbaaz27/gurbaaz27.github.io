---
name: Gurbaaz Singh Personal Website
description: A restrained, writing-first personal portfolio and blog.
colors:
  accent-blue: "#008AFF"
  accent-hover: "#0085A1"
  ink: "#404040"
  paper: "#FFFFFF"
  chrome: "#EAEAEA"
  border: "#DDDDDD"
  dark-paper: "#18191A"
  dark-chrome: "#242526"
  dark-ink: "#E4E6EB"
typography:
  display:
    fontFamily: "EB Garamond, serif"
    fontSize: "clamp(3.125rem, 6vw, 5rem)"
    fontWeight: 800
    lineHeight: 1.1
  body:
    fontFamily: "EB Garamond, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "3px"
  md: "4px"
spacing:
  sm: "10px"
  md: "20px"
  lg: "35px"
components:
  pager:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "15px 25px"
---

# Design System: Gurbaaz Singh Personal Website

## Overview

**Creative North Star: "The Familiar Personal Journal"**

The interface keeps the established Beautiful Jekyll character: centered editorial headings, generous readable prose, quiet gray chrome, bright blue links, personal imagery, and an optional dark reading mode. It is deliberately familiar and content-led, never a generic SaaS landing page, an over-designed portfolio template, or an AI-styled editorial redesign.

**Key Characteristics:**

- Writing-first centered column
- Light gray navigation and footer chrome
- Personal thumbnails and travel imagery
- Minimal interactions with a persistent dark-mode preference

## Colors

Bright blue links carry the only strong accent against neutral paper and ink; dark mode mirrors the same hierarchy.

**The Existing Palette Rule.** Preserve the recorded colors exactly during framework maintenance.

## Typography

**Display Font:** EB Garamond (serif fallback)
**Body Font:** EB Garamond (serif fallback)

Headings are heavy and centered in page headers; body copy uses a relaxed 1.5 line height. Metadata is italic and muted. Navigation labels are compact, bold, and uppercase.

## Elevation

The design is flat by default. A small shadow is reserved for the circular avatar and covered-image headers; borders separate long lists and chrome.

## Components

Navigation is fixed, responsive, and paired with the centered circular avatar. Post previews use a right-aligned thumbnail on wider screens and a centered thumbnail on narrow screens. Pager links invert to the accent color on hover. Tags remain quiet text links with a thin hover outline.

## Do's and Don'ts

### Do:

- **Do** preserve the existing responsive proportions, centered content widths, and pathname behavior.
- **Do** keep visible keyboard focus and reduced-motion fallbacks.
- **Do** let posts and imagery carry the page.

### Don't:

- **Don't** turn the site into a generic SaaS landing page.
- **Don't** introduce an over-designed portfolio template.
- **Don't** apply an AI-styled editorial redesign.
- **Don't** add decorative gradients, glass panels, or card grids.
