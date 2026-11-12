# StoreWitness interface refresh

The identity is now a text-only StoreWitness wordmark, with Victor Aguirre credited in the footer. The generated image logo remains archived in source assets but is not displayed or served by the app.

## Typography

Native system stack: `-apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", Helvetica, Arial, sans-serif`. Apple devices resolve their native system font; Windows uses its available Segoe UI font. No Apple font binaries or third-party font service are bundled. Serif and italic display headings have been removed.

## Design direction

White and neutral-gray surfaces, precise spacing, restrained typography, understated borders and functional status colors. Apple's typography guidance and Linear's product presentation were references for clarity and hierarchy; this is an original project implementation, not a downloaded or copied template.

- https://developer.apple.com/fonts/
- https://linear.app/features

## Motion and navigation

Sections reveal with a short fade and upward movement on entering the viewport. The sticky header has a reading-progress line. Scrolling stays native, without scroll locking. Reduced-motion preferences disable reveal transforms, fades and smooth scrolling. Without JavaScript, sections remain visible. Switching app views returns the viewport to the top and marks the current navigation item.

## Validation

Browser checked text-only branding, system font stack, scroll progress and reveal activation; customer layout fits 390px without horizontal overflow. The animation page uses the same type and surface system while retaining its illustrated camera scene. Build and syntax checks passed. This refresh is now publicly deployed to https://studio.victoraguirre.site/ using Cloudflare Pages and D1; live checks are recorded in QA_REPORT.md.

