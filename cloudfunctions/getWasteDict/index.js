const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const {
    keyword = '',
    category = '',
    department = '',
    device = '',
    page = 1,
    pageSize = 20
  } = event

  try {
    // 构造查询条件
    const where = {}
    if (category) where.category = category
    if (department) where.department = department
    if (device) where.device = device

    let collection = db.collection('waste_dict').where(where)

    // 关键词搜索（前端做不了模糊，这里用正则）
    if (keyword) {
      const reg = db.RegExp({ regexp: keyword, options: 'i' })
      // 多字段模糊匹配
      collection = db.collection('waste_dict').where(
        Object.assign({}, where, {
          $or: [
            { waste_name: reg },
            { waste_code: reg },
            { catalog_name: reg },
            { industry: reg },
            { source: reg }
          ]
        })
      )
    }

    // 总数
    const countRes = await collection.count()
    const total = countRes.total

    // 分页查询，按创建时间倒序
    const res = await collection
      .orderBy('create_time', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return { success: true, data: res.data, total }
  } catch (e) {
    console.error('查询失败:', e)
    return { success: false, msg: e.message, data: [], total: 0 }
  }
}
