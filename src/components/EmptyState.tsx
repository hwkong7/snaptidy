interface EmptyStateProps {
  icon: string;
  message: string;
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="px-6 py-20 text-center text-slate-400">
      <div className="mb-4 text-5xl">{icon}</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
