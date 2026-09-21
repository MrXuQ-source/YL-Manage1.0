const deviceMap = {
  "炼油一部": ["1#1000万吨/年常压蒸馏装置", "2#1000万吨/年常减压蒸馏装置", "1#2#LPG回收装置", "1#2#脱硫脱硫醇装置", "1#2#轻烃回收装置", "渣油制氢气化装置", "渣油制氢净化装置", "溶剂脱沥青装置", "气化滤饼金属回收"],
  "炼油二部": ["蜡煤油加氢装置", "柴油加氢装置", "浆态床渣油加氢装置", "渣油加氢装置"],
  "炼油三部": ["400万吨/年催化裂解装置", "3#脱硫脱硫醇装置", "1#160万吨/年气体分馏装置", "100万吨/年裂解汽油加氢装置", "80万吨/年芳烃抽提装置", "65万吨/年碳二回收装置", "300万吨/年催化裂化装置", "4#脱硫脱硫醇装置", "2#70万吨/年气体分馏装置", "S Zorb"],
  "炼油四部": ["260万吨/年石脑油加氢装置", "1#260万吨/年连续重整装置", "2#260万吨/年连续重整装置", "变压吸附氢气提纯装置", "1#芳烃联合（过渡工况）装置", "2#芳烃联合装置"],
  "炼油五部": ["酸性水汽提装置", "溶剂再生装置", "硫磺回收及尾气处理装置"],
  "炼油六部": ["MTBE", "烷基化及废酸再生", "烷烯分离", "顺酐"],
  "化工一部": ["1#2#汽油加氢装置", "1#2#芳烃抽提装置", "1#2#丁二烯装置", "1#2#MTBE/丁烯-1装置", "1#乙烯装置", "2#乙烯装置"],
  "化工二部": ["1#FDPE", "2#FDPE", "1#HDPE", "2#HDPE", "UHMWPE"],
  "化工三部": ["1#2#PP", "3#4#PP", "5#PP+RTO"],
  "化工四部": ["1#EVA/LDPE装置", "2#EVA/LDPE装置", "醋酸乙烯装置", "10/100万吨/年EO/EG装置"],
  "化工五部": ["26万吨/年丙烯腈装置", "SAR装置", "50万吨/年苯乙烯装置"],
  "化工六部": ["ABS装置", "顺丁橡胶", "溶聚丁苯橡胶"],
  "储运一部": ["岛外原油罐区", "岛外成品罐区", "炼油中间罐区", "炼油轻烃罐区", "碳四罐区"],
  "储运二部": ["球罐区", "常压罐区", "液氨卸车及罐区", "装卸车", "聚烯烃包装及仓库一", "聚烯烃包装及仓库二", "聚烯烃包装及仓库三", "聚烯烃包装及仓库四", "ABS包装及仓库"],
  "公用一部": ["雨水监控及事故水池、闭循、海水泵房、给水及消防加压泵站、制冷站、采暖站、除盐水站、除氧水站、凝结水站、热水站等"],
  "公用二部": ["煤制氢净化", "煤制氢气化"],
  "公用三部": ["火炬及火炬气回收设施", "系统管廊"],
  "检验计量中心": ["检验计量中心"],
  "电气中心": ["电气中心"]
}

Page({
  data: {
    // 筛选
    startDate: '',
    endDate: '',
    statusFilter: 0,  // 0=全部 1=在库 2=出库
    statusOptions: ['全部', '在库', '出库'],
    wasteNameFilter: '',
    wasteCodeFilter: '',
    departmentList: Object.keys(deviceMap),
    deviceList: [],
    selectedDepartment: '',
    selectedDepartmentIndex: -1,
    selectedDevice: '',
    // 列表
    allList: [],
    filteredList: [],
    totalCount: 0
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    wx.cloud.callFunction({
      name: 'getAllProduceLog',
      success: res => {
        if (res.result && res.result.success) {
          this.setData({ allList: res.result.data })
          this.filterList()
        }
      }
    })
  },

  // 筛选条件变化
  onStartDateChange(e) { this.setData({ startDate: e.detail.value }); this.filterList() },
  onEndDateChange(e) { this.setData({ endDate: e.detail.value }); this.filterList() },
  onStatusChange(e) { this.setData({ statusFilter: parseInt(e.detail.value) }); this.filterList() },
  onWasteNameInput(e) { this.setData({ wasteNameFilter: e.detail.value }); this.filterList() },
  onWasteCodeInput(e) { this.setData({ wasteCodeFilter: e.detail.value }); this.filterList() },

  onDeptChange(e) {
    const idx = parseInt(e.detail.value)
    const dept = this.data.departmentList[idx]
    this.setData({
      selectedDepartment: dept,
      selectedDepartmentIndex: idx,
      deviceList: deviceMap[dept] || [],
      selectedDevice: ''
    })
    this.filterList()
  },

  onDeviceChange(e) {
    const idx = parseInt(e.detail.value)
    this.setData({ selectedDevice: this.data.deviceList[idx] })
    this.filterList()
  },

  // 筛选逻辑
  filterList() {
    let list = [...this.data.allList]
    const { startDate, endDate, statusFilter, wasteNameFilter, wasteCodeFilter, selectedDevice } = this.data

    if (startDate) list = list.filter(i => i.produce_date_str >= startDate)
    if (endDate) list = list.filter(i => i.produce_date_str <= endDate)
    if (statusFilter > 0) list = list.filter(i => i.status === statusFilter)
    if (wasteNameFilter) list = list.filter(i => i.waste_name && i.waste_name.includes(wasteNameFilter))
    if (wasteCodeFilter) list = list.filter(i => i.waste_code && i.waste_code.includes(wasteCodeFilter))
    if (selectedDevice) list = list.filter(i => i.device === selectedDevice)

    this.setData({ filteredList: list, totalCount: list.length })
  },

  // 出库操作
  outStock(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认出库',
      content: '确定将该条记录标记为已出库？',
      success: res => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          wx.cloud.callFunction({
            name: 'updateOutStock',
            data: { id },
            success: () => { wx.hideLoading(); wx.showToast({ title: '出库成功' }); this.loadData() },
            fail: () => { wx.hideLoading(); wx.showToast({ title: '操作失败', icon: 'none' }) }
          })
        }
      }
    })
  },

  // 导出Excel
  onExport() {
    const { startDate, endDate, statusFilter, wasteNameFilter, wasteCodeFilter, selectedDevice } = this.data
    if (!startDate || !endDate) {
      wx.showToast({ title: '请先选择开始和结束日期', icon: 'none' })
      return
    }
    wx.showLoading({ title: '生成Excel中...' })
    wx.cloud.callFunction({
      name: 'exportExcel',
      data: {
        startDate, endDate,
        status: statusFilter > 0 ? statusFilter : '',
        wasteName: wasteNameFilter,
        wasteCode: wasteCodeFilter,
        device: selectedDevice
      },
      success: res => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          wx.cloud.downloadFile({
            fileID: res.result.fileID,
            success: dl => {
              wx.openDocument({ filePath: dl.tempFilePath, showMenu: true })
            },
            fail: err => { console.error(err); wx.showToast({ title: '下载失败', icon: 'none' }) }
          })
        } else {
          wx.showToast({ title: '导出失败', icon: 'none' })
        }
      },
      fail: () => { wx.hideLoading(); wx.showToast({ title: '导出失败', icon: 'none' }) }
    })
  },

  onReset() {
    this.setData({
      startDate: '', endDate: '', statusFilter: 0,
      wasteNameFilter: '', wasteCodeFilter: '',
      selectedDepartment: '', selectedDevice: '', deviceList: [], selectedDepartmentIndex: -1
    })
    this.filterList()
  }
})