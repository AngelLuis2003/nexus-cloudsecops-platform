import { useEffect, useState } from "react";
import {
  Activity, AlertOctagon, ArrowUpRight, Bell, Boxes, CheckCircle2,
  ChevronDown, Cloud, Command, FileCheck2, Gauge, LayoutDashboard,
  LockKeyhole, Radar, Search, Server, Shield, ShieldAlert, ShieldCheck,
  Siren, Wifi, Zap
} from "lucide-react";

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

  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    fetch(`${apiBaseUrl}/api/v1/overview`)
      .then((r) => { if (!r.ok) throw new Error("API unavailable"); return r.json(); })
      .then((data: Overview) => { setOverview(data); setApiState("Connected"); })
      .catch(() => setApiState("Demo mode"));
  }, []);

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
          <footer><span>© 2026 NEXUS SECURITY SYSTEMS <b>·</b> PLATFORM v0.1.0</span><span className="api-indicator"><i className={apiState === "Connected" ? "online" : ""}/>{apiState === "Connected" ? "API CONNECTED" : apiState.toUpperCase()}</span><span>BUILT FOR DEFENSE <LockKeyhole size={12}/></span></footer>
        </div>
      </main>
    </div>
  );
}

export default App;
