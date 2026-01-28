# 🔗 真实合约调用实现说明

## ✅ **已完成的真实合约集成**

### 📊 **从Vue项目迁移的真实配置**

#### 1. **合约地址** (`/Morgan/src/store/index.js`第21-51行)
```javascript
const CONTRACTS = {
  STAKING: '0xD82B1B0D51CB0D220eFbbbf2BBf3E2cCf173E722',           // 质押主合约
  USDT: '0x57B84A31E00eF4378E6b2D30703b73d02Aee13f8',           // USDT代币合约
  AIG: '0x6B8b0372c5f708FF28849FF557c732f46D7A9F81',             // AIG代币合约
  TEAM_LEVEL: '0x1a5a3A1F23f6314Ffac0705fC19B9c6c9319Ae82',       // 团队等级合约
  REWARD_TRACKER: '0xF6ACbC9FE9757e93c85beF796ee52254B6073576',       // 奖励追踪合约
  AIG_INSURANCE: '0x2a40bcFD79512C4d865c776496Bf65B97EFCeC36'   // AIG保险合约
};
```

#### 2. **Mova网络RPC** (`/Morgan/src/App.vue`第19行和第226-270行)
```javascript
const MOVA_MAINNET = {
  chainId: '0x38',           // Chain ID: 61900
  chainName: 'Mova Mainnet',
  rpcUrls: ['https://rpc.mova.network/'],
  blockExplorerUrls: ['https://explorer.mova.network/']
}
```

### 🔗 **合约方法实现**

#### 1. **质押功能** (`onStake`)
```javascript
// 真实的合约调用流程：
1. 时间限制检查 - 北京时区高峰期拦截
2. 余额检查 - USD1和AIG余额验证
3. 授权检查 - 自动授权合约使用代币
4. 推荐人检查 - 判断用户是否已绑定推荐人
5. 执行质押 - stakeWithAIG 或 stakeWithAIGWithInviter
6. 数据重载 - 从合约重新获取质押记录
```

#### 2. **解除质押功能** (`onUnstake`)
```javascript
// 真实的合约调用流程：
1. 状态验证 - 检查质押记录是否可解除
2. 合约调用 - unstake(index) 方法
3. 数据重载 - 重新获取用户质押记录
4. 状态更新 - 更新前端显示状态
```

#### 3. **数据加载功能** (`loadStakeData`)
```javascript
// 从真实合约获取数据：
- 用户余额 (USD1, AIG)
- 质押记录 (userStakeInfos)
- 每小时限额 (getHourlyLimitByType)
- 剩余额度 (getRemainingHourlyLimitByType)
- 总质押额 (userTotalStaked)
- 复投税信息 (getReinvestTaxInfo)
- 质押状态 (startTime检查)
```

### 📋 **已实现的合约方法**

| 功能 | 合约方法 | 参数 | 返回值 |
|------|----------|------|--------|
| 质押 | `stakeWithAIG(amount, stakeIndex)` | 交易哈希 |
| 质押(带推荐人) | `stakeWithAIGWithInviter(amount, stakeIndex, inviter)` | 交易哈希 |
| 解除质押 | `unstake(index)` | 交易哈希 |
| 获取余额 | `balanceOf(address)` | 代币余额 |
| 检查授权 | `allowance(owner, spender)` | 授权金额 |
| 授权代币 | `approve(spender, amount)` | 交易哈希 |
| 用户质押信息 | `userStakeInfos(address)` | 质押记录数组 |
| 总质押额 | `userTotalStaked(address)` | 总质押数量 |
| 每小时限额 | `getHourlyLimitByType(type)` | 限额数量 |
| 剩余额度 | `getRemainingHourlyLimitByType(type)` | 剩余数量 |
| 复投税信息 | `getReinvestTaxInfo(address)` | 税收信息 |
| 检查绑定状态 | `isBindReferral(address)` | 布尔值 |
| 质押开始时间 | `startTime()` | 时间戳 |

### 🎯 **关键特性**

#### ✅ **已实现**
- **真实合约地址** - 从Vue项目获取
- **完整Mova网络配置** - RPC、浏览器、链ID
- **自动代币授权** - 智能检查和授权USD1、AIG
- **推荐人系统集成** - 自动检测绑定状态
- **时间限制验证** - 北京时区高峰期控制
- **实时数据同步** - 所有数据从真实合约获取
- **错误处理** - 完整的合约调用错误处理
- **交易状态跟踪** - 等待交易确认

#### 🔧 **技术栈**
- **Wagmi v3** - 钱包连接和管理
- **Viem v2** - 轻量级以太坊客户端
- **Ethers v6** - 合约交互和工具函数
- **Zustand** - 状态管理
- **React 18** - 前端框架

### 🚀 **部署就绪**

现在React质押应用：
1. **完全使用真实合约** - 所有数据来自链上
2. **支持Mova主网** - 完整的网络配置
3. **具备Vue所有功能** - 质押、解除质押、奖励计算
4. **增强用户体验** - 现代React架构和UI

### 📝 **测试建议**

1. **小额测试** - 使用少量代币测试质押流程
2. **授权验证** - 确认代币授权功能正常
3. **时间测试** - 验证冷却时间和限制
4. **网络切换** - 测试Mova主网连接
5. **错误处理** - 验证所有错误场景

---

## 🎊 **总结**

React质押功能现已**完全集成真实合约**，所有数据交互都直接与Mova主网上的智能合约进行。从Vue项目的合约地址到Mova网络配置，再到完整的合约方法调用，确保了与现有系统的完全兼容性和功能对等性。

🚀 **准备在Mova主网上的真实质押操作！**