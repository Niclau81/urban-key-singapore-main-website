# Agent and Co-broker Subscription Verification

## Delivered experience

UrbanKey now provides a dedicated professional onboarding and subscription flow for authenticated **agents** and **co-brokers**. The onboarding form captures account type, first name, middle name, last name, contact number, email, company name, company address, Singapore postal code, agent licence number, job title, business registration number, company website, and professional consent. Existing users can reopen the same form to update their professional profile.

The public plan catalogue, secure checkout summary, payment confirmation screen, and account-scoped payment history are available at the following routes.

| Experience | Route | Access |
|---|---|---|
| Agent/co-broker entry | `/agent` | Public |
| Professional sign-up and profile | `/agent/signup` | Authenticated |
| Subscription catalogue | `/agent/subscribe` | Public |
| Order summary and payment selection | `/agent/checkout?plan={planId}` | Public preview; authenticated profile required to pay |
| Payment confirmation | `/agent/payment-success?session_id={stripeSessionId}` | Authenticated |
| Payment history | `/agent/payments` | Authenticated and account-scoped |

## Pricing matrix

All prices are calculated server-side from a **SGD 120 monthly base price**. The checkout screen displays the undiscounted total, discount percentage, exact amount saved, final amount payable, and effective monthly cost.

| Term | Discount | Regular total | Savings | Payable | Effective monthly |
|---:|---:|---:|---:|---:|---:|
| 1 month | 0% | SGD 120 | SGD 0 | SGD 120 | SGD 120 |
| 3 months | 5% | SGD 360 | SGD 18 | SGD 342 | SGD 114 |
| 6 months | 10% | SGD 720 | SGD 72 | SGD 648 | SGD 108 |
| 1 year | 20% | SGD 1,440 | SGD 288 | SGD 1,152 | SGD 96 |
| 2 years | 25% | SGD 2,880 | SGD 720 | SGD 2,160 | SGD 90 |
| 3 years | 30% | SGD 4,320 | SGD 1,296 | SGD 3,024 | SGD 84 |
| 4 years | 35% | SGD 5,760 | SGD 2,016 | SGD 3,744 | SGD 78 |
| 5 years | 40% | SGD 7,200 | SGD 2,880 | SGD 4,320 | SGD 72 |
| 10 years | 50% | SGD 14,400 | SGD 7,200 | SGD 7,200 | SGD 60 |

## Payment methods and receipts

Card and PayNow payments are completed on **Stripe Checkout**. UrbanKey does not collect or store card numbers, CVVs, online-banking credentials, or PayNow QR details. PayNow is presented as the supported bank-app payment route: the customer scans and approves the payment in a participating Singapore banking application.

Generic direct **iBanking login** is not presented as a separate payment method because it is not a verified Stripe Checkout payment method for this integration. The interface states this boundary instead of requesting bank credentials or implying unsupported direct bank-login processing.

The checkout creates a Stripe PaymentIntent with the professional profile email as `receipt_email`. After Stripe confirms a paid checkout, the webhook activates the subscription, stores only the required Stripe resource identifiers, records the receipt-email state, and associates the Stripe customer with the authenticated account. Stripe manages the itemized email receipt; successful delivery still depends on a valid email address and the connected Stripe account's email settings.

## Payment states and recovery

The implementation handles pending checkout, successful activation, asynchronous PayNow success, asynchronous payment failure, cancellation return, expired subscription display, and payment-history status. Failed or cancelled orders provide a plan-specific **Retry this plan** action. The success page polls the account-scoped order list until Stripe's webhook confirmation is reflected, and displays a dedicated failure state when Stripe reports asynchronous failure.

## Security and ownership controls

Professional profile and payment-history procedures require an authenticated session. Database queries use the authenticated user ID rather than a client-provided owner ID. Checkout verifies that the requested return origin matches the current browser request origin, validates the plan against the server-owned catalogue, requires a completed professional profile, and creates the order on the server. The webhook route uses Stripe signature verification and receives the raw request body before JSON parsing.

Only business-specific subscription data and necessary Stripe identifiers are stored locally. Sensitive payment credentials and redundant Stripe payment details are not stored.

## Validation evidence

| Validation | Result |
|---|---|
| Vitest suite | **31 tests passed across 5 test files** |
| TypeScript | **Passed** with `tsc --noEmit` |
| Production build | **Passed** |
| Webhook verification shape | **Passed** for the required `evt_test_` response contract |
| Automated accessibility audit | **0 axe-core WCAG 2 A/AA/2.1 AA violations** on the public plans, sign-up entry, and checkout entry routes |
| Responsive visual review | Checked at desktop and 390-pixel mobile widths for plans, onboarding, and checkout |
| Runtime request review | Subscription catalogue, profile, authentication, and account payment-history requests returned successful responses during verification |

The raw automated accessibility output is stored in `docs/subscription-accessibility-axe.json`. Automated accessibility checks cannot identify every issue, so keyboard and assistive-technology testing should remain part of pre-production acceptance testing.
