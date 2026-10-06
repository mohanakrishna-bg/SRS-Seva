# Fast-Counter Keyboard POS Ergonomics Contract

During temple morning rush hours and festival peaks, counter cashiers need to register sevas within 15 seconds without friction.

We decided to keep the unified `RegistrationModal` and `SevaBookingCart` domain aggregate, but enhance them with a keyboard-driven POS contract:
1. **Autofocus on Phone**: Modal opens focusing the 10-digit mobile number input.
2. **Instant Match & Jump**: Typing a 10-digit phone number automatically queries the devotee index; if found, devotee details are selected and focus jumps directly to the Seva selector.
3. **Keyboard Accelerator**: `Enter` advances through stages; `Ctrl+Enter` / `Cmd+Enter` submits the transaction and automatically invokes the receipt dialog.
4. **Zero Call-Site Regression**: All existing modal invocations across `Layout`, `CustomersPage`, and `BookedSevasTab` remain untouched.
