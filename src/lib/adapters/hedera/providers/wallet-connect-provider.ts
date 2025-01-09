import { CaipNetwork, RequestArguments } from "@reown/appkit";
import {
  GetNodeAddressesResult,
  ExecuteTransactionParams,
  ExecuteTransactionResult,
  SignMessageParams,
  SignMessageResult,
  SignAndExecuteQueryParams,
  SignAndExecuteQueryResult,
  SignAndExecuteTransactionParams,
  SignAndExecuteTransactionResult,
  SignTransactionParams,
  SignTransactionResult,
  HederaJsonRpcMethod,
} from "@hashgraph/hedera-wallet-connect";
import { Transaction } from "@hashgraph/sdk";
import UniversalProvider, {
  IProvider,
  RpcProviderMap,
  UniversalProviderOpts,
} from "@walletconnect/universal-provider";
import HIP820Provider from "./hip820-provider";
import {
  getChainsFromApprovedSession,
  mergeRequiredOptionalNamespaces,
} from "../utils/misc";
import Eip155Provider from "./eip155-provider";

export type WalletConnectProviderConfig = {
  chains: CaipNetwork[];
} & UniversalProviderOpts;

// Reown AppKit UniversalProvider for HIP-820 & EIP-155 version implementation of the @hashgraph/hedera-wallet-connect DAppConnector
export class WalletConnectProvider extends UniversalProvider {
  public nativeProvider?: HIP820Provider;
  public eip155Provider?: Eip155Provider;

  constructor(opts: UniversalProviderOpts) {
    super(opts);
    this.init();
  }

  private async init() {
    //@ts-expect-error - private base method
    await this.initialize();

    this.namespaces = {
      ...(this.namespaces?.eip155
        ? {
            eip155: {
              ...this.namespaces?.eip155,
              rpcMap: this.optionalNamespaces?.eip155.rpcMap,
            },
          }
        : {}),
      ...(this.namespaces?.hedera
        ? {
            hedera: {
              ...this.namespaces?.hedera,
              rpcMap: this.optionalNamespaces?.hedera.rpcMap,
            },
          }
        : {}),
    };
  }

  emit(event: string, data?: unknown) {
    this.events.emit(event, data);
  }

  getAccountAddresses(): string[] {
    if (!this.session) {
      throw new Error("Session not initialized. Please call connect()");
    }
    if (!this.nativeProvider) {
      throw new Error("dAppProvider not initialized. Please call connect()");
    }
    return this.nativeProvider.requestAccounts();
  }

  async getAccountBalance(): Promise<string> {
    if (!this.session) {
      throw new Error("Session not initialized. Please call connect()");
    }
    if (!this.nativeProvider) {
      throw new Error("dAppProvider not initialized. Please call connect()");
    }
    return (
      await this.nativeProvider.getAccountBalance(this.session.topic)
    ).hbars
      .toBigNumber()
      .toString();
  }

  override async request<T = unknown>(
    args: RequestArguments,
    chain?: string | undefined,
    expiry?: number | undefined,
  ): Promise<T> {
    if (!this.session || !this.namespaces) {
      throw new Error("Please call connect() before request()");
    }
    const chainId = chain ?? this.namespaces.eip155.chains[0];
    if (
      Object.values(HederaJsonRpcMethod).includes(
        args.method as HederaJsonRpcMethod,
      )
    ) {
      if (!this.nativeProvider) {
        throw new Error(
          "nativeProvider not initialized. Please call connect()",
        );
      }
      return this.nativeProvider?.request({
        request: {
          ...args,
        },
        chainId: chainId!,
        topic: this.session.topic,
        expiry,
      });
    } else {
      if (!this.eip155Provider) {
        throw new Error("eip155Provider not initialized");
      }

      return this.eip155Provider?.request({
        request: {
          ...args,
        },
        chainId: chainId!,
        topic: this.session.topic,
        expiry,
      });
    }
  }

  /**
   * Retrieves the node addresses associated with the current Hedera network.
   *
   * When there is no active session or an error occurs during the request.
   * @returns Promise\<{@link GetNodeAddressesResult}\>
   */
  async hedera_getNodeAddresses() {
    return await this.request<GetNodeAddressesResult["result"]>({
      method: HederaJsonRpcMethod.GetNodeAddresses,
      params: undefined,
    });
  }

  /**
   * Executes a transaction on the Hedera network.
   *
   * @param {ExecuteTransactionParams} params - The parameters of type {@link ExecuteTransactionParams | `ExecuteTransactionParams`} required for the transaction execution.
   * @param {string[]} params.signedTransaction - Array of Base64-encoded `Transaction`'s
   * @returns Promise\<{@link ExecuteTransactionResult}\>
   * @example
   * Use helper `transactionToBase64String` to encode `Transaction` to Base64 string
   * ```ts
   * const params = {
   *  signedTransaction: [transactionToBase64String(transaction)]
   * }
   *
   * const result = await dAppConnector.executeTransaction(params)
   * ```
   */
  async hedera_executeTransaction(params: ExecuteTransactionParams) {
    return await this.request<ExecuteTransactionResult["result"]>({
      method: HederaJsonRpcMethod.ExecuteTransaction,
      params,
    });
  }

  /**
   * Signs a provided `message` with provided `signerAccountId`.
   *
   * @param {SignMessageParams} params - The parameters of type {@link SignMessageParams | `SignMessageParams`} required for signing message.
   * @param {string} params.signerAccountId - a signer Hedera Account identifier in {@link https://hips.hedera.com/hip/hip-30 | HIP-30} (`<nework>:<shard>.<realm>.<num>`) form.
   * @param {string} params.message - a plain UTF-8 string
   * @returns Promise\<{@link SignMessageResult}\>
   * @example
   * ```ts
   * const params = {
   *  signerAccountId: 'hedera:testnet:0.0.12345',
   *  message: 'Hello World!'
   * }
   *
   * const result = await dAppConnector.signMessage(params)
   * ```
   */
  async hedera_signMessage(params: SignMessageParams) {
    return await this.request<SignMessageResult["result"]>({
      method: HederaJsonRpcMethod.SignMessage,
      params,
    });
  }

  /**
   * Signs and send `Query` on the Hedera network.
   *
   * @param {SignAndExecuteQueryParams} params - The parameters of type {@link SignAndExecuteQueryParams | `SignAndExecuteQueryParams`} required for the Query execution.
   * @param {string} params.signerAccountId - a signer Hedera Account identifier in {@link https://hips.hedera.com/hip/hip-30 | HIP-30} (`<nework>:<shard>.<realm>.<num>`) form.
   * @param {string} params.query - `Query` object represented as Base64 string
   * @returns Promise\<{@link SignAndExecuteQueryResult}\>
   * @example
   * Use helper `queryToBase64String` to encode `Query` to Base64 string
   * ```ts
   * const params = {
   *  signerAccountId: '0.0.12345',
   *  query: queryToBase64String(query),
   * }
   *
   * const result = await dAppConnector.signAndExecuteQuery(params)
   * ```
   */
  async hedera_signAndExecuteQuery(params: SignAndExecuteQueryParams) {
    return await this.request<SignAndExecuteQueryResult["result"]>({
      method: HederaJsonRpcMethod.SignAndExecuteQuery,
      params,
    });
  }

  /**
   * Signs and executes Transactions on the Hedera network.
   *
   * @param {SignAndExecuteTransactionParams} params - The parameters of type {@link SignAndExecuteTransactionParams | `SignAndExecuteTransactionParams`} required for `Transaction` signing and execution.
   * @param {string} params.signerAccountId - a signer Hedera Account identifier in {@link https://hips.hedera.com/hip/hip-30 | HIP-30} (`<nework>:<shard>.<realm>.<num>`) form.
   * @param {string[]} params.transaction - Array of Base64-encoded `Transaction`'s
   * @returns Promise\<{@link SignAndExecuteTransactionResult}\>
   * @example
   * Use helper `transactionToBase64String` to encode `Transaction` to Base64 string
   * ```ts
   * const params = {
   *  signerAccountId: '0.0.12345'
   *  transaction: [transactionToBase64String(transaction)]
   * }
   *
   * const result = await dAppConnector.signAndExecuteTransaction(params)
   * ```
   */
  async hedera_signAndExecuteTransaction(
    params: SignAndExecuteTransactionParams,
  ) {
    return await this.request<SignAndExecuteTransactionResult["result"]>({
      method: HederaJsonRpcMethod.SignAndExecuteTransaction,
      params,
    });
  }

  /**
   * Signs and executes Transactions on the Hedera network.
   *
   * @param {SignTransactionParams} params - The parameters of type {@link SignTransactionParams | `SignTransactionParams`} required for `Transaction` signing.
   * @param {string} params.signerAccountId - a signer Hedera Account identifier in {@link https://hips.hedera.com/hip/hip-30 | HIP-30} (`<nework>:<shard>.<realm>.<num>`) form.
   * @param {Transaction | string} params.transactionBody - a built Transaction object, or a base64 string of a transaction body (deprecated).
   * @deprecated Using string for params.transactionBody is deprecated and will be removed in a future version. Please migrate to using Transaction objects directly.
   * @returns Promise\<{@link SignTransactionResult}\>
   * @example
   * ```ts
   *
   * const params = {
   *  signerAccountId: '0.0.12345',
   *  transactionBody
   * }
   *
   * const result = await dAppConnector.signTransaction(params)
   * ```
   */
  async hedera_signTransaction(params: SignTransactionParams) {
    if (!this.session) {
      throw new Error("Session not initialized. Please call connect()");
    }
    if (!this.nativeProvider) {
      throw new Error("dAppProvider not initialized. Please call connect()");
    }

    if (typeof params?.transactionBody === "string") {
      this.logger.warn(
        "Transaction body is a string. This is not recommended, please migrate to passing a transaction object directly.",
      );
      return await this.request<SignTransactionResult["result"]>({
        method: HederaJsonRpcMethod.SignTransaction,
        params,
      });
    }

    if (params?.transactionBody instanceof Transaction) {
      const signerAccountId = params?.signerAccountId?.split(":")?.pop();
      const isValidSigner = this.nativeProvider
        ?.requestAccounts()
        .includes(signerAccountId ?? "");

      if (!isValidSigner) {
        throw new Error(`Signer not found for account ${signerAccountId}`);
      }

      if (!params?.transactionBody) {
        throw new Error("No transaction provided");
      }

      return (await this.nativeProvider.signTransaction(
        params.transactionBody as Transaction,
        this.session.topic,
      ))!;
    }

    throw new Error(
      "Transaction sent in incorrect format. Ensure transaction body is either a base64 transaction body or Transaction object.",
    );
  }

  private getProviders(): Record<string, IProvider> {
    if (!this.client) {
      //@ts-expect-error - initialize is private method
      this.initialize();
      throw new Error("Sign Client not initialized");
    }

    if (!this.session) {
      throw new Error(
        "Session not initialized. Please call connect() before enable()",
      );
    }

    const namespaces = ["hedera", "eip155"];

    const providers: Record<string, IProvider> = {};

    namespaces.forEach((namespace) => {
      const accounts = this.session!.namespaces[namespace].accounts;
      const approvedChains = getChainsFromApprovedSession(accounts);
      const mergedNamespaces = mergeRequiredOptionalNamespaces(
        this.namespaces,
        this.optionalNamespaces,
      );
      const combinedNamespace = {
        ...mergedNamespaces[namespace],
        accounts,
        chains: approvedChains,
      };

      switch (namespace) {
        case "hedera": {
          const provider = new HIP820Provider({
            namespace: combinedNamespace,
            events: this.events,
            client: this.client,
          });
          this.nativeProvider = provider;
          providers[namespace] = provider;
          break;
        }
        case "eip155": {
          const provider = new Eip155Provider({
            namespace: combinedNamespace,
            events: this.events,
            client: this.client,
          });
          this.eip155Provider = provider;
          providers[namespace] = provider;
          break;
        }
        default:
          throw new Error(`Unsupported namespace: ${namespace}`);
      }
    });

    return providers;
  }

  // @ts-expect-error - override base rpcProviders logic
  get rpcProviders(): RpcProviderMap {
    if (!this.nativeProvider && !this.eip155Provider) {
      return this.getProviders();
    }
    return {
      hedera: this.nativeProvider!,
      eip155: this.eip155Provider!,
    };
  }

  set rpcProviders(_: RpcProviderMap) {}
}
