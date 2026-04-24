import { writeContract, waitForTransactionReceipt, readContract } from "@wagmi/core";
import { parseUnits, formatUnits } from "viem";
import { config } from "@/config/wagmi.config";
import BEP20USDT_ABI from "@/abis/BEP20USDT.json";
import { toast } from "sonner";
import i18n from "@/i18n/config";

const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955" as `0x${string}`;
const MAIN_WALLET_ADDRESS = import.meta.env.VITE_ADMIN_WALLET_ADDRESS as `0x${string}`;

/**
 * Get USDT balance of an address
 * Step 3: Use readContract to call balanceOf
 */
export const getUSDTBalance = async (address: `0x${string}`): Promise<string> => {
  try {
    const balance = await readContract(config, {
      address: USDT_ADDRESS,
      abi: BEP20USDT_ABI as any,
      functionName: "balanceOf",
      args: [address],
    } as any);

    // USDT on BSC has 18 decimals
    return formatUnits(balance as bigint, 18);
  } catch (error) {
    console.error("Get USDT balance error:", error);
    throw error;
  }
};

/**
 * Transfer USDT tokens
 * Step 4: Use writeContract with function transfer(to, amount)
 * Step 5: Use waitForTransactionReceipt to wait for block confirmation
 */
export const transferUSDT = async (
  amount: string,
  fromAddress: `0x${string}`
): Promise<`0x${string}`> => {
  if (!fromAddress) {
    throw new Error(i18n.t("pre_register.connect_wallet_first"));
  }

  if (!MAIN_WALLET_ADDRESS) {
    throw new Error(i18n.t("pre_register.wallet_config_error"));
  }

  try {
    // Convert amount to wei (USDT on BSC has 18 decimals)
    const amountInWei = parseUnits(amount, 18);

    // 1. Check balance first (Step 3)
    const balance = await getUSDTBalance(fromAddress);
    if (parseFloat(balance) < parseFloat(amount)) {
      toast.error(i18n.t("pre_register.insufficient_balance"));
      throw new Error("Insufficient balance");
    }

    // 2. Call transfer function (Step 4)
    const hash = await writeContract(config, {
      account: fromAddress,
      address: USDT_ADDRESS,
      abi: BEP20USDT_ABI as any,
      functionName: "transfer",
      args: [MAIN_WALLET_ADDRESS, amountInWei],
      chainId: 56,
    } as any);

    toast.info(i18n.t("pre_register.tx_sent"));

    // 3. Wait for confirmation (Step 5)
    const receipt = await waitForTransactionReceipt(config, {
      hash,
      confirmations: 1, // Wait for at least 1 confirmation
    });

    if (receipt.status === "success") {
      return hash;
    } else {
      throw new Error(i18n.t("pre_register.blockchain_error"));
    }
  } catch (error: any) {
    console.error("Transfer USDT error:", error);
    const errorMessage = error?.shortMessage || error?.message || "";

    if (errorMessage.includes("User rejected") || errorMessage.includes("user rejected")) {
      toast.error(i18n.t("pre_register.tx_rejected"));
    } else {
      toast.error(errorMessage || i18n.t("pre_register.pay_failed"));
    }
    throw error;
  }
};
