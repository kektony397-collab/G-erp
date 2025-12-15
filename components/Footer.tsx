import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-white py-6">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Gopi Distributors. All rights reserved.</p>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <span>Created By</span>
          <span className="font-semibold text-gray-700">Yash K Pathak</span>
        </div>
      </div>
    </footer>
  );
}