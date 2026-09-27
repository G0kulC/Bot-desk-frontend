import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

import { buttonVariants } from "@/components/button-variants";
import { EmptyState } from "@/components/States";

export function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      action={
        <Link to="/" className={buttonVariants()}>
          Go to dashboard
        </Link>
      }
    >
      That link doesn't match any page.
    </EmptyState>
  );
}

export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : (error as Error)?.message;
  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <EmptyState
        title="Something broke on this page"
        action={
          <button className={buttonVariants()} onClick={() => window.location.reload()}>
            Reload
          </button>
        }
      >
        {message}
      </EmptyState>
    </div>
  );
}
