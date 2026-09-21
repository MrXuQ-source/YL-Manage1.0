App({
  onLaunch() {
    wx.cloud.init({
      env: 'cloud1-d2gr23m4r8f9df403',
      traceUser: true
    })
  }
})