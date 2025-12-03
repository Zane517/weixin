Page({
  data: {
    dormitories: [], // 所有宿舍数据
    totalStudents: 0, // 总人数统计
    hasPermission: false 
  },

  onLoad() {
    // 先执行权限校验，通过后再加载数据
    const isAdmin = this.checkAdminPermission();
    if (isAdmin) {
      this.setData({ hasPermission: true }); // 标记有权限
      this.loadAllDormitories(); // 加载数据
    }
  },

  // 权限校验（示例：通过密码或特定参数验证）
  checkAdminPermission() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const { adminKey } = currentPage.options;

    if (adminKey !== 'a123') {
      wx.showToast({
        title: '无管理员权限',
        icon: 'none',
        duration: 2000
      });
      // 立即返回上一页，不等待toast结束（减少内容暴露时间）
      wx.navigateBack({ delta: 1 });
      return false; // 返回false表示无权限
    }
    return true; // 返回true表示有权限
  },

  // 加载所有宿舍数据
  loadAllDormitories() {
    const dormitories = wx.getStorageSync('dormitories') || [
      { dormNum: 501, members: [] },
      { dormNum: 502, members: [] },
      { dormNum: 503, members: [] },
      { dormNum: 504, members: [] },
      { dormNum: 505, members: [] }
    ];

    // 计算总人数
    const totalStudents = dormitories.reduce(
      (total, dorm) => total + dorm.members.length, 
      0
    );

    this.setData({
      dormitories,
      totalStudents
    });
  }
});