const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 聚合去重取字段值
async function aggregateDistinct(field) {
  try {
    const res = await db.collection('waste_dict')
      .aggregate()
      .group({ _id: null, values: _.addToSet(`$${field}`) })
      .end()
    if (res.list && res.list.length > 0) {
      return res.list[0].values.filter(v => v && String(v).trim()).sort()
    }
    return []
  } catch (e) {
    // aggregate 不支持时降级为全量遍历
    console.error('聚合失败，降级:', e)
    const all = await db.collection('waste_dict').limit(1000).get()
    const set = new Set()
    all.data.forEach(d => { if (d[field]) set.add(d[field]) })
    return Array.from(set).sort()
  }
}

exports.main = async () => {
  try {
    const [categories, departments, devices] = await Promise.all([
      aggregateDistinct('category'),
      aggregateDistinct('department'),
      aggregateDistinct('device')
    ])

    // 统计数据
    const hwCountRes = await db.collection('waste_dict')
      .where({ category: db.RegExp({ regexp: '^HW', options: 'i' }) })
      .count()
    const normalCountRes = await db.collection('waste_dict')
      .where({ category: '一般固废' })
      .count()

    return {
      success: true,
      data: {
        categories,
        departments,
        devices,
        hwCount: hwCountRes.total,
        normalCount: normalCountRes.total
      }
    }
  } catch (e) {
    console.error('加载选项失败:', e)
    return { success: false, msg: e.message, data: { categories: [], departments: [], devices: [] } }
  }
}
