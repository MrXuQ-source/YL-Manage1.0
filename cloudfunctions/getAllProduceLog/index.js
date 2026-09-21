const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async () => {
  try {
    const res = await db.collection('produce_log').orderBy('create_time', 'desc').limit(500).get()
    return { success: true, data: res.data }
  } catch (err) {
    return { success: false, msg: err.message }
  }
}