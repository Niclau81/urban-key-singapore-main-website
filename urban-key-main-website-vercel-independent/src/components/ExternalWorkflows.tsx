import { LoaderCircle, LogOut, MapPinned, Send, UploadCloud, UserRound } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { hasGoogleMaps3DConfig, hasGoogleMapsConfig, hasSupabaseConfig, integrationStatus } from "../services/config";
import { fetchAgentTasks, getCurrentUser, requestMagicLink, saveFavourite, signOut, submitEnquiry, updateAgentTaskStatus, uploadTourMedia, type AgentTask } from "../services/supabase";
import { renderSingaporeMap } from "../services/maps";

const showError = (error: unknown) => error instanceof Error ? error.message : "Something went wrong. Please try again.";

export function AuthStatus() {
  const [email, setEmail] = useState<string>();
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { getCurrentUser().then(user => setEmail(user?.email)).catch(() => undefined); }, []);
  if (!hasSupabaseConfig) return <span className="service-status">Account setup required</span>;
  if (email) return <span className="auth-status"><UserRound size={15}/>{email}<button type="button" aria-label="Sign out" onClick={async () => { await signOut(); setEmail(undefined); }}><LogOut size={15}/></button></span>;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setMessage("");
    try { await requestMagicLink(input); setMessage("Check your email for the secure sign-in link."); }
    catch (error) { setMessage(showError(error)); }
    finally { setBusy(false); }
  };
  return <form className="header-auth" onSubmit={submit}><input required aria-label="Email address" type="email" value={input} onChange={event => setInput(event.target.value)} placeholder="Sign in by email"/><button disabled={busy}>{busy ? <LoaderCircle className="spin" size={15}/> : "Sign in"}</button>{message && <small role="status">{message}</small>}</form>;
}

export function SaveFavouriteButton({ listingId }: { listingId: string }) {
  const [message, setMessage] = useState("");
  const save = async () => {
    try { await saveFavourite(listingId); setMessage("Saved"); }
    catch (error) { setMessage(showError(error)); }
  };
  return <><button type="button" aria-label="Save property" onClick={save}>Save</button>{message && <small className="inline-status" role="status">{message}</small>}</>;
}

export function EnquiryForm({ listingId, listingTitle }: { listingId?: string; listingTitle?: string }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setStatus("");
    try {
      await submitEnquiry({ listingId, enquiryType: listingId ? "viewing" : "property_agent", contactName: String(form.get("name") ?? ""), contactEmail: String(form.get("email") ?? ""), message: String(form.get("message") ?? "") });
      event.currentTarget.reset(); setStatus("Your request was recorded. An authorised team member can review it before any contact is made.");
    } catch (error) { setStatus(showError(error)); }
    finally { setBusy(false); }
  };
  return <form className="live-form" onSubmit={submit}><p className="eyebrow">Secure enquiry</p><h3>{listingTitle ? `Ask about ${listingTitle}` : "Start a Property Agent request"}</h3><label>Name<input required name="name" maxLength={160} placeholder="Your name"/></label><label>Email<input required name="email" type="email" maxLength={320} placeholder="name@example.com"/></label><label>Message<textarea required name="message" maxLength={4000} placeholder="Tell us what you would like to arrange or understand."/></label><button className="dark-button" disabled={busy} type="submit">{busy ? "Sending…" : "Submit for review"}<Send size={16}/></button>{status && <p className="form-status" role="status">{status}</p>}</form>;
}

export function GoogleMapSurface() {
  const node = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState(hasGoogleMapsConfig ? hasGoogleMaps3DConfig ? "Loading 3D-capable Singapore map…" : "Loading standard Google Map. Add VITE_GOOGLE_MAPS_MAP_ID for 3D map mode." : "Add VITE_GOOGLE_MAPS_API_KEY and VITE_GOOGLE_MAPS_MAP_ID to enable the live 3D Singapore map.");
  useEffect(() => {
    if (!node.current || !hasGoogleMapsConfig) return;
    renderSingaporeMap(node.current).then(() => setStatus(hasGoogleMaps3DConfig ? "Live Singapore map loaded with 3D map configuration." : "Live standard Google Map loaded. Add VITE_GOOGLE_MAPS_MAP_ID to request 3D map mode.")).catch(error => setStatus(showError(error)));
  }, []);
  if (!hasGoogleMapsConfig) return <div className="map-unconfigured"><img src="/assets/singapore-map-fallback.svg" alt="Schematic Singapore geographic context map"/><div className="map-fallback-notice"><MapPinned size={26}/><b>Live map not configured</b><span>{status}</span></div></div>;
  return <><div ref={node} className="google-map" aria-label="Interactive Google Map of Singapore"/><p className="map-status" role="status">{status}</p></>;
}

export function AgentTaskPanel() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [status, setStatus] = useState("");
  const load = async () => {
    try { setTasks(await fetchAgentTasks()); }
    catch (error) { setStatus(showError(error)); }
  };
  useEffect(() => { if (hasSupabaseConfig) void load(); }, []);
  const cycle = async (task: AgentTask) => {
    const next = task.status === "open" ? "in_review" : task.status === "in_review" ? "complete" : "open";
    try { await updateAgentTaskStatus(task.id, next); await load(); }
    catch (error) { setStatus(showError(error)); }
  };
  if (!hasSupabaseConfig) return <p className="form-status">Configure Supabase to load private tasks. The agent workspace will remain empty until an authenticated agent creates tasks.</p>;
  if (!tasks.length) return <p className="form-status">No live tasks found. Sign in with an agent account and add tasks through the Supabase dashboard or your future secure administration API.</p>;
  return <>{tasks.map((task, index) => <div className="task" key={task.id}><i>{index + 1}</i><span>{task.title}</span><button type="button" onClick={() => void cycle(task)}>{task.status.replace("_", " ")}</button></div>)}{status && <p className="form-status" role="status">{status}</p>}</>;
}

export function TourMediaUpload() {
  const [file, setFile] = useState<File>();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const upload = async () => {
    if (!file) { setStatus("Choose a photo or 360° media file first."); return; }
    if (file.size > 25 * 1024 * 1024) { setStatus("For this direct upload, choose a file smaller than 25 MB. Use signed uploads for larger 360° media."); return; }
    setBusy(true); setStatus("");
    try { const path = await uploadTourMedia(file); setStatus(`Uploaded securely to your private tour-media folder: ${path}`); }
    catch (error) { setStatus(showError(error)); }
    finally { setBusy(false); }
  };
  return <div className="upload-box"><p className="eyebrow">Private media upload</p><label>Tour file<input type="file" accept="image/*,video/*" onChange={event => setFile(event.target.files?.[0])}/></label><button type="button" className="outline-button" onClick={() => void upload()} disabled={busy}><UploadCloud size={16}/>{busy ? "Uploading…" : "Upload for secure review"}</button><p className="form-status" role="status">{status || `Storage: ${integrationStatus.storage}.`}</p></div>;
}
