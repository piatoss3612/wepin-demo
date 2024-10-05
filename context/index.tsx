"use client";

import { createContext, useEffect, useState } from "react";
import { WepinLogin } from "@wepin/login-js";
import { WepinLifeCycle, WepinSDK } from "@wepin/sdk-js";
import { BaseProvider, WepinProvider as Provider } from "@wepin/provider-js";

interface WepinContextValue {
  loginWithUI: () => void;
  loginWithOAuth: () => void;
  logout: () => void;
  registerWepin: () => void;
  getAccounts: () => void;
  getBalance: () => void;
  signMessage: (message: string) => void;
  sendTransaction: (to: string, amount: string) => void;
  signMessageDialog: () => void;
  sendTransactionDialog: () => void;
  userDetails: IWepinUser | null;
  currentAddress: string | undefined;
  accountDetails: string[] | null;
  balance: string | undefined;
  appStatus: WepinLifeCycle;
  registrationNeeded: boolean;
}

const WepinContext = createContext({} as WepinContextValue);

const wepinAppID = "1bbb88795e63e72383de1c46d5483193";
const wepinAppWebKey = "ak_live_tWiurs3oRQ2oviEZzLHhyyxjZsmf07iJZdROKBAP15X";

const wepinSdkInstance = new WepinSDK({
  appId: wepinAppID,
  appKey: wepinAppWebKey,
});

const wepinLoginInstance = new WepinLogin({
  appId: wepinAppID,
  appKey: wepinAppWebKey,
});

const wepinProvider = new Provider({
  appId: wepinAppID,
  appKey: wepinAppWebKey,
});

interface IWepinUser {
  status: "success" | "fail";
  userInfo?: UserInfo;
  walletId?: string;
  userStatus?: UserStatus;
  token?: UserToken;
}

interface UserToken {
  accessToken: string;
  refreshToken: string;
}
interface UserStatus {
  loginStatus: "complete" | "pinRequired" | "registerRequired";
  pinRequired?: boolean;
}
interface UserInfo {
  userId: string;
  email: string;
  provider: providerType;
  use2FA: boolean;
}
type providerType =
  | "google"
  | "apple"
  | "email"
  | "discord"
  | "naver"
  | "external_token";

const WepinProvider = ({ children }: { children: React.ReactNode }) => {
  const [blockchainProvider, setBlockchainProvider] = useState<BaseProvider>();
  const [appStatus, setAppStatus] = useState<WepinLifeCycle>("not_initialized");
  const [registrationNeeded, setRegistrationNeeded] = useState(false);
  const [userDetails, setUserDetails] = useState<IWepinUser | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | undefined>();
  const [accountDetails, setAccountDetails] = useState<string[] | null>(null);
  const [balance, setBalance] = useState<string | undefined>();

  useEffect(() => {
    // Initialize Wepin
    const initializeApp = async () => {
      try {
        await wepinSdkInstance.init();
        await wepinLoginInstance.init();
        await wepinProvider.init();

        const status = await wepinSdkInstance.getStatus();
        setAppStatus(status);

        // You must check both the network configured in Wepin Workspace (https://workspace.wepin.io)
        // and the network supported by the Wepin provider (https://htmlpreview.github.io/?https://github.com/WepinWallet/wepin-web-sdk-v1/blob/main/packages/provider/assets/supportedNetworkTable.html)
        // to set the provider's network value.
        // To use this example code, the Ethereum network must be enabled for the app in Wepin Workspace.
        setBlockchainProvider(await wepinProvider.getProvider("ethereum"));

        if (status === "login_before_register") {
          setRegistrationNeeded(true);
        }
      } catch (error) {
        console.error("Error during initialization:", error);
      }
    };
    initializeApp();
  }, []);

  const loginWithUI = async () => {
    try {
      const userInfo = await wepinSdkInstance.loginWithUI();
      const status = await wepinSdkInstance.getStatus();

      setAppStatus(status);
      setUserDetails(userInfo);
    } catch (error) {
      console.error("Login with UI failed:", error);
    }
  };

  const loginWithOAuth = async () => {
    try {
      const oauthUser = await wepinLoginInstance.loginWithOauthProvider({
        provider: "google",
      });
      const userInfo = await wepinLoginInstance.loginWepin(oauthUser);
      const status = await wepinSdkInstance.getStatus();
      setAppStatus(status);
      setUserDetails(userInfo);
      if (appStatus === "login_before_register") {
        setRegistrationNeeded(true);
      }
    } catch (error) {
      console.error("OAuth login failed:", error);
    }
  };

  const logout = async () => {
    try {
      await wepinSdkInstance.logout();
      const status = await wepinSdkInstance.getStatus();
      setAppStatus(status);
      setUserDetails(null);
      setAccountDetails(null);
      setBalance(undefined);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const registerWepin = async () => {
    if (!registrationNeeded) {
      alert("No registration required.");
      return;
    }
    try {
      const userInfo = await wepinSdkInstance.register();
      setUserDetails(userInfo);
      setRegistrationNeeded(false);
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  const getAccounts = async () => {
    if (!blockchainProvider) {
      alert("Provider is not initialized.");
      return;
    }
    try {
      const accounts: {
        result: string[];
      } = (await blockchainProvider.request({
        method: "eth_accounts",
      })) as { result: string[] };
      setAccountDetails(accounts.result);
      setCurrentAddress(blockchainProvider.selectedAddress ?? undefined);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const getBalance = async () => {
    if (!currentAddress) {
      alert("Please select an account.");
      return;
    }
    if (!blockchainProvider) {
      alert("Provider is not initialized.");
      return;
    }
    try {
      const balanceValue = await blockchainProvider.request({
        method: "eth_getBalance",
        params: [currentAddress, "latest"],
      });
      setBalance(balanceValue as string);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const signMessage = async (message: string) => {
    if (!currentAddress) {
      alert("Please select an account.");
      return;
    }
    if (!blockchainProvider) {
      alert("Provider is not initialized.");
      return;
    }
    try {
      const signedMessage = await blockchainProvider.request({
        method: "personal_sign",
        params: [message, currentAddress],
      });
      alert("Signed message:" + signedMessage);
    } catch (error) {
      alert("Error signing message:" + error);
    }
  };

  const sendTransaction = async (to: string, amount: string) => {
    if (!currentAddress) {
      alert("Please select an account.");
      return;
    }
    if (!blockchainProvider) {
      alert("Provider is not initialized.");
      return;
    }
    try {
      const txHash = await blockchainProvider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: currentAddress,
            to,
            value: amount,
          },
        ],
      });
      alert("Transaction sent:" + txHash);
    } catch (error) {
      alert("Error sending transaction:" + error);
    }
  };

  // Prompt for message to sign
  const signMessageDialog = () => {
    const message = prompt("Enter the message to sign:");
    if (message) {
      signMessage(message);
    }
  };

  // Prompt for transaction details (to address and amount)
  const sendTransactionDialog = () => {
    const to = prompt("Enter the recipient address:");
    if (!to) {
      return;
    }
    const amount = prompt("Enter the amount to send (in Wei):");
    if (to && amount) {
      sendTransaction(to, amount);
    }
  };

  return (
    <WepinContext.Provider
      value={{
        loginWithUI,
        loginWithOAuth,
        logout,
        registerWepin,
        getAccounts,
        getBalance,
        signMessage,
        sendTransaction,
        signMessageDialog,
        sendTransactionDialog,
        userDetails,
        currentAddress,
        accountDetails,
        balance,
        appStatus,
        registrationNeeded,
      }}
    >
      {children}
    </WepinContext.Provider>
  );
};

export { WepinContext, WepinProvider };
