const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const {
    waste_name, category, department, device,
    waste_code = '', hazard = '', source = '',
    catalog_name = '', industry = '', _source = 'manual'
  } = event

  // ===== 必填校验 =====
  if (!waste_name || !waste_name.trim()) {
    return { success: false, msg: '固废名称不能为空' }
  }
  if (!category) return { success: false, msg: '危废类别不能为空' }
  if (!department) return { success: false, msg: '部门不能为空' }
  if (!device) return { success: false, msg: '装置不能为空' }

  // ===== 格式校验 =====
  if (waste_code && !/^\d{3}-\d{3}-\d{2}$/.test(waste_code)) {
    return { success: false, msg: '废物代码格式错误，应为 251-006-08' }
  }
  if (hazard && !/^[TCIRIn](,[TCIRIn])*$/.test(hazard)) {
    return { success: false, msg: '危险特性格式错误' }
  }

  try {
    // 查重：同部门+同装置+同名+同代码视为重复（代码为空时只比前三个）
    const where = {
      waste_name: waste_name.trim(),
      department,
      device
    }
    if (waste_code) where.waste_code = waste_code

    const exist = await db.collection('waste_dict').where(where).count()
    if (exist.total > 0) {
      return { success: false, msg: '该条目已存在，请勿重复添加' }
    }

    const res = await db.collection('waste_dict').add({
      data: {
        waste_name: waste_name.trim(),
        category,
        department,
        device,
        waste_code,
        hazard,
        source,
        catalog_name,
        industry,
        _source,
        create_time: db.serverDate(),
        update_time: db.serverDate()
      }
    })

    return { success: true, id: res.id, msg: '新增成功' }
  } catch (e) {
    console.error('新增失败:', e)
    return { success: false, msg: e.message || '新增失败' }
  }
}
