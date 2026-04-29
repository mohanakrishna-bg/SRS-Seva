---
created: 2026-04-29T08:37:46.355Z
title: Fix Receipt Header Organization Branding
area: ui
files:
  - frontend/src/components/ReceiptGenerator.tsx
  - frontend/src/components/DonationReceiptGenerator.tsx
---

## Problem

The receipt header currently displays devotee address and phone number instead of the organization's branding name, address, and telephone number (which are present in the global header).

## Solution

Update `ReceiptGenerator.tsx` and `DonationReceiptGenerator.tsx` to correctly pull and display organization settings from `SettingsContext` for the receipt header, ensuring branding consistency across the application.
