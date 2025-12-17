Page({
  handleFormSubmit(e) {
    console.log("触发提交了！");
    const formData = e.detail.value;
    console.log("表单数据：", formData);

    // 1. 校验姓名（去除空格后不可为空）
    const username = formData.username?.trim();
    if (!username) {
      wx.showToast({
        title: "请输入姓名",
        icon: "none",
        duration: 1500,
        mask: true
      });
      return;
    }

    // 2. 校验学号（必选 + 11位数字正则校验）
    const studentId = formData.studentId?.trim();
    // 定义11位数字的正则表达式
    const studentIdReg = /^\d{11}$/;
    if (!studentId) {
      wx.showToast({
        title: "请输入学号",
        icon: "none",
        duration: 1500,
        mask: true
      });
      return;
    } else if (!studentIdReg.test(studentId)) {
      wx.showToast({
        title: "学号必须为11位数字",
        icon: "none",
        duration: 1500,
        mask: true
      });
      return;
    }

    // 3. 校验性别（必选，必须选择）
    const gender = formData.gender;
    if (!gender) {
      wx.showToast({
        title: "请选择性别",
        icon: "none",
        duration: 1500,
        mask: true
      });
      return;
    }

    // 4. 校验爱好（必选，至少选择2个）
    const hobby = formData.hobby;
    if (!hobby || hobby.length < 2) {
      wx.showToast({
        title: "请至少选择2个爱好",
        icon: "none",
        duration: 1500,
        mask: true
      });
      return;
    }

    // 所有校验通过，跳转至分配页面
    wx.navigateTo({
      url: `../choose/choose?` +
        `userName=${encodeURIComponent(formData.username)}&` +
        `studentId=${encodeURIComponent(formData.studentId)}&` +
        `userGender=${encodeURIComponent(formData.gender)}&` +
        `userHobby=${encodeURIComponent(formData.hobby.join(','))}&` +
        `userAvatar=${encodeURIComponent('/images/avatar-default.png')}`,
      success: () => { console.log("跳转成功并携带数据！"); },
      fail: (err) => { console.log("跳转失败原因：", err); }
    });
  }
});