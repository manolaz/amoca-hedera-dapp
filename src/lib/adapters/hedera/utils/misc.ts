import { mergeArrays, normalizeNamespaces } from "@walletconnect/utils";
import { ProposalTypes } from "@walletconnect/types";

export function getChainsFromApprovedSession(accounts: string[]): string[] {
  return accounts.map(
    (address) => `${address.split(":")[0]}:${address.split(":")[1]}`,
  );
}

export function getChainId(chain: string): string {
  return chain.includes(":") ? chain.split(":")[1] : chain;
}

export function mergeRequiredOptionalNamespaces(
  required: ProposalTypes.RequiredNamespaces = {},
  optional: ProposalTypes.RequiredNamespaces = {},
) {
  const requiredNamespaces = normalizeNamespaces(required);
  const optionalNamespaces = normalizeNamespaces(optional);
  return merge(requiredNamespaces, optionalNamespaces);
}

function merge<T extends ProposalTypes.RequiredNamespaces>(
  requiredNamespaces: T,
  optionalNamespaces: T,
): T {
  const merged: ProposalTypes.RequiredNamespaces = { ...requiredNamespaces };

  for (const [namespace, values] of Object.entries(optionalNamespaces)) {
    if (!merged[namespace]) {
      merged[namespace] = values;
    } else {
      merged[namespace] = {
        ...merged[namespace],
        ...values,
        chains: mergeArrays(values.chains, merged[namespace]?.chains),
        methods: mergeArrays(
          values.methods || [],
          merged[namespace]?.methods || [],
        ),
        events: mergeArrays(
          values.events || [],
          merged[namespace]?.events || [],
        ),
      };
    }
  }

  return merged as T;
}
