"use client";

import useWepin from "@/hooks";

export default function Home() {
  const {
    appStatus,
    userDetails,
    registrationNeeded,
    accountDetails,
    balance,
    loginWithUI,
    loginWithOAuth,
    logout,
    registerWepin,
    getAccounts,
    getBalance,
    signMessageDialog,
    sendTransactionDialog,
  } = useWepin();

  const Button = ({
    onClick,
    text,
    loggedIn,
  }: {
    onClick: () => void;
    text: string;
    loggedIn?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`${
        loggedIn
          ? "bg-violet-500 hover:bg-violet-700"
          : "bg-blue-500 hover:bg-blue-700"
      } text-white font-bold py-2 px-4 rounded`}
    >
      {text}
    </button>
  );

  const loggedOutContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Button onClick={loginWithUI} text="Login with Wepin UI" />
      <Button onClick={loginWithOAuth} text="Login with OAuth" />
    </div>
  );

  const loggedInContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      <p>Welcome, {userDetails?.userInfo?.email}</p>
      <div className="grid grid-cols-2 gap-4">
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
          </>
        )}
      </div>
      <Button onClick={logout} text="Sign Out" />

      {accountDetails && (
        <div className="border border-gray-400 p-4 mt-4">
          <p className="font-bold text-lg">Accounts:</p>
          <ul className="list-disc list-inside">
            {accountDetails.map((account, index) => (
              <li key={index} className="text-sm">
                {account}
              </li>
            ))}
          </ul>
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

  return (
    <div className="flex items-center justify-center h-screen bg-gray-200">
      {appStatus === "login" ? loggedInContent : loggedOutContent}
    </div>
  );
}
