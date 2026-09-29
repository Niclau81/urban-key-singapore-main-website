import { FileSearch, LockKeyhole, MessageSquareText, ShieldCheck, TrendingUp, UserRoundCheck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Property } from "../data";
import { getCurrentUser, submitEnquiry } from "../services/supabase";

type ListingIntelligenceProps = { property: Property };

function ownerInitials(title: string) {
  const meaningfulWords = title.split(/\s+/).filter(word => !["the", "of", "and", "demo"].includes(word.toLowerCase()));
  return meaningfulWords.slice(0, 2).map(word => word[0]).join("").toUpperCase() || "UK";
}

function ownershipYears(property: Property) {
  return 3 + [...property.id].reduce((total, character) => total + character.charCodeAt(0), 0) % 15;
}

function displayTransactionPrice(property: Property, transaction: Property["transactions"][number]) {
  if (transaction.type === "Rent") return `S$${transaction.price.toLocaleString("en-SG")}/mo`;
  return `S$${(transaction.price / 1_000_000).toFixed(transaction.price >= 10_000_000 ? 1 : 2).replace(/\.00$/, "")}m`;
}

export function ListingIntelligence({ property }: ListingIntelligenceProps) {
  const [message, setMessage] = useState(`I am interested in ${property.title}. Please share viewing availability and any key documents for review.`);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const transactions = useMemo(() => [...property.transactions].sort((left, right) => right.date.localeCompare(left.date)), [property.transactions]);
  const sales = transactions.filter(transaction => transaction.type === "Sale");
  const latestSale = sales[0];
  const earliestSale = sales[sales.length - 1];
  const trend = latestSale && earliestSale && sales.length > 1
    ? Math.round(((latestSale.psf - earliestSale.psf) / earliestSale.psf) * 100)
    : null;
  const yearsHeld = ownershipYears(property);
  const initials = ownerInitials(property.title);

  useEffect(() => {
    setMessage(`I am interested in ${property.title}. Please share viewing availability and any key documents for review.`);
    setStatus("");
  }, [property.id, property.title]);

  const sendEnquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const user = await getCurrentUser();
      if (!user?.email) throw new Error("Sign in from the header to send a secure enquiry.");
      const name = typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
        ? user.user_metadata.full_name.trim()
        : "Authenticated visitor";
      await submitEnquiry({
        listingId: property.id,
        enquiryType: "viewing",
        contactName: name,
        contactEmail: user.email,
        message,
      });
      setStatus("Enquiry sent securely to the listing workspace for authorised review.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send the enquiry right now.");
    } finally {
      setBusy(false);
    }
  };

  return <section id="property-intelligence" className="listing-intelligence">
    <div className="listing-intelligence-heading">
      <div>
        <p className="eyebrow">Property intelligence</p>
        <h2>More context. Better questions.</h2>
      </div>
      <p>A structured view of curated listing records, anonymised ownership context, and illustrative transaction history. Sensitive information is never presented as verified fact.</p>
    </div>

    <div className="intelligence-overview-grid">
      <article className="intelligence-history-card">
        <div className="intelligence-card-heading">
          <div>
            <p className="eyebrow">Unit &amp; estate history</p>
            <h3>Curated record timeline</h3>
          </div>
          <span><FileSearch size={20} /></span>
        </div>
        <div className="intelligence-timeline">
          {transactions.length ? transactions.map(transaction => <article key={`${transaction.date}-${transaction.unit}`}>
            <div><b>{new Date(`${transaction.date}T00:00:00`).getFullYear()}</b><i><TrendingUp size={14} /></i></div>
            <div>
              <p>{transaction.type === "Sale" ? "Recorded transaction" : "Recorded rental context"}</p>
              <h4>{transaction.unit} · {transaction.type}</h4>
              <span>{displayTransactionPrice(property, transaction)} · S${transaction.psf.toLocaleString("en-SG")} PSF</span>
              <small>Illustrative catalogue record · independent verification required</small>
            </div>
          </article>) : <p className="intelligence-empty">No historical records are included for this future-market planning demonstration.</p>}
        </div>
        <div className="intelligence-disclaimer"><ShieldCheck size={18} /><div><b>Important verification disclaimer</b><span>Illustrative records show product behaviour only. Confirm current availability, ownership, and transactional information through authorised sources before relying on it.</span></div></div>
      </article>

      <aside className="intelligence-owner-stack">
        <article className="owner-context-card">
          <div className="owner-context-heading"><div><p>Privacy-safe owner context</p><h3>Current ownership</h3></div><LockKeyhole size={20} /></div>
          <div className="owner-profile"><span>{initials}</span><div><b>Anonymised owner</b><small>Identity and contact details withheld</small></div></div>
          <div className="owner-stat-grid"><div><b>{yearsHeld}</b><span>Years held</span></div><div><b>1</b><span>Listed property</span></div></div>
          <p className="owner-disclosure"><ShieldCheck size={15} />Only initials and non-identifying context are displayed. No identity inference is permitted.</p>
        </article>
        <article className="privacy-controls-card"><span><UserRoundCheck size={20} /></span><div><b>Verified privacy controls</b><small>Sensitive owner fields are excluded from the independent web payload and display layer.</small></div></article>
      </aside>
    </div>

    <article id="intelligence-transactions" className="transaction-intelligence-card">
      <div className="transaction-heading">
        <div><p className="eyebrow">Transaction intelligence</p><h3>Unit and nearby price history</h3></div>
        <div className="transaction-metrics"><div><span>Latest sale PSF</span><b>{latestSale ? `S$${latestSale.psf.toLocaleString("en-SG")}` : "—"}</b></div><div><span>Recorded trend</span><b className={trend !== null && trend >= 0 ? "positive" : ""}>{trend === null ? "Demo record" : <><TrendingUp size={15} />{trend}%</>}</b></div></div>
      </div>
      <div className="transaction-table-wrap"><table><thead><tr><th>Date</th><th>Property / unit</th><th>Type</th><th>Price</th><th>PSF</th></tr></thead><tbody>{transactions.length ? transactions.map(transaction => <tr key={`${transaction.date}-${transaction.unit}`}><td>{new Date(`${transaction.date}T00:00:00`).toLocaleDateString("en-SG", { month: "short", year: "numeric" })}</td><td><b>{property.title}</b><span>{transaction.unit}</span></td><td><i className={transaction.type === "Sale" ? "sale" : "rent"}>{transaction.type}</i></td><td>{displayTransactionPrice(property, transaction)}</td><td>S${transaction.psf.toLocaleString("en-SG")}</td></tr>) : <tr><td colSpan={5}>No transaction history is available for this future-market planning demonstration.</td></tr>}</tbody></table></div>
      <p>Demonstration transaction records are included to illustrate analysis workflows. Verify current and historical information through official sources before reliance.</p>
    </article>

    <article id="property-enquiry" className="intelligence-enquiry-card">
      <div><span><MessageSquareText size={21} /></span><h3>Ask about this {property.category === "Commercial" ? "asset" : "home"}.</h3><p>Send a structured enquiry without exposing the owner’s personal information.</p></div>
      <form onSubmit={sendEnquiry}><textarea aria-label="Secure property enquiry" required minLength={10} maxLength={4000} value={message} onChange={event => setMessage(event.target.value)} /><div><small>Sent securely to the listing workspace</small><button className="dark-button" disabled={busy}>{busy ? "Sending…" : "Send enquiry"}</button></div>{status && <p role="status">{status}</p>}</form>
    </article>

    <article className="intelligence-journey"><div><p className="eyebrow">Continue the intelligence journey</p><h3>Review history, ownership context, and transactions.</h3></div><button className="dark-button" type="button" onClick={() => document.getElementById("property-intelligence")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Open property intelligence <TrendingUp size={16} /></button></article>
  </section>;
}
