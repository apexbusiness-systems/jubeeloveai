export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[99999] bg-primary text-primary-foreground p-4 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-bold"
    >
      Skip to main content
    </a>
  );
}
