import { Link } from 'react-router';

export function NotFoundPage({ title = 'Page not found', message }: { title?: string; message?: string }) {
  return (
    <div className="my-16 flex flex-col items-center gap-4 text-center">
      <p className="text-7xl font-extrabold tracking-tighter text-base-content/15">404</p>
      <h1 className="text-2xl font-bold">{title}</h1>
      {message && <p className="text-base-content/70">{message}</p>}
      <Link to="/" className="btn btn-primary">
        Back to home
      </Link>
    </div>
  );
}
