import { Switch, Route, Router as WouterRouter } from "wouter";
import Home from "@/pages/Home";
import Simulator from "@/pages/Simulator";
import Layer3Routing from "@/pages/simulators/Layer3Routing";
import NetworkSwitching from "@/pages/simulators/NetworkSwitching";
import Layer4Ports from "@/pages/simulators/Layer4Ports";
import TCPSlidingWindow from "@/pages/simulators/TCPSlidingWindow";
import Layer5Session from "@/pages/simulators/Layer5Session";
import Layer6Presentation from "@/pages/simulators/Layer6Presentation";
import Layer7Protocol from "@/pages/simulators/Layer7Protocol";
import OSIEncapsulation from "@/pages/simulators/OSIEncapsulation";
import ARPSpoofing from "@/pages/simulators/ARPSpoofing";
import TCPIPStack from "@/pages/simulators/TCPIPStack";
import NetworkTransmission from "@/pages/simulators/NetworkTransmission";
import WellKnownPorts from "@/pages/simulators/WellKnownPorts";
import ISPLastMile from "@/pages/simulators/ISPLastMile";
import PoETopology from "@/pages/simulators/PoETopology";
import RoutingProtocol from "@/pages/simulators/RoutingProtocol";
import VPNTunnel from "@/pages/simulators/VPNTunnel";
import EthernetFrame from "@/pages/simulators/EthernetFrame";
import TCP3WayHandshake from "@/pages/simulators/TCP3WayHandshake";
import IPv4Subnetting from "@/pages/simulators/IPv4Subnetting";
import NATSimulator from "@/pages/simulators/NATSimulator";
import StatefulFirewall from "@/pages/simulators/StatefulFirewall";
import UTPCrimpingSimulator from "@/pages/simulators/UTPCrimpingSimulator";

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
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

export default App;
