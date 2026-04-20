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
