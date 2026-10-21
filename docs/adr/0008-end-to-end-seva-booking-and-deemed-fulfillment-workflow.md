# End-to-End Seva Booking and Deemed Fulfillment Workflow Optimizations

High counter volume during morning festival rushes and the operational separation between ritual conduct and prasada distribution require streamlined intake, automated daily dispatch cutoffs, and realistic fulfillment tracking.

We decided to ratify the following end-to-end workflow optimizations across booking, operations dispatch, and fulfillment:

1. **Dynamic Counter UPI QR Code & Quick Rebook**:
   - Master Settings stores the Matha's official Virtual Payment Address (VPA) and Payee Name.
   - The booking counter modal dynamically renders an on-screen UPI QR code (`upi://pay?pa=...&am=...&tn=...`) embedding the exact transaction total and VoucherNo.
   - Cashiers verify incoming alerts via the physical temple bank soundbox/SMS and click "Confirm Payment" to commit the voucher and print the receipt.
   - Returning devotees can 1-click rebook previous sevas with pre-filled Gotra, Nakshatra, and family particulars.

2. **Operations Dispatch 7:30 PM Cutoff & Physical Ritual Printout**:
   - Daily operational agendas for the next calendar day freeze at a standardized 7:30 PM cutoff.
   - The system generates 1-click WhatsApp summaries (`wa.me/` links) and mobile single-page PDFs:
     - `SankalpaList` for Archakas (with devotee contact details masked per ADR 0006).
     - `HastodakaCount` for the Kitchen Manager.
   - Provides a clean, print-optimized Kannada physical ritual sheet (`window.print()`, `print:hidden` for navigation) for Archakas with a signature and date block.
   - Any booking entered after 7:30 PM for the next day is visually highlighted as a "Late Addition (ತಾಜಾ ಸೇರ್ಪಡೆ)".

3. **Deemed Fulfillment Model & Exigency Exception Handling**:
   - At the conclusion of the scheduled `SevaDate` (midnight transition), active non-cancelled sevas on the Sankalpa list automatically transition to `DeemedFulfillment` (`IsFulfilled = True`, `DeemedFulfilledAt = timestamp`) without requiring per-devotee manual confirmations.
   - **Exigency Exception Handling**: If sevas cannot be ritually performed due to unforeseen emergencies (priest illness, temple closure, or devotee postponement), concerned office staff log the non-fulfillment with an explicit mandatory reason.
   - The system automatically compiles an `ExigencyExceptionReport` detailing the unfulfilled sevas, affected devotees, recorded staff reason, and proposed resolution (reschedule date or refund voucher).

4. **Devotee WhatsApp Blessing Master Toggle**:
   - Master Settings provides a global configuration switch (`EnableDevoteeWhatsAppNotifications: bool`).
   - When enabled, fulfillment triggers pre-formatted Kannada blessing messages with 1-click WhatsApp delivery; when disabled, all outbound messaging is suppressed with zero code changes.
