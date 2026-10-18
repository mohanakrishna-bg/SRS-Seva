# SRS-Seva Domain Glossary

Sri Raghavendra Swamy Matha Seva management, devotee registry, and sacred services booking system.

## Language

**Devotee**:
A registered devotee of the Matha who participates in sevas, receives sacred prasada, or makes contributions.
_Avoid_: Customer, Client, User (when referring to devotees)

**Seva**:
A sacred ritual, pooja, homa, or religious offering performed at the Matha on a designated calendar date.
_Avoid_: Service, Item, Product, SKU

**SevaBookingCart**:
An in-memory domain aggregate encapsulating selected sevas, booking dates, Hastodaka options, and pricing calculation invariants.
_Avoid_: Cart, RegistrationForm, BookingState

**SevaRegistration**:
A confirmed and recorded reservation of a Seva for a specific Devotee on a specific date, linked to an accounting voucher.
_Avoid_: Order, Ticket, BookingEntry

**Hastodaka**:
The sacred meal or Anna Prasada offering accompanying a seva, computed based on family member headcount.
_Avoid_: Food Charge, Meal Option, Catering Fee

**SevaFulfillment**:
The verification and confirmation that a booked Seva has been ritually conducted by the Archaka (Priest) or sacred prasada handed over to the devotee.
_Avoid_: Order Completion, Delivery, Checkout

**SankalpaList**:
The priest-facing operational agenda grouping scheduled sevas for a date, detailing Devotee Name, Gotra, Nakshatra, and Seva particulars for prayer recitation.
_Avoid_: Priest Report, Ritual Manifest

**HastodakaCount**:
The kitchen-facing operational forecast itemizing the total count of sanctified Anna Prasada meals to prepare for a given date.
_Avoid_: Meal Count, Catering Headcount

**OperationsDispatch**:
The transmission of daily operational agendas (Sankalpa lists and Hastodaka forecasts) directly to smartphone messaging channels (WhatsApp) for priests and kitchen managers.
_Avoid_: Notification, Webhook, Ping

**Archaka**:
The sacred ritual priest performing the sevas, sanctifying the sankalpa, and confirming seva fulfillment.
_Avoid_: Operator, Worker, Clergy

**CounterCashier**:
The front-desk seva booking staff member managing devotee lookups, receipt voucher generation, and daily cash drawer reconciliation.
_Avoid_: Teller, Cashier, POS User

**ReceiptCancellation**:
An authorized administrative voiding of an issued seva registration voucher requiring supervisor override, reason logging, and fiscal journal reversal.
_Avoid_: Refund, Void, Delete

**AuditTrail**:
The immutable, append-only chronological record of all domain mutations, devotee updates, and financial voucher operations across the Matha system, secured with cryptographic hash-chaining.
_Avoid_: System Log, Event Log, History


