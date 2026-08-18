# Singapore AI Property Agent: Operating Boundaries

**Purpose.** This document records the first-release boundary for UrbanKey’s Singapore AI Property Agent. The product prepares, organises, and tracks customer workflow material. It does **not** autonomously make binding offers, accept terms, send external messages, transfer funds, provide legal or tax advice, or submit any filing to an official body.

## Official process implications

Singapore’s HDB resale selling flow includes intent registration, resale application, document endorsement and fees, approval, and completion. The product may prepare a checklist and track readiness, but customers and appointed professionals remain responsible for their official portal actions. [1]

Property leases or tenancy agreements, transfers, and mortgages can be dutiable documents. IRAS states that electronic records may include email, SMS, or internet messaging, and its guidance includes WhatsApp examples. Consequently, outward messages that might affect transaction terms must be drafted only, then held for explicit customer authorisation and appropriate professional review. [2]

The CEA provides the public register used to verify property-agent registration and supplies separate resources for consumers, real-estate salespersons, and estate agents. UrbanKey must route regulated agency work to a verified appointed professional rather than representing the product as the professional. [3]

The PDPA covers personal data in electronic and non-electronic formats and governs collection, use, disclosure, and care. Case creation therefore requires recorded processing consent, while document and communication operations use ownership checks and audit records. [4]

## Product controls

| Workflow capability | Product role | Authorisation requirement |
|---|---|---|
| Property sourcing and shortlist preparation | Prepare a customer-controlled shortlist from available inventory. | Customer review before any onward communication. |
| Paperwork checklist and document vault | Request, store, label, and track uploaded items. | Recorded processing consent; separate approval for any hand-off. |
| Viewing and professional appointments | Prepare appointment requests and track counterparty confirmation. | Explicit authorisation before outreach. |
| Email and WhatsApp drafts | Create editable drafts and retain an audit record. | Explicit authorisation plus an approved channel connection before send. |
| Lawyer, agency, bank, and government-sector packs | Prepare and track hand-off packages. | Explicit customer authorisation; receiving professional or official channel performs review/submission. |
| AI drafting | Produce non-binding editable workflow drafts only. | Consent recorded; all outputs require customer review. |

## Connection readiness

The future WhatsApp connection will use the WhatsApp Business Platform’s approved Cloud API path, where Meta documents sending messages and receiving webhook events. [5] The future Gmail connection can use a delegated authorised account; Google documents direct sends and sends from drafts through the Gmail API. [6] No account, token, or external sending pathway is enabled in the current foundation.

## References

[1]: https://www.hdb.gov.sg/managing-my-home/selling-a-flat/process-for-selling-a-flat/overview "HDB: Overview of Flat Selling Process"
[2]: https://www.iras.gov.sg/taxes/stamp-duty/for-property/basics-of-stamp-duty-for-property/learning-the-basics-for-properties "IRAS: Stamp Duty Basics for Property"
[3]: https://www.cea.gov.sg/ "Council for Estate Agencies"
[4]: https://www.pdpc.gov.sg/overview-of-pdpa/the-legislation/personal-data-protection-act "PDPC: Personal Data Protection Act"
[5]: https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started "Meta: WhatsApp Cloud API Get Started"
[6]: https://developers.google.com/workspace/gmail/api/guides/sending "Google: Create and send email messages"
