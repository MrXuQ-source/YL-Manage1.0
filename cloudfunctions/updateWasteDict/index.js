const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { id, field, value } = event
  if (!id || !field) return { success: false, msg: '参数缺失' }

  // 安全白名单：只允许修改这些字段
  const allowFields = [
    'waste_name', 'waste_code', 'source',
    'catalog_name', 'industry', 'hazard', 'category'
  ]
  if (!allowFields.includes(field)) {
    return { success: false, msg: '该字段不允许修改' }
  }

  // 格式校验
  if (field === 'waste_code' && value && !/^\d{3}-\d{3}-\d{2}$/.test(value)) {
    return { success: false, msg: '废物代码格式错误，应为 251-006-08' }
  }
  if (field === 'hazard' && value && !/^[TCIRIn](,[TCIRIn])*$/.test(value)) {
    return { success: false, msg: '危险特性格式错误，如 T 或 T,C' }
  }

  try {
    const updateData = { [field]: value === '' ? null : value, update_time: db.serverDate() }
    const res = await db.collection('waste_dict').doc(id).update({ data: updateData })
    return { success: true, updated: res.stats.updated }
  } catch (e) {
    console.error('更新失败:', e)
    return { success: false, msg: e.message }
  }
}
