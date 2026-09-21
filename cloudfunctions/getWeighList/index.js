const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { startDate, endDate, department, device } = event
  let query = {}

  if (startDate && endDate) {
    query.produce_date_str = db.command.gte(startDate).and(db.command.lte(endDate))
  }
  if (department) query.department = department
  if (device) query.device = device

  try {
    const res = await db.collection('produce_log')
      .where(query)
      .orderBy('create_time', 'desc')
      .get()
      console.log('查询结果:', res.data) // ← 加这行调试
    return { success: true, data: res.data }
  } catch (err) {
    return { success: false, msg: err.message }
  }
}