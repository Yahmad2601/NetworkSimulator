import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import Home from "@/pages/Home";

// Simulators are lazily loaded so the landing page doesn't ship every
// simulator (and framer-motion) up front. Each becomes its own chunk.
const Simulator = lazy(() => import("@/pages/Simulator"));
const Layer3Routing = lazy(() => import("@/pages/simulators/Layer3Routing"));
const NetworkSwitching = lazy(() => import("@/pages/simulators/NetworkSwitching"));
const Layer4Ports = lazy(() => import("@/pages/simulators/Layer4Ports"));
const TCPSlidingWindow = lazy(() => import("@/pages/simulators/TCPSlidingWindow"));
const Layer5Session = lazy(() => import("@/pages/simulators/Layer5Session"));
const Layer6Presentation = lazy(() => import("@/pages/simulators/Layer6Presentation"));
const Layer7Protocol = lazy(() => import("@/pages/simulators/Layer7Protocol"));
const OSIEncapsulation = lazy(() => import("@/pages/simulators/OSIEncapsulation"));
const ARPSpoofing = lazy(() => import("@/pages/simulators/ARPSpoofing"));
const TCPIPStack = lazy(() => import("@/pages/simulators/TCPIPStack"));
const NetworkTransmission = lazy(() => import("@/pages/simulators/NetworkTransmission"));
const WellKnownPorts = lazy(() => import("@/pages/simulators/WellKnownPorts"));
const ISPLastMile = lazy(() => import("@/pages/simulators/ISPLastMile"));
const PoETopology = lazy(() => import("@/pages/simulators/PoETopology"));
const RoutingProtocol = lazy(() => import("@/pages/simulators/RoutingProtocol"));
const VPNTunnel = lazy(() => import("@/pages/simulators/VPNTunnel"));
const EthernetFrame = lazy(() => import("@/pages/simulators/EthernetFrame"));
const TCP3WayHandshake = lazy(() => import("@/pages/simulators/TCP3WayHandshake"));
const IPv4Subnetting = lazy(() => import("@/pages/simulators/IPv4Subnetting"));
const NATSimulator = lazy(() => import("@/pages/simulators/NATSimulator"));
const StatefulFirewall = lazy(() => import("@/pages/simulators/StatefulFirewall"));
const UTPCrimpingSimulator = lazy(() => import("@/pages/simulators/UTPCrimpingSimulator"));
const DHCPSimulator = lazy(() => import("@/pages/simulators/DHCPSimulator"));
const TLSHandshake = lazy(() => import("@/pages/simulators/TLSHandshake"));
const HashingSalting = lazy(() => import("@/pages/simulators/HashingSalting"));
const DiffieHellman = lazy(() => import("@/pages/simulators/DiffieHellman"));
const IPv6Addressing = lazy(() => import("@/pages/simulators/IPv6Addressing"));
const TracerouteSimulator = lazy(() => import("@/pages/simulators/TracerouteSimulator"));
const VLANSimulator = lazy(() => import("@/pages/simulators/VLANSimulator"));
const STPSimulator = lazy(() => import("@/pages/simulators/STPSimulator"));
const SQLInjection = lazy(() => import("@/pages/simulators/SQLInjection"));
const XSSSimulator = lazy(() => import("@/pages/simulators/XSSSimulator"));
const PKICertChain = lazy(() => import("@/pages/simulators/PKICertChain"));
const DDoSSimulator = lazy(() => import("@/pages/simulators/DDoSSimulator"));
const PortScanner = lazy(() => import("@/pages/simulators/PortScanner"));
const ManInTheBox = lazy(() => import("@/pages/simulators/ManInTheBox"));

function LoadingScreen() {
  return (
    <div
      className="flex h-screen items-center justify-center"
      style={{ background: "#0a0e14" }}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
          <span className="status-ping absolute inline-flex w-2.5 h-2.5 rounded-full bg-teal-400 opacity-75" />
        </div>
        <span
          className="text-teal-400 uppercase tracking-widest font-bold"
          style={{ fontSize: 10 }}
        >
          Loading Simulator…
        </span>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sim/network" component={Simulator} />
      <Route path="/sim/layer3" component={Layer3Routing} />
      <Route path="/sim/switching" component={NetworkSwitching} />
      <Route path="/sim/ports" component={Layer4Ports} />
      <Route path="/sim/tcp-window" component={TCPSlidingWindow} />
      <Route path="/sim/session" component={Layer5Session} />
      <Route path="/sim/presentation" component={Layer6Presentation} />
      <Route path="/sim/layer7" component={Layer7Protocol} />
      <Route path="/sim/osi" component={OSIEncapsulation} />
      <Route path="/sim/arp" component={ARPSpoofing} />
      <Route path="/sim/tcpip" component={TCPIPStack} />
      <Route path="/sim/transmission" component={NetworkTransmission} />
      <Route path="/sim/well-known-ports" component={WellKnownPorts} />
      <Route path="/sim/isp-last-mile" component={ISPLastMile} />
      <Route path="/sim/poe-topology" component={PoETopology} />
      <Route path="/sim/routing-protocol" component={RoutingProtocol} />
      <Route path="/sim/vpn-tunnel" component={VPNTunnel} />
      <Route path="/sim/ethernet-frame" component={EthernetFrame} />
      <Route path="/sim/tcp-handshake" component={TCP3WayHandshake} />
      <Route path="/sim/ipv4-subnetting" component={IPv4Subnetting} />
      <Route path="/sim/nat-pat" component={NATSimulator} />
      <Route path="/sim/firewall" component={StatefulFirewall} />
      <Route path="/sim/utp-crimping" component={UTPCrimpingSimulator} />
      <Route path="/sim/dhcp" component={DHCPSimulator} />
      <Route path="/sim/tls" component={TLSHandshake} />
      <Route path="/sim/hashing" component={HashingSalting} />
      <Route path="/sim/diffie-hellman" component={DiffieHellman} />
      <Route path="/sim/ipv6" component={IPv6Addressing} />
      <Route path="/sim/traceroute" component={TracerouteSimulator} />
      <Route path="/sim/vlan" component={VLANSimulator} />
      <Route path="/sim/stp" component={STPSimulator} />
      <Route path="/sim/sql-injection" component={SQLInjection} />
      <Route path="/sim/xss" component={XSSSimulator} />
      <Route path="/sim/pki" component={PKICertChain} />
      <Route path="/sim/ddos" component={DDoSSimulator} />
      <Route path="/sim/port-scanning" component={PortScanner} />
      <Route path="/sim/cpu-man-in-the-box" component={ManInTheBox} />
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Suspense fallback={<LoadingScreen />}>
        <Router />
      </Suspense>
    </WouterRouter>
  );
}

export default App;
