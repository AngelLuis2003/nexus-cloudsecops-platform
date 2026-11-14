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
];

const findings = [
  { id: "NX-2048", title: "Publicly exposed storage bucket", asset: "prod-customer-data", severity: "Critical", age: "12 min ago" },
  { id: "NX-2047", title: "Unrestricted inbound security group", asset: "sg-prod-edge-01", severity: "High", age: "38 min ago" },
  { id: "NX-2046", title: "Outdated runtime detected", asset: "payments-api-cluster", severity: "Medium", age: "1 hr ago" },
];

function App() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [active, setActive] = useState("Overview");
  const [apiState, setApiState] = useState("Connecting");
  const [assets, setAssets] = useState<CloudAsset[]>([]);
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
