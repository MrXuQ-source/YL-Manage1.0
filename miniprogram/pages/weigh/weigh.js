Page({
  data: {
    startDate: '',
    endDate: '',
    department: '',
    device: '',
    activeTab: 0,
    list: [],
    totalWaiting: 0,
    totalWeighed: 0,

    // 自定义弹窗相关数据
    showWeighModal: false,
    currentId: '',
    currentBatch: '',
    inputWeight: '',
    isEditMode: false
  },

  onShow() {
    this.loadData()
  },

  // ===== 加载列表 =====
  loadData() {
    wx.showLoading({ title: '加载中...' })
    const { startDate, endDate, department, device, activeTab } = this.data
    const status = activeTab === 0 ? 0 : 1

    wx.cloud.callFunction({
      name: 'getDataList',
      data: { startDate, endDate, status, department, device, limit: 50 },
      success: res => {
        wx.hideLoading()
        console.log('称重页返回数据:', res.result)
        if (res.result && res.result.success) {
          this.setData({ list: res.result.data })
          if (activeTab === 0) {
            this.setData({ totalWaiting: res.result.data.length })
          } else {
            this.setData({ totalWeighed: res.result.data.length })
          }
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' })
        }
      },
      fail: err => {
        wx.hideLoading()
        console.error('加载失败:', err)
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  // ===== Tab 切换 =====
  switchTab(e) {
    const tab = Number(e.currentTarget.dataset.tab)
    this.setData({ activeTab: tab, list: [] }, () => {
      this.loadData()
    })
  },

  // ===== 点击称重按钮 → 打开自定义弹窗 =====
  goWeigh(e) {
    const id = e.currentTarget.dataset.id
    const batch = e.currentTarget.dataset.batch

    if (!id) {
      wx.showToast({ title: '数据ID缺失', icon: 'none' })
      return
    }

    this.setData({
      showWeighModal: true,
      currentId: id,
      currentBatch: batch || '-',
      inputWeight: '',
      isEditMode: false
    })
  },

  // ===== 点击修改重量 =====
  goEditWeight(e) {
    const id = e.currentTarget.dataset.id
    const batch = e.currentTarget.dataset.batch
    const oldWeight = e.currentTarget.dataset.weight

    if (!id) {
      wx.showToast({ title: '数据ID缺失', icon: 'none' })
      return
    }

    this.setData({
      showWeighModal: true,
      currentId: id,
      currentBatch: batch || '-',
      inputWeight: oldWeight ? String(oldWeight) : '',  // 回显当前重量
      isEditMode: true
    })
  },

  // ===== 输入重量 =====
  onWeightInput(e) {
    this.setData({ inputWeight: e.detail.value })
  },

  // ===== 关闭弹窗 =====
  closeWeighModal() {
    this.setData({ showWeighModal: false, inputWeight: '', isEditMode: false })
  },

  // ===== 确认按钮（首次称重 + 修改重量通用）=====
  confirmWeigh() {
    const { currentId, inputWeight, isEditMode } = this.data
    const weightStr = inputWeight.trim()

    if (!weightStr) {
      wx.showToast({ title: '重量不能为空', icon: 'none' })
      return
    }

    const weight = parseFloat(weightStr)
    if (isNaN(weight) || weight <= 0) {
      wx.showToast({ title: '请输入大于0的数字', icon: 'none' })
      return
    }

    this.setData({ showWeighModal: false })
    wx.showLoading({ title: '提交中...' })

    // 根据模式调用不同 action
    wx.cloud.callFunction({
      name: 'updateWeigh',
      data: {
        id: currentId,
        weight: weight,
        action: isEditMode ? 'editWeight' : 'weigh'
      },
      success: res => {
        wx.hideLoading()
        console.log('云函数返回:', res.result)
        if (res.result && res.result.success) {
          if (isEditMode) {
            // 修改重量
            wx.showToast({ title: '修改成功', icon: 'success' })
          } else {
            // 首次称重成功，弹窗显示入库编码
            const inboundNo = res.result.inboundNo || ''
            wx.showModal({
              title: '称重成功',
              content: `入库编码：${inboundNo}`,
              showCancel: false,
              confirmText: '确定',
              success: () => {
                this.setData({ isEditMode: false })
                this.loadData()
              }
            })
          }
        } else {
          wx.showToast({ title: res.result.msg || '操作失败', icon: 'none' })
        }
      },
      fail: err => {
        wx.hideLoading()
        console.error('云函数调用失败:', err)
        wx.showToast({ title: '网络错误，请检查云函数', icon: 'none' })
      }
    })
  },

  // ===== 删除记录 =====
  deleteItem(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条待称重记录吗？删除后不可恢复！',
      success: res => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          wx.cloud.callFunction({
            name: 'deleteProduceLog',
            data: { id: id },
            success: res => {
              wx.hideLoading()
              if (res.result && res.result.success) {
                wx.showToast({ title: '删除成功', icon: 'success' })
                this.loadData()
              } else {
                wx.showToast({ title: res.result.msg || '删除失败', icon: 'none' })
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

  // ===== 筛选 =====
  onStartDateChange(e) { this.setData({ startDate: e.detail.value }) },
  onEndDateChange(e) { this.setData({ endDate: e.detail.value }) },
  onDeptInput(e) { this.setData({ department: e.detail.value }) },
  onDeviceInput(e) { this.setData({ device: e.detail.value }) },

  resetFilter() {
    this.setData({ startDate: '', endDate: '', department: '', device: '' })
    this.loadData()
  }
})