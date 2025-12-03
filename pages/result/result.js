Page({
  data: {
    dormNum: '', // 宿舍号
    dormMembers: [], // 宿舍成员列表（含当前用户标记）
    matchAnalysis: [] // 与其他室友的匹配度分析
  },

  onLoad() {
    // 1. 获取当前用户信息和宿舍分配数据
    const userInfo = this.getCurrentUserInfo();
    const dormitories = wx.getStorageSync('dormitories') || [];

    if (!userInfo || !userInfo.studentId) {
      wx.showToast({
        title: '未找到用户信息',
        icon: 'none',
        success: () => wx.navigateBack()
      });
      return;
    }

    // 2. 查找当前用户所在的宿舍
    const userDorm = dormitories.find(dorm => 
      dorm.members.some(member => member.studentId === userInfo.studentId)
    );

    if (!userDorm) {
      wx.showToast({
        title: '未分配宿舍',
        icon: 'none',
        success: () => wx.navigateBack()
      });
      return;
    }

    // 3. 标记当前用户并更新数据
    const dormMembers = userDorm.members.map(member => ({
      ...member,
      isCurrentUser: member.studentId === userInfo.studentId
    }));

    this.setData({
      dormNum: userDorm.dormNum,
      dormMembers
    });

    // 4. 计算与其他室友的匹配度
    this.calculateMatchAnalysis(userInfo, dormMembers);
  },

  // 获取当前用户信息（从缓存或页面参数）
  getCurrentUserInfo() {
    // 方式1：从缓存读取（如果之前有存储）
    const collectedUsers = wx.getStorageSync('collectedUsers') || [];
    // 方式2：从分配结果页传递的参数读取（需在跳转时携带）
    // const pages = getCurrentPages();
    // const prevPage = pages[pages.length - 2];
    // return prevPage.data;

    // 这里简化处理：取最新提交的用户（实际应根据唯一标识获取）
    return collectedUsers[collectedUsers.length - 1] || {};
  },

  // 计算当前用户与其他室友的匹配度
  calculateMatchAnalysis(currentUser, dormMembers) {
    const currentHobby = currentUser.hobby || [];
    const analysis = [];

    dormMembers.forEach(member => {
      // 跳过自己
      if (member.isCurrentUser) return;

      // 计算共同爱好和匹配度
      const commonHobbies = currentHobby.filter(h => member.hobby.includes(h));
      const unionHobbies = [...new Set([...currentHobby, ...member.hobby])];
      const matchRate = unionHobbies.length > 0 
        ? Math.round((commonHobbies.length / unionHobbies.length) * 100) 
        : 0;

      analysis.push({
        roommateName: member.name,
        commonHobbies,
        matchRate
      });
    });

    this.setData({ matchAnalysis: analysis });
  }
});