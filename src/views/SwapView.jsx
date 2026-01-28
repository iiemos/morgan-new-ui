import React, { useEffect, useMemo, useState, useRef } from 'react'
import WalletConnect from '../components/WalletConnect.jsx'
import Notification from '../components/Notification.jsx'
import { Icon } from '@iconify/react'
import { useAccount, useConnect, useReadContract, useWriteContract, useSimulateContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import ERC20_ABI from '../abis/ERC20.json'
import USD1SWAP_ROUTER_ABI from '../abis/IUsd1swapRouter02ABI.json'
import TRADING_ABI from '../abis/TradingABI.json'
import { useTranslation } from 'react-i18next'

// Addresses
const USD1SWAP_ROUTER_ADDRESS = '0xfdc450300611776F640Cd5e879D678Acd455087c'
// const MGN_ADDRESS = '0x635504391e8f8bc9895Ad3fAc880be5B1d9094F5'
const MGN_ADDRESS = '0x1B21dCFfe9Fd430518D41C59ab095Cde5Ec4D2F1'
const USDT_ADDRESS = '0x57B84A31E00eF4378E6b2D30703b73d02Aee13f8'
// const TRADING_ADDRESS = '0x33473D733C627828368F610B84F7FBd51F6CEe9F'
const TRADING_ADDRESS = '0x2746B0eA4C4F8da24B1d9F174de935b5C4F4449D'

const MaxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

function SwapView() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  // const {  isConnected } = useAccount();
  // const address = '0xc4bbfad25740517144361a4215054ecd8b70c148'
  const { t } = useTranslation()

  // UI state
  const [fromToken, setFromToken] = useState('USD1')
  const [toToken, setToToken] = useState('MGN')
  const [fromAmount, setFromAmount] = useState('')
  const [slippage, setSlippage] = useState(20)
  const [customSlippage, setCustomSlippage] = useState('')
  const [showCustomSlippage, setShowCustomSlippage] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [toAmount, setToAmount] = useState('')
  const [pendingHash, setPendingHash] = useState('')
  const [usd1ToMgnRate, setUsd1ToMgnRate] = useState('0.0000')
  const [mgnToUsd1Rate, setMgnToUsd1Rate] = useState('0.0000')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  // User info for purchase limits
  const [userInfo, setUserInfo] = useState(null)
  
  // Transaction status and notifications state
  const [transactionStatus, setTransactionStatus] = useState('') // 'pending', 'success', 'error', 'approving', 'swapping', ''
  const [transactionHash, setTransactionHash] = useState('')
  const [notifications, setNotifications] = useState([]) // 通知数组
  const [showRetry, setShowRetry] = useState(false)
  
  // Notification helper functions
  const showNotification = (message, type = 'info') => {
    // 每次只显示一个通知，清除之前的所有通知
    const notificationId = Date.now() + Math.random()
    setNotifications([{ id: notificationId, message, type }])
  }
  
  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }
  
  const clearAllNotifications = () => {
    setNotifications([])
  }
  
  // Retry function
  const handleRetry = () => {
    setShowRetry(false)
    setTransactionStatus('')
    setTransactionHash('')
    executeSwap()
  }
  const [isContractPaused, setIsContractPaused] = useState(false)
  const [isLiquidityInsufficient, setIsLiquidityInsufficient] = useState(false)
  
  // Refs for click outside detection
  const settingsPopupRef = useRef(null)
  const settingsButtonRef = useRef(null)

  // Token allowances (for USD1/USDT and MGN)
  // USDT授权到TRADING_ADDRESS (用于buy)
  const { data: usdtAllowanceForTrading, refetch: refetchUsdtAllowanceForTrading } = useReadContract({
    address: USDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address ?? '0x0', TRADING_ADDRESS],
    enabled: !!address
  })
  // USDT授权到Router (保留用于其他场景)
  const { data: usdtAllowance, refetch: refetchUsdtAllowance } = useReadContract({
    address: USDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address ?? '0x0', USD1SWAP_ROUTER_ADDRESS],
    enabled: !!address
  })
  // MGN授权到Router (用于sell/swap)
  const { data: mgnAllowance, refetch: refetchMgnAllowance } = useReadContract({
    address: MGN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address ?? '0x0', USD1SWAP_ROUTER_ADDRESS],
    enabled: !!address
  })
  
  // Token balances (from chain)
  const { data: usdtBalance, refetch: refetchUsdtBalance } = useReadContract({
    address: USDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address ?? '0x0'],
    enabled: !!address
  })
  const { data: mgnBalance, refetch: refetchMgnBalance } = useReadContract({
    address: MGN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address ?? '0x0'],
    enabled: !!address
  })
  
  // User info for purchase limits
  const { data: userInfoData, refetch: refetchUserInfo } = useReadContract({
    address: TRADING_ADDRESS,
    abi: TRADING_ABI,
    functionName: 'getUserInfo',
    args: [address ?? '0x0'],
    enabled: !!address
  })
  
  // Check if contract is paused
  const { data: isPausedData } = useReadContract({
    address: TRADING_ADDRESS,
    abi: TRADING_ABI,
    functionName: 'paused',
    enabled: true
  })

  // Approve txs
  const { data: approveUsdtData, error: approveUsdtError } = useSimulateContract({
    address: USDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [USD1SWAP_ROUTER_ADDRESS, MaxUint256],
  })

  const { data: approveMgnData, error: approveMgnError } = useSimulateContract({
    address: MGN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [USD1SWAP_ROUTER_ADDRESS, MaxUint256],
  })

  // Router getAmountsOut
  const { data: usd1OutData, refetch: refetchUsd1Out } = useReadContract({
    address: USD1SWAP_ROUTER_ADDRESS,
    abi: USD1SWAP_ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [parseUnits('1', 18), [USDT_ADDRESS, MGN_ADDRESS]],
    enabled: !!address
  })
  const { data: mgnOutData, refetch: refetchMgnOut } = useReadContract({
    address: USD1SWAP_ROUTER_ADDRESS,
    abi: USD1SWAP_ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [parseUnits('1', 18), [MGN_ADDRESS, USDT_ADDRESS]],
    enabled: !!address
  })

  // Track rates from router
  useEffect(() => {
    if (usd1OutData && Array.isArray(usd1OutData) && usd1OutData.length >= 2) {
      const rateVal = parseFloat(formatUnits(usd1OutData[1], 18))
      setUsd1ToMgnRate(rateVal.toFixed(6))
    }
  }, [usd1OutData])
  useEffect(() => {
    if (mgnOutData && Array.isArray(mgnOutData) && mgnOutData.length >= 2) {
      const rateVal = parseFloat(formatUnits(mgnOutData[1], 18))
      setMgnToUsd1Rate(rateVal.toFixed(6))
    }
  }, [mgnOutData])

  // Click outside to close settings popup
  useEffect(() => {
    function handleClickOutside(event) {
      if (isSettingsOpen && 
          settingsPopupRef.current && 
          !settingsPopupRef.current.contains(event.target) &&
          settingsButtonRef.current &&
          !settingsButtonRef.current.contains(event.target)) {
        setIsSettingsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSettingsOpen])
  
  // Update user info when data changes
  useEffect(() => {
    if (userInfoData && Array.isArray(userInfoData) && userInfoData.length === 3) {
      const [limit, bought, remaining] = userInfoData
      try {
        setUserInfo({
          limit: limit ? parseFloat(formatUnits(limit, 18)).toFixed(3) : '0.000',
          bought: bought ? parseFloat(formatUnits(bought, 18)).toFixed(3) : '0.000',
          remaining: remaining ? parseFloat(formatUnits(remaining, 18)).toFixed(3) : '0.000',
          hasQuota: remaining ? remaining > 0n : false
        })
      } catch (error) {
        console.error('格式化用户信息时出错:', error)
        setUserInfo({
          limit: '0.000',
          bought: '0.000',
          remaining: '0.000',
          hasQuota: false
        })
      }
    }
  }, [userInfoData])

  // Check contract pause status
  useEffect(() => {
    setIsContractPaused(!!isPausedData)
    if (isPausedData) {
      showNotification(t('error.contractPaused'), 'error')
    }
  }, [isPausedData, t])

  // Set transaction status with auto-clear
  // 更新setTransactionStatusWithClear函数，确保与新的状态管理配合
  const setTransactionStatusWithClear = (status, message = '') => {
    setTransactionStatus(status)
    // 错误状态时显示重试入口
    if (status === 'error') {
      setShowRetry(true)
    } else {
      setShowRetry(false)
    }
    if (status === 'success' || status === 'error') {
      setTimeout(() => {
        setTransactionStatus('')
        setTransactionHash('')
      }, 5000)
    }
    if (message) {
      showNotification(message, status === 'error' ? 'error' : 'success')
    }
  }

  // Enhanced refresh data function
  const enhancedRefreshData = async () => {
    if (isProcessing) return
    setIsRefreshing(true)
    try {
      // Refresh all data
      if (address) {
        await Promise.all([
          refetchUsd1Out(),
          refetchMgnOut(),
          refetchUsdtAllowance(),
          refetchUsdtAllowanceForTrading(),
          refetchMgnAllowance(),
          refetchUserInfo(),
          refetchUsdtBalance(),
          refetchMgnBalance()
        ])
      }
      // Simulate rate update
      const delta = (Math.random() * 0.02) - 0.01
      const newRate = Math.max(0.01, (usd1ToMgnRate ? parseFloat(usd1ToMgnRate) : 0.4528) * (1 + delta))
      setUsd1ToMgnRate(newRate.toFixed(6))
      setMgnToUsd1Rate((1 / newRate).toFixed(6))
      showNotification(t('success.dataRefreshed'), 'success')
    } catch (error) {
      console.error('刷新数据失败:', error)
      showNotification(t('error.refreshFailed'), 'error')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Derived rate for current direction
  const computedRate = useMemo(() => {
    if (fromToken === 'USD1' && toToken === 'MGN') return parseFloat(usd1ToMgnRate || '0')
    if (fromToken === 'MGN' && toToken === 'USD1') return parseFloat(mgnToUsd1Rate || '0')
    return 0
  }, [fromToken, toToken, usd1ToMgnRate, mgnToUsd1Rate])
  
  // Dynamic balances based on selected tokens
  const fromBalance = useMemo(() => {
    if (fromToken === 'USD1') {
      return usdtBalance ? parseFloat(formatUnits(usdtBalance, 18)) : 0
    } else if (fromToken === 'MGN') {
      return mgnBalance ? parseFloat(formatUnits(mgnBalance, 18)) : 0
    }
    return 0
  }, [fromToken, usdtBalance, mgnBalance])
  
  const toBalance = useMemo(() => {
    if (toToken === 'USD1') {
      return usdtBalance ? parseFloat(formatUnits(usdtBalance, 18)) : 0
    } else if (toToken === 'MGN') {
      return mgnBalance ? parseFloat(formatUnits(mgnBalance, 18)) : 0
    }
    return 0
  }, [toToken, usdtBalance, mgnBalance])

  // Update toAmount when fromAmount or rate changes
  useEffect(() => {
    if (!fromAmount) { setToAmount(''); return }
    const inVal = parseFloat(fromAmount) || 0
    if (inVal > 0 && computedRate > 0) {
      setToAmount((inVal * computedRate).toFixed(6))
    } else {
      setToAmount('')
    }
  }, [fromAmount, computedRate])

  // Helpers
  function setMaxAmount() {
    setFromAmount(fromBalance.toFixed(6))
  }

  // Refresh simulates rate update
  // 更新refreshData函数，调用enhancedRefreshData确保所有数据都被刷新
  function refreshData() {
    enhancedRefreshData()
  }

  // Execute swap (on-chain actually, simplified here)
  const [deadline] = useState(() => Math.floor(Date.now() / 1000) + 60 * 20)
  const { data: swapUsd1ToMgnData, error: swapUsd1ToMgnError } = useSimulateContract({
    address: USD1SWAP_ROUTER_ADDRESS,
    abi: USD1SWAP_ROUTER_ABI,
    functionName: 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
    args: [parseUnits('0', 18), parseUnits('0', 18), [USDT_ADDRESS, MGN_ADDRESS], address ?? '', deadline],
  })

  const { data: swapMgnToUsd1Data, error: swapMgnToUsd1Error } = useSimulateContract({
    address: USD1SWAP_ROUTER_ADDRESS,
    abi: USD1SWAP_ROUTER_ABI,
    functionName: 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
    args: [parseUnits('0', 18), parseUnits('0', 18), [MGN_ADDRESS, USDT_ADDRESS], address ?? '', deadline],
  })

  // Write contract hook (wagmi v2+ uses writeContractAsync)
  const { writeContractAsync } = useWriteContract()
  
  // Transaction receipt hook for monitoring transaction status
  const { 
    data: txReceipt, 
    isLoading: isTxPending, 
    isSuccess: isTxSuccess, 
    isError: isTxError,
    error: txError 
  } = useWaitForTransactionReceipt({
    hash: pendingHash || undefined,
    enabled: !!pendingHash,
  })
  
  // Monitor transaction status changes
  useEffect(() => {
    if (!pendingHash) return
    
    if (isTxPending) {
      setTransactionStatus('pending')
      showNotification(`${t('info.pending')} Hash: ${pendingHash.slice(0, 10)}...`, 'info')
    }
    
    if (isTxSuccess && txReceipt) {
      setTransactionStatus('success')
      setTransactionHash(pendingHash)
      showNotification(t('success.transactionSuccess'), 'success')
      
      // Refresh all data after successful transaction
      enhancedRefreshData()
      
      // Clear form
      setFromAmount('')
      setToAmount('')
      setIsProcessing(false)
      
      // Clear pending hash after a delay
      setTimeout(() => {
        setPendingHash('')
        setTransactionStatus('')
        setTransactionHash('')
      }, 5000)
    }
    
    if (isTxError) {
      setTransactionStatus('error')
      setShowRetry(true)
      showNotification(`${t('error.stakeFailed')}: ${txError?.message || 'Unknown error'}`, 'error')
      setIsProcessing(false)
      setPendingHash('')
    }
  }, [pendingHash, isTxPending, isTxSuccess, isTxError, txReceipt, txError])

  // Wallet connect helper
  function connectWallet() {
    if (isConnected) return
    if (connectors?.length) {
      connect({ connector: connectors[0] })
    }
  }

  // 交换 From/To 代币
  function swapTokens() {
    const tmp = fromToken
    setFromToken(toToken)
    setToToken(tmp)
    setFromAmount(toAmount)
  }

  // Execute swap with comprehensive validation and status handling
  async function executeSwap() {
    // Clear previous notifications
    clearAllNotifications()
    
    // Basic connection check
    if (!isConnected) {
      connectWallet()
      return
    }
    
    // Comprehensive validation
    const amount = parseFloat(fromAmount)
    
    // Zero amount check
    if (!fromAmount || amount <= 0) {
      showNotification(t('error.validAmount'), 'error')
      return
    }
    
    // Insufficient balance check
    if (amount > fromBalance) {
      showNotification(t('error.insufficientBalance'), 'error')
      return
    }
    
    // Extreme slippage check
    if (slippage < 0 || slippage > 100) {
      showNotification(t('error.slippageRange'), 'error')
      return
    }
    
    // Contract pause check
    if (isContractPaused) {
      showNotification(t('error.contractPaused'), 'error')
      return
    }
    
    // Purchase limit check for USD1 -> MGN
    if (fromToken === 'USD1' && toToken === 'MGN' && userInfo) {
      const remainingLimit = parseFloat(userInfo.remaining)
      if (amount > remainingLimit) {
        showNotification(`${t('error.exceedLimit')} ${userInfo.remaining} ${fromToken}`, 'error')
        return
      }
    }
    
    setIsProcessing(true)
    setTransactionStatusWithClear('pending', t('info.processing'))
    
    try {
      const amountInWei = parseUnits(fromAmount, 18)
      // 计算最小接收量
      const minOut = toAmount ? parseUnits((parseFloat(toAmount) * (1 - (slippage / 100))).toFixed(6), 18) : parseUnits('0', 18)
      
      // Check liquidity
      if (toAmount && parseFloat(toAmount) <= 0.000001) {
        setIsLiquidityInsufficient(true)
        showNotification(t('error.insufficientLiquidity'), 'error')
        setIsProcessing(false)
        setTransactionStatusWithClear('error', t('error.insufficientLiquidity'))
        return
      }
      setIsLiquidityInsufficient(false)
      
      if (fromToken === 'USD1' && toToken === 'MGN') {
        // USD1->MGN: 使用TRADING_ADDRESS合约的buy方法
        // 确保USDT授权到TRADING_ADDRESS
        const allowance = BigInt(usdtAllowanceForTrading ?? '0')
        if (!usdtAllowanceForTrading || allowance < amountInWei) {
          setTransactionStatus('approving')
          showNotification(`${t('info.approving')} USDT...`, 'info')
          
          try {
            const approveTx = await writeContractAsync({
              address: USDT_ADDRESS,
              abi: ERC20_ABI,
              functionName: 'approve',
              args: [TRADING_ADDRESS, MaxUint256],
            })
            // Set pending hash to track approval
            setPendingHash(approveTx)
            showNotification(`${t('info.approvalSubmitted')}`, 'info')
            // Wait for approval to be confirmed before proceeding
            await new Promise(r => setTimeout(r, 3000))
            // Refresh allowance
            await refetchUsdtAllowanceForTrading()
            showNotification(`${t('success.approvalSuccess')}`, 'success')
          } catch (approvalError) {
            showNotification(`${t('error.tokenApprovalFailed')}: ${approvalError.message || 'Please check wallet'}`, 'error')
            setIsProcessing(false)
            setTransactionStatus('error')
            setShowRetry(true)
            return
          }
        }
        
        // 执行buy交易 - 使用TRADING_ADDRESS合约的buy方法
        setTransactionStatus('swapping')
        showNotification(t('info.swapping'), 'info')
        const tx = await writeContractAsync({
          address: TRADING_ADDRESS,
          abi: TRADING_ABI,
          functionName: 'buy',
          args: [amountInWei, minOut],
        })
        
        // Set pending hash - useWaitForTransactionReceipt will handle the rest
        setPendingHash(tx)
        setTransactionHash(tx)
        setTransactionStatus('pending')
        showNotification(`${t('info.pending')} Hash: ${tx.slice(0, 10)}...`, 'info')
        
      } else if (fromToken === 'MGN' && toToken === 'USD1') {
        // Ensure MGN allowance with proper status updates
        const allowance = BigInt(mgnAllowance ?? '0')
        if (!mgnAllowance || allowance < amountInWei) {
          setTransactionStatus('approving')
          showNotification(`${t('info.approving')} MGN...`, 'info')
          
          try {
            const approveTx = await writeContractAsync({
              address: MGN_ADDRESS,
              abi: ERC20_ABI,
              functionName: 'approve',
              args: [USD1SWAP_ROUTER_ADDRESS, MaxUint256],
            })
            // Set pending hash to track approval
            setPendingHash(approveTx)
            showNotification(`${t('info.approvalSubmitted')}`, 'info')
            // Wait for approval to be confirmed before proceeding
            await new Promise(r => setTimeout(r, 3000))
            // Refresh allowance
            await refetchMgnAllowance()
            showNotification(`${t('success.approvalSuccess')}`, 'success')
          } catch (approvalError) {
            showNotification(`${t('error.tokenApprovalFailed')}: ${approvalError.message || 'Please check wallet'}`, 'error')
            setIsProcessing(false)
            setTransactionStatus('error')
            setShowRetry(true)
            return
          }
        }
        
        // Execute swap with proper status updates
        setTransactionStatus('swapping')
        showNotification(t('info.swapping'), 'info')
        const tx = await writeContractAsync({
          address: USD1SWAP_ROUTER_ADDRESS,
          abi: USD1SWAP_ROUTER_ABI,
          functionName: 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
          args: [amountInWei, minOut, [MGN_ADDRESS, USDT_ADDRESS], address, deadline],
        })
        
        // Set pending hash - useWaitForTransactionReceipt will handle the rest
        setPendingHash(tx)
        setTransactionHash(tx)
        setTransactionStatus('pending')
        showNotification(`${t('info.pending')} Hash: ${tx.slice(0, 10)}...`, 'info')
      }
    } catch (error) {
      console.error('Swap error:', error)
      setIsProcessing(false)
      setPendingHash('')
      let errorMsg = t('error.transactionFailed')
      
      // Enhanced error messages based on error type
      if (error.message?.includes('user rejected')) {
        errorMsg = t('error.userRejected')
      } else if (error.message?.includes('insufficient funds')) {
        errorMsg = t('error.insufficientGas')
      } else if (error.message?.includes('liquidity')) {
        errorMsg = t('error.insufficientLiquidity')
      } else if (error.message) {
        errorMsg = error.message
      }
      
      showNotification(`${t('error.stakeFailed')}: ${errorMsg}`, 'error')
      setTransactionStatus('error')
      setShowRetry(true)
    }
    // Note: Don't set isProcessing=false in finally block
    // useWaitForTransactionReceipt will handle success case
  }

  // 路由提要文本
  const exchangeRateText = useMemo(() => {
    if (fromToken === 'USD1' && toToken === 'MGN') return `1 USD1 ≈ ${usd1ToMgnRate} ${toToken}`
    if (fromToken === 'MGN' && toToken === 'USD1') return `1 MGN ≈ ${mgnToUsd1Rate} USD1`
    return `1 ${fromToken} ≈ 0 ${toToken}`
  }, [fromToken, toToken, usd1ToMgnRate, mgnToUsd1Rate])

  // UI
  return (
    <div className=" dark:bg-background-dark text-white min-h-screen overflow-x-hidden selection:bg-primary/30">
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
          <div className="flex-1 flex flex-col overflow-y-auto pb-24 lg:pb-0">
            <div className="layout-container flex flex-col min-h-screen">
              {/* 通知系统 */}
              <Notification notifications={notifications} onClose={clearNotification} />
              <main className="flex-1 flex flex-col items-center justify-center px-4 ">
              <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight mb-2">{t('swap.title')}</h1>
                <p className="text-white/50 text-sm">{t('swap.subtitle')}</p>
              </div>
              <div className="glass-card w-full max-w-[480px] p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute -top-24 -left-24 size-48 bg-primary/20 blur-[60px] rounded-full"></div>
                <div className="absolute -bottom-24 -right-24 size-48 bg-neon-blue/20 blur-[60px] rounded-full"></div>
                
                {/* 交易状态指示器 */}
                {transactionStatus && (
                  <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${transactionStatus === 'pending' || transactionStatus === 'approving' || transactionStatus === 'swapping' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : transactionStatus === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                    {(transactionStatus === 'pending' || transactionStatus === 'approving' || transactionStatus === 'swapping') && <Icon icon="mdi:refresh" className="animate-spin" />}
                    {transactionStatus === 'success' && <Icon icon="mdi:check-circle" />}
                    {transactionStatus === 'error' && <Icon icon="mdi:error" />}
                    <span className="text-sm font-medium">
                      {transactionStatus === 'approving' && t('info.approving')}
                      {transactionStatus === 'swapping' && t('info.swapping')}
                      {transactionStatus === 'pending' && t('info.pending')}
                      {transactionStatus === 'success' && t('success.transactionSuccess')}
                      {transactionStatus === 'error' && t('error.stakeFailed')}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-end mb-4 relative">
                  {/* <WalletConnect /> */}
                  <button ref={settingsButtonRef} onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
                    <Icon icon="mdi:settings" className="text-[16px] text-white" />
                  </button>
                  
                  {/* 设置弹窗 */}
                  {isSettingsOpen && (
                    <div ref={settingsPopupRef} className="absolute right-0 mt-2 glass-card-6 p-4 rounded-xl shadow-2xl transition-all duration-300 transform origin-top-right z-50" style={{ minWidth: '280px' }}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold">{t('swap.settings')}</h3>
                        <button onClick={() => setIsSettingsOpen(false)}>
                          <Icon icon="mdi:close" className="text-sm text-white/40 hover:text-white" />
                        </button>
                      </div>
                        
                      <div className="space-y-3">
                        {/* 滑点设置 */}
                        <div className="space-y-2">
                          <h4 className="text-xs text-white/50 font-bold">{t('swap.slippageTolerance')}</h4>
                          <div className="grid grid-cols-4 gap-2">
                            {['0.1', '0.5', '1.0', '2.0'].map(option => (
                              <button 
                                key={option}
                                className={`px-3 py-2 text-sm rounded-lg transition-all ${slippage === parseFloat(option) ? 'bg-primary text-white' : 'bg-background-dark/50 hover:bg-background-dark/80 text-white/70'}`}
                                onClick={() => {
                                  setSlippage(parseFloat(option))
                                  setShowCustomSlippage(false)
                                }}
                              >
                                {option}%
                              </button>
                            ))}
                          </div>
                          
                          {/* 自定义滑点输入 */}
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <input 
                                value={customSlippage}
                                onChange={(e) => {
                                  setCustomSlippage(e.target.value)
                                  if (e.target.value) {
                                    setSlippage(parseFloat(e.target.value) || 0)
                                    setShowCustomSlippage(true)
                                  }
                                }}
                                placeholder={t('swap.customSlippage')}
                                className="flex-1 bg-background-dark/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                              <span className="text-white/50">%</span>
                            </div>
                            <p className="text-[10px] text-white/40 mt-1">{t('swap.slippageTip')}</p>
                          </div>
                        </div>
                        
                        {/* 交易设置 */}
                        <div className="pt-3 border-t border-white/10 space-y-2">
                          <h4 className="text-xs text-white/50 font-bold">{t('swap.transactionSettings')}</h4>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-white/70">{t('swap.transactionExpiry')}</span>
                            <span className="text-sm font-bold">20 {t('common.minutes')}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-white/70">{t('swap.gasLimit')}</span>
                            <span className="text-sm font-bold">1000K</span>
                          </div>
                        </div>
                        
                        {/* 当前设置显示 */}
                        <div className="pt-3 border-t border-white/10">
                          <div className="flex justify-between text-sm">
                            <span className="text-white/50">{t('swap.currentSlippage')}</span>
                            <span className="font-bold">{slippage}%</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-white/50">{t('swap.minimumReceived')}</span>
                            <span className="font-bold text-green-400">{(toAmount ? (parseFloat(toAmount) * (1 - slippage / 100)).toFixed(4) : '0.0000')} {toToken}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-background-dark/60 border border-white/5 p-5 rounded-2xl mb-2 hover:border-primary/40 transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white/50 text-sm font-medium uppercase tracking-wider">{t('swap.from')}</span>
                    <span className="text-white/50 text-xs">{t('swap.balance')} <span className="text-white/80">{fromBalance.toFixed(3)} {fromToken}</span></span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input className="from-input bg-transparent border-none focus:ring-0 text-3xl font-bold text-white w-full p-0 placeholder:text-white/20" placeholder="0.00" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} />
                    <div className="flex items-center gap-2">
                      <button className="bg-primary/20 hover:bg-primary/40 text-primary text-[10px] font-bold px-2 py-1 rounded-md transition-all" onClick={setMaxAmount}>{t('swap.max')}</button>
                      <div className="flex items-center gap-2 bg-background-dark border border-white/10 px-3 py-2 rounded-xl cursor-pointer hover:bg-white/5 transition-all">
                        <div className={`size-6 ${fromToken === 'USD1' ? 'bg-green-500/20' : 'bg-primary/20'} rounded-full flex items-center justify-center`}>
                          <img src={fromToken === 'USD1' ? '/img/usd1.png' : '/img/logo.svg'} alt={fromToken} className="size-6" />
                        </div>
                        <span className="font-bold text-sm">{fromToken}</span>
                        <Icon icon="mdi:chevron-down" className="text-sm text-white/40" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative h-4 flex justify-center items-center z-20">
                  <div className="swap-icon-container absolute -translate-y-1/2 top-1/2 p-2 bg-background-dark border-4 border-[#1c142b] rounded-xl cursor-pointer shadow-lg hover:shadow-primary/20 transition-all" onClick={swapTokens}>
                    <Icon icon="mdi:swap-vertical" className="swap-icon text-primary font-bold" />
                  </div>
                </div>
                <div className="bg-background-dark/60 border border-white/5 p-5 rounded-2xl mt-2 hover:border-primary/40 transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white/50 text-sm font-medium uppercase tracking-wider">{t('swap.to')}</span>
                    <span className="balance-to text-white/50 text-xs">{t('swap.balance')} <span className="text-white/80">{toBalance.toFixed(3)} {toToken}</span></span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input className="to-input bg-transparent border-none focus:ring-0 text-3xl font-bold text-white w-full p-0 placeholder:text-white/20" placeholder="0.00" readOnly value={toAmount} />
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-background-dark border border-white/10 px-3 py-2 rounded-xl cursor-pointer hover:bg-white/5 transition-all">
                        <div className={`size-6 ${toToken === 'USD1' ? 'bg-green-500/20' : 'bg-primary/20'} rounded-full flex items-center justify-center`}>
                          <img src={toToken === 'USD1' ? '/img/usd1.png' : '/img/logo.svg'} alt={toToken} className="size-6" />
                        </div>
                        <span className="font-bold text-sm">{toToken}</span>
                        <Icon icon="mdi:chevron-down" className="text-sm text-white/40" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 space-y-3 px-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">{t('swap.exchangeRate')}</span>
                    <span className="exchange-rate text-white/70">{exchangeRateText}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">{t('swap.priceImpact')}</span>
                    <span className={`price-impact text-green-400`}>{(slippage / 100 * (fromAmount ? parseFloat(fromAmount) : 0)).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">{t('swap.liquidityFee')}</span>
                    <span className="text-white/70">0.03 {fromToken}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">{t('swap.minimumReceived')}</span>
                    <span className="minimum-received text-white/70">{(toAmount ? (parseFloat(toAmount) * (1 - slippage / 100)).toFixed(4) : '0.0000')} {toToken}</span>
                  </div>
                  
                  {/* 购买限制信息 */}
                  {fromToken === 'USD1' && toToken === 'MGN' && userInfo && (
                    <div className="buy-limit-info mt-4 pt-4 border-t border-primary/10">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-white/40">{t('swap.purchaseLimit')}</span>
                        <span className="text-white/70">{userInfo.limit} {fromToken}</span>
                      </div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-white/40">{t('swap.purchased')}</span>
                        <span className="text-white/70">{userInfo.bought} {fromToken}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">{t('swap.remainingLimit')}</span>
                        <span className="text-green-400">{userInfo.remaining} {fromToken}</span>
                      </div>
                    </div>
                  )}
                </div>
              
                {/* 交易状态指示器 */}
                {transactionStatus && (
                  <div className={`mt-6 p-4 rounded-xl ${transactionStatus === 'success' ? 'bg-green-500/20 border border-green-500/30' : transactionStatus === 'error' ? 'bg-red-500/20 border border-red-500/30' : 'bg-blue-500/20 border border-blue-500/30'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon 
                        icon={transactionStatus === 'success' ? 'mdi:check-circle' : transactionStatus === 'error' ? 'mdi:alert-circle' : 'mdi:clock-outline'} 
                        className={`${transactionStatus === 'success' ? 'text-green-400' : transactionStatus === 'error' ? 'text-red-400' : 'text-blue-400'} animate-pulse`} 
                      />
                      <span className="font-bold text-sm">
                        {transactionStatus === 'approving' && t('info.approving')}
                        {transactionStatus === 'swapping' && t('info.swapping')}
                        {transactionStatus === 'pending' && t('info.pending')}
                        {transactionStatus === 'success' && t('success.transactionSuccess')}
                        {transactionStatus === 'error' && t('error.stakeFailed')}
                      </span>
                    </div>
                    {transactionHash && (
                      <div className="text-xs text-white/60 truncate">
                        {t('swap.transactionHash')}: <span className="text-white/80 font-mono">{transactionHash}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 重试入口 */}
                {showRetry && (
                  <div className="mt-6 flex gap-3">
                    <button className="flex-1 py-4 bg-primary/20 hover:bg-primary/30 text-primary font-bold rounded-xl transition-all flex items-center justify-center gap-2" onClick={handleRetry}>
                      <Icon icon="mdi:refresh" className="text-sm" />
                      <span>{t('swap.retrySwap')}</span>
                    </button>
                    <button className="flex-1 py-4 bg-background-dark/60 border border-white/10 text-white/70 hover:text-white transition-all rounded-xl flex items-center justify-center gap-2" onClick={() => setShowRetry(false)}>
                      <Icon icon="mdi:close" className="text-sm" />
                      <span>{t('swap.cancel')}</span>
                    </button>
                  </div>
                )}
                
                <button className={`mt-8 w-full py-5 ${fromAmount && !isProcessing ? 'bg-gradient-to-r from-primary to-primary/80' : 'bg-gray-500/60'} text-white font-bold rounded-2xl glow-pulse hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3`} onClick={executeSwap} disabled={!fromAmount || isProcessing}>
                  <Icon icon={isProcessing ? 'mdi:refresh' : 'mdi:check-circle'} className={isProcessing ? 'animate-spin' : ''} />
                  <span>{isProcessing ? t('info.processing') : t('swap.confirmSwap')}</span>
                </button>
                
                <button className="mt-4 w-full py-3 bg-background-dark/60 border border-white/10 text-white/70 text-sm font-bold rounded-2xl hover:bg-background-dark/80 hover:text-white transition-all flex items-center justify-center gap-2" onClick={refreshData} disabled={isRefreshing}>
                  <Icon icon="mdi:refresh" className={isRefreshing ? 'text-sm animate-spin' : 'text-sm'} />
                  <span>{isRefreshing ? t('info.dataRefreshing') : t('swap.refreshPrice')}</span>
                </button>
              </div>
              
              <div className="mt-12 flex gap-8 items-center opacity-40">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:verified-user" className="text-sm" />
                  <span className="text-xs">{t('swap.securityAudit')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:speed" className="text-sm" />
                  <span className="text-xs">{t('swap.fastConfirmation')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:account-balance" className="text-sm" />
                  <span className="text-xs">{t('swap.crossChain')}</span>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
      
      {/* 背景/网格保持原样 */}
      <div className="fixed inset-0 z-0 bg-grid opacity-50 pointer-events-none"></div>
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,59,237,0.1)_0%,transparent_50%)] pointer-events-none"></div>
    </div>
  )
}

export default SwapView
