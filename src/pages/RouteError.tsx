import { Link, isRouteErrorResponse, useRouteError } from 'react-router';

/** Last-resort boundary for errors thrown while rendering a route. */
export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unknown error';

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-bold">Something broke</h1>
      <p className="text-base-content/70">{message}</p>
      <Link to="/" className="btn btn-primary" reloadDocument>
        Back to home
      </Link>
    </div>
  );
}
