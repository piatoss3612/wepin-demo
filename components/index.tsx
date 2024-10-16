import React, { useEffect, useState } from "react";
import Button from "./Button";
import { WepinLifeCycle, WepinSDK } from "@wepin/sdk-js";
import { WepinLogin } from "@wepin/login-js";
import { BaseProvider, WepinProvider } from "@wepin/provider-js";
import { formatEther, fromHex, toHex } from "viem";

const wepinAppID = process.env.NEXT_PUBLIC_WEPIN_APP_ID || "";
const wepinAppWebKey = process.env.NEXT_PUBLIC_WEPIN_APP_WEB_KEY || "";

const wepinSdkInstance = new WepinSDK({
  appId: wepinAppID,
  appKey: wepinAppWebKey,
});

const wepinLoginInstance = new WepinLogin({
  appId: wepinAppID,
  appKey: wepinAppWebKey,
});

const wepinProvider = new WepinProvider({
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

const WepinBox = () => {
  const [blockchainProvider, setBlockchainProvider] = useState<BaseProvider>();
  const [chainId, setChainId] = useState<string | undefined>();
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [appStatus, setAppStatus] = useState<WepinLifeCycle>("not_initialized");
  const [registrationNeeded, setRegistrationNeeded] = useState(false);
  const [userDetails, setUserDetails] = useState<IWepinUser | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | undefined>();
  const [accountDetails, setAccountDetails] = useState<string[] | null>(null);
  const [balance, setBalance] = useState<string | undefined>();

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
      const accounts: string[] = (await blockchainProvider.request({
        method: "eth_accounts",
      })) as string[];

      setAccountDetails(accounts);
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
      const balanceValue: `0x${string}` = (await blockchainProvider.request({
        method: "eth_getBalance",
        params: [currentAddress, "latest"],
      })) as `0x${string}`;

      setBalance(`${formatEther(fromHex(balanceValue, "bigint"))} ETH`);
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
      const hexAmount = toHex(amount);

      const txHash = await blockchainProvider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: currentAddress,
            to,
            value: hexAmount,
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
        const provider: BaseProvider = await wepinProvider.getProvider(
          "evmeth-sepolia"
        );

        setBlockchainProvider(provider);
        setChainId(
          fromHex(
            (provider?.chainId as `0x${string}`) ?? "0x0",
            "bigint"
          ).toString()
        );

        if (status === "login_before_register") {
          setRegistrationNeeded(true);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error during initialization:", error);
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    const loadUserDetails = async () => {
      if (isInitialized && appStatus === "login" && !userDetails) {
        const userInfo = await wepinLoginInstance.getCurrentWepinUser();

        // delete token from userInfo (overflows the view port)
        delete userInfo.token;
        setUserDetails(userInfo);
      }
    };

    loadUserDetails();
  }, [isInitialized, appStatus, userDetails]);

  const loggedOutContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Button onClick={loginWithUI} text="Login with Wepin UI" />
    </div>
  );

  const loggedInContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      <p>Welcome, {userDetails?.userInfo?.email}</p>
      {userDetails && (
        <pre className="border border-gray-400 p-4 mt-4">
          {JSON.stringify(userDetails, null, 2)}
        </pre>
      )}
      <div className="grid grid-cols-3 gap-4">
        {registrationNeeded ? (
          <Button onClick={registerWepin} text="Registration" loggedIn={true} />
        ) : (
          <>
            <Button onClick={getAccounts} text="Get Accounts" loggedIn={true} />
            <Button onClick={getBalance} text="Get Balance" loggedIn={true} />
            <Button
              onClick={signMessageDialog}
              text="Sign Message"
              loggedIn={true}
            />
            <Button
              onClick={sendTransactionDialog}
              text="Send Transaction"
              loggedIn={true}
            />
            <Button
              onClick={() => {
                wepinSdkInstance.openWidget();
              }}
              text="Open Widget"
              loggedIn={true}
            />
            <Button onClick={logout} text="Sign Out" loggedIn={true} />
          </>
        )}
      </div>
      {
        <div className="border border-gray-400 p-4 mt-4">
          <p className="font-bold text-lg">Current Network:</p>
          <span className="text-sm">
            {chainId ? `Chain ID: ${chainId}` : "Not connected"}
          </span>
        </div>
      }

      {accountDetails && (
        <div className="border border-gray-400 p-4 mt-4">
          <p className="font-bold text-lg">Accounts:</p>
          <pre className="text-sm">
            {JSON.stringify(accountDetails, null, 2)}
          </pre>
        </div>
      )}

      {balance && (
        <div className="border border-gray-400 p-4 mt-4">
          <p className="font-bold text-lg">Balance:</p>
          <span className="text-sm">{balance}</span>
        </div>
      )}
    </div>
  );

  if (appStatus === "initializing") {
    return <p>Loading...</p>;
  }

  if (appStatus === "login") {
    return loggedInContent;
  }

  return loggedOutContent;
};

export default WepinBox;
