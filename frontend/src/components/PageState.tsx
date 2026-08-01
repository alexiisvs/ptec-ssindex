import { AlertCircle, Inbox } from "lucide-react";

type PageStateProps = {
  title: string;
  message: string;
  error?: boolean;
  action?: () => void;
};

export function PageState({
  title,
  message,
  error = false,
  action,
}: PageStateProps) {
  const Icon = error ? AlertCircle : Inbox;
  return (
    <div className="grid min-h-72 place-items-center border-y border-zinc-200 bg-white px-5 py-12 text-center">
      <div className="max-w-md">
        <Icon
          className={error ? "mx-auto text-rose-600" : "mx-auto text-zinc-400"}
          size={30}
        />
        <h2 className="mt-4 text-lg font-bold text-zinc-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{message}</p>
        {action && (
          <button
            type="button"
            className="mt-5 h-10 rounded-md bg-brand-700 px-4 text-sm font-bold text-white hover:bg-brand-800"
            onClick={action}
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}
