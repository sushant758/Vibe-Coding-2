'use client';

export default function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-amber-50/95 border border-amber-900/20 text-stone-900 rounded-2xl shadow-2xl w-full max-w-md p-6 backdrop-blur-md">
        <h3 className="text-lg font-bold text-stone-900 mb-2">{title}</h3>
        <p className="text-stone-700 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-200/80 hover:bg-stone-300 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-md transition-colors cursor-pointer"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
