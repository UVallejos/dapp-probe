"use client";
import React, { useState } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';

export default function ConnectButton() {
  // 4. Use modal hook
  const { open, close } = useWeb3Modal();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConnectClick = () => {
    open();
    setIsModalOpen(true);
  };

  const handleOpenNetworkClick = () => {
    open({ view: 'Networks' });
  };

  const handleCloseModal = () => {
    close();
    setIsModalOpen(false);
  };

  return (
    <>
      <button onClick={handleConnectClick}>Connect </button>
      {isModalOpen && (
        <button onClick={handleOpenNetworkClick}>Open Network Modal</button>
      )}
    </>
  );
}