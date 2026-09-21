const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

function getTodayString(date = new Date()) {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}${m}${d}`
}

exports.main = async (event, context) => {
  const { id, weight, action } = event

  if (!id) return { success: false, msg: '缺少数据ID' }

  // ===== 1. 首次称重 =====
  if (action === 'weigh') {
    if (!weight || isNaN(weight) || weight <= 0) {
      return { success: false, msg: '重量无效' }
    }

    // 生成入库编码：查询当天最大编号 +1
    const todayStr = getTodayString()
    const prefix = `RK${todayStr}`
    let nextSeq = 1

    try {
      const res = await db.collection('produce_log')
        .where({ inboundNo: db.RegExp({ regexp: `^${prefix}` }) })
        .orderBy('inboundNo', 'desc')
        .limit(1)
        .get()

      if (res.data && res.data.length > 0) {
        const lastSeq = parseInt(res.data[0].inboundNo.slice(-3), 10)
        nextSeq = lastSeq + 1
      }
    } catch (err) {
      console.error('查询最大入库编号失败:', err)
      return { success: false, msg: '生成入库编码失败' }
    }

    const seqStr = nextSeq.toString().padStart(3, '0')
    const inboundNo = `${prefix}${seqStr}`

    try {
      await db.collection('produce_log').doc(id).update({
        data: {
          weight: Number(weight),
          status: 1,
          weighTime: new Date(),
          inboundNo: inboundNo
        }
      })
      console.log(`称重成功，入库编码: ${inboundNo}`)
      return { success: true, msg: '称重成功', inboundNo: inboundNo }
    } catch (err) {
      console.error('称重更新失败:', err)
      return { success: false, msg: '称重失败，请重试' }
    }
  }

  // ===== 2. 修改重量 =====
  if (action === 'editWeight') {
    if (!weight || isNaN(weight) || weight <= 0) {
      return { success: false, msg: '重量无效' }
    }
    try {
      await db.collection('produce_log').doc(id).update({
        data: {
          weight: Number(weight),
          editTime: new Date()
        }
      })
      return { success: true, msg: '修改成功' }
    } catch (err) {
      console.error('修改重量失败:', err)
      return { success: false, msg: '修改失败，请重试' }
    }
  }

  // ===== 3. 出库 =====
  if (action === 'outbound') {
    try {
      const docRes = await db.collection('produce_log').doc(id).get()
      if (!docRes.data) return { success: false, msg: '记录不存在' }
      if (docRes.data.status !== 1) return { success: false, msg: '仅"已称重"状态可出库' }
    } catch (err) {
      return { success: false, msg: '查询记录失败' }
    }

    const todayStr = getTodayString()
    const prefix = `CK${todayStr}`
    let nextSeq = 1

    try {
      const res = await db.collection('produce_log')
        .where({ outboundNo: db.RegExp({ regexp: `^${prefix}` }) })
        .orderBy('outboundNo', 'desc')
        .limit(1)
        .get()

      if (res.data && res.data.length > 0) {
        const lastSeq = parseInt(res.data[0].outboundNo.slice(-3), 10)
        nextSeq = lastSeq + 1
      }
    } catch (err) {
      console.error('查询最大出库编号失败:', err)
      return { success: false, msg: '生成出库编码失败' }
    }

    const seqStr = nextSeq.toString().padStart(3, '0')
    const outboundNo = `${prefix}${seqStr}`
    const outboundTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

    try {
      await db.collection('produce_log').doc(id).update({
        data: {
          status: 2,
          outboundNo: outboundNo,
          outbound_time: outboundTime
        }
      })
      console.log(`出库成功: ${outboundNo}`)
      return { success: true, msg: '出库成功', outboundNo: outboundNo }
    } catch (err) {
      console.error('出库更新失败:', err)
      return { success: false, msg: '出库失败' }
    }
  }

  return { success: false, msg: '未知操作类型' }
}