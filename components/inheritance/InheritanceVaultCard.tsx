"use client"

import { formatEther } from 'viem'
import { useInheritanceData, useInheritanceAssets, useClaimableETH } from '@/hooks/useInheritanceContract'
import { InheritanceStatus, AssetType } from '@/lib/contracts'
import { Button } from '@/components/ui/button'

interface InheritanceVaultCardProps {
  inheritanceId: bigint
  onManage?: (id: bigint) => void
}

export function InheritanceVaultCard({ inheritanceId, onManage }: InheritanceVaultCardProps) {
  const { data: inheritanceData, isLoading: isLoadingData } = useInheritanceData(inheritanceId)
  const { data: assets, isLoading: isLoadingAssets } = useInheritanceAssets(inheritanceId)
  const { data: claimableETH } = useClaimableETH(inheritanceId)

  if (isLoadingData || isLoadingAssets) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded w-1/2"></div>
          <div className="h-3 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!inheritanceData) return null

  const getStatusColor = (status: InheritanceStatus) => {
    switch (status) {
      case InheritanceStatus.ACTIVE:
        return 'text-green-600 bg-green-100'
      case InheritanceStatus.TRIGGERED:
        return 'text-yellow-600 bg-yellow-100'
      case InheritanceStatus.COMPLETED:
        return 'text-blue-600 bg-blue-100'
      case InheritanceStatus.CANCELLED:
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: InheritanceStatus) => {
    switch (status) {
      case InheritanceStatus.ACTIVE:
        return 'Active'
      case InheritanceStatus.TRIGGERED:
        return 'Triggered'
      case InheritanceStatus.COMPLETED:
        return 'Completed'
      case InheritanceStatus.CANCELLED:
        return 'Cancelled'
      default:
        return 'Unknown'
    }
  }

  const formatDate = (timestamp: bigint) => {
    if (timestamp === BigInt(0)) return 'Not set'
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  const totalValue = inheritanceData.totalETHDeposited
  const ethAssets = assets?.filter(asset => asset.assetType === AssetType.ETH).length || 0
  const erc20Assets = assets?.filter(asset => asset.assetType === AssetType.ERC20).length || 0
  const nftAssets = assets?.filter(asset => asset.assetType === AssetType.ERC721).length || 0

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {inheritanceData.name}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inheritanceData.status)}`}>
            {getStatusText(inheritanceData.status)}
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-lg font-bold text-foreground">
            {formatEther(totalValue)} ETH
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Beneficiaries</span>
          <span className="font-medium">{inheritanceData.totalBeneficiaries.toString()}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Assets</span>
          <span className="font-medium">
            {ethAssets + erc20Assets + nftAssets} items
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Created</span>
          <span className="font-medium">{formatDate(inheritanceData.createdAt)}</span>
        </div>

        {inheritanceData.triggeredAt > BigInt(0) && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Triggered</span>
            <span className="font-medium">{formatDate(inheritanceData.triggeredAt)}</span>
          </div>
        )}

        {claimableETH && claimableETH > BigInt(0) && (
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="text-green-600 font-medium">Claimable ETH</span>
            <span className="font-bold text-green-600">
              {formatEther(claimableETH)} ETH
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
        <div className="bg-muted/50 rounded p-2">
          <div className="font-medium text-blue-600">{ethAssets}</div>
          <div className="text-muted-foreground">ETH</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="font-medium text-green-600">{erc20Assets}</div>
          <div className="text-muted-foreground">Tokens</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="font-medium text-purple-600">{nftAssets}</div>
          <div className="text-muted-foreground">NFTs</div>
        </div>
      </div>

      <Button
        onClick={() => onManage?.(inheritanceId)}
        variant="outline"
        className="w-full"
      >
        Manage Vault
      </Button>
    </div>
  )
}
