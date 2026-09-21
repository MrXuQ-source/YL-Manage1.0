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
    date: '',
    departmentList: Object.keys(deviceMap),
    deviceList: [],
    selectedDepartment: '',
    selectedDevice: '',
    customDevice: '',
    selectedDepartmentIndex: -1,
    wasteList: [],
    wasteName: '',
    wasteCode: '',
    // 包装选项
    packageTypeOptions: ['桶', '箱', '编织袋','槽罐', '其他'],
    capacityOptions: ['≤25L', '50L', '200L', '1000L', '其他'],
    materialOptions: ['金属', '塑料', '复合材料', '其他材质'],
    packageTypeIndex: 0,
    capacityIndex: 0,
    materialIndex: 0,
    packageType: '铁桶',
    capacity: '≤25L',
    material: '金属',
    // 其他
    count: '',
    person: '',
    contact: '',
    destination: '危废暂存库'
  },

  onShow() {
    this.setData({ date: this.getToday() })
    this.loadWasteDict()
  },

  getToday() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  },

  // 加载危废字典
  loadWasteDict() {
    wx.cloud.callFunction({
      name: 'getWasteDict',
      success: res => {
        if (res.result && res.result.success) {
          this.setData({ wasteList: res.result.data })
        }
      },
      fail: err => {
        console.error('加载危废名称失败:', err)
      }
    })
  },

  // 运行部选择
  onDepartmentChange(e) {
    const index = parseInt(e.detail.value)
    const dept = this.data.departmentList[index]
    this.setData({
      selectedDepartment: dept,
      selectedDepartmentIndex: index,
      deviceList: deviceMap[dept] || [],
      selectedDevice: '',
      customDevice: ''
    })
  },

  // 装置下拉选择
  onDeviceChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      selectedDevice: this.data.deviceList[index],
      customDevice: ''
    })
  },

  // 手动输入装置
  onCustomDeviceInput(e) {
    this.setData({
      customDevice: e.detail.value,
      selectedDevice: ''
    })
  },

  // 危废选择
  onWasteNameTap() {
    const { wasteList } = this.data
    if (!wasteList || wasteList.length === 0) {
      wx.showToast({ title: '危废名称为空', icon: 'none' })
      return
    }
    const names = wasteList.map(item => item.waste_name || item.wasteName || '未知')
    wx.showActionSheet({
      itemList: names,
      success: (res) => {
        const selected = wasteList[res.tapIndex]
        this.setData({
          wasteName: selected.waste_name || selected.wasteName,
          wasteCode: selected.waste_code || selected.wasteCode
        })
      }
    })
  },

  // 包装类型选择
  onPackageTypeChange(e) {
    const idx = parseInt(e.detail.value)
    this.setData({
      packageTypeIndex: idx,
      packageType: this.data.packageTypeOptions[idx]
    })
  },

  // 包装容量选择
  onCapacityChange(e) {
    const idx = parseInt(e.detail.value)
    this.setData({
      capacityIndex: idx,
      capacity: this.data.capacityOptions[idx]
    })
  },

  // 包装材质选择
  onMaterialChange(e) {
    const idx = parseInt(e.detail.value)
    this.setData({
      materialIndex: idx,
      material: this.data.materialOptions[idx]
    })
  },

  onCountInput(e) { this.setData({ count: e.detail.value }) },
  onPersonInput(e) { this.setData({ person: e.detail.value }) },
  onContactInput(e) { this.setData({ contact: e.detail.value }) },

  // 提交
  submit() {
    const { selectedDepartment, selectedDevice, customDevice, wasteName, count, contact, person } = this.data
    const finalDevice = customDevice || selectedDevice
  
    if (!selectedDepartment || !finalDevice || !wasteName || !count) {
      wx.showToast({ title: '请填写带*的必填项', icon: 'none' })
      return
    }
    if (contact && !/^1[3-9]\d{9}$/.test(contact)) {
      wx.showToast({ title: '请输入正确的手机号码', icon: 'none' })
      return
    }
  
    wx.showLoading({ title: '提交中...' })
  
    // 注意：不再生成 batchNo，由云函数自动生成
  
    wx.cloud.callFunction({
      name: 'submitReport',
      data: {
        count: Number(count),
        // ← 删掉了 batchNo 这一行
        department: selectedDepartment,
        device: finalDevice,
        wasteName: wasteName,
        wasteCode: this.data.wasteCode,
        packageType: this.data.packageType,
        capacity: this.data.capacity,
        material: this.data.material,
        person: person,
        contact: contact,
        destination: this.data.destination,
        produceDate: this.data.date
      },
      success: res => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          wx.showToast({ title: `成功生成${count}条台账`, icon: 'success' })
          // 重置表单
          this.setData({
            selectedDepartment: '',
            selectedDepartmentIndex: -1,
            deviceList: [],
            selectedDevice: '',
            customDevice: '',
            wasteName: '',
            wasteCode: '',
            packageTypeIndex: 0,
            capacityIndex: 0,
            materialIndex: 0,
            packageType: '铁桶',
            capacity: '≤25L',
            material: '金属',
            count: '',
            person: '',
            contact: ''
          })
        } else {
          wx.showToast({ title: '提交失败: ' + (res.result ? res.result.msg : ''), icon: 'none' })
        }
      },
      fail: err => {
        wx.hideLoading()
        console.error('提交失败:', err)
        wx.showToast({ title: '提交失败', icon: 'none' })
      }
    })
  }
})