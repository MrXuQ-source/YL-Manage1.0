const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { id } = event
  if (!id) return { success: false, msg: '缺少ID' }

  try {
    const res = await db.collection('waste_dict').doc(id).remove()
    return { success: true, deleted: res.stats.removed }
  } catch (e) {
    console.error('删除失败:', e)
    return { success: false, msg: e.message }
  }
}
