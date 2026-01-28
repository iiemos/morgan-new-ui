# 完整的i18n翻译指南

## 已完成的工作

### 1. 英文 (en) - ✅ 已完成
所有翻译键已添加到英文版本

### 2. 繁体中文 (zh-hant) - ✅ 已完成  
所有翻译键已添加到繁体中文版本

### 3. 需要添加的语言

以下语言需要添加完整翻译：
- 日语 (ja)
- 韩语 (ko)
- 波兰语 (pl)
- 越南语 (vi)
- 泰语 (th)

## 新增的翻译键列表

### common 部分
```
connectWalletToView
globalStakingStats
userStatus
todaysStakingVolume
stakeNativeTokens
empoweringHolders
stakingPools
governance
documentation
securityAudit
aboutUs
pressKit
careers
privacyPolicy
securingFuture
loading
notConnected
total
```

### stake 部分
```
selectLockDuration
stakeAssets
amountToStake
dailyRate
dailyRewards
lockupPeriod
estTotalReturn
cooldown
executeStake
myActiveStakes
time
amount
duration
reward
action
unstaked
locked
unstake
loadingRecords
noStakingRecords
positions
processing
connectWallet
dayTerm
estApy
stakeAmount
unlockIn
optimalNetwork
reinvestBonus
```

### team 部分
```
yourLevel
level
members
active
inactive
performance
team
valid
inviteNewMember
yourReferrer
yourInvitationLink
copy
copied
linkCopied
howItWorks
shareInviteLink
whenSomeoneJoins
earnRewards
directReferrals
viewAllMembers
loadingTeamMembers
noDirectReferrals
connectWalletToView
```

### mine 部分
```
notConnected
totalPerformance
assetBalances
manageAll
communityReward
teamLevel
smallAreaPerformance
eligibility
eligible
notEligible
pendingReward
claimReward
nodeReward
nodeParticipation
unstakeRequired
personalStakingStats
totalStaked
activeStakes
todaysStake
unstakeRecords
records
completed
loading
noUnstakeRecords
noCommunityRewardData
validUser
staker
```

## 翻译参考

### 日语 (ja) 翻译示例
```javascript
stake: {
  selectLockDuration: 'ロック期間を選択',
  stakeAssets: 'アセットをステーク',
  amountToStake: 'ステーク金額 (USD1)',
  dailyRate: '日次レート',
  dailyRewards: '日次報酬',
  lockupPeriod: 'ロック期間',
  estTotalReturn: '推定総リターン',
  cooldown: 'クールダウン',
  executeStake: 'ステーキングを実行',
  myActiveStakes: 'アクティブなステーキング',
  // ... 其他翻译
}
```

### 韩语 (ko) 翻译示例
```javascript
stake: {
  selectLockDuration: '잠금 기간 선택',
  stakeAssets: '자산 스테이킹',
  amountToStake: '스테이킹 금액 (USD1)',
  dailyRate: '일일 비율',
  dailyRewards: '일일 보상',
  lockupPeriod: '잠금 기간',
  estTotalReturn: '예상 총 수익',
  cooldown: '쿨다운',
  executeStake: '스테이킹 실행',
  myActiveStakes: '내 활성 스테이킹',
  // ... 其他翻译
}
```

## 使用方法

在组件中使用这些翻译键：

```javascript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  
  return (
    <div>
      <h1>{t('stake.selectLockDuration')}</h1>
      <button>{t('stake.executeStake')}</button>
      <p>{t('common.loading')}</p>
    </div>
  )
}
```

## 注意事项

1. 所有翻译键都遵循 `section.key` 的命名规范
2. 保持翻译的一致性和准确性
3. 特殊字符需要正确转义
4. 数字和单位保持原样（如 USD1, APR 等）
5. 品牌名称保持英文（如 Morgan Protocol）
