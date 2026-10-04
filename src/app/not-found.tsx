import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#071b26] text-white flex flex-col items-center justify-center p-6 text-center">
      <p className="text-teal-400 font-mono text-sm tracking-widest uppercase mb-2">404 · Not Found</p>
      <h1 className="text-4xl font-bold font-serif mb-4 text-[#f5f1ea]">Page Not Found</h1>
      <p className="text-white/70 max-w-md mb-8 text-sm">
        The destination or charter information you are looking for is unavailable or has moved.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 bg-[#cbb795] text-[#071b26] font-medium rounded hover:bg-[#d8c7a8] transition"
      >
        Return Home
      </Link>
    </div>
  );
}
