import React from 'react';
import { Bot } from 'lucide-react';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-5xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
             <Bot className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            AI Knowledge Assistant
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            KI-gestützte Dokumentenanalyse und Chat-Assistent.
          </p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;