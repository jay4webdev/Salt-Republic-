"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#071b26] text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <p className="text-teal-400 font-mono text-sm tracking-widest uppercase mb-2">Salt Republic</p>
          <h2 className="text-3xl font-serif font-bold mb-4 text-[#f5f1ea]">Application Notice</h2>
          <p className="text-white/70 mb-6 text-sm">
            An unexpected error occurred while loading this page.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-2.5 bg-[#cbb795] text-[#071b26] font-medium rounded hover:bg-[#d8c7a8] transition"
          >
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}
