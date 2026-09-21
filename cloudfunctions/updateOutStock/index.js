const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 格式化日期 YYYYMMDD
function getTodayString(date = new Date()) {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}${m}${d}`
}

exports.main = async (event) => {
  const { id } = event

  if (!id) {
    return { success: false, msg: '缺少数据ID' }
  }

  const todayStr = getTodayString()
  const prefix = `CK${todayStr}`

  try {
    // 查询当天已出库记录，找出最大编号
    const res = await db.collection('produce_log')
      .where({
        outboundNo: db.RegExp({ regexp: `^${prefix}` }) // 匹配当天所有出库编码
      })
      .orderBy('outboundNo', 'desc')
      .limit(1)
      .get()

    let nextSeq = 1

    if (res.data && res.data.length > 0) {
      // 取出最后3位数字，+1
      const lastNo = res.data[0].outboundNo
      const lastSeq = parseInt(lastNo.slice(-3), 10)
      nextSeq = lastSeq + 1
    }

    const seqStr = nextSeq.toString().padStart(3, '0')
    const outboundNo = `${prefix}${seqStr}`
    const outboundTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

    // 更新出库状态
    await db.collection('produce_log').doc(id).update({
      data: {
        status: 2,
        status_text: '已出库',
        out_stock_time: db.serverDate(),
        outboundNo: outboundNo,
        outbound_time: outboundTime
      }
    })

    console.log(`出库成功: ${outboundNo}`)
    return { success: true, outboundNo: outboundNo }
  } catch (err) {
    console.error('出库失败:', err)
    return { success: false, msg: err.message }
  }
}