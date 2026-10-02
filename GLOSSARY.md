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
