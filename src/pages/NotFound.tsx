import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>Page Not Found | OWASP Securing Agentic Applications Guide</title>
        <meta name="description" content="The page you're looking for doesn't exist. Return to the OWASP Securing Agentic Applications Guide homepage." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://agenticsecurity.info/" />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
    </>
  );
};

export default NotFound;
