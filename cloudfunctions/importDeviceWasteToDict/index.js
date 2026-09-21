const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 这里放 505 条装置危废清单（导入时按实际数据调整）
// 示例数据结构，实际以你整理的名录为准
const DATA = [
  // {
  //   waste_name: '酯化不溶物',
  //   waste_code: '900-016-13',
  //   category: 'HW13',
  //   department: '化工四部',
  //   device: '10万吨/年甲基丙烯酸甲酯（MMA）装置',
  //   source: '酯化反应釜定期清釜产生',
  //   catalog_name: '...',
  //   industry: '基础化学原料制造',
  //   hazard: 'T'
  // },
]

exports.main = async (event = {}) => {
  const { mode = 'append' } = event  // replace | append

  try {
    // replace 模式：先清空手动新增之外的数据（或全部，按 _source 区分）
    if (mode === 'replace') {
      const all = await db.collection('waste_dict')
        .where({ _source: 'device_waste_list_2026' })
        .get()
      // 批量删除
      for (const doc of all.data) {
        await db.collection('waste_dict').doc(doc._id).remove()
      }
    }

    // 去重：按 waste_name + department + device 判断
    let inserted = 0
    let skipped = 0
    for (const item of DATA) {
      const exist = await db.collection('waste_dict')
        .where({
          waste_name: item.waste_name,
          department: item.department || '',
          device: item.device || ''
        })
        .count()

      if (exist.total > 0) {
        skipped++
        continue
      }

      await db.collection('waste_dict').add({
        data: Object.assign({}, item, {
          _source: 'device_waste_list_2026',
          create_time: db.serverDate(),
          update_time: db.serverDate()
        })
      })
      inserted++
    }

    return { success: true, inserted, skipped, msg: `新增${inserted}条，跳过${skipped}条` }
  } catch (e) {
    console.error('导入失败:', e)
    return { success: false, msg: e.message }
  }
}
