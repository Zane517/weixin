Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 用户信息（class改为studentId）
    userAvatar: '/images/avatar-default.png',
    userName: '',
    studentId: '', // 学号字段
    userGender: '',
    userHobby: [],
    // 宿舍数据
    dormitories: [
      { dormNum: 501, members: [] },
      { dormNum: 502, members: [] },
      { dormNum: 503, members: [] },
      { dormNum: 504, members: [] },
      { dormNum: 505, members: [] }
    ],
    collectedUsers: [],
    remainingQuota: 20,
    isAssigned: false,
    assignedDormNum: '',
    roommateCount: 0,
    isCollectionComplete: false,
    isHobbyValid: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 接收参数（class改为studentId）
    const { userName, studentId, userGender, userHobby, userAvatar } = options;
    const parsedHobbies = userHobby ? decodeURIComponent(userHobby).split(',').filter(h => h) : [];
    const isHobbyValid = parsedHobbies.length >= 2;

    this.setData({
      userName: decodeURIComponent(userName || ''),
      studentId: decodeURIComponent(studentId || ''), // 赋值学号
      userGender: decodeURIComponent(userGender || ''),
      userHobby: parsedHobbies,
      userAvatar: userAvatar ? decodeURIComponent(userAvatar) : '/images/avatar-default.png',
      isHobbyValid: isHobbyValid
    });

    // 爱好校验失败处理
    if (!isHobbyValid) {
      wx.showToast({
        title: "请至少选择2个爱好！",
        icon: "none",
        duration: 1500,
        mask: true,
        success: () => {
          setTimeout(() => {
            wx.navigateBack({ delta: 1 });
          }, 1500);
        }
      });
      return;
    }

    // 加载缓存数据
    this.loadCachedData();

    // 检查用户是否已在收集列表
    this.checkUserInCollectedList();

    // 更新收集状态
    this.updateCollectionStatus();
  },

  /**
   * 从本地缓存加载数据
   */
  loadCachedData() {
    const cachedCollectedUsers = wx.getStorageSync('collectedUsers') || [];
    const cachedDormitories = wx.getStorageSync('dormitories') || [
      { dormNum: 501, members: [] },
      { dormNum: 502, members: [] },
      { dormNum: 503, members: [] },
      { dormNum: 504, members: [] },
      { dormNum: 505, members: [] }
    ];

    this.setData({
      collectedUsers: cachedCollectedUsers,
      dormitories: cachedDormitories
    });

    this.checkUserAssigned();
  },

  /**
   * 检查当前用户是否已在收集列表中
   */
  checkUserInCollectedList() {
    const { userName, studentId, collectedUsers, userAvatar, userGender, userHobby, isHobbyValid } = this.data;
    if (!userName || !studentId || !isHobbyValid) return;

    // 按学号+姓名去重（学号唯一，可单独用学号去重）
    const isExist = collectedUsers.some(user => user.studentId === studentId);
    if (!isExist) {
      const newUser = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: userName,
        studentId: studentId, // 存储学号
        avatar: userAvatar,
        gender: userGender,
        hobby: userHobby
      };

      const newCollectedUsers = [...collectedUsers, newUser];
      this.setData({ collectedUsers: newCollectedUsers });
      wx.setStorageSync('collectedUsers', newCollectedUsers);
    }
  },

  /**
   * 更新收集状态（是否满20人）和剩余名额
   */
  updateCollectionStatus() {
    const { collectedUsers } = this.data;
    const collectedCount = collectedUsers.length;
    const remainingQuota = 20 - collectedCount;
    const isCollectionComplete = collectedCount >= 20;

    this.setData({
      remainingQuota,
      isCollectionComplete
    });

    if (isCollectionComplete) {
      this.assignAllDorms();
    }
  },

  /**
   * 检查当前用户是否已分配宿舍
   */
  checkUserAssigned() {
    const { userName, studentId, dormitories } = this.data;
    if (!userName || !studentId) return;

    // 按学号查找（更精准）
    for (const dorm of dormitories) {
      const user = dorm.members.find(member => member.studentId === studentId);
      if (user) {
        this.setData({
          isAssigned: true,
          assignedDormNum: dorm.dormNum,
          roommateCount: dorm.members.length - 1
        });
        return;
      }
    }
    this.setData({ isAssigned: false });
  },

  /**
   * 辅助函数：计算两个爱好数组的重合度
   */
  calculateOverlapRate(hobby1, hobby2) {
    const intersection = hobby1.filter(h => hobby2.includes(h));
    const union = [...new Set([...hobby1, ...hobby2])];
    return union.length === 0 ? 0 : Math.round((intersection.length / union.length) * 100);
  },

  /**
   * 辅助函数：判断两个爱好数组是否完全一致
   */
  isHobbyExactMatch(hobby1, hobby2) {
    if (hobby1.length !== hobby2.length) return false;
    const sorted1 = [...hobby1].sort();
    const sorted2 = [...hobby2].sort();
    return sorted1.join(',') === sorted2.join(',');
  },

  /**
   * 核心逻辑：收集满20人后，统一分配宿舍
   */
  assignAllDorms() {
    const { collectedUsers } = this.data;
    let newDormitories = [
      { dormNum: 501, members: [] },
      { dormNum: 502, members: [] },
      { dormNum: 503, members: [] },
      { dormNum: 504, members: [] },
      { dormNum: 505, members: [] }
    ];

    // 按爱好选择数量分组
    const groupedUsers = {
      2: collectedUsers.filter(user => user.hobby.length === 2),
      3: collectedUsers.filter(user => user.hobby.length === 3),
      4: collectedUsers.filter(user => user.hobby.length === 4),
      5: collectedUsers.filter(user => user.hobby.length === 5)
    };

    // 第一步：双选用户匹配完全相同组合
    this.assignExactMatchUsers(groupedUsers[2], newDormitories);

    // 第二步：双选与三选交叉匹配（重合度>50%）
    this.assignCrossMatchUsers(groupedUsers[2], groupedUsers[3], newDormitories);

    // 第三步：剩余双选/三选与四选匹配（重合度>50%）
    const remaining2 = groupedUsers[2].filter(user => !this.isUserAssigned(user, newDormitories));
    const remaining3 = groupedUsers[3].filter(user => !this.isUserAssigned(user, newDormitories));
    this.assignCrossMatchUsers([...remaining2, ...remaining3], groupedUsers[4], newDormitories);

    // 第四步：四选与五选匹配（重合度>50%）
    const remaining4 = groupedUsers[4].filter(user => !this.isUserAssigned(user, newDormitories));
    this.assignCrossMatchUsers(remaining4, groupedUsers[5], newDormitories);

    // 第五步：分配剩余未匹配的用户
    const allRemainingUsers = [
      ...groupedUsers[2].filter(user => !this.isUserAssigned(user, newDormitories)),
      ...groupedUsers[3].filter(user => !this.isUserAssigned(user, newDormitories)),
      ...groupedUsers[4].filter(user => !this.isUserAssigned(user, newDormitories)),
      ...groupedUsers[5].filter(user => !this.isUserAssigned(user, newDormitories))
    ];
    this.assignRemainingUsers(allRemainingUsers, newDormitories);

    // 保存分配结果
    wx.setStorageSync('dormitories', newDormitories);
    this.setData({ dormitories: newDormitories });

    // 更新当前用户分配状态
    this.checkUserAssigned();
    wx.showToast({
      title: '20人数据收集完毕，已完成宿舍分配！',
      icon: 'success',
      duration: 3000
    });
  },

  /**
   * 分配完全相同爱好组合的用户
   */
  assignExactMatchUsers(users, dormitories) {
    const hobbyGroups = {};

    users.forEach(user => {
      const hobbyKey = [...user.hobby].sort().join(',');
      if (!hobbyGroups[hobbyKey]) {
        hobbyGroups[hobbyKey] = [];
      }
      hobbyGroups[hobbyKey].push(user);
    });

    Object.values(hobbyGroups).forEach(group => {
      group.forEach(user => {
        let targetDorm = dormitories.find(dorm => 
          dorm.members.length < 4 && 
          dorm.members.some(m => this.isHobbyExactMatch(m.hobby, user.hobby))
        );

        if (!targetDorm) {
          targetDorm = dormitories.reduce((prev, curr) => 
            curr.members.length < prev.members.length ? curr : prev
          );
        }

        targetDorm.members.push(user);
      });
    });
  },

  /**
   * 交叉匹配不同分组的用户
   */
  assignCrossMatchUsers(groupA, groupB, dormitories) {
    groupA.forEach(userA => {
      if (this.isUserAssigned(userA, dormitories)) return;

      let bestDorm = null;
      let maxOverlap = 50;

      dormitories.forEach(dorm => {
        if (dorm.members.length >= 4) return;

        const dormOverlap = dorm.members
          .filter(m => groupB.some(userB => userB.id === m.id))
          .map(m => this.calculateOverlapRate(m.hobby, userA.hobby))
          .reduce((max, rate) => Math.max(max, rate), 0);

        if (dormOverlap > maxOverlap) {
          maxOverlap = dormOverlap;
          bestDorm = dorm;
        }
      });

      if (bestDorm) {
        bestDorm.members.push(userA);
      }
    });

    groupB.forEach(userB => {
      if (this.isUserAssigned(userB, dormitories)) return;

      let bestDorm = null;
      let maxOverlap = 50;

      dormitories.forEach(dorm => {
        if (dorm.members.length >= 4) return;

        const dormOverlap = dorm.members
          .filter(m => groupA.some(userA => userA.id === m.id))
          .map(m => this.calculateOverlapRate(m.hobby, userB.hobby))
          .reduce((max, rate) => Math.max(max, rate), 0);

        if (dormOverlap > maxOverlap) {
          maxOverlap = dormOverlap;
          bestDorm = dorm;
        }
      });

      if (bestDorm) {
        bestDorm.members.push(userB);
      }
    });
  },

  /**
   * 分配剩余未匹配的用户
   */
  assignRemainingUsers(users, dormitories) {
    users.forEach(user => {
      if (this.isUserAssigned(user, dormitories)) return;

      const targetDorm = dormitories.reduce((prev, curr) => 
        curr.members.length < prev.members.length ? curr : prev
      );

      targetDorm.members.push(user);
    });
  },

  /**
   * 检查用户是否已分配宿舍
   */
  isUserAssigned(user, dormitories) {
    return dormitories.some(dorm => 
      dorm.members.some(m => m.id === user.id)
    );
  },

  /**
   * 触发分配（测试用）
   */
  handleTriggerAssign() {
    const { isCollectionComplete } = this.data;
    if (isCollectionComplete) {
      this.assignAllDorms();
    } else {
      wx.showToast({ title: '未收集满20人，无法分配！', icon: 'none' });
    }
  },
  goToResultDetail() {
    wx.navigateTo({
      url: '../result/result'
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadCachedData();
    this.updateCollectionStatus();
  }
});