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

export default Button;
