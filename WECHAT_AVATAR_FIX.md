# 大鹅爱记账 - 微信头像使用问题修复说明

## 问题描述
项目中无法直接使用微信头像，这是因为使用了已被微信官方废弃的 `wx.getUserProfile()` API。

## 根本原因
自2022年10月25日起，微信官方调整了小程序获取用户头像和昵称的规则：
- `wx.getUserProfile()` 接口已被收回
- `wx.getUserInfo()` 接口也已被废弃
- 开发者需要使用新的"头像昵称填写能力"

## 解决方案

### 1. 头像选择更新
**原有方式 (已废弃):**
```javascript
wx.getUserProfile({
  desc: '用于获取微信头像',
  success: (res) => {
    const { avatarUrl } = res.userInfo
    // 处理头像
  }
})
```

**新方式 (推荐):**
```xml
<!-- WXML -->
<button open-type="chooseAvatar" bind:chooseavatar="onChooseAvatar">
  <image src="{{avatarUrl}}" />
</button>
```

```javascript
// JS
onChooseAvatar(e) {
  const { avatarUrl } = e.detail
  // 处理头像
}
```

### 2. 昵称输入更新
**原有方式 (已废弃):**
```javascript
wx.getUserProfile({
  desc: '用于获取微信昵称',
  success: (res) => {
    const { nickName } = res.userInfo
    // 处理昵称
  }
})
```

**新方式 (推荐):**
```xml
<!-- WXML -->
<input type="nickname" placeholder="请输入昵称" bind:blur="onNicknameChange" />
```

## 已修改的文件

### 1. pages/profile/profile.wxml
- 将头像选择的 `<view>` 改为 `<button open-type="chooseAvatar">`
- 将昵称显示的 `<text>` 改为 `<input type="nickname">`

### 2. pages/profile/profile.js
- 添加 `onChooseAvatar()` 方法处理头像选择
- 添加 `onNicknameChange()` 方法处理昵称修改
- 移除所有使用 `wx.getUserProfile()` 的废弃方法

### 3. pages/index/index.wxml
- 更新首页头像选择为新的 button 方式

### 4. pages/index/index.js
- 添加 `onChooseAvatar()` 方法

### 5. CSS 样式文件
- 为新的 button 和 input 组件添加适配样式
- 确保样式重置，移除默认的 button 样式

## 注意事项

1. **临时路径处理**: 新API返回的头像是临时路径，建议上传到服务器获取永久地址
2. **基础库版本**: 需要基础库版本 2.21.2 及以上才支持新的头像昵称填写能力
3. **安全检测**: 从基础库 2.24.4 开始，微信会对用户上传的图片和昵称进行安全检测
4. **用户体验**: 新方式需要用户主动点击选择，无法直接获取微信头像

## 测试建议

1. 测试头像选择功能是否正常工作
2. 测试昵称输入是否能自动填充微信昵称
3. 验证头像和昵称的保存功能
4. 确认在不同页面间头像显示一致

## 兼容性说明

修改后的代码符合微信最新的接口规范，确保应用能够正常通过审核并在生产环境中稳定运行。
