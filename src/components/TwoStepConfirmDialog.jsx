import React, { useId, useState } from 'react';

export const TwoStepConfirmDialog = ({
  title,
  description,
  confirmationPhrase,
  confirmLabel,
  busy = false,
  error = '',
  onConfirm,
  onCancel
}) => {
  const [enteredPhrase, setEnteredPhrase] = useState('');
  const titleId = useId();
  const canConfirm = enteredPhrase === confirmationPhrase && !busy;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canConfirm) return;
    const confirmed = await onConfirm();
    if (confirmed !== false) onCancel();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md space-y-4 rounded-2xl border border-rose-500/40 bg-slate-950 p-5 text-white shadow-2xl sm:p-6"
      >
        <div>
          <h3 id={titleId} className="font-sports text-xl text-rose-200">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{description}</p>
        </div>
        {error && <p role="alert" className="rounded-lg border border-rose-800 bg-rose-950/60 px-3 py-2 text-sm text-rose-200">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-300">
            Type <span className="break-all font-mono text-rose-200">{confirmationPhrase}</span> to continue
            <input
              autoFocus
              autoComplete="off"
              spellCheck="false"
              value={enteredPhrase}
              onChange={(event) => setEnteredPhrase(event.target.value)}
              aria-label={`Type ${confirmationPhrase} to confirm`}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal normal-case text-white outline-none focus:border-rose-400"
            />
          </label>
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canConfirm}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-black text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? 'Working…' : confirmLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
