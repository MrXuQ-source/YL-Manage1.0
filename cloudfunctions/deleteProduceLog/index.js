const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { id } = event
  try {
    await db.collection('produce_log').doc(id).remove()
    return { success: true }
  } catch (err) {
    return { success: false, msg: err.message }
  }
}