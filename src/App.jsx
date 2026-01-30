import React, { createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import {  useAccount, WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import CookieConsent from './components/CookieConsent.jsx'
import HomeView from './views/HomeView.jsx'
import StakeView from './views/StakeView.jsx'
import SwapView from './views/SwapView.jsx'
import TeamView from './views/TeamView.jsx'
import MineView from './views/MineView.jsx'
import './i18n/index.js'
import { useEffect, useState } from 'react'
import { createPublicClient, getContract } from 'viem'
import ReferrerDialog from './components/ReferrerDialog.jsx'
import TEAMLEVEL_ABI from './abis/TeamLevel.json'
import Notification from './components/Notification.jsx'

// Create React Query client
const queryClient = new QueryClient()

// Create Notification Context
export const NotificationContext = createContext()

// Custom hook for using notification context
export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

// Mova网络配置 (来自Vue项目App.vue)
const movaChain = {
  id: parseInt(import.meta.env.VITE_MOVA_CHAIN_ID) || 61900,
  name: import.meta.env.VITE_NETWORK_NAME || 'Mova Mainnet',
  network: 'movachain',
  nativeCurrency: {
    name: import.meta.env.VITE_NATIVE_CURRENCY_NAME || 'MOV',
    symbol: import.meta.env.VITE_NATIVE_CURRENCY_SYMBOL || 'MOV',
    decimals: 18
  },
  rpcUrls: {
    public: { http: [import.meta.env.VITE_RPC_URL || 'https://rpc.movachain.com/'] },
    default: { http: [import.meta.env.VITE_RPC_URL || 'https://rpc.movachain.com/'] }
  },
  blockExplorers: {
    default: { name: 'Mova Explorer', url: import.meta.env.VITE_BLOCK_EXPLORER || 'https://explorer.movachain.com/' }
  }
}

// Create Wagmi config with Mova network
const config = createConfig({
  chains: [movaChain],
  connectors: [
    injected(),
  ],
  transports: {
    [movaChain.id]: http(import.meta.env.VITE_RPC_URL || 'https://rpc.movachain.com/'),
  },
})

// Referral binding checker component
function ReferralBindingChecker({ onBindingStatus }) {
  const { address, isConnected } = useAccount()
  const teamLevelAddress = import.meta.env.VITE_TEAM_LEVEL_ADDRESS || '0x1a5a3A1F23f6314Ffac0705fC19B9c6c9319Ae82'
  const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://rpc.movachain.com/'
  
  useEffect(() => {
    let mounted = true
    
    async function checkBindingStatus() {
      if (!isConnected || !address) {
        if (mounted) onBindingStatus(null)
        return
      }
      
      try {
        console.log('Checking referral binding for address:', address)
        console.log('Team Level Address:', teamLevelAddress)
        console.log('RPC URL:', RPC_URL)
        
        // Create public client
        const publicClient = createPublicClient({
          transport: http(RPC_URL)
        })
        
        // Test RPC connection
        try {
          const blockNumber = await publicClient.getBlockNumber()
          console.log('RPC connection successful, current block height:', blockNumber)
        } catch (rpcError) {
          console.error('RPC connection failed:', rpcError)
          if (mounted) onBindingStatus(false)
          return
        }
        
        // Check if contract address is valid
        if (teamLevelAddress === '0x1') {
          console.warn('Using fallback team level address, contract calls will fail')
          if (mounted) onBindingStatus(false)
          return
        }
        
        // Check if contract exists
        try {
          const code = await publicClient.getCode({ address: teamLevelAddress })
          if (code === '0x') {
            console.error('Contract not deployed at address:', teamLevelAddress)
            if (mounted) onBindingStatus(false)
            return
          }
          console.log('Contract exists at address:', teamLevelAddress)
        } catch (codeError) {
          console.error('Error checking contract code:', codeError)
          if (mounted) onBindingStatus(false)
          return
        }
        
        // Call isBindReferral method
        try {
          const bound = await publicClient.readContract({
            address: teamLevelAddress,
            abi: TEAMLEVEL_ABI,
            functionName: 'isBindReferral',
            args: [address]
          })
          
          console.log('Referral binding status:', bound)
          if (mounted) onBindingStatus(bound)
        } catch (callError) {
          console.error('Error calling isBindReferral method:', callError)
          // If there's an error, assume user is not bound
          if (mounted) onBindingStatus(false)
        }
      } catch (error) {
        console.error('Error checking referral binding:', error)
        // If there's an error, assume user is not bound
        if (mounted) onBindingStatus(false)
      }
    }
    
    // Only check if user is connected and has an address
    checkBindingStatus()
    return () => { mounted = false }
  }, [address, isConnected, teamLevelAddress, RPC_URL, onBindingStatus])
  
  return null
}

function AppContent() {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const { address, isConnected } = useAccount()
  const [globalReferrerVisible, setGlobalReferrerVisible] = useState(false)
  const [hasClosedReferrerDialog, setHasClosedReferrerDialog] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationId, setNotificationId] = useState(1)
  
  const toggleMenu = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }
  
  // Handle referral binding status
  const handleBindingStatus = (bound) => {
    console.log('Handling binding status:', bound)
    if (bound === false) {
      console.log('User not bound, showing referrer dialog')
      setGlobalReferrerVisible(true)
    } else if (bound === true) {
      console.log('User already bound, hiding referrer dialog')
      setGlobalReferrerVisible(false)
    }
  }

  // Handle referrer dialog close
  const handleReferrerDialogClose = () => {
    console.log('Referrer dialog closed, setting hasClosedReferrerDialog to true')
    setGlobalReferrerVisible(false)
    setHasClosedReferrerDialog(true)
  }

  // Add notification
  const addNotification = (type, message) => {
    const id = notificationId
    setNotificationId(id + 1)
    setNotifications(prev => [...prev, { id, type, message }])
  }

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(note => note.id !== id))
  }

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      <div className="bg-background-light dark:bg-background-dark text-white min-h-screen">
        {/* 在除了首页之外的页面显示 Header */}
        {location.pathname !== '/' && <Header toggleMenu={toggleMenu} />}
        
        {/* Referral Binding Checker */}
        <ReferralBindingChecker onBindingStatus={handleBindingStatus} />
        
        <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
          {/* Sidebar Navigation */}
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          
          {/* Main Content Area */}
          <main className={`flex-1 flex flex-col overflow-y-auto ${location.pathname !== '/' ? 'pt-20 h-[calc(100vh-5rem)]' : ''}`}>
            <Routes>
              <Route path="/" element={<HomeView />} />
              <Route path="/stake" element={<StakeView />} />
              <Route path="/swap" element={<SwapView />} />
              <Route path="/team" element={<TeamView />} />
              <Route path="/mine" element={<MineView />} />
            </Routes>
          </main>
          {globalReferrerVisible && <ReferrerDialog visible={true} onClose={handleReferrerDialogClose} />}
        </div>
        
        {/* Global Cookie Consent Banner */}
        <CookieConsent />
        
        {/* Global Notification Component */}
        <Notification notifications={notifications} onClose={removeNotification} />
      </div>
    </NotificationContext.Provider>
  )
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
