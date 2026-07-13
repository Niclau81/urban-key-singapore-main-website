# Payment provider research

Research checked on 13 July 2026 for the UrbanKey Singapore agent subscription flow.

## Verified findings

- Stripe documents **PayNow** support for Singapore payments and requires webhook handling for asynchronous completion and expired QR-code flows: https://docs.stripe.com/payments/paynow
- Stripe's PayNow product page states that Singapore customers authorize payment through their preferred bank app by scanning a QR code: https://stripe.com/payment-method/paynow
- Stripe documents post-payment email receipts for successful payments: https://docs.stripe.com/payment-links/post-payment
- Stripe's payment-method documentation states that payment and receipt management are available through the Stripe Dashboard: https://docs.stripe.com/payments/payment-methods

## Implementation boundary

The first-party automated checkout can safely support **credit/debit cards and PayNow** through Stripe. Generic Singapore “iBanking” is not represented by a separate Stripe payment method in the reviewed material. The product should label PayNow as the supported bank-app payment route and avoid claiming an unverified direct-iBanking integration. A separate manual bank-transfer flow would require bank-account details and independent reconciliation infrastructure before it could safely activate subscriptions or issue receipts.
