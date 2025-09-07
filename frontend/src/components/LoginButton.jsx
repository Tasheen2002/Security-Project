// LoginButton.jsx
export default function LoginButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      Login
    </button>
  );
}
