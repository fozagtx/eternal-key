"use client"

import { useState } from 'react'
import { parseEther, Address } from 'viem'
import { Button } from '@/components/ui/button'
import { useInheritanceContract } from '@/hooks/useInheritanceContract'
import { AssetType } from '@/lib/contracts'

interface DepositAssetsFormProps {
  inheritanceId: bigint
  onSuccess?: () => void
}

export function DepositAssetsForm({ inheritanceId, onSuccess }: DepositAssetsFormProps) {
  const {
    depositETH,
    depositERC20,
    depositERC721,
    isWritePending,
    isConfirming,
    isConfirmed
  } = useInheritanceContract()

  const [activeTab, setActiveTab] = useState<'eth' | 'erc20' | 'nft'>('eth')
  const [formData, setFormData] = useState({
    ethAmount: '',
    tokenAddress: '',
    tokenAmount: '',
    nftAddress: '',
    tokenIds: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateETHForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.ethAmount || parseFloat(formData.ethAmount) <= 0) {
      newErrors.ethAmount = 'Amount must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateERC20Form = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.tokenAddress || !formData.tokenAddress.startsWith('0x') || formData.tokenAddress.length !== 42) {
      newErrors.tokenAddress = 'Invalid token contract address'
    }

    if (!formData.tokenAmount || parseFloat(formData.tokenAmount) <= 0) {
      newErrors.tokenAmount = 'Amount must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateNFTForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nftAddress || !formData.nftAddress.startsWith('0x') || formData.nftAddress.length !== 42) {
      newErrors.nftAddress = 'Invalid NFT contract address'
    }

    if (!formData.tokenIds.trim()) {
      newErrors.tokenIds = 'At least one token ID is required'
    } else {
      try {
        const ids = formData.tokenIds.split(',').map(id => id.trim())
        ids.forEach(id => {
          if (isNaN(parseInt(id)) || parseInt(id) < 0) {
            throw new Error('Invalid token ID')
          }
        })
      } catch {
        newErrors.tokenIds = 'Token IDs must be comma-separated numbers'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleETHDeposit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateETHForm()) return

    try {
      await depositETH(inheritanceId, formData.ethAmount)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Failed to deposit ETH:', error)
    }
  }

  const handleERC20Deposit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateERC20Form()) return

    try {
      const amount = parseEther(formData.tokenAmount)
      await depositERC20(inheritanceId, formData.tokenAddress as Address, amount)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Failed to deposit ERC20:', error)
    }
  }

  const handleNFTDeposit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateNFTForm()) return

    try {
      const tokenIds = formData.tokenIds
        .split(',')
        .map(id => BigInt(parseInt(id.trim())))

      await depositERC721(inheritanceId, formData.nftAddress as Address, tokenIds)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Failed to deposit NFT:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      ethAmount: '',
      tokenAddress: '',
      tokenAmount: '',
      nftAddress: '',
      tokenIds: ''
    })
    setErrors({})
  }

  if (isConfirmed) {
    resetForm()
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Deposit Assets</h2>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
        {[
          { key: 'eth', label: '💰 ETH' },
          { key: 'erc20', label: '🪙 ERC20' },
          { key: 'nft', label: '🖼️ NFTs' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ETH Deposit Form */}
      {activeTab === 'eth' && (
        <form onSubmit={handleETHDeposit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Amount (ETH) *
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={formData.ethAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, ethAmount: e.target.value }))}
              className="w-full border border-border rounded-md px-3 py-2 bg-background"
              placeholder="0.1"
            />
            {errors.ethAmount && <p className="text-red-500 text-sm mt-1">{errors.ethAmount}</p>}
          </div>

          <Button
            type="submit"
            disabled={isWritePending || isConfirming}
            className="w-full bg-gradient-to-r from-[#2567EC] to-[#37B6F7] hover:brightness-95"
          >
            {isWritePending ? 'Preparing...' : isConfirming ? 'Depositing...' : 'Deposit ETH'}
          </Button>
        </form>
      )}

      {/* ERC20 Deposit Form */}
      {activeTab === 'erc20' && (
        <form onSubmit={handleERC20Deposit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Token Contract Address *
            </label>
            <input
              type="text"
              value={formData.tokenAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, tokenAddress: e.target.value }))}
              className="w-full border border-border rounded-md px-3 py-2 bg-background font-mono text-sm"
              placeholder="0x..."
            />
            {errors.tokenAddress && <p className="text-red-500 text-sm mt-1">{errors.tokenAddress}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Amount *
            </label>
            <input
              type="number"
              step="0.000001"
              min="0"
              value={formData.tokenAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, tokenAmount: e.target.value }))}
              className="w-full border border-border rounded-md px-3 py-2 bg-background"
              placeholder="100"
            />
            {errors.tokenAmount && <p className="text-red-500 text-sm mt-1">{errors.tokenAmount}</p>}
            <p className="text-sm text-muted-foreground mt-1">
              Make sure to approve this contract to spend your tokens first
            </p>
          </div>

          <Button
            type="submit"
            disabled={isWritePending || isConfirming}
            className="w-full bg-gradient-to-r from-[#2567EC] to-[#37B6F7] hover:brightness-95"
          >
            {isWritePending ? 'Preparing...' : isConfirming ? 'Depositing...' : 'Deposit Tokens'}
          </Button>
        </form>
      )}

      {/* NFT Deposit Form */}
      {activeTab === 'nft' && (
        <form onSubmit={handleNFTDeposit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              NFT Contract Address *
            </label>
            <input
              type="text"
              value={formData.nftAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, nftAddress: e.target.value }))}
              className="w-full border border-border rounded-md px-3 py-2 bg-background font-mono text-sm"
              placeholder="0x..."
            />
            {errors.nftAddress && <p className="text-red-500 text-sm mt-1">{errors.nftAddress}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Token IDs *
            </label>
            <input
              type="text"
              value={formData.tokenIds}
              onChange={(e) => setFormData(prev => ({ ...prev, tokenIds: e.target.value }))}
              className="w-full border border-border rounded-md px-3 py-2 bg-background"
              placeholder="1, 2, 3"
            />
            {errors.tokenIds && <p className="text-red-500 text-sm mt-1">{errors.tokenIds}</p>}
            <p className="text-sm text-muted-foreground mt-1">
              Comma-separated list of token IDs. Make sure to approve this contract first.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isWritePending || isConfirming}
            className="w-full bg-gradient-to-r from-[#2567EC] to-[#37B6F7] hover:brightness-95"
          >
            {isWritePending ? 'Preparing...' : isConfirming ? 'Depositing...' : 'Deposit NFTs'}
          </Button>
        </form>
      )}

      {isConfirmed && (
        <div className="text-green-600 text-sm text-center mt-4">
          ✅ Assets deposited successfully!
        </div>
      )}
    </div>
  )
}
