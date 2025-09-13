import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { INHERITANCE_CONTRACT_ADDRESS, INHERITANCE_CONTRACT_ABI, InheritanceDetails, formatSTT } from '../lib/contracts';
import { shortenAddress, formatDate, parseSTT, isValidAddress, DURATION_OPTIONS } from '../lib/utils';
import CountdownTimer from './CountdownTimer';
import toast from 'react-hot-toast';

interface InheritanceManagerProps {
  inheritance: InheritanceDetails;
  timeRemaining: bigint;
  onUpdate: () => void;
}

export default function InheritanceManager({ inheritance, timeRemaining, onUpdate }: InheritanceManagerProps) {
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showUpdateBeneficiary, setShowUpdateBeneficiary] = useState(false);
  const [showUpdateDuration, setShowUpdateDuration] = useState(false);
  
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [newBeneficiary, setNewBeneficiary] = useState('');
  const [newDuration, setNewDuration] = useState(Number(inheritance.deadmanDuration));

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  const handleCheckIn = async () => {
    try {
      await writeContract({
        address: INHERITANCE_CONTRACT_ADDRESS as `0x${string}`,
        abi: INHERITANCE_CONTRACT_ABI,
        functionName: 'checkIn',
      });
      toast.success('Check-in initiated!');
    } catch (error: any) {
      toast.error(error.shortMessage || 'Failed to check in');
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await writeContract({
        address: INHERITANCE_CONTRACT_ADDRESS as `0x${string}`,
        abi: INHERITANCE_CONTRACT_ABI,
        functionName: 'depositFunds',
        value: parseSTT(depositAmount),
      });
      toast.success('Deposit initiated!');
      setShowDeposit(false);
      setDepositAmount('');
    } catch (error: any) {
      toast.error(error.shortMessage || 'Failed to deposit');
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const withdrawWei = parseSTT(withdrawAmount);
    if (withdrawWei > inheritance.amount) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      await writeContract({
        address: INHERITANCE_CONTRACT_ADDRESS as `0x${string}`,
        abi: INHERITANCE_CONTRACT_ABI,
        functionName: 'withdrawFunds',
        args: [withdrawWei],
      });
      toast.success('Withdrawal initiated!');
      setShowWithdraw(false);
      setWithdrawAmount('');
    } catch (error: any) {
      toast.error(error.shortMessage || 'Failed to withdraw');
    }
  };

  const handleUpdateBeneficiary = async () => {
    if (!isValidAddress(newBeneficiary)) {
      toast.error('Please enter a valid address');
      return;
    }

    try {
      await writeContract({
        address: INHERITANCE_CONTRACT_ADDRESS as `0x${string}`,
        abi: INHERITANCE_CONTRACT_ABI,
        functionName: 'updateBeneficiary',
        args: [newBeneficiary as `0x${string}`],
      });
      toast.success('Beneficiary update initiated!');
      setShowUpdateBeneficiary(false);
      setNewBeneficiary('');
    } catch (error: any) {
      toast.error(error.shortMessage || 'Failed to update beneficiary');
    }
  };

  const handleUpdateDuration = async () => {
    try {
      await writeContract({
        address: INHERITANCE_CONTRACT_ADDRESS as `0x${string}`,
        abi: INHERITANCE_CONTRACT_ABI,
        functionName: 'updateDeadmanSwitch',
        args: [BigInt(newDuration)],
      });
      toast.success('Duration update initiated!');
      setShowUpdateDuration(false);
    } catch (error: any) {
      toast.error(error.shortMessage || 'Failed to update duration');
    }
  };

  const isTriggered = timeRemaining <= 0n;
  const selectedDuration = DURATION_OPTIONS.find(d => d.seconds === newDuration);

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-white mb-6">Manage Your Inheritance</h2>
      
      {/* Current Status */}
      <div className="glass p-4 rounded-lg mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-white mb-2">Current Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Balance:</span>
                <span className="text-white font-medium">{formatSTT(inheritance.amount)} STT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Beneficiary:</span>
                <span className="text-white font-mono">{shortenAddress(inheritance.beneficiary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Check-in:</span>
                <span className="text-white">{formatDate(inheritance.lastCheckIn)}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-white mb-2">Deadman Switch</h3>
            <CountdownTimer 
              timeRemaining={timeRemaining}
              onTrigger={onUpdate}
              className="mb-2"
            />
            <p className="text-xs text-gray-400">
              {isTriggered ? 
                'Your beneficiary can now claim the inheritance' : 
                'Time remaining until inheritance becomes claimable'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Check-in Button - Most Important */}
      <div className="mb-6">
        <button
          onClick={handleCheckIn}
          disabled={isConfirming}
          className={`w-full py-3 font-bold text-lg ${
            isTriggered 
              ? 'btn-danger animate-pulse' 
              : timeRemaining < 24n * 60n * 60n 
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                : 'btn-success'
          } disabled:opacity-50`}
        >
          {isConfirming ? (
            <div className="flex items-center justify-center">
              <div className="loading-spinner mr-2"></div>
              Checking In...
            </div>
          ) : (
            <>
              {isTriggered && '🚨 URGENT: '}
              {timeRemaining < 24n * 60n * 60n && !isTriggered && '⚠️ '}
              Check In - Reset Deadman Switch
            </>
          )}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setShowDeposit(!showDeposit)}
          className="btn-primary py-2"
        >
          Deposit Funds
        </button>
        <button
          onClick={() => setShowWithdraw(!showWithdraw)}
          className="btn-secondary py-2"
          disabled={inheritance.amount === 0n}
        >
          Withdraw Funds
        </button>
        <button
          onClick={() => setShowUpdateBeneficiary(!showUpdateBeneficiary)}
          className="btn-secondary py-2"
        >
          Update Beneficiary
        </button>
        <button
          onClick={() => setShowUpdateDuration(!showUpdateDuration)}
          className="btn-secondary py-2"
        >
          Update Duration
        </button>
      </div>

      {/* Deposit Section */}
      {showDeposit && (
        <div className="glass p-4 rounded-lg mb-4">
          <h3 className="font-medium text-white mb-3">Deposit Funds</h3>
          <div className="flex gap-3">
            <input
              type="number"
              step="0.001"
              min="0"
              placeholder="Amount in STT"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="input-field flex-1"
            />
            <button
              onClick={handleDeposit}
              disabled={!depositAmount || isConfirming}
              className="btn-primary px-6"
            >
              Deposit
            </button>
          </div>
        </div>
      )}

      {/* Withdraw Section */}
      {showWithdraw && (
        <div className="glass p-4 rounded-lg mb-4">
          <h3 className="font-medium text-white mb-3">Withdraw Funds</h3>
          <p className="text-sm text-gray-400 mb-3">
            Available: {formatSTT(inheritance.amount)} STT
          </p>
          <div className="flex gap-3">
            <input
              type="number"
              step="0.001"
              min="0"
              max={Number(formatSTT(inheritance.amount))}
              placeholder="Amount in STT"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="input-field flex-1"
            />
            <button
              onClick={handleWithdraw}
              disabled={!withdrawAmount || isConfirming}
              className="btn-primary px-6"
            >
              Withdraw
            </button>
          </div>
        </div>
      )}

      {/* Update Beneficiary Section */}
      {showUpdateBeneficiary && (
        <div className="glass p-4 rounded-lg mb-4">
          <h3 className="font-medium text-white mb-3">Update Beneficiary</h3>
          <p className="text-sm text-gray-400 mb-3">
            Current: {shortenAddress(inheritance.beneficiary)}
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="New beneficiary address (0x...)"
              value={newBeneficiary}
              onChange={(e) => setNewBeneficiary(e.target.value)}
              className="input-field flex-1"
            />
            <button
              onClick={handleUpdateBeneficiary}
              disabled={!newBeneficiary || isConfirming}
              className="btn-primary px-6"
            >
              Update
            </button>
          </div>
        </div>
      )}

      {/* Update Duration Section */}
      {showUpdateDuration && (
        <div className="glass p-4 rounded-lg mb-4">
          <h3 className="font-medium text-white mb-3">Update Deadman Switch Duration</h3>
          <div className="space-y-3">
            <select
              value={newDuration}
              onChange={(e) => setNewDuration(Number(e.target.value))}
              className="input-field w-full"
            >
              {DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.seconds}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleUpdateDuration}
              disabled={newDuration === Number(inheritance.deadmanDuration) || isConfirming}
              className="btn-primary w-full"
            >
              Update Duration
            </button>
          </div>
        </div>
      )}

      {/* Message Display */}
      {inheritance.message && (
        <div className="glass p-4 rounded-lg">
          <h3 className="font-medium text-white mb-2">Message to Beneficiary</h3>
          <p className="text-gray-300 text-sm italic">"{inheritance.message}"</p>
        </div>
      )}
    </div>
  );
}