Page({
  data: {
    list: [],
    total: 0,
    startDate: '',
    endDate: '',
    status: '',          // 空字符串 = 全部，0 = 待称重，1 = 在库，2 = 已出库
    wasteName: '',
    wasteCode: '',
    department: '',
    device: '',
    limit: 10
  },

  onShow() {
    this.loadData()
  },

  // ===== 筛选条件 =====
  onStartDateChange(e) { this.setData({ startDate: e.detail.value }) },
  onEndDateChange(e) { this.setData({ endDate: e.detail.value }) },

  onStatusChange(e) {
    const val = e.currentTarget.dataset.status
    // data-status 是字符串 "0"/"1"/"2"/""，转成对应类型
    const status = val === '' ? '' : Number(val)
    this.setData({ status })
    this.loadData()  // 切换状态后自动查询
  },

  onWasteNameInput(e) { this.setData({ wasteName: e.detail.value }) },
  onWasteCodeInput(e) { this.setData({ wasteCode: e.detail.value }) },
  onDepartmentInput(e) { this.setData({ department: e.detail.value }) },
  onDeviceInput(e) { this.setData({ device: e.detail.value }) },

  onReset() {
    this.setData({
      startDate: '', endDate: '', status: '',
      wasteName: '', wasteCode: '', department: '', device: ''
    })
    this.loadData()
  },

  // ===== 加载列表 =====
  loadData() {
    wx.showLoading({ title: '加载中...' })
    const { startDate, endDate, status, wasteName, wasteCode, department, device, limit } = this.data

    console.log('前端传参:', { startDate, endDate, status, wasteName, wasteCode, department, device, limit })

    wx.cloud.callFunction({
      name: 'getDataList',
      data: {
        startDate,
        endDate,
        status,           // 空字符串 = 查全部，数字 0/1/2 = 按状态过滤
        wasteName,
        wasteCode,
        department,
        device,
        limit
      },
      success: res => {
        wx.hideLoading()
        console.log('云函数返回数据:', res.result)
        if (res.result && res.result.success) {
          this.setData({
            list: res.result.data,
            total: res.result.total
          })
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' })
        }
      },
      fail: err => {
        wx.hideLoading()
        console.error(err)
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  // ===== 出库操作 =====
  doOutbound(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认出库',
      content: '确定出库吗？出库后将生成出库编码，且无法修改重量！',
      success: res => {
        if (res.confirm) {
          wx.showLoading({ title: '出库中...' })
          wx.cloud.callFunction({
            name: 'updateOutStock',
            data: { id: id, status: '已出库' },
            success: res => {
              wx.hideLoading()
              if (res.result && res.result.success) {
                wx.showToast({ title: '出库成功', icon: 'success' })
                this.loadData()
              } else {
                wx.showToast({ title: res.result.msg || '出库失败', icon: 'none' })
              }
            },
            fail: () => {
              wx.hideLoading()
              wx.showToast({ title: '网络错误', icon: 'none' })
            }
          })
        }
      }
    })
  },

  // ===== 导出Excel =====
  exportData() {
    wx.showLoading({ title: '正在生成...' })
    const { startDate, endDate, status, wasteName, wasteCode, department, device } = this.data

    wx.cloud.callFunction({
      name: 'exportExcel',
      data: { startDate, endDate, status, wasteName, wasteCode, department, device },
      success: res => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          wx.showModal({
            title: '导出成功',
            content: '文件链接已复制到剪贴板，可粘贴到浏览器下载',
            showCancel: false,
            success: () => { wx.setClipboardData({ data: res.result.fileID }) }
          })
        } else {
          wx.showToast({ title: '导出失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '导出失败', icon: 'none' })
      }
    })
  }
})