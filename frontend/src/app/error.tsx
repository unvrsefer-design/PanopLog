"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  console.error(error);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-red-600">
          Uygulama Hatası
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Bir şeyler ters gitti
        </h1>

        <p className="mt-3 text-slate-600">
          Sayfa yüklenirken beklenmeyen bir hata oluştu.
        </p>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          {error?.message || "Bilinmeyen hata"}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => reset()}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white"
          >
            Tekrar dene
          </button>

          <button
            onClick={() => window.location.reload()}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700"
          >
            Sayfayı yenile
          </button>
        </div>
      </div>
    </div>
  );
}