import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useAccount } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { createPublicClient, http, getContract } from 'viem';
import { 
  fetchUserInfo, 
  fetchStakeRecords, 
  fetchUnstakeRecords, 
  fetchCommunityReward, 
  fetchTodayStake,
  fetchRewardSummary,
  formatWei,
  formatAddress,
  transformDay,
  formatTimestamp,
} from '../api/index.js'
import RewardTrackerABI from '../abis/RewardTracker.json'

function MineView() {
  const { address, isConnected } = useAccount()
  const { t } = useTranslation()
  
  // Contract addresses
  const CONTRACTS = {
    REWARD_TRACKER: import.meta.env.VITE_REWARD_TRACKER_ADDRESS || '0xF6ACbC9FE9757e93c85beF796ee52254B6073576',
  }
  
  // RPC URL
  const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://rpc.movachain.com/'
    // const {  isConnected } = useAccount();
  // const address = '0xc4bbfad25740517144361a4215054ecd8b70c148'
  // const address = '0xa2122d69e25821079d6af4a7130cb09f0ff8fd1e'
  
  // User info state
  const [userInfo, setUserInfo] = useState(null)
  const [userLoading, setUserLoading] = useState(false)
  
  // Stake records
  const [stakeRecords, setStakeRecords] = useState([])
  const [unstakeRecords, setUnstakeRecords] = useState([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  
  // Today's stake
  const [todayStake, setTodayStake] = useState({ personal: '0', team: '0' })
  
  // Security settings
  const [is2FAEnabled, setIs2FAEnabled] = useState(true)
  
  // Community reward
  const [communityReward, setCommunityReward] = useState(null)
  const [rewardLoading, setRewardLoading] = useState(false)
  
  // Reward summary
  const [rewardSummary, setRewardSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  // Chain reward summary
  const [chainRewardSummary, setChainRewardSummary] = useState(null)
  const [chainSummaryLoading, setChainSummaryLoading] = useState(false)

  // Fetch user info
  useEffect(() => {
    let mounted = true
    async function loadUserInfo() {
      if (!isConnected || !address) {
        setUserInfo(null)
        return
      }
      setUserLoading(true)
      try {
        const res = await fetchUserInfo(address)
        if (mounted && res && res.success) {
          setUserInfo(res)
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setUserLoading(false)
      }
    }
    loadUserInfo()
    return () => { mounted = false }
  }, [address, isConnected])

  // Fetch stake and unstake records
  useEffect(() => {
    let mounted = true
    async function loadRecords() {
      if (!isConnected || !address) {
        setStakeRecords([])
        setUnstakeRecords([])
        return
      }
      setRecordsLoading(true)
      try {
        const [stakesRes, unstakesRes] = await Promise.all([
          fetchStakeRecords(address),
          fetchUnstakeRecords(address)
        ])
        if (mounted) {
          if (stakesRes && stakesRes.success) {
            setStakeRecords(stakesRes.stakes || [])
          }
          if (unstakesRes && unstakesRes.success) {
            setUnstakeRecords(unstakesRes.unstakes || [])
          }
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setRecordsLoading(false)
      }
    }
    loadRecords()
    return () => { mounted = false }
  }, [address, isConnected])

  // Fetch today's stake
  useEffect(() => {
    let mounted = true
    async function loadTodayStake() {
      if (!isConnected || !address) {
        setTodayStake({ personal: '0', team: '0' })
        return
      }
      try {
        const res = await fetchTodayStake(address)
        if (mounted && res && res.success) {
          setTodayStake({
            personal: res.today_personal_stake || '0',
            team: res.today_team_stake || '0'
          })
        }
      } catch (e) {
        // ignore
      }
    }
    loadTodayStake()
    return () => { mounted = false }
  }, [address, isConnected])
  
  // Fetch community reward
  useEffect(() => {
    let mounted = true
    async function loadCommunityReward() {
      if (!isConnected || !address) {
        setCommunityReward(null)
        return
      }
      setRewardLoading(true)
      try {
        const res = await fetchCommunityReward(address)
        if (mounted && res && res.success) {
          setCommunityReward(res)
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setRewardLoading(false)
      }
    }
    loadCommunityReward()
    return () => { mounted = false }
  }, [address, isConnected])
  


  // Fetch reward summary from API
  useEffect(() => {
    let mounted = true
    async function loadRewardSummary() {
      if (!isConnected || !address) {
        setRewardSummary(null)
        return
      }
      setSummaryLoading(true)
      try {
        const res = await fetchRewardSummary(address)
        if (mounted && res && res.success) {
          console.log('获取我的收益 (API)', res);
          setRewardSummary(res)
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setSummaryLoading(false)
      }
    }
    loadRewardSummary()
    return () => { mounted = false }
  }, [address, isConnected])

  // Fetch reward summary from blockchain
  const fetchChainRewardSummary = async () => {
    if (!isConnected || !address) {
      console.log('钱包未连接');
      return
    }
    
    setChainSummaryLoading(true)
    try {
      
      // Create public client
      const publicClient = createPublicClient({
        transport: http(RPC_URL)
      });
      
      // Test RPC connection
      try {
        const blockNumber = await publicClient.getBlockNumber();
        console.log('RPC连接成功，当前区块高度:', blockNumber);
      } catch (rpcError) {
        console.error('RPC连接失败:', rpcError);
        throw new Error('RPC连接失败，请检查网络设置');
      }
      
      // Get RewardTracker contract instance
      const rewardTrackerContract = getContract({
        address: CONTRACTS.REWARD_TRACKER,
        abi: RewardTrackerABI,
        client: publicClient
      });
      console.log('RewardTracker合约实例创建成功');
      console.log('合约实例方法:', Object.keys(rewardTrackerContract));
      
      // Try to call getAllRewardsSummary method
      try {
        // 使用read方法调用view函数
        const summary = await publicClient.readContract({
          address: CONTRACTS.REWARD_TRACKER,
          abi: RewardTrackerABI,
          functionName: 'getAllRewardsSummary',
          args: [address]
        });
        console.log('链上收益汇总原始数据:', summary);
        
        // 转换为前端可用格式
        const formattedSummary = {
          stakeRewards: summary[0].toString(),
          directRewards: summary[1].toString(),
          levelRewards: summary[2].toString(),
          totalUSDT: summary[0] + summary[1] + summary[2]
        };
        
        console.log('格式化后的链上收益汇总:', {
          stakeRewards: formatWei(formattedSummary.stakeRewards, 2),
          directRewards: formatWei(formattedSummary.directRewards, 2),
          levelRewards: formatWei(formattedSummary.levelRewards, 2),
          totalUSDT: formatWei(formattedSummary.totalUSDT.toString(), 2)
        });
        
        setChainRewardSummary(formattedSummary);
      } catch (callError) {
        console.error('调用getAllRewardsSummary方法失败:', callError);
        
        // 尝试使用单个方法获取奖励数据
        console.log('尝试使用单个方法获取奖励数据...');
        
        try {
          const [stakeRewards, directRewards, levelRewards] = await Promise.all([
            publicClient.readContract({
              address: CONTRACTS.REWARD_TRACKER,
              abi: RewardTrackerABI,
              functionName: 'getTotalStakeRewards',
              args: [address]
            }),
            publicClient.readContract({
              address: CONTRACTS.REWARD_TRACKER,
              abi: RewardTrackerABI,
              functionName: 'getTotalDirectRewards',
              args: [address]
            }),
            publicClient.readContract({
              address: CONTRACTS.REWARD_TRACKER,
              abi: RewardTrackerABI,
              functionName: 'getTotalLevelRewards',
              args: [address]
            })
          ]);
          
          console.log('单个方法获取奖励数据成功:');
          console.log('质押奖励:', stakeRewards.toString());
          console.log('直推奖励:', directRewards.toString());
          console.log('团队奖励:', levelRewards.toString());
          
          const formattedSummary = {
            stakeRewards: stakeRewards.toString(),
            directRewards: directRewards.toString(),
            levelRewards: levelRewards.toString(),
            totalUSDT: stakeRewards + directRewards + levelRewards
          };
          
          
          setChainRewardSummary(formattedSummary);
        } catch (singleCallError) {
          console.error('使用单个方法获取奖励数据失败:', singleCallError);
          throw new Error('无法从链上获取收益数据，请检查合约地址和网络连接');
        }
      }
    } catch (error) {
      console.error('从链上获取收益汇总失败:', error);
    } finally {
      setChainSummaryLoading(false);
    }
  }

  // Load chain reward summary when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchChainRewardSummary()
    }
  }, [isConnected, address])

  // Calculate total staked from records
  const totalStaked = stakeRecords.reduce((sum, stake) => {
    if (!stake.status) { // Only count active stakes
      return sum + BigInt(stake.amount || '0')
    }
    return sum
  }, BigInt(0))
  
  // Get direct referral reward from summary
  const getDirectReferralReward = () => {
    // 优先使用链上数据
    if (chainRewardSummary?.directRewards) {
      return chainRewardSummary.directRewards
    }
    //  fallback到API数据
    if (!rewardSummary || !Array.isArray(rewardSummary.data)) {
      return '0'
    }
    const directReward = rewardSummary.data.find(reward => reward.reward_type === 'direct_referral')
    return directReward?.total_amount || '0'
  }

  // Get stake reward from summary
  const getStakeReward = () => {
    return chainRewardSummary?.stakeRewards || '0'
  }

  // Get team reward from summary
  const getTeamReward = () => {
    return chainRewardSummary?.levelRewards || '0'
  }

  // Get all reward from summary
  const getAllReward = () => {
    const stakeReward = getStakeReward()
    const teamReward = getTeamReward()
    const directReward = getDirectReferralReward()
    const total = BigInt(stakeReward) + BigInt(teamReward) + BigInt(directReward)
    return total.toString()
  }
  return (
    <div className=" dark:bg-background-dark text-white min-h-screen">
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
        <div className="flex-1 flex flex-col overflow-y-auto pb-24 lg:pb-0">
          <div className="layout-container flex flex-col min-h-screen">
            <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 py-20 space-y-8">
              {/* Profile Header */}
              <section className="glass-panel rounded-xl p-6 flex flex-col gap-2 neon-border-purple border-l-4 border-l-white/20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="relative">

                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">
                          {isConnected ? formatAddress(address) : t('mine.notConnected')}
                        </h1>
                        {isConnected && (
                          <button 
                            className="text-white/40 hover:text-primary transition-colors"
                            onClick={() => navigator.clipboard.writeText(address)}
                          >
                            <Icon icon="mdi:content-copy" className="text-lg" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center  mt-1">
                        <p className='text-primary font-medium'>
                          {userInfo?.is_valid_user ? t('mine.validUser') : t('mine.staker')}
                        </p>
                        <div className="ml-2 bg-primary px-3 py-1 rounded-full text-[10px] font-bold border-2 border-background-dark uppercase">
                          {userLoading ? '...' : 'S'+userInfo?.team_level || 'S0'}
                        </div>
                      </div>

                    </div>
                  </div>
                  <div className="text-right flex flex-col items-center md:items-end">
                    <p className="text-white/60 text-sm uppercase tracking-widest font-semibold mb-1">{t('mine.totalPerformance')}</p>
                    <p className="text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">
                      ${formatWei(userInfo?.personal_performance || '0', 2)} <span className="text-xl text-primary align-middle ml-2 font-medium">USD1</span>
                    </p>
                    <p className="text-white/40 text-sm mt-2">
                      {t('team.team')}: ${formatWei(userInfo?.team_performance || '0', 2)} USD1
                    </p>
                  </div>
                </div>
              </section>
              
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">

                <div className="glass-panel rounded-xl py-2 px-6 lg:p-6 flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-accent-blue">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('common.stakeReward')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-bold leading-tight text-accent-blue">
                      {summaryLoading ? '...' : '$'+formatWei(getStakeReward(), 2)}
                    </p>
                    <p className="text-[#0bda6f] text-sm font-medium flex items-center">
                      <Icon icon="mdi:check-circle" className="text-sm mr-1" />
                      USD1
                    </p>
                  </div>
                </div>

                <div className="glass-panel rounded-xl py-2 px-6 lg:p-6 flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-primary">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('common.teamReward')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-bold leading-tight truncate">
                      {summaryLoading ? '...' : '$'+formatWei(getTeamReward(), 2)}
                    </p>
                    <p className="text-[#0bda6f] text-sm font-medium flex items-center">
                      USD1
                    </p>
                  </div>
                </div>

                <div className="glass-panel rounded-xl py-2 px-6 lg:p-6  flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-blue-500">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('common.inviteReward')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-bold leading-tight text-blue-400">
                      {summaryLoading ? '...' : '$'+formatWei(getDirectReferralReward(), 2)}
                    </p>
                    <p className="text-blue-400 text-sm font-medium flex items-center">
                      USD1
                    </p>
                  </div>
                </div>

                <div className="glass-panel rounded-xl py-2 px-6 lg:p-6  flex flex-col gap-1 lg:gap-2 neon-border-purple border-l-4 border-l-purple-500">
                  <p className="text-[#a692c9] text-xs font-semibold uppercase tracking-wider">
                    {t('common.allReward')}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-bold leading-tight text-purple-400">
                      {summaryLoading ? '...' : '$'+formatWei(getAllReward(), 2)}
                    </p>
                    <p className="text-purple-400 text-sm font-medium flex items-center">
                      USD1
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Asset Balances */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Icon icon="mdi:account-balance-wallet" className="text-primary" />
                      {t('mine.assetBalances')}
                    </h2>
                    <button className="text-xs text-primary font-bold hover:underline">{t('mine.manageAll')}</button>
                  </div>
                  {/* Community Reward */}
                  <div className="glass-panel p-6 rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold flex items-center gap-2">
                        <Icon icon="mdi:community" className="text-primary" />
                        {t('mine.levelReward')}
                      </h3>
                    </div>
                    {rewardLoading ? (
                      <div className="text-center text-white/40 py-8">{t('mine.loading')}</div>
                    ) : communityReward ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div>
                            <p className="text-white/60 text-sm"></p>
                            <p className="text-lg font-bold mt-1">
                              {communityReward.is_eligible && (
                                <span className="text-green-400">{t('mine.eligible')}</span>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-white/60 text-sm">{t('mine.pendingReward')}</p>
                            <p className="text-3xl font-bold mt-1">${formatWei(communityReward.pending_reward, 2)} MGN</p>
                          </div>
                        </div>
                        <button className={`w-full py-2 border border-primary/50 bg-border-dark/50 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                          communityReward.is_eligible
                            ? 'bg-primary hover:bg-primary/80 text-white'
                            : 'bg-border-dark/50 cursor-not-allowed text-white/30'
                        }`}>
                          {t('mine.claimReward')}
                          <Icon icon={communityReward.is_eligible ? 'mdi:arrow-right' : 'mdi:lock'} />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-white/40 py-8">{t('mine.noCommunityRewardData')}</div>
                    )}
                  </div>
                  
                  {/* M-NODE Card */}
                  {/* <div className="glass-panel p-6 rounded-xl space-y-4 group hover:border-primary/50 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                          <Icon icon="mdi:hub" />
                        </div>
                        <div>
                          <p className="font-bold">{t('mine.nodeReward')}</p>
                          <p className="text-xs text-white/40">{t('mine.nodeParticipation')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">0.00</p>
                        <p className="text-[10px] text-white/40">{t('stake.locked')}</p>
                      </div>
                    </div>
                    <button className="w-full border border-primary/50 bg-border-dark/50 cursor-not-allowed py-2 rounded-lg text-sm font-bold text-white/30 flex items-center justify-center gap-2">
                      {t('mine.unstakeRequired')} <Icon icon="mdi:lock" className="text-sm" />
                    </button>
                  </div> */}
                </div>
                {/* Center Column: Personal Staking Stats */}
                <div className="lg:col-span-6 space-y-6">
                  {/* Unstake Records */}
                  <div className="glass-panel p-6 rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold">{t('mine.unstakeRecords')}</h3>
                      <span className="text-white/40 text-sm">{unstakeRecords.length} {t('mine.records')}</span>
                    </div>
                    {recordsLoading ? (
                      <div className="text-center text-white/40 py-8">{t('mine.loading')}</div>
                    ) : unstakeRecords.length === 0 ? (
                      <div className="text-center text-white/40 py-8">{t('mine.noUnstakeRecords')}</div>
                    ) : (
                      <div className="space-y-3">
                        {unstakeRecords.slice(0, 5).map((unstake, index) => (
                          <div key={unstake.id || index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <div>
                              <p className="font-medium">{t('stake.reward')}: ${formatWei(unstake.reward, 4)} USD1</p>
                              <div className="flex items-center gap-4 mt-1">
                                <p className="text-xs text-white/40">{formatTimestamp(unstake.unstake_time)}</p>
                                <p className="text-xs text-white/40">{transformDay(unstake.stake_index)}</p>
                              </div>
                            </div>
                            <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400">
                              {t('mine.completed')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  

                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
      
      {/* Animated Grid Background */}
      <div className="fixed inset-0 z-0 bg-grid opacity-50 pointer-events-none"></div>
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,59,237,0.1)_0%,transparent_50%)] pointer-events-none"></div>
    </div>
  );
}

export default MineView;