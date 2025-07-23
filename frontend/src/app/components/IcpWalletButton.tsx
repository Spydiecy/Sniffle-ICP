'use client';

import { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { FaWallet } from 'react-icons/fa';

export default function IcpWalletButton() {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const client = await AuthClient.create();
        setAuthClient(client);
        
        // Check if user is already authenticated
        const isAuthenticated = await client.isAuthenticated();
        if (isAuthenticated) {
          const identity = client.getIdentity();
          setPrincipal(identity.getPrincipal().toString());
        }
      } catch (error) {
        console.error('Failed to initialize auth client:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleLogin = async () => {
    if (!authClient) return;

    try {
      await authClient.login({
        identityProvider: 'https://identity.ic0.app',
        onSuccess: () => {
          const identity = authClient.getIdentity();
          setPrincipal(identity.getPrincipal().toString());
        },
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    if (!authClient) return;
    
    await authClient.logout();
    setPrincipal(null);
  };

  if (isLoading) {
    return (
      <button className="bg-gray-400 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
        <FaWallet /> Loading...
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {principal ? (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
            {principal.substring(0, 10)}...{principal.substring(principal.length - 8)}
          </span>
          <button 
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleLogin}
          className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <FaWallet /> Connect Wallet
        </button>
      )}
    </div>
  );
}
