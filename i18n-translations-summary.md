# i18n 翻译补充总结

## 已补充的翻译键

### 1. 错误提示 (error)
| 键名 | 英文 | 中文 |
|------|------|------|
| transactionFailed | Transaction failed | 交易失败 |

### 2. 兑换页面 (swap)
| 键名 | 英文 | 中文 |
|------|------|------|
| slippageTip | Recommended 0.5%-2% for better success rate | 建议设置0.5%-2%以提高交易成功率 |
| purchaseLimit | Purchase Limit | 购买限制 |
| purchased | Purchased | 已购买 |
| remainingLimit | Remaining Limit | 剩余购买限制 |
| transactionHash | Transaction Hash | 交易哈希 |

### 3. 通用文本 (common)
| 键名 | 英文 | 中文 |
|------|------|------|
| error | Error | 错误 |
| success | Success | 成功 |
| info | Info | 信息 |
| totalStakedAmount | Total Staked Amount | 质押总金额 |
| annualYield360Days | 360-Day Annual Yield | 360天年化累计收益率 |
| teamSize | Team Size | 团队人数 |
| directPerformance | Direct Performance | 直推业绩 |
| teamTodayNewPerformance | Team Today New Performance | 团队今日新增业绩 |
| directReferrals | Direct Referrals | 直推数量 |
| bigAreaPerformance | Big Area Performance | 大区业绩 |
| smallAreaPerformance | Small Area Performance | 小区业绩 |
| minutes | minutes | 分钟 |

## 已修复的硬编码文本

### StakeView.jsx
- ✅ "质押总金额" → `t('common.totalStakedAmount')`
- ✅ "360天年化累计收益率" → `t('common.annualYield360Days')`

### SwapView.jsx
- ✅ "交易哈希" → `t('swap.transactionHash')`
- ✅ "交易失败" → `t('error.transactionFailed')`
- ✅ "建议设置0.5%-2%以提高交易成功率" → `t('swap.slippageTip')`
- ✅ "20分钟" → `20 ${t('common.minutes')}`
- ✅ "购买限制" → `t('swap.purchaseLimit')`
- ✅ "已购买" → `t('swap.purchased')`
- ✅ "剩余购买限制" → `t('swap.remainingLimit')`

### TeamView.jsx
- ✅ "团队人数" → `t('common.teamSize')`
- ✅ "直推业绩" → `t('common.directPerformance')`
- ✅ "团队今日新增业绩" → `t('common.teamTodayNewPerformance')`
- ✅ "直推数量" → `t('common.directReferrals')`
- ✅ "大区业绩" → `t('common.bigAreaPerformance')`
- ✅ "小区业绩" → `t('common.smallAreaPerformance')`

## 完整的翻译结构

### 英文 (en)
```javascript
{
  home: { ... },
  wallet: { ... },
  error: {
    // 原有的错误提示
    connectWallet, highTraffic, maxStakeLimit, usd1Balance, aigBalance,
    newUserReferral, stakeFailed, unstakeFailed, walletNotConnected,
    tokenApprovalFailed, invalidReferrer, validAmount, insufficientBalance,
    slippageRange, contractPaused, exceedLimit, insufficientLiquidity,
    userRejected, insufficientGas, refreshFailed,
    // 新增
    transactionFailed
  },
  success: { ... },
  info: { ... },
  swap: {
    // 原有的兑换相关
    title, subtitle, settings, slippageTolerance, customSlippage,
    transactionSettings, transactionExpiry, gasLimit, currentSlippage,
    minimumReceived, retrySwap, cancel, processing, confirmSwap,
    refreshing, refreshPrice, securityAudit, fastConfirmation,
    crossChain, exchangeRate, priceImpact, liquidityFee, from, to,
    balance, max,
    // 新增
    slippageTip, purchaseLimit, purchased, remainingLimit, transactionHash
  },
  stake: { ... },
  team: { ... },
  mine: { ... },
  common: {
    // 原有的通用文本
    home, swap, stake, team, mine, startStaking, viewDocumentation,
    liveOnMainnet, networkStatus, decentralizedAndSecure, totalValueLocked,
    '24hNewStakes', yourPerformance, institutionalGradeAssets, viewAllPools,
    usd1Stablecoin, rewardApr, totalStaked, readyToMaximizeYourAssets,
    joinOverStakers, connectWalletAndStake, protocol, company, newsletter,
    stayUpdated, emailAddress, copyright, language, english, chinese,
    traditionalChinese, german, spanish, japanese, korean, polish,
    vietnamese, thai, khmer,
    // 新增
    error, success, info, totalStakedAmount, annualYield360Days, teamSize,
    directPerformance, teamTodayNewPerformance, directReferrals,
    bigAreaPerformance, smallAreaPerformance, minutes,
    cookieConsent: { ... }
  }
}
```

### 中文 (zh)
所有新增的键都已添加对应的中文翻译。

## 使用方法

在组件中使用翻译：

```javascript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  
  return (
    <div>
      <p>{t('common.totalStakedAmount')}</p>
      <p>{t('swap.purchaseLimit')}</p>
      <p>{t('error.transactionFailed')}</p>
    </div>
  )
}
```

## 注意事项

1. 所有硬编码的中文文本都已替换为 i18n 翻译键
2. 新增的翻译键已同时添加英文和中文版本
3. 保持了原有的翻译结构和命名规范
4. 所有修改都已应用到相应的组件文件中
