const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const capacityMap = {
  '≤25L': '1', '25L': '1', '50L': '2', '200L': '3', '1000L': '4', '其他': '9'
}
const materialMap = {
  '金属': '1', '铁桶': '1', '塑料': '2', '塑料桶': '2',
  '复合材料': '3', '复合桶': '3', '其他材质': '4', '其他': '9'
}

exports.main = async (event) => {
  const { count, packageType, capacity, material, ...baseData } = event
  const batchData = []

  // 批次号：CS + 年月日 + 3位流水号
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const dateStr = `${year}${month}${day}`
  const prefix = `CS${dateStr}`

  let startSeq = 1
  try {
    const existRes = await db.collection('produce_log').where({
      batchNo: _.regex(`^${prefix}`)
    }).orderBy('create_time', 'desc').limit(1).get()

    if (existRes.data && existRes.data.length > 0) {
      const lastBatchNo = existRes.data[0].batchNo
      const lastSeq = parseInt(lastBatchNo.substring(prefix.length), 10)
      if (!isNaN(lastSeq)) {
        startSeq = lastSeq + 1
      }
    }
  } catch (e) {
    console.error('查询流水号失败:', e)
  }

  const volCode = capacityMap[capacity] || capacityMap[packageType] || '9'
  const matCode = materialMap[material] || materialMap[packageType] || '9'

  for (let i = 0; i < count; i++) {
    const currentSeq = startSeq + i
    const batchNo = `${prefix}${String(currentSeq).padStart(3, '0')}`
    const packageNo = batchNo
    const serialNum = `00${String(i + 1).padStart(3, '0')}`
    const containerCode = `${volCode}${matCode}${serialNum}`

    batchData.push({
      ...baseData,
      batchNo: batchNo,
      packageNo: packageNo,
      packageType: packageType || '铁桶',
      capacity: capacity || '≤25L',
      material: material || '金属',
      wasteName: baseData.wasteName || '未选择危废',
      wasteCode: baseData.wasteCode || '',
      containerCode: containerCode,
      produce_date_str: baseData.produceDate,
      status: 0,
      status_text: '待称重',
      create_time: db.serverDate()
    })
  }

  try {
    const res = await db.collection('produce_log').add({ data: batchData })
    return { success: true, ids: res._ids }
  } catch (err) {
    return { success: false, msg: err.message }
  }
}