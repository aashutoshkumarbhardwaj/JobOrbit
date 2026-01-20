import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof console !== 'undefined') {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="h-10 w-10 text-gray-400" />
        </div>
        
        <h1 className="text-6xl font-light text-gray-900 mb-4">404</h1>
        <h2 className="text-xl font-medium text-gray-900 mb-3">Page not found</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard">
            <Button 
              className="bg-black text-white hover:bg-gray-800 transition-colors w-full sm:w-auto"
              size="lg"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          
          <Button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.history.back();
              }
            }}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto"
            size="lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Error ID: {location.pathname}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
