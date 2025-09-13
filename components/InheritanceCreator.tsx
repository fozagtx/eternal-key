import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { INHERITANCE_CONTRACT_ADDRESS, INHERITANCE_CONTRACT_ABI } from '../lib/contracts';
import { DURATION_OPTIONS, isValidAddress, parseSTT } from '../lib/utils';
import toast from 'react-hot-toast';

interface InheritanceCreatorProps {
  onSuccess: () => void;
}

export default function InheritanceCreator({ onSuccess }: InheritanceCreatorProps) {
  const [beneficiary, setBeneficiary] = useState('');
  const [duration, setDuration] = useState(DURATION_OPTIONS[2].seconds); // Default to 1 week
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleCreate = async () => {
    if (!isValidAddress(beneficiary)) {
      toast.error('Please enter a valid beneficiary address');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message for your beneficiary');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid STT amount');
      return;
    }

    setIsCreating(true);
    
    try {
      await writeContract({
        address: INHERITANCE_CONTRACT_ADDRESS as `0x${string}`,
        abi: INHERITANCE_CONTRACT_ABI,
        functionName: 'createInheritance',
        args: [beneficiary as `0x${string}`, BigInt(duration), message],
        value: parseSTT(amount),
      });

      toast.success('Inheritance creation initiated!');
    } catch (error: any) {
      console.error('Error creating inheritance:', error);
      toast.error(error.shortMessage || 'Failed to create inheritance');
      setIsCreating(false);
    }
  };

  // Handle transaction confirmation
  if (isSuccess && isCreating) {
    setIsCreating(false);
    toast.success('Inheritance created successfully!');
    onSuccess();
  }

  const selectedDuration = DURATION_OPTIONS.find(d => d.seconds === duration);

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-white mb-6">Create New Inheritance</h2>
      
      <div className="space-y-6">
        {/* Beneficiary Address */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Beneficiary Address
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            className="input-field"
          />
          <p className="text-xs text-gray-400 mt-1">
            The wallet address that will receive your inheritance
          </p>
        </div>

        {/* Duration Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Deadman Switch Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="input-field"
          >
            {DURATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.seconds}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Time period after which inheritance can be claimed if you don't check in
          </p>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Message to Beneficiary
          </label>
          <textarea
            placeholder="A personal message that will be delivered with the inheritance..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input-field h-24 resize-none"
            maxLength={500}
          />
          <p className="text-xs text-gray-400 mt-1">
            {message.length}/500 characters
          </p>
        </div>

        {/* Initial Deposit */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Initial Deposit (STT)
          </label>
          <input
            type="number"
            step="0.001"
            min="0"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field"
          />
          <p className="text-xs text-gray-400 mt-1">
            Amount of STT tokens to deposit initially (you can add more later)
          </p>
        </div>

        {/* Summary */}
        <div className="glass p-4 rounded-lg">
          <h3 className="font-medium text-white mb-2">Summary</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Beneficiary: {beneficiary || 'Not set'}</li>
            <li>• Duration: {selectedDuration?.label || 'Not selected'}</li>
            <li>• Initial deposit: {amount || '0'} STT</li>
            <li>• Message length: {message.length} characters</li>
          </ul>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={!beneficiary || !message || !amount || isCreating || isConfirming}
          className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating || isConfirming ? (
            <div className="flex items-center justify-center">
              <div className="loading-spinner mr-2"></div>
              {isConfirming ? 'Confirming...' : 'Creating...'}
            </div>
          ) : (
            'Create Inheritance'
          )}
        </button>
      </div>
    </div>
  );
}