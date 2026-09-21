const db = wx.cloud.database()

const facilityData = {
  "炼油一部": ["1#1000万吨/年常压蒸馏装置","2#1000万吨/年常减压蒸馏装置","1#2#LPG回收装置","1#2#脱硫脱硫醇装置","1#2#轻烃回收装置","渣油制氢气化装置","渣油制氢净化装置","溶剂脱沥青装置","气化滤饼金属回收"],
  "炼油二部": ["蜡煤油加氢装置","柴油加氢装置","浆态床渣油加氢装置","渣油加氢装置"],
  "炼油三部": ["400万吨/年催化裂解装置","3#脱硫脱硫醇装置","1#160万吨/年气体分馏装置","100万吨/年裂解汽油加氢装置","80万吨/年芳烃抽提装置","65万吨/年碳二回收装置","300万吨/年催化裂化装置","4#脱硫脱硫醇装置","2#70万吨/年气体分馏装置","S Zorb"],
  "炼油四部": ["260万吨/年石脑油加氢装置","1#260万吨/年连续重整装置","2#260万吨/年连续重整装置","变压吸附氢气提纯装置","1#芳烃联合（过渡工况）装置","2#芳烃联合装置"],
  "炼油五部": ["酸性水汽提装置","溶剂再生装置","硫磺回收及尾气处理装置"],
  "炼油六部": ["MTBE","烷基化及废酸再生","烷烯分离","顺酐"],
  "化工一部": ["1#2#汽油加氢装置","1#2#芳烃抽提装置","1#2#丁二烯装置","1#2#MTBE/丁烯-1装置","1#乙烯装置","2#乙烯装置"],
  "化工二部": ["1#FDPE","2#FDPE","1#HDPE","2#HDPE","UHMWPE"],
  "化工三部": ["1#2#PP","3#4#PP","5#PP+RTO"],
  "化工四部": ["1#EVA/LDPE装置","2#EVA/LDPE装置","醋酸乙烯装置","10/100万吨/年EO/EG装置"],
  "化工五部": ["26万吨/年丙烯腈装置","SAR装置","50万吨/年苯乙烯装置"],
  "化工六部": ["ABS装置","顺丁橡胶","溶聚丁苯橡胶"],
  "储运一部": ["岛外原油罐区","岛外成品罐区","炼油中间罐区","炼油轻烃罐区","碳四罐区"],
  "储运二部": ["球罐区","常压罐区","液氨卸车及罐区","装卸车","聚烯烃包装及仓库一","聚烯烃包装及仓库二","聚烯烃包装及仓库三","聚烯烃包装及仓库四","ABS包装及仓库"],
  "公用一部": ["雨水监控及事故水池、闭循、海水泵房、给水及消防加压泵站、制冷站、采暖站、除盐水站、除氧水站、凝结水站、热水站等"],
  "公用二部": ["煤制氢净化","煤制氢气化"],
  "公用三部": ["火炬及火炬气回收设施","系统管廊"],
  "检验计量中心": ["检验计量中心"],
  "电气中心": ["电气中心"]
}

Page({
  data: {
    todayDate: '',
    deptList: Object.keys(facilityData),
    deptIndex: -1,
    facilityList: [],
    facilityIndex: -1,
    facilitySearchText: '',
    showFacilityOptions: false,
    filteredFacilities: [],
    wasteList: [],
    wasteNames: [],
    wasteIndex: -1,
    wasteCode: '',
    wasteCategory: '',
    nationName: '',
    pkgTypes: ['塑料桶','铁桶','编织袋','吨袋','纸箱','槽罐','散装'],
    pkgTypeIndex: -1,
    capacityOptions: ['≤25L','50L','200L','1000L','其他'],
    capacityIndex: -1,
    materialOptions: ['金属','塑料','复合材料','其他'],
    materialIndex: -1,
    packageQty: '',
    personLiable: '',
    contact: '',
    destination: '危废暂存库'
  },

  onLoad() {
    const now = new Date()
    const dateStr = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')}`
    this.setData({ todayDate: dateStr })
    this.loadWasteDict()
  },

  // 加载危废字典（加 limit 消除全量查询警告）
  loadWasteDict() {
    db.collection('waste_dict').limit(100).get({
      success: (res) => {
        console.log('危废字典加载结果:', res.data)
        if (res.data && res.data.length > 0) {
          this.setData({
            wasteList: res.data,
            wasteNames: res.data.map(item => item.waste_name)
          })
        } else {
          console.warn('waste_dict 集合为空')
          wx.showToast({ title: '危废数据为空，请检查数据库', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('加载危废字典失败:', err)
        wx.showToast({ title: '加载危废数据失败，请检查权限', icon: 'none' })
      }
    })
  },

  onDeptChange(e) {
    const index = e.detail.value
    const dept = this.data.deptList[index]
    const facilityList = facilityData[dept] || []
    this.setData({
      deptIndex: index,
      facilityList: facilityList,
      facilityIndex: -1,
      facilitySearchText: '',
      filteredFacilities: facilityList,
      showFacilityOptions: false
    })
  },

  onFacilitySearchInput(e) {
    const text = e.detail.value
    let filtered = this.data.facilityList
    if (text) { filtered = this.data.facilityList.filter(item => item.indexOf(text) >= 0) }
    this.setData({ facilitySearchText: text, filteredFacilities: filtered, showFacilityOptions: true, facilityIndex: -1 })
  },

  onSelectFacility(e) {
    const name = e.currentTarget.dataset.name
    this.setData({ facilitySearchText: name, showFacilityOptions: false, facilityIndex: this.data.facilityList.indexOf(name) })
  },

  onFacilityFocus() {
    this.setData({ showFacilityOptions: true, filteredFacilities: this.data.facilityList })
  },

  onWasteChange(e) {
    const index = e.detail.value
    const wasteList = this.data.wasteList

    if (!wasteList || wasteList.length === 0 || index >= wasteList.length) {
      console.warn('危废列表为空或索引异常', index)
      return
    }

    const waste = wasteList[index]
    if (!waste) return

    this.setData({
      wasteIndex: index,
      wasteCode: waste.waste_code || '',
      wasteCategory: waste.waste_category || '',
      nationName: waste.nation_name || '',
      wasteName: waste.waste_name || ''
    })
    console.log('已选择危废:', waste)
  },

  onPkgTypeChange(e) { this.setData({ pkgTypeIndex: e.detail.value }) },
  onCapacityChange(e) { this.setData({ capacityIndex: e.detail.value }) },
  onMaterialChange(e) { this.setData({ materialIndex: e.detail.value }) },
  onPackageInput(e) { this.setData({ packageQty: e.detail.value }) },
  onPersonInput(e) { this.setData({ personLiable: e.detail.value }) },
  onContactInput(e) { this.setData({ contact: e.detail.value }) },
  onDestinationInput(e) { this.setData({ destination: e.detail.value }) },

  getVolCode(index) { const map = ['1','2','3','4','9']; return map[index] || '9' },
  getMatCode(index) { const map = ['1','2','3','9']; return map[index] || '9' },

  submitProduce() {
    const { deptIndex, deptList, facilitySearchText, wasteList, wasteIndex, wasteCode,
            packageQty, pkgTypeIndex, pkgTypes, capacityIndex, materialIndex, personLiable, contact, destination } = this.data

    if (deptIndex < 0) { wx.showToast({ title: '请选择运行部', icon: 'none' }); return }
    if (!facilitySearchText) { wx.showToast({ title: '请选择或输入产废装置', icon: 'none' }); return }
    if (wasteIndex < 0) { wx.showToast({ title: '请选择危废', icon: 'none' }); return }
    if (!packageQty || packageQty < 1) { wx.showToast({ title: '包装数量至少1', icon: 'none' }); return }
    if (pkgTypeIndex < 0) { wx.showToast({ title: '请选择包装类型', icon: 'none' }); return }
    if (capacityIndex < 0) { wx.showToast({ title: '请选择包装容量', icon: 'none' }); return }
    if (materialIndex < 0) { wx.showToast({ title: '请选择包装材质', icon: 'none' }); return }
    if (!personLiable) { wx.showToast({ title: '请输入责任人', icon: 'none' }); return }
    if (!contact) { wx.showToast({ title: '请输入联系方式', icon: 'none' }); return }

    const dept = deptList[deptIndex]
    const waste = wasteList[wasteIndex]
    const pkgType = pkgTypes[pkgTypeIndex]
    const volCode = this.getVolCode(capacityIndex)
    const matCode = this.getMatCode(materialIndex)
    const containerPrefix = `${volCode}${matCode}`

    // 数据规整：严格转换类型，避免任何 startsWith 或类型报错
    const qtyNum = Number(packageQty)
    if (isNaN(qtyNum) || qtyNum <= 0) { wx.showToast({ title: '包装数量无效', icon: 'none' }); return }

    wx.showLoading({ title: '生成中...' })

    wx.cloud.callFunction({
      name: 'createProduceBatch',
      data: {
        dept: String(dept),
        point_name: String(facilitySearchText),
        waste_name: String(waste.waste_name),
        waste_category: String(waste.waste_category || ''),
        waste_code: String(wasteCode),
        nation_name: String(waste.nation_name || ''),
        pkg_type: String(pkgType),
        pkg_capacity: String(this.data.capacityOptions[capacityIndex]),
        pkg_material: String(this.data.materialOptions[materialIndex]),
        //container_prefix: String(containerPrefix),
        pkg_qty: qtyNum,
        handler: String(personLiable),
        contact: String(contact),
        destination: String(destination || '危废暂存库'),
        create_by: getApp().globalData.openid || 'unknown'
      },
      success: (res) => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          wx.showModal({
            title: '生成成功',
            content: `运行部：${dept}\n产废装置：${facilitySearchText}\n批次：${res.result.batch_no}\n共生成${qtyNum}条记录`,
            confirmText: '继续填报',
            cancelText: '返回',
            success: (modalRes) => {
              if (modalRes.cancel) { wx.navigateBack() }
              else { this.resetForm() }
            }
          })
        } else {
          wx.showToast({ title: (res.result && res.result.errMsg) || '生成失败', icon: 'none', duration: 3000 })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('云函数调用失败:', err)
        wx.showModal({ title: '提交失败', content: JSON.stringify(err), showCancel: false })
      }
    })
  },

  resetForm() {
    this.setData({
      deptIndex: -1, facilityList: [], facilityIndex: -1, facilitySearchText: '',
      showFacilityOptions: false, wasteIndex: -1, wasteCode: '', wasteCategory: '', nationName: '',
      pkgTypeIndex: -1, capacityIndex: -1, materialIndex: -1, packageQty: '', personLiable: '',
      contact: '', destination: '危废暂存库'
    })
  }
})