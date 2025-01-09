import { createAppKit } from "@reown/appkit/react";

// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActionButtonList } from "./components/ActionButtonList";
import { InfoList } from "./components/InfoList";
import {
  projectId,
  metadata,
  networks,
  universalHederaAdapter,
} from "./config";

import "./App.css";
import { useState } from "react";
import { hederaTestnetNative } from "./lib/adapters/hedera";

// Create modal
createAppKit({
  adapters: [universalHederaAdapter],
  defaultNetwork: hederaTestnetNative,
  projectId,
  metadata,
  networks,
  themeMode: "light" as const,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    socials: false,
    swaps: false,
    onramp: false,
    email: false,
  },
});

export function App() {
  const [transactionHash, setTransactionHash] = useState("");
  const [signedMsg, setSignedMsg] = useState("");
  const [balance, setBalance] = useState("");
  const [nodes, setNodes] = useState<string[]>([]);

  const receiveHash = (hash: string) => {
    setTransactionHash(hash); // Update the state with the transaction hash
  };

  const receiveSignedMsg = (signedMsg: string) => {
    setSignedMsg(signedMsg); // Update the state with the transaction hash
  };

  const receivebalance = (balance: string) => {
    setBalance(balance);
  };

  const receiveNodes = (nodes: string[]) => {
    setNodes(nodes);
  };

  return (
    <div className="pages">
      <div className="logos">
        <img
          src="/reown.svg"
          alt="Reown"
          style={{ width: "150px", height: "150px" }}
        />
        <img
          src="/hedera.svg"
          alt="Hedera"
          style={{ width: "90px", height: "90px" }}
        />
      </div>

      <h1>AppKit EIP-155 & HIP-820 Hedera React dApp Example</h1>
      {/* <QueryClientProvider client={queryClient}> */}
      <appkit-button balance="hide" />
      <ActionButtonList
        sendHash={receiveHash}
        sendSignMsg={receiveSignedMsg}
        sendBalance={receivebalance}
        sendNodeAddresses={receiveNodes}
      />
      <div className="advice">
        <p>
          This projectId only works on localhost. <br />
          Go to{" "}
          <a
            href="https://cloud.reown.com"
            target="_blank"
            className="link-button"
            rel="Reown Cloud"
          >
            Reown Cloud
          </a>{" "}
          to get your own.
        </p>
      </div>
      <InfoList
        hash={transactionHash}
        signedMsg={signedMsg}
        balance={balance}
        nodes={nodes}
      />
    </div>
  );
}

export default App;
