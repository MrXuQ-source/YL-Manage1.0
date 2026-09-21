// 危险特性中文说明
const hazardMap = {
  T: '毒性', C: '腐蚀性', I: '易燃性', R: '反应性', In: '感染性'
}

Page({
  data: {
    list: [],
    keyword: '',
    category: '',
    department: '',
    device: '',

    // picker 数据
    categoryList: [],
    categoryIndex: 0,
    currentCategory: '',
    departmentList: [''],
    departmentIndex: 0,
    currentDepartment: '',
    deviceList: [''],
    deviceIndex: 0,
    currentDevice: '',

    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    total: 0,
    hwCount: 0,
    normalCount: 0,
    hazardText: hazardMap,

    // ===== 编辑相关 =====
    showEdit: false,
    editId: '',
    editField: '',
    editFieldLabel: '',
    editValue: '',
    hazardSelected: [],
    selectedStr: ',',
    saving: false,

    // ===== 危险特性选项 =====
    hazardOptions: [
      { value: 'T', name: '毒性' },
      { value: 'C', name: '腐蚀性' },
      { value: 'I', name: '易燃性' },
      { value: 'R', name: '反应性' },
      { value: 'In', name: '感染性' }
    ],

    // ===== 新增相关 =====
    showAdd: false,
    savingAdd: false,
    addCategoryIndex: 0,
    addDepartmentIndex: 0,
    addDeviceIndex: 0,
    addHazardStr: ',',
    addData: {
      waste_name: '',
      category: '',
      department: '',
      device: '',
      waste_code: '',
      hazard: '',
      source: '',
      catalog_name: '',
      industry: ''
    },
    categoryOptions: []
  },

  onShow() {
    if (!this._inited) {
      this._inited = true
      this.loadFilterOptions()
      this.loadData(true)
    } else {
      // 回到页面时刷新统计
      this.loadFilterOptions()
    }
  },

  // 供 WXML 调用：T,C → 毒性,腐蚀性
  hazardLabel(codeStr) {
    if (!codeStr) return ''
    return codeStr.split(',')
      .map(s => s.trim())
      .map(c => (hazardMap[c] || ''))
      .filter(Boolean)
      .join(',')
  },

  // ===== 加载筛选选项 =====
  loadFilterOptions() {
    wx.cloud.callFunction({
      name: 'getWasteDictOptions',
      success: res => {
        if (res.result && res.result.success) {
          const o = res.result.data
          this.setData({
            categoryList: ['', ...(o.categories || [])],
            departmentList: ['', ...(o.departments || [])],
            deviceList: ['', ...(o.devices || [])],
            categoryOptions: o.categories || [],
            hwCount: o.hwCount || 0,
            normalCount: o.normalCount || 0
          })
        }
      },
      fail: err => console.error('加载筛选选项失败:', err)
    })
  },

  // ===== 加载列表 =====
  loadData(reset = false) {
    if (reset) {
      this.setData({ page: 1, list: [], hasMore: true })
    }
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ loading: true })

    wx.cloud.callFunction({
      name: 'getWasteDict',
      data: {
        keyword: this.data.keyword,
        category: this.data.currentCategory,
        department: this.data.currentDepartment,
        device: this.data.currentDevice,
        page: this.data.page,
        pageSize: this.data.pageSize
      },
      success: res => {
        if (res.result && res.result.success) {
          const newList = reset ? res.result.data : this.data.list.concat(res.result.data)
          this.setData({
            list: newList,
            total: res.result.total || 0,
            page: this.data.page + 1,
            hasMore: newList.length < (res.result.total || 0)
          })
        } else {
          wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' })
        }
      },
      fail: err => {
        console.error('加载列表失败:', err)
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => this.setData({ loading: false })
    })
  },

  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadData(false)
    }
  },

  // ===== 输入 =====
  onKeywordInput(e) { this.setData({ keyword: e.detail.value }) },

  onCategoryChange(e) {
    const idx = Number(e.detail.value)
    this.setData({
      categoryIndex: idx,
      currentCategory: this.data.categoryList[idx] || ''
    })
  },
  onDepartmentChange(e) {
    const idx = Number(e.detail.value)
    this.setData({
      departmentIndex: idx,
      currentDepartment: this.data.departmentList[idx] || ''
    })
  },
  onDeviceChange(e) {
    const idx = Number(e.detail.value)
    this.setData({
      deviceIndex: idx,
      currentDevice: this.data.deviceList[idx] || ''
    })
  },

  // ===== 查询/重置 =====
  onSearch() {
    this.loadData(true)
  },
  onReset() {
    this.setData({
      keyword: '',
      categoryIndex: 0, currentCategory: '',
      departmentIndex: 0, currentDepartment: '',
      deviceIndex: 0, currentDevice: ''
    })
    this.loadData(true)
  },

  // ===== 导入名录 =====
  onImportTap() {
    wx.showActionSheet({
      itemList: ['全量导入（清空后重写）', '增量导入（跳过已存在）'],
      success: r => {
        const mode = r.tapIndex === 0 ? 'replace' : 'append'
        wx.showLoading({ title: '导入中...' })
        wx.cloud.callFunction({
          name: 'importDeviceWasteToDict',
          data: { mode },
          success: res => {
            wx.hideLoading()
            if (res.result && res.result.success) {
              wx.showToast({ title: `导入${res.result.inserted}条`, icon: 'success' })
              this.loadFilterOptions()
              this.loadData(true)
            } else {
              wx.showToast({ title: res.result.msg || '导入失败', icon: 'none' })
            }
          },
          fail: err => {
            wx.hideLoading()
            wx.showToast({ title: '调用失败', icon: 'none' })
            console.error(err)
          }
        })
      }
    })
  },

  // ===== 删除 =====
  onDelete(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.showModal({
      title: '确认删除',
      content: '确定删除这条记录吗？',
      success: r => {
        if (r.confirm) {
          wx.showLoading({ title: '删除中...' })
          wx.cloud.callFunction({
            name: 'deleteWasteDict',
            data: { id },
            success: res => {
              wx.hideLoading()
              if (res.result && res.result.success) {
                wx.showToast({ title: '已删除', icon: 'success' })
                this.loadData(true)
              } else {
                wx.showToast({ title: res.result.msg || '删除失败', icon: 'none' })
              }
            },
            fail: err => {
              wx.hideLoading()
              console.error('调用失败:', err)
              wx.showToast({ title: '调用失败', icon: 'none' })
            }
          })
        }
      }
    })
  },

  // ===== 编辑相关 =====
  onOpenEdit(e) {
    const id = e.currentTarget.dataset.id
    const field = e.currentTarget.dataset.field || ''
    if (!id || !field) return

    const item = this.data.list.find(d => d._id === id) || {}
    const labelMap = {
      waste_name: '固废名称',
      waste_code: '废物代码',
      source: '产污环节',
      catalog_name: '名录名称',
      industry: '行业来源',
      hazard: '危险特性',
      category: '危废类别'
    }

    const hazardArr = field === 'hazard'
      ? String(item[field] || '').split(',').map(s => s.trim()).filter(Boolean)
      : []

    this.setData({
      showEdit: true,
      editId: id,
      editField: field,
      editFieldLabel: labelMap[field] || '内容',
      editValue: field === 'hazard' ? hazardArr.join(',') : (item[field] || ''),
      hazardSelected: hazardArr,
      selectedStr: ',' + hazardArr.join(',') + ','
    })
  },

  onEditValueInput(e) {
    this.setData({ editValue: e.detail.value })
  },

  // 危险特性多选
  onToggleHazard(e) {
    const code = e.currentTarget.dataset.value || e.target.dataset.value
    if (!code) return
    const list = (this.data.hazardSelected || []).slice()
    const idx = list.indexOf(code)
    if (idx >= 0) list.splice(idx, 1)
    else list.push(code)

    this.setData({
      hazardSelected: list,
      editValue: list.join(','),
      selectedStr: ',' + list.join(',') + ','
    })
  },

  onClearHazard() {
    this.setData({ hazardSelected: [], editValue: '', selectedStr: ',' })
  },

  onSelectCategory(e) {
    this.setData({ editValue: e.currentTarget.dataset.value })
  },

  onCloseEdit() {
    this.setData({ showEdit: false, saving: false })
  },

  onSaveEdit() {
    const { editId, editField, editValue } = this.data
    if (!editId || !editField) return

    if (editField === 'hazard' && editValue && !/^[TCIRIn](,[TCIRIn])*$/.test(editValue)) {
      wx.showToast({ title: '特性格式错误，如 T 或 T,C', icon: 'none' })
      return
    }
    if (editField === 'waste_code' && editValue && !/^\d{3}-\d{3}-\d{2}$/.test(editValue)) {
      wx.showToast({ title: '代码格式应为 251-006-08', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    wx.showLoading({ title: '保存中...' })

    wx.cloud.callFunction({
      name: 'updateWasteDict',
      data: { id: editId, field: editField, value: editValue },
      success: res => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          wx.showToast({ title: '修改成功', icon: 'success' })
          this.onCloseEdit()
          const list = this.data.list.map(d => {
            if (d._id === editId) return Object.assign({}, d, { [editField]: editValue })
            return d
          })
          this.setData({ list })
        } else {
          wx.showToast({ title: res.result.msg || '修改失败', icon: 'none' })
        }
      },
      fail: err => {
        wx.hideLoading()
        console.error('保存失败:', err)
        wx.showToast({ title: '调用失败', icon: 'none' })
      },
      complete: () => this.setData({ saving: false })
    })
  },

  // ===== 新增相关 =====
  onOpenAdd() {
    // 打开时重置表单
    this.setData({
      showAdd: true,
      savingAdd: false,
      addCategoryIndex: 0,
      addDepartmentIndex: 0,
      addDeviceIndex: 0,
      addHazardStr: ',',
      addData: {
        waste_name: '',
        category: '',
        department: '',
        device: '',
        waste_code: '',
        hazard: '',
        source: '',
        catalog_name: '',
        industry: ''
      }
    })
  },

  onCloseAdd() {
    this.setData({ showAdd: false, savingAdd: false })
  },

  // 新增表单输入（用 data-field 区分字段）
  onAddInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`addData.${field}`]: value
    })
  },

  onAddCategoryChange(e) {
    const idx = Number(e.detail.value)
    this.setData({
      addCategoryIndex: idx,
      'addData.category': this.data.categoryOptions[idx] || ''
    })
  },
  onAddDepartmentChange(e) {
    const idx = Number(e.detail.value)
    this.setData({
      addDepartmentIndex: idx,
      'addData.department': this.data.departmentList[idx] || ''
    })
  },
  onAddDeviceChange(e) {
    const idx = Number(e.detail.value)
    this.setData({
      addDeviceIndex: idx,
      'addData.device': this.data.deviceList[idx] || ''
    })
  },

  // 新增页危险特性多选
  onAddToggleHazard(e) {
    const code = e.currentTarget.dataset.value || e.target.dataset.value
    if (!code) return
    const arr = this.data.addHazardStr === ',' ? [] : this.data.addHazardStr.slice(1, -1).split(',')
    const idx = arr.indexOf(code)
    if (idx >= 0) arr.splice(idx, 1)
    else arr.push(code)
    this.setData({
      addHazardStr: ',' + arr.join(',') + ',',
      'addData.hazard': arr.join(',')
    })
  },

  // 校验必填
  validateAdd() {
    const d = this.data.addData
    if (!d.waste_name || !d.waste_name.trim()) {
      wx.showToast({ title: '请填写固废名称', icon: 'none' }); return false
    }
    if (!d.category) {
      wx.showToast({ title: '请选择危废类别', icon: 'none' }); return false
    }
    if (!d.department) {
      wx.showToast({ title: '请选择部门', icon: 'none' }); return false
    }
    if (!d.device) {
      wx.showToast({ title: '请选择装置', icon: 'none' }); return false
    }
    if (d.waste_code && !/^\d{3}-\d{3}-\d{2}$/.test(d.waste_code)) {
      wx.showToast({ title: '代码格式应为 251-006-08', icon: 'none' }); return false
    }
    if (d.hazard && !/^[TCIRIn](,[TCIRIn])*$/.test(d.hazard)) {
      wx.showToast({ title: '危险特性格式错误', icon: 'none' }); return false
    }
    return true
  },

  onSaveAdd() {
    if (!this.validateAdd()) return

    const d = this.data.addData
    // 构造入库数据，去掉空值
    const data = {
      waste_name: d.waste_name.trim(),
      category: d.category,
      department: d.department,
      device: d.device,
      waste_code: d.waste_code || '',
      hazard: d.hazard || '',
      source: d.source || '',
      catalog_name: d.catalog_name || '',
      industry: d.industry || '',
      _source: 'manual'   // 标记为手动新增，区别于导入数据
    }

    this.setData({ savingAdd: true })
    wx.showLoading({ title: '新增中...' })

    wx.cloud.callFunction({
      name: 'addWasteDict',
      data,
      success: res => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          wx.showToast({ title: '新增成功', icon: 'success' })
          this.onCloseAdd()
          // 刷新列表与统计
          this.loadFilterOptions()
          this.loadData(true)
        } else {
          wx.showToast({ title: res.result.msg || '新增失败', icon: 'none' })
        }
      },
      fail: err => {
        wx.hideLoading()
        console.error('新增失败:', err)
        wx.showToast({ title: '调用失败', icon: 'none' })
      },
      complete: () => this.setData({ savingAdd: false })
    })
  }
})
