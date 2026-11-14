import { useEffect, useState } from "react";
import {
  Activity, AlertOctagon, ArrowUpRight, Bell, Boxes, CheckCircle2,
  ChevronDown, Cloud, Command, FileCheck2, Gauge, LayoutDashboard,
  LockKeyhole, Radar, Search, Server, Shield, ShieldAlert, ShieldCheck,
  Siren, Wifi, Zap, RefreshCw, Database, Globe2, AlertTriangle
} from "lucide-react";

type CloudAsset = {
  id: string; name: string; resource_type: string; provider: string; region: string;
  environment: string; status: string; criticality: string; public_exposure: boolean;
};

type Vulnerability = { id: string; cve: string; title: string; severity: string; cvss: number; asset_id: string; asset_name: string; package: string; current_version: string; fixed_version: string; status: string; discovered_at: string; description: string; };

type ThreatDetection = { id: string; rule_id: string; title: string; description: string; severity: string; asset_id: string; asset_name: string; event_type: string; source: string; status: string; detected_at: string; evidence: string; };

type Incident = { id: string; title: string; description: string; severity: string; asset_id: string; asset_name: string; assigned_to: string; status: string; response_notes: string; created_at: string; updated_at: string; };

type ComplianceControl = { control_id: string; function: string; category: string; title: string; description: string; status: string; owner: string; evidence: string; last_assessed: string; };
type ComplianceOverview = { framework: string; score: number; total_controls: number; implemented: number; partial: number; gaps: number; not_assessed: number; controls: ComplianceControl[]; };

type Overview = {
  assets_monitored: number;
  critical_findings: number;
  open_incidents: number;
  compliance_score: number;
  threat_level: string;
};

const nav = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Asset inventory", icon: Boxes },
  { label: "Vulnerability management", icon: ShieldAlert },
  { label: "Threat detection", icon: Radar },
  { label: "Incident response", icon: Siren },
  { label: "Compliance center", icon: FileCheck2 },
  { label: "Executive risk dashboard", icon: Gauge },
];

const findings = [
  { id: "NX-2048", title: "Publicly exposed storage bucket", asset: "prod-customer-data", severity: "Critical", age: "12 min ago" },
  { id: "NX-2047", title: "Unrestricted inbound security group", asset: "sg-prod-edge-01", severity: "High", age: "38 min ago" },
  { id: "NX-2046", title: "Outdated runtime detected", asset: "payments-api-cluster", severity: "Medium", age: "1 hr ago" },
];

function App() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [compliance, setCompliance] = useState<ComplianceOverview | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceError, setComplianceError] = useState("");
  const [complianceSearch, setComplianceSearch] = useState("");
  const [complianceRefresh, setComplianceRefresh] = useState(0);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState("");
  const [riskRefresh, setRiskRefresh] = useState(0);
  const [incidentLoading, setIncidentLoading] = useState(false);
  const [incidentError, setIncidentError] = useState("");
  const [incidentSearch, setIncidentSearch] = useState("");
  const [incidentRefresh, setIncidentRefresh] = useState(0);
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [incidentSeverity, setIncidentSeverity] = useState("High");
  const [incidentAssetId, setIncidentAssetId] = useState("NX-ASSET-001");
  const [incidentAssetName, setIncidentAssetName] = useState("prod-customer-data");
  const [incidentAssignee, setIncidentAssignee] = useState("Security Analyst");
  const [incidentSaving, setIncidentSaving] = useState(false);

  const [active, setActive] = useState("Overview");
  const [apiState, setApiState] = useState("Connecting");
  const [assets, setAssets] = useState<CloudAsset[]>([]);
  const [threats, setThreats] = useState<ThreatDetection[]>([]);
  const [threatLoading, setThreatLoading] = useState(false);
  const [threatError, setThreatError] = useState("");
  const [threatSearch, setThreatSearch] = useState("");
  const [threatRefresh, setThreatRefresh] = useState(0);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [vulnLoading, setVulnLoading] = useState(false);
  const [vulnError, setVulnError] = useState("");
  const [vulnSearch, setVulnSearch] = useState("");
  const [vulnRefresh, setVulnRefresh] = useState(0);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState("");
  const [assetSearch, setAssetSearch] = useState("");
  const [assetRefresh, setAssetRefresh] = useState(0);

  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    fetch(`${apiBaseUrl}/api/v1/overview`)
      .then((r) => { if (!r.ok) throw new Error("API unavailable"); return r.json(); })
      .then((data: Overview) => { setOverview(data); setApiState("Connected"); })
      .catch(() => setApiState("Demo mode"));
  }, []);

  useEffect(() => {
    if (active !== "Asset inventory") return;
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    let cancelled = false;
    setAssetsLoading(true);
    setAssetsError("");
    fetch(`${apiBaseUrl}/api/v1/assets`)
      .then((response) => { if (!response.ok) throw new Error(`Inventory request failed (${response.status})`); return response.json(); })
      .then((data: CloudAsset[]) => { if (!Array.isArray(data)) throw new Error("Unexpected inventory response"); if (!cancelled) setAssets(data); })
      .catch((error: Error) => { if (!cancelled) setAssetsError(error.message || "Unable to load cloud assets"); })
      .finally(() => { if (!cancelled) setAssetsLoading(false); });
    return () => { cancelled = true; };
  }, [active, assetRefresh]);

  useEffect(() => {
    if (active !== "Vulnerability management") return;
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    let cancelled = false;
    setVulnLoading(true);
    setVulnError("");
    fetch(`${apiBaseUrl}/api/v1/vulnerabilities`)
      .then((response) => { if (!response.ok) throw new Error(`Vulnerability request failed (${response.status})`); return response.json(); })
      .then((data: Vulnerability[]) => { if (!Array.isArray(data)) throw new Error("Unexpected vulnerability response"); if (!cancelled) setVulnerabilities(data); })
      .catch((error: Error) => { if (!cancelled) setVulnError(error.message || "Unable to load vulnerabilities"); })
      .finally(() => { if (!cancelled) setVulnLoading(false); });
    return () => { cancelled = true; };
  }, [active, vulnRefresh]);

  useEffect(() => {
    if (active !== "Threat detection") return;
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    let cancelled = false;
    setThreatLoading(true);
    setThreatError("");
    fetch(`${apiBaseUrl}/api/v1/threats`)
      .then((response) => { if (!response.ok) throw new Error(`Threat request failed (${response.status})`); return response.json(); })
      .then((data: ThreatDetection[]) => { if (!Array.isArray(data)) throw new Error("Unexpected threat response"); if (!cancelled) setThreats(data); })
      .catch((error: Error) => { if (!cancelled) setThreatError(error.message || "Unable to load detections"); })
      .finally(() => { if (!cancelled) setThreatLoading(false); });
    return () => { cancelled = true; };
  }, [active, threatRefresh]);


  useEffect(() => {
    if (active !== "Incident response") return;
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    let cancelled = false;
    setIncidentLoading(true);
    setIncidentError("");
    fetch(`${apiBaseUrl}/api/v1/incidents`)
      .then((response) => { if (!response.ok) throw new Error(`Incident request failed (${response.status})`); return response.json(); })
      .then((data: Incident[]) => { if (!Array.isArray(data)) throw new Error("Unexpected incident response"); if (!cancelled) setIncidents(data); })
      .catch((error: Error) => { if (!cancelled) setIncidentError(error.message || "Unable to load incidents"); })
      .finally(() => { if (!cancelled) setIncidentLoading(false); });
    return () => { cancelled = true; };
  }, [active, incidentRefresh]);

  useEffect(() => {
    if (active !== "Compliance center") return;
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    let cancelled = false;
    setComplianceLoading(true);
    setComplianceError("");
    fetch(`${apiBaseUrl}/api/v1/compliance`)
      .then((response) => { if (!response.ok) throw new Error(`Compliance request failed (${response.status})`); return response.json(); })
      .then((data: ComplianceOverview) => { if (!Array.isArray(data.controls)) throw new Error("Unexpected compliance response"); if (!cancelled) setCompliance(data); })
      .catch((error: Error) => { if (!cancelled) setComplianceError(error.message || "Unable to load compliance assessment"); })
      .finally(() => { if (!cancelled) setComplianceLoading(false); });
    return () => { cancelled = true; };
  }, [active, complianceRefresh]);

  useEffect(() => {
    if (active !== "Executive risk dashboard") return;
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    let cancelled = false;
    setRiskLoading(true);
    setRiskError("");
    Promise.allSettled([
      fetch(apiBaseUrl + "/api/v1/assets").then(r => { if (!r.ok) throw new Error("Asset inventory unavailable"); return r.json(); }),
      fetch(apiBaseUrl + "/api/v1/vulnerabilities").then(r => { if (!r.ok) throw new Error("Vulnerability data unavailable"); return r.json(); }),
      fetch(apiBaseUrl + "/api/v1/threats").then(r => { if (!r.ok) throw new Error("Threat detection data unavailable"); return r.json(); }),
      fetch(apiBaseUrl + "/api/v1/incidents").then(r => { if (!r.ok) throw new Error("Incident response data unavailable"); return r.json(); }),
      fetch(apiBaseUrl + "/api/v1/compliance").then(r => { if (!r.ok) throw new Error("Compliance assessment unavailable"); return r.json(); })
    ]).then(([assetResult, vulnerabilityResult, threatResult, incidentResult, complianceResult]) => {
      if (cancelled) return;
      const failures: string[] = [];
      if (assetResult.status === "fulfilled" && Array.isArray(assetResult.value)) setAssets(assetResult.value);
      else failures.push("Cloud assets");
      if (vulnerabilityResult.status === "fulfilled" && Array.isArray(vulnerabilityResult.value)) setVulnerabilities(vulnerabilityResult.value);
      else failures.push("Vulnerabilities");
      if (threatResult.status === "fulfilled" && Array.isArray(threatResult.value)) setThreats(threatResult.value);
      else failures.push("Threat detections");
      if (incidentResult.status === "fulfilled" && Array.isArray(incidentResult.value)) setIncidents(incidentResult.value);
      else failures.push("Incidents");
      if (complianceResult.status === "fulfilled" && Array.isArray(complianceResult.value?.controls)) setCompliance(complianceResult.value);
      else failures.push("Compliance");
      setRiskError(failures.length ? "Some data sources could not be refreshed: " + failures.join(", ") + ". Previously loaded values are preserved." : "");
    }).finally(() => { if (!cancelled) setRiskLoading(false); });
    return () => { cancelled = true; };
  }, [active, riskRefresh]);

  const updateComplianceControl = async (controlId: string, updates: Partial<ComplianceControl>) => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/compliance/${encodeURIComponent(controlId)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error(`Control update failed (${response.status})`);
      const updated: ComplianceOverview = await response.json();
      setCompliance(updated);
    } catch (error) {
      setComplianceError(error instanceof Error ? error.message : "Unable to update compliance control");
    }
  };

  const updateIncident = async (id: string, updates: Partial<Incident>) => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/incidents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      if (!response.ok) throw new Error(`Update failed (${response.status})`);
      const updated: Incident = await response.json();
      setIncidents(current => current.map(item => item.id === id ? updated : item));
    } catch (error) {
      setIncidentError(error instanceof Error ? error.message : "Unable to update incident");
    }
  };

  const createIncident = async () => {
    if (incidentTitle.trim().length < 5 || incidentDescription.trim().length < 10) {
      setIncidentError("Enter a title (at least 5 characters) and description (at least 10 characters).");
      return;
    }
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    setIncidentSaving(true);
    setIncidentError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/incidents`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: incidentTitle, description: incidentDescription, severity: incidentSeverity, asset_id: incidentAssetId, asset_name: incidentAssetName, assigned_to: incidentAssignee })
      });
      if (!response.ok) throw new Error(`Create incident failed (${response.status})`);
      const created: Incident = await response.json();
      setIncidents(current => [created, ...current]);
      setIncidentTitle("");
      setIncidentDescription("");
    } catch (error) {
      setIncidentError(error instanceof Error ? error.message : "Unable to create incident");
    } finally {
      setIncidentSaving(false);
    }
  };

  const filteredComplianceControls = (compliance?.controls ?? []).filter((control) =>
    [control.control_id, control.function, control.category, control.title, control.description, control.status, control.owner, control.evidence]
      .join(" ").toLowerCase().includes(complianceSearch.toLowerCase())
  );

  const filteredIncidents = incidents.filter((incident) =>
    [incident.id, incident.title, incident.description, incident.severity, incident.asset_name, incident.assigned_to, incident.status]
      .join(" ").toLowerCase().includes(incidentSearch.toLowerCase())
  );

  const filteredThreats = threats.filter((t) =>
    [t.id, t.rule_id, t.title, t.severity, t.asset_name, t.status, t.evidence].join(" ").toLowerCase().includes(threatSearch.toLowerCase())
  );

  const filteredVulnerabilities = vulnerabilities.filter((v) =>
    [v.id, v.cve, v.title, v.severity, v.asset_name, v.package, v.status].join(" ").toLowerCase().includes(vulnSearch.toLowerCase())
  );

  const filteredAssets = assets.filter((asset) =>
    [asset.id, asset.name, asset.resource_type, asset.provider, asset.region, asset.environment, asset.status, asset.criticality]
      .join(" ").toLowerCase().includes(assetSearch.toLowerCase())
  );

  const metrics = [
    { label: "Cloud assets monitored", value: overview?.assets_monitored.toLocaleString() ?? "1,284", change: "+8.2%", icon: Cloud, tone: "cyan" },
    { label: "Critical vulnerabilities", value: overview?.critical_findings.toString() ?? "07", change: "2 new today", icon: ShieldAlert, tone: "red" },
    { label: "Open incidents", value: overview?.open_incidents.toString() ?? "03", change: "1 investigating", icon: Siren, tone: "amber" },
    { label: "Compliance posture", value: `${overview?.compliance_score ?? 94}%`, change: "+2.4% this month", icon: ShieldCheck, tone: "green" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Command size={21}/></div><div><strong>NEXUS</strong><span>CLOUDSECOPS</span></div></div>
        <div className="workspace-label">WORKSPACE <span>PRODUCTION</span></div>
        <nav>{nav.map(({ label, icon: Icon }) => <button key={label} className={active === label ? "nav-item active" : "nav-item"} onClick={() => setActive(label)}><Icon size={17}/><span>{label}</span>{label === "Incident response" && <i className="nav-count">3</i>}</button>)}</nav>
        <div className="sidebar-bottom">
          <div className="security-status"><span className="pulse-dot"/><div><b>All systems operational</b><small>Last sync: just now</small></div></div>
          <div className="profile"><div className="avatar">SA</div><div><b>Security Analyst</b><small>Platform administrator</small></div><ChevronDown size={15}/></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="slash">/</span><b>{active}</b></div>
          <div className="top-actions"><div className="environment"><span/> AWS / DEMO ENVIRONMENT</div><button className="icon-button"><Search size={17}/></button><button className="icon-button notification"><Bell size={17}/><i/></button><div className="top-avatar">SA</div></div>
        </header>

        <div className="content">
          {active === "Asset inventory" ? (
            <section className="inventory-view">
              <section className="welcome-row">
                <div><div className="eyebrow"><span className="eyebrow-line"/> CLOUD ASSET INVENTORY</div><h1>Cloud <em>Assets</em></h1><p>Discover and review the resources connected to your cloud environment.</p></div>
                <div className="date-chip"><Database size={15}/> INVENTORY SOURCE <span className="live-dot"/> DEMO DATA</div>
              </section>
              <section className="inventory-summary">
                <article className="metric-card"><div className="metric-top"><span>Assets in inventory</span><div className="metric-icon cyan"><Boxes size={17}/></div></div><div className="metric-value">{assets.length}</div><div className="metric-change"><span className="change-good">API-backed</span><span>records returned</span></div><div className="metric-accent cyan"/></article>
                <article className="metric-card"><div className="metric-top"><span>Publicly exposed</span><div className="metric-icon red"><Globe2 size={17}/></div></div><div className="metric-value">{assets.filter(a => a.public_exposure).length}</div><div className="metric-change"><span className="change-alert">Requires review</span><span>public exposure</span></div><div className="metric-accent red"/></article>
                <article className="metric-card"><div className="metric-top"><span>Critical assets</span><div className="metric-icon amber"><AlertTriangle size={17}/></div></div><div className="metric-value">{assets.filter(a => a.criticality.toLowerCase() === "critical").length}</div><div className="metric-change"><span className="change-alert">High impact</span><span>criticality rating</span></div><div className="metric-accent amber"/></article>
                <article className="metric-card"><div className="metric-top"><span>Active resources</span><div className="metric-icon green"><CheckCircle2 size={17}/></div></div><div className="metric-value">{assets.filter(a => a.status.toLowerCase() === "active").length}</div><div className="metric-change"><span className="change-good">Operational</span><span>resource status</span></div><div className="metric-accent green"/></article>
              </section>
              <section className="panel inventory-panel">
                <div className="panel-heading inventory-heading"><div><h3>Discovered cloud resources</h3><p>Asset records retrieved from the NEXUS API</p></div><button className="subtle-button" onClick={() => setAssetRefresh(v => v + 1)} disabled={assetsLoading}><RefreshCw size={14} className={assetsLoading ? "spin" : ""}/> Refresh inventory</button></div>
                <div className="inventory-toolbar"><div className="inventory-search"><Search size={15}/><input aria-label="Search assets" placeholder="Search by name, type, region or ID..." value={assetSearch} onChange={e => setAssetSearch(e.target.value)}/></div><span className="inventory-count">{filteredAssets.length} OF {assets.length} ASSETS</span></div>
                {assetsLoading ? <div className="inventory-state"><span className="loader-dot"/> Loading cloud inventory from API...</div> :
                  assetsError ? <div className="inventory-state error-state"><AlertTriangle size={18}/><div><b>Unable to load inventory</b><small>{assetsError}. Check the API deployment and try again.</small></div><button className="subtle-button" onClick={() => setAssetRefresh(v => v + 1)}>Retry</button></div> :
                  filteredAssets.length === 0 ? <div className="inventory-state">No assets match your search.</div> :
                  <div className="table-wrap"><table className="asset-table"><thead><tr><th>ASSET</th><th>RESOURCE TYPE</th><th>PROVIDER / REGION</th><th>ENVIRONMENT</th><th>STATUS</th><th>CRITICALITY</th><th>EXPOSURE</th></tr></thead><tbody>{filteredAssets.map(asset => <tr key={asset.id}><td><div className="asset-identity"><span className="asset-symbol"><Server size={15}/></span><div><b>{asset.name}</b><small>{asset.id}</small></div></div></td><td>{asset.resource_type}</td><td><div className="provider-cell">{asset.provider}<small>{asset.region}</small></div></td><td><span className="environment-tag">{asset.environment}</span></td><td><span className={`resource-status ${asset.status.toLowerCase()}`}><i/>{asset.status}</span></td><td><span className={`severity ${asset.criticality.toLowerCase()}`}><i/>{asset.criticality}</span></td><td>{asset.public_exposure ? <span className="exposure exposed"><AlertTriangle size={12}/> Public</span> : <span className="exposure private"><LockKeyhole size={12}/> Private</span>}</td></tr>)}</tbody></table></div>}
                <div className="inventory-footnote"><span><i className="live-dot"/> API CONNECTED</span><span>DEMO CLOUD DATA · NOT LIVE AWS DISCOVERY</span></div>
              </section>
            </section>
          ) : active === "Vulnerability management" ? (
            <section className="inventory-view vulnerability-view">
              <section className="welcome-row">
                <div><div className="eyebrow"><span className="eyebrow-line"/> VULNERABILITY MANAGEMENT</div><h1>Vulnerability <em>Center</em></h1><p>Prioritize software weaknesses and track remediation across your cloud assets.</p></div>
                <div className="date-chip"><ShieldAlert size={15}/> SCANNER SOURCE <span className="live-dot"/> DEMO FINDINGS</div>
              </section>
              <section className="inventory-summary">
                <article className="metric-card"><div className="metric-top"><span>Total findings</span><div className="metric-icon cyan"><ShieldAlert size={17}/></div></div><div className="metric-value">{vulnerabilities.length}</div><div className="metric-change"><span className="change-good">API-backed</span><span>records returned</span></div><div className="metric-accent cyan"/></article>
                <article className="metric-card"><div className="metric-top"><span>Critical</span><div className="metric-icon red"><AlertOctagon size={17}/></div></div><div className="metric-value">{vulnerabilities.filter(v => v.severity === "Critical").length}</div><div className="metric-change"><span className="change-alert">Immediate review</span><span>highest severity</span></div><div className="metric-accent red"/></article>
                <article className="metric-card"><div className="metric-top"><span>Open findings</span><div className="metric-icon amber"><AlertTriangle size={17}/></div></div><div className="metric-value">{vulnerabilities.filter(v => v.status === "Open").length}</div><div className="metric-change"><span className="change-alert">Needs action</span><span>not yet in progress</span></div><div className="metric-accent amber"/></article>
                <article className="metric-card"><div className="metric-top"><span>Remediated</span><div className="metric-icon green"><CheckCircle2 size={17}/></div></div><div className="metric-value">{vulnerabilities.filter(v => v.status === "Remediated").length}</div><div className="metric-change"><span className="change-good">Resolved</span><span>remediation complete</span></div><div className="metric-accent green"/></article>
              </section>
              <section className="panel inventory-panel">
                <div className="panel-heading inventory-heading"><div><h3>Vulnerability findings</h3><p>Findings retrieved from the NEXUS API</p></div><button className="subtle-button" onClick={() => setVulnRefresh(v => v + 1)} disabled={vulnLoading}><RefreshCw size={14} className={vulnLoading ? "spin" : ""}/> Refresh findings</button></div>
                <div className="inventory-toolbar"><div className="inventory-search"><Search size={15}/><input aria-label="Search vulnerabilities" placeholder="Search by CVE, title, asset or package..." value={vulnSearch} onChange={e => setVulnSearch(e.target.value)}/></div><span className="inventory-count">{filteredVulnerabilities.length} OF {vulnerabilities.length} FINDINGS</span></div>
                {vulnLoading ? <div className="inventory-state"><span className="loader-dot"/> Loading vulnerability findings from API...</div> :
                  vulnError ? <div className="inventory-state error-state"><AlertTriangle size={18}/><div><b>Unable to load findings</b><small>{vulnError}. Check the API deployment and try again.</small></div><button className="subtle-button" onClick={() => setVulnRefresh(v => v + 1)}>Retry</button></div> :
                  filteredVulnerabilities.length === 0 ? <div className="inventory-state">No findings match your search.</div> :
                  <div className="table-wrap"><table className="asset-table vuln-table"><thead><tr><th>VULNERABILITY</th><th>SEVERITY / CVSS</th><th>AFFECTED ASSET</th><th>PACKAGE</th><th>VERSION</th><th>REMEDIATION</th></tr></thead><tbody>{filteredVulnerabilities.map(v => <tr key={v.id}><td><div className="asset-identity"><span className="asset-symbol vuln-symbol"><ShieldAlert size={15}/></span><div><b>{v.title}</b><small>{v.cve} · {v.id}</small></div></div></td><td><span className={`severity ${v.severity.toLowerCase()}`}>{v.severity}</span><div className="cvss-score">{v.cvss.toFixed(1)} CVSS</div></td><td><div className="provider-cell">{v.asset_name}<small>{v.asset_id}</small></div></td><td>{v.package}</td><td><div className="provider-cell">{v.current_version}<small>Fixed: {v.fixed_version}</small></div></td><td><span className={`remediation-status ${v.status.toLowerCase().replace(" ", "-")}`}><i/>{v.status}</span></td></tr>)}</tbody></table></div>}
                <div className="inventory-footnote"><span><i className="live-dot"/> API CONNECTED</span><span>DEMO SECURITY FINDINGS · NO LIVE SCANNER CONNECTED</span></div>
              </section>
            </section>
          ) : active === "Incident response" ? (
            <section className="inventory-view incident-response-view">
              <section className="welcome-row">
                <div><div className="eyebrow"><span className="eyebrow-line"/> SECURITY OPERATIONS / CASE MANAGEMENT</div><h1>Incident <em>Response</em></h1><p>Investigate security events, assign responders, and track containment through resolution.</p></div>
                <div className="date-chip"><Siren size={15}/> RESPONSE WORKFLOW <span className="live-dot"/> DEMO CASES</div>
              </section>
              <section className="inventory-summary">
                <article className="metric-card"><div className="metric-top"><span>Total incidents</span><div className="metric-icon cyan"><Siren size={17}/></div></div><div className="metric-value">{incidents.length}</div><div className="metric-change"><span className="change-good">API-backed</span><span>case records</span></div><div className="metric-accent cyan"/></article>
                <article className="metric-card"><div className="metric-top"><span>Critical cases</span><div className="metric-icon red"><AlertOctagon size={17}/></div></div><div className="metric-value">{incidents.filter(i => i.severity === "Critical" && i.status !== "Resolved").length}</div><div className="metric-change"><span className="change-alert">Priority response</span><span>unresolved</span></div><div className="metric-accent red"/></article>
                <article className="metric-card"><div className="metric-top"><span>In progress</span><div className="metric-icon amber"><Activity size={17}/></div></div><div className="metric-value">{incidents.filter(i => i.status === "Investigating" || i.status === "Contained").length}</div><div className="metric-change"><span className="change-alert">Active response</span><span>investigating / contained</span></div><div className="metric-accent amber"/></article>
                <article className="metric-card"><div className="metric-top"><span>Resolved</span><div className="metric-icon green"><CheckCircle2 size={17}/></div></div><div className="metric-value">{incidents.filter(i => i.status === "Resolved").length}</div><div className="metric-change"><span className="change-good">Closed</span><span>response complete</span></div><div className="metric-accent green"/></article>
              </section>
              <section className="panel incident-create-panel">
                <div className="panel-heading"><div><h3>Create response case</h3><p>Open a case and assign an initial response owner</p></div><span className="panel-menu">NEW CASE</span></div>
                <div className="incident-form-grid">
                  <input aria-label="Incident title" placeholder="Incident title" value={incidentTitle} onChange={e => setIncidentTitle(e.target.value)}/>
                  <select aria-label="Incident severity" value={incidentSeverity} onChange={e => setIncidentSeverity(e.target.value)}><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select>
                  <input aria-label="Affected asset ID" value={incidentAssetId} onChange={e => setIncidentAssetId(e.target.value)} placeholder="Asset ID"/>
                  <input aria-label="Affected asset name" value={incidentAssetName} onChange={e => setIncidentAssetName(e.target.value)} placeholder="Asset name"/>
                  <input aria-label="Assigned responder" value={incidentAssignee} onChange={e => setIncidentAssignee(e.target.value)} placeholder="Assigned responder"/>
                  <textarea aria-label="Incident description" placeholder="Describe the event, impact, and initial context..." value={incidentDescription} onChange={e => setIncidentDescription(e.target.value)}/>
                </div>
                <div className="incident-form-actions"><span>New cases start with status OPEN</span><button className="primary-button" onClick={createIncident} disabled={incidentSaving}><Siren size={14}/>{incidentSaving ? "Creating case..." : "Create incident"}</button></div>
              </section>
              <section className="panel inventory-panel">
                <div className="panel-heading inventory-heading"><div><h3>Incident queue</h3><p>Cases retrieved from the NEXUS response API</p></div><button className="subtle-button" onClick={() => setIncidentRefresh(v => v + 1)} disabled={incidentLoading}><RefreshCw size={14} className={incidentLoading ? "spin" : ""}/> Refresh queue</button></div>
                <div className="inventory-toolbar"><div className="inventory-search"><Search size={15}/><input aria-label="Search incidents" placeholder="Search by case, title, asset, owner or status..." value={incidentSearch} onChange={e => setIncidentSearch(e.target.value)}/></div><span className="inventory-count">{filteredIncidents.length} OF {incidents.length} INCIDENTS</span></div>
                {incidentError && <div className="incident-error"><AlertTriangle size={14}/>{incidentError}</div>}
                {incidentLoading ? <div className="inventory-state"><span className="loader-dot"/> Loading incident queue from API...</div> :
                  filteredIncidents.length === 0 ? <div className="inventory-state">No incidents match your search.</div> :
                  <div className="table-wrap"><table className="asset-table incident-table"><thead><tr><th>INCIDENT</th><th>SEVERITY</th><th>AFFECTED ASSET</th><th>RESPONDER</th><th>STATUS / ACTION</th></tr></thead><tbody>{filteredIncidents.map(incident => <tr key={incident.id}><td><div className="asset-identity"><span className="asset-symbol incident-symbol"><Siren size={15}/></span><div><b>{incident.title}</b><small>{incident.id} · {new Date(incident.created_at).toLocaleString()}</small><small className="incident-description">{incident.description}</small></div></div></td><td><span className={`severity ${incident.severity.toLowerCase()}`}>{incident.severity}</span></td><td><div className="provider-cell">{incident.asset_name}<small>{incident.asset_id}</small></div></td><td><select className="incident-select" aria-label={`Assign ${incident.id}`} value={incident.assigned_to} onChange={e => updateIncident(incident.id, { assigned_to: e.target.value })}><option>Security Analyst</option><option>Cloud Security</option><option>Identity Team</option><option>Platform Team</option><option>Unassigned</option></select></td><td><select className={`incident-select status-select ${incident.status.toLowerCase()}`} aria-label={`Update status ${incident.id}`} value={incident.status} onChange={e => updateIncident(incident.id, { status: e.target.value })}><option>Open</option><option>Investigating</option><option>Contained</option><option>Resolved</option></select></td></tr>)}</tbody></table></div>}
                <div className="inventory-footnote"><span><i className="live-dot"/> API CONNECTED · CASE MANAGEMENT ACTIVE</span><span>DEMO INCIDENT DATA · IN-MEMORY STORAGE, NOT PERSISTENT</span></div>
              </section>
            </section>
          ) : active === "Compliance center" ? (
            <section className="inventory-view compliance-view">
              <section className="welcome-row">
                <div><div className="eyebrow"><span className="eyebrow-line"/> GOVERNANCE / RISK / COMPLIANCE</div><h1>Compliance <em>Center</em></h1><p>Assess security controls, track implementation gaps, and maintain evidence against NIST CSF 2.0.</p></div>
                <div className="date-chip"><FileCheck2 size={15}/> FRAMEWORK <span className="live-dot"/> NIST CSF 2.0</div>
              </section>
              <section className="inventory-summary">
                <article className="metric-card"><div className="metric-top"><span>Compliance score</span><div className="metric-icon cyan"><Gauge size={17}/></div></div><div className="metric-value">{compliance ? `${compliance.score}%` : "—"}</div><div className="metric-change"><span className="change-good">Weighted assessment</span><span>implemented + partial</span></div><div className="metric-accent cyan"/></article>
                <article className="metric-card"><div className="metric-top"><span>Implemented</span><div className="metric-icon green"><CheckCircle2 size={17}/></div></div><div className="metric-value">{compliance?.implemented ?? "—"}</div><div className="metric-change"><span className="change-good">Marked implemented</span><span>controls</span></div><div className="metric-accent green"/></article>
                <article className="metric-card"><div className="metric-top"><span>Implementation gaps</span><div className="metric-icon red"><AlertTriangle size={17}/></div></div><div className="metric-value">{compliance?.gaps ?? "—"}</div><div className="metric-change"><span className="change-alert">Requires action</span><span>identified gaps</span></div><div className="metric-accent red"/></article>
                <article className="metric-card"><div className="metric-top"><span>Partial / not assessed</span><div className="metric-icon amber"><Activity size={17}/></div></div><div className="metric-value">{compliance ? compliance.partial + compliance.not_assessed : "—"}</div><div className="metric-change"><span className="change-alert">Needs evidence</span><span>controls</span></div><div className="metric-accent amber"/></article>
              </section>
              <section className="panel compliance-framework-panel">
                <div className="panel-heading"><div><h3>NIST CSF 2.0 function coverage</h3><p>Control assessment grouped across the six framework functions</p></div><span className="panel-menu">{compliance?.total_controls ?? 0} CONTROLS</span></div>
                <div className="compliance-functions">
                  {["GOVERN", "IDENTIFY", "PROTECT", "DETECT", "RESPOND", "RECOVER"].map((fn) => {
                    const controls = compliance?.controls.filter(control => control.function === fn) ?? [];
                    const completed = controls.filter(control => control.status === "Implemented").length;
                    const partial = controls.filter(control => control.status === "Partially implemented").length;
                    const score = controls.length ? Math.round(((completed + partial * 0.5) / controls.length) * 100) : 0;
                    return <article className="compliance-function" key={fn}><div><b>{fn}</b><strong>{score}%</strong></div><div className="compliance-progress"><i style={{ width: `${score}%` }}/></div><small>{completed} implemented · {partial} partial · {controls.length} controls</small></article>;
                  })}
                </div>
              </section>
              <section className="panel inventory-panel compliance-controls-panel">
                <div className="panel-heading inventory-heading"><div><h3>Control assessment register</h3><p>Update control status and document supporting evidence</p></div><button className="subtle-button" onClick={() => setComplianceRefresh(v => v + 1)} disabled={complianceLoading}><RefreshCw size={14} className={complianceLoading ? "spin" : ""}/> Refresh assessment</button></div>
                <div className="inventory-toolbar"><div className="inventory-search"><Search size={15}/><input aria-label="Search compliance controls" placeholder="Search control, function, owner or evidence..." value={complianceSearch} onChange={e => setComplianceSearch(e.target.value)}/></div><span className="inventory-count">{filteredComplianceControls.length} OF {compliance?.total_controls ?? 0} CONTROLS</span></div>
                {complianceError && <div className="incident-error"><AlertTriangle size={14}/>{complianceError}</div>}
                {complianceLoading ? <div className="inventory-state"><span className="loader-dot"/> Loading NIST CSF assessment from API...</div> :
                  !compliance ? <div className="inventory-state error-state"><AlertTriangle size={18}/><div><b>Unable to load assessment</b><small>{complianceError || "The compliance API did not return assessment data."}</small></div><button className="subtle-button" onClick={() => setComplianceRefresh(v => v + 1)}>Retry</button></div> :
                  filteredComplianceControls.length === 0 ? <div className="inventory-state">No controls match your search.</div> :
                  <div className="table-wrap"><table className="asset-table compliance-table"><thead><tr><th>CONTROL / CATEGORY</th><th>FUNCTION</th><th>STATUS / UPDATE</th><th>OWNER</th><th>EVIDENCE</th></tr></thead><tbody>{filteredComplianceControls.map(control => <tr key={control.control_id}><td><div className="asset-identity"><span className="asset-symbol compliance-symbol"><FileCheck2 size={15}/></span><div><b>{control.title}</b><small>{control.control_id} · {control.category}</small><small className="compliance-description">{control.description}</small></div></div></td><td><span className="environment-tag">{control.function}</span></td><td><select className={`incident-select compliance-status ${control.status.toLowerCase().replace(/ /g, "-")}`} aria-label={`Update status ${control.control_id}`} value={control.status} onChange={e => updateComplianceControl(control.control_id, { status: e.target.value })}><option>Implemented</option><option>Partially implemented</option><option>Gap</option><option>Not assessed</option></select></td><td><select className="incident-select" aria-label={`Assign owner ${control.control_id}`} value={control.owner} onChange={e => updateComplianceControl(control.control_id, { owner: e.target.value })}><option>Security Governance</option><option>Cloud Security</option><option>Vulnerability Team</option><option>Identity Team</option><option>Platform Team</option><option>Security Operations</option><option>Incident Response</option><option>Business Continuity</option></select></td><td><textarea className="compliance-evidence-input" aria-label={`Evidence ${control.control_id}`} defaultValue={control.evidence} onBlur={e => { if (e.target.value !== control.evidence) updateComplianceControl(control.control_id, { evidence: e.target.value }); }}/></td></tr>)}</tbody></table></div>}
                <div className="inventory-footnote"><span><i className="live-dot"/> API CONNECTED · ASSESSMENT ACTIVE</span><span>DEMO CONTROL EVIDENCE · NOT AN INDEPENDENT AUDIT OR CERTIFICATION</span></div>
              </section>
            </section>
          ) : active === "Threat detection" ? (
            <section className="inventory-view threat-detection-view">
              <section className="welcome-row">
                <div><div className="eyebrow"><span className="eyebrow-line"/> SECURITY MONITORING / RULE ENGINE</div><h1>Threat <em>Detection</em></h1><p>Identify suspicious cloud activity using deterministic security detection rules.</p></div>
                <div className="date-chip"><Radar size={15}/> TELEMETRY SOURCE <span className="live-dot"/> SAMPLE EVENTS</div>
              </section>
              <section className="inventory-summary">
                <article className="metric-card"><div className="metric-top"><span>Detections generated</span><div className="metric-icon cyan"><Radar size={17}/></div></div><div className="metric-value">{threats.length}</div><div className="metric-change"><span className="change-good">Rule engine</span><span>evaluated events</span></div><div className="metric-accent cyan"/></article>
                <article className="metric-card"><div className="metric-top"><span>Critical alerts</span><div className="metric-icon red"><AlertOctagon size={17}/></div></div><div className="metric-value">{threats.filter(t => t.severity === "Critical").length}</div><div className="metric-change"><span className="change-alert">Priority response</span><span>critical severity</span></div><div className="metric-accent red"/></article>
                <article className="metric-card"><div className="metric-top"><span>High severity</span><div className="metric-icon amber"><AlertTriangle size={17}/></div></div><div className="metric-value">{threats.filter(t => t.severity === "High").length}</div><div className="metric-change"><span className="change-alert">Analyst review</span><span>high severity</span></div><div className="metric-accent amber"/></article>
                <article className="metric-card"><div className="metric-top"><span>Detection rules</span><div className="metric-icon green"><ShieldCheck size={17}/></div></div><div className="metric-value">{new Set(threats.map(t => t.rule_id)).size}</div><div className="metric-change"><span className="change-good">Active logic</span><span>unique rule IDs</span></div><div className="metric-accent green"/></article>
              </section>
              <section className="panel inventory-panel">
                <div className="panel-heading inventory-heading"><div><h3>Detection queue</h3><p>Alerts generated by the NEXUS sample telemetry rule engine</p></div><button className="subtle-button" onClick={() => setThreatRefresh(v => v + 1)} disabled={threatLoading}><RefreshCw size={14} className={threatLoading ? "spin" : ""}/> Re-evaluate events</button></div>
                <div className="inventory-toolbar"><div className="inventory-search"><Search size={15}/><input aria-label="Search detections" placeholder="Search by rule, alert, asset or evidence..." value={threatSearch} onChange={e => setThreatSearch(e.target.value)}/></div><span className="inventory-count">{filteredThreats.length} OF {threats.length} DETECTIONS</span></div>
                {threatLoading ? <div className="inventory-state"><span className="loader-dot"/> Evaluating sample telemetry against detection rules...</div> :
                  threatError ? <div className="inventory-state error-state"><AlertTriangle size={18}/><div><b>Unable to load detections</b><small>{threatError}. Check the API deployment and try again.</small></div><button className="subtle-button" onClick={() => setThreatRefresh(v => v + 1)}>Retry</button></div> :
                  filteredThreats.length === 0 ? <div className="inventory-state">No detections match your search.</div> :
                  <div className="table-wrap"><table className="asset-table threat-table"><thead><tr><th>DETECTION</th><th>SEVERITY</th><th>AFFECTED ASSET</th><th>RULE / EVENT</th><th>EVIDENCE</th><th>STATUS</th></tr></thead><tbody>{filteredThreats.map(t => <tr key={t.id}><td><div className="asset-identity"><span className="asset-symbol threat-symbol"><Radar size={15}/></span><div><b>{t.title}</b><small>{t.id} · {new Date(t.detected_at).toLocaleString()}</small></div></div></td><td><span className={`severity ${t.severity.toLowerCase()}`}>{t.severity}</span></td><td><div className="provider-cell">{t.asset_name}<small>{t.asset_id}</small></div></td><td><div className="provider-cell">{t.rule_id}<small>{t.event_type}</small></div></td><td className="evidence-cell">{t.evidence}</td><td><span className="remediation-status in-progress"><i/>{t.status}</span></td></tr>)}</tbody></table></div>}
                <div className="inventory-footnote"><span><i className="live-dot"/> API CONNECTED · RULE ENGINE ACTIVE</span><span>DEMO TELEMETRY · NOT LIVE AWS MONITORING</span></div>
              </section>
            </section>
          ) : active === "Executive risk dashboard" ? (
            <section className="inventory-view executive-risk-view">
              <section className="welcome-row">
                <div><div className="eyebrow"><span className="eyebrow-line"/> EXECUTIVE SECURITY INTELLIGENCE</div><h1>Executive <em>Risk Dashboard</em></h1><p>Consolidated risk posture across cloud assets, vulnerabilities, detections, incidents, and NIST CSF 2.0.</p></div>
                <div className="date-chip"><Gauge size={15}/> RISK INTELLIGENCE <span className="live-dot"/> API AGGREGATED</div>
              </section>
              {riskLoading ? <div className="inventory-state"><span className="loader-dot"/> Aggregating security posture from NEXUS services...</div> : (
                <>
                  {riskError && <div className="inventory-state error-state"><AlertTriangle size={18}/><div><b>Partial data refresh</b><small>{riskError}</small></div><button className="subtle-button" onClick={() => setRiskRefresh(v => v + 1)}>Retry</button></div>}
                  <section className="inventory-summary">
                    <article className="metric-card"><div className="metric-top"><span>Cloud assets</span><div className="metric-icon cyan"><Cloud size={17}/></div></div><div className="metric-value">{assets.length}</div><div className="metric-change"><span className="change-good">{assets.filter(a => a.status.toLowerCase() === "active").length} active</span><span>inventory records</span></div><div className="metric-accent cyan"/></article>
                    <article className="metric-card"><div className="metric-top"><span>Critical / high vulnerabilities</span><div className="metric-icon red"><ShieldAlert size={17}/></div></div><div className="metric-value">{vulnerabilities.filter(v => ["critical","high"].includes(v.severity.toLowerCase()) && v.status.toLowerCase() !== "remediated").length}</div><div className="metric-change"><span className="change-alert">Prioritized findings</span><span>not remediated</span></div><div className="metric-accent red"/></article>
                    <article className="metric-card"><div className="metric-top"><span>Active threat detections</span><div className="metric-icon amber"><Radar size={17}/></div></div><div className="metric-value">{threats.filter(t => t.status.toLowerCase() !== "resolved").length}</div><div className="metric-change"><span className="change-alert">{threats.filter(t => t.severity.toLowerCase() === "critical").length} critical</span><span>demo detections</span></div><div className="metric-accent amber"/></article>
                    <article className="metric-card"><div className="metric-top"><span>NIST CSF 2.0 score</span><div className="metric-icon green"><ShieldCheck size={17}/></div></div><div className="metric-value">{compliance?.score ?? 0}%</div><div className="metric-change"><span className="change-good">{compliance?.implemented ?? 0} implemented</span><span>of {compliance?.total_controls ?? 0} controls</span></div><div className="metric-accent green"/></article>
                  </section>
                  <section className="middle-grid executive-risk-grid">
                    <article className="panel"><div className="panel-heading"><div><h3>Exposure by severity</h3><p>Open vulnerability findings and active detections</p></div><ShieldAlert size={17}/></div>
                      <div className="risk-bars">{(["Critical","High","Medium","Low"] as const).map(level => {
                        const vulnCount = vulnerabilities.filter(v => v.severity.toLowerCase() === level.toLowerCase() && v.status.toLowerCase() !== "remediated").length;
                        const threatCount = threats.filter(t => t.severity.toLowerCase() === level.toLowerCase() && t.status.toLowerCase() !== "resolved").length;
                        const total = vulnCount + threatCount;
                        const max = Math.max(1, ...["Critical","High","Medium","Low"].map(s => vulnerabilities.filter(v => v.severity.toLowerCase() === s.toLowerCase() && v.status.toLowerCase() !== "remediated").length + threats.filter(t => t.severity.toLowerCase() === s.toLowerCase() && t.status.toLowerCase() !== "resolved").length));
                        return <div className="risk-bar-row" key={level}><span>{level}</span><div className="risk-bar-track"><i className={"risk-bar-fill " + level.toLowerCase()} style={{width: (total / max * 100) + "%"}}/></div><b>{total}</b></div>;
                      })}</div>
                      <div className="risk-legend executive-legend"><span><i className="risk-dot critical"/> Vulnerabilities + detections</span><small>Counts exclude remediated / resolved records</small></div>
                    </article>
                    <article className="panel executive-incident-panel"><div className="panel-heading"><div><h3>Incident response posture</h3><p>Current case lifecycle</p></div><Siren size={17}/></div>
                      <div className="incident-posture-total"><strong>{incidents.filter(i => i.status.toLowerCase() !== "resolved").length}</strong><span>ACTIVE CASES</span></div>
                      <div className="incident-status-list">{(["Open","Investigating","Contained","Resolved"] as const).map(status => <div key={status}><span>{status}</span><b>{incidents.filter(i => i.status.toLowerCase() === status.toLowerCase()).length}</b></div>)}</div>
                      <button className="text-button" onClick={() => setActive("Incident response")}>Open incident queue <ArrowUpRight size={14}/></button>
                    </article>
                  </section>
                  <section className="panel inventory-panel executive-priority-panel">
                    <div className="panel-heading inventory-heading"><div><h3>Priority risk register</h3><p>Highest-severity open vulnerabilities and unresolved incidents</p></div><button className="subtle-button" onClick={() => setRiskRefresh(v => v + 1)} disabled={riskLoading}><RefreshCw size={14} className={riskLoading ? "spin" : ""}/> Refresh risk data</button></div>
                    <div className="table-wrap"><table className="asset-table"><thead><tr><th>RISK ITEM</th><th>TYPE</th><th>SEVERITY</th><th>AFFECTED RESOURCE</th><th>STATUS</th></tr></thead><tbody>
                      {[...vulnerabilities.filter(v => ["critical","high"].includes(v.severity.toLowerCase()) && v.status.toLowerCase() !== "remediated").map(v => ({id:v.id,title:v.title,type:"Vulnerability",severity:v.severity,asset:v.asset_name,status:v.status})), ...incidents.filter(i => i.status.toLowerCase() !== "resolved" && ["critical","high"].includes(i.severity.toLowerCase())).map(i => ({id:i.id,title:i.title,type:"Incident",severity:i.severity,asset:i.asset_name,status:i.status}))].sort((a,b) => (a.severity === "Critical" ? 0 : 1) - (b.severity === "Critical" ? 0 : 1)).slice(0,8).map(item => <tr key={item.type + "-" + item.id}><td><div className="finding-title">{item.title}<small>{item.id}</small></div></td><td>{item.type}</td><td><span className={"severity " + item.severity.toLowerCase()}><i/>{item.severity}</span></td><td className="asset-name">{item.asset}</td><td><span className="remediation-status in-progress"><i/>{item.status}</span></td></tr>)}
                    </tbody></table></div>
                    <div className="inventory-footnote"><span><i className="live-dot"/> API CONNECTED · EXECUTIVE VIEW AGGREGATED</span><span>DEMO SECURITY DATA · NOT LIVE AWS TELEMETRY</span></div>
                  </section>
                </>
              )}
            </section>
          ) : (
          <>
          <section className="welcome-row">
            <div><div className="eyebrow"><span className="eyebrow-line"/> SECURITY OPERATIONS CENTER</div><h1>Command <em>Center</em></h1><p>Real-time visibility across your cloud security posture.</p></div>
            <div className="date-chip"><Activity size={15}/> LIVE SECURITY OVERVIEW <span className="live-dot"/></div>
          </section>

          <section className="hero-panel">
            <div className="hero-grid"/>
            <div className="hero-copy"><div className="hero-kicker"><Zap size={13}/> NEXUS THREAT INTELLIGENCE</div><h2>Your cloud.<br/><span>Under control.</span></h2><p>Unified security insights, prioritized risks, and incident intelligence — all in one operational view.</p><button className="primary-button" onClick={() => setActive("Threat detection")}>Explore threat activity <ArrowUpRight size={16}/></button></div>
            <div className="hero-orbit"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit-core"><Shield size={38}/><span>NX</span></div><div className="orbit-tag tag-top"><i/> THREAT MONITORING</div><div className="orbit-tag tag-bottom"><CheckCircle2 size={13}/> DEFENSE ACTIVE</div></div>
            <div className="hero-foot"><span><span className="live-dot"/> MONITORING ACTIVE</span><span>TELEMETRY PIPELINE <b>DEMO</b></span><span>REGION <b>US-WEST-2</b></span></div>
          </section>

          <section className="section-heading"><div><h3>Security posture</h3><p>Key indicators across your cloud environment</p></div><button className="subtle-button">Last 24 hours <ChevronDown size={14}/></button></section>
          <section className="metric-grid">{metrics.map(({ label, value, change, icon: Icon, tone }) => <article className="metric-card" key={label}><div className="metric-top"><span>{label}</span><div className={`metric-icon ${tone}`}><Icon size={17}/></div></div><div className="metric-value">{value}</div><div className="metric-change"><span className={tone === "red" ? "change-alert" : "change-good"}>{change}</span><span>vs. previous period</span></div><div className={`metric-accent ${tone}`}/></article>)}</section>

          <section className="middle-grid">
            <article className="panel threat-panel"><div className="panel-heading"><div><h3>Threat activity</h3><p>Detection events over the last 24 hours</p></div><span className="panel-menu">•••</span></div><div className="threat-summary"><div><small>EVENTS DETECTED</small><strong>2,491</strong><span className="positive">↓ 12.8% from yesterday</span></div><div className="threat-legend"><span><i className="legend-critical"/>Critical</span><span><i className="legend-high"/>High</span><span><i className="legend-medium"/>Medium</span></div></div><div className="chart"><div className="chart-y"><span>600</span><span>400</span><span>200</span><span>0</span></div><div className="chart-main"><div className="chart-gridlines"><i/><i/><i/><i/></div><svg viewBox="0 0 620 150" preserveAspectRatio="none" role="img" aria-label="Illustrative threat activity trend"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#16c8e8" stopOpacity=".25"/><stop offset="100%" stopColor="#16c8e8" stopOpacity="0"/></linearGradient></defs><path d="M0 112 C28 105 35 85 65 92 S100 118 130 90 S165 80 190 86 S225 40 255 62 S290 85 320 70 S355 93 385 57 S420 69 450 42 S490 65 520 30 S570 50 620 18 L620 150 L0 150Z" fill="url(#area)"/><path d="M0 112 C28 105 35 85 65 92 S100 118 130 90 S165 80 190 86 S225 40 255 62 S290 85 320 70 S355 93 385 57 S420 69 450 42 S490 65 520 30 S570 50 620 18" fill="none" stroke="#21c7e8" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/></svg><div className="chart-x"><span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>24:00</span></div></div></div></article>
            <article className="panel risk-panel"><div className="panel-heading"><div><h3>Risk distribution</h3><p>Findings by severity</p></div><span className="panel-menu">•••</span></div><div className="donut-wrap"><div className="donut"><div className="donut-center"><strong>128</strong><small>TOTAL FINDINGS</small></div></div></div><div className="risk-legend"><div><span><i className="risk-dot critical"/>Critical</span><b>07 <small>5.5%</small></b></div><div><span><i className="risk-dot high"/>High</span><b>24 <small>18.8%</small></b></div><div><span><i className="risk-dot medium"/>Medium</span><b>56 <small>43.8%</small></b></div><div><span><i className="risk-dot low"/>Low</span><b>41 <small>32.0%</small></b></div></div></article>
          </section>

          <section className="panel findings-panel"><div className="panel-heading"><div><h3>Priority findings</h3><p>Security issues requiring analyst attention</p></div><button className="text-button" onClick={() => setActive("Vulnerability management")}>View all findings <ArrowUpRight size={14}/></button></div><div className="table-wrap"><table><thead><tr><th>FINDING</th><th>AFFECTED ASSET</th><th>SEVERITY</th><th>DETECTED</th><th/></tr></thead><tbody>{findings.map((f) => <tr key={f.id}><td><div className="finding-title">{f.title}<small>{f.id}</small></div></td><td className="asset-name"><Server size={14}/>{f.asset}</td><td><span className={`severity ${f.severity.toLowerCase()}`}><i/>{f.severity}</span></td><td className="muted-cell">{f.age}</td><td><button className="row-action" aria-label={`Open finding ${f.id}`}><ArrowUpRight size={15}/></button></td></tr>)}</tbody></table></div></section>
          </>
          )}
          <footer><span>© 2026 NEXUS SECURITY SYSTEMS <b>·</b> PLATFORM v0.1.0</span><span className="api-indicator"><i className={apiState === "Connected" ? "online" : ""}/>{apiState === "Connected" ? "API CONNECTED" : apiState.toUpperCase()}</span><span>BUILT FOR DEFENSE <LockKeyhole size={12}/></span></footer>
        </div>
      </main>
    </div>
  );
}

export default App;
