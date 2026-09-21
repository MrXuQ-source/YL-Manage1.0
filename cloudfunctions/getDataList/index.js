const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { startDate, endDate, status, wasteName, wasteCode, department, device, limit = 50 } = event
  console.log('getDataList 收到参数:', event)

  let whereCondition = {}

  if (status !== undefined && status !== '' && status !== null) {
    whereCondition.status = Number(status)
  }
  if (wasteName && wasteName.trim() !== '') {
    whereCondition.wasteName = db.RegExp({ regexp: wasteName, options: 'i' })
  }
  if (wasteCode && wasteCode.trim() !== '') {
    whereCondition.wasteCode = db.RegExp({ regexp: wasteCode, options: 'i' })
  }
  if (department && department.trim() !== '') {
    whereCondition.department = db.RegExp({ regexp: department, options: 'i' })
  }
  if (device && device.trim() !== '') {
    whereCondition.device = db.RegExp({ regexp: device, options: 'i' })
  }
  if (startDate && endDate) {
    whereCondition.produceDate = _.gte(startDate).and(_.lte(endDate))
  }

  console.log('查询条件:', JSON.stringify(whereCondition))

  try {
    const res = await db.collection('produce_log')
      .where(whereCondition)
      .orderBy('createTime', 'desc')
      .limit(Number(limit))
      .get()
    console.log('查询到', res.data.length, '条')
    return { success: true, data: res.data, total: res.data.length }
  } catch (err) {
    console.error('查询失败:', err)
    return { success: false, msg: '查询失败', error: err }
  }
}