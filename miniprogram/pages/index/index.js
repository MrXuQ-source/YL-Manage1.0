console.log('【页面JS已加载】')
Page({
  data: {
    date: '',
    dept: '炼油一部',
    device: '1#1000万吨/年常压蒸馏装置',
    wasteName: '',
    wasteCode: '',
    packageType: '铁桶',
    capacity: '25L',
    material: '金属',
    count: '',
    person: '',
    contact: '',
    destination: '危废暂存库',
    batchNo: '',
    wasteList: [] // 存储危废字典数组
  },

  onShow() {
    console.log('【触发onShow，准备加载字典】')
    this.loadWasteDict();
  },

  // 加载危废字典
  loadWasteDict() {
    wx.cloud.callFunction({
      name: 'getWasteDict',
      success: res => {
        console.log('【字典云函数返回】', res)
        if (res.result.success && res.result.data.length > 0) {
          this.setData({ wasteList: res.result.data })
        } else {
          wx.showToast({ title: '危废字典为空', icon: 'none' })
        }
      },
      fail: err => {
        console.error('【调用字典云函数失败】', err)
        wx.showToast({ title: '字典加载失败', icon: 'none' })
      }
    })
  },

  // 点击选择危废
  onWasteNameTap() {
    const { wasteList } = this.data
    if (wasteList.length === 0) {
      wx.showToast({ title: '危废字典为空', icon: 'none' })
      return
    }
    // 提取名称数组用于底部弹窗
    const names = wasteList.map(item => item.waste_name)
    wx.showActionSheet({
      itemList: names,
      success: (res) => {
        const selected = wasteList[res.tapIndex]
        this.setData({
          wasteName: selected.waste_name,
          wasteCode: selected.waste_code
        })
      }
    })
  },

  // 其他输入绑定（示例）
  onCountInput(e) { this.setData({ count: e.detail.value }) },
  onPersonInput(e) { this.setData({ person: e.detail.value }) },
  onContactInput(e) { this.setData({ contact: e.detail.value }) },
  onBatchInput(e) { this.setData({ batchNo: e.detail.value }) },

  submit() {
    // 提交逻辑...
  }
})