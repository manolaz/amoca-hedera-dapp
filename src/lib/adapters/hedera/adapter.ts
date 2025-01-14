import { AdapterBlueprint } from "@reown/appkit/adapters";
import {
  AppKitOptions,
  CoreHelperUtil,
  Provider,
  WcHelpersUtil,
} from "@reown/appkit";
import { WalletConnectProvider } from "./providers/wallet-connect-provider";
import { CaipNetwork, ChainNamespace } from "@reown/appkit-common";
import UniversalProvider, {
  IUniversalProvider,
} from "@walletconnect/universal-provider";
import {
  hederaMainnetEvm,
  hederaMainnetNative,
  hederaTestnetEvm,
  hederaTestnetNative,
} from "./utils/chains";
import { Transaction } from "@hashgraph/sdk";
import {
  HederaJsonRpcMethod,
  HederaSessionEvent,
} from "@hashgraph/hedera-wallet-connect";

export type ContructorParams = Omit<
  AdapterBlueprint.Params,
  "namespace" | "networks"
>;
// AppKit Hedera HIP-820 & EIP-155 ChainAdapter Implementation
export class UniversalHederaAdapter extends AdapterBlueprint {
  private eventsToUnbind: (() => void)[] = [];

  constructor(params: ContructorParams) {
    super({
      ...params,
      namespace: 'hedera' as ChainNamespace,
      networks: [
        hederaMainnetEvm,
        hederaMainnetNative,
        hederaTestnetEvm,
        hederaTestnetNative,
      ],
    });
  }

  get walletConnectProvider(): WalletConnectProvider | undefined {
    return this.provider as unknown as WalletConnectProvider;
  }

  async connectWalletConnect(onUri: (uri: string) => void): Promise<void> {
    const provider = this.walletConnectProvider;

    if (!this.caipNetworks || !provider) {
      throw new Error(
        "UniversalAdapter:connectWalletConnect - caipNetworks or provider is undefined",
      );
    }

    provider.on("display_uri", (uri: string) => {
      onUri(uri);
    });

    const hederaNamespace = {
      hedera: {
        chains: [
          hederaMainnetNative.caipNetworkId,
          hederaTestnetNative.caipNetworkId,
        ],
        methods: Object.values(HederaJsonRpcMethod),
        events: Object.values(HederaSessionEvent),
        rpcMap: {
          [hederaMainnetNative.id]: hederaMainnetNative.rpcUrls.default.http[0],
          [hederaTestnetNative.id]: hederaTestnetNative.rpcUrls.default.http[0],
        },
      },
    };
    const eipNamespace = WcHelpersUtil.createNamespaces([
      hederaTestnetEvm,
      hederaMainnetEvm,
    ]);

    await provider.connect({
      optionalNamespaces: {
        ...eipNamespace,
        ...hederaNamespace,
      },
    });
  }
  async connect(
    params: AdapterBlueprint.ConnectParams,
  ): Promise<AdapterBlueprint.ConnectResult> {
    const connector = this.connectors.find((c) => c.id === params.id);
    if (!connector) {
      throw new Error("Connector not found");
    }
    const selectedProvider =
      connector?.provider as unknown as UniversalProvider;
    if (!selectedProvider) {
      throw new Error("Provider not found");
    }

    const session = await selectedProvider.connect({});

    if (!session) {
      throw new Error("Failed to connect provider");
    }
    const accountId = session.namespaces.hedera.accounts[0]?.split(":").at(-1);

    this.connector = connector;
    this.bindEvents(selectedProvider);

    const chain =
      connector.chains.find((c) => c.id === params.chainId) ||
      connector.chains[0];

    if (!chain) {
      throw new Error(
        "The connector does not support any of the requested chains",
      );
    }

    return {
      id: connector.id,
      type: connector.type,
      address: accountId!,
      chainId: chain.id,
      provider: connector.provider,
    };
  }
  async getAccounts(
    params: AdapterBlueprint.GetAccountsParams,
  ): Promise<AdapterBlueprint.GetAccountsResult> {
    const addresses = (
      this.connectors.find((connector) => connector.id === params.id)
        ?.provider as unknown as WalletConnectProvider
    )?.getAccountAddresses();

    const accounts = addresses?.map((address) =>
      CoreHelperUtil.createAccount("hedera" as ChainNamespace, address, "eoa"),
    );

    return {
      accounts: accounts || [],
    };
  }
  async switchNetwork(
    params: AdapterBlueprint.SwitchNetworkParams,
  ): Promise<void> {
    const { caipNetwork, provider, providerType } = params;
    switch (providerType) {
      case "WALLET_CONNECT":
        (provider as unknown as UniversalProvider).setDefaultChain(
          `hedera:${String(caipNetwork.id)}`,
        );
        break;
      default:
        throw new Error("Unsupported provider type");
    }
  }
  async disconnect(params: AdapterBlueprint.DisconnectParams): Promise<void> {
    if (!params.provider || !params.providerType) {
      throw new Error("Provider or providerType not provided");
    }
    switch (params.providerType) {
      case "WALLET_CONNECT":
        if ((params.provider as unknown as UniversalProvider).session) {
          (params.provider as unknown as UniversalProvider).disconnect();
        }
        break;
      default:
        throw new Error("Unsupported provider type");
    }
  }
  async getBalance(
    params: AdapterBlueprint.GetBalanceParams,
  ): Promise<AdapterBlueprint.GetBalanceResult> {
    const caipNetwork = this.caipNetworks?.find(
      (c: CaipNetwork) => c.id === params.chainId,
    );

    if (!caipNetwork) {
      return {
        balance: "",
        symbol: "",
      };
    }

    const accountBalance = await (
      this.connectors.find(
        (connector) => connector.chain === caipNetwork.chainNamespace,
      )?.provider as unknown as WalletConnectProvider
    )?.getAccountBalance();

    return {
      balance: accountBalance || "0",
      symbol: "ℏ",
    };
  }

  getProfile(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _params: AdapterBlueprint.GetProfileParams,
  ): Promise<AdapterBlueprint.GetProfileResult> {
    // Get profile
    return Promise.resolve({} as unknown as AdapterBlueprint.GetProfileResult);
  }
  async syncConnectors(options: AppKitOptions): Promise<void> {
    if (!options.projectId) {
      throw new Error("Project ID is required");
    }

    if (!options.metadata) {
      throw new Error("Metadata is required");
    }

    if (!this.namespace) {
      throw new Error("Please configure a namespace");
    }

    const wcProvider = options.universalProvider;
    this.provider = wcProvider as unknown as Provider;
    this.addConnector({
      id: "hedera-wallet-connect",
      type: "WALLET_CONNECT",
      provider: this.provider as unknown as Provider,
      name: "Hedera Wallet Connect",
      chain: this.namespace!,
      chains: this.networks,
      info: {
        name: "Hedera Wallet Connect",
        rdns: "hedera-wallet",
        icon: "https://reown.xyz/logo.png",
      },
    });
  }
  async syncConnection(
    params: AdapterBlueprint.SyncConnectionParams,
  ): Promise<AdapterBlueprint.ConnectResult> {
    return this.connect({
      id: params.id,
      type: "WALLET_CONNECT",
      chainId: params.chainId,
    });
  }
  async signMessage(
    params: AdapterBlueprint.SignMessageParams,
  ): Promise<AdapterBlueprint.SignMessageResult> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    const signature = await (
      this.provider as unknown as WalletConnectProvider
    ).request({
      method: "hedera_signMessage",
      params: [params.message],
    });

    return { signature: signature as string };
  }
  async estimateGas(): Promise<AdapterBlueprint.EstimateGasTransactionResult> {
    return { gas: BigInt(0) };
  }
  async sendTransaction(
    params: AdapterBlueprint.SendTransactionParams,
  ): Promise<AdapterBlueprint.SendTransactionResult> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    const result = await (
      this.provider as unknown as WalletConnectProvider
    ).request({
      method: "hedera_executeTransaction",
      params: [params as unknown as Transaction],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { hash: (result as any).transactionId.toString() };
  }
  async writeContract(): Promise<AdapterBlueprint.WriteContractResult> {
    throw new Error("Contract interactions not supported on Hedera");
  }
  async getEnsAddress(
    params: AdapterBlueprint.GetEnsAddressParams,
  ): Promise<AdapterBlueprint.GetEnsAddressResult> {
    return { address: params.name };
  }
  parseUnits(): AdapterBlueprint.ParseUnitsResult {
    return BigInt(0);
  }
  formatUnits(): AdapterBlueprint.FormatUnitsResult {
    return "";
  }
  getWalletConnectProvider(): AdapterBlueprint.GetWalletConnectProviderResult {
    return this.provider as unknown as Provider;
  }
  async getCapabilities(): Promise<unknown> {
    return {};
  }

  async grantPermissions(): Promise<unknown> {
    return {};
  }

  async revokePermissions(): Promise<`0x${string}`> {
    return "0x";
  }
  // -- Private ------------------------------------------ //
  private bindEvents(connector: IUniversalProvider) {
    this.unbindEvents();

    const accountsChanged = (data: string[]) => {
      const [newAccount] = data;
      if (newAccount) {
        this.emit("accountChanged", {
          address: newAccount,
        });
      }
    };
    connector.on("accountsChanged", accountsChanged);
    this.eventsToUnbind.push(() =>
      connector.removeListener("accountsChanged", accountsChanged),
    );

    const chainChanged = (data: string) => {
      this.emit("switchNetwork", { chainId: data });
    };
    connector.on("chainChanged", chainChanged);
    this.eventsToUnbind.push(() =>
      connector.removeListener("chainChanged", chainChanged),
    );

    const disconnect = () => {
      this.emit("disconnect");
    };
    connector.on("disconnect", disconnect);
    this.eventsToUnbind.push(() =>
      connector.removeListener("disconnect", disconnect),
    );
  }

  private unbindEvents() {
    this.eventsToUnbind.forEach((unsubscribe) => unsubscribe());
    this.eventsToUnbind = [];
  }
}
