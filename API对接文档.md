# Morgan New UI API对接文档

## 1. 项目概述

本文档旨在指导开发者将旧项目的链上合约对接逻辑迁移到新项目中，使用新提供的RESTful API接口。

### 1.1 项目结构

**旧项目**：`/Users/hj/project/区块链相关源码/mogen/Morgan`
- 基于Vue.js开发
- 直接与区块链合约交互
- 使用web3.js/ethers.js调用合约方法

**新项目**：`/Users/hj/project/区块链相关源码/mogen/morgan-new-ui`
- 基于React开发
- 通过RESTful API与后端交互
- 后端统一处理区块链合约调用

### 1.2 核心页面

本次对接涉及以下核心页面：
- **Home页**：展示全局质押统计、用户概览等
- **Team页**：展示团队信息、直推业绩、团队成员等
- **Mine页**：展示用户个人质押记录、收益等

## 2. API接口映射

### 2.1 全局配置

**API基础URL**：`http://35.78.236.133/mova`

**单位说明**：所有金额字段均为字符串格式的Wei单位，前端需要进行转换（1 ether = 10^18 wei）

### 2.2 Home页接口映射

| 旧项目逻辑 | 新API接口 | 说明 |
|------------|-----------|------|
| 查询当前有效质押总量 | GET `/api/stats/stake` | 获取全局质押统计数据 |
| 查询30天新增质押 | GET `/api/stats/stake` | `stake_30d`字段 |
| 查询1天新增质押 | GET `/api/stats/stake` | `stake_1d`字段 |
| 查询用户基本信息 | GET `/api/user/{address}` | 获取用户完整信息 |

### 2.3 Team页接口映射

| 旧项目逻辑 | 新API接口 | 说明 |
|------------|-----------|------|
| 查询用户推荐人 | GET `/api/user/{address}` | `referrer`字段 |
| 查询直推数量 | GET `/api/team/{address}` | `direct_count`字段 |
| 查询有效直推数量 | GET `/api/user/{address}` | `valid_direct_count`字段 |
| 查询团队总人数 | GET `/api/team/{address}` | `team_count`字段 |
| 查询团队业绩 | GET `/api/user/{address}` | `team_performance`字段 |
| 查询直推业绩 | GET `/api/user/{address}` | `direct_performance`字段 |
| 查询团队等级 | GET `/api/user/{address}` | `team_level`和`team_level_name`字段 |
| 查询直推用户列表 | GET `/api/team/{address}/hierarchy` | `direct_users`字段 |
| 查询全部会员列表 | GET `/api/users` | 分页获取会员列表 |
| 查询上级链 | GET `/api/team/{address}/ancestors` | 获取用户上级链 |



PerformanceResponse: 业绩信息响应

{
success*: boolean
请求是否成功

address: string
用户地址

personal_performance: string
个人业绩（质押金额，单位: Wei）

team_performance: string
团队总业绩

direct_performance: string
直推业绩

big_area_performance: string
大区业绩

small_area_performance: string
小区业绩

team_level: integer
团队等级: 0=普通, 1-6=S1-S6

team_level_name: string
等级名称: 普通用户/S1/S2/S3/S4/S5/S6

error: string
错误信息

}
### 2.4 Mine页接口映射

| 旧项目逻辑 | 新API接口 | 说明 |
|------------|-----------|------|
| 查询用户质押记录 | GET `/api/stakes/{address}` | 获取用户质押记录 |
| 查询用户解质押记录 | GET `/api/unstakes/{address}` | 获取用户解质押记录 |
| 查询用户今日新增质押 | GET `/api/user/{address}/today` | `today_personal_stake`字段 |
| 查询用户业绩详情 | GET `/api/performance/{address}` | 获取用户业绩详情 |

## 3. 页面对接详情

### 3.1 Home页对接

#### 3.1.1 全局质押统计

**旧项目实现**：
```javascript
// 直接调用Staking合约获取数据
const stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, provider);
const currentStake = await stakingContract.totalStaked();
const stake30d = await stakingContract.stake30d();
const stake1d = await stakingContract.stake1d();
```

**新项目实现**：
```javascript
// 通过API获取数据
const fetchGlobalStats = async () => {
  const response = await fetch(`${API_BASE_URL}/api/stats/stake`);
  const data = await response.json();
  if (data.success) {
    const currentStake = ethers.formatEther(data.current_stake);
    const stake30d = ethers.formatEther(data.stake_30d);
    const stake1d = ethers.formatEther(data.stake_1d);
    // 更新状态
  }
};
```

#### 3.1.2 用户概览

**旧项目实现**：
```javascript
// 直接调用多个合约获取用户数据
const [userInfo, performance] = await Promise.all([
  stakingContract.userInfo(address),
  teamLevelContract.getTeamPerformance(address)
]);
```

**新项目实现**：
```javascript
// 通过API获取用户完整信息
const fetchUserInfo = async () => {
  const response = await fetch(`${API_BASE_URL}/api/user/${address}`);
  const data = await response.json();
  if (data.success) {
    // 更新用户状态
    setUserInfo({
      address: data.address,
      teamLevel: data.team_level_name,
      personalPerformance: ethers.formatEther(data.personal_performance),
      teamPerformance: ethers.formatEther(data.team_performance),
      // 其他字段...
    });
  }
};
```

### 3.2 Team页对接

#### 3.2.1 团队基本信息

**旧项目实现**：
```javascript
const [
  referrer,
  isBind,
  referralCount,
  validReferralCount,
  teamCount,
  performance,
  level
] = await Promise.all([
  teamLevelContract.getReferral(account),
  teamLevelContract.isBindReferral(account),
  teamLevelContract.getReferralCount(account),
  teamLevelContract.getValidReferralCount(account),
  teamLevelContract.getTeamCount(account),
  teamLevelContract.getRealTeamPerformance(account),
  teamLevelContract.getTeamLevel(account)
]);
```

**新项目实现**：
```javascript
// 获取用户团队信息
const fetchTeamInfo = async () => {
  const [userResponse, teamResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/api/user/${address}`),
    fetch(`${API_BASE_URL}/api/team/${address}`)
  ]);
  
  const userData = await userResponse.json();
  const teamData = await teamResponse.json();
  
  if (userData.success && teamData.success) {
    setTeamStats({
      referrer: userData.referrer,
      isBind: userData.referrer !== '0x0000000000000000000000000000000000000000',
      referralCount: teamData.direct_count,
      validReferralCount: userData.valid_direct_count,
      teamCount: teamData.team_count,
      teamPerformance: ethers.formatEther(userData.team_performance),
      teamLevel: userData.team_level_name,
      // 其他字段...
    });
  }
};
```

#### 3.2.2 直推用户列表

**旧项目实现**：
```javascript
// 分页查询直推用户
const actualToIndex = Math.min(this.toIndex, this.totalReferrals - 1);
directReferrals = await contract.getDirectReferralsWithInfoPaginated(account, this.fromIndex, actualToIndex);
```

**新项目实现**：
```javascript
// 获取团队层级详情，包含直推用户
const fetchDirectReferrals = async () => {
  const response = await fetch(`${API_BASE_URL}/api/team/${address}/hierarchy`);
  const data = await response.json();
  
  if (data.success) {
    const directUsers = data.direct_users.map(user => ({
      address: user.address,
      stakeAmount: ethers.formatEther(user.personal_performance),
      teamPerformance: ethers.formatEther(user.team_performance),
      level: user.team_level_name
    }));
    setDirectReferrals(directUsers);
  }
};
```

#### 3.2.3 全部会员列表（分页）

**旧项目实现**：
```javascript
// 分页查询团队成员
const teamMembers = await contract.getTeamMembersPaginated(account, offset, limit);
```

**新项目实现**：
```javascript
// 分页获取会员列表
const fetchAllMembers = async (page = 1, pageSize = 10) => {
  const response = await fetch(`${API_BASE_URL}/api/users?page=${page}&page_size=${pageSize}`);
  const data = await response.json();
  
  if (data.success) {
    const members = data.members.map(member => ({
      address: member.address,
      level: member.team_level_name,
      personalPerformance: ethers.formatEther(member.personal_performance),
      teamPerformance: ethers.formatEther(member.team_performance),
      // 其他字段...
    }));
    setMembers(members);
    setTotalMembers(data.total);
    setCurrentPage(data.page);
    setPageSize(data.page_size);
  }
};
```

### 3.3 Mine页对接

#### 3.3.1 质押记录

**旧项目实现**：
```javascript
// 获取用户所有质押信息
const stakeInfos = await stakingContract.userStakeInfos(userAddress);
```

**新项目实现**：
```javascript
// 获取用户质押记录
const fetchStakeRecords = async () => {
  const response = await fetch(`${API_BASE_URL}/api/stakes/${address}`);
  const data = await response.json();
  
  if (data.success) {
    const stakes = data.stakes.map(stake => ({
      id: stake.id,
      amount: ethers.formatEther(stake.amount),
      stakeTime: new Date(parseInt(stake.stake_time) * 1000).toLocaleString(),
      status: stake.status ? '已解质押' : '有效',
      stakeIndex: stake.stake_index,
      reward: ethers.formatEther(stake.reward),
      canEndData: new Date(parseInt(stake.can_end_data) * 1000).toLocaleString(),
      bEndData: stake.b_end_data
    }));
    setStakeRecords(stakes);
  }
};
```

#### 3.3.2 解质押记录

**旧项目实现**：
```javascript
// 获取用户解质押记录
const unstakeRecords = await stakingContract.getUserUnstakeRecords(userAddress);
```

**新项目实现**：
```javascript
// 获取用户解质押记录
const fetchUnstakeRecords = async () => {
  const response = await fetch(`${API_BASE_URL}/api/unstakes/${address}`);
  const data = await response.json();
  
  if (data.success) {
    const unstakes = data.unstakes.map(unstake => ({
      id: unstake.id,
      reward: ethers.formatEther(unstake.reward),
      unstakeTime: new Date(parseInt(unstake.unstack_time) * 1000).toLocaleString(),
      stakeIndex: unstake.stake_index,
      // 其他字段...
    }));
    setUnstakeRecords(unstakes);
  }
};
```

#### 3.3.3 今日新增质押

**旧项目实现**：
```javascript
// 获取用户今日新增质押
const todayStake = await stakingContract.getUserTodayStake(userAddress);
```

**新项目实现**：
```javascript
// 获取用户今日新增质押
const fetchTodayStake = async () => {
  const response = await fetch(`${API_BASE_URL}/api/user/${address}/today`);
  const data = await response.json();
  
  if (data.success) {
    const todayPersonalStake = ethers.formatEther(data.today_personal_stake);
    const todayTeamStake = ethers.formatEther(data.today_team_stake);
    setTodayStake({
      personal: todayPersonalStake,
      team: todayTeamStake
    });
  }
};
```

## 4. 数据转换与处理

### 4.1 单位转换

所有金额字段均为字符串格式的Wei单位，需要转换为可读格式：

```javascript
import { ethers } from 'ethers';

// Wei -> 可读格式
const readableAmount = ethers.formatEther(weiAmount);

// 可读格式 -> Wei
const weiAmount = ethers.parseEther(readableAmount);
```

### 4.2 日期处理

时间戳转换为可读日期：

```javascript
// 秒级时间戳 -> 日期字符串
const dateString = new Date(parseInt(timestamp) * 1000).toLocaleString();

// 毫秒级时间戳 -> 日期字符串
const dateString = new Date(parseInt(timestamp)).toLocaleString();
```

### 4.3 地址格式化

格式化以太坊地址，只显示首尾部分：

```javascript
const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
```

## 5. 错误处理

### 5.1 API请求错误处理

```javascript
const fetchData = async () => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '请求失败');
    }
    
    // 处理数据
  } catch (error) {
    console.error('请求失败:', error);
    // 显示错误信息给用户
    showNotification(error.message, 'error');
  }
};
```

### 5.2 网络错误处理

```javascript
const fetchData = async () => {
  try {
    // API请求
  } catch (error) {
    if (!navigator.onLine) {
      showNotification('网络连接失败，请检查网络设置', 'error');
    } else {
      showNotification(error.message, 'error');
    }
  }
};
```

## 6. 最佳实践

### 6.1 数据缓存

对于不经常变化的数据，可以使用缓存机制减少API请求：

```javascript
const useCachedData = (key, fetchFunction, cacheTime = 5 * 60 * 1000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const cache = localStorage.getItem(key);
  const cachedData = cache ? JSON.parse(cache) : null;
  const isCacheValid = cachedData && Date.now() - cachedData.timestamp < cacheTime;
  
  useEffect(() => {
    if (isCacheValid) {
      setData(cachedData.data);
      setLoading(false);
      return;
    }
    
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await fetchFunction();
        setData(result);
        localStorage.setItem(key, JSON.stringify({ data: result, timestamp: Date.now() }));
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [key, fetchFunction, cacheTime, isCacheValid]);
  
  return { data, loading, error };
};
```

### 6.2 分页数据处理

对于大量数据，使用分页加载：

```javascript
const usePaginatedData = (fetchFunction, initialPage = 1, initialPageSize = 10) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const loadData = async (page, size) => {
    try {
      setLoading(true);
      const result = await fetchFunction(page, size);
      setData(result.data);
      setTotalItems(result.total);
      setTotalPages(Math.ceil(result.total / size));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadData(currentPage, pageSize);
  }, [currentPage, pageSize]);
  
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  return {
    data, loading, error, currentPage, pageSize, totalItems, totalPages,
    goToPage, nextPage, prevPage
  };
};
```

## 7. 开发环境配置

### 7.1 API基础URL配置

在项目中配置API基础URL，可以根据环境不同设置不同的值：

```javascript
// src/config/api.js
const API_CONFIG = {
  development: {
    baseURL: 'http://35.78.236.133/mova'
  },
  production: {
    baseURL: 'http://35.78.236.133/mova' // 生产环境URL
  }
};

export const API_BASE_URL = API_CONFIG[process.env.NODE_ENV]?.baseURL || API_CONFIG.development.baseURL;
```

### 7.2 请求拦截器

使用axios等HTTP客户端，可以添加请求拦截器：

```javascript
// src/utils/axios.js
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000 // 10秒超时
});

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证信息等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

## 8. 测试建议

### 8.1 API测试

使用Postman或Insomnia等工具测试API接口，确保返回数据格式正确。

### 8.2 前端测试

1. **单元测试**：测试数据转换、格式化等函数
2. **集成测试**：测试API请求和数据处理逻辑
3. **端到端测试**：测试完整的用户流程

### 8.3 模拟数据

在开发过程中，可以使用模拟数据加快开发速度：

```javascript
// src/mocks/data.js
export const mockUserInfo = {
  address: '0x1234567890123456789012345678901234567890',
  referrer: '0x0987654321098765432109876543210987654321',
  team_level: 2,
  team_level_name: 'S2',
  personal_performance: '100000000000000000000', // 100 USD1
  team_performance: '500000000000000000000', // 500 USD1
  direct_performance: '200000000000000000000', // 200 USD1
  direct_count: 5,
  valid_direct_count: 3,
  team_count: 20
};
```

## 9. 迁移步骤

1. **配置API基础URL**：在项目中配置正确的API基础URL
2. **创建API服务**：封装API请求函数
3. **页面组件开发**：
   - 实现Home页组件，对接相关API
   - 实现Team页组件，对接相关API
   - 实现Mine页组件，对接相关API
4. **数据转换**：实现数据转换和格式化函数
5. **错误处理**：添加API请求错误处理
6. **测试**：测试所有功能是否正常工作
7. **优化**：添加缓存、分页等优化

## 10. 注意事项

1. **API版本**：确保使用正确的API版本
2. **字段映射**：仔细检查字段映射，确保数据正确显示
3. **性能优化**：对于频繁请求的数据，使用缓存机制
4. **用户体验**：添加加载状态和错误提示
5. **安全性**：不要在前端存储敏感信息
6. **兼容性**：确保代码兼容不同浏览器

## 11. 附录

### 11.1 常用API列表

| API路径 | 方法 | 说明 |
|---------|------|------|
| `/api/stats/stake` | GET | 获取全局质押统计 |
| `/api/user/{address}` | GET | 获取用户完整信息 |
| `/api/user/{address}/today` | GET | 获取用户今日新增质押 |
| `/api/team/{address}` | GET | 获取用户网体信息 |
| `/api/team/{address}/hierarchy` | GET | 获取用户团队层级详情 |
| `/api/team/{address}/ancestors` | GET | 获取用户上级链 |
| `/api/users` | GET | 获取全部会员列表（分页） |
| `/api/stakes/{address}` | GET | 获取用户质押记录 |
| `/api/unstakes/{address}` | GET | 获取用户解质押记录 |
| `/api/performance/{address}` | GET | 获取用户业绩详情 |

### 11.2 数据结构

**用户信息结构**：
```json
{
  "success": true,
  "address": "string",
  "referrer": "string",
  "team_level": 0,
  "team_level_name": "string",
  "personal_performance": "string",
  "team_performance": "string",
  "direct_performance": "string",
  "big_area_performance": "string",
  "small_area_performance": "string",
  "direct_count": 0,
  "valid_direct_count": 0,
  "team_count": 0,
  "is_valid_user": false
}
```

**团队信息结构**：
```json
{
  "success": true,
  "user_info": {
    "address": "string",
    "referrer": "string",
    "team_level": 0,
    "personal_performance": "string",
    "team_performance": "string",
    "direct_performance": "string",
    "big_area_performance": "string",
    "small_area_performance": "string",
    "direct_count": 0,
    "valid_direct_count": 0,
    "team_count": 0,
    "is_valid_user": false
  },
  "direct_count": 0,
  "team_count": 0
}
```

**质押记录结构**：
```json
{
  "success": true,
  "stakes": [
    {
      "id": 0,
      "user_address": "string",
      "amount": "string",
      "stake_index": 0,
      "stake_time": 0,
      "block_number": 0,
      "tx_hash": "string"
    }
  ]
}
```

---

以上文档提供了详细的API对接指导，开发者可以根据实际情况进行调整。在开发过程中，建议先实现核心功能，然后逐步优化和完善。