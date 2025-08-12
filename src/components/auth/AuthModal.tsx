import React from 'react';
import { X } from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../ui';
import { SupabaseClientManager } from '../../lib/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
  title?: string;
  message?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  title = "Sign in to Continue",
  message = "You need to be signed in to upload PDFs to the cloud."
}) => {
  const handleSignIn = () => {
    // Redirect to auth page
    window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-md mx-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>

        <div className="space-y-3">
          <Button
            onClick={handleSignIn}
            className="w-full"
          >
            Sign In / Sign Up
          </Button>
          
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full"
          >
            Cancel
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your PDFs will be securely stored in the cloud and accessible from any device.
          </p>
        </div>
      </div>
    </Modal>
  );
};
